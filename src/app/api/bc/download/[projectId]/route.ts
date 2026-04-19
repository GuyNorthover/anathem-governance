import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import PizZip from "pizzip";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Footer,
  PageNumber,
  NumberFormat,
} from "docx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── XML helpers ───────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Extract plain text from an XML block (strip all tags). */
function extractText(xml: string): string {
  return xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Parse the body XML into top-level block elements using depth tracking. */
function parseBodyBlocks(body: string): string[] {
  const blocks: string[] = [];
  let i = 0;
  let depth = 0;
  let blockStart = 0;

  while (i < body.length) {
    const lt = body.indexOf("<", i);
    if (lt === -1) break;

    const gt = body.indexOf(">", lt);
    if (gt === -1) break;

    const tag = body.slice(lt, gt + 1);
    const isClosing = tag[1] === "/";
    const isSelfClose = tag[gt - lt - 1] === "/";

    if (isClosing) {
      depth--;
      if (depth === 0) {
        const block = body.slice(blockStart, gt + 1).trim();
        if (block) blocks.push(block);
        blockStart = gt + 1;
      }
    } else if (!isSelfClose) {
      if (depth === 0) blockStart = lt;
      depth++;
    }
    // Self-closing tags at depth 0 are skipped (bookmarks, proofErr, etc.)

    i = gt + 1;
  }

  return blocks.filter((b) => b.trim());
}

/** Normalize a string for fuzzy title matching. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Return true if the block's text contains the section title (or a meaningful prefix). */
function blockMatchesTitle(blockText: string, title: string): boolean {
  const bt = norm(blockText);
  const t = norm(title);
  if (!t || t.length < 4) return false;
  const prefix = t.slice(0, Math.min(t.length, 30));
  return bt.includes(prefix);
}

/**
 * Convert generated prose content into DOCX XML paragraphs.
 * Preserves paragraph breaks. Bold-highlights any remaining [INSERT: ...] placeholders.
 */
function contentToXmlParas(content: string): string {
  const paras = content.split(/\n\n+/).filter((p) => p.trim());

  return paras
    .map((para) => {
      const lines = para
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join(" ");

      // Split on [INSERT: ...] placeholders and bold them
      const parts = lines.split(/(\[INSERT:[^\]]*\])/g);
      const runs = parts
        .map((part) => {
          if (part.startsWith("[INSERT:")) {
            return `<w:r><w:rPr><w:b/><w:color w:val="B45309"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">${escapeXml(part)}</w:t></w:r>`;
          }
          if (!part) return "";
          return `<w:r><w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">${escapeXml(part)}</w:t></w:r>`;
        })
        .join("");

      return `<w:p><w:pPr><w:jc w:val="both"/><w:spacing w:after="120"/></w:pPr>${runs}</w:p>`;
    })
    .join("");
}

/**
 * Inject section content into the original DOCX template XML.
 * Strategy:
 *  - Parse body into top-level blocks (paragraphs + tables)
 *  - Find each section heading (by matching section title text)
 *  - Delete guidance/placeholder paragraphs after the heading
 *  - Keep tables (structural elements)
 *  - Insert generated content paragraphs
 */
