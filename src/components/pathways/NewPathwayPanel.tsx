"use client";

import { useState, useEffect } from "react";
import {
  X, FileText, Link2, Loader2, AlertCircle, Info,
  ChevronDown, Clock, CheckSquare, Square,
  GripVertical, ArrowUp, ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SourceDoc {
  id: string;
  file_name: string;
  file_path: string;
}

interface Props {
  open: boolean;
  defaultDocId?: string;   // pre-select a document (from Source Docs CTA)
  onClose: () => void;
  onCreated: (pathwayId: string) => void;
}

type SourceMode = "document" | "url";

// Estimated time per chunk (55k chars ≈ 1 Claude call ≈ ~60-120s)
function estimateMinutes(docs: SourceDoc[], selectedIds: string[]): { min: number; max: number } | null {
  if (selectedIds.length === 0) return null;
  // We don't know document sizes, so give a conservative estimate per doc
  // Assume each large document has ~3 chunks on average
  const estimatedChunks = selectedIds.length * 3;
  return {
    min: Math.round(estimatedChunks * 0.75),
    max: Math.round(estimatedChunks * 2),
  };
}

// ── Loading phase display ──────────────────────────────────────────────────────

const LOADING_PHASES = [
  "Reading documents…",
  "Extracting regulatory steps from document 1…",
  "Merging additional document content…",
  "Resolving step dependencies…",
  "Finalising pathway structure…",
  "Still processing — large documents take time…",
  "Almost there — saving pathway…",
];

function useLoadingPhase(loading: boolean): string {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!loading) { setPhase(0); return; }
    const interval = setInterval(() => {
      setPhase((p) => Math.min(p + 1, LOADING_PHASES.length - 1));
    }, 18000); // advance phase every 18s
    return () => clearInterval(interval);
  }, [loading]);

  return LOADING_PHASES[phase];
}

// ── Main component ─────────────────────────────────────────────────────────────

