import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from "docx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BCProject {
  id: string;
  org_name: string;
  template_filename: string;
  status: string;
  created_at: string;
}

interface BCSection {
  id: string;
  project_id: string;
  section_key: string;
  title: string;
  draft_content: string | null;
  final_content: string | null;
  status: string;
  sort_order: number;
}

/**
 * Parse a text chunk and return an array of TextRun objects,
 * highlighting any remaining [INSERT: ...] placeholders in bold.
 */
function parseContentToRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const placeholderRegex = /(\[INSERT:[^\]]*\])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = placeholderRegex.exec(text)) !== null) {
    // Text before the placeholder
    if (match.index > lastIndex) {
      runs.push(
        new TextRun({
          text: text.slice(lastIndex, match.index),
          size: 22,
        })
      );
    }
    // Placeholder — bold + brackets
    runs.push(
      new TextRun({
        text: match[1],
        bold: true,
        size: 22,
      })
    );
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last placeholder
  if (lastIndex < text.length) {
    runs.push(
      new TextRun({
        text: text.slice(lastIndex),
        size: 22,
      })
    );
  }

  return runs;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // 1. Fetch project
    const { data: projectRow, error: projectErr } = await supabase
      .from("bc_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectErr || !projectRow) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projectRow as BCProject;

    // 2. Fetch all sections ordered by sort_order
    const { data: sectionRows, error: sectionsErr } = await supabase
      .from("bc_sections")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });

    if (sectionsErr) {
      return NextResponse.json(
        { error: "Failed to fetch sections", detail: sectionsErr.message },
        { status: 500 }
      );
    }

    const sections = (sectionRows ?? []) as BCSection[];

    // 3. Format dates
    const nowDate = new Date();
    const formattedDate = nowDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const isoDate = nowDate.toISOString().slice(0, 10);

    // 4. Build document body
    const bodyChildren: Paragraph[] = [];

    // Title page
    bodyChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Business Case: ${project.org_name}`,
            bold: true,
            size: 52,
            color: "1E1B4B",
          }),
        ],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.LEFT,
        spacing: { after: 240 },
      })
    );

    bodyChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Prepared with Anathem Governance Platform",
            size: 24,
            color: "6366F1",
            italics: true,
          }),
        ],
        spacing: { after: 120 },
      })
    );

    bodyChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: formattedDate,
            size: 22,
            color: "888888",
          }),
        ],
        spacing: { after: 480 },
      })
    );

    // Divider
    bodyChildren.push(
      new Paragraph({
        text: "",
        spacing: { after: 400 },
        border: {
          bottom: { color: "C7D2FE", size: 6, style: "single", space: 1 },
        },
      })
    );

    // Sections
    for (const section of sections) {
      const content = section.final_content?.trim() || section.draft_content?.trim() || "";

      // Section heading
      bodyChildren.push(
        new Paragraph({
          text: section.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 480, after: 200 },
        })
      );

      if (!content) {
        bodyChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "[No content generated for this section]",
                italics: true,
                size: 22,
                color: "888888",
              }),
            ],
            spacing: { after: 200 },
          })
        );
        continue;
      }

      // Split on double newlines to preserve paragraph breaks
      const paragraphs = content.split(/\n\n+/);
      for (const para of paragraphs) {
        const trimmed = para.replace(/\n/g, " ").trim();
        if (!trimmed) continue;

        const runs = parseContentToRuns(trimmed);
        bodyChildren.push(
          new Paragraph({
            children: runs,
            spacing: { after: 160 },
          })
        );
      }

      // Draft notice if section isn't complete
      if (section.status !== "complete") {
        bodyChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "[ DRAFT — requires completion with trust-specific data before submission ]",
                italics: true,
                size: 20,
                color: "B45309",
              }),
            ],
            spacing: { after: 240 },
          })
        );
      }
    }

    // 5. Build document with header/footer
    const safeOrgName = project.org_name.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const wordDoc = new Document({
      sections: [
        {
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Anathem Governance Platform",
                      size: 18,
                      color: "6366F1",
                    }),
                    new TextRun({
                      text: `  |  Business Case  |  ${project.org_name}`,
                      size: 18,
                      color: "888888",
                      italics: true,
                    }),
                  ],
                  alignment: AlignmentType.LEFT,
                  border: {
                    bottom: { color: "E0E7FF", size: 4, style: "single", space: 1 },
                  },
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "DRAFT — For review only  |  Page ",
                      size: 18,
                      color: "888888",
                    }),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      size: 18,
                      color: "888888",
                    }),
                    new TextRun({
                      text: " of ",
                      size: 18,
                      color: "888888",
                    }),
                    new TextRun({
                      children: [PageNumber.TOTAL_PAGES],
                      size: 18,
                      color: "888888",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  border: {
                    top: { color: "E0E7FF", size: 4, style: "single", space: 1 },
                  },
                }),
              ],
            }),
          },
          properties: {
            page: {
              pageNumbers: {
                start: 1,
                formatType: NumberFormat.DECIMAL,
              },
            },
          },
          children: bodyChildren,
        },
      ],
    });

    // 6. Pack and return
    const buffer = await Packer.toBuffer(wordDoc);
    const filename = `business-case-${safeOrgName}-${isoDate}.docx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/bc/download]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
