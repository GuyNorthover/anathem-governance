"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, AlertTriangle, Building2,
  User, Calendar, MessageSquare, Send,
  ChevronDown, Shield, FileText,
  CheckCircle2, Clock, XCircle, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type HazardEntryType = "hazard" | "risk" | "issue";
type HazardSeverity = "critical" | "high" | "medium" | "low";
type HazardLikelihood = "almost_certain" | "likely" | "possible" | "unlikely" | "rare";
type HazardStatus = "open" | "under_review" | "mitigated" | "closed" | "accepted";

interface HazardEntry {
  id: string;
  reference_number: string;
  entry_type: HazardEntryType;
  title: string;
  description: string | null;
  severity: HazardSeverity;
  likelihood: HazardLikelihood;
  risk_score: number;
  status: HazardStatus;
  owner: string | null;
  mitigation_actions: string | null;
  residual_risk: string | null;
  date_identified: string;
  date_reviewed: string | null;
  date_closed: string | null;
  organisation_id: string;
  organisation_name: string;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: string;
  comment_text: string;
  author: string;
  created_at: string;
}

// ── Style maps ─────────────────────────────────────────────────────────────────

const SEVERITY_COLOURS: Record<HazardSeverity, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high:     "bg-orange-100 text-orange-700 border-orange-200",
  medium:   "bg-amber-100 text-amber-700 border-amber-200",
  low:      "bg-green-100 text-green-700 border-green-200",
};

const STATUS_COLOURS: Record<HazardStatus, string> = {
  open:         "bg-red-100 text-red-700",
  under_review: "bg-blue-100 text-blue-700",
  mitigated:    "bg-amber-100 text-amber-700",
  closed:       "bg-slate-100 text-slate-500",
  accepted:     "bg-violet-100 text-violet-700",
};

const STATUS_LABELS: Record<HazardStatus, string> = {
  open:         "Open",
  under_review: "Under Review",
  mitigated:    "Mitigated",
  closed:       "Closed",
  accepted:     "Accepted",
};

const STATUS_ICONS: Record<HazardStatus, React.FC<{ className?: string }>> = {
  open:         ({ className }) => <AlertTriangle className={className} />,
  under_review: ({ className }) => <Clock className={className} />,
  mitigated:    ({ className }) => <Shield className={className} />,
  closed:       ({ className }) => <XCircle className={className} />,
  accepted:     ({ className }) => <CheckCircle2 className={className} />,
};

const TYPE_COLOURS: Record<HazardEntryType, string> = {
  hazard: "bg-red-50 text-red-600 border-red-200",
  risk:   "bg-orange-50 text-orange-600 border-orange-200",
  issue:  "bg-slate-50 text-slate-600 border-slate-200",
};

function riskScoreColour(score: number): string {
  if (score >= 15) return "bg-red-500 text-white";
  if (score >= 10) return "bg-orange-500 text-white";
  if (score >= 5)  return "bg-amber-400 text-white";
  return "bg-green-500 text-white";
}

function riskScoreLabel(score: number): string {
  if (score >= 15) return "Critical";
  if (score >= 10) return "High";
  if (score >= 5)  return "Medium";
  return "Low";
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return iso; }
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

// ── Risk matrix ────────────────────────────────────────────────────────────────

const LIKELIHOODS: HazardLikelihood[] = ["almost_certain", "likely", "possible", "unlikely", "rare"];
const SEVERITIES: HazardSeverity[]   = ["low", "medium", "high", "critical"];

const SEV_W: Record<HazardSeverity, number>   = { critical: 4, high: 3, medium: 2, low: 1 };
const LIK_W: Record<HazardLikelihood, number> = { almost_certain: 5, likely: 4, possible: 3, unlikely: 2, rare: 1 };