function injectContentIntoDocx(
  templateBuffer: Buffer,
  sections: Array<{ title: string; content: string }>
): Buffer {
  let zip: PizZip;
  try {
    zip = new PizZip(templateBuffer);
  } catch {
    return templateBuffer;
  }

  const docFile = zip.file("word/document.xml");
  if (!docFile) return templateBuffer;

  const xml = docFile.asText();
  const bodyMatch = xml.match(/(<w:body>)([\s\S]*?)(<\/w:body>)/);
  if (!bodyMatch) return templateBuffer;

  const [, bodyOpen, bodyContent, bodyClose] = bodyMatch;
  const blocks = parseBodyBlocks(bodyContent);

  // Build a lookup of norm(title) -> content
  const sectionTitles = sections.map((s) => norm(s.title));

  function findMatch(blockText: string): number {
    return sectionTitles.findIndex((t) => blockMatchesTitle(blockText, t));
  }

  const result: string[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];
    const blockText = extractText(block);
    const matchIdx = findMatch(blockText);

    if (matchIdx !== -1 && sections[matchIdx].content) {
      // Keep the heading/title block
      result.push(block);
      i++;

      // Skip existing guidance/body paragraphs until next section or structural boundary
      while (i < blocks.length) {
        const next = blocks[i];
        const nextText = extractText(next);

        // Stop if this block is another section heading
        if (findMatch(nextText) !== -1) break;

        // Stop at section properties (must stay at end of body)
        if (next.trimStart().startsWith("<w:sectPr")) break;

        // Keep tables (preserve structural elements like option comparison tables)
        if (next.trimStart().startsWith("<w:tbl")) break;

        // Skip existing paragraph content (guidance text)
        i++;
      }

      // Insert our generated content
      result.push(contentToXmlParas(sections[matchIdx].content));
    } else {
      result.push(block);
      i++;
    }
  }

  const newXml = xml.replace(
    /(<w:body>)([\s\S]*?)(<\/w:body>)/,
    `${bodyOpen}${result.join("")}${bodyClose}`
  );

  zip.file("word/document.xml", newXml);

  return zip.generate({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  }) as Buffer;
}

// ── Fallback: build from scratch with docx package ────────────────────────────

function parseContentToRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const re = /(\[INSERT:[^\]]*\])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push(new TextRun({ text: text.slice(last, m.index), size: 22 }));
    runs.push(new TextRun({ text: m[1], bold: true, size: 22 }));
    last = m.index + m[0].length;
  }
  if (last < text.length) runs.push(new TextRun({ text: text.slice(last), size: 22 }));
  return runs;
}

async function buildDocxFromScratch(
  project: { id: string; org_name: string },
  sections: Array<{ title: string; content: string; status: string }>
): Promise<Buffer> {
  const nowDate = new Date();
  const formattedDate = nowDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const bodyChildren: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: `Business Case: ${project.org_name}`, bold: true, size: 52, color: "1E1B4B" })],
      heading: HeadingLevel.TITLE,
      spacing: { after: 240 },
    }),
    new Paragraph({
      children: [new TextRun({ text: formattedDate, size: 22, color: "888888" })],
      spacing: { after: 480 },
    }),
  ];

  for (const section of sections) {
    bodyChildren.push(
      new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 160 } })
    );
    if (!section.content) continue;

    for (const para of section.content.split(/\n\n+/)) {
      const trimmed = para.replace(/\n/g, " ").trim();
      if (!trimmed) continue;
      bodyChildren.push(new Paragraph({ children: parseContentToRuns(trimmed), spacing: { after: 140 } }));
    }
  }

  const doc = new Document({
    sections: [{
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "DRAFT — Page ", size: 18, color: "888888" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888888" }),
                new TextRun({ text: " of ", size: 18, color: "888888" }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "888888" }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
      },
      properties: { page: { pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
      children: bodyChildren,
    }],
  });

  return Packer.toBuffer(doc);
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    // Fetch project
    const { data: projectRow, error: projectErr } = await supabase
      .from("bc_projects")
      .select("id, org_name, template_filename, status, template_binary")
      .eq("id", projectId)
      .single();

    if (projectErr || !projectRow) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch sections
    const { data: sectionRows } = await supabase
      .from("bc_sections")
      .select("title, draft_content, final_content, status, sort_order")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });

    const sections = (sectionRows ?? []).map((s: any) => ({
      title: s.title as string,
      content: ((s.final_content ?? s.draft_content ?? "") as string).trim(),
      status: s.status as string,
    }));

    const isoDate = new Date().toISOString().slice(0, 10);
    const safeOrg = projectRow.org_name.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const filename = `business-case-${safeOrg}-${isoDate}.docx`;

    let buffer: Buffer;

    if (projectRow.template_binary) {
      // Format-faithful: inject content into the original template
      const templateBuf = Buffer.from(projectRow.template_binary as string, "base64");
      buffer = injectContentIntoDocx(templateBuf, sections);
    } else {
      // Fallback: build from scratch
      buffer = await buildDocxFromScratch(projectRow, sections);
    }

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
