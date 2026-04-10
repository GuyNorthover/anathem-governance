import { cn } from "@/lib/utils";
import type { PromptStatus } from "@/lib/prompts/types";
import { STATUS_META } from "@/lib/prompts/types";

export function PromptStatusBadge({ status, className }: { status: PromptStatus; className?: string }) {
  const s = STATUS_META[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
      s.style, className
    )}>
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
