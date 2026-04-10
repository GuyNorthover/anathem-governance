"use client";

import {
  Database, FileText, Building2, AlertTriangle,
} from "lucide-react";
import { StatCard }            from "@/components/dashboard/StatCard";
import { DocumentStatusGrid }  from "@/components/dashboard/DocumentStatusGrid";
import { ActivityFeed }        from "@/components/dashboard/ActivityFeed";
import { EUProgressWidget }    from "@/components/dashboard/EUProgressWidget";
import { HazardSummaryWidget } from "@/components/dashboard/HazardSummaryWidget";
import { QuickActions }        from "@/components/dashboard/QuickActions";
import { useDocuments }        from "@/resources/hooks/use-documents";
import { useFacts }            from "@/resources/hooks/use-facts";
import { useOrganisations }    from "@/resources/hooks/use-organisations";
import { useOrgContext }       from "@/stores/context/OrgContext";

export default function DashboardPage() {
  const { data: docs }  = useDocuments();
  const { data: facts } = useFacts();
  const { data: orgs }  = useOrganisations();
  const { activeOrgName } = useOrgContext();

  // Filter counts to active org if one is selected
  const staleCount   = docs.filter((d) => d.status === "stale").length;
  const pendingCount = docs.filter((d) => d.status === "pending_review").length;
  const attentionCount = staleCount + pendingCount;

  const globalCount = facts.filter((f) => f.tier === "global").length;
  const moduleCount = facts.filter((f) => f.tier === "module").length;
  const orgCount    = facts.filter((f) => f.tier === "org_instance").length;

  return (
    <div className="flex flex-col gap-5 p-8 h-full overflow-y-auto">
      {/* Page header */}
      <div className="flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {activeOrgName ? `${activeOrgName} — Overview` : "Dashboard"}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {activeOrgName
              ? `Regulatory operations for ${activeOrgName}`
              : "Regulatory operations overview · Anathem AVT"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
            Phase 1
          </span>
        </div>
      </div>

      {/* Row 1: stat cards */}
      <div className="grid grid-cols-4 gap-4 flex-shrink-0">
        <StatCard
          label="Facts in Knowledge Base"
          value={facts.length}
          subtext={`${globalCount} global · ${moduleCount} module · ${orgCount} org`}
          icon={Database}
          accent="blue"
        />
        <StatCard
          label="Total Documents"
          value={docs.length}
          subtext="Across all organisations"
          icon={FileText}
          accent="default"
        />
        <StatCard
          label="Organisations Tracked"
          value={orgs.length}
          subtext="NHS trusts & bodies"
          icon={Building2}
          accent="green"
        />
        <StatCard
          label="Require Attention"
          value={attentionCount}
          subtext={`${staleCount} stale · ${pendingCount} pending review`}
          icon={AlertTriangle}
          accent={attentionCount > 0 ? "amber" : "default"}
        />
      </div>

      {/* Row 2: quick actions */}
      <QuickActions />

      {/* Row 3: EU progress + Hazard summary */}
      <div className="grid grid-cols-2 gap-4 flex-shrink-0">
        <EUProgressWidget />
        <HazardSummaryWidget />
      </div>

      {/* Row 4: document status + activity feed */}
      <div className="grid grid-cols-5 gap-4 flex-shrink-0">
        <div className="col-span-2">
          <DocumentStatusGrid />
        </div>
        <div className="col-span-3">
          <ActivityFeed />
        </div>
      </div>

      {/* Row 5: regulatory frameworks */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 flex-shrink-0">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Active Regulatory Frameworks
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "NHSE AVT Registry",
            "DCB0129 Clinical Safety",
            "DCB0160 Deployment Assurance",
            "MHRA SaMD Technical File",
            "NHS IG Questionnaires",
            "EU MDR 2017/745",
            "GDPR / UK GDPR",
          ].map((framework) => (
            <span
              key={framework}
              className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
            >
              {framework}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
