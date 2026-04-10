import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function DELETE(req: NextRequest) {
  try {
    const { versionId } = await req.json() as { versionId: string };

    if (!versionId) {
      return NextResponse.json({ error: "versionId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("fact_versions")
      .delete()
      .eq("id", versionId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    console.error("[/api/source-docs/delete-version]", err);
    return NextResponse.json({ error: err.message ?? "Delete failed" }, { status: 500 });
  }
}
