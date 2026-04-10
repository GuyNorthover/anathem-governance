"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { FactRow, FactVersionRow } from "@/lib/supabase/database.types";
import { PLACEHOLDER_FACTS } from "@/lib/knowledge-base/data";
import type { Fact } from "@/lib/knowledge-base/types";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function rowToFact(row: FactRow, versions: FactVersionRow[] = []): Fact {
  return {
    id: row.id,
    key: row.fact_key,
    value: row.current_value,
    tier: row.tier,
    domain: row.domain,
    valueType: row.value_type as any,
    module: row.module_id as any ?? undefined,
    createdAt: formatDate(row.created_at),
    modifiedAt: formatDate(row.updated_at),
    createdBy: row.created_by ?? "—",
    modifiedBy: row.created_by ?? "—",
    dependentDocumentCount: 0,
    relatedFactKeys: [],
    versions: versions.map((v) => ({
      id: v.id,
      value: v.value,
      changedBy: v.changed_by ?? "—",
      changedAt: formatDate(v.changed_at),
      reason: v.change_reason,
    })),
  };
}

export function useFacts() {
  const [data, setData] = useState<Fact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase
      .from("facts")
      .select("*, fact_versions(*)")
      .order("fact_key");

    if (err) {
      setError(err.message);
      setData(PLACEHOLDER_FACTS);
    } else if (!rows || rows.length === 0) {
      setData(PLACEHOLDER_FACTS);
    } else {
      setData(rows.map((row) => rowToFact(row, row.fact_versions as FactVersionRow[])));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createFact(payload: Omit<FactRow, "created_at" | "updated_at">) {
    const { error } = await supabase.from("facts").insert(payload);
    if (!error) load();
    return error;
  }

  async function updateFact(
    id: string,
    patch: Partial<FactRow>,
    versionEntry: FactVersionRow
  ) {
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("facts").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id),
      supabase.from("fact_versions").insert(versionEntry),
    ]);
    if (!e1 && !e2) load();
    return e1 ?? e2 ?? null;
  }

  return { data, loading, error, reload: load, createFact, updateFact };
}

export function useFact(id: string) {
  const { data, loading, error } = useFacts();
  return { data: data.find((f) => f.id === id) ?? null, loading, error };
}
