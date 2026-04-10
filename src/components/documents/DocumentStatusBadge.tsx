import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import type { DocumentStatus } from "@/lib/documents/types";
import { STATUS_STYLES } from "@/lib/documents/types";

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        s.pill,
        className
      )}
    >
      {status === "stale" ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <span className={cn("inline-block h-1.5 w-1.5 rounded-full", s.dot)} />
      )}
      {s.label}
    </span>
  );
}
