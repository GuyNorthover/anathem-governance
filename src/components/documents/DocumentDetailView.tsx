"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  ChevronRight,
  Clock,
  Loader2,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { ModuleChip } from "./ModuleChip";
import { GeneratePanel } from "./GeneratePanel";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import type { DocumentInstance, DocumentSection } from "@/lib/documents/types";
import { CATEGORY_LABELS, CATEGORY_STYLES } from "@/lib/documents/types";

interface DocumentDetailViewProps {
  doc: DocumentInstance;
  onReload: () => void;
  onUpdateStatus: (status: string) => Promise<void>;
  onApproveSection: (sectionId: string) => Promise<void>;
}

export function DocumentDetailView({
  doc,
  onReload,
  onUpdateStatus,
  onApproveSection,
}: DocumentDetailViewProps) {
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    doc.sections[0]?.id ?? ""
  );
  const [generateOpen, setGenerateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedSection = doc.sections.find((s) => s.id === selectedSectionId)
    ?? (doc.sections.length > 0 ? doc.sections[0] : null);

  const isSectionApproved = (s: DocumentSection) => s.status === "approved";
  const approvedCount = doc.sections.filter(isSectionApproved).length;
  const totalSections = doc.sections.length;

  const handleSubmit = async () => {
    if (doc.status !== "approved") return;
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      await onUpdateStatus("submitted");
      await supabase.from("audit_log").insert({
        id: crypto.randomUUID(),
        event_type: "document.submitted",
        actor_id: null,
        payload: {
          category: "document",
          summary: `Document submitted to trust — ${doc.docTypeName} for ${doc.orgName}`,
          document_instance_id: doc.id,
          org_id: doc.orgId,
        },
        created_at: now,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top header */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white px-8 py-4">
        <div className="flex items-start justify-between gap-4">
          {/* Back + title */}
          <div className="flex flex-col gap-2">
            <Link
              href="/documents"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors w-fit"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Documents
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-semibold text-slate-900">{doc.docTypeName}</h1>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  CATEGORY_STYLES[doc.docTypeCategory]
                )}
              >
                {CATEGORY_LABELS[doc.docTypeCategory]}
              </span>
              <DocumentStatusBadge status={doc.status} />
              <span className="text-xs text-slate-400">v{doc.version}</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-slate-600">{doc.orgName}</span>
              {doc.activeModules.length > 0 && (
                <>
                  <span className="text-slate-300">·</span>
                  <div className="flex gap-1">
                    {doc.activeModules.map((m) => <ModuleChip key={m} module={m} />)}
                  </div>
                </>
              )}
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-400">Updated {doc.updatedAt}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setGenerateOpen(true)}
            >
              <Wand2 className="h-3.5 w-3.5" />
              Generate section
            </Button>
            {doc.status === "approved" && (
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Send className="h-3.5 w-3.5" />
                }
                Submit to Trust
              </Button>
            )}
          </div>
        </div>

        {/* Stale banner */}
        {doc.status === "stale" && doc.staleFactKey && (
          <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-700">
              <span className="font-semibold">This document is stale.</span>{" "}
              The fact{" "}
              <code className="rounded bg-red-100 px-1 font-mono text-xs">{doc.staleFactKey}</code>{" "}
              was updated. Sections dependent on this fact must be reviewed and regenerated before
              this document can be submitted.
            </p>
          </div>
        )}

        {/* Section progress bar */}
        {totalSections > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-green-500 transition-all"
                style={{ width: `${(approvedCount / totalSections) * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-500 flex-shrink-0">
              {approvedCount}/{totalSections} sections approved
            </span>
          </div>
        )}
      </div>

      {/* Body: sections nav + content */}
      {doc.sections.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-sm text-slate-400">
          <p>No sections generated yet.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGenerateOpen(true)}
            className="gap-1.5"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Generate first section
          </Button>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Section list */}
          <aside className="w-60 flex-shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50">
            <div className="px-3 py-3">
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Sections
              </p>
              <ul className="space-y-0.5">
                {doc.sections.map((section, i) => {
                  const approved = isSectionApproved(section);
                  const isSelected = section.id === selectedSection?.id;
                  return (
                    <li key={section.id}>
                      <button
                        onClick={() => setSelectedSectionId(section.id)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                          isSelected
                            ? "bg-white shadow-sm text-slate-900"
                            : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
                        )}
                      >
                        {approved ? (
                          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                        ) : (
                          <div className="h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-slate-300" />
                        )}
                        <span className="text-xs font-medium leading-tight flex-1 min-w-0">
                          <span className="text-slate-400 mr-1">{i + 1}.</span>
                          {section.title}
                        </span>
                        {isSelected && <ChevronRight className="h-3 w-3 flex-shrink-0 text-slate-400" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          {/* Section content */}
          <main className="flex-1 overflow-y-auto bg-white">
            {selectedSection ? (
              <SectionContent
                section={selectedSection}
                isApproved={isSectionApproved(selectedSection)}
                onApprove={() => onApproveSection(selectedSection.id)}
                isStaleDoc={doc.status === "stale"}
                staleFactKey={doc.staleFactKey}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Select a section to view its content.
              </div>
            )}
          </main>
        </div>
      )}

      {/* Generate Panel */}
      <GeneratePanel
        doc={doc}
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onApproved={() => { setGenerateOpen(false); onReload(); }}
      />
    </div>
  );
}

// ── Section Content ────────────────────────────────────────────────────────

interface SectionContentProps {
  section: DocumentSection;
  isApproved: boolean;
  onApprove: () => void;
  isStaleDoc: boolean;
  staleFactKey?: string;
}

function SectionContent({
  section,
  isApproved,
  onApprove,
  isStaleDoc,
  staleFactKey,
}: SectionContentProps) {
  const [approving, setApproving] = useState(false);
  const sectionUsesStale =
    isStaleDoc && staleFactKey && section.factKeys.includes(staleFactKey);

  const handleApprove = async () => {
    setApproving(true);
    await onApprove();
    setApproving(false);
  };

  return (
    <div className="flex flex-col gap-6 p-8 max-w-3xl">
      {/* Section header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
        {section.factKeys.length > 0 && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {section.factKeys.map((key) => (
              <code
                key={key}
                className={cn(
                  "rounded border px-1.5 py-0.5 font-mono text-[11px]",
                  isStaleDoc && key === staleFactKey
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                )}
              >
                {key}
                {isStaleDoc && key === staleFactKey && (
                  <span className="ml-1 text-red-500">⚠</span>
                )}
              </code>
            ))}
          </div>
        )}
      </div>

      {/* Stale section warning */}
      {sectionUsesStale && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-700">
            This section uses{" "}
            <code className="rounded bg-red-100 px-1 font-mono text-xs">{staleFactKey}</code>,
            which has changed. Regenerate this section before approving.
          </p>
        </div>
      )}

      <Separator />

      {/* Generated content */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Generated Content
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            {section.generatedAt}
            {section.generatedBy && ` · ${section.generatedBy}`}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {section.generatedContent}
          </p>
        </div>
      </div>

      <Separator />

      {/* Approval state */}
      <div className="flex items-center justify-between rounded-lg border px-5 py-4 border-slate-200 bg-white">
        {isApproved ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-semibold text-green-700">Section Approved</p>
              {section.approvedBy && section.approvedAt ? (
                <p className="text-xs text-slate-400">
                  Approved by {section.approvedBy} on {section.approvedAt}
                </p>
              ) : (
                <p className="text-xs text-slate-400">Approved</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div>
              <p className="text-sm font-medium text-slate-700">Awaiting approval</p>
              <p className="text-xs text-slate-400">
                Review the generated content above before approving.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={!!sectionUsesStale || approving}
              className="gap-1.5"
            >
              {approving
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <CheckCircle2 className="h-3.5 w-3.5" />
              }
              Approve Section
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
