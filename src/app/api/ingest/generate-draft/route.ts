import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { questionId, orgId } = await req.json();

    if (!questionId) {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 });
    }

    // ── 1. Fetch the question ──────────────────────────────────────────
    const { data: question, error: qErr } = await supabase
      .from("ingestion_question_mappings")
      .select("*")
      .eq("id", questionId)
      .single();

    if (qErr || !question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const matchedKeys: string[] = question.matched_fact_keys ?? [];

    // ── 2. Resolve fact values for matched keys ────────────────────────
    // Fetch global + module facts by key
    const { data: facts } = matchedKeys.length > 0
      ? await supabase
          .from("facts")
          .select("fact_key, current_value, tier, domain")
          .in("fact_key", matchedKeys)
      : { data: [] };

    // Start with global/module facts
    const resolved: Record<string, string> = {};
    for (const f of facts ?? []) {
      resolved[f.fact_key] = f.current_value ?? "";
    }

    // If orgId provided, apply org-instance overrides for matched keys
    if (orgId) {
      const { data: orgFacts } = await supabase
        .from("org_facts")
        .select("value, facts(fact_key)")
        .eq("org_id", orgId);

      for (const of_ of (orgFacts ?? []) as any[]) {
        const key: string = of_.facts?.fact_key ?? "";
        if (key && matchedKeys.some((mk) => key.startsWith(mk) || mk.startsWith(key))) {
          const parts = key.split(".");
          const baseKey = parts.length > 2 ? parts.slice(0, -1).join(".") : key;
          if (resolved[baseKey] !== undefined || matchedKeys.includes(baseKey)) {
            resolved[baseKey] = of_.value;
          }
        }
      }

      // Fetch org name for context
      const { data: org } = await supabase
        .from("organisations")
        .select("name, ods_code")
        .eq("id", orgId)
        .single();

      if (org) {
        resolved["organisation.name"] = org.name;
        resolved["organisation.ods_code"] = org.ods_code;
      }
    }

    // ── 3. If no matched facts found, fetch a broad set ───────────────
    // Give Claude some context even when specific keys weren't matched
    let allFactsContext = "";
    if (Object.keys(resolved).length === 0) {
      const { data: globalFacts } = await supabase
        .from("facts")
        .select("fact_key, current_value")
        .eq("tier", "global")
        .limit(30);

      allFactsContext = (globalFacts ?? [])
        .map((f) => `${f.fact_key}: ${(f.current_value ?? "").slice(0, 150)}`)
        .join("\n");
    }

    // ── 4. Build the facts context string ─────────────────────────────
    const factsContext = Object.keys(resolved).length > 0
      ? Object.entries(resolved)
          .map(([k, v]) => `${k}: ${(v ?? "").slice(0, 300)}`)
          .join("\n")
      : allFactsContext;

    // ── 5. Call Claude to draft the answer ────────────────────────────
    const client = getAnthropicClient();

    const prompt = `You are a compliance writer for Anathem, a regulated medical device company building ambient voice technology (AVT) for NHS clinical documentation.

You must draft a concise, professional answer to the following compliance question from an NHS trust or regulatory body.

Use ONLY the fact values provided below — do not invent information. If a fact needed to answer the question is missing, note that it requires manual completion with placeholder text like [TO BE CONFIRMED].

Write in plain English, suitable for inclusion in a formal NHS document. Be factual and specific.

AVAILABLE FACTS:
${factsContext || "(No specific facts matched — use general knowledge about Anathem's AVT product for NHS clinical documentation)"}

QUESTION TO ANSWER:
${question.question_text}

Write the draft answer now (2–5 sentences, no preamble):`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const draft = message.content[0].type === "text" ? message.content[0].text.trim() : "";

    // ── 6. Update question status to "drafted" in DB ──────────────────
    await supabase
      .from("ingestion_question_mappings")
      .update({ status: "drafted" })
      .eq("id", questionId);

    // ── 7. Audit log ──────────────────────────────────────────────────
    await supabase.from("audit_log").insert({
      event_type: "ingestion.draft_generated",
      actor_id: null,
      payload: {
        category: "ingestion",
        summary: `Draft generated for ingestion question — ${question.question_text.slice(0, 80)}`,
        ingestion_question_id: questionId,
        ingestion_job_id: question.ingestion_job_id,
        org_id: orgId ?? null,
        matched_fact_count: Object.keys(resolved).length,
        draft_chars: draft.length,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      draft,
      resolvedFacts: resolved,
    });
  } catch (err: any) {
    console.error("[/api/ingest/generate-draft]", err);
    return NextResponse.json(
      { error: err.message ?? "Draft generation failed" },
      { status: 500 }
    );
  }
}
