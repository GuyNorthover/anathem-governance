"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Calendar, Mail, Shield,
  FileText, Database, AlertTriangle, CheckCircle2, ToggleLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ModuleChip } from "@/components/documents/ModuleChip";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import { TierBadge } from "@/components/knowledge-base/TierBadge";
import { DomainBadge } from "@/components/knowledge-base/DomainBadge";
import { useDocuments } from "@/resources/hooks/use-documents";
import { useFacts } from "@/resources/hooks/use-facts";
import { useOrganisations } from "@/resources/hooks/use-organisations";
import { NewDocumentDialog } from "@/components/documents/NewDocumentDialog";
import { MODULE_LABELS } from "@/lib/knowledge-base/types";
import { STATUS_STYLES } from "@/lib/documents/types";
import type { Organisation } from "@/lib/organisations/types";
import type { ModuleId } from "@/lib/knowledge-base/types";
import { cn } from "@/lib/utils";

const ALL_MODULES: ModuleId[] = ["mental-health", "police", "neurodevelopmental", "patient-crm"];

const MODULE_DESCRIPTIONS: Record<ModuleId, string> = {
  "mental-health": "Clinician-facing AVT for mental health consultations",
  police: "AVT for police custody and interview workflows",
  neurodevelopmental: "CAMHS autism and ADHD assessment support",
  "patient-crm": "Patient-facing portal and CRM integration",
};

interface OrganisationDetailViewProps {
  org: Organisation;
  onReload?: () => void;
}

export function OrganisationDetailView({ org, onReload }: OrganisationDetailViewProps) {
  const router = useRouter();
  const { data: allDocs } = useDocuments();
  const { data: allFacts } = useFacts();
  const { toggleModule, reload: reloadOrg } = useOrganisations();
  const [newDocOpen, setNewDocOpen] = useState(false);
  const reload = () => { reloadOrg(); onReload?.(); };
  const orgDocs = allDocs.filter((d) => d.orgId === org.id);
  const orgFactOverrides = allFacts.filter(
    (f) => f.tier === "org_instance" && f.orgId === org.id
  );
  const staleDocs = orgDocs.filter((d) => d.status === "stale");

  const docStatusCounts = orgDocs.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col gap-0 h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-8 py-4">
        <Link
          href="/organisations"
          className="mb-2 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors w-fit"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Organisations
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-semibold text-slate-900">{org.name}</h1>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-500">
                {org.odsCode}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {org.region}
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Onboarded {org.onboardedAt}
              </span>
            </div>
          </div>
          <Button size="sm" variant="outline">Edit Organisation</Button>
        </div>
      </div>

      <div className="flex flex-col gap-8 p-8">
        {/* Stale alert */}
        {staleDocs.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-700">
              <span className="font-semibold">{staleDocs.length} document{staleDocs.length > 1 ? "s" : ""} stale</span>
              {" "}— underlying facts have changed. These documents cannot be submitted until reviewed.
            </p>
          </div>
        )}

        {/* Three-column info row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Active Modules */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Active Modules
            </p>
            <div className="flex flex-col gap-2">
              {ALL_MODULES.map((moduleId) => {
                const active = org.activeModules.includes(moduleId);
                return (
                  <div key={moduleId} className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <ModuleChip module={moduleId} />
                        {active && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {MODULE_DESCRIPTIONS[moduleId]}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        await toggleModule(org.id, moduleId, !active);
                        reload();
                      }}
                      className={cn(
                        "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors",
                        active
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      )}
                    >
                      {active ? "Active" : "Inactive"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contacts */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Contacts
            </p>
            <div className="flex flex-col gap-3">
              {org.contacts.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No contacts on file.</p>
              ) : (
                org.contacts.map((contact) => (
                  <div key={contact.email} className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium text-slate-800">{contact.name}</p>
                    <p className="text-xs text-slate-500">{contact.role}</p>
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
                    >
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pipeline stats */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Document Pipeline
            </p>
            <div className="flex flex-col gap-2">
              {(["draft", "pending_review", "approved", "submitted", "stale"] as const).map((s) => {
                const count = docStatusCounts[s] ?? 0;
                return (
                  <div key={s} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-block h-2 w-2 rounded-full", STATUS_STYLES[s].dot)} />
                      <span className="text-xs text-slate-600">{STATUS_STYLES[s].label}</span>
                    </div>
                    <span className={cn(
                      "text-sm font-semibold",
                      count === 0 ? "text-slate-300" : s === "stale" ? "text-red-600" : "text-slate-700"
                    )}>
                      {count}
                    </span>
                  </div>
                );
              })}
              <Separator className="my-1" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total</span>
                <span className="text-sm font-bold text-slate-900">{orgDocs.length}</span>
              </div>
            </div>
            {org.notes && (
              <>
                <Separator className="my-3" />
                <p className="text-xs text-slate-500 italic">{org.notes}</p>
              </>
            )}
          </div>
        </div>

        {/* Document pipeline table */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Document Pipeline</h2>
            </div>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setNewDocOpen(true)}>
              Generate New Document
            </Button>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            {orgDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-sm text-slate-400">
                No documents generated yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Document</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[155px]">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[200px]">Modules</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[70px]">Ver.</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[120px]">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgDocs.map((doc) => (
                    <TableRow
                      key={doc.id}
                      className={cn(
                        "cursor-pointer",
                        doc.status === "stale"
                          ? "bg-red-50/40 hover:bg-red-50/70"
                          : "hover:bg-slate-50"
                      )}
                      onClick={() => router.push(`/documents/${doc.id}`)}
                    >
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-slate-800">{doc.docTypeName}</span>
                          {doc.status === "stale" && doc.staleFactKey && (
                            <span className="text-[10px] font-mono text-red-500">
                              ⚠ {doc.staleFactKey} changed {doc.staleFactChangedAt}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <DocumentStatusBadge status={doc.status} />
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex gap-1 flex-wrap">
                          {doc.activeModules.map((m) => <ModuleChip key={m} module={m} />)}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm text-slate-500">v{doc.version}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-xs text-slate-400">{doc.updatedAt}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Org-instance fact overrides */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-900">Org-Instance Fact Overrides</h2>
            </div>
            <Button size="sm" variant="outline" className="text-xs">
              Add Override
            </Button>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            {orgFactOverrides.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-sm text-slate-400">
                No org-instance overrides. Global and module facts apply.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Key</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Override Value</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[110px]">Domain</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[120px]">Modified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgFactOverrides.map((fact) => (
                    <TableRow key={fact.id} className="hover:bg-slate-50">
                      <TableCell className="py-3">
                        <code className="rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 font-mono text-xs text-amber-700">
                          {fact.key}
                        </code>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm text-slate-700">{fact.value}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <DomainBadge domain={fact.domain} />
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-xs text-slate-400">{fact.modifiedAt}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
      <NewDocumentDialog
        open={newDocOpen}
        onClose={() => setNewDocOpen(false)}
        onCreated={() => setNewDocOpen(false)}
      />
    </div>
  );
}
