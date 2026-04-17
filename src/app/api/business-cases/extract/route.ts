import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import mammoth from "mammoth";

export const config = {
  api: { bodyParser: false },
};

// Increase max duration for large document processing
export const maxDuration = 120; // seconds

export interface ExtractedFact {
  key: string;
  label: string;
  value: string;
  domain: "clinical" | "technical" | "data" | "legal" | "evidence";
  value_type: "string" | "number" | "boolean" | "date" | "url";
  rationale: string;
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse multipart form ────────────────────────────────────────
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const orgId = formData.get("orgId") as string | null;
    const orgName = formData.get("orgName") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }
    if (!orgName) {
      return NextResponse.json({ error: "orgName is required" }, { status: 400 });
    }

    const fileName = file.name;
    const fileExt = fileName.split(".").pop()?.toLowerCase();

    if (!["pdf", "docx", "doc"].includes(fileExt ?? "")) {
      return NextResponse.json(
        { error: "Only PDF and DOCX files are supported" },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileSize = fileBuffer.length;
    const client = getAnthropicClient();

    // ── 2. Extract text from file ──────────────────────────────────────
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
      return NextResponse.json(
        { error: "Could not extract text from document" },
        { status: 422 }
      );
    }

    // ── 3. Derive org slug from orgName ────────────────────────────────
    const orgSlug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "_");

    // ── 4. Call Claude to extract org-specific facts ───────────────────
    const extractionPrompt = `You are a compliance analyst for Anathem, a regulated medical device company building ambient voice technology (AVT) for NHS clinical documentation.

An NHS trust has provided a business case document. Your task is to extract org-specific facts that describe this particular organisation's clinical context, technical environment, data requirements, legal/procurement terms, and evidence base.

The organisation name is: "${orgName}"
The org slug to use in key names is: "${orgSlug}"

Extract 10–25 specific, concrete facts from this business case. Focus on:

CLINICAL domain facts:
- Patient volumes (e.g. monthly outpatient appointments, inpatient bed days, clinic slots)
- Clinical specialties covered (e.g. mental health, A&E, CAMHS)
- Clinical workflows and care settings
- Named clinicians or clinical leads (if mentioned)

TECHNICAL domain facts:
- Existing EPR system name and version (e.g. RiO v7, SystemOne, Lorenzo, Evolent)
- Infrastructure type (cloud, on-premise, hybrid)
- Integration requirements (e.g. HL7 FHIR, API protocols)
- Network or connectivity constraints
- Device types (laptops, tablets, etc.)

DATA domain facts:
- Data volumes and retention periods
- Data processing activities (what data is captured, stored, processed)
- Data residency requirements (UK-only, specific region)
- Backup and recovery requirements

LEGAL domain facts:
- Procurement framework (e.g. G-Cloud, Crown Commercial Service, NHS Shared Business Services)
- Contract duration and renewal terms
- SLA requirements (uptime, response times)
- Indemnity or liability terms

EVIDENCE domain facts:
- Pilot or trial results (outcome metrics, dates, sites)
- Audit findings or quality improvement results
- Clinical outcomes data
- User satisfaction scores or feedback

Rules for generating facts:
1. Use key format: org.${orgSlug}.[descriptive_fact_name] (e.g. org.${orgSlug}.monthly_outpatient_volume)
2. Values must be specific and concrete — include numbers, named systems, dates, percentages. Do NOT produce vague generalities like "high volume" or "modern EPR".
3. If a fact is not present in the document, do not include it.
4. domain must be exactly one of: clinical, technical, data, legal, evidence
5. value_type must be one of: string, number, boolean, date, url
6. Use value_type "number" only for pure numeric values (no units). Use "string" when the value includes units or text.
7. rationale must cite the specific section or sentence where the fact was found.

Return ONLY a JSON array with this exact structure (no markdown fences, no explanation before or after):
[
  {
    "key": "org.${orgSlug}.monthly_outpatient_volume",
    "label": "Monthly outpatient volume",
    "value": "2,400 outpatient appointments",
    "domain": "clinical",
    "value_type": "string",
    "rationale": "Extracted from Section 2: Capacity Planning — '2,400 outpatient appointments per month across all specialties'"
  }
]

BUSINESS CASE DOCUMENT:
${documentText.slice(0, 10000)}${documentText.length > 10000 ? "\n\n[Document truncated — first 10,000 characters shown]" : ""}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: extractionPrompt }],
    });

    const rawOutput =
      message.content[0].type === "text" ? message.content[0].text : "[]";

    // ── 5. Parse Claude's JSON response ───────────────────────────────
    let facts: ExtractedFact[] = [];

    try {
      const jsonMatch = rawOutput.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          const validDomains = new Set(["clinical", "technical", "data", "legal", "evidence"]);
          const validValueTypes = new Set(["string", "number", "boolean", "date", "url"]);

          facts = parsed
            .filter(
              (f) =>
                f &&
                typeof f.key === "string" &&
                typeof f.label === "string" &&
                typeof f.value === "string" &&
                validDomains.has(f.domain) &&
                validValueTypes.has(f.value_type)
            )
            .map((f) => ({
              key: f.key,
              label: f.label,
              value: f.value,
              domain: f.domain,
              value_type: f.value_type,
              rationale: typeof f.rationale === "string" ? f.rationale : "",
            }));
        }
      }
    } catch (parseErr) {
      console.error("[/api/business-cases/extract] Failed to parse Claude response:", parseErr);
      facts = [];
    }

    // ── 6. Return results ──────────────────────────────────────────────
    return NextResponse.json({
      facts,
      rawText: documentText.slice(0, 500),
      fileSize,
    });
  } catch (err: any) {
    console.error("[/api/business-cases/extract]", err);
    return NextResponse.json(
      { error: err.message ?? "Extraction failed" },
      { status: 500 }
    );
  }
}
