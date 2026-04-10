import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAnthropicClient } from "@/lib/anthropic";

export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ─────────────────────────────────────────────────────────────────────

type StepType = "action" | "decision" | "milestone" | "submission" | "approval";
type Confidence = "high" | "medium" | "low";

interface ExtractedStep {
  step_number: number;
  title: string;
  description: string;
  step_type: StepType;
  is_mandatory: boolean;
  estimated_duration: string;
  regulatory_reference: string;
  dependencies: number[];
  confidence: Confidence;
}

interface ExtractionResult {
  pathway_name: string;
  pathway_description: string;
  jurisdiction: string;
  pathway_type: string;
  steps: ExtractedStep[];
}

// ── Prompts ───────────────────────────────────────────────────────────────────

const INITIAL_EXTRACTION_PROMPT = `You are a regulatory affairs specialist extracting governance pathway steps from official documents.

Your task: identify every discrete governance or regulatory step described in the document and return them as structured JSON.

RULES:
1. Be CONSERVATIVE — only include steps explicitly described or required by the document. Do not infer, invent, or add steps that are not mentioned.
2. Preserve the original language where possible in titles and descriptions.
3. step_type: "action" (something the organisation must do), "decision" (a go/no-go gate), "milestone" (a defined checkpoint), "submission" (a formal submission to a body), "approval" (an approval received from a body).
4. is_mandatory: true unless the document explicitly marks a step as optional or recommended only.
5. dependencies: array of step_number integers that must be completed before this step. Use [] if none.
6. confidence: "high" if explicitly described, "medium" if implied but reasonably certain, "low" if uncertain.
7. regulatory_reference: specific clause, article, or section (e.g. "MDR Article 62"). Empty string if none.
8. estimated_duration: only if the document specifies a timeframe. Empty string if not mentioned.

Return ONLY valid JSON — no markdown fences, no explanation:
{
  "pathway_name": "...",
  "pathway_description": "...",
  "jurisdiction": "...",
  "pathway_type": "regulatory_approval",
  "steps": [
    {
      "step_number": 1,
      "title": "...",
      "description": "...",
      "step_type": "action",
      "is_mandatory": true,
      "estimated_duration": "",
      "regulatory_reference": "",
      "dependencies": [],
      "confidence": "high"
    }
  ]
}`;

/**
 * Merge prompt: given existing steps + new document section, return the
 * complete updated step list. New steps get step_numbers continuing from the
 * last existing step_number. Existing steps may have their descriptions or
 * references enriched by the new content.
 */
function buildMergePrompt(existingSteps: ExtractedStep[]): string {
  return `You are a regulatory affairs specialist updating a governance pathway with additional document content.

You have been given:
1. EXISTING PATHWAY STEPS (extracted from previous documents/sections)
2. NEW DOCUMENT CONTENT that may add, clarify, or modify the pathway

Your task — review the new content and:
a) ADD any steps that are NOT already captured. New steps get step_numbers continuing from ${existingSteps.length > 0 ? Math.max(...existingSteps.map((s) => s.step_number)) : 0}.
b) UPDATE descriptions/references of existing steps if the new content provides significant additional detail.
c) Do NOT remove existing steps unless the new content explicitly supersedes them.
d) Do NOT invent steps not described in either source.

Return the COMPLETE step list (all existing steps plus any new ones) as valid JSON — no markdown fences, no explanation:
{
  "pathway_name": "...",
  "pathway_description": "...",
  "jurisdiction": "...",
  "pathway_type": "...",
  "steps": [ ...complete list... ]
}

EXISTING STEPS:
${JSON.stringify(existingSteps, null, 2)}`;
}

// ── Chunking ──────────────────────────────────────────────────────────────────

/**
 * Split text into chunks of approximately CHUNK_SIZE characters, preferring
 * to break on paragraph boundaries.
 */
const CHUNK_SIZE = 55_000;

