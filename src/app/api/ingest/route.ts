import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { createClient } from "@supabase/supabase-js";
import mammoth from "mammoth";

export const config = {
  api: { bodyParser: false },
};

// Increase max duration for large document processing
export const maxDuration = 120; // seconds

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const jobId = crypto.randomUUID();

  try {
    // ── 1. Parse multipart form ────────────────────────────────────────
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const orgId = (formData.get("orgId") as string | null) || null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name;
    const fileExt = fileName.split(".").pop()?.toLowerCase();

    if (!["pdf", "doc", "docx"].includes(fileExt ?? "")) {
      return NextResponse.json(
        { error: "Only PDF and DOCX files are supported" },
        { status: 400 }
      );
    }

    // ── 2. Create ingestion job row (status: processing) ───────────────
    const { error: jobErr } = await supabase.from("ingestion_jobs").insert({
      id: jobId,
      file_name: fileName,
      file_path: fileName, // used as document type label in current schema
      org_id: orgId,
      status: "processing",
      uploaded_by: "admin", // TODO: replace with authenticated user id
    });

    if (jobErr) {
      console.error("[/api/ingest] Failed to create job:", jobErr);
      return NextResponse.json(
        { error: "Failed to create ingestion job" },
        { status: 500 }
      );
    }

    // ── 3. Extract text from the document ─────────────────────────────
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const client = getAnthropicClient();
    let documentText = "";

    if (fileExt === "pdf") {
      // Use Claude's native PDF document support
      const base64 = fileBuffer.toString("base64");
      const extractMsg = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: base64,
                },
              } as any,
              {
                type: "text",
                text: "Extract and return all the text from this document verbatim. Return only the text content, no commentary.",
              },
            ],
          },
        ],
      });
      documentText =
        extractMsg.content[0].type === "text"
          ? extractMsg.content[0].text
          : "";
    } else {
      // DOCX / DOC — use mammoth to extract plain text
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      documentText = result.value;
    }

    if (!documentText.trim()) {
      await supabase
        .from("ingestion_jobs")
        .update({ status: "failed", error_message: "Could not extract text from document" })
        .eq("id", jobId);
      return NextResponse.json(
        { error: "Could not extract text from document" },
        { status: 422 }
      );
    }

    // ── 4. Fetch available fact keys for mapping hints ─────────────────
    const { data: facts } = await supabase
      .from("facts")
      .select("fact_key, current_value, tier, domain")
      .order("fact_key");

    const factList = (facts ?? [])
      .map(
        (f) =>
          `${f.fact_key} [${f.tier}${f.domain ? `, ${f.domain}` : ""}]: ${
            (f.current_value ?? "").slice(0, 80)
          }`
      )
      .join("\n");

    // ── 5. Call Claude to extract compliance questions ─────────────────
    const extractionPrompt = `You are a compliance analyst for Anathem, a regulated medical device company building ambient voice technology (AVT) for NHS clinical documentation.

A document has been uploaded from an NHS trust or regulatory body. Your task is to:
1. Identify every distinct compliance question, requirement, data request, or attestation in the document that Anathem would need to respond to.
2. For each question, identify which fact keys from our knowledge base are most relevant to answering it.

Focus on:
- Questions asking about the medical device's functionality, safety, or clinical evidence
- Data processing, IG, and GDPR-related questions
- Clinical safety questions (DCB0129, DCB0160)
- Information about the company, team, or support processes
- Specific technical or configuration questions

AVAILABLE FACT KEYS IN OUR KNOWLEDGE BASE:
${factList || "(No facts in knowledge base yet)"}

Return ONLY a JSON array with this exact structure (no markdown, no explanation):
[
  {
    "question_text": "Full text of the question or requirement",
    "matched_fact_keys": ["fact.key1", "fact.key2"]
  }
]

DOCUMENT TEXT:
${documentText.slice(0, 8000)}${documentText.length > 8000 ? "\n\n[Document truncated — first 8000 characters shown]" : ""}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: extractionPrompt }],
    });

    const rawOutput =
      message.content[0].type === "text" ? message.content[0].text : "[]";

    // ── 6. Parse Claude's JSON response ───────────────────────────────
    let questions: Array<{
      question_text: string;
      matched_fact_keys: string[];
    }> = [];

    try {
      // Extract JSON array even if there's surrounding text
      const jsonMatch = rawOutput.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          questions = parsed
            .filter((q) => q && typeof q.question_text === "string")
            .map((q) => ({
              question_text: q.question_text,
              matched_fact_keys: Array.isArray(q.matched_fact_keys)
                ? q.matched_fact_keys.filter((k: any) => typeof k === "string")
                : [],
            }));
        }
      }
    } catch (parseErr) {
      console.error("[/api/ingest] Failed to parse Claude response:", parseErr);
      // Fall back to a single placeholder question
      questions = [
        {
          question_text:
            "Could not automatically parse questions from this document. Please review manually.",
          matched_fact_keys: [],
        },
      ];
    }

    // ── 7. Insert question mappings ────────────────────────────────────
    if (questions.length > 0) {
      const mappings = questions.map((q, _i) => ({
        id: crypto.randomUUID(),
        ingestion_job_id: jobId,
        question_text: q.question_text,
        status: "pending" as const,
        matched_fact_keys: q.matched_fact_keys,
        prompt_id: null,
      }));

      const { error: mappingErr } = await supabase
        .from("ingestion_question_mappings")
        .insert(mappings);

      if (mappingErr) {
        console.error("[/api/ingest] Failed to insert mappings:", mappingErr);
      }
    }

    // ── 8. Update job to "review" status ──────────────────────────────
    await supabase
      .from("ingestion_jobs")
      .update({ status: "review" })
      .eq("id", jobId);

    // ── 9. Audit log ───────────────────────────────────────────────────
    await supabase.from("audit_log").insert({
      event_type: "ingestion.completed",
      actor_id: null,
      payload: {
        category: "ingestion",
        summary: `Ingestion completed — ${fileName} — ${questions.length} question${questions.length !== 1 ? "s" : ""} extracted`,
        ingestion_job_id: jobId,
        file_name: fileName,
        org_id: orgId,
        question_count: questions.length,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ jobId, questionCount: questions.length });
  } catch (err: any) {
    console.error("[/api/ingest]", err);

    // Mark job as failed if it was created
    try {
      await supabase
        .from("ingestion_jobs")
        .update({
          status: "failed",
          error_message: err.message ?? "Unknown error",
        })
        .eq("id", jobId);
    } catch {
      // ignore
    }

    return NextResponse.json(
      { error: err.message ?? "Ingestion failed" },
      { status: 500 }
    );
  }
}
