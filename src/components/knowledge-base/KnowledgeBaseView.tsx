"use client";

import { useState, useMemo } from "react";
import { Search, Plus, MoreHorizontal, FileUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DomainBadge } from "./DomainBadge";
import { TierBadge } from "./TierBadge";
import { FactSheet, type SheetState } from "./FactSheet";
import { SeedFromDocumentDialog } from "./SeedFromDocumentDialog";
import { useFacts } from "@/resources/hooks/use-facts";
import type { FactDomain, FactTier } from "@/lib/knowledge-base/types";

// ── Mini stat card ─────────────────────────────────────────────────────────

function MiniStat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function KnowledgeBaseView() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<FactTier | "all">("all");
  const [domainFilter, setDomainFilter] = useState<FactDomain | "all">("all");
  const [sheetState, setSheetState] = useState<SheetState>(null);
  const [seedOpen, setSeedOpen] = useState(false);

  const { data: facts, updateFact, createFact, reload } = useFacts();

  // Derived counts
  const globalCount = facts.filter((f) => f.tier === "global").length;
  const moduleCount = facts.filter((f) => f.tier === "module").length;
  const orgInstanceCount = facts.filter((f) => f.tier === "org_instance").length;

  // Filtered facts
  const filtered = useMemo(() => {
    return facts.filter((f) => {
      if (tierFilter !== "all" && f.tier !== tierFilter) return false;
      if (domainFilter !== "all" && f.domain !== domainFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !f.key.toLowerCase().includes(q) &&
          !f.value.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [facts, tierFilter, domainFilter, search]);

  const openDetail = (fact: Fact) => setSheetState({ mode: "view", fact });
  const openCreate = () => setSheetState({ mode: "create" });
  const openEdit = (fact: Fact) => setSheetState({ mode: "edit", fact });
  const closeSheet = () => setSheetState(null);

  return (
    <>
      <div className="flex flex-col gap-6 p-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Knowledge Base</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Single source of truth for all facts about Anathem · global → module → org-instance hierarchy
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setSeedOpen(true)}>
              <FileUp className="mr-1.5 h-4 w-4" />
              Import from Document
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              New Fact
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <MiniStat label="Total Facts" value={facts.length} />
          <MiniStat label="Global" value={globalCount} sub="Apply to all deployments" />
          <MiniStat label="Module" value={moduleCount} sub="Scoped to product module" />
          <MiniStat label="Org-Instance" value={orgInstanceCount} sub="Trust-level overrides" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keys or values…"
              className="pl-8 text-sm h-9"
            />
          </div>

          {/* Tier tabs */}
          <Tabs
            value={tierFilter}
            onValueChange={(v) => setTierFilter(v as FactTier | "all")}
          >
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
              <TabsTrigger value="global" className="text-xs px-3">Global</TabsTrigger>
              <TabsTrigger value="module" className="text-xs px-3">Module</TabsTrigger>
              <TabsTrigger value="org_instance" className="text-xs px-3">Org-Instance</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Domain filter */}
          <Select
            value={domainFilter}
            onValueChange={(v) => setDomainFilter(v as FactDomain | "all")}
          >
            <SelectTrigger className="h-9 w-[150px] text-sm">
              <SelectValue placeholder="All domains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All domains</SelectItem>
              <SelectItem value="clinical">Clinical</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="data">Data</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
              <SelectItem value="evidence">Evidence</SelectItem>
            </SelectContent>
          </Select>

          {filtered.length !== facts.length && (
            <span className="text-xs text-slate-500">
              {filtered.length} of {facts.length} facts
            </span>
          )}
        </div>

        {/* Table */}
        <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[240px]">Key</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Value</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[110px]">Domain</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[160px]">Tier / Scope</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[100px]">Docs</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-[120px]">Modified</TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-slate-400">
                    No facts match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((fact) => (
                  <TableRow
                    key={fact.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => openDetail(fact)}
                  >
                    {/* Key */}
                    <TableCell className="py-3 max-w-[200px]">
                      <code className="font-mono text-xs text-slate-700 bg-slate-100 rounded px-1.5 py-0.5 break-words whitespace-pre-wrap">
                        {fact.key}
                      </code>
                    </TableCell>

                    {/* Value */}
                    <TableCell className="py-3">
                      <span className="text-sm text-slate-600 line-clamp-2 max-w-[300px]">
                        {fact.value}
                      </span>
                    </TableCell>

                    {/* Domain */}
                    <TableCell className="py-3">
                      <DomainBadge domain={fact.domain} />
                    </TableCell>

                    {/* Tier / Scope */}
                    <TableCell className="py-3">
                      <TierBadge
                        tier={fact.tier}
                        module={fact.module}
                        orgName={fact.orgName}
                      />
                    </TableCell>

                    {/* Dependent docs */}
                    <TableCell className="py-3">
                      <span
                        className={`text-sm font-medium ${
                          fact.dependentDocumentCount > 0
                            ? "text-slate-700"
                            : "text-slate-300"
                        }`}
                      >
                        {fact.dependentDocumentCount > 0
                          ? fact.dependentDocumentCount
                          : "—"}
                      </span>
                    </TableCell>

                    {/* Modified */}
                    <TableCell className="py-3">
                      <span className="text-xs text-slate-400">{fact.modifiedAt}</span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell
                      className="py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-slate-700"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-sm">
                          <DropdownMenuItem onClick={() => openDetail(fact)}>
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(fact)}>
                            Edit value
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Seed from document dialog */}
      <SeedFromDocumentDialog
        open={seedOpen}
        onClose={() => setSeedOpen(false)}
        onImport={async (extractedFacts) => {
          const { createClient } = await import("@supabase/supabase-js");
          const sb = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );

          // Deduplicate keys within the batch (keep last occurrence)
          const deduped = extractedFacts.reduce<typeof extractedFacts>((acc, f) => {
            const idx = acc.findIndex((x) => x.key === f.key);
            if (idx >= 0) acc[idx] = f;
            else acc.push(f);
            return acc;
          }, []);

          // Fetch which keys already exist
          const keys = deduped.map((f) => f.key);
          const { data: existing } = await sb
            .from("facts")
            .select("id, fact_key")
            .in("fact_key", keys);
          const existingMap = new Map((existing ?? []).map((r: any) => [r.fact_key, r.id]));

          const now = new Date().toISOString();
          for (const f of deduped) {
            const existingId = existingMap.get(f.key);
            if (existingId) {
              // UPDATE existing fact — only safe columns, avoids stale_reason type issue
              const { error: err } = await sb
                .from("facts")
                .update({
                  current_value: f.value,
                  domain: f.domain,
                  tier: f.tier,
                  display_name: f.key,
                  updated_at: now,
                })
                .eq("id", existingId);
              if (err) return err.message;
            } else {
              // INSERT new fact
              const { error: err } = await sb.from("facts").insert({
                id: crypto.randomUUID(),
                fact_key: f.key,
                display_name: f.key,
                description: "",
                tier: f.tier,
                domain: f.domain,
                value_type: "string",
                current_value: f.value,
                module_id: null,
                created_by: null,
              });
              if (err) return err.message;
            }
          }
          reload();
          return null;
        }}
      />

      {/* Sliding fact sheet */}
      <FactSheet
        state={sheetState}
        onClose={closeSheet}
        onEditRequest={openEdit}
        onSaveEdit={async (fact, newValue, reason) => {
          const nextVersion = (fact.versions.length ?? 0) + 1;
          const now = new Date().toISOString();
          const err = await updateFact(
            fact.id,
            { current_value: newValue, updated_at: now },
            {
              id: crypto.randomUUID(),
              fact_id: fact.id,
              version_number: nextVersion,
              value: newValue,
              changed_by: null,
              changed_at: now,
              change_reason: reason,
            }
          );
          if (!err) reload();
          return err?.message ?? null;
        }}
        onSaveCreate={async ({ key, value, valueType, domain, tier, moduleId }) => {
          const now = new Date().toISOString();
          const err = await createFact({
            id: crypto.randomUUID(),
            fact_key: key,
            display_name: key,
            description: "",
            tier,
            domain,
            value_type: valueType,
            current_value: value,
            module_id: moduleId ?? null,
            created_by: null,
          });
          if (!err) reload();
          return err?.message ?? null;
        }}
      />
    </>
  );
}
