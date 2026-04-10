"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDocuments } from "@/resources/hooks/use-documents";
import type { DocumentStatus } from "@/lib/documents/types";

const STATUS_META: Array<{
  key: DocumentStatus;
  label: string;
  description: string;
  dot: string;
  pill: string;
}> = [
  {
    key: "draft",
    label: "Draft",
    description: "In progress, not yet submitted for review",
    dot: "bg-slate-400",
    pill: "bg-slate-100 text-slate-700",
  },
  {
    key: "pending_review",
    label: "Pending Review",
    description: "Generated, awaiting human approval",
    dot: "bg-amber-400",
    pill: "bg-amber-100 text-amber-700",
  },
  {
    key: "approved",
    label: "Approved",
    description: "Reviewed and signed off, ready to submit",
    dot: "bg-green-500",
    pill: "bg-green-100 text-green-700",
  },
  {
    key: "submitted",
    label: "Submitted",
    description: "Sent to trust or regulatory body",
    dot: "bg-blue-500",
    pill: "bg-blue-100 text-blue-700",
  },
  {
    key: "stale",
    label: "Stale",
    description: "Facts changed — must be reviewed before resubmission",
    dot: "bg-red-500",
    pill: "bg-red-100 text-red-700",
  },
];

export function DocumentStatusGrid() {
  const { data: docs } = useDocuments();

  const counts = STATUS_META.reduce((acc, s) => {
    acc[s.key] = docs.filter((d) => d.status === s.key).length;
    return acc;
  }, {} as Record<DocumentStatus, number>);

  const total = docs.length || 1; // avoid divide-by-zero

  return (
    <Card className="border-slate-200 bg-white shadow-none">
      <CardHeader className="border-b border-slate-100 px-5 py-4">
        <CardTitle className="text-sm font-semibold text-slate-900">
          Documents by Status
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-slate-100 p-0">
        {STATUS_META.map((status) => {
          const count = counts[status.key] ?? 0;
          const pct = Math.round((count / total) * 100);
          return (
            <div key={status.key} className="flex items-center gap-4 px-5 py-3">
              <span
                className={cn(
                  "inline-flex w-32 flex-shrink-0 items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                  status.pill
                )}
              >
                <span className={cn("mr-1.5 inline-block h-1.5 w-1.5 rounded-full", status.dot)} />
                {status.label}
              </span>
              <div className="flex-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn("h-1.5 rounded-full transition-all", status.dot)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <span className="w-6 flex-shrink-0 text-right text-sm font-semibold text-slate-700">
                {count}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
