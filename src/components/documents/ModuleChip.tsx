import { cn } from "@/lib/utils";
import type { ModuleId } from "@/lib/knowledge-base/types";
import { MODULE_LABELS } from "@/lib/knowledge-base/types";

const styles: Record<ModuleId, string> = {
  "mental-health": "bg-blue-50 text-blue-600",
  police: "bg-slate-100 text-slate-600",
  neurodevelopmental: "bg-purple-50 text-purple-600",
  "patient-crm": "bg-teal-50 text-teal-600",
};

export function ModuleChip({ module }: { module: ModuleId }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium",
        styles[module]
      )}
    >
      {MODULE_LABELS[module]}
    </span>
  );
}
