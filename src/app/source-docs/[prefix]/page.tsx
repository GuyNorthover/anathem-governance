"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { SourceDocDetailView } from "@/components/source-docs/SourceDocDetailView";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: { prefix: string };
}

export default function SourceDocDetailPage({ params }: Props) {
  const prefix = params.prefix;
  const [title, setTitle] = useState<string>(prefix);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("ingestion_jobs")
      .select("file_name")
      .eq("file_path", prefix)
      .eq("status", "source_doc")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setTitle(data.file_name);
        setLoading(false);
      });
  }, [prefix]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Loading…
      </div>
    );
  }

  return <SourceDocDetailView prefix={prefix} title={title} />;
}
