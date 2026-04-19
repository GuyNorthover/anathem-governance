"use client";

import { useState } from "react";
import { AlertTriangle, Check, ChevronRight, FileText, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface FactConflict {
  id: string;
  fact_key: string;
  fact_id: string | null;
  existing_value: string;
  proposed_value: string;
  source_document: string | null;
  source_type: string;
  status: string;
  created_at: string;
}

interface Props {
  conflicts: FactConflict[];
  onResolved: () => void;
}

function ConflictCard({
  conflict,
  onResolved,
}: {
  conflict: FactConflict;
  onResolved: () => void;
}) {
  const [resolving, setResolving] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualValue, setManualValue] = useState(conflict.existing_value);
  const [error, setError] = useState<string | null>(null);

  async function resolve(
    choice: "keep_existing" | "use_new" | "manual",
    customValue?: string
  ) {
    setResolving(true);
    setError(null);

    try {
      const finalValue =
        choice === "keep_existing"
          ? conflict.existing_value
          : choice === "use_new"
          ? conflict.proposed_value
          : customValue ?? conflict.existing_value;

      const now = new Date().toISOString();

      // Update the fact if we're not keeping existing (or writing manual)
      if (choice !== "keep_existing" && conflict.fact_id) {
        const { error: factErr } = await sb
          .from("facts")
          .update({ current_value: finalValue, updated_at: now })
          .eq("id", conflict.fact_id);
        if (factErr) throw new Error(factErr.message);
      }

      // Mark conflict resolved
      const statusMap = {
        keep_existing: "resolved_keep_existing",
        use_new: "resolved_use_new",
        manual: "resolved_manual",
      } as const;

      const { error: conflictErr } = await sb
        .from("fact_conflicts")
        .update({
          status: statusMap[choice],
          resolved_value: finalValue,
          resolved_at: now,
        })
        .eq("id", conflict.id);

      if (conflictErr) throw new Error(conflictErr.message);

      onResolved();
    } catch (e: any) {
      setError(e.message ?? "Resolution failed");
      setResolving(false);
    }
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-200">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
        <code className="text-xs font-mono text-slate-700 font-semibold">{conflict.fact_key}</code>
        {conflict.source_document && (
          <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
            <FileText className="h-3 w-3" />
            {conflict.source_document}
          </span>
        )}
      </div>

      {/* Values comparison */}
      <div className="grid grid-cols-2 divide-x divide-slate-100">
        <div className="p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
            Current value (Knowledge Base)
          </p>
          <p className="text-xs text-slate-700 leading-relaxed">{conflict.existing_value}</p>
        </div>
        <div className="p-3 bg-blue-50/50">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-400 mb-1.5">
            Proposed value (from document)
          </p>
          <p className="text-xs text-slate-700 leading-relaxed">{conflict.proposed_value}</p>
        </div>
      </div>

      {/* Manual edit area */}
      {manualMode && (
        <div className="px-4 pb-3 pt-2 border-t border-slate-100">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
            Custom value
          </p>
          <textarea
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            rows={3}
            className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-slate-100 bg-slate-50">
        {error && <p className="text-xs text-red-600 mr-auto">{error}</p>}
        {!manualMode ? (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={resolving}
              onClick={() => resolve("keep_existing")}
            >
              {resolving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
              Keep existing
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
              disabled={resolving}
              onClick={() => resolve("use_new")}
            >
              {resolving ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronRight className="h-3 w-3 mr-1" />}
              Use proposed
            </Button>
            <button
              onClick={() => { setManualMode(true); setManualValue(conflict.existing_value); }}
              className="ml-auto text-xs text-slate-400 hover:text-slate-700 underline underline-offset-2"
            >
              Edit manually
            </button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              className="h-7 text-xs"
              disabled={resolving || !manualValue.trim()}
              onClick={() => resolve("manual", manualValue.trim())}
            >
              {resolving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save custom value"}
            </Button>
            <button
              onClick={() => setManualMode(false)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function ConflictsPanel({ conflicts, onResolved }: Props) {
  if (conflicts.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50/40">
      {/* Panel header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {conflicts.length} conflicting fact{conflicts.length !== 1 ? "s" : ""} need resolution
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            A document import proposed different values for facts already in the knowledge base. Choose which version is the source of truth.
          </p>
        </div>
      </div>

      {/* Conflict cards */}
      <div className="flex flex-col gap-3 p-4">
        {conflicts.map((c) => (
          <ConflictCard key={c.id} conflict={c} onResolved={onResolved} />
        ))}
      </div>
    </div>
  );
}