function RiskMatrix({ severity, likelihood }: { severity: HazardSeverity; likelihood: HazardLikelihood }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Risk matrix</p>
      <div className="flex gap-1.5">
        {/* Y-axis labels */}
        <div className="flex flex-col-reverse items-end justify-around pr-2 gap-1" style={{ width: 90 }}>
          {LIKELIHOODS.map((l) => (
            <span
              key={l}
              className={cn(
                "text-[9px] capitalize leading-tight",
                l === likelihood ? "font-bold text-slate-800" : "text-slate-400"
              )}
            >
              {l.replace("_", " ")}
            </span>
          ))}
          <span className="text-[8px] text-slate-300 mt-1">↑ Likelihood</span>
        </div>

        {/* Grid */}
        <div className="flex flex-col-reverse gap-1 flex-1">
          {LIKELIHOODS.map((l) => (
            <div key={l} className="flex gap-1">
              {SEVERITIES.map((s) => {
                const score = SEV_W[s] * LIK_W[l];
                const isActive = s === severity && l === likelihood;
                let cellColour = "bg-green-100 text-green-700";
                if (score >= 15) cellColour = "bg-red-400 text-white";
                else if (score >= 10) cellColour = "bg-orange-400 text-white";
                else if (score >= 5)  cellColour = "bg-amber-300 text-amber-900";
                return (
                  <div
                    key={s}
                    className={cn(
                      "flex-1 h-8 rounded flex items-center justify-center text-[11px] font-bold transition-all",
                      cellColour,
                      isActive && "ring-2 ring-slate-800 ring-offset-1 scale-110 z-10 relative shadow-sm"
                    )}
                  >
                    {score}
                  </div>
                );
              })}
            </div>
          ))}
          {/* X-axis labels */}
          <div className="flex gap-1 mt-1">
            {SEVERITIES.map((s) => (
              <span
                key={s}
                className={cn(
                  "flex-1 text-center text-[9px] capitalize",
                  s === severity ? "font-bold text-slate-800" : "text-slate-400"
                )}
              >
                {s}
              </span>
            ))}
          </div>
          <div className="text-[8px] text-slate-300 text-center">Severity →</div>
        </div>
      </div>
    </div>
  );
}

// ── Field display ──────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <div className="text-sm text-slate-800">{children}</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  entryId: string;
}

