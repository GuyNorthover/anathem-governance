"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Flag, ChevronDown, ChevronRight,
  CheckCircle2, Clock, XCircle, Minus,
  AlertTriangle, FileText, ExternalLink,
  Check, Calendar, User, StickyNote,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import {
  EU_STEPS,
  EUStep,
  StepStatus,
  STATUS_COLOURS,
  STATUS_DOT,
  STATUS_LABELS,
} from "@/lib/eu-accreditation-steps";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Cross-module evidence ──────────────────────────────────────────────────────

interface StepEvidence {
  // Step 6: risk management
  hazardTotal:    number;
  hazardMitigated: number;
  hazardOpen:     number;
  // Step 11: privacy
  dpiaCount:      number;
  // Step 7/8: documents
  documentCount:  number;
}

const EMPTY_EVIDENCE: StepEvidence = {
  hazardTotal: 0, hazardMitigated: 0, hazardOpen: 0,
  dpiaCount: 0, documentCount: 0,
};

// ── DB row ─────────────────────────────────────────────────────────────────────

interface ProgressRow {
  id: string;
  step_number: number;
  status: StepStatus;
  notes: string | null;
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  updated_at: string;
}

// ── Status icon ────────────────────────────────────────────────────────────────

function StatusIcon({ status, className }: { status: StepStatus; className?: string }) {
  switch (status) {
    case "complete":       return <CheckCircle2 className={cn("text-green-600", className)} />;
    case "in_progress":   return <Clock         className={cn("text-blue-600",  className)} />;
    case "blocked":       return <XCircle       className={cn("text-red-600",   className)} />;
    case "not_applicable":return <Minus         className={cn("text-slate-400", className)} />;
    default:              return <AlertTriangle className={cn("text-slate-300", className)} />;
  }
}

// ── Overall progress bar ───────────────────────────────────────────────────────

