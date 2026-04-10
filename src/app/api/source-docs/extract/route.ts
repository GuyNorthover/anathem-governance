import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import mammoth from "mammoth";

export const maxDuration = 300;

// Strip noise; keep all structural HTML Claude needs for Q&A extraction
function cleanHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    // Remove base64-encoded images — they are pure noise and can consume
    // hundreds of thousands of characters, destroying the effective context limit
    .replace(/<img[^>]*src="data:[^"]*"[^>]*\/?>/gi, "")
    .replace(/<img[^>]*src="data:[^"]*"[^>]*/gi, "")
    // Collapse runs of whitespace
    .replace(/[ \t]+/g, " ")
    .trim();
}

const STRUCTURE_PROMPT = (docHint: string) => `You are extracting structured content from an Anathem governance document to store in a compliance knowledge base.

DOCUMENT TYPE HINT: ${docHint}

══════════════════════════════════════════════════════════
STEP 1 — CLASSIFY THE DOCUMENT
══════════════════════════════════════════════════════════

Assign a doc_prefix and doc_type:

| Document                                   | doc_prefix              | doc_type    |
|--------------------------------------------|-------------------------|-------------|
| DTAC (Digital Technology Assessment Criteria) | dtac                 | questionnaire |
| DPIA / Data Protection Impact Assessment   | dpia                    | questionnaire |
| Equality Impact Assessment / EIA           | eia                     | questionnaire |
| Third Party Infrastructure Assessment      | infrastructure          | questionnaire |
| Third Party Cyber Security Assessment      | cyber_security          | questionnaire |
| UK Declaration of Conformity               | declaration_conformity  | questionnaire |
| Clinical Risk Management Plan              | clinical_risk           | narrative   |
| Clinical Safety Case Report                | clinical_safety         | narrative   |
| Information Governance / IG Toolkit        | ig_toolkit              | questionnaire |
| Policy, procedure, or plan document        | (short descriptive slug)| narrative   |
| Other questionnaire / assessment form      | (short descriptive slug)| questionnaire |

doc_type drives the extraction strategy below.

══════════════════════════════════════════════════════════
STEP 2A — QUESTIONNAIRE DOCUMENTS (doc_type = "questionnaire")
══════════════════════════════════════════════════════════

These are forms or assessments where an external body asks questions and Anathem provides responses.
The document is structured as a table or numbered list of criteria + responses.

HOW TO EXTRACT:
- Each table row (or numbered criterion) = one item
- The question/criterion cell (usually left column, bold, or labelled) = "question"
- Anathem's response cell (usually right column, or text following the criterion) = "answer"
- Section headings in table header rows = "section"
- Extract EVERY row, including rows where the answer is blank or a placeholder
- IMPORTANT: cells may be rendered as <th> rather than <td> — treat both equally as table cells. Do not skip rows because they use <th> tags.

has_answer = TRUE:  real sentences, specific facts, names, numbers, dates, URLs, "Yes/No with explanation", "N/A with reason"
has_answer = FALSE: placeholder text only — "Yes | No", "Free text", "TBC", "N/A", empty cell, options separated by "/" or "|"

DEDUPLICATION: If the same question appears in a blank template section AND a completed section, keep only the completed version.

══════════════════════════════════════════════════════════
STEP 2B — NARRATIVE DOCUMENTS (doc_type = "narrative")
══════════════════════════════════════════════════════════

These are Anathem's own authored documents (plans, reports, policies). There is no external questioner.
The document is structured as sections of prose — headings followed by paragraphs, bullet lists, and numbered lists.

HOW TO EXTRACT:
- Every section and subsection = one item
- The section heading (h1/h2/h3/h4 or bold standalone line) = "question" (rephrased as a descriptive label, e.g. "Introduction" → "What is the scope and purpose of this Clinical Risk Management Plan?")
- ALL text beneath that heading until the next heading = "answer" — copy VERBATIM and in FULL, preserving bullet points and numbered lists
- Do NOT summarise or truncate — capture every sentence
- If a section has subsections, extract the parent section AND each subsection as separate items
- has_answer is ALWAYS true for narrative documents (the whole document is Anathem's content)
- There are no blank placeholders in narrative documents

IMPORTANT: The goal is to capture 100% of the document's content. Every paragraph must appear in at least one item's answer. If you are uncertain which section a paragraph belongs to, assign it to the nearest preceding heading.

══════════════════════════════════════════════════════════
STEP 3 — OUTPUT FORMAT
══════════════════════════════════════════════════════════

For every item extract:
- "key_slug": short snake_case identifier unique within this document
- "question": the criterion text (questionnaire) OR a descriptive label question (narrative)
- "answer": COMPLETE verbatim content. Never truncate or summarise. Empty string "" only for questionnaire placeholders.
- "has_answer": true or false
- "section": nearest parent section heading
- "domain": one of: clinical, technical, data, legal, evidence

Return ONLY this JSON object (no markdown fences, no explanation):
{
  "doc_prefix": "clinical_risk",
  "doc_title": "Clinical Risk Management Plan",
  "doc_date": "2025-01-12",
  "doc_version": "",
  "doc_type": "narrative",
  "items": [
    {
      "key_slug": "scope_and_purpose",
      "question": "What is the scope and purpose of this Clinical Risk Management Plan?",
      "answer": "Anathem is a generative AI and Natural Language Processing driven dynamic workflow and assessment system...[full verbatim text]",
      "has_answer": true,
      "section": "Introduction",
      "domain": "clinical"
    },
    {
      "key_slug": "consent_process",
      "question": "What is the patient consent process?",
      "answer": "...[full verbatim text of consent section]",
      "has_answer": true,
      "section": "Consent",
      "domain": "clinical"
    }
  ]
}

doc_date: extract the document date (version date, review date, "dated", "as of"). ISO YYYY-MM-DD. If not found use today.
doc_version: version number if present. Empty string if not found.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name;
    const fileExt = fileName.split(".").pop()?.toLowerCase();

    if (!["pdf", "doc", "docx"].includes(fileExt ?? "")) {
      return NextResponse.json({ error: "Only PDF and DOCX files are supported" }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const client = getAnthropicClient();

    let message;

    if (fileExt === "pdf") {
      // ── PDF: single-pass — Claude reads layout + structures Q&A directly ──
      const base64 = fileBuffer.toString("base64");
      const stream = client.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: 32000,
        messages: [{
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64 },
            } as any,
            {
              type: "text",
              text: STRUCTURE_PROMPT(fileName),
            },
          ],
        }],
      });
      message = await stream.finalMessage();
    } else {
      // ── DOCX: convert to HTML (preserves tables, bold, headings) ──────────
      const htmlResult = await mammoth.convertToHtml({ buffer: fileBuffer });
      const html = cleanHtml(htmlResult.value);

      if (!html.trim()) {
        return NextResponse.json({ error: "Could not extract content from document" }, { status: 422 });
      }

      // Cap at 300k chars — after stripping base64 images the structural HTML
      // is typically 30–80k for a large DTAC; this gives plenty of headroom
      const HTML_LIMIT = 300000;
      const truncated = html.length > HTML_LIMIT
        ? html.slice(0, HTML_LIMIT) + "\n<!-- [truncated] -->"
        : html;

      const stream = client.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: 32000,
        messages: [{
          role: "user",
          content: `${STRUCTURE_PROMPT(fileName)}\n\nDOCUMENT HTML (use table structure, bold text, and headings to identify questions vs answers):\n\n${truncated}`,
        }],
      });
      message = await stream.finalMessage();
    }

    const rawOutput = message.content[0].type === "text" ? message.content[0].text : "{}";

    // ── Parse response ─────────────────────────────────────────────────────
    let parsed: { doc_prefix?: string; doc_title?: string; doc_date?: string; doc_version?: string; items?: any[] };
    try {
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      return NextResponse.json({ error: "Could not parse Claude's response. Try again." }, { status: 422 });
    }

    const prefix = ((parsed.doc_prefix ?? "doc") as string).toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const title = parsed.doc_title ?? fileName;
    const documentDate = parsed.doc_date ?? new Date().toISOString().slice(0, 10);
    const documentVersion = parsed.doc_version ?? "";

    const items = (parsed.items ?? [])
      .filter((item: any) => item?.question)  // keep all questions, even unanswered
      .map((item: any, idx: number) => ({
        fact_key: `${prefix}.${((item.key_slug ?? `item_${idx}`) as string).toLowerCase().replace(/[^a-z0-9_]/g, "_")}`,
        display_name: String(item.question).trim(),
        current_value: item.has_answer ? String(item.answer ?? "").trim() : "",
        has_answer: item.has_answer === true,
        description: String(item.section ?? "General").trim(),
        domain: ["clinical", "technical", "data", "legal", "evidence"].includes(item.domain)
          ? item.domain : "technical",
        tier: "global",
        module: null,
      }));

    return NextResponse.json({ prefix, title, fileName, documentDate, documentVersion, items });
  } catch (err: any) {
    console.error("[/api/source-docs/extract]", err);
    return NextResponse.json({ error: err.message ?? "Extraction failed" }, { status: 500 });
  }
}
