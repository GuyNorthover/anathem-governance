"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, MapPin, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ModuleChip } from "@/components/documents/ModuleChip";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import { useOrganisations } from "@/resources/hooks/use-organisations";
import { useDocuments } from "@/resources/hooks/use-documents";
import { STATUS_STYLES } from "@/lib/documents/types";
import type { DocumentInstance, DocumentStatus } from "@/lib/documents/types";
import { cn } from "@/lib/utils";

const STATUS_ORDER: DocumentStatus[] = ["stale", "pending_review", "draft", "approved", "submitted"];

function PipelineSummary({ docs }: { docs: DocumentInstance[] }) {
  if (docs.length === 0) return <span className="text-xs text-slate-400">No documents yet</span>;

  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = docs.filter((d) => d.status === s).length;
    return acc;
  }, {} as Record<DocumentStatus, number>);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => (
        <div key={s} className="flex items-center gap-1.5">
          <span className={cn("inline-block h-2 w-2 rounded-full", STATUS_STYLES[s].dot)} />
          <span className="text-xs text-slate-600">
            <span className="font-semibold">{counts[s]}</span>{" "}
            {STATUS_STYLES[s].label.toLowerCase()}
          </span>
        </div>
      ))}
      <span className="text-xs text-slate-400">· {docs.length} total</span>
    </div>
  );
}

function PipelineBar({ docs }: { docs: DocumentInstance[] }) {
  if (docs.length === 0) return null;
  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full gap-px">
      {STATUS_ORDER.map((s) => {
        const count = docs.filter((d) => d.status === s).length;
        if (count === 0) return null;
        const pct = (count / docs.length) * 100;
        return (
          <div
            key={s}
            className={cn("h-full", STATUS_STYLES[s].dot)}
            style={{ width: `${pct}%` }}
          />
        );
      })}
    </div>
  );
}

export function OrganisationsView() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { data: orgs } = useOrganisations();
  const { data: allDocs } = useDocuments();

  const filtered = orgs.filter((org) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      org.name.toLowerCase().includes(q) ||
      org.odsCode.toLowerCase().includes(q) ||
      org.region.toLowerCase().includes(q)
    );
  });

  const totalDocs = allDocs.length;
  const staleDocs = allDocs.filter((d) => d.status === "stale").length;
  const submittedDocs = allDocs.filter((d) => d.status === "submitted").length;

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Organisations</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            NHS trust pipeline — document status and active modules per organisation
          </p>
        </div>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Organisation
        </Button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Trusts onboarded", value: orgs.length },
          { label: "Total documents", value: totalDocs },
          { label: "Submitted", value: submittedDocs },
          { label: "Require attention", value: staleDocs, warn: staleDocs > 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
            <p className={cn("mt-0.5 text-2xl font-bold", s.warn ? "text-red-600" : "text-slate-900")}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search organisations…"
          className="pl-8 h-9 text-sm"
        />
      </div>

      {/* Org cards */}
      <div className="flex flex-col gap-3">
        {filtered.map((org) => {
          const orgDocs = allDocs.filter((d) => d.orgId === org.id);
          const hasStale = orgDocs.some((d) => d.status === "stale");

          return (
            <button
              key={org.id}
              onClick={() => router.push(`/organisations/${org.id}`)}
              className={cn(
                "group rounded-lg border bg-white text-left transition-all hover:shadow-sm",
                hasStale ? "border-red-200" : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Left */}
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    {/* Name + ODS */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {org.name}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500">
                        {org.odsCode}
                      </span>
                      {hasStale && (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          Stale documents
                        </span>
                      )}
                    </div>

                    {/* Region + modules */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {org.region}
                      </span>
                      <span className="text-slate-300">·</span>
                      <div className="flex gap-1 flex-wrap">
                        {org.activeModules.map((m) => <ModuleChip key={m} module={m} />)}
                      </div>
                    </div>

                    {/* Pipeline summary */}
                    <PipelineSummary docs={orgDocs} />
                  </div>

                  {/* Right: pipeline bar + chevron */}
                  <div className="flex flex-col items-end gap-3 flex-shrink-0 w-48">
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    <PipelineBar docs={orgDocs} />
                    <span className="text-[10px] text-slate-400">
                      Onboarded {org.onboardedAt}
                    </span>
                  </div>
                </div>
              </div>

              {/* Document row preview */}
              {orgDocs.length > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 px-5 py-2.5 overflow-x-auto">
                    {orgDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-1.5 flex-shrink-0"
                      >
                        <DocumentStatusBadge status={doc.status} />
                        <span className="text-xs text-slate-500 max-w-[140px] truncate">
                          {doc.docTypeName}
                        </span>
                        {orgDocs.indexOf(doc) < orgDocs.length - 1 && (
                          <span className="text-slate-200 ml-1">|</span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
