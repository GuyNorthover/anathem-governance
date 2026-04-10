"use client";

import { useState, useMemo } from "react";
import { Search, Plus, MoreHorizontal, Wand2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PromptStatusBadge } from "./PromptStatusBadge";
import { CategoryBadge } from "./CategoryBadge";
import { PromptSheet } from "./PromptSheet";
import { usePrompts } from "@/resources/hooks/use-prompts";
import { CATEGORY_META, STATUS_META } from "@/lib/prompts/types";
import type { Prompt, PromptStatus, PromptCategory } from "@/lib/prompts/types";
import { cn } from "@/lib/utils";

const OUTPUT_FORMAT_LABELS: Record<string, string> = {
  prose: "Prose", structured: "Structured", table: "Table", list: "List",
};

export function PromptLibraryView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PromptStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<PromptCategory | "all">("all");
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  const { data: prompts } = usePrompts();

  const counts = useMemo(() => ({
    all: prompts.length,
    approved: prompts.filter((p) => p.status === "approved").length,
    suggested: prompts.filter((p) => p.status === "suggested").length,
    rejected: prompts.filter((p) => p.status === "rejected").length,
  }), [prompts]);

  const filtered = useMemo(() => prompts.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!p.displayName.toLowerCase().includes(q) &&
          !p.promptKey.toLowerCase().includes(q) &&
          !p.purpose.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [prompts, statusFilter, categoryFilter, search]);

  return (
    <>
      <div className="flex flex-col gap-6 p-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Prompt Library</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Versioned regulatory prompts — only approved prompts may be used in document generation
            </p>
          </div>
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Prompt
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {([
            { key: "all",       label: "Total Prompts",   accent: "text-slate-900" },
            { key: "approved",  label: "Approved",        accent: "text-green-600" },
            { key: "suggested", label: "Pending Review",  accent: "text-amber-600" },
            { key: "rejected",  label: "Rejected",        accent: "text-red-600"   },
          ] as const).map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key === "all" ? "all" : s.key as PromptStatus)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-left hover:border-slate-300 transition-colors"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
              <p className={cn("mt-0.5 text-2xl font-bold", s.accent)}>{counts[s.key]}</p>
            </button>
          ))}
        </div>

        {/* Pending review notice */}
        {counts.suggested > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{counts.suggested} prompt{counts.suggested > 1 ? "s" : ""} pending review</span>
              {" "}— these prompts were auto-suggested by Claude and cannot be used in document generation until approved.
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
              placeholder="Search prompts…"
              className="pl-8 h-9 text-sm"
            />
          </div>

          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as PromptStatus | "all")}>
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
              <TabsTrigger value="approved" className="text-xs px-3">Approved</TabsTrigger>
              <TabsTrigger value="suggested" className="text-xs px-3 data-[state=active]:text-amber-700">Pending</TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs px-3 data-[state=active]:text-red-700">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as PromptCategory | "all")}>
            <SelectTrigger className="h-9 w-[200px] text-sm">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {(Object.keys(CATEGORY_META) as PromptCategory[]).map((c) => (
                <SelectItem key={c} value={c}>{CATEGORY_META[c].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {filtered.length !== prompts.length && (
            <span className="text-xs text-slate-500">{filtered.length} of {prompts.length}</span>
          )}
        </div>

        {/* Table */}
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Prompt</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[160px]">Category</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[150px]">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[80px]">Format</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[60px]">Ver.</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[120px]">Updated</TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-400">
                    No prompts match the current filters.
                  </TableCell>
                </TableRow>
              ) : filtered.map((prompt) => (
                <TableRow
                  key={prompt.id}
                  className={cn(
                    "cursor-pointer",
                    prompt.status === "suggested" ? "bg-amber-50/30 hover:bg-amber-50/60" :
                    prompt.status === "rejected"  ? "bg-slate-50/60 opacity-70 hover:opacity-100" :
                    "hover:bg-slate-50"
                  )}
                  onClick={() => setSelectedPrompt(prompt)}
                >
                  {/* Name + key + purpose */}
                  <TableCell className="py-3">
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md",
                        prompt.status === "suggested" ? "bg-amber-100" :
                        prompt.status === "rejected"  ? "bg-slate-100" : "bg-blue-50"
                      )}>
                        <Wand2 className={cn(
                          "h-3.5 w-3.5",
                          prompt.status === "suggested" ? "text-amber-600" :
                          prompt.status === "rejected"  ? "text-slate-400" : "text-blue-600"
                        )} />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-medium text-slate-800">{prompt.displayName}</span>
                        <code className="text-[10px] text-slate-400 font-mono">{prompt.promptKey}</code>
                        <span className="text-xs text-slate-500 line-clamp-1">{prompt.purpose}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Category */}
                  <TableCell className="py-3">
                    <CategoryBadge category={prompt.category} />
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3">
                    <div className="flex flex-col gap-1">
                      <PromptStatusBadge status={prompt.status} />
                      {prompt.status === "approved" && prompt.approvedBy && (
                        <span className="text-[10px] text-slate-400">{prompt.approvedBy}</span>
                      )}
                      {prompt.status === "rejected" && prompt.rejectedBy && (
                        <span className="text-[10px] text-red-400">{prompt.rejectedBy}</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Output format */}
                  <TableCell className="py-3">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                      {OUTPUT_FORMAT_LABELS[prompt.outputFormat]}
                    </span>
                  </TableCell>

                  {/* Version */}
                  <TableCell className="py-3">
                    <span className="text-sm text-slate-500">v{prompt.currentVersion}</span>
                  </TableCell>

                  {/* Updated */}
                  <TableCell className="py-3">
                    <span className="text-xs text-slate-400">{prompt.updatedAt}</span>
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
                        <DropdownMenuItem onClick={() => setSelectedPrompt(prompt)}>View details</DropdownMenuItem>
                        {prompt.status === "suggested" && <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-green-700">Approve</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Reject</DropdownMenuItem>
                        </>}
                        {prompt.status === "approved" && <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Create new version</DropdownMenuItem>
                        </>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <PromptSheet
        prompt={selectedPrompt}
        onClose={() => setSelectedPrompt(null)}
      />
    </>
  );
}
