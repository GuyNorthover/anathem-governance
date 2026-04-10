"use client";

import { useState, useEffect } from "react";
import { Wand2, Check, X, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase/client";
import type { DocumentInstance } from "@/lib/documents/types";

interface Prompt {
  id: string;
  prompt_key: string;
  display_name: string;
  target_section: string;
  purpose: string;
}

interface GeneratePanelProps {
  doc: DocumentInstance | null;
  open: boolean;
  onClose: () => void;
  onApproved?: () => void;
}

export function GeneratePanel({ doc, open, onClose, onApproved }: GeneratePanelProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState("");
  const [sectionName, setSectionName] = useState("Generated Section");
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState("");
  const [editedOutput, setEditedOutput] = useState("");
  const [editing, setEditing] = useState(false);
  const [promptVersionNumber, setPromptVersionNumber] = useState<number | null>(null);
  const [resolvedFacts, setResolvedFacts] = useState<Record<string, string>>({});
  const [interpolatedPrompt, setInterpolatedPrompt] = useState("");
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"output" | "prompt" | "facts">("output");

  // Load approved prompts when panel opens
  useEffect(() => {
    if (!open) return;
    supabase
      .from("prompts")
      .select("id, prompt_key, display_name, target_section, purpose")
      .eq("status", "approved")
      .order("display_name")
      .then(({ data }) => setPrompts(data ?? []));
  }, [open]);

  // Reset state when panel closes
  useEffect(() => {
    if (!open) {
      setOutput("");
      setEditedOutput("");
      setError("");
      setApproved(false);
      setEditing(false);
      setSelectedPromptId("");
      setPromptVersionNumber(null);
      setResolvedFacts({});
      setInterpolatedPrompt("");
    }
  }, [open]);

  const handleGenerate = async () => {
    if (!doc || !selectedPromptId) return;
    setGenerating(true);
    setOutput("");
    setError("");
    setApproved(false);
    setEditing(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentInstanceId: doc.id,
          promptId: selectedPromptId,
          orgId: doc.orgId,
          sectionName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      setOutput(data.output);
      setEditedOutput(data.output);
      setPromptVersionNumber(data.promptVersionNumber);
      setResolvedFacts(data.resolvedFacts ?? {});
      setInterpolatedPrompt(data.interpolatedPrompt ?? "");
      setActiveTab("output");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!doc) return;
    setApproving(true);
    try {
      const now = new Date().toISOString();
      const finalContent = editing ? editedOutput : output;
      const usedFactKeys = Object.keys(resolvedFacts).filter(
        (k) => !k.startsWith("organisation.")
      );

      // Find the next order_index for this document
      const { data: existingSections } = await supabase
        .from("document_sections")
        .select("order_index")
        .eq("document_instance_id", doc.id)
        .order("order_index", { ascending: false })
        .limit(1);

      const nextIndex = existingSections && existingSections.length > 0
        ? (existingSections[0].order_index ?? 0) + 1
        : 0;

      // 1. Save the section
      await supabase.from("document_sections").insert({
        document_instance_id: doc.id,
        title: sectionName,
        content: finalContent,
        prompt_id: selectedPromptId || null,
        prompt_version_number: promptVersionNumber,
        fact_keys_used: usedFactKeys,
        status: "approved",
        generated_at: now,
        approved_at: now,
        approved_by: "Anathem User",
        order_index: nextIndex,
      });

      // 2. Move document to pending_review
      await supabase
        .from("document_instances")
        .update({ status: "pending_review", updated_at: now })
        .eq("id", doc.id);

      // 3. Audit log
      await supabase.from("audit_log").insert({
        id: crypto.randomUUID(),
        event_type: "document.section_approved",
        actor_id: null,
        payload: {
          category: "document",
          summary: `Section "${sectionName}" approved — document moved to pending review`,
          document_instance_id: doc.id,
          section: sectionName,
          org_id: doc.orgId,
          prompt_id: selectedPromptId,
          prompt_version: promptVersionNumber,
          fact_keys: usedFactKeys,
        },
        created_at: now,
      });

      setApproved(true);
      onApproved?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApproving(false);
    }
  };

  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId);
  const displayOutput = editing ? editedOutput : output;
  const docTitle = (doc as any)?.title ?? (doc as any)?.docTypeName ?? "Document";
  const orgName = (doc as any)?.orgName ?? "";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[640px] sm:max-w-[640px] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-violet-600" />
            <SheetTitle className="text-base font-semibold">Generate Section</SheetTitle>
          </div>
          {doc && (
            <p className="text-xs text-slate-500 mt-0.5">
              {docTitle}
              {orgName && (
                <> · <span className="font-medium text-slate-700">{orgName}</span></>
              )}
            </p>
          )}
        </SheetHeader>

        <div className="flex flex-col gap-4 px-6 py-5 flex-1 overflow-y-auto">

          {/* Prompt selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Prompt
            </label>
            <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
              <SelectTrigger className="text-sm h-9">
                <SelectValue placeholder="Select an approved prompt…" />
              </SelectTrigger>
              <SelectContent>
                {prompts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex flex-col py-0.5">
                      <span className="text-sm">{p.display_name}</span>
                      <span className="text-[10px] text-slate-400">{p.target_section}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPrompt && (
              <p className="text-[11px] text-slate-400 leading-snug">{selectedPrompt.purpose}</p>
            )}
          </div>

          {/* Section name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Section name
            </label>
            <input
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={!selectedPromptId || generating || !doc?.orgId}
            className="bg-violet-600 hover:bg-violet-700 text-white w-full h-9"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating with Claude…
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate with Claude
              </>
            )}
          </Button>

          {/* Error */}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Output area */}
          {(output || generating) && (
            <div className="flex flex-col gap-3">
              {/* Tabs + version badge */}
              <div className="flex items-center justify-between">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  <TabsList className="h-7 text-xs">
                    <TabsTrigger value="output" className="text-xs px-3">Output</TabsTrigger>
                    <TabsTrigger value="prompt" className="text-xs px-3">Prompt sent</TabsTrigger>
                    <TabsTrigger value="facts" className="text-xs px-3">Facts used</TabsTrigger>
                  </TabsList>
                </Tabs>
                {promptVersionNumber && (
                  <Badge variant="outline" className="text-[10px] text-slate-500 font-mono">
                    prompt v{promptVersionNumber}
                  </Badge>
                )}
              </div>

              {/* Output tab */}
              {activeTab === "output" && (
                <>
                  {generating ? (
                    <div className="flex min-h-[220px] items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating…
                    </div>
                  ) : editing ? (
                    <Textarea
                      value={editedOutput}
                      onChange={(e) => setEditedOutput(e.target.value)}
                      className="min-h-[220px] resize-none font-mono text-sm"
                    />
                  ) : (
                    <div className="min-h-[220px] rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {output}
                    </div>
                  )}
                </>
              )}

              {/* Prompt sent tab */}
              {activeTab === "prompt" && (
                <div className="min-h-[220px] rounded-md border border-slate-200 bg-slate-950 p-4 text-xs font-mono text-slate-300 whitespace-pre-wrap overflow-y-auto">
                  {interpolatedPrompt}
                </div>
              )}

              {/* Facts used tab */}
              {activeTab === "facts" && (
                <div className="rounded-md border border-slate-200 bg-white overflow-hidden min-h-[220px]">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Fact key</th>
                        <th className="text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wide text-[10px]">Resolved value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(resolvedFacts)
                        .filter(([k]) => !k.startsWith("organisation."))
                        .map(([key, value]) => (
                          <tr key={key} className="border-b border-slate-100 last:border-0">
                            <td className="px-3 py-2 font-mono text-violet-700 whitespace-nowrap">{key}</td>
                            <td className="px-3 py-2 text-slate-600 max-w-[260px]">
                              <span className="line-clamp-2">{value}</span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Action buttons */}
              {!generating && output && !approved && activeTab === "output" && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setEditing((e) => !e)}
                  >
                    {editing ? "Preview" : "Edit output"}
                  </Button>
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => { setOutput(""); setError(""); setEditing(false); }}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white text-xs"
                      onClick={handleApprove}
                      disabled={approving}
                    >
                      {approving
                        ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        : <Check className="h-3 w-3 mr-1" />
                      }
                      Approve section
                    </Button>
                  </div>
                </div>
              )}

              {/* Approved confirmation */}
              {approved && (
                <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">
                  <Check className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Section approved. Document moved to <strong>Pending Review</strong>.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