function ProgressSummary({ progress }: { progress: Map<number, ProgressRow> }) {
  const complete      = EU_STEPS.filter((s) => progress.get(s.number)?.status === "complete").length;
  const inProgress    = EU_STEPS.filter((s) => progress.get(s.number)?.status === "in_progress").length;
  const blocked       = EU_STEPS.filter((s) => progress.get(s.number)?.status === "blocked").length;
  const notApplicable = EU_STEPS.filter((s) => progress.get(s.number)?.status === "not_applicable").length;
  const notStarted    = EU_STEPS.length - complete - inProgress - blocked - notApplicable;

  const pct = Math.round((complete / EU_STEPS.length) * 100);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-800">Overall progress</p>
        <span className="text-2xl font-bold text-slate-900">{pct}%</span>
      </div>

      {/* Segmented progress bar */}
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 gap-0.5">
        {complete > 0 && (
          <div
            className="bg-green-500 rounded-full transition-all"
            style={{ width: `${(complete / EU_STEPS.length) * 100}%` }}
          />
        )}
        {inProgress > 0 && (
          <div
            className="bg-blue-500 rounded-full transition-all"
            style={{ width: `${(inProgress / EU_STEPS.length) * 100}%` }}
          />
        )}
        {blocked > 0 && (
          <div
            className="bg-red-500 rounded-full transition-all"
            style={{ width: `${(blocked / EU_STEPS.length) * 100}%` }}
          />
        )}
        {notApplicable > 0 && (
          <div
            className="bg-slate-200 rounded-full transition-all"
            style={{ width: `${(notApplicable / EU_STEPS.length) * 100}%` }}
          />
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-4">
        {[
          { label: "Complete",       count: complete,      colour: "text-green-600 bg-green-50" },
          { label: "In progress",    count: inProgress,    colour: "text-blue-600 bg-blue-50" },
          { label: "Blocked",        count: blocked,       colour: "text-red-600 bg-red-50" },
          { label: "Not started",    count: notStarted,    colour: "text-slate-500 bg-slate-50" },
          { label: "N/A",            count: notApplicable, colour: "text-slate-400 bg-slate-50" },
        ].map(({ label, count, colour }) => (
          <div key={label} className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1", colour)}>
            <span className="text-sm font-bold">{count}</span>
            <span className="text-[11px] font-medium">{label}</span>
          </div>
        ))}
        <div className="ml-auto text-[11px] text-slate-400">
          {complete} of {EU_STEPS.length} steps complete
        </div>
      </div>
    </div>
  );
}

// ── Step card ──────────────────────────────────────────────────────────────────

interface StepCardProps {
  step: EUStep;
  row: ProgressRow | undefined;
  evidence: StepEvidence;
  onStatusChange: (stepNumber: number, status: StepStatus) => void;
  onNotesChange: (stepNumber: number, notes: string) => void;
  onAssigneeChange: (stepNumber: number, assignee: string) => void;
  onDueDateChange: (stepNumber: number, date: string) => void;
  saving: boolean;
}

function StepCard({
  step, row, evidence, onStatusChange, onNotesChange, onAssigneeChange, onDueDateChange, saving,
}: StepCardProps) {
  const [open, setOpen] = useState(false);
  const status: StepStatus = row?.status ?? "not_started";

  const isNa = status === "not_applicable";

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      status === "complete"        ? "border-green-200 bg-green-50/30"  :
      status === "in_progress"     ? "border-blue-200 bg-blue-50/20"   :
      status === "blocked"         ? "border-red-200 bg-red-50/20"     :
      status === "not_applicable"  ? "border-slate-100 bg-slate-50/50 opacity-60" :
      "border-slate-200 bg-white"
    )}>
      {/* Header row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-4 px-5 py-4 text-left"
      >
        <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-bold",
            status === "complete"       ? "border-green-500 bg-green-500 text-white"    :
            status === "in_progress"    ? "border-blue-500 bg-blue-500 text-white"     :
            status === "blocked"        ? "border-red-500 bg-red-500 text-white"       :
            status === "not_applicable" ? "border-slate-200 bg-slate-100 text-slate-400" :
            "border-slate-200 bg-white text-slate-500"
          )}>
            {status === "complete" ? <Check className="h-3.5 w-3.5" /> : step.number}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn(
              "text-sm font-semibold",
              isNa ? "text-slate-400 line-through" : "text-slate-900"
            )}>
              {step.title}
            </p>
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              STATUS_COLOURS[status]
            )}>
              {STATUS_LABELS[status]}
            </span>
            {row?.due_date && status !== "complete" && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <Calendar className="h-3 w-3" />
                {new Date(row.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
            {row?.assigned_to && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <User className="h-3 w-3" /> {row.assigned_to}
              </span>
            )}
          </div>
          {!open && (
            <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{step.summary}</p>
          )}
        </div>

        <div className="flex-shrink-0 mt-0.5">
          {open
            ? <ChevronDown className="h-4 w-4 text-slate-400" />
            : <ChevronRight className="h-4 w-4 text-slate-400" />
          }
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 flex flex-col gap-5">
          {/* Status + metadata controls */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => onStatusChange(step.number, e.target.value as StepStatus)}
                  disabled={saving}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                >
                  <option value="not_started">Not started</option>
                  <option value="in_progress">In progress</option>
                  <option value="complete">Complete</option>
                  <option value="blocked">Blocked</option>
                  <option value="not_applicable">N/A</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Owner</label>
              <input
                type="text"
                defaultValue={row?.assigned_to ?? ""}
                onBlur={(e) => onAssigneeChange(step.number, e.target.value)}
                placeholder="Name or role…"
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Due date</label>
              <input
                type="date"
                defaultValue={row?.due_date ?? ""}
                onBlur={(e) => onDueDateChange(step.number, e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">What to do</p>
            <ul className="flex flex-col gap-1.5">
              {step.what_to_do.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="flex-shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Documents to review */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Documents to review</p>
              <ul className="flex flex-col gap-1.5">
                {step.documents_to_review.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <FileText className="flex-shrink-0 h-3.5 w-3.5 text-blue-400 mt-0.5" />
                    <span>
                      <span className="font-medium">{doc.title}</span>
                      {doc.reference && (
                        <span className="text-slate-400"> — {doc.reference}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Documents to produce */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Documents to produce</p>
              <ul className="flex flex-col gap-1.5">
                {step.documents_to_complete.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <div className={cn(
                      "flex-shrink-0 h-3.5 w-3.5 mt-0.5 rounded-sm border",
                      status === "complete"
                        ? "bg-green-500 border-green-500 flex items-center justify-center"
                        : "border-slate-300 bg-white"
                    )}>
                      {status === "complete" && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Outputs */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Outputs / deliverables</p>
            <div className="flex flex-wrap gap-1.5">
              {step.outputs.map((output, i) => (
                <span
                  key={i}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[10px] font-medium",
                    status === "complete"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  )}
                >
                  {status === "complete" && <span className="mr-1">✓</span>}
                  {output}
                </span>
              ))}
            </div>
          </div>

          {/* Live evidence panel — Step 6: Hazard Log */}
          {step.number === 6 && evidence.hazardTotal > 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 mb-2">
                Live evidence from Hazard Log
              </p>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="font-semibold text-slate-700">
                  {evidence.hazardTotal} {evidence.hazardTotal === 1 ? "entry" : "entries"} logged
                </span>
                <span className="text-emerald-700 font-semibold">
                  {evidence.hazardMitigated} mitigated / accepted
                </span>
                {evidence.hazardOpen > 0 && (
                  <span className="text-red-600 font-semibold">
                    {evidence.hazardOpen} still open
                  </span>
                )}
              </div>
              <p className="text-[10px] text-emerald-600 mt-1">
                These entries contribute evidence toward your risk-management file.
                Review the Hazard Log to ensure all entries have mitigations documented.
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <StickyNote className="h-3.5 w-3.5 text-slate-400" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Notes</p>
            </div>
            <textarea
              defaultValue={row?.notes ?? ""}
              onBlur={(e) => onNotesChange(step.number, e.target.value)}
              placeholder="Internal notes, decisions, blockers, next actions…"
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────────

export function EUAccreditationView() {
  const [progress, setProgress] = useState<Map<number, ProgressRow>>(new Map());
  const [evidence, setEvidence] = useState<StepEvidence>(EMPTY_EVIDENCE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<StepStatus | "">("");

  // Debounce timers per step
  const debounceRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("eu_accreditation_progress")
      .select("*")
      .order("step_number");

    const map = new Map<number, ProgressRow>();
    (data ?? []).forEach((row: ProgressRow) => map.set(row.step_number, row));
    setProgress(map);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Load cross-module evidence (best-effort, non-blocking)
  useEffect(() => {
    Promise.all([
      supabase
        .from("hazard_log_entries")
        .select("id, status"),
      supabase
        .from("document_instances")
        .select("id", { count: "exact", head: true }),
    ]).then(([hazardRes, docRes]) => {
      const hazards = hazardRes.data ?? [];
      setEvidence({
        hazardTotal:     hazards.length,
        hazardMitigated: hazards.filter((h: any) => h.status === "mitigated" || h.status === "accepted").length,
        hazardOpen:      hazards.filter((h: any) => h.status === "open" || h.status === "under_review").length,
        dpiaCount:       0, // future: query ingestion jobs tagged as DPIA
        documentCount:   docRes.count ?? 0,
      });
    });
  }, []);

  const upsertStep = useCallback(async (
    stepNumber: number,
    updates: Partial<Omit<ProgressRow, "id" | "step_number" | "updated_at">>
  ) => {
    setSaving(true);
    const now = new Date().toISOString();

    // Optimistic update
    setProgress((prev) => {
      const next = new Map(prev);
      const existing = next.get(stepNumber);
      next.set(stepNumber, {
        id: existing?.id ?? crypto.randomUUID(),
        step_number: stepNumber,
        status: "not_started",
        notes: null,
        assigned_to: null,
        due_date: null,
        completed_at: null,
        updated_at: now,
        ...existing,
        ...updates,
      });
      return next;
    });

    const existing = progress.get(stepNumber);

    if (existing) {
      await supabase
        .from("eu_accreditation_progress")
        .update({ ...updates, updated_at: now })
        .eq("step_number", stepNumber);
    } else {
      await supabase
        .from("eu_accreditation_progress")
        .insert({
          step_number: stepNumber,
          status: "not_started",
          ...updates,
          updated_at: now,
          created_at: now,
        });
    }

    setSaving(false);
  }, [progress]);

  const handleStatusChange = useCallback((stepNumber: number, status: StepStatus) => {
    const extra: Partial<ProgressRow> = {};
    if (status === "complete") extra.completed_at = new Date().toISOString();
    upsertStep(stepNumber, { status, ...extra });
  }, [upsertStep]);

  const handleDebounced = useCallback((
    key: string,
    stepNumber: number,
    field: keyof Pick<ProgressRow, "notes" | "assigned_to" | "due_date">,
    value: string
  ) => {
    const existing = debounceRefs.current.get(key);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      upsertStep(stepNumber, { [field]: value || null });
      debounceRefs.current.delete(key);
    }, 800);
    debounceRefs.current.set(key, timer);
  }, [upsertStep]);

  const filteredSteps = filterStatus
    ? EU_STEPS.filter((s) => (progress.get(s.number)?.status ?? "not_started") === filterStatus)
    : EU_STEPS;

  return (
    <div className="flex flex-col gap-5 p-8 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-shrink-0">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600">
            <Flag className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">EU MDR Accreditation</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              16-step pathway for EU MDR conformity as an ambient voice technology medical device software manufacturer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saving && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </div>
          )}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as StepStatus | "")}
              className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-7 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All steps</option>
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="complete">Complete</option>
              <option value="blocked">Blocked</option>
              <option value="not_applicable">N/A</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Important notice */}
      <div className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex-shrink-0">
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <span className="font-semibold">This is a complex, long-running regulatory process.</span>{" "}
          EU MDR accreditation for a Class I or higher medical device software typically takes 12–24 months with dedicated regulatory affairs resource.
          Each step requires specialist legal and regulatory review before completion. No step should be marked complete without human expert sign-off.
          This tracker is a planning and progress tool — it does not replace formal regulatory counsel.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400 py-16 text-center">Loading progress…</div>
      ) : (
        <>
          {/* Progress summary */}
          <ProgressSummary progress={progress} />

          {/* Steps */}
          <div className="flex flex-col gap-2">
            {filteredSteps.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No steps match the current filter.</p>
            ) : (
              filteredSteps.map((step) => (
                <StepCard
                  key={step.number}
                  step={step}
                  row={progress.get(step.number)}
                  evidence={evidence}
                  saving={saving}
                  onStatusChange={handleStatusChange}
                  onNotesChange={(n, v) => handleDebounced(`notes-${n}`, n, "notes", v)}
                  onAssigneeChange={(n, v) => handleDebounced(`assignee-${n}`, n, "assigned_to", v)}
                  onDueDateChange={(n, v) => handleDebounced(`due-${n}`, n, "due_date", v)}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
