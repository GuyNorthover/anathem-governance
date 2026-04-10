"use client";

import { useState, useMemo } from "react";
import { Search, Lock, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AuditCategoryBadge } from "./AuditCategoryBadge";
import { AuditEventIcon } from "./AuditEventIcon";
import { useAuditEvents } from "@/resources/hooks/use-audit-events";
import { EVENT_CATEGORY_META, EVENT_TYPE_LABELS } from "@/lib/audit/types";
import type { AuditEvent, AuditEventCategory } from "@/lib/audit/types";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "UTC",
  });
}

function formatDateGroup(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "long", year: "numeric", timeZone: "UTC",
  });
}

const ACTOR_ROLE_STYLE: Record<string, string> = {
  admin:  "bg-purple-50 text-purple-700",
  editor: "bg-blue-50 text-blue-700",
  viewer: "bg-slate-100 text-slate-600",
  system: "bg-slate-100 text-slate-500 italic",
};

// ── Detail panel ───────────────────────────────────────────────────────────

function DetailPanel({ event, onClose }: { event: AuditEvent; onClose: () => void }) {
  return (
    <div className="flex h-full flex-col border-l border-slate-200 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-start gap-3">
          <AuditEventIcon type={event.type} category={event.category} size="sm" />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {EVENT_TYPE_LABELS[event.type]}
            </p>
            <p className="text-xs text-slate-400">{formatTimestamp(event.timestamp)}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <AuditCategoryBadge category={event.category} />
          <span className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
            ACTOR_ROLE_STYLE[event.actorRole]
          )}>
            {event.actorRole}
          </span>
        </div>

        {/* Summary */}
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Summary</p>
          <p className="text-sm text-slate-700 leading-relaxed">{event.summary}</p>
        </div>

        {/* Actor */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Actor</p>
            <p className="text-sm text-slate-700">{event.actor}</p>
          </div>
          <div>
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Timestamp (UTC)</p>
            <p className="text-sm text-slate-700">{formatTimestamp(event.timestamp)}</p>
          </div>
        </div>

        {/* Related entity */}
        {event.relatedEntityLabel && (
          <div>
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Related {event.relatedEntityType}
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-700">{event.relatedEntityLabel}</span>
              {event.relatedEntityId && (
                <code className="ml-auto text-[10px] text-slate-400 font-mono">{event.relatedEntityId}</code>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Detail payload */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Event Detail
          </p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden divide-y divide-slate-100">
            {Object.entries(event.detail).map(([key, value]) => (
              <div key={key} className="flex items-start gap-3 px-3 py-2">
                <code className="text-[11px] font-mono text-slate-500 flex-shrink-0 w-44 truncate">{key}</code>
                <span className="text-xs text-slate-700 min-w-0 break-words">
                  {value === null ? <span className="text-slate-300 italic">null</span> : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Immutability note */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <Lock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <p className="text-xs text-slate-500">
            This record is immutable and cannot be edited or deleted.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Feed row ───────────────────────────────────────────────────────────────

function EventRow({ event, isSelected, onClick }: { event: AuditEvent; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 px-5 py-3 text-left transition-colors",
        isSelected ? "bg-blue-50/60" : "hover:bg-slate-50"
      )}
    >
      <AuditEventIcon type={event.type} category={event.category} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-xs font-semibold text-slate-700">
            {EVENT_TYPE_LABELS[event.type]}
          </span>
          <AuditCategoryBadge category={event.category} />
          <span className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
            ACTOR_ROLE_STYLE[event.actorRole]
          )}>
            {event.actor}
          </span>
        </div>
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{event.summary}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[10px] text-slate-400 whitespace-nowrap">
          {formatTimestamp(event.timestamp)}
        </span>
        <ChevronRight className={cn("h-3.5 w-3.5", isSelected ? "text-blue-500" : "text-slate-300")} />
      </div>
    </button>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────

export function AuditLogView() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AuditEventCategory | "all">("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const { data: events } = useAuditEvents();

  const actors = useMemo(() => {
    const unique = [...new Set(events.map((e) => e.actor))].sort();
    return unique;
  }, [events]);

  const categoryCounts = useMemo(() =>
    (Object.keys(EVENT_CATEGORY_META) as AuditEventCategory[]).reduce((acc, cat) => {
      acc[cat] = events.filter((e) => e.category === cat).length;
      return acc;
    }, {} as Record<AuditEventCategory, number>)
  , [events]);

  const filtered = useMemo(() => events.filter((e) => {
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
    if (actorFilter !== "all" && e.actor !== actorFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!e.summary.toLowerCase().includes(q) &&
          !e.actor.toLowerCase().includes(q) &&
          !EVENT_TYPE_LABELS[e.type].toLowerCase().includes(q)) return false;
    }
    return true;
  }), [events, categoryFilter, actorFilter, search]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { date: string; events: AuditEvent[] }[] = [];
    for (const event of filtered) {
      const dateKey = event.timestamp.slice(0, 10);
      const label = formatDateGroup(event.timestamp);
      const existing = groups.find((g) => g.date === dateKey);
      if (existing) {
        existing.events.push(event);
      } else {
        groups.push({ date: dateKey, events: [event] });
      }
    }
    return groups;
  }, [filtered]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: feed */}
      <div className={cn("flex flex-col overflow-hidden transition-all", selectedEvent ? "w-[55%]" : "w-full")}>
        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Audit Log</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Immutable record of every event — the evidence base for regulatory inspection
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">Append-only · {events.length} events</span>
            </div>
          </div>

          {/* Category stat chips */}
          <div className="flex gap-2 flex-wrap mb-4">
            {(Object.keys(EVENT_CATEGORY_META) as AuditEventCategory[]).map((cat) => {
              const m = EVENT_CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat === categoryFilter ? "all" : cat)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    cat === categoryFilter ? m.style : "border-slate-200 text-slate-500 hover:border-slate-300"
                  )}
                >
                  <span className={cn("inline-block h-1.5 w-1.5 rounded-full", m.dot)} />
                  {m.label}
                  <span className="text-slate-400">({categoryCounts[cat]})</span>
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events…"
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Select value={actorFilter} onValueChange={setActorFilter}>
              <SelectTrigger className="h-9 w-[160px] text-sm">
                <SelectValue placeholder="All actors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actors</SelectItem>
                {actors.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            {filtered.length !== events.length && (
              <span className="flex items-center text-xs text-slate-500">
                {filtered.length} of {events.length}
              </span>
            )}
          </div>
        </div>

        {/* Event feed */}
        <div className="flex-1 overflow-y-auto bg-white">
          {grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-sm text-slate-400">
              No events match the current filters.
            </div>
          ) : grouped.map((group) => (
            <div key={group.date}>
              {/* Date divider */}
              <div className="sticky top-0 z-10 flex items-center gap-3 bg-slate-50/95 backdrop-blur-sm border-y border-slate-100 px-5 py-1.5">
                <span className="text-[11px] font-semibold text-slate-500">{formatDateGroup(group.date)}</span>
                <span className="text-[10px] text-slate-400">{group.events.length} event{group.events.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {group.events.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    isSelected={selectedEvent?.id === event.id}
                    onClick={() => setSelectedEvent(
                      selectedEvent?.id === event.id ? null : event
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: detail panel */}
      {selectedEvent && (
        <div className="w-[45%] flex-shrink-0 overflow-hidden">
          <DetailPanel
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        </div>
      )}
    </div>
  );
}
