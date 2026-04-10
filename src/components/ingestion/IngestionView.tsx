"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, FileText, AlertCircle, CheckCircle2,
  Clock, ChevronRight, CloudUpload, Loader2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useIngestionJobs } from "@/resources/hooks/use-ingestion";
import { useOrganisations } from "@/resources/hooks/use-organisations";
import { INGESTION_STATUS_META } from "@/lib/ingestion/types";
import type { IngestionJob, IngestionStatus } from "@/lib/ingestion/types";
import type { Organisation } from "@/lib/organisations/types";
import { IngestionStatusBadge } from "./IngestionStatusBadge";

// ── Upload zone ───────────────────────────────────────────────────────────────

interface UploadZoneProps {
  orgs: Organisation[];
  onJobCreated: (jobId: string) => void;
}

function UploadZone({ orgs, onJobCreated }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [orgId, setOrgId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setUploadError(null); }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setUploadError(null); }
  }

  async function handleStartIngestion(e: React.MouseEvent) {
    e.stopPropagation();
    if (!file || uploading) return;

    setUploading(true);
    setUploadError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      if (orgId) form.append("orgId", orgId);

      const res = await fetch("/api/ingest", { method: "POST", body: form });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Upload failed");

      // Success — reset and notify parent
      setFile(null);
      setOrgId("");
      onJobCreated(json.jobId);
    } catch (err: any) {
      setUploadError(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Drop area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 transition-colors",
          dragging
            ? "border-blue-400 bg-blue-50"
            : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
        )}
      >
        {/* Hidden file input — only active when not uploading */}
        {!uploading && (
          <input
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={handleChange}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        )}

        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full border",
          dragging ? "border-blue-200 bg-blue-100" : "border-slate-200 bg-white"
        )}>
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          ) : (
            <CloudUpload className={cn("h-5 w-5", dragging ? "text-blue-500" : "text-slate-400")} />
          )}
        </div>

        {uploading ? (
          <div className="text-center">
            <p className="text-sm font-medium text-blue-700">Analysing document…</p>
            <p className="mt-0.5 text-xs text-slate-400">Claude is extracting compliance questions</p>
          </div>
        ) : file ? (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <FileText className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{file.name}</span>
            <span className="text-slate-400">— ready to upload</span>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="relative z-10 ml-1 rounded p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">
              Drop a document here, or <span className="text-blue-600">browse</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-400">PDF or DOCX · max 50 MB</p>
          </div>
        )}
      </div>

      {/* Org selector + submit row */}
      {file && !uploading && (
        <div className="flex items-center gap-2">
          <select
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="h-9 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No specific organisation</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          <button
            onClick={handleStartIngestion}
            className="relative z-10 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Start Ingestion
          </button>
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-red-600 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {uploadError}
        </p>
      )}
    </div>
  );
}

// ── Job card ─────────────────────────────────────────────────────────────────

function progress(job: IngestionJob) {
  if (job.totalQuestions === 0) return 0;
  return Math.round((job.approvedCount / job.totalQuestions) * 100);
}

function JobCard({ job, onClick }: { job: IngestionJob; onClick: () => void }) {
  const pct = progress(job);
  const isFailed = job.status === "failed";
  const isComplete = job.status === "complete";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-4 rounded-xl border bg-white p-4 text-left transition-all hover:shadow-sm",
        isFailed ? "border-red-200" : "border-slate-200 hover:border-slate-300"
      )}
    >
      {/* Icon */}
      <div className={cn(
        "mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border",
        isFailed ? "border-red-100 bg-red-50" : isComplete ? "border-green-100 bg-green-50" : "border-slate-100 bg-slate-50"
      )}>
        {isFailed ? (
          <AlertCircle className="h-5 w-5 text-red-400" />
        ) : isComplete ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <FileText className="h-5 w-5 text-slate-400" />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{job.filename}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-500">{job.documentType}</span>
              {job.orgName && (
                <>
                  <span className="text-slate-200">·</span>
                  <span className="text-xs text-slate-500">{job.orgName}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <IngestionStatusBadge status={job.status} />
            {!isFailed && <ChevronRight className="h-4 w-4 text-slate-300" />}
          </div>
        </div>

        {/* Failure reason */}
        {isFailed && job.failureReason && (
          <p className="mt-2 text-xs text-red-600 leading-relaxed">{job.failureReason}</p>
        )}

        {/* Progress bar */}
        {!isFailed && job.totalQuestions > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-400">
                {job.approvedCount} / {job.totalQuestions} questions approved
              </span>
              <span className="text-[11px] text-slate-400">{pct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100">
              <div
                className={cn("h-1.5 rounded-full transition-all", isComplete ? "bg-green-500" : "bg-blue-500")}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="mt-2 flex items-center gap-3">
          <Clock className="h-3 w-3 text-slate-300" />
          <span className="text-[11px] text-slate-400">
            Uploaded {new Date(job.uploadedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} by {job.uploadedBy}
          </span>
        </div>
      </div>
    </button>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: IngestionStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "In Review", value: "review" },
  { label: "Processing", value: "processing" },
  { label: "Mapping", value: "mapping" },
  { label: "Complete", value: "complete" },
  { label: "Failed", value: "failed" },
];

// ── Main view ─────────────────────────────────────────────────────────────────

export function IngestionView() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<IngestionStatus | "all">("all");
  const [search, setSearch] = useState("");

  const { data: jobs, reload: reloadJobs } = useIngestionJobs();
  const { data: orgs } = useOrganisations();

  const inReview = jobs.filter((j) => j.status === "review").length;
  const pending = jobs.filter((j) => ["processing", "mapping", "uploading"].includes(j.status)).length;
  const complete = jobs.filter((j) => j.status === "complete").length;
  const failed = jobs.filter((j) => j.status === "failed").length;

  const filtered = jobs.filter((j) => {
    if (statusFilter !== "all" && j.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!j.filename.toLowerCase().includes(q) &&
          !(j.orgName ?? "").toLowerCase().includes(q) &&
          !j.documentType.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  function handleJobCreated(jobId: string) {
    reloadJobs();
    router.push(`/ingestion/${jobId}`);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Ingestion Pipeline</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Upload novel trust documents — AI extracts questions, maps facts, and drafts answers for review
            </p>
          </div>
        </div>

        {/* Stat chips */}
        <div className="flex gap-3 mb-5 flex-wrap">
          {[
            { label: "In Review", value: inReview, colour: "text-indigo-700 bg-indigo-50 border-indigo-200" },
            { label: "Processing", value: pending,  colour: "text-amber-700 bg-amber-50 border-amber-200" },
            { label: "Complete",   value: complete, colour: "text-green-700 bg-green-50 border-green-200" },
            { label: "Failed",     value: failed,   colour: "text-red-700 bg-red-50 border-red-200" },
          ].map((s) => (
            <div key={s.label} className={cn("flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium", s.colour)}>
              <span className="text-base font-semibold">{s.value}</span>
              {s.label}
            </div>
          ))}
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setStatusFilter(t.value)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  statusFilter === t.value
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename, document type, or trust…"
            className="h-8 max-w-sm text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* Upload zone */}
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Upload New Document</p>
          <UploadZone orgs={orgs} onJobCreated={handleJobCreated} />
        </div>

        {/* Job list */}
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {filtered.length} job{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-400">
            No ingestion jobs match the current filters.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => {
                  if (job.status !== "failed") {
                    router.push(`/ingestion/${job.id}`);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
