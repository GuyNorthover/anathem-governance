"use client";

import { useOrganisation } from "@/resources/hooks/use-organisations";
import { OrganisationDetailView } from "@/components/organisations/OrganisationDetailView";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default function OrganisationDetailPage({ params }: Props) {
  const id = params.id;
  const { data: org, loading, error, reload } = useOrganisation(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-400">
        Loading organisation…
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-slate-500">
          {error ?? "Organisation not found."}
        </p>
        <Link
          href="/organisations"
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Organisations
        </Link>
      </div>
    );
  }

  return <OrganisationDetailView org={org} onReload={reload} />;
}
