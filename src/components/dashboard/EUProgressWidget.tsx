"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flag, ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import { EU_STEPS, STATUS_DOT, type StepStatus } from "@/lib/eu-accreditation-steps";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function EUProgressWidget() {
  const router  = useRouter();
  const [progress, setProgress] = useState<Map<number, StepStatus>>(new Map());
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    supabase
      .from("eu_accreditation_progress")
      .select("step_number, status")
      .then(({ data }) => {
        const map = new Map<number, StepStatus>();
        (data ?? []).forEach((row: any) => map.set(row.step_number, row.status as StepStatus));
        setProgress(map);
        setLoading(false);
      });
  }, []);

  const complete    = EU_STEPS.filter((s) => progress.get(s.number) === "complete").length;
  const inProgress  = EU_STEPS.filter((s) => progress.get(s.number) === "in_progress").length;
  const blocked     = EU_STEPS.filter((s) => progress.get(s.number) === "blocked").length;
  const pct         = Math.round((complete / EU_STEPS.length) * 100);

  // Nearest actionable steps: in_progress first, then earliest not_started
  const actionable = [
    ...EU_STEPS.filter((s) => progress.get(s.number) === "in_progress"),
    ...EU_STEPS.filter((s) => !progress.get(s.number) || progress.get(s.number) === "not_started"),
  ].slice(0, 3);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center justify-center h-36">
        <span className="text-xs text-slate-400">Loading EU progress…</span>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-5 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group"
      onClick={() => router.push("/eu-accreditation")}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
            <Flag className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-slate-800">EU MDR Accreditation</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-bold text-slate-900">{pct}%</span>
          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden mb-2">
        <div
          className="h-full rounded-full bg-green-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Counts */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] mb-3">
        <span className="font-semibold text-green-600">{complete} complete</span>
        {inProgress > 0 && <span className="font-semibold text-blue-600">{inProgress} in progress</span>}
        {blocked > 0 && (
          <span className="flex items-center gap-1 font-semibold text-red-600">
            <AlertTriangle className="h-3 w-3" /> {blocked} blocked
          </span>
        )}
        <span className="text-slate-400 ml-auto">{EU_STEPS.length} steps total</span>
      </div>

      {/* Next steps */}
      {actionable.length > 0 && (
        <div className="border-t border-slate-100 pt-3 flex flex-col gap-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
            {inProgress > 0 ? "In progress" : "Up next"}
          </p>
          {actionable.map((s) => {
            const status = progress.get(s.number) ?? "not_started";
            return (
              <div key={s.number} className="flex items-center gap-2">
                <div className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", STATUS_DOT[status])} />
                <span className="text-[11px] text-slate-600 truncate">
                  <span className="font-mono text-[10px] text-slate-400 mr-1">#{s.number}</span>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
