"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus, GitBranch, ChevronRight, Globe, Tag,
  Link2, FileText, Calendar, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { NewPathwayPanel } from "./NewPathwayPanel";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Pathway {
  id: string;
  name: string;
  description: string;
  jurisdiction: string;
  pathway_type: string;
  source_url: string | null;
  extracted_at: string;
  created_at: string;
  step_count: number;
  source_doc_name: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  regulatory_approval: "Regulatory Approval",
  clinical_safety: "Clinical Safety",
  data_governance: "Data Governance",
  procurement: "Procurement",
  certification: "Certification",
  post_market_surveillance: "Post-Market Surveillance",
  other: "Other",
};

const TYPE_COLOURS: Record<string, string> = {
  regulatory_approval: "bg-blue-100 text-blue-700",
  clinical_safety: "bg-red-100 text-red-700",
  data_governance: "bg-violet-100 text-violet-700",
  procurement: "bg-amber-100 text-amber-700",
  certification: "bg-emerald-100 text-emerald-700",
  post_market_surveillance: "bg-orange-100 text-orange-700",
  other: "bg-slate-100 text-slate-600",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return iso; }
}

export function PathwaysView() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [pathways,  setPathways]  = useState<Pathway[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  // Pre-selected doc from Source Docs "Extract as Pathway" CTA
  const [extractDocId, setExtractDocId] = useState<string | null>(null);

  // Auto-open panel when ?extract=jobId param is present
  useEffect(() => {
    const docId = searchParams.get("extract");
    if (docId) {
      setExtractDocId(docId);
      setPanelOpen(true);
      // Clean the URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.delete("extract");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  const loadPathways = useCallback(async () => {
    setLoading(true);

    const { data: pathwayRows } = await supabase
      .from("governance_pathways")
      .select("id, name, description, jurisdiction, pathway_type, source_url, source_document_id, extracted_at, created_at")
      .order("created_at", { ascending: false });

    if (!pathwayRows || pathwayRows.length === 0) {
      setPathways([]);
      setLoading(false);
      return;
    }

    // Get step counts
    const { data: stepCounts } = await supabase
      .from("pathway_steps")
      .select("pathway_id");

    const countMap: Record<string, number> = {};
    for (const row of stepCounts ?? []) {
      countMap[row.pathway_id] = (countMap[row.pathway_id] ?? 0) + 1;
    }

    // Get source document names
    const docIds = pathwayRows
      .map((p: any) => p.source_document_id)
      .filter(Boolean);

    const docNameMap: Record<string, string> = {};
    if (docIds.length > 0) {
      const { data: jobs } = await supabase
        .from("ingestion_jobs")
        .select("id, file_name")
        .in("id", docIds);
      for (const job of jobs ?? []) {
        docNameMap[job.id] = job.file_name;
      }
    }

    setPathways(
      pathwayRows.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        jurisdiction: p.jurisdiction,
        pathway_type: p.pathway_type,
        source_url: p.source_url,
        extracted_at: p.extracted_at ?? p.created_at,
        created_at: p.created_at,
        step_count: countMap[p.id] ?? 0,
        source_doc_name: p.source_document_id ? (docNameMap[p.source_document_id] ?? null) : null,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { loadPathways(); }, [loadPathways]);

  return (
    <>
      <div className="flex flex-col gap-6 p-8 h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Governance Pathways</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              AI-extracted regulatory and compliance pathways with per-organisation progress tracking.
            </p>
          </div>
          <Button onClick={() => setPanelOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-1.5 h-4 w-4" />
            New Pathway
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-sm text-slate-400 py-16 text-center">Loading pathways…</div>
        ) : pathways.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-200 py-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
              <GitBranch className="h-7 w-7 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">No pathways yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Extract a governance pathway from an uploaded document or a public URL.
              </p>
            </div>
            <Button onClick={() => setPanelOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-1.5 h-4 w-4" /> New Pathway
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {pathways.map((p) => (
              <button
                key={p.id}
                onClick={() => router.push(`/pathways/${p.id}`)}
                className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                {/* Icon */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                  <GitBranch className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 leading-snug">{p.name}</p>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400 flex-shrink-0 mt-0.5" />
                  </div>

                  {p.description && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">{p.description}</p>
                  )}

                  {/* Badges */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      TYPE_COLOURS[p.pathway_type] ?? "bg-slate-100 text-slate-600"
                    )}>
                      <Tag className="h-2.5 w-2.5" />
                      {TYPE_LABELS[p.pathway_type] ?? p.pathway_type}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      <Globe className="h-2.5 w-2.5" />
                      {p.jurisdiction}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      <Layers className="h-2.5 w-2.5" />
                      {p.step_count} step{p.step_count !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Source + date */}
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                    {p.source_doc_name ? (
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" /> {p.source_doc_name}
                      </span>
                    ) : p.source_url ? (
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <Link2 className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{p.source_url}</span>
                      </span>
                    ) : null}
                    <span className="flex items-center gap-1 flex-shrink-0">
                      <Calendar className="h-3 w-3" /> {formatDate(p.extracted_at)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <NewPathwayPanel
        open={panelOpen}
        defaultDocId={extractDocId ?? undefined}
        onClose={() => { setPanelOpen(false); setExtractDocId(null); }}
        onCreated={(id) => {
          setPanelOpen(false);
          setExtractDocId(null);
          router.push(`/pathways/${id}`);
        }}
      />
    </>
  );
}
