"use client";

import { useState, useEffect, useCallback } from "react";
import { X, AlertTriangle, Shield } from "lucide-react";
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

interface Organisation {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  organisations: Organisation[];
  onClose: () => void;
  onCreated: (id: string) => void;
}

// Risk score computation (mirrors DB trigger)
const SEVERITY_WEIGHT: Record<HazardSeverity, number> = {
  critical: 4, high: 3, medium: 2, low: 1,
};
const LIKELIHOOD_WEIGHT: Record<HazardLikelihood, number> = {
  almost_certain: 5, likely: 4, possible: 3, unlikely: 2, rare: 1,
};

function computeRiskScore(severity: HazardSeverity, likelihood: HazardLikelihood): number {
  return SEVERITY_WEIGHT[severity] * LIKELIHOOD_WEIGHT[likelihood];
}

function riskScoreColour(score: number): string {
  if (score >= 15) return "bg-red-500 text-white";
  if (score >= 10) return "bg-orange-500 text-white";
  if (score >= 5)  return "bg-amber-400 text-white";
  return "bg-green-500 text-white";
}

function riskScoreLabel(score: number): string {
  if (score >= 15) return "Critical risk";
  if (score >= 10) return "High risk";
  if (score >= 5)  return "Medium risk";
  return "Low risk";
}

// ── 5×4 Risk matrix preview ────────────────────────────────────────────────────

const LIKELIHOODS: HazardLikelihood[] = ["almost_certain", "likely", "possible", "unlikely", "rare"];
const SEVERITIES: HazardSeverity[]   = ["low", "medium", "high", "critical"];

