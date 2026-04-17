"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  X,
  Database,
  Sparkles,
  Briefcase,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { createClient } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import type { ExtractedFact } from "@/app/api/business-cases/extract/route";

// ── Supabase client ────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ──────────────────────────────────────────────────────────────────────
export interface BusinessCaseDialogProps {
  open: boolean;
  orgId: string;
  orgName: string;
  onClose: () => void;
  onFactsAdded: (count: number) => void;
}

type Step = 1 | 2 | 3 | 4;

interface ReviewFact extends ExtractedFact {
  selected: boolean;
  editedValue: string;
}

// ── Domain badge colours ───────────────────────────────────────────────────────
const DOMAIN_STYLES: Record<string, string> = {
  clinical: "bg-blue-100 text-blue-700",
  technical: "bg-orange-100 text-orange-700",
  data: "bg-purple-100 text-purple-700",
  legal: "bg-red-100 text-red-700",
  evidence: "bg-green-100 text-green-700",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Processing messages cycle ──────────────────────────────────────────────────
const PROCESSING_MESSAGES = [
  "Reading document…",
  "Extracting facts with AI…",
  "Almost done…",
];

// ── Main component ─────────────────────────────────────────────────────────────
export function BusinessCaseDialog({
  open,
  orgId,
  orgName,
  onClose,
  onFactsAdded,
}: BusinessCaseDialogProps) {
  const [step, setStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processingMessage, setProcessingMessage] = useState(PROCESSING_MESSAGES[0]);
  const [facts, setFacts] = useState<ReviewFact[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Reset wizard ─────────────────────────────────────────────────────────────
  function reset() {
    setStep(1);
    setFile(null);
    setDragOver(false);
    setFacts([]);
    setSavedCount(0);
    setError(null);
    setSaving(false);
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
    }
  }

  // ── File selection ───────────────────────────────────────────────────────────
  const handleFileSelect = useCallback((selected: File) => {
    const ext = selected.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "doc"].includes(ext ?? "")) {
      setError("Only PDF and DOCX files are supported.");
      return;
    }
    setError(null);
    setFile(selected);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFileSelect(dropped);
    },
    [handleFileSelect]
  );

  // ── Step 1 → 2: upload and extract ──────────────────────────────────────────
  async function handleExtract() {
    if (!file) return;
    setError(null);
    setStep(2);

    // Cycle through processing messages
    let msgIdx = 0;
    setProcessingMessage(PROCESSING_MESSAGES[0]);
    processingIntervalRef.current = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, PROCESSING_MESSAGES.length - 1);
      setProcessingMessage(PROCESSING_MESSAGES[msgIdx]);
    }, 3500);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orgId", orgId);
      formData.append("orgName", orgName);

      const res = await fetch("/api/business-cases/extract", {
        method: "POST",
        body: formData,
      });

      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error ${res.status}`);
      }

      const data = await res.json();
      const reviewFacts: ReviewFact[] = (data.facts ?? []).map((f: ExtractedFact) => ({
        ...f,
        selected: true,
        editedValue: f.value,
      }));

      setFacts(reviewFacts);
      setStep(3);
    } catch (err: any) {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
      setError(err.message ?? "Extraction failed");
      setStep(1);
    }
  }

  // ── Step 3: save facts ───────────────────────────────────────────────────────
  async function handleSave() {
    const selected = facts.filter((f) => f.selected);
    if (selected.length === 0) return;

    setSaving(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const insertedFacts: Array<{ id: string; value: string }> = [];

      for (const fact of selected) {
        const factId = crypto.randomUUID();

        const { error: factErr } = await supabase.from("facts").insert({
          id: factId,
          key: fact.key,
          label: fact.label,
          tier: "org_instance",
          domain: fact.domain,
          value_type: fact.value_type,
          current_value: fact.editedValue,
          module_id: null,
          org_id: orgId,
          created_at: now,
          updated_at: now,
          created_by: "admin",
        });

        if (factErr) {
          console.error("[BusinessCaseDialog] Failed to insert fact:", fact.key, factErr);
          // Continue with remaining facts rather than aborting
          continue;
        }

        insertedFacts.push({ id: factId, value: fact.editedValue });

        // Insert fact_versions row for audit trail
        await supabase.from("fact_versions").insert({
          id: crypto.randomUUID(),
          fact_id: factId,
          version: 1,
          value: fact.editedValue,
          changed_by: "admin",
          changed_at: now,
          reason: "Extracted from business case",
        });
      }

      setSavedCount(insertedFacts.length);
      onFactsAdded(insertedFacts.length);
      setStep(4);
    } catch (err: any) {
      setError(err.message ?? "Failed to save facts");
    } finally {
      setSaving(false);
    }
  }

  // ── Select all / deselect all ────────────────────────────────────────────────
  function setAllSelected(value: boolean) {
    setFacts((prev) => prev.map((f) => ({ ...f, selected: value })));
  }

  const selectedCount = facts.filter((f) => f.selected).length;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col bg-white data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                <Briefcase className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Business Case — {orgName}
                </h2>
                <p className="text-xs text-slate-400">
                  {step === 1 && "Upload a PDF or DOCX business case document"}
                  {step === 2 && "Processing document…"}
                  {step === 3 && `Review ${facts.length} extracted facts`}
                  {step === 4 && "Facts added to Knowledge Base"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Step indicator */}
              <div className="flex items-center gap-1.5">
                {([1, 2, 3, 4] as Step[]).map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      s === step
                        ? "w-6 bg-indigo-500"
                        : s < step
                        ? "w-1.5 bg-indigo-200"
                        : "w-1.5 bg-slate-200"
                    )}
                  />
                ))}
              </div>
              <DialogPrimitive.Close className="rounded-sm p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {/* ── Step 1: Upload ─────────────────────────────────────────────── */}
            {step === 1 && (
              <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
                <div className="w-full max-w-lg flex flex-col gap-6">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                      <Upload className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Upload Business Case
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Upload a PDF or DOCX business case document. AI will extract
                      org-specific facts and add them to the knowledge base.
                    </p>
                  </div>

                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-12 cursor-pointer transition-colors",
                      dragOver
                        ? "border-indigo-400 bg-indigo-50"
                        : file
                        ? "border-green-300 bg-green-50"
                        : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileSelect(f);
                        e.target.value = "";
                      }}
                    />
                    {file ? (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <FileText className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{file.name}</p>
                          <p className="text-xs text-slate-400">{formatBytes(file.size)}</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setFile(null); }}
                          className="mt-1 text-xs text-slate-400 hover:text-red-500 underline transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Upload className="h-8 w-8 text-slate-300" />
                        <div>
                          <p className="text-sm font-medium text-slate-600">
                            Drag and drop here, or click to browse
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            PDF and DOCX supported
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleExtract}
                    disabled={!file}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                      file
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    <Sparkles className="h-4 w-4" />
                    Extract facts
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Processing ─────────────────────────────────────────── */}
            {step === 2 && (
              <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
                <div className="flex flex-col items-center gap-6 text-center">
                  <div className="relative flex h-20 w-20 items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                    <Sparkles className="h-7 w-7 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Processing Document
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 transition-all">
                      {processingMessage}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm">
                    This may take up to 30 seconds for large documents. Please keep
                    this window open.
                  </p>
                </div>
              </div>
            )}

            {/* ── Step 3: Review ─────────────────────────────────────────────── */}
            {step === 3 && (
              <div className="flex flex-col h-full">
                {/* Toolbar */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-3 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold">{facts.length} facts</span>{" "}
                      extracted from{" "}
                      <span className="font-medium text-slate-900">{file?.name}</span>
                    </p>
                    <span className="text-slate-300">·</span>
                    <p className="text-xs text-slate-500">
                      {selectedCount} selected
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAllSelected(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 underline transition-colors"
                    >
                      Select all
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      onClick={() => setAllSelected(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
                    >
                      Deselect all
                    </button>
                  </div>
                </div>

                {/* Facts list */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {facts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Database className="mb-3 h-8 w-8 text-slate-300" />
                      <p className="text-sm text-slate-400">
                        No facts could be extracted from this document.
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Try uploading a different document or check that it contains
                        structured business case content.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 max-w-3xl mx-auto">
                      {facts.map((fact, idx) => (
                        <div
                          key={fact.key}
                          className={cn(
                            "flex gap-3 rounded-lg border p-4 transition-colors",
                            fact.selected
                              ? "border-indigo-200 bg-indigo-50/30"
                              : "border-slate-100 bg-white opacity-60"
                          )}
                        >
                          {/* Checkbox */}
                          <div className="flex-shrink-0 pt-0.5">
                            <input
                              type="checkbox"
                              checked={fact.selected}
                              onChange={(e) =>
                                setFacts((prev) =>
                                  prev.map((f, i) =>
                                    i === idx ? { ...f, selected: e.target.checked } : f
                                  )
                                )
                              }
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 accent-indigo-600 cursor-pointer"
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-semibold text-slate-800">
                                  {fact.label}
                                </p>
                                <code className="font-mono text-[11px] text-slate-400">
                                  {fact.key}
                                </code>
                              </div>
                              <span
                                className={cn(
                                  "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                  DOMAIN_STYLES[fact.domain] ?? "bg-slate-100 text-slate-600"
                                )}
                              >
                                {fact.domain}
                              </span>
                            </div>

                            {/* Editable value */}
                            <input
                              type="text"
                              value={fact.editedValue}
                              onChange={(e) =>
                                setFacts((prev) =>
                                  prev.map((f, i) =>
                                    i === idx ? { ...f, editedValue: e.target.value } : f
                                  )
                                )
                              }
                              disabled={!fact.selected}
                              className={cn(
                                "w-full rounded-md border px-3 py-1.5 text-sm transition-colors",
                                "border-slate-200 bg-white text-slate-800",
                                "focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400",
                                "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                              )}
                            />

                            {/* Rationale */}
                            {fact.rationale && (
                              <p className="text-[11px] text-slate-400 italic leading-relaxed">
                                {fact.rationale}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="border-t border-red-200 bg-red-50 px-6 py-3 flex-shrink-0">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4 flex-shrink-0">
                  <button
                    onClick={() => { setFacts([]); setFile(null); setStep(1); }}
                    className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Upload different file
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || selectedCount === 0}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors",
                      selectedCount > 0 && !saving
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4" />
                        Save {selectedCount} fact{selectedCount !== 1 ? "s" : ""} to Knowledge Base
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 4: Done ───────────────────────────────────────────────── */}
            {step === 4 && (
              <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
                <div className="flex flex-col items-center gap-6 text-center max-w-sm">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {savedCount} fact{savedCount !== 1 ? "s" : ""} added to the Knowledge Base
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      These org-instance facts are now available for document generation
                      and will override global defaults when generating documents for{" "}
                      <span className="font-medium text-slate-700">{orgName}</span>.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 w-full">
                    <Link
                      href="/knowledge-base"
                      className="flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <Database className="h-4 w-4" />
                      View Knowledge Base
                    </Link>
                    <button
                      onClick={reset}
                      className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      Upload another
                    </button>
                    <button
                      onClick={() => { reset(); onClose(); }}
                      className="text-sm text-slate-400 hover:text-slate-600 transition-colors py-1"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
