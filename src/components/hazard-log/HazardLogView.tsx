"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, ChevronRight, Building2,
  ChevronDown, Shield, Calendar, User,
  Filter, ArrowUpDown, Upload, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { NewHazardPanel } from "./NewHazardPanel";
import { HazardLogImportDialog } from "./HazardLogImportDialog";
import * as XLSX from "xlsx";

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
  date_identified: string;
  organisation_id: string;
  organisation_name: string;
}

interface Organisation {
  id: string;
  name: string;
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

// ── Excel export ──────────────────────────────────────────────────────────────

function exportHazardLog(entries: HazardEntry[]) {
  const wb = XLSX.utils.book_new();

  const headers = [
    "Reference", "Type", "Title", "Description",
    "Severity", "Likelihood", "Risk Score", "Risk Level",
    "Status", "Owner", "Date Identified", "Organisation",
  ];

  const rows = entries.map((e) => [
    e.reference_number,
    e.entry_type,
    e.title,
    e.description ?? "",
    e.severity,
    e.likelihood.replace("_", " "),
    e.risk_score,
    riskScoreLabel(e.risk_score),
    STATUS_LABELS[e.status],
    e.owner ?? "",
    e.date_identified ? new Date(e.date_identified).toLocaleDateString("en-GB") : "",
    e.organisation_name,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Column widths
  ws["!cols"] = [
    { wch: 14 }, { wch: 10 }, { wch: 40 }, { wch: 50 },
    { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 12 },
    { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Hazard Log");

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `anathem-hazard-log-${date}.xlsx`);
}

// ── Risk summary bar ───────────────────────────────────────────────────────────

function RiskSummary({ entries }: { entries: HazardEntry[] }) {
  if (entries.length === 0) return null;
  const critical = entries.filter((e) => e.risk_score >= 15).length;
  const high     = entries.filter((e) => e.risk_score >= 10 && e.risk_score < 15).length;
  const medium   = entries.filter((e) => e.risk_score >= 5  && e.risk_score < 10).length;
  const low      = entries.filter((e) => e.risk_score < 5).length;
  const open     = entries.filter((e) => e.status === "open").length;

  return (
    <div className="flex items-center gap-6 rounded-xl border border-slate-200 bg-white px-5 py-3.5 flex-shrink-0">
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Total</span>
        <span className="text-xl font-bold text-slate-800">{entries.length}</span>
      </div>
      <div className="h-8 w-px bg-slate-200" />
      <div className="flex items-center gap-4">
        {[
          { label: "Critical", count: critical, colour: "text-red-600 bg-red-50" },
          { label: "High",     count: high,     colour: "text-orange-600 bg-orange-50" },
          { label: "Medium",   count: medium,   colour: "text-amber-600 bg-amber-50" },
          { label: "Low",      count: low,      colour: "text-green-600 bg-green-50" },
        ].map(({ label, count, colour }) => (
          <div key={label} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5", colour)}>
            <span className="text-lg font-bold">{count}</span>
            <span className="text-[11px] font-semibold">{label}</span>
          </div>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2 text-sm">
        <span className="font-semibold text-red-600">{open}</span>
        <span className="text-slate-400">open</span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function HazardLogView() {
  const router = useRouter();
  const [entries, setEntries] = useState<HazardEntry[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Filters
  const [filterOrgId, setFilterOrgId] = useState("");
  const [filterStatus, setFilterStatus] = useState<HazardStatus | "">("");
  const [filterType, setFilterType] = useState<HazardEntryType | "">("");
  const [sortBy, setSortBy] = useState<"risk_score" | "date_identified" | "reference_number">("risk_score");

  const loadEntries = useCallback(async () => {
    setLoading(true);

    const { data: orgsData } = await supabase
      .from("organisations")
      .select("id, name")
      .order("name");
    if (orgsData) setOrganisations(orgsData);

    let query = supabase
      .from("hazard_log_entries")
      .select(`
        id, reference_number, entry_type, title, description,
        severity, likelihood, risk_score, status, owner,
        date_identified, organisation_id,
        organisations!inner(name)
      `)
      .order(sortBy, { ascending: sortBy === "reference_number" });

    if (filterOrgId)  query = query.eq("organisation_id", filterOrgId);
    if (filterStatus) query = query.eq("status", filterStatus);
    if (filterType)   query = query.eq("entry_type", filterType);

    const { data } = await query;

    setEntries(
      (data ?? []).map((row: any) => ({
        ...row,
        organisation_name: row.organisations?.name ?? "Unknown",
      }))
    );
    setLoading(false);
  }, [filterOrgId, filterStatus, filterType, sortBy]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const filtered = entries; // filtering done server-side

  return (
    <>
      <div className="flex flex-col gap-5 p-8 h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Hazard Log</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Clinical safety hazards, risks, and issues with risk scoring and mitigation tracking.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Import Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => exportHazardLog(filtered)}
              disabled={filtered.length === 0}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Download className="mr-1.5 h-4 w-4" />
              Export Excel
            </Button>
            <Button onClick={() => setPanelOpen(true)} className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-1.5 h-4 w-4" />
              New Entry
            </Button>
          </div>
        </div>

        {/* Summary */}
        {!loading && <RiskSummary entries={filtered} />}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />

          {/* Org filter */}
          <div className="relative">
            <select
              value={filterOrgId}
              onChange={(e) => setFilterOrgId(e.target.value)}
              className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-7 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All organisations</option>
              {organisations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as HazardStatus | "")}
              className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-7 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="mitigated">Mitigated</option>
              <option value="accepted">Accepted</option>
              <option value="closed">Closed</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Type filter */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as HazardEntryType | "")}
              className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-7 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All types</option>
              <option value="hazard">Hazard</option>
              <option value="risk">Risk</option>
              <option value="issue">Issue</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-7 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="risk_score">Sort: Risk score</option>
                <option value="date_identified">Sort: Date identified</option>
                <option value="reference_number">Sort: Reference</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-sm text-slate-400 py-16 text-center">Loading hazard log…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-200 py-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100">
              <Shield className="h-7 w-7 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">No entries found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Log your first clinical safety hazard, risk, or issue.
              </p>
            </div>
            <Button onClick={() => setPanelOpen(true)} className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-1.5 h-4 w-4" /> New Entry
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((entry) => (
              <button
                key={entry.id}
                onClick={() => router.push(`/hazard-log/${entry.id}`)}
                className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 text-left hover:border-red-300 hover:shadow-sm transition-all group"
              >
                {/* Risk score badge */}
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                  <div className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-lg text-lg font-bold",
                    riskScoreColour(entry.risk_score)
                  )}>
                    {entry.risk_score}
                  </div>
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    {riskScoreLabel(entry.risk_score)}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-mono font-bold text-slate-400 flex-shrink-0">
                        {entry.reference_number}
                      </span>
                      <span className={cn(
                        "rounded border px-1.5 py-0.5 text-[10px] font-semibold capitalize flex-shrink-0",
                        TYPE_COLOURS[entry.entry_type]
                      )}>
                        {entry.entry_type}
                      </span>
                      <p className="text-sm font-semibold text-slate-800 truncate">{entry.title}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-red-400 flex-shrink-0 mt-0.5" />
                  </div>

                  {entry.description && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-1 leading-relaxed">{entry.description}</p>
                  )}

                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold capitalize",
                      SEVERITY_COLOURS[entry.severity]
                    )}>
                      {entry.severity}
                    </span>
                    <span className="text-[10px] text-slate-400">×</span>
                    <span className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 capitalize">
                      {entry.likelihood.replace("_", " ")}
                    </span>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      STATUS_COLOURS[entry.status]
                    )}>
                      {STATUS_LABELS[entry.status]}
                    </span>
                    <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-400">
                      <Building2 className="h-3 w-3" /> {entry.organisation_name}
                    </span>
                    {entry.owner && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <User className="h-3 w-3" /> {entry.owner}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 flex-shrink-0">
                      <Calendar className="h-3 w-3" /> {formatDate(entry.date_identified)}
                    </span>
                    {/* EU Step 6 evidence link */}
                    <span
                      className="ml-auto flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600 flex-shrink-0 cursor-default"
                      title="This entry contributes evidence toward EU MDR Step 6: Risk Management File"
                    >
                      EU Step 6
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <NewHazardPanel
        open={panelOpen}
        organisations={organisations}
        onClose={() => setPanelOpen(false)}
        onCreated={(id) => {
          setPanelOpen(false);
          router.push(`/hazard-log/${id}`);
        }}
      />

      <HazardLogImportDialog
        open={importOpen}
        organisations={organisations}
        onClose={() => setImportOpen(false)}
        onImported={(_count) => {
          setImportOpen(false);
          loadEntries();
        }}
      />
    </>
  );
}