function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);

    // Try to break on a paragraph boundary rather than mid-sentence
    if (end < text.length) {
      const lastParagraph = text.lastIndexOf("\n\n", end);
      const lastNewline   = text.lastIndexOf("\n",   end);
      const breakAt = lastParagraph > start + CHUNK_SIZE * 0.5
        ? lastParagraph
        : lastNewline > start + CHUNK_SIZE * 0.5
          ? lastNewline
          : end;
      end = breakAt;
    }

    chunks.push(text.slice(start, end).trim());
    start = end;
  }

  return chunks.filter((c) => c.length > 200);
}

// ── Normalisation ─────────────────────────────────────────────────────────────

const VALID_STEP_TYPES: StepType[] = ["action", "decision", "milestone", "submission", "approval"];
const VALID_CONFIDENCE: Confidence[] = ["high", "medium", "low"];

function normaliseSteps(raw: any[], offset = 0): ExtractedStep[] {
  return (Array.isArray(raw) ? raw : []).map((s: any, i: number) => ({
    step_number:          typeof s.step_number === "number" ? s.step_number : i + 1 + offset,
    title:                String(s.title ?? "").trim() || `Step ${i + 1 + offset}`,
    description:          String(s.description ?? "").trim(),
    step_type:            VALID_STEP_TYPES.includes(s.step_type) ? s.step_type as StepType : "action",
    is_mandatory:         s.is_mandatory !== false,
    estimated_duration:   String(s.estimated_duration ?? "").trim(),
    regulatory_reference: String(s.regulatory_reference ?? "").trim(),
    dependencies:         Array.isArray(s.dependencies)
                            ? s.dependencies.filter((d: any) => typeof d === "number")
                            : [],
    confidence:           VALID_CONFIDENCE.includes(s.confidence) ? s.confidence as Confidence : "medium",
  }));
}

function parseExtractionResponse(raw: string): ExtractionResult | null {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch {
    return null;
  }
}

// ── Claude call ───────────────────────────────────────────────────────────────

async function callClaude(systemPrompt: string, userContent: string): Promise<string> {
  const client = getAnthropicClient();
  const stream = client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });
  const message = await stream.finalMessage();
  return message.content[0].type === "text" ? message.content[0].text : "{}";
}

// ── Document fetching ─────────────────────────────────────────────────────────

type DocResult =
  | { text: string; title: string; error?: never }
  | { text?: never; title?: never; error: string };

async function fetchDocumentText(documentId: string): Promise<DocResult> {
  // Check the document exists
  const { data: job } = await supabase
    .from("ingestion_jobs")
    .select("id, file_name, file_path")
    .eq("id", documentId)
    .maybeSingle();

  if (!job) {
    // Try document_instances
    const { data: docInstance, error: docErr } = await supabase
      .from("document_instances")
      .select("id")
      .eq("id", documentId)
      .single();

    if (docErr || !docInstance) {
      return { error: `Document ${documentId} not found.` };
    }

    // Pull document sections
    const { data: sections } = await supabase
      .from("document_sections")
      .select("title, content")
      .eq("document_instance_id", documentId)
      .order("order_index");

    if (sections && sections.length > 0) {
      const text = sections.map((s: any) => `## ${s.title}\n\n${s.content}`).join("\n\n");
      return { text, title: `Document ${documentId.slice(0, 8)}` };
    }

    return { error: `No content found for document ${documentId}.` };
  }

  // Pull facts linked to this ingestion job
  const { data: facts } = await supabase
    .from("facts")
    .select("display_name, current_value, description")
    .like("fact_key", `${job.file_path}.%`)
    .neq("current_value", "");

  if (facts && facts.length > 0) {
    const text = facts
      .map((f: any) =>
        `${f.description ? `[${f.description}] ` : ""}${f.display_name}: ${f.current_value}`
      )
      .join("\n\n");
    return { text, title: job.file_name };
  }

  return { error: `No extractable content found for document "${job.file_name}". Ensure it has been fully processed.` };
}

