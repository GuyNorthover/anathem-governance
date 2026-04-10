"use client";

import { useDocumentWithSections } from "@/resources/hooks/use-documents";
import { DocumentDetailView } from "@/components/documents/DocumentDetailView";
import Link from "next/link";

interface Props {
  params: { id: string };
}

export default function DocumentDetailPage({ params }: Props) {
  const id = params.id;
  const { data, loading, error, reload, updateStatus, approveSection } = useDocumentWithSections(id);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        Loading document…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-slate-500">
        <p>{error ?? "Document not found."}</p>
        <Link href="/documents" className="text-xs text-slate-400 underline hover:text-slate-600">
          Back to Documents
        </Link>
      </div>
    );
  }

  return (
    <DocumentDetailView
      doc={data}
      onReload={reload}
      onUpdateStatus={updateStatus}
      onApproveSection={approveSection}
    />
  );
}
