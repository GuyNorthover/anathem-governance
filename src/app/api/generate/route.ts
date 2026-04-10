import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { createClient } from "@supabase/supabase-js";

// Use service-side supabase client (server component — not browser)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { documentInstanceId, promptId, orgId, sectionName } = await req.json();

    if (!promptId || !orgId) {
      return NextResponse.json({ error: "promptId and orgId are required" }, { status: 400 });
    }

    // ── 1. Fetch org ───────────────────────────────────────────────
    const { data: org, error: orgErr } = await supabase
      .from("organisations")
      .select("id, name, ods_code")
      .eq("id", orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
    }

    // ── 2. Fetch active modules for org ────────────────────────────
    const { data: orgModules } = await supabase
      .from("org_modules")
      .select("module_id, modules(module_key, display_name)")
      .eq("org_id", orgId)
      .is("deactivated_at", null);

    const activeModuleIds = (orgModules ?? []).map((om: any) => om.module_id);
    const activeModuleKeys = (orgModules ?? [])
      .map((om: any) => om.modules?.display_name)
      .filter(Boolean);

    // ── 3. Global facts ────────────────────────────────────────────
    const { data: globalFacts } = await supabase
      .from("facts")
      .select("fact_key, current_value")
      .eq("tier", "global");

    // ── 4. Module facts (only for org's active modules) ────────────
    const { data: moduleFacts } =
      activeModuleIds.length > 0
        ? await supabase
            .from("facts")
            .select("fact_key, current_value")
            .eq("tier", "module")
            .in("module_id", activeModuleIds)
        : { data: [] };

    // ── 5. Org-instance overrides ──────────────────────────────────
    const { data: orgFacts } = await supabase
      .from("org_facts")
      .select("value, facts(fact_key)")
      .eq("org_id", orgId);

    // ── 6. Resolve: global → module → org-instance ─────────────────
    const resolved: Record<string, string> = {};

    for (const f of globalFacts ?? []) {
      resolved[f.fact_key] = f.current_value;
    }
    for (const f of moduleFacts ?? []) {
      resolved[f.fact_key] = f.current_value;
    }
    for (const of_ of (orgFacts ?? []) as any[]) {
      const rawKey: string = of_.facts?.fact_key ?? "";
      if (!rawKey) continue;
      // Strip org-specific suffix: data.retention_period.bhft → data.retention_period
      const parts = rawKey.split(".");
      const baseKey = parts.length > 2 ? parts.slice(0, -1).join(".") : rawKey;
      resolved[baseKey] = of_.value;
    }

    // Organisation variables
    resolved["organisation.name"] = org.name;
    resolved["organisation.ods_code"] = org.ods_code;
    resolved["organisation.active_modules"] =
      activeModuleKeys.length > 0 ? activeModuleKeys.join(", ") : "None";

    // ── 7. Fetch prompt + latest version ───────────────────────────
    const { data: prompt } = await supabase
      .from("prompts")
      .select("id, prompt_key, display_name")
      .eq("id", promptId)
      .single();

    const { data: promptVersion } = await supabase
      .from("prompt_versions")
      .select("id, version_number, prompt_text")
      .eq("prompt_id", promptId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    if (!promptVersion) {
      return NextResponse.json({ error: "No prompt version found for this prompt" }, { status: 404 });
    }

    // ── 8. Interpolate {{placeholders}} ────────────────────────────
    const interpolated = promptVersion.prompt_text.replace(
      /\{\{([^}]+)\}\}/g,
      (_: string, key: string) => {
        const v = resolved[key.trim()];
        return v !== undefined ? v : `[${key.trim()} — not found]`;
      }
    );

    // ── 9. Call Claude ─────────────────────────────────────────────
    const client = getAnthropicClient();

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: interpolated }],
    });

    const output =
      message.content[0].type === "text" ? message.content[0].text : "";

    // ── 10. Log to audit_log ───────────────────────────────────────
    await supabase.from("audit_log").insert({
      event_type: "generation.completed",
      payload: {
        category: "generation",
        summary: `Generated section "${sectionName ?? "Section"}" using prompt ${prompt?.prompt_key} v${promptVersion.version_number}`,
        document_instance_id: documentInstanceId ?? null,
        prompt_id: promptId,
        prompt_key: prompt?.prompt_key,
        prompt_version: promptVersion.version_number,
        org_id: orgId,
        section: sectionName ?? "Section",
        output_chars: output.length,
      },
    });

    return NextResponse.json({
      output,
      promptVersionId: promptVersion.id,
      promptVersionNumber: promptVersion.version_number,
      resolvedFacts: resolved,
      interpolatedPrompt: interpolated,
    });
  } catch (err: any) {
    console.error("[/api/generate]", err);
    return NextResponse.json(
      { error: err.message ?? "Generation failed" },
      { status: 500 }
    );
  }
}
