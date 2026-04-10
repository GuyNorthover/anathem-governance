"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { AuditLogRow } from "@/lib/supabase/database.types";
import { PLACEHOLDER_AUDIT_EVENTS } from "@/lib/audit/data";
import type { AuditEvent } from "@/lib/audit/types";

// The real audit_log schema is thinner than the app model.
// We map what we have and fill gaps from the payload field.
function rowToEvent(row: AuditLogRow): AuditEvent {
  const payload = (row.payload as Record<string, string | number | boolean | null>) ?? {};
  return {
    id: row.id,
    type: (payload.type as AuditEvent["type"]) ?? (row.event_type as AuditEvent["type"]),
    category: (payload.category as AuditEvent["category"]) ?? "knowledge-base",
    actor: (payload.actor as string) ?? row.actor_id,
    actorRole: (payload.actor_role as AuditEvent["actorRole"]) ?? "editor",
    timestamp: row.created_at,
    summary: (payload.summary as string) ?? row.event_type,
    detail: payload,
    relatedId: (payload.related_id as string) ?? undefined,
    relatedType: (payload.related_type as string) ?? undefined,
  };
}

export function useAuditEvents() {
  const [data, setData] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error: err } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
      setData(PLACEHOLDER_AUDIT_EVENTS);
    } else if (!rows || rows.length === 0) {
      setData(PLACEHOLDER_AUDIT_EVENTS);
    } else {
      setData(rows.map(rowToEvent));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function appendEvent(event: AuditLogRow) {
    const { error } = await supabase.from("audit_log").insert(event);
    if (!error) load();
    return error;
  }

  return { data, loading, error, reload: load, appendEvent };
}
