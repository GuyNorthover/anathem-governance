"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { PromptRow, PromptVersionRow } from "@/lib/supabase/database.types";
import { PLACEHOLDER_PROMPTS } from "@/lib/prompts/data";
import type { Prompt, PromptVersion, PromptCategory } from "@/lib/prompts/types";

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Infer a PromptCategory from the prompt_key
function inferCategory(key: string): PromptCategory {
  if (key.startsWith("clinical-safety")) return "clinical-safety";
  if (key.startsWith("ig")) return "ig-questionnaire";
  if (key.startsWith("evidence")) return "evidence";
  if (key.startsWith("nhse") || key.startsWith("avt")) return "avt-registry";
  if (key.startsWith("ingestion.answer")) return "ingestion-drafting";
  if (key.startsWith("ingestion")) return "ingestion-mapping";
  if (key.startsWith("risk")) return "risk-management";
  return "clinical-safety";
}

function rowToVersion(row: PromptVersionRow): PromptVersion {
  return {
    id: row.id,
    versionNumber: row.version_number,
    promptText: row.prompt_text,
    changeNotes: "",
    createdBy: row.created_by ?? "System",
    createdAt: formatDate(row.created_at),
  };
}

function rowToPrompt(row: PromptRow, versions: PromptVersionRow[]): Prompt {
  const sorted = [...versions].sort((a, b) => b.version_number - a.version_number);
  const inputFactKeys: string[] = Array.isArray(row.input_fact_keys) ? row.input_fact_keys : [];

  return {
    id: row.id,
    promptKey: row.prompt_key,
    displayName: row.display_name,
    purpose: row.purpose,
    targetSection: row.target_section,
    inputFactKeys,
    outputFormat: row.output_format,
    category: inferCategory(row.prompt_key),
    status: row.status,
    currentVersion: sorted[0]?.version_number ?? 1,
    createdBy: "System",
    createdAt: formatDate(row.created_at),
    updatedAt: formatDate(row.updated_at),
    versions: sorted.map(rowToVersion),
  };
}

export function usePrompts() {
  const [data, setData] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase
      .from("prompts")
      .select("*, prompt_versions(*)")
      .order("updated_at", { ascending: false });

    if (err) {
      setError(err.message);
      setData(PLACEHOLDER_PROMPTS);
    } else if (!rows || rows.length === 0) {
      setData(PLACEHOLDER_PROMPTS);
    } else {
      setData(rows.map((row) => rowToPrompt(row, row.prompt_versions as PromptVersionRow[])));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function approvePrompt(promptId: string) {
    const { error } = await supabase
      .from("prompts")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", promptId);
    if (!error) load();
    return error;
  }

  async function rejectPrompt(promptId: string, _versionId: string, _reason: string) {
    const { error } = await supabase
      .from("prompts")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", promptId);
    if (!error) load();
    return error;
  }

  return { data, loading, error, reload: load, approvePrompt, rejectPrompt };
}
