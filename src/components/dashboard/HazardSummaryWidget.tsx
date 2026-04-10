"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import { useOrgContext } from "@/stores/context/OrgContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface HazardRow {
  id: string;
  reference_number: string;
  title: string;
  risk_score: number;
  severity: string;
  organisation_name: string;
}

function riskColour(score: number) {
  if (score >= 15) return "bg-red-500 text-white";
  if (score >= 10) return "bg-orange-500 text-white";
  return "bg-amber-400 text-white";
}

export function HazardSummaryWidget() {
  const router = useRouter();
  const { activeOrgId } = useOrgContext();
  const [entries,  setEntries]  = useState<HazardRow[]>([]);
  const [allCount, setAllCount] = useState(0);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let query = supabase
      .from("hazard_log_entries")
      .select(`id, reference_number, title, risk_score, severity, organisations!inner(name)`)
      .eq("status", "open")
      .gte("risk_score", 10)
      .order("risk_score", { ascending: false })
      .limit(4);

    if (activeOrgId) query = query.eq("organisation_id", activeOrgId);

    let countQuery = supabase
      .from("hazard_log_entries")
      .select("id", { count: "exact", head: true })
      .eq("status", "open");

    if (activeOrgId) countQuery = countQuery.eq("organisation_id", activeOrgId);

    Promise.all([query, countQuery]).then(([res, countRes]) => {
      setEntries(
        (res.data ?? []).map((row: any) => ({
          ...row,
          organisation_name: row.organisations?.name ?? "",
        }))
      );
      setAllCount(countRes.count ?? 0);
      setLoading(false);
    });
  }, [activeOrgId]);

  const critical = entries.filter((e) => e.risk_score >= 15).length;
  const high     = entries.filter((e) => e.risk_score >= 10 && e.risk_score < 15).length;

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center justify-center h-36">
        <span className="text-xs text-slate-400">Loading hazard summary…</span>
      </div>
    );
  }

  if (allCount === 0) {
    return (
      <div
        className="rounded-xl border border-slate-200 bg-white p-5 cursor-pointer hover:border-green-300 hover:shadow-sm transition-all"
        onClick={() => router.push("/hazard-log")}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100">
            <Shield className="h-3.5 w-3.5 text-green-600" />
          </div>
          <p className="text-sm font-semibold text-slate-800">Hazard Log</p>
        </div>
        <p className="text-xs text-green-600 font-medium">No open hazards · All clear</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-5 cursor-pointer hover:shadow-sm transition-all group",
        critical > 0 ? "border-red-200 hover:border-red-300" : "border-orange-200 hover:border-orange-300"
      )}
      onClick={() => router.push("/hazard-log")}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            critical > 0 ? "bg-red-100" : "bg-orange-100"
          )}>
            <AlertTriangle className={cn("h-3.5 w-3.5", critical > 0 ? "text-red-600" : "text-orange-600")} />
          </div>
          <p className="text-sm font-semibold text-slate-800">Hazard Log</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "text-xl font-bold",
            critical > 0 ? "text-red-600" : "text-orange-600"
          )}>
            {allCount}
          </span>
          <span className="text-xs text-slate-400">open</span>
          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-red-400 transition-colors" />
        </div>
      </div>

      {/* Severity pills */}
      <div className="flex items-center gap-2 mb-3">
        {critical > 0 && (
          <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">
            {critical} critical
          </span>
        )}
        {high > 0 && (
          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-semibold text-orange-700">
            {high} high
          </span>
        )}
        {allCount > entries.length && (
          <span className="text-[11px] text-slate-400">+{allCount - entries.length} more</span>
        )}
      </div>

      {/* Top entries */}
      {entries.length > 0 && (
        <div className="border-t border-slate-100 pt-3 flex flex-col gap-1.5">
          {entries.slice(0, 3).map((e) => (
            <div key={e.id} className="flex items-center gap-2">
              <div className={cn(
                "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[9px] font-bold",
                riskColour(e.risk_score)
              )}>
                {e.risk_score}
              </div>
              <span className="text-[11px] text-slate-500 font-mono flex-shrink-0">
                {e.reference_number}
              </span>
              <span className="text-[11px] text-slate-700 truncate">{e.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
