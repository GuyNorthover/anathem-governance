"use client";

import {
  Database,
  FileCheck,
  Building2,
  RefreshCw,
  Wand2,
  AlertTriangle,
  Send,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuditEvents } from "@/resources/hooks/use-audit-events";

const EVENT_CONFIG: Record<string, { icon: React.ElementType; iconClass: string; dotClass: string }> = {
  "fact.updated": { icon: Database, iconClass: "text-blue-600", dotClass: "bg-blue-100" },
  "fact.created": { icon: Database, iconClass: "text-blue-600", dotClass: "bg-blue-100" },
  "document.section_approved": { icon: FileCheck, iconClass: "text-green-600", dotClass: "bg-green-100" },
  "document.approved": { icon: FileCheck, iconClass: "text-green-600", dotClass: "bg-green-100" },
  "document.submitted": { icon: Send, iconClass: "text-blue-600", dotClass: "bg-blue-100" },
  "document.stale": { icon: AlertTriangle, iconClass: "text-amber-600", dotClass: "bg-amber-100" },
  "generation.completed": { icon: Wand2, iconClass: "text-violet-600", dotClass: "bg-violet-100" },
  "prompt.approved": { icon: Wand2, iconClass: "text-purple-600", dotClass: "bg-purple-100" },
  "org.created": { icon: Building2, iconClass: "text-slate-600", dotClass: "bg-slate-100" },
  default: { icon: FileText, iconClass: "text-slate-600", dotClass: "bg-slate-100" },
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ActivityFeed() {
  const { data: events } = useAuditEvents();
  const recent = events.slice(0, 8);

  return (
    <Card className="border-slate-200 bg-white shadow-none">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <CardTitle className="text-sm font-semibold text-slate-900">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-slate-100 p-0">
        {recent.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">No activity yet.</p>
        ) : (
          recent.map((event) => {
            const config = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.default;
            const Icon = config.icon;
            return (
              <div key={event.id} className="flex items-start gap-3 px-5 py-3">
                <div
                  className={cn(
                    "mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
                    config.dotClass
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", config.iconClass)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 line-clamp-2">{event.summary}</p>
                  <p className="text-xs text-slate-400">
                    {event.actor ?? "System"} · {relativeTime(event.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
