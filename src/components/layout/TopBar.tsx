"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2, ChevronDown, X, AlertTriangle,
  FileText, Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrgContext } from "@/stores/context/OrgContext";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Page title map ─────────────────────────────────────────────────────────────

const PAGE_TITLES: [string, string][] = [
  ["/knowledge-base", "Knowledge Base"],
  ["/source-docs",    "Source Docs"],
  ["/documents",      "Documents"],
  ["/organisations",  "Organisations"],
  ["/pathways",       "Governance Pathways"],
  ["/hazard-log",     "Hazard Log"],
  ["/eu-accreditation", "EU MDR Accreditation"],
  ["/eu-templates",   "EU Document Library"],
  ["/prompts",        "Prompt Library"],
  ["/ingestion",      "Ingestion"],
  ["/audit",          "Audit Log"],
  ["/",               "Dashboard"],
];

function getPageTitle(pathname: string): string {
  for (const [route, label] of PAGE_TITLES) {
    if (route === "/" ? pathname === "/" : pathname.startsWith(route)) {
      return label;
    }
  }
  return "Governance";
}

// ── Alert counts ──────────────────────────────────────────────────────────────

interface Alerts {
  staleDocs: number;
  openCriticalHazards: number;
  euBlocked: number;
}

// ── Main component ─────────────────────────────────────────────────────────────

export function TopBar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { activeOrgId, activeOrgName, setActiveOrg, clearActiveOrg } = useOrgContext();

  const [orgs, setOrgs]   = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen]   = useState(false);
  const [alerts, setAlerts] = useState<Alerts>({ staleDocs: 0, openCriticalHazards: 0, euBlocked: 0 });

  // Load organisations
  useEffect(() => {
    supabase
      .from("organisations")
      .select("id, name")
      .order("name")
      .then(({ data }) => setOrgs(data ?? []));
  }, []);

  // Load alert counts (non-blocking, best-effort)
  useEffect(() => {
    Promise.all([
      // Stale documents
      supabase
        .from("document_instances")
        .select("id", { count: "exact", head: true })
        .eq("status", "stale"),
      // Critical open hazards (risk_score >= 15)
      supabase
        .from("hazard_log_entries")
        .select("id", { count: "exact", head: true })
        .eq("status", "open")
        .gte("risk_score", 15),
      // Blocked EU steps
      supabase
        .from("eu_accreditation_progress")
        .select("id", { count: "exact", head: true })
        .eq("status", "blocked"),
    ]).then(([staleRes, hazardRes, euRes]) => {
      setAlerts({
        staleDocs:           staleRes.count ?? 0,
        openCriticalHazards: hazardRes.count ?? 0,
        euBlocked:           euRes.count ?? 0,
      });
    });
  }, []);

  const totalAlerts = alerts.staleDocs + alerts.openCriticalHazards + alerts.euBlocked;
  const pageTitle = getPageTitle(pathname);

  return (
    <div className="flex h-11 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 gap-4">
      {/* Left: page title */}
      <p className="text-xs font-semibold text-slate-500 flex-shrink-0">{pageTitle}</p>

      {/* Centre: alert pills (only when there are alerts) */}
      {totalAlerts > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto">
          {alerts.staleDocs > 0 && (
            <button
              onClick={() => router.push("/documents")}
              className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 hover:border-amber-300 transition-colors"
            >
              <FileText className="h-3 w-3 text-amber-600 flex-shrink-0" />
              <span className="text-[10px] font-semibold text-amber-700 whitespace-nowrap">
                {alerts.staleDocs} stale doc{alerts.staleDocs !== 1 ? "s" : ""}
              </span>
            </button>
          )}
          {alerts.openCriticalHazards > 0 && (
            <button
              onClick={() => router.push("/hazard-log")}
              className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 hover:border-red-300 transition-colors"
            >
              <AlertTriangle className="h-3 w-3 text-red-600 flex-shrink-0" />
              <span className="text-[10px] font-semibold text-red-700 whitespace-nowrap">
                {alerts.openCriticalHazards} critical hazard{alerts.openCriticalHazards !== 1 ? "s" : ""}
              </span>
            </button>
          )}
          {alerts.euBlocked > 0 && (
            <button
              onClick={() => router.push("/eu-accreditation")}
              className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 hover:border-violet-300 transition-colors"
            >
              <Flag className="h-3 w-3 text-violet-600 flex-shrink-0" />
              <span className="text-[10px] font-semibold text-violet-700 whitespace-nowrap">
                {alerts.euBlocked} EU step{alerts.euBlocked !== 1 ? "s" : ""} blocked
              </span>
            </button>
          )}
        </div>
      )}

      {/* Right: org selector */}
      <div className="relative flex-shrink-0">
        {activeOrgId ? (
          <div className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1">
            <Building2 className="h-3 w-3 text-blue-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-blue-700">{activeOrgName}</span>
            <button
              onClick={clearActiveOrg}
              className="ml-0.5 rounded-full p-0.5 hover:bg-blue-200 text-blue-500 transition-colors"
              title="Clear organisation filter"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 hover:border-slate-300 hover:bg-white transition-colors"
          >
            <Building2 className="h-3 w-3 text-slate-400" />
            <span className="text-xs text-slate-500">All organisations</span>
            <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
          </button>
        )}

        {/* Dropdown */}
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              <div className="px-3 py-2.5 border-b border-slate-100">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Filter by organisation
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Filters the dashboard and relevant modules
                </p>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {orgs.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-slate-400 italic">No organisations yet</p>
                ) : (
                  orgs.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => { setActiveOrg(org.id, org.name); setOpen(false); }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors hover:bg-slate-50",
                        org.id === activeOrgId
                          ? "bg-blue-50 font-semibold text-blue-700"
                          : "text-slate-700"
                      )}
                    >
                      <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      {org.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
