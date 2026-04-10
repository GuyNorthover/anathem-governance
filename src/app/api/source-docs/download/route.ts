import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, Header, Footer, PageNumber,
  convertInchesToTwip, WidthType, ShadingType,
} from "docx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const NAVY = "1E3A5F";
const GREY_BG = "F3F4F6";
const BORDER = "E5E7EB";
const WHITE = "FFFFFF";

function cell(children: Paragraph[], opts: { width: number; bg?: string; bold?: boolean }) {
  return new TableCell({
    width: { size: opts.width, type: WidthType.PERCENTAGE },
    shading: opts.bg ? { type: ShadingType.CLEAR, fill: opts.bg, color: opts.bg } : undefined,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
    },
    margins: { top: 80, bottom: 80, left: 160, right: 160 },
    children,
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const prefix = searchParams.get("prefix");
  const title = searchParams.get("title") ?? prefix ?? "Document";

  if (!prefix) return NextResponse.json({ error: "prefix required" }, { status: 400 });

  const { data: facts, error } = await supabase
    .from("facts")
    .select("fact_key, display_name, current_value, description")
    .like("fact_key", `${prefix}.%`)
    .not("current_value", "is", null)
    .neq("current_value", "")
    .order("description, fact_key");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!facts?.length) return NextResponse.json({ error: "No content found" }, { status: 404 });

  const sections = new Map<string, typeof facts>();
  for (const f of facts) {
    const s = (f.description ?? "General").trim();
    if (!sections.has(s)) sections.set(s, []);
    sections.get(s)!.push(f);
  }

  const dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const tableRows: TableRow[] = [
    // Column headers
    new TableRow({
      children: [
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: "374151", color: "374151" },
          borders: { top: { style: BorderStyle.NONE, size: 0, color: WHITE }, bottom: { style: BorderStyle.NONE, size: 0, color: WHITE }, left: { style: BorderStyle.NONE, size: 0, color: WHITE }, right: { style: BorderStyle.NONE, size: 0, color: WHITE } },
          margins: { top: 80, bottom: 80, left: 160, right: 160 },
          children: [new Paragraph({ children: [new TextRun({ text: "QUESTION / CRITERION", bold: true, size: 17, color: WHITE, font: "Calibri", allCaps: true })] })],
        }),
        new TableCell({
          width: { size: 55, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: "374151", color: "374151" },
          borders: { top: { style: BorderStyle.NONE, size: 0, color: WHITE }, bottom: { style: BorderStyle.NONE, size: 0, color: WHITE }, left: { style: BorderStyle.NONE, size: 0, color: WHITE }, right: { style: BorderStyle.NONE, size: 0, color: WHITE } },
          margins: { top: 80, bottom: 80, left: 160, right: 160 },
          children: [new Paragraph({ children: [new TextRun({ text: "ANATHEM RESPONSE", bold: true, size: 17, color: WHITE, font: "Calibri", allCaps: true })] })],
        }),
      ],
    }),
  ];

  for (const [section, items] of Array.from(sections.entries())) {
    // Section heading row
    tableRows.push(new TableRow({
      children: [new TableCell({
        columnSpan: 2,
        shading: { type: ShadingType.CLEAR, fill: NAVY, color: NAVY },
        borders: { top: { style: BorderStyle.NONE, size: 0, color: WHITE }, bottom: { style: BorderStyle.NONE, size: 0, color: WHITE }, left: { style: BorderStyle.NONE, size: 0, color: WHITE }, right: { style: BorderStyle.NONE, size: 0, color: WHITE } },
        margins: { top: 120, bottom: 120, left: 160, right: 160 },
        children: [new Paragraph({ children: [new TextRun({ text: section, bold: true, size: 22, color: WHITE, font: "Calibri", allCaps: true })] })],
      })],
    }));

    for (const fact of items) {
      const lines = (fact.current_value ?? "").split(/\n+/).filter(Boolean);
      tableRows.push(new TableRow({
        children: [
          cell([new Paragraph({ children: [new TextRun({ text: fact.display_name ?? "", bold: true, size: 19, color: "374151", font: "Calibri" })] })], { width: 45, bg: GREY_BG }),
          cell(
            lines.length
              ? lines.map((l: string) => new Paragraph({ children: [new TextRun({ text: l.trim(), size: 19, color: "1F2937", font: "Calibri" })], spacing: { after: 40 } }))
              : [new Paragraph({ children: [new TextRun({ text: "", size: 19, font: "Calibri" })] })],
            { width: 55 }
          ),
        ],
      }));
    }
  }

  const doc = new Document({
    creator: "Anathem",
    title: title ?? "",
    styles: { default: { document: { run: { font: "Calibri", size: 20 } } } },
    sections: [{
      properties: {
        page: { margin: { top: convertInchesToTwip(0.8), right: convertInchesToTwip(0.8), bottom: convertInchesToTwip(0.8), left: convertInchesToTwip(0.8) } },
      },
      headers: {
        default: new Header({ children: [new Paragraph({ children: [new TextRun({ text: "ANATHEM — CONFIDENTIAL", size: 16, color: "9CA3AF", font: "Calibri", allCaps: true })], alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: BORDER } } })] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph({ children: [new TextRun({ text: `${title}   ·   ${dateStr}   ·   Page `, size: 15, color: "9CA3AF", font: "Calibri" }), new TextRun({ children: [PageNumber.CURRENT], size: 15, color: "9CA3AF", font: "Calibri" }), new TextRun({ text: " of ", size: 15, color: "9CA3AF", font: "Calibri" }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 15, color: "9CA3AF", font: "Calibri" })], border: { top: { style: BorderStyle.SINGLE, size: 3, color: BORDER } } })] }),
      },
      children: [
        new Paragraph({ children: [new TextRun({ text: "ANATHEM LIMITED", size: 20, bold: true, color: "6B7280", font: "Calibri", allCaps: true })], spacing: { after: 80 } }),
        new Paragraph({ children: [new TextRun({ text: title ?? "", bold: true, size: 52, color: NAVY, font: "Calibri" })], spacing: { after: 160 } }),
        new Paragraph({ children: [new TextRun({ text: `Generated: ${dateStr}   ·   ${facts.length} responses`, size: 18, color: "6B7280", font: "Calibri" })], spacing: { after: 400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY } } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE, size: 0, color: WHITE }, bottom: { style: BorderStyle.NONE, size: 0, color: WHITE }, left: { style: BorderStyle.NONE, size: 0, color: WHITE }, right: { style: BorderStyle.NONE, size: 0, color: WHITE } },
          rows: tableRows,
        }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${(prefix ?? "document").replace(/[^a-z0-9_-]/gi, "_")}.docx"`,
      "Cache-Control": "no-store",
    },
  });
}
