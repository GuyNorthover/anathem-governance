"use client";

import { useState, useRef } from "react";
import {
  FileText, Loader2, Sparkles, CheckSquare, Square,
  Upload, X, AlertCircle, Check, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DomainBadge } from "./DomainBadge";
import { TierBadge } from "./TierBadge";
import type { FactTier, FactDomain } from "@/lib/knowledge-base/types";

interface ExtractedFact {
  key: string;
  value: string;
  tier: FactTier;
  domain: FactDomain;
  module: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (facts: ExtractedFact[], sourceDocument: string) => Promise<string | null>;
}

type Step = "upload" | "review" | "done";

export function SeedFromDocumentDialog({ open, onClose, onImport }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [facts, setFacts] = useState<ExtractedFact[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editBuf, setEditBuf] = useState<ExtractedFact | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function reset() {
    setStep("upload");
    setFile(null);
    setExtracting(false);
    setExtractError(null);
    setFacts([]);
    setSelected(new Set());
    setEditingIdx(null);
    setEditBuf(null);
    setImporting(false);
    setImportError(null);
    setImportedCount(0);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleExtract() {
    if (!file) return;
    setExtracting(true);
    setExtractError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/knowledge-base/seed", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Extraction failed");

      const extracted: ExtractedFact[] = json.facts;
      setFacts(extracted);
      setSelected(new Set(extracted.map((_, i) => i))); // select all by default
      setStep("review");
    } catch (err: any) {
      setExtractError(err.message ?? "Extraction failed");
    } finally {
      setExtracting(false);
    }
  }

  function toggleAll() {
    if (selected.size === facts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(facts.map((_, i) => i)));
    }
  }

  function toggleOne(i: number) {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  }

  function startEdit(i: number) {
    setEditingIdx(i);
    setEditBuf({ ...facts[i] });
  }

  function saveEdit() {
    if (editingIdx === null || !editBuf) return;
    setFacts((prev) => prev.map((f, i) => (i === editingIdx ? editBuf : f)));
    setEditingIdx(null);
    setEditBuf(null);
  }

  async function handleImport() {
    const toImport = facts.filter((_, i) => selected.has(i));
    if (toImport.length === 0) return;
    setImporting(true);
    setImportError(null);
    const err = await onImport(toImport, file?.name ?? "Unknown document");
    setImporting(false);
    if (err) {
      setImportError(err);
    } else {
      setImportedCount(toImport.length);
      setStep("done");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* Panel */}
      <div className={cn(
        "relative z-10 flex flex-col bg-white rounded-xl shadow-2xl border border-slate-200 w-full mx-4",
        step === "review" ? "max-w-3xl max-h-[90vh]" : "max-w-lg"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-slate-900">
              {step === "upload" && "Seed Knowledge Base from Document"}
              {step === "review" && `Review Extracted Facts — ${file?.name}`}
              {step === "done" && "Import Complete"}
            </h2>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Upload step ── */}
        {step === "upload" && (
          <div className="p-6 flex flex-col gap-4">
            <p className="text-sm text-slate-500">
              Upload one of Anathem's internal compliance documents. Claude will extract structured facts to populate the knowledge base.
            </p>

            <div
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors",
                file
                  ? "border-blue-300 bg-blue-50"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
              )}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.doc"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setFile(f); setExtractError(null); }
                }}
              />
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

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs text-amber-800 font-medium mb-1">Supported documents</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                DTAC, DPIA, EIA, Clinical Risk Management Plan, Clinical Safety Case Report, Infrastructure/Cyber Security Assessments, Declaration of Conformity.{" "}
                <span className="font-medium">XLSX files (e.g. Hazard Log) are not supported</span> — convert to PDF first.
              </p>
            </div>

            {extractError && (
              <p className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {extractError}
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
              <Button
                size="sm"
                disabled={!file || extracting}
                onClick={handleExtract}
              >
                {extracting ? (
                  <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Extracting…</>
                ) : (
                  <><Sparkles className="mr-1.5 h-4 w-4" />Extract Facts</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── Review step ── */}
        {step === "review" && (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  {selected.size === facts.length
                    ? <CheckSquare className="h-4 w-4 text-blue-500" />
                    : <Square className="h-4 w-4" />
                  }
                  {selected.size === facts.length ? "Deselect all" : "Select all"}
                </button>
                <span className="text-xs text-slate-400">
                  {selected.size} of {facts.length} selected
                </span>
              </div>
              <p className="text-xs text-slate-400">Click a row to edit before importing</p>
            </div>

            {/* Fact list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {facts.map((fact, i) => (
                <div
                  key={i}
                  className={cn(
                    "px-6 py-3 transition-colors",
                    selected.has(i) ? "bg-white" : "bg-slate-50/60 opacity-60"
                  )}
                >
                  {editingIdx === i && editBuf ? (
                    /* Edit mode */
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Key</label>
                          <input
                            value={editBuf.key}
                            onChange={(e) => setEditBuf({ ...editBuf, key: e.target.value })}
                            className="rounded border border-slate-200 px-2 py-1 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Tier</label>
                            <select
                              value={editBuf.tier}
                              onChange={(e) => setEditBuf({ ...editBuf, tier: e.target.value as FactTier })}
                              className="rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                            >
                              <option value="global">Global</option>
                              <option value="module">Module</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Domain</label>
                            <select
                              value={editBuf.domain}
                              onChange={(e) => setEditBuf({ ...editBuf, domain: e.target.value as FactDomain })}
                              className="rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                            >
                              <option value="clinical">Clinical</option>
                              <option value="technical">Technical</option>
                              <option value="data">Data</option>
                              <option value="legal">Legal</option>
                              <option value="evidence">Evidence</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Value</label>
                        <textarea
                          value={editBuf.value}
                          onChange={(e) => setEditBuf({ ...editBuf, value: e.target.value })}
                          rows={3}
                          className="rounded border border-slate-200 px-2 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="flex items-center gap-1 rounded bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700"
                        >
                          <Check className="h-3 w-3" /> Save
                        </button>
                        <button
                          onClick={() => { setEditingIdx(null); setEditBuf(null); }}
                          className="rounded border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display mode */
                    <div
                      className="flex items-start gap-3 cursor-pointer group"
                      onClick={() => toggleOne(i)}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleOne(i); }}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {selected.has(i)
                          ? <CheckSquare className="h-4 w-4 text-blue-500" />
                          : <Square className="h-4 w-4 text-slate-300" />
                        }
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <code className="text-[11px] font-mono text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                            {fact.key}
                          </code>
                          <DomainBadge domain={fact.domain} />
                          <TierBadge tier={fact.tier} module={fact.module as any} />
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{fact.value}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); startEdit(i); }}
                        className="flex-shrink-0 text-xs text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded border border-slate-200 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-white">
              <button
                onClick={() => { setStep("upload"); setFacts([]); }}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                ← Back
              </button>
              <div className="flex items-center gap-3">
                {importError && (
                  <p className="text-xs text-red-600">{importError}</p>
                )}
                <Button
                  size="sm"
                  disabled={selected.size === 0 || importing}
                  onClick={handleImport}
                >
                  {importing ? (
                    <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Importing…</>
                  ) : (
                    <>Import {selected.size} fact{selected.size !== 1 ? "s" : ""}</>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── Done step ── */}
        {step === "done" && (
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 border border-green-200">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">
                {importedCount} fact{importedCount !== 1 ? "s" : ""} imported
              </p>
              <p className="text-sm text-slate-500 mt-1">
                The knowledge base has been updated. These facts will be used when generating documents for any trust.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { reset(); }}>
                Import another document
              </Button>
              <Button size="sm" onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
