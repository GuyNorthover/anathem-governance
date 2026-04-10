import {
  Database, FileText, FileCheck, Send, AlertTriangle,
  Wand2, CheckCircle2, XCircle, Zap, Building2,
  ToggleLeft, LogIn, LogOut, FilePlus, PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditEventType, AuditEventCategory } from "@/lib/audit/types";
import { EVENT_CATEGORY_META } from "@/lib/audit/types";

const TYPE_ICON: Record<AuditEventType, React.ElementType> = {
  "fact.created":              Database,
  "fact.updated":              PenLine,
  "document.created":          FilePlus,
  "document.generated":        Wand2,
  "document.section_approved": FileCheck,
  "document.approved":         CheckCircle2,
  "document.submitted":        Send,
  "document.stale":            AlertTriangle,
  "prompt.created":            Wand2,
  "prompt.approved":           CheckCircle2,
  "prompt.rejected":           XCircle,
  "prompt.version_created":    PenLine,
  "generation.completed":      Zap,
  "org.created":               Building2,
  "org.module_changed":        ToggleLeft,
  "user.login":                LogIn,
  "user.logout":               LogOut,
};

interface AuditEventIconProps {
  type: AuditEventType;
  category: AuditEventCategory;
  size?: "sm" | "md";
}

export function AuditEventIcon({ type, category, size = "md" }: AuditEventIconProps) {
  const Icon = TYPE_ICON[type] ?? FileText;
  const meta = EVENT_CATEGORY_META[category] ?? EVENT_CATEGORY_META["knowledge-base"];

  const sizeClass = size === "sm"
    ? "h-6 w-6"
    : "h-8 w-8";
  const iconClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  // Derive bg from the dot colour
  const bgMap: Record<string, string> = {
    "bg-blue-500":    "bg-blue-100",
    "bg-teal-500":    "bg-teal-100",
    "bg-purple-500":  "bg-purple-100",
    "bg-indigo-500":  "bg-indigo-100",
    "bg-green-500":   "bg-green-100",
    "bg-slate-400":   "bg-slate-100",
  };
  const iconColorMap: Record<string, string> = {
    "bg-blue-500":    "text-blue-600",
    "bg-teal-500":    "text-teal-600",
    "bg-purple-500":  "text-purple-600",
    "bg-indigo-500":  "text-indigo-600",
    "bg-green-500":   "text-green-600",
    "bg-slate-400":   "text-slate-500",
  };

  return (
    <div className={cn(
      "flex flex-shrink-0 items-center justify-center rounded-full",
      sizeClass,
      bgMap[meta.dot] ?? "bg-slate-100"
    )}>
      <Icon className={cn(iconClass, iconColorMap[meta.dot] ?? "text-slate-500")} />
    </div>
  );
}