function RiskMatrixPreview({
  severity,
  likelihood,
}: {
  severity: HazardSeverity;
  likelihood: HazardLikelihood;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Risk matrix</p>
      <div className="flex gap-1">
        {/* Y-axis label */}
        <div className="flex flex-col-reverse items-center justify-around pr-1" style={{ width: 60 }}>
          {LIKELIHOODS.map((l) => (
            <span
              key={l}
              className={cn(
                "text-[8px] text-right w-full capitalize leading-tight",
                l === likelihood ? "font-bold text-slate-700" : "text-slate-400"
              )}
            >
              {l.replace("_", " ")}
            </span>
          ))}
        </div>
        {/* Grid */}
        <div className="flex gap-0.5 flex-col-reverse flex-1">
          {LIKELIHOODS.map((l) => (
            <div key={l} className="flex gap-0.5">
              {SEVERITIES.map((s) => {
                const score = computeRiskScore(s, l);
                const isActive = s === severity && l === likelihood;
                let cellColour = "bg-green-100";
                if (score >= 15) cellColour = "bg-red-300";
                else if (score >= 10) cellColour = "bg-orange-300";
                else if (score >= 5)  cellColour = "bg-amber-200";
                return (
                  <div
                    key={s}
                    className={cn(
                      "flex-1 h-5 rounded-sm flex items-center justify-center text-[8px] font-bold transition-all",
                      cellColour,
                      isActive && "ring-2 ring-slate-700 ring-offset-1 scale-110 z-10 relative"
                    )}
                  >
                    {score}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* X-axis labels */}
      <div className="flex gap-0.5 mt-1 ml-[68px]">
        {SEVERITIES.map((s) => (
          <span
            key={s}
            className={cn(
              "flex-1 text-center text-[8px] capitalize",
              s === severity ? "font-bold text-slate-700" : "text-slate-400"
            )}
          >
            {s}
          </span>
        ))}
      </div>
      <div className="text-[9px] text-slate-400 mt-1 ml-[68px] flex justify-between">
        <span>← Severity →</span>
      </div>
    </div>
  );
}

// ── Field helpers ──────────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-xs font-semibold text-slate-600">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1">{children}</div>;
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-400";

const selectCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400";

// ── Main component ─────────────────────────────────────────────────────────────

export function NewHazardPanel({ open, organisations, onClose, onCreated }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [organisationId, setOrganisationId] = useState("");
  const [entryType, setEntryType] = useState<HazardEntryType>("hazard");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<HazardSeverity>("medium");
  const [likelihood, setLikelihood] = useState<HazardLikelihood>("possible");
  const [status, setStatus] = useState<HazardStatus>("open");
  const [owner, setOwner] = useState("");
  const [mitigationActions, setMitigationActions] = useState("");
  const [residualRisk, setResidualRisk] = useState("");
  const [dateIdentified, setDateIdentified] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const riskScore = computeRiskScore(severity, likelihood);

  // Reset form when panel opens
  useEffect(() => {
    if (open) {
      setOrganisationId("");
      setEntryType("hazard");
      setTitle("");
      setDescription("");
      setSeverity("medium");
      setLikelihood("possible");
      setStatus("open");
      setOwner("");
      setMitigationActions("");
      setResidualRisk("");
      setDateIdentified(new Date().toISOString().slice(0, 10));
      setError("");
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    if (!organisationId) { setError("Please select an organisation."); return; }
    if (!title.trim())   { setError("Title is required."); return; }
    setError("");
    setSubmitting(true);

    const { data, error: dbError } = await supabase
      .from("hazard_log_entries")
      .insert({
        organisation_id: organisationId,
        entry_type: entryType,
        title: title.trim(),
        description: description.trim() || null,
        severity,
        likelihood,
        status,
        owner: owner.trim() || null,
        mitigation_actions: mitigationActions.trim() || null,
        residual_risk: residualRisk.trim() || null,
        date_identified: dateIdentified,
      })
      .select("id")
      .single();

    setSubmitting(false);

    if (dbError || !data) {
      setError(dbError?.message ?? "Failed to create entry.");
      return;
    }

    onCreated(data.id);
  }, [
    organisationId, entryType, title, description, severity, likelihood,
    status, owner, mitigationActions, residualRisk, dateIdentified, onCreated,
  ]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-[520px] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">New Log Entry</p>
              <p className="text-[11px] text-slate-400">Hazard, risk, or issue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

          {/* Organisation */}
          <FieldGroup>
            <Label required>Organisation</Label>
            <select
              value={organisationId}
              onChange={(e) => setOrganisationId(e.target.value)}
              className={selectCls}
            >
              <option value="">— Select organisation —</option>
              {organisations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </FieldGroup>

          {/* Type + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup>
              <Label required>Entry type</Label>
              <select
                value={entryType}
                onChange={(e) => setEntryType(e.target.value as HazardEntryType)}
                className={selectCls}
              >
                <option value="hazard">Hazard</option>
                <option value="risk">Risk</option>
                <option value="issue">Issue</option>
              </select>
            </FieldGroup>
            <FieldGroup>
              <Label required>Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as HazardStatus)}
                className={selectCls}
              >
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="mitigated">Mitigated</option>
                <option value="accepted">Accepted</option>
                <option value="closed">Closed</option>
              </select>
            </FieldGroup>
          </div>

          {/* Title */}
          <FieldGroup>
            <Label required>Title</Label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the hazard or risk…"
              className={inputCls}
            />
          </FieldGroup>

          {/* Description */}
          <FieldGroup>
            <Label>Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description, clinical context, potential harms…"
              rows={3}
              className={cn(inputCls, "resize-none")}
            />
          </FieldGroup>

          {/* Severity + Likelihood */}
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup>
              <Label required>Severity</Label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as HazardSeverity)}
                className={selectCls}
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </FieldGroup>
            <FieldGroup>
              <Label required>Likelihood</Label>
              <select
                value={likelihood}
                onChange={(e) => setLikelihood(e.target.value as HazardLikelihood)}
                className={selectCls}
              >
                <option value="almost_certain">Almost certain</option>
                <option value="likely">Likely</option>
                <option value="possible">Possible</option>
                <option value="unlikely">Unlikely</option>
                <option value="rare">Rare</option>
              </select>
            </FieldGroup>
          </div>

          {/* Live risk score */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl font-bold",
              riskScoreColour(riskScore)
            )}>
              {riskScore}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{riskScoreLabel(riskScore)}</p>
              <p className="text-[11px] text-slate-400">
                Severity ({SEVERITY_WEIGHT[severity]}) × Likelihood ({LIKELIHOOD_WEIGHT[likelihood]})
              </p>
            </div>
          </div>

          {/* Risk matrix */}
          <RiskMatrixPreview severity={severity} likelihood={likelihood} />

          {/* Owner + Date */}
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup>
              <Label>Owner</Label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Name or role…"
                className={inputCls}
              />
            </FieldGroup>
            <FieldGroup>
              <Label required>Date identified</Label>
              <input
                type="date"
                value={dateIdentified}
                onChange={(e) => setDateIdentified(e.target.value)}
                className={inputCls}
              />
            </FieldGroup>
          </div>

          {/* Mitigation actions */}
          <FieldGroup>
            <Label>Mitigation actions</Label>
            <textarea
              value={mitigationActions}
              onChange={(e) => setMitigationActions(e.target.value)}
              placeholder="Controls, safeguards, or actions taken to reduce the risk…"
              rows={3}
              className={cn(inputCls, "resize-none")}
            />
          </FieldGroup>

          {/* Residual risk */}
          <FieldGroup>
            <Label>Residual risk</Label>
            <textarea
              value={residualRisk}
              onChange={(e) => setResidualRisk(e.target.value)}
              placeholder="Remaining risk after mitigations are applied…"
              rows={2}
              className={cn(inputCls, "resize-none")}
            />
          </FieldGroup>

          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {submitting ? "Saving…" : "Create Entry"}
          </Button>
        </div>
      </div>
    </>
  );
}