async function fetchUrlText(
  url: string
): Promise<{ text: string; error?: never } | { text?: never; error: string }> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AnathemGovernanceBot/1.0)",
        Accept: "text/html,text/plain,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch (err: any) {
    return { error: `Could not reach the URL: ${err.message ?? "network error"}.` };
  }

  if (!response.ok) {
    return { error: `The URL returned HTTP ${response.status}.` };
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/pdf") || url.toLowerCase().endsWith(".pdf")) {
    return { error: "PDF URLs are not supported — please download and upload the PDF as a document." };
  }

  const raw = await response.text();
  const text = raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();

  if (text.length < 500) {
    return { error: "The page returned too little readable text. The site may require JavaScript or block automated access." };
  }

  return { text };
}

// ── Core extraction pipeline ──────────────────────────────────────────────────

/**
 * Process a single block of text against the current accumulated steps.
 * If accumulatedSteps is empty, uses the initial extraction prompt.
 * Otherwise uses the merge prompt.
 */
async function processChunk(
  chunkText: string,
  accumulatedSteps: ExtractedStep[],
  chunkLabel: string
): Promise<ExtractionResult | null> {
  const isFirstChunk = accumulatedSteps.length === 0;

  const systemPrompt = isFirstChunk
    ? INITIAL_EXTRACTION_PROMPT
    : buildMergePrompt(accumulatedSteps);

  const userContent = isFirstChunk
    ? `Extract the governance pathway steps from this document content:\n\n---\n\n${chunkText}`
    : `Extend the pathway with content from ${chunkLabel}:\n\n---\n\n${chunkText}`;

  const raw = await callClaude(systemPrompt, userContent);
  return parseExtractionResponse(raw);
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      document_ids?: string[];   // preferred: multiple documents
      document_id?: string;      // legacy: single document
      url?: string;
      pathway_name?: string;
      jurisdiction?: string;
      pathway_type?: string;
      organisation_id?: string;
    };

    const {
      document_ids,
      document_id,
      url,
      pathway_name,
      jurisdiction,
      pathway_type,
      organisation_id,
    } = body;

    // Normalise to an array of sources
    const docIds: string[] = document_ids
      ? document_ids.filter(Boolean)
      : document_id
        ? [document_id]
        : [];

    if (docIds.length === 0 && !url) {
      return NextResponse.json(
        { error: "Provide at least one document_id or a URL." },
        { status: 400 }
      );
    }

    // Enforce reasonable maximum to protect against timeout
    if (docIds.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 documents per extraction. Split into batches if you need more." },
        { status: 400 }
      );
    }

    // ── 1. Collect all text sources ──────────────────────────────────────────
    interface Source {
      label: string;
      text: string;
      docId: string | null;
    }

    const sources: Source[] = [];

    if (url) {
      const result = await fetchUrlText(url);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 422 });
      }
      sources.push({ label: "web page", text: result.text!, docId: null });
    }

    for (const id of docIds) {
      const result = await fetchDocumentText(id);
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 422 }
        );
      }
      sources.push({ label: result.title!, text: result.text!, docId: id });
    }

    // ── 2. Sequential extraction with chunking ───────────────────────────────
    let accumulatedSteps: ExtractedStep[] = [];
    let pathwayMeta: Omit<ExtractionResult, "steps"> = {
      pathway_name:        pathway_name ?? "Extracted Pathway",
      pathway_description: "",
      jurisdiction:        jurisdiction ?? "UK",
      pathway_type:        pathway_type ?? "regulatory_approval",
    };

    let totalChunksProcessed = 0;

    for (const source of sources) {
      const chunks = chunkText(source.text);

      for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
        const chunk = chunks[chunkIdx];
        const chunkLabel = chunks.length > 1
          ? `"${source.label}" (part ${chunkIdx + 1} of ${chunks.length})`
          : `"${source.label}"`;

        const result = await processChunk(chunk, accumulatedSteps, chunkLabel);

        if (result) {
          // On first successful extraction, capture pathway-level metadata
          if (totalChunksProcessed === 0) {
            pathwayMeta = {
              pathway_name:        pathway_name ?? result.pathway_name ?? pathwayMeta.pathway_name,
              pathway_description: result.pathway_description ?? "",
              jurisdiction:        jurisdiction ?? result.jurisdiction ?? "UK",
              pathway_type:        pathway_type ?? result.pathway_type ?? "regulatory_approval",
            };
          }

          // Accumulate normalised steps from this pass
          const newSteps = normaliseSteps(result.steps ?? []);
          if (newSteps.length > 0) {
            accumulatedSteps = newSteps;
          }
        }

        totalChunksProcessed++;
      }
    }

    if (accumulatedSteps.length === 0) {
      return NextResponse.json(
        { error: "No governance steps could be identified across the supplied documents. Ensure they describe a regulatory or compliance pathway." },
        { status: 422 }
      );
    }

    // ── 3. Persist to database ────────────────────────────────────────────────
    const now = new Date().toISOString();
    const primaryDocId = docIds[0] ?? null;

    // Build source summary for description
    const sourceCount = docIds.length + (url ? 1 : 0);
    const sourceNote = sourceCount > 1
      ? ` Extracted from ${sourceCount} source documents.`
      : "";

    const { data: pathway, error: pathwayErr } = await supabase
      .from("governance_pathways")
      .insert({
        id:                 crypto.randomUUID(),
        name:               pathwayMeta.pathway_name,
        description:        (pathwayMeta.pathway_description ?? "") + sourceNote,
        jurisdiction:       pathwayMeta.jurisdiction,
        pathway_type:       pathwayMeta.pathway_type,
        source_document_id: primaryDocId,
        source_url:         url ?? null,
        extracted_at:       now,
        created_at:         now,
        updated_at:         now,
      })
      .select("id")
      .single();

    if (pathwayErr || !pathway) {
      return NextResponse.json(
        { error: `Failed to save pathway: ${pathwayErr?.message ?? "unknown error"}` },
        { status: 500 }
      );
    }

    // Insert steps
    const stepRows = accumulatedSteps.map((s) => ({
      id:                   crypto.randomUUID(),
      pathway_id:           pathway.id,
      step_number:          s.step_number,
      title:                s.title,
      description:          s.description,
      step_type:            s.step_type,
      is_mandatory:         s.is_mandatory,
      estimated_duration:   s.estimated_duration || null,
      regulatory_reference: s.regulatory_reference || null,
      dependencies:         JSON.stringify(s.dependencies),
      created_at:           now,
    }));

    const { error: stepsErr } = await supabase
      .from("pathway_steps")
      .insert(stepRows);

    if (stepsErr) {
      await supabase.from("governance_pathways").delete().eq("id", pathway.id);
      return NextResponse.json(
        { error: `Failed to save pathway steps: ${stepsErr.message}` },
        { status: 500 }
      );
    }

    // Optionally seed pathway_progress for an organisation
    if (organisation_id) {
      const progressRows = stepRows.map((s) => ({
        id:              crypto.randomUUID(),
        pathway_id:      pathway.id,
        organisation_id,
        step_id:         s.id,
        status:          "not_started",
        created_at:      now,
        updated_at:      now,
      }));
      await supabase.from("pathway_progress").insert(progressRows);
    }

    // ── 4. Return result ──────────────────────────────────────────────────────
    const stepCount     = accumulatedSteps.length;
    const highConfidence = accumulatedSteps.filter((s) => s.confidence === "high").length;
    const lowConfidence  = accumulatedSteps.filter((s) => s.confidence === "low").length;

    return NextResponse.json({
      pathway_id:   pathway.id,
      pathway_name: pathwayMeta.pathway_name,
      jurisdiction: pathwayMeta.jurisdiction,
      pathway_type: pathwayMeta.pathway_type,
      source_count: sourceCount,
      chunks_processed: totalChunksProcessed,
      step_count:   stepCount,
      confidence_summary: {
        high:   highConfidence,
        medium: stepCount - highConfidence - lowConfidence,
        low:    lowConfidence,
      },
      steps: accumulatedSteps,
    });

  } catch (err: any) {
    console.error("[/api/pathways/extract]", err);
    return NextResponse.json(
      { error: err.message ?? "Extraction failed" },
      { status: 500 }
    );
  }
}
