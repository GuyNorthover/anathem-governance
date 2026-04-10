import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 120;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface QuestionItem {
  fact_key: string;
  display_name: string;   // the question
  current_value: string;  // existing answer (may be empty)
  description: string;    // section
  domain: string;
  tier: string;
  module: null;
}

export type FillStatus = "filled" | "partial" | "empty";

export interface FilledItem extends QuestionItem {
  fillStatus: FillStatus;
  usedFacts: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json() as { items: QuestionItem[] };

    if (!items?.length) {
      return NextResponse.json({ error: "items are required" }, { status: 400 });
    }

    // ── 1. Load all KB facts ───────────────────────────────────────────
    const { data: kbFacts, error: kbErr } = await supabase
      .from("facts")
      .select("fact_key, display_name, current_value, description, domain")
      .order("fact_key");

    if (kbErr) {
      return NextResponse.json({ error: kbErr.message }, { status: 500 });
    }

    const facts = (kbFacts ?? []).filter((f: any) => f.current_value?.trim());

    if (facts.length === 0) {
      // No KB facts at all — return items as-is with empty status
      const result: FilledItem[] = items.map((item) => ({
        ...item,
        fillStatus: item.current_value?.trim() ? "partial" : "empty",
        usedFacts: [],
      }));
      return NextResponse.json({ items: result });
    }

    // ── 2. Build KB context (condensed, capped at ~12k chars) ─────────
    const factLines = facts.map((f: any) =>
      `[${f.fact_key}] ${f.display_name}: ${String(f.current_value).slice(0, 400)}`
    );
    let kbContext = factLines.join("\n");
    if (kbContext.length > 12000) {
      kbContext = kbContext.slice(0, 12000) + "\n... (additional facts omitted)";
    }

    // ── 3. Build questions list ────────────────────────────────────────
    const questionList = items.map((item, idx) => ({
      index: idx,
      question: item.display_name,
      section: item.description,
      existing_answer: item.current_value?.trim() || null,
    }));

    const prompt = `You are helping fill in an Anathem governance document using the company's knowledge base.

KNOWLEDGE BASE FACTS (format: [fact_key] Question/Label: Answer):
${kbContext}

TASK:
For each question below, search the knowledge base facts and compose a complete, accurate answer.

Rules:
- Use ONLY information explicitly present in the knowledge base facts above
- Combine multiple related facts if needed to form a comprehensive answer
- If an existing_answer is already provided, use it (return it unchanged, mark confidence "high")
- If you cannot find relevant facts, return null for the answer
- "confidence": "high" = clear direct match, "partial" = some relevant info but incomplete, "none" = no relevant facts found
- Keep answers factual and concise — do not invent or infer information not in the facts

QUESTIONS:
${JSON.stringify(questionList, null, 2)}

Return ONLY a JSON array (no markdown), one object per question, in the same order:
[
  {
    "index": 0,
    "answer": "The full answer text, or null if no relevant facts",
    "confidence": "high" | "partial" | "none",
    "used_facts": ["fact_key_1", "fact_key_2"]
  }
]`;

    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    });

    const rawOutput = message.content[0].type === "text" ? message.content[0].text : "[]";

    // ── 4. Parse response ──────────────────────────────────────────────
    let fillResults: { index: number; answer: string | null; confidence: string; used_facts: string[] }[] = [];
    try {
      const jsonMatch = rawOutput.match(/\[[\s\S]*\]/);
      fillResults = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      // If parsing fails, return items as-is
      const result: FilledItem[] = items.map((item) => ({
        ...item,
        fillStatus: item.current_value?.trim() ? "partial" : "empty",
        usedFacts: [],
      }));
      return NextResponse.json({ items: result });
    }

    // ── 5. Merge fill results back into items ─────────────────────────
    const resultMap = new Map(fillResults.map((r) => [r.index, r]));

    const filledItems: FilledItem[] = items.map((item, idx) => {
      const fill = resultMap.get(idx);
      const existingAnswer = item.current_value?.trim();

      if (!fill || fill.confidence === "none" || !fill.answer) {
        return {
          ...item,
          fillStatus: existingAnswer ? "partial" : "empty",
          usedFacts: [],
        };
      }

      const newAnswer = fill.answer.trim();
      const status: FillStatus =
        fill.confidence === "high" ? "filled"
        : fill.confidence === "partial" ? "partial"
        : "empty";

      return {
        ...item,
        current_value: newAnswer,
        fillStatus: status,
        usedFacts: fill.used_facts ?? [],
      };
    });

    return NextResponse.json({ items: filledItems });
  } catch (err: any) {
    console.error("[/api/source-docs/auto-fill]", err);
    return NextResponse.json({ error: err.message ?? "Auto-fill failed" }, { status: 500 });
  }
}
