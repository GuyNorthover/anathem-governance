"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Download, Pencil, Check, X, Search,
  History, ChevronDown, ChevronUp, Trash2, Loader2,
  CircleCheck, CircleDashed, CircleAlert, PlusCircle,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface FactVersion {
  id: string;
  fact_id: string;
  version_number: number;
  value: string;
  changed_at: string;
  change_reason: string;
}

interface Fact {
  id: string;
  fact_key: string;
  display_name: string;
  current_value: string;
  description: string;
  domain: string;
}

interface Props {
  prefix: string;
  title: string;
}

export function SourceDocDetailView({ prefix, title }: Props) {
  const router = useRouter();
  const [facts, setFacts] = useState<Fact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "captured" | "missing">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const [versions, setVersions] = useState<Map<string, FactVersion[]>>(new Map());
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const loadFacts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("facts")
      .select("id, fact_key, display_name, current_value, description, domain")
      .like("fact_key", `${prefix}.%`)
      .order("fact_key");

    const loadedFacts: Fact[] = data ?? [];
    setFacts(loadedFacts);

    if (loadedFacts.length > 0) {
      const ids = loadedFacts.map((f) => f.id);
      const { data: vData } = await supabase
        .from("fact_versions")
        .select("id, fact_id, version_number, value, changed_at, change_reason")
        .in("fact_id", ids)
        .order("version_number", { ascending: false });

      const map = new Map<string, FactVersion[]>();
      for (const v of vData ?? []) {
        if (!map.has(v.fact_id)) map.set(v.fact_id, []);
        map.get(v.fact_id)!.push(v);
      }
      setVersions(map);
    }
    setLoading(false);
  }, [prefix]);

  useEffect(() => { loadFacts(); }, [loadFacts]);

  // Look up the ingestion job for this prefix so we can link to pathway extraction
  useEffect(() => {
    supabase
      .from("ingestion_jobs")
      .select("id")
      .eq("file_path", prefix)
      .eq("status", "source_doc")
      .maybeSingle()
      .then(({ data }) => { if (data) setJobId(data.id); });
  }, [prefix]);

  const sections = facts.reduce<Map<string, Fact[]>>((acc, f) => {
    const sec = f.description || "General";
    if (!acc.has(sec)) acc.set(sec, []);
    acc.get(sec)!.push(f);
    return acc;
  }, new Map());

  const sectionNames = Array.from(sections.keys());

  const filtered = facts.filter((f) => {
    if (selectedSection && f.description !== selectedSection) return false;
    if (filter === "captured" && !f.current_value?.trim()) return false;
    if (filter === "missing" && f.current_value?.trim()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!f.display_name.toLowerCase().includes(q) && !(f.current_value ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filteredSections = filtered.reduce<Map<string, Fact[]>>((acc, f) => {
    const sec = f.description || "General";
    if (!acc.has(sec)) acc.set(sec, []);
    acc.get(sec)!.push(f);
    return acc;
  }, new Map());

  const capturedCount = facts.filter((f) => f.current_value?.trim()).length;
  const missingCount = facts.length - capturedCount;

  async function saveEdit(fact: Fact) {
    setSaving(true);
    await supabase
      .from("facts")
      .update({ current_value: editBuf, updated_at: new Date().toISOString() })
      .eq("id", fact.id);
    setFacts((prev) => prev.map((f) => f.id === fact.id ? { ...f, current_value: editBuf } : f));
    setEditingId(null);
    setSaving(false);
  }

  function toggleVersions(factId: string) {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(factId)) next.delete(factId); else next.add(factId);
      return next;
    });
  }

  async function deleteVersion(versionId: string, factId: string) {
    setDeletingVersionId(versionId);
    try {
      await fetch("/api/source-docs/delete-version", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      setVersions((prev) => {
        const next = new Map(prev);
        next.set(factId, (next.get(factId) ?? []).filter((v) => v.id !== versionId));
        return next;
      });
    } finally {
      setDeletingVersionId(null);
    }
  }

  function handleDownload() {
    window.open(`/api/source-docs/download?prefix=${encodeURIComponent(prefix)}&title=${encodeURIComponent(title)}`, "_blank");
  }

  function formatDate(iso: string) {
    try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return iso; }
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading document…</div>;
  }

  if (facts.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 text-sm text-slate-400">
        <p>No content found for this document.</p>
        <button onClick={() => router.push("/source-docs")} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back to Source Docs
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left sidebar */}
      <div className="w-60 flex-shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-4 py-4 border-b border-slate-200">
          <button onClick={() => router.push("/source-docs")} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mb-3">
            <ArrowLeft className="h-3.5 w-3.5" /> All Documents
          </button>
          <p className="text-xs font-semibold text-slate-800 leading-snug">{title}</p>

          {/* Completion bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500 font-medium">{capturedCount} of {facts.length} captured</span>
              <span className="text-[10px] font-semibold text-slate-600">{Math.round((capturedCount / facts.length) * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(capturedCount / facts.length) * 100}%` }}
              />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                <CircleCheck className="h-3 w-3" /> {capturedCount} captured
              </span>
              <span className="flex items-center gap-1 text-[10px] text-red-400">
                <CircleDashed className="h-3 w-3" /> {missingCount} missing
              </span>
            </div>
          </div>
        </div>

        {/* Pathway extraction CTA */}
        {jobId && (
          <div className="flex-shrink-0 px-3 py-3 border-b border-slate-200 bg-violet-50">
            <button
              onClick={() => router.push(`/pathways?extract=${jobId}`)}
              className="flex w-full items-center gap-2 rounded-lg border border-violet-200 bg-white px-3 py-2 text-left hover:border-violet-400 hover:shadow-sm transition-all"
            >
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-violet-100">
                <GitBranch className="h-3.5 w-3.5 text-violet-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-violet-700">Extract Pathway →</p>
                <p className="text-[10px] text-violet-500">Build a governance flowchart from this document</p>
              </div>
            </button>
          </div>
        )}

        {/* Filter pills */}
        <div className="flex-shrink-0 flex gap-1 px-3 py-2 border-b border-slate-200">
          {(["all", "captured", "missing"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 rounded-md py-1 text-[10px] font-semibold capitalize transition-colors",
                filter === f ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Section nav */}
        <div className="flex-1 overflow-y-auto py-2">
          <button
            onClick={() => setSelectedSection(null)}
            className={cn(
              "flex w-full items-center justify-between px-4 py-2 text-xs transition-colors",
              !selectedSection ? "bg-white text-blue-600 font-semibold border-r-2 border-blue-500" : "text-slate-500 hover:bg-white hover:text-slate-700"
            )}
          >
            <span>All sections</span>
            <span className="text-[10px] text-slate-400">{facts.length}</span>
          </button>
          {sectionNames.map((sec) => {
            const secFacts = sections.get(sec) ?? [];
            const secMissing = secFacts.filter((f) => !f.current_value?.trim()).length;
            return (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec === selectedSection ? null : sec)}
                className={cn(
                  "flex w-full items-start justify-between px-4 py-2 text-xs transition-colors",
                  selectedSection === sec ? "bg-white text-blue-600 font-semibold border-r-2 border-blue-500" : "text-slate-500 hover:bg-white hover:text-slate-700"
                )}
              >
                <span className="text-left leading-snug flex-1 mr-1">{sec}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {secMissing > 0 && (
                    <span className="rounded-full bg-red-100 px-1.5 text-[9px] font-bold text-red-500">{secMissing}</span>
                  )}
                  <span className="text-[10px] text-slate-400">{secFacts.length}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-base font-semibold text-slate-900 truncate">{title}</h1>
              <span className="text-xs text-slate-400 flex-shrink-0">{filtered.length} items</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-8 h-8 w-48 text-xs" />
              </div>
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> Download
              </Button>
            </div>
          </div>
        </div>

        {/* Q&A content */}
        <div className="flex-1 overflow-y-auto">
          {Array.from(filteredSections.entries()).map(([section, items]) => (
            <div key={section}>
              <div className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 px-6 py-2 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">{section}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                    <CircleCheck className="h-3 w-3" />
                    {items.filter((f) => f.current_value?.trim()).length}
                  </span>
                  <span className="text-[10px] text-red-400 flex items-center gap-0.5">
                    <CircleDashed className="h-3 w-3" />
                    {items.filter((f) => !f.current_value?.trim()).length}
                  </span>
                </div>
              </div>

              {items.map((fact) => {
                const hasAnswer = Boolean(fact.current_value?.trim());
                const factVersions = versions.get(fact.id) ?? [];
                const versionsExpanded = expandedVersions.has(fact.id);
                const isEditing = editingId === fact.id;

                return (
                  <div
                    key={fact.id}
                    className={cn(
                      "border-b border-slate-100 px-6 py-4 group transition-colors",
                      hasAnswer ? "hover:bg-emerald-50/30" : "bg-red-50/20 hover:bg-red-50/40"
                    )}
                  >
                    {/* Status indicator + question */}
                    <div className="flex items-start gap-2.5 mb-2.5">
                      {hasAnswer
                        ? <CircleCheck className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        : <CircleDashed className="h-4 w-4 text-red-300 flex-shrink-0 mt-0.5" />}
                      <p className="text-sm font-semibold text-slate-800 leading-snug flex-1">{fact.display_name}</p>
                    </div>

                    {/* Answer / empty state */}
                    {isEditing ? (
                      <div className="ml-6.5 flex flex-col gap-2">
                        <textarea
                          autoFocus
                          value={editBuf}
                          onChange={(e) => setEditBuf(e.target.value)}
                          rows={Math.min(Math.max((editBuf.match(/\n/g)?.length ?? 0) + 3, 4), 14)}
                          className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-slate-700 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveEdit(fact)}
                            disabled={saving}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Check className="h-3 w-3" />
                            {saving ? "Saving…" : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
                          >
                            <X className="h-3 w-3" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : hasAnswer ? (
                      /* Captured answer */
                      <div className="ml-6 flex items-start gap-2">
                        <div className="flex-1 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {fact.current_value}
                        </div>
                        <button
                          onClick={() => { setEditingId(fact.id); setEditBuf(fact.current_value); }}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white"
                          title="Edit answer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* Missing — prominent empty state */
                      <div className="ml-6">
                        <button
                          onClick={() => { setEditingId(fact.id); setEditBuf(""); }}
                          className="w-full flex items-center gap-2 rounded-lg border-2 border-dashed border-red-200 bg-white px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50 transition-colors group/add"
                        >
                          <PlusCircle className="h-4 w-4 text-red-300 group-hover/add:text-blue-400 flex-shrink-0" />
                          <span className="text-sm text-red-300 italic group-hover/add:text-blue-500">Not captured — click to add answer</span>
                        </button>
                      </div>
                    )}

                    {/* Fact key */}
                    <code className="mt-2 ml-6 inline-block text-[10px] font-mono text-slate-300">{fact.fact_key}</code>

                    {/* Version history */}
                    {factVersions.length > 0 && (
                      <div className="mt-2 ml-6">
                        <button
                          onClick={() => toggleVersions(fact.id)}
                          className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <History className="h-3 w-3" />
                          {factVersions.length} version{factVersions.length !== 1 ? "s" : ""}
                          {versionsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>

                        {versionsExpanded && (
                          <div className="mt-2 rounded-lg border border-slate-100 overflow-hidden">
                            {factVersions.map((v, vi) => (
                              <div key={v.id} className={cn("flex items-start gap-3 px-4 py-3 text-xs", vi < factVersions.length - 1 ? "border-b border-slate-100" : "", vi === 0 ? "bg-blue-50/40" : "bg-white")}>
                                <span className={cn("flex-shrink-0 mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold", vi === 0 ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-500")}>{v.version_number}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-slate-700 truncate">{v.change_reason || "Unknown document"}</span>
                                    {vi === 0 && <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">current</span>}
                                  </div>
                                  <p className="text-slate-400 mb-1">{v.changed_at ? formatDate(v.changed_at) : "Date unknown"}</p>
                                  <p className="text-slate-500 leading-relaxed line-clamp-3 whitespace-pre-wrap">{v.value}</p>
                                </div>
                                <button
                                  onClick={() => deleteVersion(v.id, fact.id)}
                                  disabled={deletingVersionId === v.id}
                                  className="flex-shrink-0 mt-0.5 rounded p-1 text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                  {deletingVersionId === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
