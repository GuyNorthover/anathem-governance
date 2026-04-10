"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  EU_TEMPLATES,
  EU_TEMPLATE_CATEGORIES,
  getTemplatesByCategory,
  type EUTemplateCategory,
  type EUTemplate,
} from "@/lib/eu-templates/template-definitions";
import { useOrgContext } from "@/stores/context/OrgContext";
import { cn } from "@/lib/utils";
import {
  FileText,
  Download,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  Building2,
  Loader2,
  Filter,
  BookOpen,
} from "lucide-react";

// ── Supabase client ───────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface EUDocumentInstance {
  id: string;
  template_slug: string;
  status: "draft" | "pending_review" | "approved" | "submitted";
  generated_at: string | null;
  org_id: string | null;
}

interface Organisation {
  id: string;
  name: string;
  ods_code: string;
}

// ── Category colour map ───────────────────────────────────────────────────────

const CATEGORY_COLOURS: Record<EUTemplateCategory, string> = {
  "Regulatory Positioning":     "bg-blue-100 text-blue-800 border-blue-200",
  "Economic Operators":         "bg-purple-100 text-purple-800 border-purple-200",
  "Quality Management System":  "bg-green-100 text-green-800 border-green-200",
  "GSPR and Evidence":          "bg-teal-100 text-teal-800 border-teal-200",
  "Risk Management":            "bg-red-100 text-red-800 border-red-200",
  "Software Lifecycle":         "bg-orange-100 text-orange-800 border-orange-200",
  "Clinical and Performance":   "bg-pink-100 text-pink-800 border-pink-200",
  "Usability and Human Oversight": "bg-violet-100 text-violet-800 border-violet-200",
  "Cybersecurity":              "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Privacy and Data Governance":"bg-indigo-100 text-indigo-800 border-indigo-200",
  "Technical Documentation":    "bg-slate-100 text-slate-800 border-slate-200",
  "Labelling and PMS":          "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Registration and Market Access": "bg-cyan-100 text-cyan-800 border-cyan-200",
};

const CATEGORY_DOT_COLOURS: Record<EUTemplateCategory, string> = {
  "Regulatory Positioning":     "bg-blue-500",
  "Economic Operators":         "bg-purple-500",
  "Quality Management System":  "bg-green-500",
  "GSPR and Evidence":          "bg-teal-500",
  "Risk Management":            "bg-red-500",
  "Software Lifecycle":         "bg-orange-500",
  "Clinical and Performance":   "bg-pink-500",
  "Usability and Human Oversight": "bg-violet-500",
  "Cybersecurity":              "bg-yellow-500",
  "Privacy and Data Governance":"bg-indigo-500",
  "Technical Documentation":    "bg-slate-500",
  "Labelling and PMS":          "bg-emerald-500",
  "Registration and Market Access": "bg-cyan-500",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500">
        <Clock className="h-3 w-3" />
        Not generated
      </span>
    );
  }
  if (status === "approved" || status === "submitted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
        <CheckCircle2 className="h-3 w-3" />
        {status === "submitted" ? "Submitted" : "Approved"}
      </span>
    );
  }
  if (status === "pending_review") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
        <Clock className="h-3 w-3" />
        Pending review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
      <FileText className="h-3 w-3" />
      Draft
    </span>
  );
}

