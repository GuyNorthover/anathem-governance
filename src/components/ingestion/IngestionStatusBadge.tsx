"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { INGESTION_STATUS_META } from "@/lib/ingestion/types";
import type { IngestionStatus } from "@/lib/ingestion/types";

const ANIMATED: IngestionStatus[] = ["uploading", "processing", "mapping"];

export function IngestionStatusBadge({ status }: { status: IngestionStatus }) {
  const m = INGESTION_STATUS_META[status];
  const isAnimated = ANIMATED.includes(status);

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
      m.style
    )}>
      {isAnimated ? (
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
      ) : (
        <span className={cn("inline-block h-1.5 w-1.5 rounded-full flex-shrink-0", m.dot)} />
      )}
      {m.label}
    </span>
  );
}
