"use client";

import { useRouter } from "next/navigation";
import {
  Plus, Upload, AlertTriangle, GitBranch,
  Flag, FileText, Building2,
} from "lucide-react";

interface Action {
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  href: string;
  colour: string;
  iconBg: string;
}

const ACTIONS: Action[] = [
  {
    label:       "New hazard entry",
    description: "Log a clinical safety hazard, risk, or issue",
    icon:        AlertTriangle,
    href:        "/hazard-log",
    colour:      "border-red-200 hover:border-red-300 hover:bg-red-50/30",
    iconBg:      "bg-red-100 text-red-600",
  },
  {
    label:       "Upload source doc",
    description: "Add a regulatory or compliance document",
    icon:        Upload,
    href:        "/source-docs",
    colour:      "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30",
    iconBg:      "bg-blue-100 text-blue-600",
  },
  {
    label:       "New pathway",
    description: "Extract a governance pathway from documents",
    icon:        GitBranch,
    href:        "/pathways",
    colour:      "border-slate-200 hover:border-violet-300 hover:bg-violet-50/30",
    iconBg:      "bg-violet-100 text-violet-600",
  },
  {
    label:       "EU accreditation",
    description: "Track 16-step EU MDR accreditation progress",
    icon:        Flag,
    href:        "/eu-accreditation",
    colour:      "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30",
    iconBg:      "bg-blue-100 text-blue-600",
  },
  {
    label:       "New document",
    description: "Generate a compliance document for an org",
    icon:        FileText,
    href:        "/documents",
    colour:      "border-slate-200 hover:border-green-300 hover:bg-green-50/30",
    iconBg:      "bg-green-100 text-green-600",
  },
  {
    label:       "Add organisation",
    description: "Register a new NHS trust or organisation",
    icon:        Building2,
    href:        "/organisations",
    colour:      "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
    iconBg:      "bg-slate-100 text-slate-600",
  },
];

export function QuickActions() {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
        Quick actions
      </p>
      <div className="grid grid-cols-3 gap-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className={`flex items-start gap-2.5 rounded-lg border p-3 text-left transition-all ${action.colour}`}
            >
              <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${action.iconBg}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 leading-snug">{action.label}</p>
                <p className="text-[10px] text-slate-400 leading-snug mt-0.5 line-clamp-2">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
