"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Globe, Tag, Layers, ChevronDown,
  Building2, CheckCircle2, Clock, AlertCircle, Ban, Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import { PathwayFlowchart, PathwayStep, StepProgress } from "./PathwayFlowchart";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type StepStatus = "not_started" | "in_progress" | "complete" | "blocked" | "not_applicable";

interface Pathway {
  id: string;
  name: string;
  description: string;
  jurisdiction: string;
  pathway_type: string;
  source_url: string | null;
  extracted_at: string;
}

interface Organisation {
  id: string;
  name: string;
}

const TYPE_LABELS: Record<string, string> = {
  regulatory_approval: "Regulatory Approval",
  clinical_safety: "Clinical Safety",
  data_governance: "Data Governance",
  procurement: "Procurement",
  certification: "Certification",
  post_market_surveillance: "Post-Market Surveillance",
  other: "Other",
};

const TYPE_COLOURS: Record<string, string> = {
  regulatory_approval: "bg-blue-100 text-blue-700",
  clinical_safety: "bg-red-100 text-red-700",
  data_governance: "bg-violet-100 text-violet-700",
  procurement: "bg-amber-100 text-amber-700",
  certification: "bg-emerald-100 text-emerald-700",
  post_market_surveillance: "bg-orange-100 text-orange-700",
  other: "bg-slate-100 text-slate-600",
};

