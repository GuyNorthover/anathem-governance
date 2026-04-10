"use client";

import { useState, useRef } from "react";
import {
  X, Upload, FileText, Loader2, Sparkles, Check,
  CheckSquare, Square, AlertCircle, ChevronDown, ChevronUp,
  Calendar, Wand2, CircleCheck, CircleDashed, CircleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
type FillStatus = "filled" | "partial" | "empty";

interface ExtractedItem {
  fact_key: string;
  display_name: string;
  current_value: string;
  description: string;
  domain: string;
  tier: string;
  module: null;
  fillStatus?: FillStatus;
  usedFacts?: string[];
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

type Step = "upload" | "extracting" | "filling" | "review";

const STATUS_CONFIG: Record<FillStatus, {
  label: string;
  icon: React.ElementType;
  badge: string;
  row: string;
}> = {
  filled: {
    label: "Auto-filled",
    icon: CircleCheck,
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    row: "border-l-2 border-l-emerald-400",
  },
  partial: {
    label: "Partial",
    icon: CircleAlert,
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    row: "border-l-2 border-l-amber-400",
  },
  empty: {
    label: "Empty",
    icon: CircleDashed,
    badge: "bg-red-100 text-red-600 border-red-200",
    row: "border-l-2 border-l-red-300 bg-red-50/30",
  },
};

export function CreateSourceDocDialog({ open, onClose, onImported }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>("upload");
  const [extractError, setExtractError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractResult | null>(null);

  const [docTitle, setDocTitle] = useState("");
  const [docDate, setDocDate] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editBuf, setEditBuf] = useState("");

  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function reset() {
    setFile(null);
    setStep("upload");
    setExtractError(null);
    setResult(null);
    setDocTitle("");
    setDocDate("");
    setSelected(new Set());
    setExpandedSections(new Set());
    setEditingIdx(null);
    setEditBuf("");
    setImporting(false);
    setImportError(null);
  }

  // ── Step 1→2: Extract questions from document ──────────────────────
  async function handleExtract() {
    if (!file) return;
    setStep("extracting");
    setExtractError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/source-docs/extract", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Extraction failed");

      const extracted: ExtractResult = {
        ...json,
        items: json.items.map((item: ExtractedItem) => ({
          ...item,
          current_value: item.current_value ?? "",
          fillStatus: undefined,
          usedFacts: [],
        })),
      };

      setDocTitle(json.title);
      setDocDate(json.documentDate ?? new Date().toISOString().slice(0, 10));

      // ── Step 2→3: Auto-fill from KB ─────────────────────────────────
      setStep("filling");
      const fillRes = await fetch("/api/source-docs/auto-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: extracted.items }),
      });
      const fillJson = await fillRes.json();

      const filledItems: ExtractedItem[] = fillRes.ok
        ? fillJson.items
        : extracted.items.map((item: ExtractedItem) => ({
            ...item,
            fillStatus: item.current_value?.trim() ? "partial" : "empty",
            usedFacts: [],
          }));

      const finalResult: ExtractResult = { ...extracted, items: filledItems };
      setResult(finalResult);
      setSelected(new Set(filledItems.map((_: ExtractedItem, i: number) => i)));
      const sects = new Set<string>(filledItems.map((item: ExtractedItem) => item.description));
      setExpandedSections(sects);
      setStep("review");
    } catch (err: any) {
      setExtractError(err.message ?? "Failed");
      setStep("upload");
    }
  }

  // ── Save ───────────────────────────────────────────────────────────
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

  // ── Helpers ────────────────────────────────────────────────────────
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

  // Summary counts
  const fillCounts = result
    ? result.items.reduce(
        (acc, item) => {
          const s = item.fillStatus ?? "empty";
          acc[s] = (acc[s] ?? 0) + 1;
          return acc;
        },
        { filled: 0, partial: 0, empty: 0 } as Record<FillStatus, number>
      )
    : null;

  const isProcessing = step === "extracting" || step === "filling";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => { if (!isProcessing) { reset(); onClose(); } }} />
      <div className={cn(
        "relative z-10 flex flex-col bg-white rounded-xl shadow-2xl border border-slate-200 w-full mx-4",
        step === "review" ? "max-w-3xl max-h-[92vh]" : "max-w-lg"
      )}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-violet-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              {step === "review" ? "Review & Edit — Auto-filled from Knowledge Base" : "Create New Source Document"}
            </h2>
          </div>
          {!isProcessing && (
            <button onClick={() => { reset(); onClose(); }} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── Upload step ── */}
        {step === "upload" && (
          <div className="p-6 flex flex-col gap-4">
            <p className="text-sm text-slate-500">
              Upload a blank or partially completed governance document. Claude will extract every question, then automatically fill in answers using Anathem's existing knowledge base.
            </p>

            <div
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors",
                file ? "border-violet-300 bg-violet-50" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
              )}
            >
              <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setExtractError(null); } }} />
              {file ? (
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <FileText className="h-5 w-5 text-violet-500" />
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

            {extractError && (
              <p className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />{extractError}
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { reset(); onClose(); }}>Cancel</Button>
              <Button size="sm" disabled={!file} onClick={handleExtract} className="bg-violet-600 hover:bg-violet-700">
                <Wand2 className="mr-1.5 h-4 w-4" />
                Extract &amp; Auto-fill
              </Button>
            </div>
          </div>
        )}

        {/* ── Processing steps ── */}
        {isProcessing && (
          <div className="p-8 flex flex-col items-center gap-6">
            {/* Progress steps */}
            <div className="flex items-center gap-2 w-full max-w-xs">
              {/* Step 1 */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                  step === "extracting" ? "border-blue-500 bg-blue-500" : "border-emerald-500 bg-emerald-500"
                )}>
                  {step === "extracting"
                    ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                    : <Check className="h-4 w-4 text-white" />}
                </div>
                <span className={cn(
                  "text-[10px] font-medium text-center",
                  step === "extracting" ? "text-blue-600" : "text-emerald-600"
                )}>Extract questions</span>
              </div>

              {/* Connector */}
              <div className={cn(
                "flex-1 h-0.5 mb-5 transition-colors",
                step === "filling" ? "bg-blue-400" : "bg-slate-200"
              )} />

              {/* Step 2 */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                  step === "filling" ? "border-violet-500 bg-violet-500" : "border-slate-200 bg-white"
                )}>
                  {step === "filling"
                    ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                    : <Wand2 className="h-4 w-4 text-slate-300" />}
                </div>
                <span className={cn(
                  "text-[10px] font-medium text-center",
                  step === "filling" ? "text-violet-600" : "text-slate-400"
                )}>Fill from KB</span>
              </div>
            </div>

            {/* Status message */}
            <div className="text-center">
              {step === "extracting" && (
                <>
                  <p className="text-sm font-semibold text-slate-700">Reading document…</p>
                  <p className="text-xs text-slate-400 mt-1">Claude is extracting all questions and sections</p>
                </>
              )}
              {step === "filling" && (
                <>
                  <p className="text-sm font-semibold text-slate-700">Searching knowledge base…</p>
                  <p className="text-xs text-slate-400 mt-1">Claude is matching questions to known facts</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Review step ── */}
        {step === "review" && result && (
          <>
            {/* Metadata row */}
            <div className="flex items-end gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Document Title</label>
                <input
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-400"
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
                  className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-400"
                />
              </div>
            </div>

            {/* Fill summary bar */}
            {fillCounts && (
              <div className="flex items-center gap-4 px-6 py-2.5 border-b border-slate-100 bg-white flex-shrink-0">
                <span className="text-xs font-semibold text-slate-500 mr-1">Auto-fill results:</span>
                <div className="flex items-center gap-1.5 text-xs">
                  <CircleCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="font-semibold text-emerald-700">{fillCounts.filled}</span>
                  <span className="text-slate-400">filled</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <CircleAlert className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-semibold text-amber-700">{fillCounts.partial}</span>
                  <span className="text-slate-400">partial</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <CircleDashed className="h-3.5 w-3.5 text-red-400" />
                  <span className="font-semibold text-red-600">{fillCounts.empty}</span>
                  <span className="text-slate-400">empty</span>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-red-300 inline-block" /> empty items need manual answers
                </div>
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-2 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelected(allSelected ? new Set() : new Set(result.items.map((_, i) => i)))}
                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  {allSelected ? <CheckSquare className="h-4 w-4 text-violet-500" /> : <Square className="h-4 w-4" />}
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
                const sectionEmpty = entries.filter((e: { item: ExtractedItem; idx: number }) => (e.item.fillStatus ?? "empty") === "empty").length;

                return (
                  <div key={section}>
                    <button
                      onClick={() => toggleSection(section)}
                      className="flex w-full items-center justify-between px-6 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {expanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronUp className="h-3.5 w-3.5 text-slate-400" />}
                        <span className="text-xs font-semibold text-slate-700">{section}</span>
                        {sectionEmpty > 0 && (
                          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                            {sectionEmpty} empty
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{sectionSelected}/{entries.length} selected</span>
                    </button>

                    {expanded && entries.map(({ item, idx }) => {
                      const status = item.fillStatus ?? "empty";
                      const cfg = STATUS_CONFIG[status];
                      const isEditing = editingIdx === idx;

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "px-6 py-3 border-b border-slate-50 transition-colors",
                            cfg.row,
                            selected.has(idx) ? "" : "opacity-50"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <button
                              onClick={() => {
                                const next = new Set(selected);
                                if (next.has(idx)) next.delete(idx); else next.add(idx);
                                setSelected(next);
                              }}
                              className="mt-0.5 flex-shrink-0"
                            >
                              {selected.has(idx)
                                ? <CheckSquare className="h-4 w-4 text-violet-500" />
                                : <Square className="h-4 w-4 text-slate-300" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              {/* Question + status badge */}
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <p className="text-xs font-semibold text-slate-700 flex-1">{item.display_name}</p>
                                <span className={cn(
                                  "flex-shrink-0 flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold",
                                  cfg.badge
                                )}>
                                  <cfg.icon className="h-2.5 w-2.5" />
                                  {cfg.label}
                                </span>
                              </div>

                              {/* Answer — editable */}
                              {isEditing ? (
                                <div className="flex flex-col gap-1.5">
                                  <textarea
                                    autoFocus
                                    value={editBuf}
                                    onChange={(e) => setEditBuf(e.target.value)}
                                    rows={Math.min(Math.max((editBuf.match(/\n/g)?.length ?? 0) + 2, 3), 10)}
                                    className="w-full rounded border border-violet-300 bg-white px-3 py-2 text-xs text-slate-700 leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-violet-400"
                                  />
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        setResult((prev) => {
                                          if (!prev) return prev;
                                          const newItems = [...prev.items];
                                          newItems[idx] = {
                                            ...newItems[idx],
                                            current_value: editBuf,
                                            fillStatus: editBuf.trim() ? "partial" : "empty",
                                          };
                                          return { ...prev, items: newItems };
                                        });
                                        setEditingIdx(null);
                                      }}
                                      className="flex items-center gap-1 rounded bg-violet-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-violet-700"
                                    >
                                      <Check className="h-3 w-3" /> Save
                                    </button>
                                    <button
                                      onClick={() => setEditingIdx(null)}
                                      className="flex items-center gap-1 rounded border border-slate-200 px-2.5 py-1 text-[10px] text-slate-500 hover:bg-slate-50"
                                    >
                                      <X className="h-3 w-3" /> Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  onClick={() => { setEditingIdx(idx); setEditBuf(item.current_value); }}
                                  className={cn(
                                    "rounded border px-3 py-2 text-xs leading-relaxed cursor-pointer hover:border-violet-300 transition-colors",
                                    status === "empty"
                                      ? "border-dashed border-red-300 bg-red-50/50 text-slate-400 italic"
                                      : "border-slate-200 bg-white text-slate-600 whitespace-pre-wrap"
                                  )}
                                >
                                  {item.current_value?.trim()
                                    ? <span className="line-clamp-3">{item.current_value}</span>
                                    : "Click to add answer…"}
                                </div>
                              )}

                              {/* Used facts hint */}
                              {item.usedFacts && item.usedFacts.length > 0 && (
                                <p className="mt-1.5 text-[10px] text-slate-400">
                                  From: {item.usedFacts.slice(0, 3).map((k) => (
                                    <code key={k} className="font-mono bg-slate-100 px-1 rounded mx-0.5">{k}</code>
                                  ))}
                                  {item.usedFacts.length > 3 && ` +${item.usedFacts.length - 3} more`}
                                </p>
                              )}

                              <code className="mt-1 inline-block text-[10px] font-mono text-slate-300">{item.fact_key}</code>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-white">
              <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-700">← Start over</button>
              <div className="flex items-center gap-3">
                {importError && <p className="text-xs text-red-600 max-w-xs">{importError}</p>}
                <Button
                  size="sm"
                  disabled={selected.size === 0 || importing}
                  onClick={handleSave}
                  className="bg-violet-600 hover:bg-violet-700"
                >
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
