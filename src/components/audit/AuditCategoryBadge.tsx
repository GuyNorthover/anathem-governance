import { cn } from "@/lib/utils";
import type { AuditEventCategory } from "@/lib/audit/types";
import { EVENT_CATEGORY_META } from "@/lib/audit/types";

export function AuditCategoryBadge({ category, className }: { category: AuditEventCategory; className?: string }) {
  const m = EVENT_CATEGORY_META[category];
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
      m.style, className
    )}>
      {m.label}
    </span>
  );
}
