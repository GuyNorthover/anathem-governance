import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAnthropicClient } from "@/lib/anthropic";
import mammoth from "mammoth";

export const maxDuration = 120;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export async function POST(req: NextRequest) {
  const id = generateId();

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const orgName = (formData.get("orgName") as string | null)?.trim();

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!orgName) {
      return NextResponse.json({ error: "orgName is required" }, { status: 400 });
    }

    const filename = file.name;
    const fileExt = filename.split(".").pop()?.toLowerCase();

    if (!["pdf", "docx", "doc"].includes(fileExt ?? "")) {
      return NextResponse.json(
        { error: "Only PDF and DOCX files are supported" },
        { status: 400 }
      );
    }

    // Insert placeholder row
    const { error: insertErr } = await supabase.from("bc_reference_cases").insert({
      id,
      org_name: orgName,
      filename,
      status: "processing",
    });

    if (insertErr) {
      return NextResponse.json(
        { error: "Failed to create reference case record", detail: insertErr.message },
        { status: 500 }
      );
    }

    // Extract text
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const client = getAnthropicClient();
    let fullText = "";

    if (fileExt === "pdf") {
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
      fullText =
        extractMsg.content[0].type === "text" ? extractMsg.content[0].text : "";
    } else {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      fullText = result.value;
    }

    if (!fullText.trim()) {
      await supabase
        .from("bc_reference_cases")
        .update({ status: "failed", error_message: "Could not extract text from document" })
        .eq("id", id);
      return NextResponse.json(
        { error: "Could not extract text from document" },
        { status: 422 }
      );
    }

    // Call Claude to extract structure
    const structurePrompt = `You are analysing a completed NHS trust business case for adopting ambient voice technology.
Extract the document structure and narrative approach.

Return ONLY a JSON object with this structure:
{
  "sections": [
    {
      "key": "snake_case_section_key",
      "title": "Section title as written",
      "summary": "2-3 sentence summary of what this section covers and the main arguments made",
      "narrative_approach": "How this section argues its case (e.g. 'Uses patient outcome data to justify clinical need', 'Presents ROI over 3 years with cost-per-consultation reduction')",
      "data_types_used": ["list", "of", "data", "types", "cited"],
      "word_count_approx": 300
    }
  ],
  "overall_approach": "Brief description of the overall case being made",
  "key_arguments": ["main argument 1", "main argument 2"],
  "evidence_style": "How evidence is typically cited in this document"
}

DOCUMENT TEXT:
${fullText.slice(0, 12000)}${fullText.length > 12000 ? "\n\n[Document truncated]" : ""}`;

    const structureMsg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: structurePrompt }],
    });

    const rawOutput =
      structureMsg.content[0].type === "text" ? structureMsg.content[0].text : "{}";

    let structure: any = {};
    try {
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        structure = JSON.parse(jsonMatch[0]);
      }
    } catch {
      structure = { sections: [], overall_approach: "Could not parse structure", key_arguments: [], evidence_style: "" };
    }

    const sectionCount = Array.isArray(structure.sections) ? structure.sections.length : 0;

    // Update record with extracted data
    await supabase
      .from("bc_reference_cases")
      .update({
        status: "analysed",
        structure,
        full_text: fullText,
        section_count: sectionCount,
      })
      .eq("id", id);

    return NextResponse.json({ id, sectionCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/bc/upload-reference]", message);

    // Mark failed
    try {
      await supabase
        .from("bc_reference_cases")
        .update({ status: "failed", error_message: message })
        .eq("id", id);
    } catch {
      // ignore
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
