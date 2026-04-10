import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAnthropicClient } from "@/lib/anthropic";
import { getTemplateBySlug } from "@/lib/eu-templates/template-definitions";

// ── Server-side Supabase client ───────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateSlug, orgId } = body as {
      templateSlug: string;
      orgId?: string;
    };

    if (!templateSlug) {
      return NextResponse.json(
        { error: "templateSlug is required" },
        { status: 400 }
      );
    }

    // ── 1. Look up template definition ────────────────────────────────────────
    const template = getTemplateBySlug(templateSlug);
    if (!template) {
      return NextResponse.json(
        { error: `Unknown template slug: ${templateSlug}` },
        { status: 404 }
      );
    }

    // ── 2. Fetch organisation (if provided) ───────────────────────────────────
    let orgName: string | null = null;

    if (orgId) {
      const { data: org, error: orgErr } = await supabase
        .from("organisations")
        .select("id, name, ods_code")
        .eq("id", orgId)
        .single();

      if (orgErr || !org) {
        return NextResponse.json(
          { error: "Organisation not found" },
          { status: 404 }
        );
      }
      orgName = org.name;
    }

    // ── 3. Resolve facts (org-instance → module → global) ────────────────────
    const resolved: Record<string, string> = {};

    // 3a. Global facts
    const { data: globalFacts } = await supabase
      .from("facts")
      .select("fact_key, current_value")
      .eq("tier", "global");

    for (const f of globalFacts ?? []) {
      resolved[f.fact_key] = f.current_value;
    }

    if (orgId) {
      // 3b. Active modules for org
      const { data: orgModules } = await supabase
        .from("org_modules")
        .select("module_id")
        .eq("org_id", orgId)
        .is("deactivated_at", null);

      const activeModuleIds = (orgModules ?? []).map(
        (om: { module_id: string }) => om.module_id
      );

      // 3c. Module facts (only for active modules)
      if (activeModuleIds.length > 0) {
        const { data: moduleFacts } = await supabase
          .from("facts")
          .select("fact_key, current_value")
          .eq("tier", "module")
          .in("module_id", activeModuleIds);

        for (const f of moduleFacts ?? []) {
          resolved[f.fact_key] = f.current_value;
        }
      }

      // 3d. Org-instance overrides
      const { data: orgFacts } = await supabase
        .from("org_facts")
        .select("value, facts(fact_key)")
        .eq("org_id", orgId);

      for (const of_ of (orgFacts ?? []) as Array<{
        value: string;
        facts: { fact_key: string } | null;
      }>) {
        const rawKey = of_.facts?.fact_key ?? "";
        if (!rawKey) continue;
        // Strip org-specific suffix: data.retention_period.bhft → data.retention_period
        const parts = rawKey.split(".");
        const baseKey =
          parts.length > 2 ? parts.slice(0, -1).join(".") : rawKey;
        resolved[baseKey] = of_.value;
      }

      // Add org variables
      if (orgName) resolved["organisation.name"] = orgName;
    }

    // ── 4. Build facts context string ─────────────────────────────────────────
    const factsContext = Object.entries(resolved)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    // ── 5. Build numbered questions list ──────────────────────────────────────
    const numberedQuestions = template.questions
      .map((q, i) => `${i}. ${q}`)
      .join("\n");

    // ── 6. Call Claude ────────────────────────────────────────────────────────
    const client = getAnthropicClient();

    const promptText = `You are a regulatory affairs specialist helping Anathem, a UK medical device company, prepare their EU MDR Technical File.

DOCUMENT: ${template.title}
PURPOSE: ${template.purpose}
${orgName ? `ORGANISATION: ${orgName}` : ""}

KNOWN FACTS ABOUT ANATHEM:
${factsContext || "(No facts loaded — use general regulatory best practice for a UK SaMD company)"}

YOUR TASK:
Answer every question below for this EU MDR document. Each answer must be:
- Substantive regulatory-quality prose (150–400 words per answer)
- Written as if you are drafting the actual document section
- Specific to Anathem's ambient voice technology for NHS clinical documentation
- Compliant with EU MDR 2017/745 requirements
- Referenced to specific Anathem facts where available

QUESTIONS:
${numberedQuestions}

Respond with ONLY a JSON object where each key is the question index (as a string: "0", "1", "2", …) and each value is the full prose answer for that question. Do not include any text outside the JSON object.

Example format:
{
  "0": "Full answer to question 0...",
  "1": "Full answer to question 1...",
  "2": "Full answer to question 2..."
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [{ role: "user", content: promptText }],
    });

    const rawOutput =
      message.content[0].type === "text" ? message.content[0].text : "{}";

    // Extract JSON (Claude sometimes wraps in markdown code fences)
    const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Claude did not return valid JSON", raw: rawOutput.slice(0, 500) },
        { status: 502 }
      );
    }

    let answers: Record<string, string>;
    try {
      answers = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse Claude JSON response", raw: jsonMatch[0].slice(0, 500) },
        { status: 502 }
      );
    }

    // ── 7. Create eu_document_instances row ───────────────────────────────────
    const instanceId = generateId();
    const now = new Date().toISOString();

    const { error: insertInstanceErr } = await supabase
      .from("eu_document_instances")
      .insert({
        id: instanceId,
        template_slug: template.slug,
        template_title: template.title,
        category: template.category,
        org_id: orgId ?? null,
        status: "draft",
        generated_at: now,
        created_at: now,
        updated_at: now,
      });

    if (insertInstanceErr) {
      return NextResponse.json(
        { error: "Failed to create document instance", detail: insertInstanceErr.message },
        { status: 500 }
      );
    }

    // ── 8. Create eu_document_sections rows ───────────────────────────────────
    const sections = template.questions.map((question, i) => ({
      id: generateId(),
      instance_id: instanceId,
      question_text: question,
      answer: answers[String(i)] ?? null,
      status: "draft",
      fact_keys_used: Object.keys(resolved),
      generated_at: now,
      sort_order: i,
    }));

    const { error: insertSectionsErr } = await supabase
      .from("eu_document_sections")
      .insert(sections);

    if (insertSectionsErr) {
      return NextResponse.json(
        { error: "Failed to create document sections", detail: insertSectionsErr.message },
        { status: 500 }
      );
    }

    // ── 9. Log to audit_events ───────────────────────────────────────────────
    await supabase.from("audit_events").insert({
      id: generateId(),
      type: "eu_template.generated",
      category: "generation",
      actor: "system",
      actor_role: "admin",
      timestamp: now,
      summary: `Generated EU MDR document "${template.title}"${orgName ? ` for ${orgName}` : ""}`,
      detail: {
        template_slug: template.slug,
        template_title: template.title,
        instance_id: instanceId,
        org_id: orgId ?? null,
        section_count: sections.length,
        model: "claude-sonnet-4-20250514",
      },
      related_id: instanceId,
      related_type: "eu_document_instance",
    });

    // ── 10. Return result ─────────────────────────────────────────────────────
    return NextResponse.json({
      instanceId,
      templateSlug: template.slug,
      sectionCount: sections.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Internal server error", detail: message },
      { status: 500 }
    );
  }
}
