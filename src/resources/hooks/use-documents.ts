"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { PLACEHOLDER_DOCUMENTS } from "@/lib/documents/data";
import type { DocumentInstance, DocumentSection, DocumentCategory } from "@/lib/documents/types";

// Map document_type type_key → DocumentCategory
function toCategory(typeKey: string): DocumentCategory {
  if (typeKey?.includes("clinical-safety") || typeKey?.includes("dcb0129") || typeKey?.includes("dcb0160")) return "clinical-safety";
  if (typeKey?.includes("ig")) return "ig";
  if (typeKey?.includes("procurement")) return "procurement";
  if (typeKey?.includes("nhse") || typeKey?.includes("avt")) return "nhse";
  if (typeKey?.includes("mhra") || typeKey?.includes("technical")) return "regulatory";
  return "clinical-safety";
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function useDocuments() {
  const [data, setData] = useState<DocumentInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [
      { data: rows, error: rowsErr },
      { data: docTypes },
      { data: orgs },
      { data: modules },
    ] = await Promise.all([
      supabase.from("document_instances").select("*").order("updated_at", { ascending: false }),
      supabase.from("document_types").select("id, type_key, display_name, framework"),
      supabase.from("organisations").select("id, name"),
      supabase.from("modules").select("id, module_key, display_name"),
    ]);

    if (rowsErr) {
      setError(rowsErr.message);
      setData(PLACEHOLDER_DOCUMENTS);
      setLoading(false);
      return;
    }

    if (!rows || rows.length === 0) {
      setData(PLACEHOLDER_DOCUMENTS);
      setLoading(false);
      return;
    }

    const typeMap = new Map((docTypes ?? []).map((t: any) => [t.id, t]));
    const orgMap = new Map((orgs ?? []).map((o: any) => [o.id, o]));
    const moduleMap = new Map((modules ?? []).map((m: any) => [m.id, m]));

    const mapped: DocumentInstance[] = rows.map((row: any) => {
      const docType = typeMap.get(row.document_type_id) as any;
      const org = orgMap.get(row.org_id) as any;

      const activeModuleIds: string[] = Array.isArray(row.active_modules) ? row.active_modules : [];
      const activeModules = activeModuleIds
        .map((id) => (moduleMap.get(id) as any)?.module_key ?? id)
        .filter(Boolean);

      // stale_reason can be a string or text[] — normalise to string[]
      const staleReasons: string[] = Array.isArray(row.stale_reason)
        ? row.stale_reason
        : row.stale_reason
        ? [row.stale_reason]
        : [];

      return {
        id: row.id,
        docTypeId: row.document_type_id ?? "",
        docTypeName: docType?.display_name ?? "Unknown Document",
        docTypeCategory: toCategory(docType?.type_key ?? ""),
        orgId: row.org_id ?? "",
        orgName: org?.name ?? "Unknown Organisation",
        activeModules,
        status: row.status,
        version: row.version ?? 1,
        createdBy: "",
        createdAt: row.created_at ?? "",
        updatedAt: formatDate(row.updated_at),
        staleFactKey: staleReasons[0] ?? undefined,
        sections: [],
      } as DocumentInstance;
    });

    setData(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateDocumentStatus(documentId: string, status: string) {
    const { error } = await supabase
      .from("document_instances")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", documentId);
    if (!error) load();
    return error;
  }

  return { data, loading, error, reload: load, updateDocumentStatus };
}

// ── Single document with sections ─────────────────────────────────────────────

export function useDocumentWithSections(id: string) {
  const [data, setData] = useState<DocumentInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [
      { data: row, error: rowErr },
      { data: sections },
    ] = await Promise.all([
      supabase
        .from("document_instances")
        .select(`
          *,
          document_types(id, type_key, display_name, framework),
          organisations(id, name)
        `)
        .eq("id", id)
        .single(),
      supabase
        .from("document_sections")
        .select("*")
        .eq("document_instance_id", id)
        .order("order_index", { ascending: true }),
    ]);

    if (rowErr || !row) {
      setError(rowErr?.message ?? "Document not found");
      setLoading(false);
      return;
    }

    const docType = (row as any).document_types;
    const org = (row as any).organisations;

    // Fetch org modules separately (no direct FK between document_instances and org_modules)
    const orgId = row.org_id;
    let orgModules: any[] = [];
    if (orgId) {
      const { data: omRows } = await supabase
        .from("org_modules")
        .select("module_id, modules(module_key)")
        .eq("org_id", orgId);
      orgModules = omRows ?? [];
    }

    const activeModules: string[] = orgModules
      .map((om: any) => om.modules?.module_key)
      .filter(Boolean);

    const staleReasons: string[] = Array.isArray(row.stale_reason)
      ? row.stale_reason
      : row.stale_reason
      ? [row.stale_reason]
      : [];

    const mappedSections: DocumentSection[] = (sections ?? []).map((s: any) => ({
      id: s.id,
      title: s.title,
      factKeys: s.fact_keys_used ?? [],
      promptId: s.prompt_id ?? "",
      generatedContent: s.content ?? "",
      approvedContent: s.status === "approved" ? s.content : null,
      status: s.status,
      generatedAt: formatDate(s.generated_at),
      generatedBy: s.approved_by ?? "Anathem",
      approvedBy: s.approved_by ?? undefined,
      approvedAt: s.approved_at ? formatDate(s.approved_at) : undefined,
    }));

    setData({
      id: row.id,
      docTypeId: row.document_type_id ?? "",
      docTypeName: docType?.display_name ?? "Unknown Document",
      docTypeCategory: toCategory(docType?.type_key ?? ""),
      orgId: row.org_id ?? "",
      orgName: org?.name ?? "Unknown Organisation",
      activeModules,
      status: row.status,
      version: (row as any).version ?? 1,
      createdBy: "",
      createdAt: row.created_at ?? "",
      updatedAt: formatDate(row.updated_at),
      staleFactKey: staleReasons[0] ?? undefined,
      sections: mappedSections,
    });

    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(status: string) {
    await supabase
      .from("document_instances")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    load();
  }

  async function approveSection(sectionId: string) {
    await supabase
      .from("document_sections")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: "Anathem User",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sectionId);
    load();
  }

  return { data, loading, error, reload: load, updateStatus, approveSection };
}

export function useDocument(id: string) {
  const { data, loading, error, reload } = useDocuments();
  return {
    data: data.find((d) => d.id === id) ?? null,
    loading,
    error,
    reload,
  };
}