const STATUS_COLOURS: Record<StepStatus, string> = {
  complete:       "bg-emerald-500",
  in_progress:    "bg-blue-500",
  blocked:        "bg-red-500",
  not_applicable: "bg-slate-300",
  not_started:    "bg-slate-200",
};

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ progressMap, totalSteps }: {
  progressMap: Map<string, StepProgress>;
  totalSteps: number;
}) {
  if (totalSteps === 0) return null;

  const counts: Record<StepStatus, number> = {
    complete: 0, in_progress: 0, blocked: 0, not_applicable: 0, not_started: 0,
  };
  for (const p of Array.from(progressMap.values())) {
    counts[p.status] = (counts[p.status] ?? 0) + 1;
  }
  // Steps with no progress record count as not_started
  counts.not_started += totalSteps - progressMap.size;

  const completePct = Math.round((counts.complete / totalSteps) * 100);

  return (
    <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-700">{completePct}% complete</span>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {(["complete", "in_progress", "blocked", "not_applicable", "not_started"] as StepStatus[]).map((s) => (
              counts[s] > 0 ? (
                <span key={s} className="flex items-center gap-1">
                  <span className={cn("inline-block h-2 w-2 rounded-full", STATUS_COLOURS[s])} />
                  {counts[s]} {s.replace("_", " ")}
                </span>
              ) : null
            ))}
          </div>
        </div>
        <span className="text-xs text-slate-400">{counts.complete} / {totalSteps} steps</span>
      </div>
      {/* Segmented bar */}
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex">
        {(["complete", "in_progress", "blocked", "not_applicable", "not_started"] as StepStatus[]).map((s) => (
          <div
            key={s}
            className={cn("h-full transition-all", STATUS_COLOURS[s])}
            style={{ width: `${(counts[s] / totalSteps) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  pathwayId: string;
}

export function PathwayDetailView({ pathwayId }: Props) {
  const router = useRouter();
  const [pathway, setPathway] = useState<Pathway | null>(null);
  const [steps, setSteps] = useState<PathwayStep[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [progressMap, setProgressMap] = useState<Map<string, StepProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Load pathway + steps + orgs
  useEffect(() => {
    Promise.all([
      supabase.from("governance_pathways").select("*").eq("id", pathwayId).single(),
      supabase.from("pathway_steps").select("*").eq("pathway_id", pathwayId).order("step_number"),
      supabase.from("organisations").select("id, name").order("name"),
    ]).then(([pathwayRes, stepsRes, orgsRes]) => {
      if (pathwayRes.data) setPathway(pathwayRes.data);
      if (stepsRes.data) {
        setSteps(stepsRes.data.map((s: any) => ({
          ...s,
          dependencies: Array.isArray(s.dependencies) ? s.dependencies :
            (typeof s.dependencies === "string" ? JSON.parse(s.dependencies) : []),
        })));
      }
      if (orgsRes.data) setOrganisations(orgsRes.data);
      setLoading(false);
    });
  }, [pathwayId]);

  // Load progress when org changes
  const loadProgress = useCallback(async (orgId: string) => {
    if (!orgId) { setProgressMap(new Map()); return; }
    const { data } = await supabase
      .from("pathway_progress")
      .select("id, step_id, status, notes, assigned_to, completion_date")
      .eq("pathway_id", pathwayId)
      .eq("organisation_id", orgId);

    const map = new Map<string, StepProgress>();
    for (const row of data ?? []) {
      map.set(row.step_id, {
        step_id: row.step_id,
        status: row.status as StepStatus,
        notes: row.notes ?? "",
        assigned_to: row.assigned_to ?? "",
        completion_date: row.completion_date,
      });
    }
    setProgressMap(map);
  }, [pathwayId]);

  useEffect(() => { loadProgress(selectedOrgId); }, [selectedOrgId, loadProgress]);

  // Debounced upsert
  const upsertProgress = useCallback(async (stepId: string, updates: Partial<StepProgress>) => {
    if (!selectedOrgId) return;

    const existing = progressMap.get(stepId);
    const merged: StepProgress = {
      step_id: stepId,
      status: "not_started",
      notes: "",
      assigned_to: "",
      completion_date: null,
      ...existing,
      ...updates,
    };

    setProgressMap((prev) => {
      const next = new Map(prev);
      next.set(stepId, merged);
      return next;
    });

    await supabase.from("pathway_progress").upsert({
      pathway_id: pathwayId,
      organisation_id: selectedOrgId,
      step_id: stepId,
      status: merged.status,
      notes: merged.notes || null,
      assigned_to: merged.assigned_to || null,
      completion_date: merged.status === "complete" && !merged.completion_date
        ? new Date().toISOString().slice(0, 10)
        : merged.completion_date,
      updated_at: new Date().toISOString(),
    }, { onConflict: "pathway_id,organisation_id,step_id" });
  }, [selectedOrgId, progressMap, pathwayId]);

  const handleStatusChange = useCallback((stepId: string, status: StepStatus) => {
    upsertProgress(stepId, { status });
  }, [upsertProgress]);

  const handleNotesChange = useCallback((stepId: string, notes: string) => {
    // Update local state immediately
    setProgressMap((prev) => {
      const next = new Map(prev);
      const existing = prev.get(stepId);
      next.set(stepId, { step_id: stepId, status: "not_started", assigned_to: "", completion_date: null, ...existing, notes });
      return next;
    });

    // Debounce save to DB
    const timer = saveTimers.current.get(stepId);
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => {
      upsertProgress(stepId, { notes });
    }, 800);
    saveTimers.current.set(stepId, newTimer);
  }, [upsertProgress]);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading pathway…</div>;
  }

  if (!pathway) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-slate-400">
        <p>Pathway not found.</p>
        <button onClick={() => router.push("/pathways")} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back to Pathways
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <button
          onClick={() => router.push("/pathways")}
          className="mb-2 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All Pathways
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-slate-900 leading-snug">{pathway.name}</h1>
            {pathway.description && (
              <p className="mt-0.5 text-xs text-slate-500 max-w-2xl">{pathway.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                TYPE_COLOURS[pathway.pathway_type] ?? "bg-slate-100 text-slate-600"
              )}>
                <Tag className="h-2.5 w-2.5" />
                {TYPE_LABELS[pathway.pathway_type] ?? pathway.pathway_type}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                <Globe className="h-2.5 w-2.5" /> {pathway.jurisdiction}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                <Layers className="h-2.5 w-2.5" /> {steps.length} steps
              </span>
            </div>
          </div>

          {/* Org selector */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400" />
            <div className="relative">
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">— Select organisation —</option>
                {organisations.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar (only when org selected) */}
      {selectedOrgId && (
        <ProgressBar progressMap={progressMap} totalSteps={steps.length} />
      )}

      {/* Flowchart */}
      <div className="flex-1 overflow-hidden">
        <PathwayFlowchart
          steps={steps}
          progressMap={progressMap}
          showProgress={Boolean(selectedOrgId)}
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
        />
      </div>
    </div>
  );
}
