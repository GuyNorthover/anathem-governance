"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, ChevronRight, BookOpen, Download, Wand2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { UploadSourceDocDialog } from "./UploadSourceDocDialog";
import { CreateSourceDocDialog } from "./CreateSourceDocDialog";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SourceDoc {
  id: string;
  title: string;
  prefix: string;
  uploadedAt: string;
  itemCount: number;
}

export function SourceDocsView() {
  const router = useRouter();
  const [docs, setDocs] = useState<SourceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const loadDocs = useCallback(async () => {
    setLoading(true);

    // Get internal ingestion jobs
    const { data: jobs } = await supabase
      .from("ingestion_jobs")
      .select("id, file_name, file_path, created_at")
      .eq("status", "source_doc")
      .order("created_at", { ascending: false });

    if (!jobs || jobs.length === 0) {
      setDocs([]);
      setLoading(false);
      return;
    }

    // Get fact counts per prefix
    const prefixes = jobs.map((j: any) => j.file_path as string);
    const { data: allFacts } = await supabase
      .from("facts")
      .select("fact_key");

    const countByPrefix: Record<string, number> = {};
    for (const prefix of prefixes) {
      countByPrefix[prefix] = (allFacts ?? []).filter((f: any) =>
        (f.fact_key as string).startsWith(`${prefix}.`)
      ).length;
    }

    // Deduplicate by prefix — keep most recent
    const seen = new Set<string>();
    const result: SourceDoc[] = [];
    for (const job of jobs as any[]) {
      if (!seen.has(job.file_path)) {
        seen.add(job.file_path);
        result.push({
          id: job.id,
          title: job.file_name,
          prefix: job.file_path,
          uploadedAt: new Date(job.created_at).toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric",
          }),
          itemCount: countByPrefix[job.file_path] ?? 0,
        });
      }
    }

    setDocs(result);
    setLoading(false);
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  function handleDownload(doc: SourceDoc, e: React.MouseEvent) {
    e.stopPropagation();
    const url = `/api/source-docs/download?prefix=${encodeURIComponent(doc.prefix)}&title=${encodeURIComponent(doc.title)}`;
    window.open(url, "_blank");
  }

  const DOC_LABELS: Record<string, string> = {
    dtac: "Digital Technology Assessment Criteria",
    dpia: "Data Protection Impact Assessment",
    eia: "Equality Impact Assessment",
    clinical_risk: "Clinical Risk Management Plan",
    clinical_safety: "Clinical Safety Case Report",
    infrastructure: "Third Party Infrastructure Assessment",
    cyber_security: "Third Party Cyber Security Assessment",
    declaration_conformity: "UK Declaration of Conformity",
  };

  return (
    <>
      <div className="flex flex-col gap-6 p-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Source Documents</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Anathem's internal governance documents — each broken down into Q&amp;A. Answers are the source of truth for all generated documents.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>
              <Upload className="mr-1.5 h-4 w-4" />
              Upload Completed Doc
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="bg-violet-600 hover:bg-violet-700">
              <Wand2 className="mr-1.5 h-4 w-4" />
              Create New Document
            </Button>
          </div>
        </div>

        {/* Document grid */}
        {loading ? (
          <div className="text-sm text-slate-400 py-12 text-center">Loading…</div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-200 py-16">
            <BookOpen className="h-10 w-10 text-slate-200" />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">No source documents uploaded yet</p>
              <p className="text-xs text-slate-400 mt-1">Upload your DTAC, DPIA, Clinical Safety Case, and other governance documents</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>
                <Upload className="mr-1.5 h-4 w-4" /> Upload completed doc
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)} className="bg-violet-600 hover:bg-violet-700">
                <Wand2 className="mr-1.5 h-4 w-4" /> Create new document
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => router.push(`/source-docs/${doc.prefix}`)}
                className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                  <FileText className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 leading-snug truncate">{doc.title}</p>
                  {DOC_LABELS[doc.prefix] && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{DOC_LABELS[doc.prefix]}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{doc.itemCount}</span> items
                    </span>
                    <span className="text-slate-200">·</span>
                    <span className="text-xs text-slate-400">Uploaded {doc.uploadedAt}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400" />
                  <button
                    onClick={(e) => handleDownload(doc, e)}
                    className="text-[10px] text-slate-400 hover:text-blue-500 flex items-center gap-0.5 mt-auto"
                  >
                    <Download className="h-3 w-3" /> PDF
                  </button>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Info box */}
        {docs.length > 0 && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs text-blue-700">
              <span className="font-semibold">How this works:</span> Each document's Q&amp;A is stored in the Knowledge Base as facts (e.g. <code className="font-mono bg-blue-100 px-1 rounded">dtac.clinical_safety.evaluation</code>). When generating documents for NHS trusts, these facts are automatically used as the source of truth.
            </p>
          </div>
        )}
      </div>

      <UploadSourceDocDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onImported={(prefix, title) => {
          setUploadOpen(false);
          loadDocs();
          router.push(`/source-docs/${prefix}`);
        }}
      />

      <CreateSourceDocDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onImported={(prefix, title) => {
          setCreateOpen(false);
          loadDocs();
          router.push(`/source-docs/${prefix}`);
        }}
      />
    </>
  );
}
