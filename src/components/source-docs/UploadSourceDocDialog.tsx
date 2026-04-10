"use client";

import { useState, useRef } from "react";
import {
  X, Upload, FileText, Loader2, Sparkles, Check,
  CheckSquare, Square, AlertCircle, ChevronDown, ChevronUp, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ExtractedItem {
  fact_key: string;
  display_name: string;
  current_value: string;
  description: string;
  domain: string;
  tier: string;
  module: null;
}

interface ExtractResult {
  prefix: string;
  title: string;
  fileName: string;
  documentDate: string;
  documentVersion: string;
  items: ExtractedItem[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: (prefix: string, title: string) => void;
}

export function UploadSourceDocDialog({ open, onClose, onImported }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractResult | null>(null);
  // Editable metadata
  const [docTitle, setDocTitle] = useState("");
  const [docDate, setDocDate] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function reset() {
    setFile(null);
    setExtracting(false);
    setExtractError(null);
    setResult(null);
    setDocTitle("");
    setDocDate("");
    setSelected(new Set());
    setExpandedSections(new Set());
    setImporting(false);
    setImportError(null);
  }

  async function handleExtract() {
    if (!file) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/source-docs/extract", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Extraction failed");
      setResult(json);
      setDocTitle(json.title);
      setDocDate(json.documentDate ?? new Date().toISOString().slice(0, 10));
      setSelected(new Set(json.items.map((_: any, i: number) => i)));
      const sects = new Set<string>(json.items.map((item: ExtractedItem) => item.description));
      setExpandedSections(sects);
    } catch (err: any) {
      setExtractError(err.message ?? "Extraction failed");
    } finally {
      setExtracting(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setImporting(true);
    setImportError(null);

    const toSave = result.items.filter((_, i) => selected.has(i));

    try {
      const res = await fetch("/api/source-docs/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefix: result.prefix,
          title: docTitle || result.title,
          documentDate: docDate || result.documentDate,
          items: toSave,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      onImported(result.prefix, docTitle || result.title);
      reset();
    } catch (err: any) {
      setImportError(err.message ?? "Save failed");
    } finally {
      setImporting(false);
    }
  }

  // Group items by section
  const sections: Map<string, { item: ExtractedItem; idx: number }[]> = result
    ? result.items.reduce<Map<string, { item: ExtractedItem; idx: number }[]>>((acc, item, idx) => {
        const sec = item.description || "General";
        if (!acc.has(sec)) acc.set(sec, []);
        acc.get(sec)!.push({ item, idx });
        return acc;
      }, new Map())
    : new Map();

  const allSelected = result ? selected.size === result.items.length : false;

  function toggleSection(sec: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sec)) next.delete(sec); else next.add(sec);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => { reset(); onClose(); }} />
      <div className={cn(
        "relative z-10 flex flex-col bg-white rounded-xl shadow-2xl border border-slate-200 w-full mx-4",
        result ? "max-w-3xl max-h-[92vh]" : "max-w-lg"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              {result ? "Review Extracted Q&A" : "Upload Source Document"}
            </h2>
          </div>
          <button onClick={() => { reset(); onClose(); }} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Upload step ── */}
        {!result && (
          <div className="p-6 flex flex-col gap-4">
            <p className="text-sm text-slate-500">
              Upload one of Anathem's governance documents. Claude will extract every question and answer, preserving all detail.
            </p>

            <div
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors",
                file ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
              )}
            >
              <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setExtractError(null); } }} />
              {file ? (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{file.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-slate-300" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-600">Click to select a document</p>
                    <p className="text-xs text-slate-400 mt-0.5">PDF or DOCX</p>
                  </div>
                </>
              )}
            </div>

            {extracting && (
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-700">Claude is reading the document…</p>
                  <p className="text-xs text-blue-500 mt-0.5">Extracting all Q&A — 30–60 seconds</p>
                </div>
              </div>
            )}
            {extractError && (
              <p className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />{extractError}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { reset(); onClose(); }}>Cancel</Button>
              <Button size="sm" disabled={!file || extracting} onClick={handleExtract}>
                {extracting
                  ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Extracting…</>
                  : <><Sparkles className="mr-1.5 h-4 w-4" />Extract Q&A</>}
              </Button>
            </div>
          </div>
        )}

        {/* ── Review step ── */}
        {result && (
          <>
            {/* Document metadata row */}
            <div className="flex items-end gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Document Title</label>
                <input
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Document Date
                </label>
                <input
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-2 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelected(allSelected ? new Set() : new Set(result.items.map((_, i) => i)))}
                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  {allSelected ? <CheckSquare className="h-4 w-4 text-blue-500" /> : <Square className="h-4 w-4" />}
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
                <span className="text-xs text-slate-400">{selected.size} of {result.items.length} items</span>
              </div>
              <span className="text-xs text-slate-400">{sections.size} sections</span>
            </div>

            {/* Sections */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {Array.from(sections.entries()).map(([section, entries]) => {
                const expanded = expandedSections.has(section);
                const sectionSelected = entries.filter((e: { item: ExtractedItem; idx: number }) => selected.has(e.idx)).length;
                return (
                  <div key={section}>
                    <button
                      onClick={() => toggleSection(section)}
                      className="flex w-full items-center justify-between px-6 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {expanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronUp className="h-3.5 w-3.5 text-slate-400" />}
                        <span className="text-xs font-semibold text-slate-700">{section}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{sectionSelected}/{entries.length} selected</span>
                    </button>
                    {expanded && entries.map(({ item, idx }) => (
                      <div
                        key={idx}
                        onClick={() => {
                          const next = new Set(selected);
                          if (next.has(idx)) next.delete(idx); else next.add(idx);
                          setSelected(next);
                        }}
                        className={cn(
                          "flex items-start gap-3 px-6 py-3 cursor-pointer transition-colors border-b border-slate-50",
                          selected.has(idx) ? "bg-white hover:bg-blue-50/30" : "bg-slate-50/40 opacity-50"
                        )}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {selected.has(idx)
                            ? <CheckSquare className="h-4 w-4 text-blue-500" />
                            : <Square className="h-4 w-4 text-slate-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700 mb-1">{item.display_name}</p>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.current_value}</p>
                          <code className="mt-1 inline-block text-[10px] font-mono text-slate-400">{item.fact_key}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-white">
              <button onClick={() => setResult(null)} className="text-xs text-slate-500 hover:text-slate-700">← Back</button>
              <div className="flex items-center gap-3">
                {importError && <p className="text-xs text-red-600 max-w-xs">{importError}</p>}
                <Button size="sm" disabled={selected.size === 0 || importing} onClick={handleSave}>
                  {importing
                    ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Saving…</>
                    : <>Save {selected.size} item{selected.size !== 1 ? "s" : ""}</>}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
