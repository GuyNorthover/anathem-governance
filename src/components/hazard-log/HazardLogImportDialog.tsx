"use client";

import { useState, useCallback, useRef } from "react";
import {
  X, Upload, FileSpreadsheet, AlertCircle,
  ChevronDown, CheckCircle2, Loader2, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ──────────────────────────────────────────────────────────────────────

type HazardEntryType = "hazard" | "risk" | "issue";
type HazardSeverity  = "critical" | "high" | "medium" | "low";
type HazardLikelihood = "almost_certain" | "likely" | "possible" | "unlikely" | "rare";
type HazardStatus    = "open" | "under_review" | "mitigated" | "closed" | "accepted";

interface Organisation { id: string; name: string }

interface ColumnMapping {
  title:              string;
  description:        string;
  entry_type:         string;
  severity:           string;
  likelihood:         string;
  status:             string;
  owner:              string;
  mitigation_actions: string;
  residual_risk:      string;
  date_identified:    string;
  organisation:       string;  // column name containing org name, or "" to use defaultOrgId
}

interface ParsedRow {
  title:              string;
  description:        string;
  entry_type:         HazardEntryType;
  severity:           HazardSeverity;
  likelihood:         HazardLikelihood;
  status:             HazardStatus;
  owner:              string;
  mitigation_actions: string;
  residual_risk:      string;
  date_identified:    string;
  organisation_id:    string;
  _valid:             boolean;
  _errors:            string[];
}

interface Props {
  open: boolean;
  organisations: Organisation[];
  onClose: () => void;
  onImported: (count: number) => void;
}

// ── Normalisation helpers ──────────────────────────────────────────────────────

function normSeverity(v: string): HazardSeverity | null {
  const s = v?.toString().toLowerCase().trim();
  if (!s) return null;
  if (s.includes("critical")) return "critical";
  if (s.includes("high"))     return "high";
  if (s.includes("medium") || s.includes("moderate") || s.includes("med")) return "medium";
  if (s.includes("low"))      return "low";
  return null;
}

function normLikelihood(v: string): HazardLikelihood | null {
  const s = v?.toString().toLowerCase().trim();
  if (!s) return null;
  if (s.includes("almost") || s === "5") return "almost_certain";
  if (s.includes("likely") || s === "4") return "likely";
  if (s.includes("possible") || s.includes("moderate") || s === "3") return "possible";
  if (s.includes("unlikely") || s === "2") return "unlikely";
  if (s.includes("rare") || s === "1") return "rare";
  return null;
}

function normStatus(v: string): HazardStatus {
  const s = v?.toString().toLowerCase().trim() ?? "";
  if (s.includes("review")) return "under_review";
  if (s.includes("mitigat")) return "mitigated";
  if (s.includes("closed") || s.includes("close")) return "closed";
  if (s.includes("accept")) return "accepted";
  return "open";
}

function normEntryType(v: string): HazardEntryType {
  const s = v?.toString().toLowerCase().trim() ?? "";
  if (s.includes("risk")) return "risk";
  if (s.includes("issue")) return "issue";
  return "hazard";
}

function normDate(v: any): string {
  if (!v) return new Date().toISOString().slice(0, 10);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    // Excel serial date
    const d = new Date((v - 25569) * 86400 * 1000);
    return d.toISOString().slice(0, 10);
  }
  const s = v.toString().trim();
  // Try parsing common formats
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

// ── Auto-detect column mapping ─────────────────────────────────────────────────

function autoDetect(headers: string[]): ColumnMapping {
  const find = (candidates: string[]): string => {
    for (const c of candidates) {
      const match = headers.find((h) =>
        h.toLowerCase().trim().includes(c.toLowerCase())
      );
      if (match) return match;
    }
    return "";
  };

  return {
    title:              find(["title", "hazard", "name", "description of hazard", "hazard title"]),
    description:        find(["description", "detail", "narrative", "notes", "hazard detail"]),
    entry_type:         find(["type", "entry type", "category", "kind"]),
    severity:           find(["severity", "sev", "consequence", "impact"]),
    likelihood:         find(["likelihood", "probability", "chance", "freq"]),
    status:             find(["status", "state", "disposition"]),
    owner:              find(["owner", "responsible", "assigned", "lead", "author"]),
    mitigation_actions: find(["mitigation", "control", "action", "measure", "safeguard"]),
    residual_risk:      find(["residual", "remaining risk", "post-mitigation"]),
    date_identified:    find(["date", "identified", "raised", "logged", "created"]),
    organisation:       find(["org", "organisation", "organization", "trust", "site", "deployment"]),
  };
}

// ── Main component ─────────────────────────────────────────────────────────────

export function HazardLogImportDialog({ open, organisations, onClose, onImported }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step,          setStep]          = useState<"upload" | "map" | "preview" | "done">("upload");
  const [headers,       setHeaders]       = useState<string[]>([]);
  const [rawRows,       setRawRows]       = useState<Record<string, any>[]>([]);
  const [mapping,       setMapping]       = useState<ColumnMapping>({
    title: "", description: "", entry_type: "", severity: "",
    likelihood: "", status: "", owner: "", mitigation_actions: "",
    residual_risk: "", date_identified: "", organisation: "",
  });
  const [defaultOrgId,  setDefaultOrgId]  = useState("");
  const [parsedRows,    setParsedRows]    = useState<ParsedRow[]>([]);
  const [importing,     setImporting]     = useState(false);
  const [importError,   setImportError]   = useState("");
  const [fileName,      setFileName]      = useState("");
  const [dragOver,      setDragOver]      = useState(false);

  function reset() {
    setStep("upload");
    setHeaders([]);
    setRawRows([]);
    setMapping({ title: "", description: "", entry_type: "", severity: "",
      likelihood: "", status: "", owner: "", mitigation_actions: "",
      residual_risk: "", date_identified: "", organisation: "" });
    setDefaultOrgId("");
    setParsedRows([]);
    setImporting(false);
    setImportError("");
    setFileName("");
  }

  function parseFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data  = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb    = XLSX.read(data, { type: "array", cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json  = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

        if (json.length === 0) {
          setImportError("The spreadsheet appears to be empty.");
          return;
        }

        const cols = Object.keys(json[0]);
        setHeaders(cols);
        setRawRows(json);
        setMapping(autoDetect(cols));
        setFileName(file.name);
        setStep("map");
        setImportError("");
      } catch {
        setImportError("Could not read the file. Please ensure it is a valid .xlsx or .xls file.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function handleFileInput(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setImportError("Please upload an .xlsx, .xls, or .csv file.");
      return;
    }
    parseFile(file);
  }

  function buildParsedRows(): ParsedRow[] {
    const orgByName = new Map(organisations.map((o) => [o.name.toLowerCase().trim(), o.id]));

    return rawRows.map((row) => {
      const errors: string[] = [];
      const get = (col: string) => (col ? String(row[col] ?? "").trim() : "");

      const title = get(mapping.title);
      if (!title) errors.push("Missing title");

      const severity = normSeverity(get(mapping.severity));
      if (!severity) errors.push(`Unrecognised severity "${get(mapping.severity)}"`);

      const likelihood = normLikelihood(get(mapping.likelihood));
      if (!likelihood) errors.push(`Unrecognised likelihood "${get(mapping.likelihood)}"`);

      // Resolve organisation
      let organisation_id = defaultOrgId;
      if (mapping.organisation && row[mapping.organisation]) {
        const orgName = String(row[mapping.organisation]).toLowerCase().trim();
        const found   = orgByName.get(orgName);
        if (found) organisation_id = found;
      }
      if (!organisation_id) errors.push("No organisation assigned");

      return {
        title:              title || "(no title)",
        description:        get(mapping.description),
        entry_type:         normEntryType(get(mapping.entry_type)),
        severity:           severity ?? "medium",
        likelihood:         likelihood ?? "possible",
        status:             normStatus(get(mapping.status)),
        owner:              get(mapping.owner),
        mitigation_actions: get(mapping.mitigation_actions),
        residual_risk:      get(mapping.residual_risk),
        date_identified:    normDate(mapping.date_identified ? row[mapping.date_identified] : ""),
        organisation_id,
        _valid:  errors.length === 0,
        _errors: errors,
      };
    });
  }

  function handlePreview() {
    if (!mapping.title) { setImportError("Please map the Title column."); return; }
    if (!mapping.severity) { setImportError("Please map the Severity column."); return; }
    if (!mapping.likelihood) { setImportError("Please map the Likelihood column."); return; }
    if (!defaultOrgId && !mapping.organisation) {
      setImportError("Please select a default organisation or map an Organisation column."); return;
    }
    setImportError("");
    setParsedRows(buildParsedRows());
    setStep("preview");
  }

  async function handleImport() {
    const valid = parsedRows.filter((r) => r._valid);
    if (valid.length === 0) { setImportError("No valid rows to import."); return; }

    setImporting(true);
    setImportError("");

    const rows = valid.map((r) => ({
      organisation_id:    r.organisation_id,
      entry_type:         r.entry_type,
      title:              r.title,
      description:        r.description || null,
      severity:           r.severity,
      likelihood:         r.likelihood,
      status:             r.status,
      owner:              r.owner || null,
      mitigation_actions: r.mitigation_actions || null,
      residual_risk:      r.residual_risk || null,
      date_identified:    r.date_identified,
    }));

    // Insert in batches of 50
    let errorMsg = "";
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await supabase.from("hazard_log_entries").insert(batch);
      if (error) { errorMsg = error.message; break; }
    }

    setImporting(false);

    if (errorMsg) {
      setImportError(`Import failed: ${errorMsg}`);
    } else {
      setStep("done");
      onImported(valid.length);
    }
  }

  const validCount   = parsedRows.filter((r) => r._valid).length;
  const invalidCount = parsedRows.filter((r) => !r._valid).length;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px]">
        <div className="relative w-[680px] max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Import from Excel</p>
                <p className="text-[11px] text-slate-400">
                  {step === "upload" && "Upload your existing hazard log spreadsheet"}
                  {step === "map"    && `${rawRows.length} rows detected in "${fileName}"`}
                  {step === "preview" && `${validCount} valid · ${invalidCount} with errors`}
                  {step === "done"   && "Import complete"}
                </p>
              </div>
            </div>
            <button
              onClick={() => { reset(); onClose(); }}
              disabled={importing}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-0 border-b border-slate-100 bg-slate-50 px-6 py-2 flex-shrink-0">
            {[["upload", "1. Upload"], ["map", "2. Map columns"], ["preview", "3. Preview"]].map(([id, label], idx) => (
              <div key={id} className="flex items-center gap-0">
                <div className={cn(
                  "flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded",
                  step === id ? "text-blue-700" : ["done", "preview", "map"].includes(step) && idx < ["upload","map","preview"].indexOf(step) ? "text-green-600" : "text-slate-400"
                )}>
                  <span className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold",
                    step === id ? "bg-blue-600 text-white" : ["done", "preview", "map"].includes(step) && idx < ["upload","map","preview"].indexOf(step) ? "bg-green-500 text-white" : "bg-slate-200 text-slate-400"
                  )}>
                    {["done", "preview", "map"].includes(step) && idx < ["upload","map","preview"].indexOf(step) ? "✓" : idx + 1}
                  </span>
                  {label}
                </div>
                {idx < 2 && <ArrowRight className="h-3 w-3 text-slate-300 mx-1" />}
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">

            {/* ── Step 1: Upload ── */}
            {step === "upload" && (
              <div className="p-6">
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileInput(e.dataTransfer.files); }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed py-16 cursor-pointer transition-all",
                    dragOver
                      ? "border-blue-400 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                  )}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100">
                    <FileSpreadsheet className="h-7 w-7 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">Drop your hazard log spreadsheet here</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports .xlsx, .xls — click to browse
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Upload className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs text-blue-600 font-medium">Choose file</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => handleFileInput(e.target.files)}
                  />
                </div>

                <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Expected columns</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["Title", "Severity", "Likelihood", "Status", "Description", "Owner",
                      "Mitigation Actions", "Residual Risk", "Date Identified", "Organisation"].map((col) => (
                      <span key={col} className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {col}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Column names are flexible — the system will try to auto-detect them. You can correct the mapping in the next step.
                  </p>
                </div>

                {importError && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{importError}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 2: Map columns ── */}
            {step === "map" && (
              <div className="p-6 flex flex-col gap-4">
                <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
                  <p className="text-xs text-blue-700">
                    <span className="font-semibold">Auto-detected {rawRows.length} rows</span> from {fileName}.
                    Review the column mapping below and correct any that are wrong.
                    Title, Severity, and Likelihood are required.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { field: "title"             as keyof ColumnMapping, label: "Title *",              required: true },
                    { field: "severity"          as keyof ColumnMapping, label: "Severity *",           required: true },
                    { field: "likelihood"        as keyof ColumnMapping, label: "Likelihood *",         required: true },
                    { field: "description"       as keyof ColumnMapping, label: "Description",          required: false },
                    { field: "entry_type"        as keyof ColumnMapping, label: "Entry type",           required: false },
                    { field: "status"            as keyof ColumnMapping, label: "Status",               required: false },
                    { field: "owner"             as keyof ColumnMapping, label: "Owner",                required: false },
                    { field: "mitigation_actions"as keyof ColumnMapping, label: "Mitigation actions",  required: false },
                    { field: "residual_risk"     as keyof ColumnMapping, label: "Residual risk",        required: false },
                    { field: "date_identified"   as keyof ColumnMapping, label: "Date identified",      required: false },
                    { field: "organisation"      as keyof ColumnMapping, label: "Organisation column",  required: false },
                  ].map(({ field, label, required }) => (
                    <div key={field} className="flex flex-col gap-1">
                      <label className="text-[10px] font-semibold text-slate-600">
                        {label}
                        {required && <span className="ml-0.5 text-red-500">*</span>}
                        {mapping[field] && (
                          <span className="ml-1.5 text-green-600 font-normal">✓ detected</span>
                        )}
                      </label>
                      <div className="relative">
                        <select
                          value={mapping[field]}
                          onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value }))}
                          className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 pr-6 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="">— not mapped —</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Default organisation */}
                <div className="border-t border-slate-100 pt-4">
                  <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                    Default organisation
                    <span className="ml-1 text-slate-400 font-normal">
                      — used when the organisation column is absent or unmatched
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      value={defaultOrgId}
                      onChange={(e) => setDefaultOrgId(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-2.5 py-2 pr-8 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">— select default —</option>
                      {organisations.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {importError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{importError}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Preview ── */}
            {step === "preview" && (
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">{validCount} rows ready to import</span>
                  </div>
                  {invalidCount > 0 && (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-semibold text-amber-700">{invalidCount} rows will be skipped</span>
                    </div>
                  )}
                </div>

                {/* Preview table */}
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">#</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">Title</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">Type</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">Severity</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">Likelihood</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">Status</th>
                          <th className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((row, i) => (
                          <tr key={i} className={cn(!row._valid && "bg-red-50")}>
                            <td className="px-3 py-2 text-slate-400 font-mono">{i + 1}</td>
                            <td className="px-3 py-2 max-w-[180px] truncate text-slate-800">{row.title}</td>
                            <td className="px-3 py-2 capitalize text-slate-600">{row.entry_type}</td>
                            <td className="px-3 py-2 capitalize">
                              <span className={cn(
                                "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                                row.severity === "critical" ? "bg-red-100 text-red-700" :
                                row.severity === "high"     ? "bg-orange-100 text-orange-700" :
                                row.severity === "medium"   ? "bg-amber-100 text-amber-700" :
                                "bg-green-100 text-green-700"
                              )}>
                                {row.severity}
                              </span>
                            </td>
                            <td className="px-3 py-2 capitalize text-slate-600">{row.likelihood.replace("_", " ")}</td>
                            <td className="px-3 py-2 capitalize text-slate-600">{row.status.replace("_", " ")}</td>
                            <td className="px-3 py-2">
                              {row._valid
                                ? <span className="text-green-600">✓</span>
                                : <span className="text-red-600 text-[10px]">{row._errors.join(", ")}</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {importError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">{importError}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 4: Done ── */}
            {step === "done" && (
              <div className="flex flex-col items-center justify-center gap-4 py-16 px-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-slate-900">Import complete</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {validCount} hazard log {validCount === 1 ? "entry" : "entries"} imported successfully.
                  </p>
                  {invalidCount > 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      {invalidCount} rows were skipped due to validation errors.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-white flex-shrink-0">
            {step === "done" ? (
              <div className="ml-auto">
                <Button onClick={() => { reset(); onClose(); }} className="bg-green-600 hover:bg-green-700">
                  Done
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (step === "map") setStep("upload");
                    else if (step === "preview") setStep("map");
                    else { reset(); onClose(); }
                  }}
                  disabled={importing}
                >
                  {step === "upload" ? "Cancel" : "Back"}
                </Button>

                {step === "map" && (
                  <Button onClick={handlePreview} className="bg-blue-600 hover:bg-blue-700">
                    Preview import →
                  </Button>
                )}
                {step === "preview" && (
                  <Button
                    onClick={handleImport}
                    disabled={importing || validCount === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {importing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing…</>
                    ) : (
                      `Import ${validCount} ${validCount === 1 ? "row" : "rows"}`
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
