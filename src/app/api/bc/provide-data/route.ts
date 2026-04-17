import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAnthropicClient } from "@/lib/anthropic";

export const maxDuration = 120;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DataRequest {
  field: string;
  label: string;
  description: string;
  type: string;
  required: boolean;
  placeholder_text: string;
  provided_value?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, sectionId, dataValues } = body as {
      projectId: string;
      sectionId: string;
      dataValues: Record<string, string>;
    };

    if (!projectId || !sectionId || !dataValues) {
      return NextResponse.json(
        { error: "projectId, sectionId, and dataValues are required" },
        { status: 400 }
      );
    }

    // 1. Fetch the section
    const { data: sectionRow, error: sectionErr } = await supabase
      .from("bc_sections")
      .select("id, title, draft_content, data_requests, project_id")
      .eq("id", sectionId)
      .eq("project_id", projectId)
      .single();

    if (sectionErr || !sectionRow) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const title: string = sectionRow.title;
    let draftContent: string = sectionRow.draft_content ?? "";
    const dataRequests: DataRequest[] = Array.isArray(sectionRow.data_requests)
      ? sectionRow.data_requests
      : [];

    // 2. Replace placeholder_text with provided values and update data_requests
    const updatedDataRequests = dataRequests.map((dr) => {
      const value = dataValues[dr.field];
      if (value !== undefined && value !== null && value.trim() !== "") {
        // Replace placeholder in draft content
        draftContent = draftContent.split(dr.placeholder_text).join(value);
        return { ...dr, provided_value: value };
      }
      return dr;
    });

    // 3. Call Claude to refine the section
    const client = getAnthropicClient();

    const refinePrompt = `You are completing a section of an NHS trust business case for Anathem ambient voice technology.

SECTION: "${title}"

CURRENT DRAFT (with data now provided):
${draftContent}

The placeholders have been filled in with real data. Please rewrite this section to:
1. Integrate the provided data naturally into the narrative
2. Ensure all [INSERT: ...] placeholders that were filled are now proper prose
3. Maintain the professional business case tone
4. Keep any [INSERT: ...] placeholders that were NOT provided

Return ONLY the completed section text (no JSON wrapper, just the prose).`;

    const refineMsg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: refinePrompt }],
    });

    const finalContent =
      refineMsg.content[0].type === "text"
        ? refineMsg.content[0].text.trim()
        : draftContent;

    // 4. Update the section
    const { error: updateErr } = await supabase
      .from("bc_sections")
      .update({
        final_content: finalContent,
        status: "complete",
        data_requests: updatedDataRequests,
      })
      .eq("id", sectionId);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to update section", detail: updateErr.message },
        { status: 500 }
      );
    }

    // 5. Check if all sections in the project are complete
    const { data: allSections, error: allErr } = await supabase
      .from("bc_sections")
      .select("id, status")
      .eq("project_id", projectId);

    let projectComplete = false;

    if (!allErr && allSections) {
      projectComplete = allSections.every((s: any) => s.status === "complete");

      if (projectComplete) {
        await supabase
          .from("bc_projects")
          .update({ status: "complete", updated_at: new Date().toISOString() })
          .eq("id", projectId);
      }
    }

    return NextResponse.json({
      sectionId,
      complete: true,
      projectComplete,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/bc/provide-data]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
