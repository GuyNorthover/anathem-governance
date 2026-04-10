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

// ── Server-side Supabase client ───────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface EUDocumentInstance {
  id: string;
  template_slug: string;
  template_title: string;
  category: string;
  org_id: string | null;
  status: string;
  generated_at: string | null;
  created_at: string;
  notes: string | null;
}

interface EUDocumentSection {
  id: string;
  instance_id: string;
  question_text: string;
  answer: string | null;
  status: string;
  sort_order: number;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  try {
    const { instanceId } = await params;

    if (!instanceId) {
      return NextResponse.json({ error: "instanceId is required" }, { status: 400 });
    }

    // ── 1. Fetch instance ─────────────────────────────────────────────────────
    const { data: instance, error: instanceErr } = await supabase
      .from("eu_document_instances")
      .select("*")
      .eq("id", instanceId)
      .single();

    if (instanceErr || !instance) {
      return NextResponse.json({ error: "Document instance not found" }, { status: 404 });
    }

    const doc = instance as EUDocumentInstance;

    // ── 2. Fetch organisation name (if linked) ────────────────────────────────
    let orgName: string | null = null;
    if (doc.org_id) {
      const { data: org } = await supabase
        .from("organisations")
        .select("name")
        .eq("id", doc.org_id)
        .single();
      orgName = org?.name ?? null;
    }

    // ── 3. Fetch sections ordered by sort_order ───────────────────────────────
    const { data: sections, error: sectionsErr } = await supabase
      .from("eu_document_sections")
      .select("*")
      .eq("instance_id", instanceId)
      .order("sort_order", { ascending: true });

    if (sectionsErr) {
      return NextResponse.json(
        { error: "Failed to fetch sections", detail: sectionsErr.message },
        { status: 500 }
      );
    }

    const sectionRows = (sections ?? []) as EUDocumentSection[];

    // ── 4. Format date strings ────────────────────────────────────────────────
    const generatedDate = doc.generated_at
      ? new Date(doc.generated_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });

    const isoDate = new Date().toISOString().slice(0, 10); // for filename

    // ── 5. Build docx paragraphs ──────────────────────────────────────────────
    const bodyChildren: Paragraph[] = [];

    // Title
    bodyChildren.push(
      new Paragraph({
        text: doc.template_title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.LEFT,
        spacing: { after: 200 },
      })
    );

    // Subtitle line — organisation + date
    const subtitleParts: TextRun[] = [];
    if (orgName) {
      subtitleParts.push(
        new TextRun({ text: orgName, bold: true, size: 24 }),
        new TextRun({ text: "  |  ", size: 24, color: "888888" })
      );
    }
    subtitleParts.push(
      new TextRun({ text: `Generated ${generatedDate}`, size: 24, color: "444444" })
    );
    subtitleParts.push(
      new TextRun({ text: "  |  ", size: 24, color: "888888" }),
      new TextRun({ text: `Status: ${doc.status.replace("_", " ")}`, size: 24, italics: true, color: "444444" })
    );

    bodyChildren.push(
      new Paragraph({
        children: subtitleParts,
        spacing: { after: 120 },
      })
    );

    // Category line
    bodyChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Category: ", bold: true, size: 22, color: "555555" }),
          new TextRun({ text: doc.category, size: 22, color: "555555" }),
        ],
        spacing: { after: 400 },
      })
    );

    // Divider paragraph (simulated with bottom border via spacing)
    bodyChildren.push(
      new Paragraph({
        text: "",
        spacing: { after: 200 },
        border: {
          bottom: { color: "CCCCCC", size: 6, style: "single", space: 1 },
        },
      })
    );

    // Sections — one Heading 2 + paragraph per question
    for (const section of sectionRows) {
      // Question heading
      bodyChildren.push(
        new Paragraph({
          text: section.question_text,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 320, after: 120 },
        })
      );

      // Answer body
      const answerText =
        section.answer?.trim() ||
        "[No answer generated — please complete this section manually.]";

      // Split by double newline to preserve paragraph breaks from Claude
      const answerParagraphs = answerText.split(/\n\n+/);
      for (const para of answerParagraphs) {
        bodyChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: para.replace(/\n/g, " ").trim(),
                size: 22,
              }),
            ],
            spacing: { after: 160 },
          })
        );
      }

      // Status note for unapproved sections
      if (section.status !== "approved") {
        bodyChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "[ Draft — requires human review and approval before use ]",
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

    // Notes (if any)
    if (doc.notes) {
      bodyChildren.push(
        new Paragraph({
          text: "",
          spacing: { before: 400 },
          border: {
            top: { color: "CCCCCC", size: 6, style: "single", space: 1 },
          },
        })
      );
      bodyChildren.push(
        new Paragraph({
          children: [new TextRun({ text: "Notes", bold: true, size: 22 })],
          spacing: { after: 120 },
        })
      );
      bodyChildren.push(
        new Paragraph({
          children: [new TextRun({ text: doc.notes, size: 22 })],
        })
      );
    }

    // ── 6. Build Document with header/footer ──────────────────────────────────
    const wordDoc = new Document({
      sections: [
        {
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Anathem Regulatory Operations Platform",
                      size: 18,
                      color: "666666",
                    }),
                    new TextRun({
                      text: "  |  EU MDR Technical File  |  ",
                      size: 18,
                      color: "999999",
                    }),
                    new TextRun({
                      text: doc.template_title,
                      size: 18,
                      color: "666666",
                      italics: true,
                    }),
                  ],
                  alignment: AlignmentType.LEFT,
                  border: {
                    bottom: { color: "DDDDDD", size: 4, style: "single", space: 1 },
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
                      text: "CONFIDENTIAL — For internal regulatory use only.  Page ",
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
                    top: { color: "DDDDDD", size: 4, style: "single", space: 1 },
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

    // ── 7. Pack and return ────────────────────────────────────────────────────
    const buffer = await Packer.toBuffer(wordDoc);

    const safeSlug = doc.template_slug.replace(/_/g, "-");
    const filename = `${safeSlug}-${isoDate}.docx`;

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
    return NextResponse.json(
      { error: "Internal server error", detail: message },
      { status: 500 }
    );
  }
}
