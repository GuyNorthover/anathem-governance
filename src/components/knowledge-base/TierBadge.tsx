import { cn } from "@/lib/utils";
import type { FactTier, ModuleId } from "@/lib/knowledge-base/types";
import { MODULE_LABELS } from "@/lib/knowledge-base/types";

const tierStyles: Record<FactTier, string> = {
  global: "bg-slate-100 text-slate-600 border-slate-200",
  module: "bg-blue-50 text-blue-700 border-blue-200",
  org_instance: "bg-amber-50 text-amber-700 border-amber-200",
};

const tierLabels: Record<FactTier, string> = {
  global: "Global",
  module: "Module",
  org_instance: "Org-Instance",
};

interface TierBadgeProps {
  tier: FactTier;
  module?: ModuleId;
  orgName?: string;
  className?: string;
}

export function TierBadge({ tier, module, orgName, className }: TierBadgeProps) {
  let label = tierLabels[tier];
  if (tier === "module" && module) label = MODULE_LABELS[module];
  if (tier === "org_instance" && orgName) label = orgName;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        tierStyles[tier],
        className
      )}
    >
      {label}
    </span>
  );
}
