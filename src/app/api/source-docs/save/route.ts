import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SaveItem {
  fact_key: string;
  display_name: string;
  current_value: string;
  description: string;
  domain: string;
  tier: string;
}

export async function POST(req: NextRequest) {
  try {
    const { prefix, title, documentDate, items } = await req.json() as {
      prefix: string;
      title: string;
      documentDate: string; // ISO date string — date of the document, not upload
      items: SaveItem[];
    };

    if (!prefix || !title || !items?.length) {
      return NextResponse.json({ error: "prefix, title and items are required" }, { status: 400 });
    }

    // Deduplicate by fact_key (keep last occurrence)
    const deduped = (items as SaveItem[]).reduce<SaveItem[]>((acc, f) => {
      const idx = acc.findIndex((x) => x.fact_key === f.fact_key);
      if (idx >= 0) acc[idx] = f; else acc.push(f);
      return acc;
    }, []);

    const keys = deduped.map((f) => f.fact_key);
    const now = new Date().toISOString();
    const docDate = documentDate || now;

    // ── 1. Fetch existing facts by key ─────────────────────────────────
    const { data: existing, error: fetchErr } = await supabase
      .from("facts")
      .select("id, fact_key")
      .in("fact_key", keys);

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    const existingMap = new Map((existing ?? []).map((r: any) => [r.fact_key as string, r.id as string]));

    // ── 2. Fetch current max version numbers ───────────────────────────
    const existingIds = Array.from(existingMap.values());
    let versionMap = new Map<string, number>(); // fact_id → max version_number

    if (existingIds.length > 0) {
      const { data: versions } = await supabase
        .from("fact_versions")
        .select("fact_id, version_number")
        .in("fact_id", existingIds);

      for (const v of versions ?? []) {
        const cur = versionMap.get(v.fact_id) ?? 0;
        if (v.version_number > cur) versionMap.set(v.fact_id, v.version_number);
      }
    }

    // ── 3. Insert or update each fact + create version entry ──────────
    const versionInserts: any[] = [];

    for (const f of deduped) {
      const existingId = existingMap.get(f.fact_key);

      let factId: string;

      if (existingId) {
        // UPDATE existing fact
        const { error } = await supabase
          .from("facts")
          .update({
            current_value: f.current_value,
            display_name: f.display_name,
            description: f.description,
            domain: f.domain,
            tier: f.tier,
            updated_at: now,
          })
          .eq("id", existingId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        factId = existingId;
      } else {
        // INSERT new fact
        factId = crypto.randomUUID();
        const { error: insertErr } = await supabase.from("facts").insert({
          id: factId,
          fact_key: f.fact_key,
          display_name: f.display_name,
          description: f.description,
          tier: f.tier,
          domain: f.domain,
          value_type: "string",
          current_value: f.current_value,
          module_id: null,
          created_by: null,
        } as any);
        if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      // Build version entry — changed_at = DOCUMENT date, change_reason = document title
      const nextVersion = (versionMap.get(factId) ?? 0) + 1;
      versionInserts.push({
        id: crypto.randomUUID(),
        fact_id: factId,
        version_number: nextVersion,
        value: f.current_value,
        changed_by: null,
        changed_at: docDate,
        change_reason: title, // document title — shown in version history
      });
    }

    // ── 4. Bulk insert version entries ─────────────────────────────────
    if (versionInserts.length > 0) {
      const { error: verErr } = await supabase
        .from("fact_versions")
        .insert(versionInserts);
      if (verErr) return NextResponse.json({ error: verErr.message }, { status: 500 });
    }

    // ── 5. Record the document in ingestion_jobs ───────────────────────
    // Remove old entry for same prefix first (keep only latest per prefix)
    await supabase
      .from("ingestion_jobs")
      .delete()
      .eq("file_path", prefix)
      .eq("status", "source_doc");

    const { error: jobErr } = await supabase.from("ingestion_jobs").insert({
      id: crypto.randomUUID(),
      file_name: title,
      file_path: prefix,
      file_type: "source_doc",
      org_id: null,
      status: "source_doc",
      uploaded_by: null,
    });

    if (jobErr) return NextResponse.json({ error: jobErr.message }, { status: 500 });

    return NextResponse.json({ saved: deduped.length });
  } catch (err: any) {
    console.error("[/api/source-docs/save]", err);
    return NextResponse.json({ error: err.message ?? "Save failed" }, { status: 500 });
  }
}
