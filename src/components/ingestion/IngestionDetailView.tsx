"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, XCircle, PenLine, Save,
  ChevronRight, Lock, Sparkles, Database, AlertCircle,
  ThumbsUp, Clock, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useIngestionDetail } from "@/resources/hooks/use-ingestion";
import { supabase } from "@/lib/supabase/client";
import { QUESTION_STATUS_META } from "@/lib/ingestion/types";
import type { ExtractedQuestion, QuestionStatus } from "@/lib/ingestion/types";
import { IngestionStatusBadge } from "./IngestionStatusBadge";

// ── Question list item ────────────────────────────────────────────────────────

function QuestionListItem({
  q,
  isSelected,
  onClick,
}: {
  q: ExtractedQuestion;
  isSelected: boolean;
  onClick: () => void;
}) {
  const m = QUESTION_STATUS_META[q.status];

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
        isSelected ? "bg-blue-50/70 border-r-2 border-blue-500" : "hover:bg-slate-50"
      )}
    >
      <span className={cn("mt-1.5 h-2 w-2 flex-shrink-0 rounded-full", m.dotClass)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          {q.questionRef && (
            <code className="text-[10px] font-mono text-slate-400">{q.questionRef}</code>
          )}
          <span className={cn("text-[10px] font-medium", m.style)}>{m.label}</span>
        </div>
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{q.questionText}</p>
      </div>
      <ChevronRight className={cn("mt-0.5 h-3.5 w-3.5 flex-shrink-0", isSelected ? "text-blue-400" : "text-slate-300")} />
    </button>
  );
}

// ── Question detail panel ─────────────────────────────────────────────────────