function TemplateCard({
  template,
  instance,
  isGenerating,
  onGenerate,
}: {
  template: EUTemplate;
  instance: EUDocumentInstance | null;
  isGenerating: boolean;
  onGenerate: (slug: string) => void;
}) {
  const blankUrl = `/templates/eu-mdr/${encodeURIComponent(template.filename)}`;
  const categoryColour = CATEGORY_COLOURS[template.category];

  return (
    <div className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header row */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
          <h3 className="text-sm font-semibold leading-snug text-slate-900">
            {template.title}
          </h3>
        </div>
        <StatusBadge status={instance?.status ?? null} />
      </div>

      {/* Category badge */}
      <div className="mb-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            categoryColour
          )}
        >
          {template.category}
        </span>
      </div>

      {/* Purpose */}
      <p className="mb-3 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-500">
        {template.purpose}
      </p>

      {/* Question count */}
      <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
        <BookOpen className="h-3.5 w-3.5" />
        <span>{template.questions.length} question{template.questions.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Error */}
      {isGenerating === false && null /* errors handled at parent level */}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Download blank template */}
        <a
          href={blankUrl}
          download={template.filename}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Blank template
        </a>

        {/* Generate or view */}
        {instance ? (
          <a
            href={`/eu-templates/${instance.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
            View / Edit
          </a>
        ) : null}

        <button
          type="button"
          disabled={isGenerating}
          onClick={() => onGenerate(template.slug)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            isGenerating
              ? "cursor-not-allowed border border-indigo-200 bg-indigo-50 text-indigo-400"
              : "border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700"
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Generating with AI…
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              {instance ? "Regenerate" : "Generate"}
            </>
          )}
        </button>

        {/* Download filled document */}
        {instance && (
          <a
            href={`/api/eu-templates/download/${instance.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download .docx
          </a>
        )}
      </div>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressSummary({
  total,
  generated,
  approved,
}: {
  total: number;
  generated: number;
  approved: number;
}) {
  const pctGenerated = Math.round((generated / total) * 100);
  const pctApproved = Math.round((approved / total) * 100);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">Document completion</span>
        <span className="text-slate-500">
          {generated}/{total} generated · {approved}/{total} approved
        </span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
        {/* Approved (green) */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-green-500 transition-all duration-500"
          style={{ width: `${pctApproved}%` }}
        />
        {/* Generated but not approved (amber), positioned after approved */}
        <div
          className="absolute inset-y-0 rounded-full bg-amber-400 transition-all duration-500"
          style={{ left: `${pctApproved}%`, width: `${pctGenerated - pctApproved}%` }}
        />
      </div>
      <div className="mt-2 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          Approved ({pctApproved}%)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
          Draft ({pctGenerated - pctApproved}%)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-slate-200" />
          Not generated ({100 - pctGenerated}%)
        </span>
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function EUTemplateLibraryView() {
  const { activeOrgId, activeOrgName, setActiveOrg } = useOrgContext();

  const [instances, setInstances] = useState<EUDocumentInstance[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [activeCategory, setActiveCategory] = useState<EUTemplateCategory | "All">("All");
  const [generatingSlug, setGeneratingSlug] = useState<string | null>(null);
  const [errorSlug, setErrorSlug] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Load organisations ────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("organisations")
      .select("id, name, ods_code")
      .order("name")
      .then(({ data }) => {
        if (data) setOrganisations(data as Organisation[]);
      });
  }, []);

  // ── Load existing instances ───────────────────────────────────────────────
  const loadInstances = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("eu_document_instances")
      .select("id, template_slug, status, generated_at, org_id");

    if (activeOrgId) {
      query = query.eq("org_id", activeOrgId);
    }

    const { data } = await query.order("generated_at", { ascending: false });
    if (data) {
      // Keep only the latest instance per slug (in case of regeneration)
      const latest: Record<string, EUDocumentInstance> = {};
      for (const inst of data as EUDocumentInstance[]) {
        if (!latest[inst.template_slug]) {
          latest[inst.template_slug] = inst;
        }
      }
      setInstances(Object.values(latest));
    }
    setLoading(false);
  }, [activeOrgId]);

  useEffect(() => {
    loadInstances();
  }, [loadInstances]);

  // ── Instance lookup helpers ───────────────────────────────────────────────
  const instanceBySlug: Record<string, EUDocumentInstance> = {};
  for (const inst of instances) {
    instanceBySlug[inst.template_slug] = inst;
  }

  const generatedCount = instances.length;
  const approvedCount = instances.filter(
    (i) => i.status === "approved" || i.status === "submitted"
  ).length;

  // ── Filtered template list ────────────────────────────────────────────────
  const visibleTemplates: EUTemplate[] =
    activeCategory === "All"
      ? EU_TEMPLATES
      : getTemplatesByCategory(activeCategory as EUTemplateCategory);

  // ── Generate handler ──────────────────────────────────────────────────────
  async function handleGenerate(slug: string) {
    setGeneratingSlug(slug);
    setErrorSlug(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/eu-templates/populate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateSlug: slug,
          orgId: activeOrgId ?? undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      // Reload instances to pick up the new one
      await loadInstances();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorSlug(slug);
      setErrorMessage(msg);
    } finally {
      setGeneratingSlug(null);
    }
  }

  // ── Org change handler ────────────────────────────────────────────────────
  function handleOrgChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (!val) {
      // Clear
      sessionStorage.removeItem("gov_activeOrgId");
      sessionStorage.removeItem("gov_activeOrgName");
      window.location.reload();
      return;
    }
    const org = organisations.find((o) => o.id === val);
    if (org) setActiveOrg(org.id, org.name);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="border-b border-slate-200 bg-white px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                EU MDR Document Library
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                93 required documents across 13 categories — generate, review and download
              </p>
            </div>

            {/* Org selector */}
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 flex-shrink-0 text-slate-400" />
              <select
                value={activeOrgId ?? ""}
                onChange={handleOrgChange}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All organisations</option>
                {organisations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active org context banner */}
          {activeOrgName && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
              <Building2 className="h-4 w-4" />
              <span>
                Showing documents for <strong>{activeOrgName}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Progress summary */}
        <div className="mb-6">
          <ProgressSummary
            total={93}
            generated={generatedCount}
            approved={approvedCount}
          />
        </div>

        {/* Category tabs */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="h-4 w-4 flex-shrink-0 text-slate-400" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("All")}
              className={cn(
                "flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                activeCategory === "All"
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              All ({EU_TEMPLATES.length})
            </button>
            {EU_TEMPLATE_CATEGORIES.map((cat) => {
              const count = getTemplatesByCategory(cat).length;
              const dotColour = CATEGORY_DOT_COLOURS[cat];
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    activeCategory === cat
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-1.5 w-1.5 rounded-full",
                      activeCategory === cat ? "bg-white" : dotColour
                    )}
                  />
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading…
          </div>
        )}

        {/* Template grid */}
        {!loading && (
          <>
            <div className="mb-3 text-sm text-slate-500">
              {visibleTemplates.length} document{visibleTemplates.length !== 1 ? "s" : ""}
              {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
            </div>

            {/* Inline error banner */}
            {errorSlug && errorMessage && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="font-medium">Generation failed</span>
                <span className="text-red-500">—</span>
                <span>{errorMessage}</span>
                <button
                  type="button"
                  className="ml-auto flex-shrink-0 text-red-400 hover:text-red-600"
                  onClick={() => { setErrorSlug(null); setErrorMessage(null); }}
                >
                  ✕
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleTemplates.map((template) => (
                <TemplateCard
                  key={template.slug}
                  template={template}
                  instance={instanceBySlug[template.slug] ?? null}
                  isGenerating={generatingSlug === template.slug}
                  onGenerate={handleGenerate}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