export function HazardLogDetailView({ entryId }: Props) {
  const router = useRouter();
  const [entry, setEntry] = useState<HazardEntry | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const load = useCallback(async () => {
    const [entryRes, commentsRes] = await Promise.all([
      supabase
        .from("hazard_log_entries")
        .select(`
          id, reference_number, entry_type, title, description,
          severity, likelihood, risk_score, status, owner,
          mitigation_actions, residual_risk, date_identified,
          date_reviewed, date_closed, organisation_id, created_at, updated_at,
          organisations!inner(name)
        `)
        .eq("id", entryId)
        .single(),
      supabase
        .from("hazard_log_comments")
        .select("id, comment_text, author, created_at")
        .eq("hazard_entry_id", entryId)
        .order("created_at", { ascending: true }),
    ]);

    if (entryRes.data) {
      setEntry({
        ...entryRes.data,
        organisation_name: (entryRes.data as any).organisations?.name ?? "Unknown",
      });
    }
    if (commentsRes.data) setComments(commentsRes.data);
    setLoading(false);
  }, [entryId]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = useCallback(async (newStatus: HazardStatus) => {
    if (!entry) return;
    setSavingStatus(true);
    const updates: Record<string, string | null> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === "closed" && !entry.date_closed) {
      updates.date_closed = new Date().toISOString().slice(0, 10);
    }
    if (newStatus === "under_review" && !entry.date_reviewed) {
      updates.date_reviewed = new Date().toISOString().slice(0, 10);
    }
    await supabase.from("hazard_log_entries").update(updates).eq("id", entryId);
    setEntry((prev) => prev ? { ...prev, status: newStatus, ...updates } : prev);
    setSavingStatus(false);
  }, [entry, entryId]);

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim() || !commentAuthor.trim()) return;
    setSubmittingComment(true);
    const { data } = await supabase
      .from("hazard_log_comments")
      .insert({
        hazard_entry_id: entryId,
        comment_text: newComment.trim(),
        author: commentAuthor.trim(),
      })
      .select("id, comment_text, author, created_at")
      .single();
    if (data) {
      setComments((prev) => [...prev, data]);
      setNewComment("");
    }
    setSubmittingComment(false);
  }, [entryId, newComment, commentAuthor]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Loading entry…
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-slate-400">
        <p>Entry not found.</p>
        <button
          onClick={() => router.push("/hazard-log")}
          className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Hazard Log
        </button>
      </div>
    );
  }

  const StatusIcon = STATUS_ICONS[entry.status];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <button
          onClick={() => router.push("/hazard-log")}
          className="mb-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Hazard Log
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex items-start gap-4">
            {/* Risk score */}
            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <div className={cn(
                "flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold",
                riskScoreColour(entry.risk_score)
              )}>
                {entry.risk_score}
              </div>
              <span className="text-[10px] font-semibold text-slate-400">
                {riskScoreLabel(entry.risk_score)}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  {entry.reference_number}
                </span>
                <span className={cn(
                  "rounded border px-1.5 py-0.5 text-[10px] font-semibold capitalize",
                  TYPE_COLOURS[entry.entry_type]
                )}>
                  {entry.entry_type}
                </span>
              </div>
              <h1 className="mt-0.5 text-base font-semibold text-slate-900 leading-snug">
                {entry.title}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {entry.organisation_name}
                </span>
                {entry.owner && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" /> {entry.owner}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Identified {formatDate(entry.date_identified)}
                </span>
              </div>
            </div>
          </div>

          {/* Status selector */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
              STATUS_COLOURS[entry.status]
            )}>
              <StatusIcon className="h-3.5 w-3.5" />
              {STATUS_LABELS[entry.status]}
            </span>
            <div className="relative">
              <select
                value={entry.status}
                onChange={(e) => handleStatusChange(e.target.value as HazardStatus)}
                disabled={savingStatus}
                className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50"
              >
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="mitigated">Mitigated</option>
                <option value="accepted">Accepted</option>
                <option value="closed">Closed</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-6 grid grid-cols-3 gap-6">

          {/* Left: main info */}
          <div className="col-span-2 flex flex-col gap-5">

            {/* Description */}
            {entry.description && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Description</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{entry.description}</p>
              </div>
            )}

            {/* Risk details */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-4">Risk assessment</p>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Field label="Severity">
                  <span className={cn(
                    "inline-flex rounded border px-2 py-0.5 text-xs font-semibold capitalize",
                    SEVERITY_COLOURS[entry.severity]
                  )}>
                    {entry.severity}
                  </span>
                </Field>
                <Field label="Likelihood">
                  <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 capitalize">
                    {entry.likelihood.replace("_", " ")}
                  </span>
                </Field>
                <Field label="Risk score">
                  <span className={cn(
                    "inline-flex h-7 w-10 items-center justify-center rounded-lg text-sm font-bold",
                    riskScoreColour(entry.risk_score)
                  )}>
                    {entry.risk_score}
                  </span>
                </Field>
              </div>
              <RiskMatrix severity={entry.severity} likelihood={entry.likelihood} />
            </div>

            {/* Mitigation */}
            {(entry.mitigation_actions || entry.residual_risk) && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-4">Mitigation</p>
                <div className="flex flex-col gap-4">
                  {entry.mitigation_actions && (
                    <Field label="Mitigation actions">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mt-1">
                        {entry.mitigation_actions}
                      </p>
                    </Field>
                  )}
                  {entry.residual_risk && (
                    <Field label="Residual risk">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mt-1">
                        {entry.residual_risk}
                      </p>
                    </Field>
                  )}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-4 w-4 text-slate-400" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Comments ({comments.length})
                </p>
              </div>

              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 mb-4">No comments yet.</p>
              ) : (
                <div className="flex flex-col gap-3 mb-4">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                        {c.author.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 rounded-lg bg-slate-50 px-3 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-slate-700">{c.author}</span>
                          <span className="text-[10px] text-slate-400">{formatDateTime(c.created_at)}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {c.comment_text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* New comment */}
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                <input
                  type="text"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  placeholder="Your name…"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <div className="flex gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment…"
                    rows={2}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddComment();
                    }}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={submittingComment || !newComment.trim() || !commentAuthor.trim()}
                    className="bg-red-600 hover:bg-red-700 self-end"
                    size="sm"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400">⌘↵ to submit</p>
              </div>
            </div>
          </div>

          {/* Right: metadata */}
          <div className="flex flex-col gap-4">

            {/* Status timeline */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Dates</p>
              <div className="flex flex-col gap-3">
                <Field label="Identified">
                  {formatDate(entry.date_identified)}
                </Field>
                {entry.date_reviewed && (
                  <Field label="Reviewed">
                    {formatDate(entry.date_reviewed)}
                  </Field>
                )}
                {entry.date_closed && (
                  <Field label="Closed">
                    {formatDate(entry.date_closed)}
                  </Field>
                )}
                <Field label="Last updated">
                  <span className="text-xs text-slate-500">{formatDateTime(entry.updated_at)}</span>
                </Field>
              </div>
            </div>

            {/* Details */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Details</p>
              <div className="flex flex-col gap-3">
                <Field label="Reference">
                  <span className="font-mono text-xs font-bold text-slate-700">
                    {entry.reference_number}
                  </span>
                </Field>
                <Field label="Type">
                  <span className={cn(
                    "inline-flex rounded border px-1.5 py-0.5 text-[10px] font-semibold capitalize",
                    TYPE_COLOURS[entry.entry_type]
                  )}>
                    {entry.entry_type}
                  </span>
                </Field>
                <Field label="Organisation">
                  {entry.organisation_name}
                </Field>
                {entry.owner && (
                  <Field label="Owner">
                    {entry.owner}
                  </Field>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Score legend</p>
              <div className="flex flex-col gap-1.5">
                {[
                  { range: "15–20", label: "Critical", colour: "bg-red-500" },
                  { range: "10–14", label: "High",     colour: "bg-orange-500" },
                  { range: "5–9",  label: "Medium",   colour: "bg-amber-400" },
                  { range: "1–4",  label: "Low",      colour: "bg-green-500" },
                ].map(({ range, label, colour }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={cn("h-4 w-4 rounded flex-shrink-0", colour)} />
                    <span className="text-xs text-slate-600">
                      <span className="font-semibold">{range}</span> — {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