function QuestionDetailPanel({
  q,
  onApprove,
  onReject,
  onEdit,
  onGenerate,
}: {
  q: ExtractedQuestion;
  onApprove: (id: string, answer: string) => void;
  onReject: (id: string, note: string) => void;
  onEdit: (id: string, answer: string) => void;
  onGenerate: (id: string) => Promise<void>;
}) {
  const [editMode, setEditMode] = useState(false);
  const [editedAnswer, setEditedAnswer] = useState(q.draftAnswer ?? "");
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectNote, setRejectNote] = useState(q.reviewNote ?? "");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    const result = await onGenerate(q.id);
    setGenerating(false);
    // If result has an error (returned from parent), show it
    // The parent updates local state on success
  }

  // Reset local state when question changes
  const key = q.id;

  function handleApprove() {
    onApprove(q.id, editedAnswer || q.draftAnswer || "");
    setEditMode(false);
  }

  function handleReject() {
    onReject(q.id, rejectNote);
    setRejectMode(false);
  }

  function handleSaveEdit() {
    onEdit(q.id, editedAnswer);
    setEditMode(false);
  }

  const displayAnswer = q.approvedAnswer ?? q.draftAnswer;
  const hasDraft = !!displayAnswer;

  return (
    <div key={key} className="flex h-full flex-col overflow-hidden">
      {/* Question header */}
      <div className="flex-shrink-0 border-b border-slate-100 bg-white px-6 py-4">
        <div className="flex items-start gap-3 mb-2">
          {q.questionRef && (
            <code className="mt-0.5 rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-500">
              {q.questionRef}
            </code>
          )}
          {q.sectionLabel && (
            <span className="text-xs text-slate-400">{q.sectionLabel}</span>
          )}
        </div>

        {/* Status row */}
        <div className="flex items-center gap-2">
          {q.status === "approved" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[11px] font-medium text-green-700">
              <CheckCircle2 className="h-3 w-3" /> Approved
            </span>
          )}
          {q.status === "rejected" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-600">
              <XCircle className="h-3 w-3" /> Rejected
            </span>
          )}
          {q.status === "drafted" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
              <Sparkles className="h-3 w-3" /> Awaiting review
            </span>
          )}
          {q.status === "pending" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
              <Clock className="h-3 w-3" /> Pending draft
            </span>
          )}
          {q.promptKey && (
            <span className="text-[10px] text-slate-400">via <code className="font-mono">{q.promptKey}</code></span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        {/* Original question */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Original Question
          </p>
          <blockquote className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 leading-relaxed italic">
            {q.questionText}
          </blockquote>
        </div>

        {/* Mapped facts */}
        {q.mappedFactKeys.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
              <Database className="h-3 w-3" />
              Mapped Facts ({q.mappedFactKeys.length})
            </p>
            <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden divide-y divide-slate-100">
              {q.mappedFactKeys.map((key) => {
                const val = q.mappedFactValues?.[key];
                return (
                  <div key={key} className="px-3 py-2">
                    <code className="text-[10px] font-mono text-blue-600">{key}</code>
                    {val && (
                      <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{val}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Separator />

        {/* Drafted / approved answer */}
        {hasDraft ? (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              {q.status === "approved" ? "Approved Answer" : "AI-Drafted Answer"}
            </p>

            {editMode ? (
              <div className="flex flex-col gap-2">
                <Textarea
                  value={editedAnswer}
                  onChange={(e) => setEditedAnswer(e.target.value)}
                  className="min-h-[160px] text-sm leading-relaxed"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    <Save className="h-3 w-3" /> Save edit
                  </button>
                  <button
                    onClick={() => { setEditMode(false); setEditedAnswer(q.draftAnswer ?? ""); }}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className={cn(
                "rounded-lg border px-4 py-3 text-sm leading-relaxed",
                q.status === "approved"
                  ? "border-green-200 bg-green-50/40 text-slate-700"
                  : "border-slate-200 bg-white text-slate-700"
              )}>
                {displayAnswer}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center">
            {generating ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                <p className="text-sm text-slate-500">Claude is drafting an answer…</p>
                <p className="text-xs text-slate-400">Using {q.mappedFactKeys.length} mapped fact{q.mappedFactKeys.length !== 1 ? "s" : ""}</p>
              </>
            ) : (
              <>
                <Sparkles className="h-6 w-6 text-slate-300" />
                <div>
                  <p className="text-sm text-slate-500 font-medium">No draft yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {q.mappedFactKeys.length > 0
                      ? `${q.mappedFactKeys.length} fact${q.mappedFactKeys.length !== 1 ? "s" : ""} mapped — ready to generate`
                      : "No facts mapped — Claude will use general knowledge"}
                  </p>
                </div>
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Generate draft
                </button>
                {generateError && (
                  <p className="text-xs text-red-500">{generateError}</p>
                )}
              </>
            )}
          </div>
        )}

        {/* Rejection note */}
        {q.status === "rejected" && q.reviewNote && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1">Review Note</p>
            <p className="text-xs text-red-700">{q.reviewNote}</p>
          </div>
        )}

        {/* Action buttons */}
        {(q.status === "drafted" || q.status === "pending") && hasDraft && !editMode && !rejectMode && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleApprove}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              Approve answer
            </button>
            <button
              onClick={() => { setEditMode(true); setEditedAnswer(q.draftAnswer ?? ""); }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <PenLine className="h-3.5 w-3.5" /> Edit then approve
            </button>
            <button
              onClick={() => setRejectMode(true)}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50"
            >
              <XCircle className="h-3.5 w-3.5" /> Reject
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Regenerate
            </button>
          </div>
        )}

        {q.status === "approved" && !editMode && (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditMode(true); setEditedAnswer(q.approvedAnswer ?? q.draftAnswer ?? ""); }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <PenLine className="h-3.5 w-3.5" /> Revise
            </button>
          </div>
        )}

        {/* Reject mode */}
        {rejectMode && (
          <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-medium text-red-700">Why is this draft being rejected?</p>
            <Textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Enter a note for the team…"
              className="min-h-[80px] text-sm bg-white"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReject}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
              >
                Confirm rejection
              </button>
              <button
                onClick={() => setRejectMode(false)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Immutability note */}
        {q.status === "approved" && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <Lock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <p className="text-xs text-slate-500">
              Approved answer is recorded in the audit log and cannot be deleted.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main detail view ──────────────────────────────────────────────────────────

export function IngestionDetailView({ jobId }: { jobId: string }) {
  const router = useRouter();
  const {
    job,
    questions,
    setQuestions,
    approveQuestion,
    rejectQuestion,
    updateDraft,
    generateDraft,
    reload,
  } = useIngestionDetail(jobId);

  const [selectedId, setSelectedId] = useState<string>("");
  const [completing, setCompleting] = useState(false);

  async function handleMarkComplete() {
    setCompleting(true);
    await supabase
      .from("ingestion_jobs")
      .update({ status: "complete" })
      .eq("id", jobId);
    await supabase.from("audit_log").insert({
      event_type: "ingestion.review_complete",
      actor_id: null,
      payload: {
        category: "ingestion",
        summary: `Ingestion review marked complete — ${job?.filename ?? jobId}`,
        ingestion_job_id: jobId,
        approved_count: approvedCount,
      },
      created_at: new Date().toISOString(),
    });
    setCompleting(false);
    reload();
  }

  // Set initial selection once questions load
  const firstId = questions[0]?.id ?? "";
  const effectiveSelectedId = selectedId || firstId;
  const selectedQuestion = questions.find((q) => q.id === effectiveSelectedId) ?? null;

  const approvedCount = questions.filter((q) => q.status === "approved").length;
  const draftedCount  = questions.filter((q) => q.status === "drafted").length;
  const rejectedCount = questions.filter((q) => q.status === "rejected").length;
  const pendingCount  = questions.filter((q) => q.status === "pending").length;
  const total = questions.length;
  const pct = total > 0 ? Math.round((approvedCount / total) * 100) : 0;

  function handleApprove(id: string, answer: string) {
    approveQuestion(id, answer);
    // advance to next non-approved question
    const idx = questions.findIndex((q) => q.id === id);
    const next = questions.slice(idx + 1).find((q) => q.status !== "approved");
    if (next) setSelectedId(next.id);
  }

  function handleReject(id: string, note: string) {
    rejectQuestion(id, note);
  }

  function handleEdit(id: string, answer: string) {
    updateDraft(id, answer);
  }

  // Group by section
  const sectionGroups = useMemo(() => {
    const map = new Map<string, ExtractedQuestion[]>();
    for (const q of questions) {
      const key = q.sectionLabel ?? "General";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(q);
    }
    return Array.from(map.entries());
  }, [questions]);

  if (!job) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Job not found.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Sticky header */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => router.push("/ingestion")}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Ingestion
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="text-xs text-slate-600 font-medium truncate max-w-xs">{job.filename}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 truncate">{job.filename}</h1>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
              <span>{job.documentType}</span>
              {job.orgName && <><span className="text-slate-300">·</span><span>{job.orgName}</span></>}
              <span className="text-slate-300">·</span>
              <span>Uploaded by {job.uploadedBy}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <IngestionStatusBadge status={job.status} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1 text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />{approvedCount} approved</span>
              <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />{draftedCount} drafted</span>
              {rejectedCount > 0 && <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400" />{rejectedCount} rejected</span>}
              {pendingCount > 0 && <span className="flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-300" />{pendingCount} pending</span>}
            </div>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div className="h-1.5 rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Body — two panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: question list */}
        <div className="w-[38%] flex-shrink-0 flex flex-col border-r border-slate-200 overflow-hidden bg-white">
          <div className="flex-shrink-0 px-4 py-2.5 border-b border-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {total} Question{total !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {sectionGroups.map(([section, qs]) => (
              <div key={section}>
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-400 truncate">{section}</p>
                </div>
                {qs.map((q) => (
                  <QuestionListItem
                    key={q.id}
                    q={q}
                    isSelected={effectiveSelectedId === q.id}
                    onClick={() => setSelectedId(q.id)}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Complete review CTA */}
          {approvedCount === total && total > 0 && job?.status !== "complete" && (
            <div className="flex-shrink-0 border-t border-slate-200 p-4">
              <button
                onClick={handleMarkComplete}
                disabled={completing}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                {completing ? "Saving…" : "Mark review complete"}
              </button>
            </div>
          )}
          {job?.status === "complete" && (
            <div className="flex-shrink-0 border-t border-slate-200 p-4">
              <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 border border-green-200 py-2.5 text-sm font-semibold text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Review complete
              </div>
            </div>
          )}
        </div>

        {/* Right: question detail */}
        <div className="flex-1 overflow-hidden bg-white">
          {selectedQuestion ? (
            <QuestionDetailPanel
              key={selectedQuestion.id}
              q={selectedQuestion}
              onApprove={handleApprove}
              onReject={handleReject}
              onEdit={handleEdit}
              onGenerate={async (id) => { await generateDraft(id, job?.orgId); }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Select a question to review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
