"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  FileText,
  Building2,
  Wand2,
  Upload,
  ScrollText,
  ShieldCheck,
  BookOpen,
  GitBranch,
  AlertTriangle,
  Flag,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/config/routes";

const navItems = [
  {
    label: "Dashboard",
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    label: "Knowledge Base",
    href: ROUTES.KNOWLEDGE_BASE,
    icon: Database,
  },
  {
    label: "Source Docs",
    href: ROUTES.SOURCE_DOCS,
    icon: BookOpen,
  },
  {
    label: "Documents",
    href: ROUTES.DOCUMENTS,
    icon: FileText,
  },
  {
    label: "Organisations",
    href: ROUTES.ORGANISATIONS,
    icon: Building2,
  },
  {
    label: "Pathways",
    href: ROUTES.PATHWAYS,
    icon: GitBranch,
  },
  {
    label: "Hazard Log",
    href: ROUTES.HAZARD_LOG,
    icon: AlertTriangle,
  },
  {
    label: "EU Accreditation",
    href: ROUTES.EU_ACCREDITATION,
    icon: Flag,
  },
  {
    label: "EU Document Library",
    href: ROUTES.EU_TEMPLATES,
    icon: Library,
  },
  {
    label: "Prompt Library",
    href: ROUTES.PROMPTS,
    icon: Wand2,
  },
  {
    label: "Ingestion",
    href: ROUTES.INGESTION,
    icon: Upload,
  },
  {
    label: "Audit Log",
    href: ROUTES.AUDIT,
    icon: ScrollText,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col bg-slate-900">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600">
          <ShieldCheck className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-100">
            Anathem
          </span>
          <span className="text-[10px] text-slate-500 tracking-wide">
            Governance
          </span>
        </div>
      </div>

      <Separator className="bg-slate-800" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Navigation
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === ROUTES.DASHBOARD
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "border-l-2 border-blue-500 bg-slate-800 pl-[10px] text-white"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      isActive ? "text-blue-400" : "text-slate-500"
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Separator className="bg-slate-800" />

      {/* Footer — role / user placeholder */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-300">
            AU
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-300">
              Anathem User
            </span>
            <span className="text-[10px] text-slate-500">admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
