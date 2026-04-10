"use client";

import { useState } from "react";
import { Clock, FileText, Link2, Pencil, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DomainBadge } from "./DomainBadge";
import { TierBadge } from "./TierBadge";
import type { Fact, FactDomain, FactTier, FactValueType, ModuleId } from "@/lib/knowledge-base/types";

export type SheetState =
  | { mode: "view"; fact: Fact }
  | { mode: "edit"; fact: Fact }
  | { mode: "create" }
  | null;

interface FactSheetProps {
  state: SheetState;
  onClose: () => void;
  onEditRequest: (fact: Fact) => void;
  onSaveEdit: (fact: Fact, newValue: string, reason: string) => Promise<string | null>;
  onSaveCreate: (payload: {
    key: string;
    value: string;
    valueType: FactValueType;
    domain: FactDomain;
    tier: FactTier;
    moduleId?: string;
  }) => Promise<string | null>;
}

// ── View mode ──────────────────────────────────────────────────────────────

function FactDetailView({ fact, onEdit }: { fact: Fact; onEdit: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Key + actions */}
      <div className="flex items-start justify-between gap-2">
        <code className="rounded bg-slate-100 px-2 py-1 font-mono text-sm text-slate-800 break-all">
          {fact.key}
        </code>
        <Button size="sm" variant="outline" onClick={onEdit} className="flex-shrink-0">
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit
        </Button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <DomainBadge domain={fact.domain} />
        <TierBadge tier={fact.tier} module={fact.module} orgName={fact.orgName} />
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
          {fact.valueType}
        </span>
      </div>

      {/* Current value */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Current Value
        </p>
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800">
          {fact.value}
        </p>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
        <div>
          <p className="font-medium text-slate-400 uppercase tracking-wide text-[10px]">Created by</p>
          <p className="mt-0.5 text-slate-600">{fact.createdBy}</p>
          <p className="text-slate-400">{fact.createdAt}</p>
        </div>
        <div>
          <p className="font-medium text-slate-400 uppercase tracking-wide text-[10px]">Last modified</p>
          <p className="mt-0.5 text-slate-600">{fact.modifiedBy}</p>
          <p className="text-slate-400">{fact.modifiedAt}</p>
        </div>
      </div>

      <Separator />

      {/* Dependent documents */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-slate-400" />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Dependent Documents
          </p>
        </div>
        <p className="text-sm text-slate-600">
          {fact.dependentDocumentCount > 0 ? (
            <>
              <span className="font-semibold text-slate-900">{fact.dependentDocumentCount}</span>{" "}
              document{fact.dependentDocumentCount !== 1 ? "s" : ""} reference this fact.
              {" "}Changing this value will mark them as{" "}
              <span className="font-medium text-red-600">stale</span>.
            </>
          ) : (
            "No documents reference this fact yet."
          )}
        </p>
      </div>

      {/* Related facts */}
      {fact.relatedFactKeys.length > 0 && (
        <>
          <Separator />
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link2 className="h-3.5 w-3.5 text-slate-400" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Related Facts
              </p>
            </div>
            <div className="flex flex-col gap-1">
              {fact.relatedFactKeys.map((key) => (
                <code key={key} className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                  {key}
                </code>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Version history */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Version History
          </p>
        </div>
        {fact.versions.length === 0 ? (
          <p className="text-sm text-slate-400">No version history recorded.</p>
        ) : (
          <div className="relative flex flex-col gap-0">
            {fact.versions.map((version, i) => (
              <div key={version.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full border-2 ${
                    i === 0 ? "border-blue-500 bg-blue-500" : "border-slate-300 bg-white"
                  }`} />
                  {i < fact.versions.length - 1 && (
                    <div className="w-px flex-1 bg-slate-200 my-1" />
                  )}
                </div>
                <div className={`pb-4 ${i === fact.versions.length - 1 ? "pb-0" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-700">{version.changedBy}</span>
                    <span className="text-xs text-slate-400">{version.changedAt}</span>
                    {i === 0 && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                        current
                      </span>
                    )}
                  </div>
                  <p className="rounded bg-slate-50 border border-slate-100 px-2 py-1.5 font-mono text-xs text-slate-700">
                    {version.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400 italic">{version.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Form (create / edit) ───────────────────────────────────────────────────

interface FormState {
  key: string;
  value: string;
  valueType: FactValueType;
  domain: FactDomain;
  tier: FactTier;
  module: ModuleId | "";
  reason: string;
}

interface FactFormProps {
  initial?: Fact;
  isEdit: boolean;
  onCancel: () => void;
  onSave: (form: FormState) => Promise<void>;
}

function FactForm({ initial, isEdit, onCancel, onSave }: FactFormProps) {
  const [form, setForm] = useState<FormState>({
    key: initial?.key ?? "",
    value: initial?.value ?? "",
    valueType: initial?.valueType ?? "string",
    domain: initial?.domain ?? "clinical",
    tier: initial?.tier ?? "global",
    module: (initial?.module as ModuleId | undefined) ?? "",
    reason: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    if (isEdit && !form.reason.trim()) {
      setSaveError("A reason for the change is required.");
      return;
    }
    if (!form.key.trim() || !form.value.trim()) {
      setSaveError("Key and value are required.");
      return;
    }
    setSaving(true);
    setSaveError("");
    const err = await onSave(form);
    if (err) {
      setSaveError(err as string);
      setSaving(false);
    }
    // onSave closes the sheet on success via onClose in parent
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Key */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="key" className="text-xs font-medium text-slate-700">
          Fact key
          <span className="ml-1 text-slate-400 font-normal">(dot-separated, e.g. data.retention_period)</span>
        </Label>
        <Input
          id="key"
          value={form.key}
          onChange={(e) => set("key", e.target.value)}
          placeholder="domain.fact_name"
          className="font-mono text-sm"
          disabled={isEdit}
        />
        {isEdit && (
          <p className="text-xs text-slate-400">Fact keys cannot be changed. Create a new fact instead.</p>
        )}
      </div>

      {/* Value */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="value" className="text-xs font-medium text-slate-700">
          Value
        </Label>
        <Textarea
          id="value"
          value={form.value}
          onChange={(e) => set("value", e.target.value)}
          placeholder="Enter fact value…"
          rows={3}
          className="text-sm resize-none"
        />
      </div>

      {/* Value type + Domain */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-slate-700">Value type</Label>
          <Select value={form.valueType} onValueChange={(v) => set("valueType", v as FactValueType)}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["string", "number", "boolean", "date", "url"] as FactValueType[]).map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-slate-700">Domain</Label>
          <Select value={form.domain} onValueChange={(v) => set("domain", v as FactDomain)}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["clinical", "technical", "data", "legal", "evidence"] as FactDomain[]).map((d) => (
                <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tier */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs font-medium text-slate-700">Tier</Label>
        <Select value={form.tier} onValueChange={(v) => set("tier", v as FactTier)} disabled={isEdit}>
          <SelectTrigger className="text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="global">Global — applies to all deployments</SelectItem>
            <SelectItem value="module">Module — scoped to a product module</SelectItem>
            <SelectItem value="org_instance">Org-Instance — overrides for a specific trust</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Module (conditional) */}
      {form.tier === "module" && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium text-slate-700">Module</Label>
          <Select value={form.module} onValueChange={(v) => set("module", v as ModuleId)} disabled={isEdit}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Select module…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mental-health">Mental Health</SelectItem>
              <SelectItem value="police">Police</SelectItem>
              <SelectItem value="neurodevelopmental">Neurodevelopmental</SelectItem>
              <SelectItem value="patient-crm">Patient CRM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Reason */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reason" className="text-xs font-medium text-slate-700">
          {isEdit ? "Reason for change" : "Notes"}
          {isEdit && <span className="ml-1 text-red-500">*</span>}
        </Label>
        <Textarea
          id="reason"
          value={form.reason}
          onChange={(e) => set("reason", e.target.value)}
          placeholder={
            isEdit
              ? "Required — explain why this value is changing…"
              : "Optional notes on this fact…"
          }
          rows={2}
          className="text-sm resize-none"
        />
        {isEdit && (
          <p className="text-xs text-slate-400">
            This reason will be recorded in the audit log. Required because{" "}
            <span className="font-medium text-slate-600">{initial?.dependentDocumentCount ?? 0}</span>{" "}
            document{(initial?.dependentDocumentCount ?? 0) !== 1 ? "s" : ""} will be marked stale.
          </p>
        )}
      </div>

      {saveError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {saveError}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          {isEdit ? "Save changes" : "Create fact"}
        </Button>
      </div>
    </div>
  );
}

// ── Root Sheet ─────────────────────────────────────────────────────────────

export function FactSheet({ state, onClose, onEditRequest, onSaveEdit, onSaveCreate }: FactSheetProps) {
  const isOpen = state !== null;

  const title =
    state?.mode === "view"
      ? "Fact Detail"
      : state?.mode === "edit"
      ? "Edit Fact"
      : "New Fact";

  const handleSaveEdit = async (form: FormState) => {
    if (state?.mode !== "edit") return null;
    const err = await onSaveEdit(state.fact, form.value, form.reason);
    if (!err) onClose();
    return err;
  };

  const handleSaveCreate = async (form: FormState) => {
    const err = await onSaveCreate({
      key: form.key,
      value: form.value,
      valueType: form.valueType,
      domain: form.domain,
      tier: form.tier,
      moduleId: form.module || undefined,
    });
    if (!err) onClose();
    return err;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-base font-semibold text-slate-900">
            {title}
          </SheetTitle>
        </SheetHeader>

        {state?.mode === "view" && (
          <FactDetailView
            fact={state.fact}
            onEdit={() => onEditRequest(state.fact)}
          />
        )}
        {state?.mode === "edit" && (
          <FactForm
            initial={state.fact}
            isEdit
            onCancel={onClose}
            onSave={handleSaveEdit}
          />
        )}
        {state?.mode === "create" && (
          <FactForm
            isEdit={false}
            onCancel={onClose}
            onSave={handleSaveCreate}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
