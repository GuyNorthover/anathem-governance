import { cn } from "@/lib/utils";
import type { PromptCategory } from "@/lib/prompts/types";
import { CATEGORY_META } from "@/lib/prompts/types";

export function CategoryBadge({ category, className }: { category: PromptCategory; className?: string }) {
  const m = CATEGORY_META[category];
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
      m.style, className
    )}>
      {m.label}
    </span>
  );
}
