"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Briefcase,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Sparkles,
  Plus,
  ChevronRight,
  Loader2,
  X,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReferenceCase {
  id: string;
  org_name: string;
  filename: string;
  uploaded_at: string;
  status: "processing" | "analysed" | "failed";
  section_count: number | null;
  error_message: string | null;
}

interface BCProject {
  id: string;
  org_name: string;
  template_filename: string;
  status: "drafting" | "needs_data" | "completing" | "complete";
  created_at: string;
  updated_at: string;
}

interface DataRequest {
  field: string;
  label: string;
  description: string;
  type: "text" | "number" | "date" | "percentage";
  required: boolean;
  placeholder_text: string;
  provided_value?: string;
}

interface BCSection {
  id: string;
  project_id: string;
  section_key: string;
  title: string;
  template_guidance: string | null;
  draft_content: string | null;
  final_content: string | null;
  status: "drafted" | "needs_data" | "complete";
  sort_order: number;
  data_requests: DataRequest[];
}

interface BCProjectDetail extends BCProject {
  sections: BCSection[];
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({
  status,
}: {
  status: "processing" | "analysed" | "failed" | "drafting" | "needs_data" | "completing" | "complete" | "drafted";
}) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    processing: {
      label: "Processing",
      className: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    analysed: {
      label: "Analysed",
      className: "bg-green-50 text-green-700 border-green-200",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    failed: {
      label: "Failed",
      className: "bg-red-50 text-red-700 border-red-200",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    drafting: {
      label: "Drafting",
      className: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <Sparkles className="h-3 w-3" />,
    },
    needs_data: {
      label: "Needs Data",
      className: "bg-red-50 text-red-700 border-red-200",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    completing: {
      label: "Completing",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <Clock className="h-3 w-3" />,
    },
    complete: {
      label: "Complete",
      className: "bg-green-50 text-green-700 border-green-200",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    drafted: {
      label: "Drafted",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <FileText className="h-3 w-3" />,
    },
  };

  const config = map[status] ?? map.drafting;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        config.className
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// ── Upload Reference Dialog ───────────────────────────────────────────────────

function UploadReferenceDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [orgName, setOrgName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(f: File | null) {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "doc"].includes(ext ?? "")) {
      setError("Only PDF and DOCX files are supported");
      return;
    }
    setFile(f);
    setError(null);
  }

  async function handleUpload() {
    if (!file || !orgName.trim()) {
      setError("Please provide a file and organisation name");
      return;
    }
    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("orgName", orgName.trim());

      const res = await fetch("/api/bc/upload-reference", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed");
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Add Reference Case
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload a completed business case to learn from
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Org name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Organisation name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Barts Health NHS Trust"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          {/* File drop zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Business case document (PDF or DOCX)
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFileChange(f);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all",
                dragging
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
              )}
            >
              <Upload className="h-6 w-6 text-slate-400" />
              {file ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-slate-500">
                    Drag & drop or click to browse
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">PDF, DOCX</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            disabled={uploading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || !file || !orgName.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                Upload
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Questions panel ───────────────────────────────────────────────────────────
// Shows ALL data_requests from ALL sections in a single consolidated form.

function QuestionsPanel({
  project,
  onComplete,
}: {
  project: BCProjectDetail;
  onComplete: () => void;
}) {
  // Build a flat list of questions, keyed by sectionId+field
  const sectionsWithRequests = project.sections.filter(
    (s) => s.status === "needs_data" && s.data_requests.length > 0
  );

  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const s of sectionsWithRequests) {
      for (const dr of s.data_requests) {
        init[`${s.id}::${dr.field}`] = dr.provided_value ?? "";
      }
    }
    return init;
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const totalRequired = sectionsWithRequests.reduce(
    (sum, s) => sum + s.data_requests.filter((d) => d.required).length,
    0
  );
  const totalAnswered = sectionsWithRequests.reduce(
    (sum, s) =>
      sum +
      s.data_requests.filter(
        (d) => d.required && (values[`${s.id}::${d.field}`] ?? "").trim()
      ).length,
    0
  );

  async function handleSubmitAll() {
    setSubmitting(true);
    setError(null);
    try {
      for (const section of sectionsWithRequests) {
        const dataValues: Record<string, string> = {};
        for (const dr of section.data_requests) {
          const v = values[`${section.id}::${dr.field}`];
          if (v?.trim()) dataValues[dr.field] = v.trim();
        }
        if (Object.keys(dataValues).length === 0) continue;

        const res = await fetch("/api/bc/provide-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: project.id, sectionId: section.id, dataValues }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(`${section.title}: ${data.error ?? "failed"}`);
      }
      setDone(true);
      onComplete();
    } catch (e: any) {
      setError(e.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (sectionsWithRequests.length === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-800">All sections drafted</p>
          <p className="text-xs text-green-600 mt-0.5">
            Download the business case below. Any remaining [INSERT: ...] placeholders can be completed in Word.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Questions to answer
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalAnswered} of {totalRequired} required fields completed
          </p>
        </div>
        {totalRequired > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${Math.round((totalAnswered / totalRequired) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              {Math.round((totalAnswered / totalRequired) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Questions grouped by section */}
      <div className="divide-y divide-slate-100">
        {sectionsWithRequests.map((section) => (
          <div key={section.id} className="px-5 py-4">
            {/* Section label */}
            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500 mb-3">
              {section.title}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {section.data_requests.map((dr) => {
                const key = `${section.id}::${dr.field}`;
                const inputType =
                  dr.type === "number" || dr.type === "percentage" ? "number" : "text";
                return (
                  <div key={dr.field}>
                    <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                      {dr.label}
                      {dr.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <p className="text-[10px] text-slate-400 mb-1.5 leading-relaxed">
                      {dr.description}
                    </p>
                    <input
                      type={inputType}
                      placeholder={dr.placeholder_text || `Enter ${dr.label.toLowerCase()}`}
                      value={values[key] ?? ""}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50">
        {error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : (
          <p className="text-xs text-slate-400">
            Answers will be woven into the relevant sections by Claude
          </p>
        )}
        <button
          onClick={handleSubmitAll}
          disabled={submitting || totalAnswered === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {submitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Incorporating answers…
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Submit all answers
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Section preview (collapsible) ─────────────────────────────────────────────

function SectionPreview({ section }: { section: BCSection }) {
  const [expanded, setExpanded] = useState(false);
  const content = section.final_content ?? section.draft_content ?? "";

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        className="flex w-full items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronRight
            className={cn("h-3.5 w-3.5 flex-shrink-0 text-slate-400 transition-transform", expanded && "rotate-90")}
          />
          <span className="text-sm font-medium text-slate-700 truncate">{section.title}</span>
        </div>
        <StatusBadge status={section.status} />
      </button>
      {expanded && content && (
        <div className="border-t border-slate-100 px-4 py-3">
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      )}
      {expanded && !content && (
        <div className="border-t border-slate-100 px-4 py-3">
          <p className="text-xs text-slate-400 italic">No content generated yet</p>
        </div>
      )}
    </div>
  );
}

// ── New project panel ─────────────────────────────────────────────────────────

function NewProjectPanel({
  referenceCaseCount,
  onCreated,
}: {
  referenceCaseCount: number;
  onCreated: (projectId: string) => void;
}) {
  const [orgName, setOrgName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    "Analysing template structure...",
    `Drafting sections from ${referenceCaseCount} reference case${referenceCaseCount !== 1 ? "s" : ""}...`,
    "Identifying data requirements...",
    "Finalising project...",
  ];

  function handleFileChange(f: File | null) {
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["docx", "doc"].includes(ext ?? "")) {
      setError("Template must be a DOCX file");
      return;
    }
    setFile(f);
    setError(null);
  }

  async function handleCreate() {
    if (!file || !orgName.trim()) {
      setError("Please provide a template file and trust name");
      return;
    }

    setCreating(true);
    setError(null);

    // Cycle through step messages
    let stepIdx = 0;
    setStep(steps[0]);
    const stepTimer = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      setStep(steps[stepIdx]);
    }, 18000);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("orgName", orgName.trim());

      const res = await fetch("/api/bc/create-project", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create project");

      onCreated(data.projectId);
    } catch (e: any) {
      setError(e.message ?? "Error creating project");
    } finally {
      clearInterval(stepTimer);
      setCreating(false);
      setStep("");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-96 p-8">
      <div className="w-full max-w-lg">
        {/* Icon + heading */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 mb-4">
            <Briefcase className="h-7 w-7 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            Create a new business case
          </h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
            Upload your trust's blank business case template and we'll draft it using{" "}
            {referenceCaseCount > 0
              ? `${referenceCaseCount} reference case${referenceCaseCount !== 1 ? "s" : ""}`
              : "NHS best practice frameworks"}
            .
          </p>
        </div>

        <div className="space-y-4">
          {/* Trust name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Trust name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Barts Health NHS Trust"
              disabled={creating}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-50"
            />
          </div>

          {/* File drop zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Blank business case template (DOCX)
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFileChange(e.dataTransfer.files[0] ?? null);
              }}
              onClick={() => !creating && fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all",
                creating && "pointer-events-none opacity-60",
                dragging
                  ? "border-indigo-400 bg-indigo-50"
                  : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
              )}
            >
              <Upload className="h-8 w-8 text-slate-400" />
              {file ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(0)} KB — Ready to process
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-slate-600 font-medium">
                    Drop template here or click to browse
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    DOCX files only
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {/* Processing state */}
          {creating && (
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-4">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-indigo-700">{step}</p>
              </div>
              <div className="h-1.5 rounded-full bg-indigo-100 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500 animate-pulse w-2/3" />
              </div>
              <p className="text-xs text-indigo-500 mt-2">
                This may take 1–3 minutes while Claude drafts each section...
              </p>
            </div>
          )}

          {/* Submit */}
          {!creating && (
            <button
              onClick={handleCreate}
              disabled={!file || !orgName.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Create Business Case
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Project detail panel ──────────────────────────────────────────────────────

function ProjectDetailPanel({
  project,
  onRefresh,
}: {
  project: BCProjectDetail;
  onRefresh: () => void;
}) {
  const completedCount = project.sections.filter((s) => s.status === "complete").length;
  const needsDataCount = project.sections.filter((s) => s.status === "needs_data").length;
  const totalCount = project.sections.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{project.org_name}</h2>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={project.status} />
            <span className="text-xs text-slate-500">
              {totalCount} sections · {completedCount} complete
              {needsDataCount > 0 && (
                <span className="text-amber-600"> · {needsDataCount} need data</span>
              )}
            </span>
          </div>
          {/* Progress bar inline */}
          {totalCount > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="h-1.5 w-32 rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">{pct}%</span>
            </div>
          )}
        </div>

        <a
          href={`/api/bc/download/${project.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors flex-shrink-0 ml-4"
        >
          <Download className="h-3.5 w-3.5" />
          Download DOCX
        </a>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {project.sections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-8 w-8 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No sections found</p>
          </div>
        ) : (
          <>
            {/* Questions panel — prominent, at the top */}
            <QuestionsPanel project={project} onComplete={onRefresh} />

            {/* Section previews */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Section preview
              </p>
              <div className="space-y-2">
                {project.sections.map((section) => (
                  <SectionPreview key={section.id} section={section} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function BusinessCaseBuilderView() {
  const [referenceCases, setReferenceCases] = useState<ReferenceCase[]>([]);
  const [projects, setProjects] = useState<BCProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<BCProjectDetail | null>(null);
  const [uploadingReference, setUploadingReference] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  const [showNewProject, setShowNewProject] = useState(true);

  // Load reference cases and projects on mount
  async function loadAll() {
    const [{ data: refs }, { data: projs }] = await Promise.all([
      supabase
        .from("bc_reference_cases")
        .select("*")
        .order("uploaded_at", { ascending: false }),
      supabase
        .from("bc_projects")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    setReferenceCases((refs ?? []) as ReferenceCase[]);
    setProjects((projs ?? []) as BCProject[]);
  }

  useEffect(() => {
    loadAll();
  }, []);

  // Load active project detail
  async function loadProject(projectId: string) {
    setLoadingProject(true);
    setShowNewProject(false);
    try {
      const { data: proj } = await supabase
        .from("bc_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (!proj) {
        setActiveProject(null);
        return;
      }

      const { data: sections } = await supabase
        .from("bc_sections")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });

      setActiveProject({
        ...(proj as BCProject),
        sections: (sections ?? []) as BCSection[],
      });
      setActiveProjectId(projectId);
    } finally {
      setLoadingProject(false);
    }
  }

  function handleRefreshProject() {
    if (activeProjectId) {
      loadProject(activeProjectId);
      loadAll();
    }
  }

  function handleProjectCreated(projectId: string) {
    loadAll();
    loadProject(projectId);
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Upload dialog */}
      {showUploadDialog && (
        <UploadReferenceDialog
          onClose={() => setShowUploadDialog(false)}
          onSuccess={() => {
            setUploadingReference(false);
            loadAll();
          }}
        />
      )}

      {/* Left panel — Reference Library */}
      <aside className="flex w-72 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
        {/* Header */}
        <div className="border-b border-slate-100 px-4 py-4">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className="text-sm font-semibold text-slate-800">Reference Library</h3>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
              {referenceCases.length} case{referenceCases.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">
            Completed business cases used to learn structure and narrative
          </p>
        </div>

        {/* Reference cases list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
          {referenceCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BookOpen className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs text-slate-500 font-medium">No reference cases yet</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Add a completed business case to get started
              </p>
            </div>
          ) : (
            referenceCases.map((ref) => (
              <div
                key={ref.id}
                className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">
                      {ref.org_name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {ref.filename}
                    </p>
                  </div>
                  <StatusBadge status={ref.status} />
                </div>
                {ref.status === "analysed" && ref.section_count != null && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <BarChart3 className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] text-slate-500">
                      {ref.section_count} section{ref.section_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {ref.status === "failed" && ref.error_message && (
                  <p className="text-[10px] text-red-600 mt-1 line-clamp-2">
                    {ref.error_message}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Projects section */}
        {projects.length > 0 && (
          <>
            <div className="border-t border-slate-100 px-4 py-3">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className="text-sm font-semibold text-slate-800">Projects</h3>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                  {projects.length}
                </span>
              </div>
            </div>
            <div className="overflow-y-auto max-h-52 px-3 pb-2 space-y-1.5">
              {projects.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => loadProject(proj.id)}
                  className={cn(
                    "w-full text-left rounded-lg border px-3 py-2.5 transition-all",
                    activeProjectId === proj.id
                      ? "border-indigo-200 bg-indigo-50"
                      : "border-slate-100 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-700 truncate">
                      {proj.org_name}
                    </p>
                    <StatusBadge status={proj.status} />
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {proj.template_filename}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Add reference button */}
        <div className="border-t border-slate-100 p-3">
          <button
            onClick={() => setShowUploadDialog(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-indigo-300 bg-indigo-50 px-3 py-2.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add reference case
          </button>
          <button
            onClick={() => {
              setShowNewProject(true);
              setActiveProjectId(null);
              setActiveProject(null);
            }}
            className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <Briefcase className="h-3.5 w-3.5" />
            New project
          </button>
        </div>
      </aside>

      {/* Right panel */}
      <main className="flex-1 overflow-hidden bg-slate-50">
        {loadingProject ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="text-sm text-slate-500">Loading project...</p>
            </div>
          </div>
        ) : activeProject && !showNewProject ? (
          <div className="h-full overflow-hidden flex flex-col bg-white">
            <ProjectDetailPanel
              project={activeProject}
              onRefresh={handleRefreshProject}
            />
          </div>
        ) : (
          <NewProjectPanel
            referenceCaseCount={referenceCases.filter((r) => r.status === "analysed").length}
            onCreated={handleProjectCreated}
          />
        )}
      </main>
    </div>
  );
}
