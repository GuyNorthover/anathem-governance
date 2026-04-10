"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { Search, Plus, MoreHorizontal, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { ModuleChip } from "./ModuleChip";
import { GeneratePanel } from "./GeneratePanel";
import { NewDocumentDialog } from "./NewDocumentDialog";
import { useDocuments } from "@/resources/hooks/use-documents";
import { CATEGORY_LABELS, CATEGORY_STYLES, STATUS_STYLES } from "@/lib/documents/types";
import type { DocumentStatus, DocumentInstance } from "@/lib/documents/types";
import { cn } from "@/lib/utils";

function StatusStat({ status, count }: { status: DocumentStatus; count: number }) {
  const s = STATUS_STYLES[status];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <span className={cn("inline-block h-2 w-2 rounded-full", s.dot)} />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
        <p className="text-xl font-bold text-slate-900">{count}</p>
      </div>
    </div>
  );
}


export function DocumentsView() {
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "all">("all");
  const [docTypeFilter, setDocTypeFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");
  const [generateDoc, setGenerateDoc] = useState<DocumentInstance | null>(null);
  const [newDocOpen, setNewDocOpen] = useState(false);

  const { data: docs, reload, updateDocumentStatus } = useDocuments();

  const docTypeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    docs.forEach((d) => { if (d.docTypeId) seen.set(d.docTypeId, d.docTypeName); });
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [docs]);

  const orgOptions = useMemo(() => {
    const seen = new Map<string, string>();
    docs.forEach((d) => { if (d.orgId) seen.set(d.orgId, d.orgName); });
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [docs]);

  const statusCounts = useMemo(() => ({
    draft: docs.filter((d) => d.status === "draft").length,
    pending_review: docs.filter((d) => d.status === "pending_review").length,
    approved: docs.filter((d) => d.status === "approved").length,
    submitted: docs.filter((d) => d.status === "submitted").length,
    stale: docs.filter((d) => d.status === "stale").length,
  }), [docs]);

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (docTypeFilter !== "all" && d.docTypeId !== docTypeFilter) return false;
      if (orgFilter !== "all" && d.orgId !== orgFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!d.docTypeName.toLowerCase().includes(q) && !d.orgName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [docs, statusFilter, docTypeFilter, orgFilter, search]);

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Documents</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Compliance document registry — all NHS trust and regulatory documents
          </p>
        </div>
        <Button size="sm" onClick={() => setNewDocOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Document
        </Button>
      </div>

      {/* Status stats */}
      <div className="grid grid-cols-5 gap-3">
        {(["draft", "pending_review", "approved", "submitted", "stale"] as DocumentStatus[]).map((s) => (
          <button key={s} onClick={() => startTransition(() => setStatusFilter(s === statusFilter ? "all" : s))} className="text-left">
            <StatusStat status={s} count={statusCounts[s]} />
          </button>
        ))}
      </div>

      {/* Stale warning banner */}
      {statusCounts.stale > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{statusCounts.stale} documents are stale</span> — underlying facts have changed.
            These documents cannot be submitted until reviewed and regenerated or manually confirmed.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="pl-8 text-sm h-9"
          />
        </div>

        <Tabs value={statusFilter} onValueChange={(v) => startTransition(() => setStatusFilter(v as DocumentStatus | "all"))}>
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
            <TabsTrigger value="draft" className="text-xs px-3">Draft</TabsTrigger>
            <TabsTrigger value="pending_review" className="text-xs px-3">Pending</TabsTrigger>
            <TabsTrigger value="approved" className="text-xs px-3">Approved</TabsTrigger>
            <TabsTrigger value="submitted" className="text-xs px-3">Submitted</TabsTrigger>
            <TabsTrigger value="stale" className="text-xs px-3 text-red-600 data-[state=active]:text-red-700">Stale</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={docTypeFilter} onValueChange={setDocTypeFilter}>
          <SelectTrigger className="h-9 w-[180px] text-sm">
            <SelectValue placeholder="All doc types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All doc types</SelectItem>
            {docTypeOptions.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger className="h-9 w-[200px] text-sm">
            <SelectValue placeholder="All organisations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All organisations</SelectItem>
            {orgOptions.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filtered.length !== docs.length && (
          <span className="text-xs text-slate-500">{filtered.length} of {docs.length}</span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Document</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[220px]">Organisation</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[155px]">Status</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[200px]">Modules</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[60px]">Ver.</TableHead>
              <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[110px]">Updated</TableHead>
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-400">
                  No documents match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((doc) => (

                <TableRow
                  key={doc.id}
                  className={cn(
                    "cursor-pointer",
                    doc.status === "stale"
                      ? "bg-red-50/40 hover:bg-red-50/70"
                      : "hover:bg-slate-50"
                  )}
                >
                  {/* Document type */}
                  <TableCell className="py-3">
                    <Link href={`/documents/${doc.id}`} className="flex flex-col gap-1 group">
                      <span className="text-sm font-medium text-slate-800 group-hover:underline">{doc.docTypeName}</span>
                      <span
                        className={cn(
                          "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          CATEGORY_STYLES[doc.docTypeCategory]
                        )}
                      >
                        {CATEGORY_LABELS[doc.docTypeCategory]}
                      </span>
                    </Link>
                  </TableCell>

                  {/* Organisation */}
                  <TableCell className="py-3">
                    <span className="text-sm text-slate-700">{doc.orgName}</span>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3">
                    <div className="flex flex-col gap-1">
                      <DocumentStatusBadge status={doc.status} />
                      {doc.status === "stale" && doc.staleFactKey && (
                        <span className="text-[10px] text-red-500 font-mono">{doc.staleFactKey}</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Modules */}
                  <TableCell className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {doc.activeModules.map((m) => (
                        <ModuleChip key={m} module={m} />
                      ))}
                    </div>
                  </TableCell>

                  {/* Version */}
                  <TableCell className="py-3">
                    <span className="text-sm text-slate-500">v{doc.version}</span>
                  </TableCell>

                  {/* Updated */}
                  <TableCell className="py-3">
                    <span className="text-xs text-slate-400">{doc.updatedAt}</span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-sm">
                        <DropdownMenuItem asChild>
                          <Link href={`/documents/${doc.id}`}>View document</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setGenerateDoc(doc)}>
                          Generate section
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {doc.status === "approved" && (
                          <DropdownMenuItem
                            onClick={async () => {
                              const now = new Date().toISOString();
                              await updateDocumentStatus(doc.id, "submitted");
                              await import("@/lib/supabase/client").then(({ supabase }) =>
                                supabase.from("audit_log").insert({
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
                                })
                              );
                            }}
                            className="text-blue-600"
                          >
                            Submit to trust
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <GeneratePanel
        doc={generateDoc}
        open={!!generateDoc}
        onClose={() => setGenerateDoc(null)}
        onApproved={() => { setGenerateDoc(null); reload(); }}
      />

      <NewDocumentDialog
        open={newDocOpen}
        onClose={() => setNewDocOpen(false)}
        onCreated={() => { setNewDocOpen(false); reload(); }}
      />
    </div>
  );
}
