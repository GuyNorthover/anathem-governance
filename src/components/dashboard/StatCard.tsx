import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconClassName?: string;
  accent?: "default" | "amber" | "red" | "green" | "blue";
}

const accentMap = {
  default: "bg-slate-100 text-slate-600",
  amber: "bg-amber-100 text-amber-600",
  red: "bg-red-100 text-red-600",
  green: "bg-green-100 text-green-600",
  blue: "bg-blue-100 text-blue-600",
};

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  accent = "default",
}: StatCardProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-none">
      <CardContent className="flex items-start justify-between p-5">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtext && (
            <p className="text-xs text-slate-500">{subtext}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            accentMap[accent]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
