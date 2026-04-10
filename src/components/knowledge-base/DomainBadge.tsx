import { cn } from "@/lib/utils";
import type { FactDomain } from "@/lib/knowledge-base/types";

const styles: Record<FactDomain, string> = {
  clinical: "bg-blue-50 text-blue-700 border-blue-200",
  technical: "bg-purple-50 text-purple-700 border-purple-200",
  data: "bg-teal-50 text-teal-700 border-teal-200",
  legal: "bg-orange-50 text-orange-700 border-orange-200",
  evidence: "bg-green-50 text-green-700 border-green-200",
};

const labels: Record<FactDomain, string> = {
  clinical: "Clinical",
  technical: "Technical",
  data: "Data",
  legal: "Legal",
  evidence: "Evidence",
};

interface DomainBadgeProps {
  domain: FactDomain;
  className?: string;
}

export function DomainBadge({ domain, className }: DomainBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        styles[domain],
        className
      )}
    >
      {labels[domain]}
    </span>
  );
}
