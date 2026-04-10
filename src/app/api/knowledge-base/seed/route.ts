import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import mammoth from "mammoth";

export const maxDuration = 120;

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
      return NextResponse.json(
        { error: "Only PDF and DOCX files are supported" },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const client = getAnthropicClient();

    // ── 1. Extract content ─────────────────────────────────────────────
    // PDF: send directly so Claude sees visual layout (single pass)
    // DOCX: convert to HTML to preserve table structure, bold, headings
    let documentContent = "";
    let isPdf = false;
    let pdfBase64 = "";

    if (fileExt === "pdf") {
      isPdf = true;
      pdfBase64 = fileBuffer.toString("base64");
    } else {
      const htmlResult = await mammoth.convertToHtml({ buffer: fileBuffer });
      documentContent = htmlResult.value
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        // Remove base64 images — they consume huge character budget with zero value
        .replace(/<img[^>]*src="data:[^"]*"[^>]*\/?>/gi, "")
        .replace(/<img[^>]*src="data:[^"]*"[^>]*/gi, "")
        .replace(/[ \t]+/g, " ")
        .trim();
    }

    if (!isPdf && !documentContent.trim()) {
      return NextResponse.json(
        { error: "Could not extract content from document" },
        { status: 422 }
      );
    }

    // ── 2. Call Claude to extract structured facts ─────────────────────
    const CONTENT_LIMIT = 300000;
    const truncatedContent = documentContent.length > CONTENT_LIMIT
      ? documentContent.slice(0, CONTENT_LIMIT) + "\n<!-- [truncated] -->"
      : documentContent;

    const prompt = `You are a knowledge base engineer for Anathem, a regulated medical device company building ambient voice technology (AVT) for NHS clinical documentation.

You have been given an internal compliance document. Extract every significant factual claim that should be stored in the company knowledge base — things like product specifications, regulatory statuses, clinical evidence, data processing details, certifications, dates, version numbers, risk assessments, policies, and contact details.

Use dot-notation keys following these conventions:
- product.* → product name, version, description, intended purpose
- clinical_safety.* → DCB0129/DCB0160 status, hazard counts, risk levels, CSSO details
- data.* → data classification, retention periods, processing bases, encryption standards
- regulatory.* → MHRA status, CE/UKCA marking, SaMD classification, conformity
- infrastructure.* → hosting provider, architecture, penetration testing, ISO certifications
- security.* → cyber security posture, NHS DSPT status, vulnerabilities, controls
- equality.* → equality impact findings, protected characteristics assessment
- evidence.* → clinical evaluation results, study references, outcome data
- company.* → company name, address, registration, key contacts

For tier:
- "global" → applies to all deployments of the product (most facts)
- "module" → only relevant to a specific product module (mental-health, police, neurodevelopmental, patient-crm)

For domain, choose the best fit: clinical, technical, data, legal, evidence

Rules:
- Extract concrete facts only — no vague statements
- Value should be concise (1–3 sentences max) and directly usable in a compliance document
- Skip boilerplate, section headings, and procedural instructions
- Include version numbers, dates, and specific statuses wherever present
- If a fact is module-specific, set module to one of: mental-health, police, neurodevelopmental, patient-crm

Return ONLY a JSON array, no markdown, no explanation:
[
  {
    "key": "product.name",
    "value": "Anathem",
    "tier": "global",
    "domain": "technical",
    "module": null
  }
]

DOCUMENT: ${fileName}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [{
        role: "user",
        content: isPdf
          ? [
              { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } } as any,
              { type: "text", text: prompt },
            ]
          : `${prompt}\n\nDOCUMENT HTML (use table structure, bold and headings to identify facts):\n\n${truncatedContent}`,
      }],
    });

    const rawOutput =
      message.content[0].type === "text" ? message.content[0].text : "[]";

    // ── 3. Parse response ──────────────────────────────────────────────
    let facts: Array<{
      key: string;
      value: string;
      tier: string;
      domain: string;
      module: string | null;
    }> = [];

    try {
      const jsonMatch = rawOutput.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          facts = parsed
            .filter(
              (f) =>
                f &&
                typeof f.key === "string" &&
                typeof f.value === "string" &&
                f.key.trim() &&
                f.value.trim()
            )
            .map((f) => ({
              key: f.key.trim().toLowerCase().replace(/\s+/g, "_"),
              value: f.value.trim(),
              tier: ["global", "module"].includes(f.tier) ? f.tier : "global",
              domain: ["clinical", "technical", "data", "legal", "evidence"].includes(
                f.domain
              )
                ? f.domain
                : "technical",
              module: f.module ?? null,
            }));
        }
      }
    } catch {
      return NextResponse.json(
        { error: "Could not parse Claude's response. Try again." },
        { status: 422 }
      );
    }

    return NextResponse.json({ facts, documentName: fileName });
  } catch (err: any) {
    console.error("[/api/knowledge-base/seed]", err);
    return NextResponse.json(
      { error: err.message ?? "Extraction failed" },
      { status: 500 }
    );
  }
}