export function NewPathwayPanel({ open, defaultDocId, onClose, onCreated }: Props) {
  const [mode, setMode] = useState<SourceMode>("document");
  const [docs, setDocs] = useState<SourceDoc[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]); // ordered
  const [url, setUrl] = useState("");
  const [pathwayName, setPathwayName] = useState("");
  const [jurisdiction, setJurisdiction] = useState("EU");
  const [pathwayType, setPathwayType] = useState("regulatory_approval");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const loadingPhase = useLoadingPhase(loading);

  useEffect(() => {
    if (!open) return;
    supabase
      .from("ingestion_jobs")
      .select("id, file_name, file_path")
      .eq("status", "source_doc")
      .order("created_at", { ascending: false })
      .then(({ data }) => setDocs(data ?? []));
  }, [open]);

  // Pre-select a document when opened from Source Docs "Extract as Pathway" CTA
  useEffect(() => {
    if (open && defaultDocId) {
      setSelectedDocIds([defaultDocId]);
      setMode("document");
    }
  }, [open, defaultDocId]);

  // Elapsed timer
  useEffect(() => {
    if (!loading) { setElapsedSeconds(0); return; }
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [loading]);

  function reset() {
    setMode("document");
    setSelectedDocIds([]);
    setUrl("");
    setPathwayName("");
    setJurisdiction("EU");
    setPathwayType("regulatory_approval");
    setLoading(false);
    setError(null);
    setElapsedSeconds(0);
  }

  function toggleDoc(id: string) {
    setSelectedDocIds((prev) =>
      prev.includes(id)
        ? prev.filter((d) => d !== id)
        : prev.length >= 5
          ? prev
          : [...prev, id]
    );
  }

  function moveDoc(id: string, direction: "up" | "down") {
    setSelectedDocIds((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const next = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }

  async function handleSubmit() {
    setError(null);

    if (mode === "document" && selectedDocIds.length === 0) {
      setError("Please select at least one document.");
      return;
    }
    if (mode === "url" && !url.trim()) {
      setError("Please enter a URL.");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        jurisdiction,
        pathway_type: pathwayType,
      };
      if (pathwayName.trim()) body.pathway_name = pathwayName.trim();

      if (mode === "document") {
        body.document_ids = selectedDocIds;
      } else {
        body.url = url.trim();
      }

      const res = await fetch("/api/pathways/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Extraction failed");
      reset();
      onCreated(json.pathway_id);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const estimate = estimateMinutes(docs, selectedDocIds);

  const formatElapsed = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => { if (!loading) { reset(); onClose(); } }}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-[520px] bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">New Governance Pathway</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Extract steps from one or more regulatory documents</p>
          </div>
          {!loading && (
            <button onClick={() => { reset(); onClose(); }} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">

          {/* Time warning */}
          <div className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <Clock className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 leading-relaxed">
              <p className="font-semibold mb-0.5">Large documents take significant time</p>
              <p>
                Regulatory PDFs are processed in 55,000-character segments. Each segment requires
                a separate AI pass (~60–120 seconds). A single large document typically takes
                3–8 minutes; multiple documents may take 15–40 minutes. Do not close this panel
                while processing.
              </p>
            </div>
          </div>

          {/* Info note */}
          <div className="flex gap-2.5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              For best results, upload PDFs as source documents first using Source Docs.
              URL import works for HTML pages only — PDFs behind URLs are not supported.
              When using multiple documents, order them from the primary regulation to supporting guidance.
            </p>
          </div>

          {/* Source mode toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Source type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["document", "url"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  disabled={loading}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                    mode === m
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {m === "document" ? <FileText className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                  {m === "document" ? "Uploaded documents" : "From URL"}
                </button>
              ))}
            </div>
          </div>

          {/* Source input */}
          {mode === "document" ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-600">
                  Select documents
                  <span className="ml-1.5 text-slate-400 font-normal">(max 5, in processing order)</span>
                </label>
                {selectedDocIds.length > 0 && (
                  <span className="text-[11px] font-semibold text-blue-600">
                    {selectedDocIds.length} selected
                  </span>
                )}
              </div>

              {docs.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-3">
                  No source documents uploaded yet. Upload documents from the Source Docs section first.
                </p>
              ) : (
                <div className="flex flex-col gap-1 rounded-lg border border-slate-200 overflow-hidden">
                  {docs.map((doc) => {
                    const isSelected = selectedDocIds.includes(doc.id);
                    const orderIdx = selectedDocIds.indexOf(doc.id);
                    const isMaxed = !isSelected && selectedDocIds.length >= 5;

                    return (
                      <button
                        key={doc.id}
                        onClick={() => !loading && toggleDoc(doc.id)}
                        disabled={loading || isMaxed}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                          isSelected
                            ? "bg-blue-50"
                            : isMaxed
                              ? "opacity-40 cursor-not-allowed bg-white"
                              : "bg-white hover:bg-slate-50"
                        )}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-300 flex-shrink-0" />
                        )}
                        <FileText className={cn("h-3.5 w-3.5 flex-shrink-0", isSelected ? "text-blue-500" : "text-slate-400")} />
                        <span className={cn("text-xs flex-1 truncate", isSelected ? "font-medium text-slate-800" : "text-slate-600")}>
                          {doc.file_name}
                        </span>
                        {isSelected && (
                          <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                            {orderIdx + 1}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected order control */}
              {selectedDocIds.length > 1 && (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Processing order (drag to reorder)
                  </p>
                  <div className="flex flex-col gap-1">
                    {selectedDocIds.map((id, idx) => {
                      const doc = docs.find((d) => d.id === id);
                      if (!doc) return null;
                      return (
                        <div key={id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <GripVertical className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                          <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                            {idx + 1}
                          </span>
                          <span className="flex-1 text-xs text-slate-700 truncate">{doc.file_name}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => moveDoc(id, "up")}
                              disabled={idx === 0 || loading}
                              className="rounded p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => moveDoc(id, "down")}
                              disabled={idx === selectedDocIds.length - 1 || loading}
                              className="rounded p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Time estimate */}
              {estimate && !loading && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Clock className="h-3 w-3" />
                  Estimated processing time: {estimate.min}–{estimate.max} minutes
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">URL</label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://eur-lex.europa.eu/..."
                className="text-sm"
                disabled={loading}
              />
              <p className="mt-1.5 text-[11px] text-slate-400">
                Must be a publicly accessible HTML page. PDF URLs are not supported.
              </p>
            </div>
          )}

          {/* Optional metadata */}
          <div className="border-t border-slate-100 pt-4 flex flex-col gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Optional overrides
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pathway name</label>
              <Input
                value={pathwayName}
                onChange={(e) => setPathwayName(e.target.value)}
                placeholder="Auto-detected from document"
                className="text-sm"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Jurisdiction</label>
                <div className="relative">
                  <select
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    disabled={loading}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                  >
                    {["UK", "EU", "US", "UK/EU", "Global"].map((j) => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Type</label>
                <div className="relative">
                  <select
                    value={pathwayType}
                    onChange={(e) => setPathwayType(e.target.value)}
                    disabled={loading}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                  >
                    {[
                      ["regulatory_approval",    "Regulatory Approval"],
                      ["clinical_safety",        "Clinical Safety"],
                      ["data_governance",        "Data Governance"],
                      ["procurement",            "Procurement"],
                      ["certification",          "Certification"],
                      ["post_market_surveillance","Post-Market Surveillance"],
                      ["other",                  "Other"],
                    ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-slate-200 px-6 py-4 bg-white">
          {loading ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 flex-shrink-0" />
                <span className="text-xs text-slate-700">{loadingPhase}</span>
                <span className="ml-auto text-[11px] text-slate-400">{formatElapsed(elapsedSeconds)}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full bg-blue-500 transition-all duration-1000 rounded-full"
                  style={{ width: `${Math.min(95, (elapsedSeconds / (estimate ? estimate.max * 60 : 300)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                Do not close this panel. Large regulatory documents can take 15–40 minutes to process.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={() => { reset(); onClose(); }}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <Button
                disabled={
                  (mode === "document" && selectedDocIds.length === 0) ||
                  (mode === "url" && !url.trim())
                }
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {selectedDocIds.length > 1
                  ? `Extract from ${selectedDocIds.length} documents`
                  : "Extract Pathway"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
