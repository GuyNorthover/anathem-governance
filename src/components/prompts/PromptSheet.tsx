"use client";

import { useState } from "react";
import {
  CheckCircle2, XCircle, Clock, Link2, Wand2,
  ChevronDown, ChevronUp, AlertTriangle, Pencil,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromptStatusBadge } from "./PromptStatusBadge";
import { CategoryBadge } from "./CategoryBadge";
import type { Prompt, PromptVersion } from "@/lib/prompts/types";
import { cn } from "@/lib/utils";

// ── Fact placeholder highlighter ─────────────────────────────────────────

function HighlightedPromptText({ text }: { text: string }) {
  const parts = text.split(/({{[^}]+}})/g);
  return (
    <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-700">
      {parts.map((part, i) => {
        if (/^{{[^}]+}}$/.test(part)) {
          const key = part.slice(2, -2);
          return (
            <span
              key={i}
              className="inline-flex items-center rounded bg-blue-100 px-1 py-0.5 font-mono text-[11px] font-semibold text-blue-700 border border-blue-200"
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </pre>
  );
}

// ── Version history item ─────────────────────────────────────────────────

function VersionItem({ version, isCurrent }: { version: PromptVersion; isCurrent: boolean }) {
  const [expanded, setExpanded] = useState(isCurrent);

  return (
    <div className="flex gap-3">
      {/* Timeline */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={cn(
          "mt-1 h-2.5 w-2.5 rounded-full border-2",
          isCurrent ? "border-blue-500 bg-blue-500" : "border-slate-300 bg-white"
        )} />
        <div className="w-px flex-1 bg-slate-200 my-1" />
      </div>

      {/* Content */}
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-slate-700">v{version.versionNumber}</span>
          <span className="text-xs text-slate-400">{version.createdAt} · {version.createdBy}</span>
          {isCurrent && (
            <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
              current
            </span>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="ml-auto text-slate-400 hover:text-slate-600"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
        <p className="text-xs text-slate-500 italic mb-2">{version.changeNotes}</p>
        {expanded && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 overflow-x-auto">
            <HighlightedPromptText text={version.promptText} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Approval / Rejection panel ───────────────────────────────────────────

function ApprovalPanel({
  prompt,
  onApprove,
  onReject,
}: {
  prompt: Prompt;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  if (prompt.status === "approved") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-700">Approved</p>
          <p className="text-xs text-slate-500">
            Approved by {prompt.approvedBy} on {prompt.approvedAt} · v{prompt.currentVersion}
          </p>
        </div>
        <Button size="sm" variant="outline" className="ml-auto text-xs gap-1.5">
          <Pencil className="h-3 w-3" />
          Create New Version
        </Button>
      </div>
    );
  }

  if (prompt.status === "rejected") {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Rejected</p>
            <p className="text-xs text-slate-500">
              Rejected by {prompt.rejectedBy} on {prompt.rejectedAt}
            </p>
          </div>
        </div>
        {prompt.rejectionReason && (
          <p className="text-xs text-red-700 bg-red-100 rounded px-3 py-2 leading-relaxed">
            {prompt.rejectionReason}
          </p>
        )}
      </div>
    );
  }

  // suggested
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Requires review before use</p>
          <p className="text-xs text-amber-700">
            This prompt was auto-suggested and cannot be used for document generation until approved.
            Review the prompt text carefully before approving.
          </p>
        </div>
      </div>

      {!showRejectForm ? (
        <div className="flex gap-2">
          <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700" onClick={onApprove}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => setShowRejectForm(true)}>
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-amber-800">
            Rejection reason <span className="text-red-500">*</span>
          </Label>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain why this prompt is not fit for use…"
            rows={3}
            className="text-sm resize-none bg-white"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-200 gap-1.5"
              disabled={!rejectionReason.trim()}
              onClick={() => onReject(rejectionReason)}
            >
              <XCircle className="h-3.5 w-3.5" />
              Confirm rejection
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowRejectForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root Sheet ────────────────────────────────────────────────────────────

interface PromptSheetProps {
  prompt: Prompt | null;
  onClose: () => void;
}

export function PromptSheet({ prompt, onClose }: PromptSheetProps) {
  const [localStatus, setLocalStatus] = useState<"approved" | "rejected" | null>(null);

  const effectiveStatus = localStatus ?? prompt?.status;

  const currentVersion = prompt?.versions.find(
    (v) => v.versionNumber === prompt.currentVersion
  );

  return (
    <Sheet open={!!prompt} onOpenChange={(open) => { if (!open) { onClose(); setLocalStatus(null); } }}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto flex flex-col gap-0 p-0">
        {prompt && (
          <>
            {/* Header */}
            <div className="border-b border-slate-100 px-6 py-5">
              <SheetHeader className="mb-3">
                <SheetTitle className="text-base font-semibold text-slate-900 text-left">
                  {prompt.displayName}
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-wrap gap-2 items-center">
                <PromptStatusBadge status={effectiveStatus as typeof prompt.status} />
                <CategoryBadge category={prompt.category} />
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                  {prompt.outputFormat}
                </span>
                <span className="text-[11px] text-slate-400">v{prompt.currentVersion}</span>
              </div>
              <code className="mt-2 block font-mono text-[11px] text-slate-400">{prompt.promptKey}</code>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="prompt" className="flex flex-col h-full">
                <div className="border-b border-slate-100 px-6">
                  <TabsList className="h-10 bg-transparent gap-4 p-0 rounded-none">
                    {["prompt", "facts", "versions"].map((tab) => (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className="rounded-none border-b-2 border-transparent px-0 pb-2 pt-2 text-xs font-medium capitalize
                          data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:shadow-none
                          text-slate-500 hover:text-slate-700 bg-transparent"
                      >
                        {tab === "facts" ? "Fact Dependencies" : tab === "versions" ? "Version History" : "Prompt Text"}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* ── Tab: Prompt Text ── */}
                <TabsContent value="prompt" className="flex flex-col gap-5 px-6 py-5 mt-0">
                  {/* Purpose */}
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Purpose</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{prompt.purpose}</p>
                  </div>

                  <Separator />

                  {/* Target section */}
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Target Section</p>
                      <p className="text-sm text-slate-700">{prompt.targetSection}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Created by</p>
                      <p className="text-sm text-slate-700">{prompt.createdBy}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Last updated</p>
                      <p className="text-sm text-slate-700">{prompt.updatedAt}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Current prompt text */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Current Prompt Text — v{prompt.currentVersion}
                      </p>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span className="inline-block h-2.5 w-2.5 rounded bg-blue-100 border border-blue-200" />
                        <code className="font-mono">{"{{fact}}"}</code> = injected fact
                      </span>
                    </div>
                    {currentVersion && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 overflow-x-auto max-h-80 overflow-y-auto">
                        <HighlightedPromptText text={currentVersion.promptText} />
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Approval panel */}
                  <ApprovalPanel
                    prompt={{ ...prompt, status: effectiveStatus as typeof prompt.status }}
                    onApprove={() => setLocalStatus("approved")}
                    onReject={() => setLocalStatus("rejected")}
                  />
                </TabsContent>

                {/* ── Tab: Fact Dependencies ── */}
                <TabsContent value="facts" className="px-6 py-5 mt-0">
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Input Fact Keys</p>
                      <p className="text-xs text-slate-500">
                        These facts are resolved for the target organisation before generation using the three-tier hierarchy
                        (org-instance → module → global).
                      </p>
                    </div>

                    {prompt.inputFactKeys.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">
                        This prompt takes no fact inputs (e.g. document extraction prompts receive raw text instead).
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {prompt.inputFactKeys.map((key) => (
                          <div key={key} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                            <Link2 className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                            <code className="font-mono text-xs text-slate-700 flex-1">{key}</code>
                            <span className="inline-flex items-center rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 font-mono text-[11px] text-blue-700">
                              {"{{" + key + "}}"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <Separator />

                    <div className="rounded-lg border border-slate-200 bg-amber-50/50 px-4 py-3">
                      <p className="text-xs font-semibold text-slate-600 mb-1">Fact resolution order</p>
                      <ol className="text-xs text-slate-500 space-y-0.5 list-decimal list-inside">
                        <li><span className="font-medium text-amber-700">Org-instance override</span> — trust-specific value (highest priority)</li>
                        <li><span className="font-medium text-blue-700">Module fact</span> — if the module is active for this org</li>
                        <li><span className="font-medium text-slate-600">Global fact</span> — platform-wide default</li>
                      </ol>
                    </div>
                  </div>
                </TabsContent>

                {/* ── Tab: Version History ── */}
                <TabsContent value="versions" className="px-6 py-5 mt-0">
                  <div className="flex flex-col gap-1">
                    <p className="mb-3 text-xs text-slate-500">
                      All versions are retained permanently. Documents record which version was used to generate each section.
                    </p>
                    {[...prompt.versions]
                      .sort((a, b) => b.versionNumber - a.versionNumber)
                      .map((v) => (
                        <VersionItem
                          key={v.id}
                          version={v}
                          isCurrent={v.versionNumber === prompt.currentVersion}
                        />
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
