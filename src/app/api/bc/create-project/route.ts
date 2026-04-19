import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAnthropicClient } from "@/lib/anthropic";
import mammoth from "mammoth";

export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

interface TemplateSection {
  key: string;
  title: string;
  guidance: string;
  sort_order: number;
}

interface ReferenceCase {
  id: string;
  org_name: string;
  structure: any;
  full_text: string;
}

interface SectionDraftResult {
  draft_content: string;
  data_requests: Array<{
    field: string;
    label: string;
    description: string;
    type: string;
    required: boolean;
    placeholder_text: string;
  }>;
  status: "needs_data" | "drafted";
}

export async function POST(req: NextRequest) {
  const projectId = generateId();

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

    if (!["docx", "doc"].includes(fileExt ?? "")) {
      return NextResponse.json(
        { error: "Template must be a DOCX file" },
        { status: 400 }
      );
    }

    // 1. Extract text from blank template using mammoth
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const extracted = await mammoth.extractRawText({ buffer: fileBuffer });
    const templateText = extracted.value;

    if (!templateText.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from template" },
        { status: 422 }
      );
    }

    const client = getAnthropicClient();

    // 2. Extract template structure
    const templateStructurePrompt = `This is a blank business case template from an NHS trust. Extract its structure.

Return ONLY a JSON array of sections:
[
  {
    "key": "snake_case_key",
    "title": "Exact section heading",
    "guidance": "Any guidance text, prompts or example text already in this section (verbatim)",
    "sort_order": 0
  }
]

TEMPLATE TEXT:
${templateText.slice(0, 10000)}${templateText.length > 10000 ? "\n\n[Truncated]" : ""}`;

    const templateMsg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: templateStructurePrompt }],
    });

    const templateRaw =
      templateMsg.content[0].type === "text" ? templateMsg.content[0].text : "[]";

    let templateSections: TemplateSection[] = [];
    try {
      const jsonMatch = templateRaw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          templateSections = parsed.map((s: any, i: number) => ({
            key: s.key ?? `section_${i}`,
            title: s.title ?? `Section ${i + 1}`,
            guidance: s.guidance ?? "",
            sort_order: typeof s.sort_order === "number" ? s.sort_order : i,
          }));
        }
      }
    } catch {
      templateSections = [
        { key: "main_content", title: "Main Content", guidance: templateText.slice(0, 500), sort_order: 0 },
      ];
    }

    if (templateSections.length === 0) {
      templateSections = [
        { key: "main_content", title: "Main Content", guidance: templateText.slice(0, 500), sort_order: 0 },
      ];
    }

    // 3. Fetch all analysed reference cases
    const { data: refCaseRows, error: refErr } = await supabase
      .from("bc_reference_cases")
      .select("id, org_name, structure, full_text")
      .eq("status", "analysed");

    if (refErr) {
      console.error("[create-project] Failed to fetch reference cases:", refErr.message);
    }

    const referenceCases: ReferenceCase[] = (refCaseRows ?? []).map((r: any) => ({
      id: r.id,
      org_name: r.org_name,
      structure: r.structure,
      full_text: r.full_text ?? "",
    }));

    const referenceIds = referenceCases.map((r) => r.id);

    // 4. Insert bc_projects row (store original template binary for format-faithful download)
    const { error: projectErr } = await supabase.from("bc_projects").insert({
      id: projectId,
      org_name: orgName,
      template_filename: filename,
      template_structure: templateSections,
      status: "drafting",
      reference_case_ids: referenceIds,
      template_binary: fileBuffer.toString("base64"),
    });

    if (projectErr) {
      return NextResponse.json(
        { error: "Failed to create project", detail: projectErr.message },
        { status: 500 }
      );
    }

    // 5. For each section, draft content using Claude
    let totalDataRequests = 0;
    let anyNeedsData = false;

    const sectionInserts: any[] = [];

    for (const section of templateSections) {
      // Build reference material summary
      const refMaterialLines: string[] = [];
      let combinedFullText = "";

      for (const ref of referenceCases) {
        const sections = ref.structure?.sections ?? [];
        // Find matching section by key or title similarity
        const matchingSection = sections.find(
          (s: any) =>
            s.key === section.key ||
            s.title?.toLowerCase().includes(section.title?.toLowerCase().slice(0, 10))
        ) ?? sections[0];

        if (matchingSection) {
          refMaterialLines.push(
            `Organisation: ${ref.org_name}\n` +
            `Section summary: ${matchingSection.summary ?? "(no summary)"}\n` +
            `Narrative approach: ${matchingSection.narrative_approach ?? "(none)"}\n` +
            `Data types used: ${(matchingSection.data_types_used ?? []).join(", ")}`
          );
        } else {
          refMaterialLines.push(
            `Organisation: ${ref.org_name}\n` +
            `Overall approach: ${ref.structure?.overall_approach ?? "(no overview)"}`
          );
        }

        // Accumulate full text snippets (truncate to keep total under 3000 chars)
        const remaining = 3000 - combinedFullText.length;
        if (remaining > 100 && ref.full_text) {
          const snippet = ref.full_text.slice(0, Math.min(remaining, 1500));
          combinedFullText += `\n\n--- From ${ref.org_name} ---\n${snippet}`;
        }
      }

      const refMaterialText =
        referenceCases.length > 0
          ? refMaterialLines.join("\n\n---\n\n")
          : "No reference cases available. Draft using best-practice NHS business case conventions.";

      // ── Call 1: plain-text draft (no JSON wrapper, avoids apostrophe/quote escaping issues) ──
      const draftTextPrompt = `You are drafting a section of a business case for an NHS trust adopting Anathem ambient voice technology (AVT).

SECTION TO DRAFT: "${section.title}"
TEMPLATE GUIDANCE: "${section.guidance || "(no guidance provided)"}"

REFERENCE MATERIAL — how other trusts have written this section:
${refMaterialText}

Full text extracts from reference cases (for narrative style):
${combinedFullText || "(No reference text available)"}

Write the full draft content for this section. Use the narrative approach and argument structure from the reference cases. Where specific data is needed (patient volumes, costs, timelines, etc.), use clear placeholders like [INSERT: monthly appointment volume] or [INSERT: current documentation time per appointment in minutes].

Output ONLY the draft text. Do not include any JSON, explanations, or commentary — just the prose content for this section.`;

      // ── Call 2: data requests as clean JSON (no prose, much less likely to break) ──
      const dataRequestsPrompt = `You are analysing a drafted section of an NHS business case.

SECTION: "${section.title}"
TEMPLATE GUIDANCE: "${section.guidance || "(none)"}"

List all the trust-specific data items that are needed to complete this section. Return ONLY a JSON array — no prose, no markdown fences.

[
  {
    "field": "snake_case_field_name",
    "label": "Human readable label",
    "description": "Specific description of what data is needed and why",
    "type": "text",
    "required": true,
    "placeholder_text": "INSERT: description of the placeholder used in the draft"
  }
]

If no specific data is required, return an empty array: []`;

      let draftResult: SectionDraftResult = {
        draft_content: `Draft content for "${section.title}" — AI generation unavailable.`,
        data_requests: [],
        status: "drafted",
      };

      try {
        // Run both Claude calls in parallel
        const [draftMsg, dataReqMsg] = await Promise.all([
          client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2048,
            messages: [{ role: "user", content: draftTextPrompt }],
          }),
          client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            messages: [{ role: "user", content: dataRequestsPrompt }],
          }),
        ]);

        const draftContent =
          draftMsg.content[0].type === "text"
            ? draftMsg.content[0].text.trim()
            : draftResult.draft_content;

        const dataReqRaw =
          dataReqMsg.content[0].type === "text" ? dataReqMsg.content[0].text : "[]";

        let dataRequests: SectionDraftResult["data_requests"] = [];
        try {
          const arrMatch = dataReqRaw.match(/\[[\s\S]*\]/);
          if (arrMatch) {
            const parsed = JSON.parse(arrMatch[0]);
            if (Array.isArray(parsed)) {
              dataRequests = parsed;
            }
          }
        } catch (jsonErr) {
          console.warn(`[create-project] Could not parse data_requests JSON for "${section.title}":`, jsonErr);
        }

        draftResult = {
          draft_content: draftContent,
          data_requests: dataRequests,
          status: dataRequests.some((d) => d.required) ? "needs_data" : "drafted",
        };
      } catch (e) {
        console.error(`[create-project] Failed to draft section "${section.title}":`, e);
      }

      if (draftResult.status === "needs_data") {
        anyNeedsData = true;
        totalDataRequests += draftResult.data_requests.filter((d) => d.required).length;
      }

      sectionInserts.push({
        id: generateId(),
        project_id: projectId,
        section_key: section.key,
        title: section.title,
        template_guidance: section.guidance || null,
        draft_content: draftResult.draft_content,
        final_content: null,
        status: draftResult.status,
        sort_order: section.sort_order,
        data_requests: draftResult.data_requests,
      });
    }

    // 6. Insert all sections
    if (sectionInserts.length > 0) {
      const { error: sectionsErr } = await supabase
        .from("bc_sections")
        .insert(sectionInserts);

      if (sectionsErr) {
        console.error("[create-project] Failed to insert sections:", sectionsErr.message);
      }
    }

    // 7. Update project status
    const finalStatus = anyNeedsData ? "needs_data" : "complete";
    await supabase
      .from("bc_projects")
      .update({ status: finalStatus, updated_at: new Date().toISOString() })
      .eq("id", projectId);

    return NextResponse.json({
      projectId,
      sectionCount: templateSections.length,
      dataRequestCount: totalDataRequests,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/bc/create-project]", message);

    // Clean up project row if something went wrong mid-flight
    try {
      await supabase.from("bc_projects").delete().eq("id", projectId);
    } catch {
      // ignore
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
