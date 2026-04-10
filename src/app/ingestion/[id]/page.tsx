"use client";

import { IngestionDetailView } from "@/components/ingestion/IngestionDetailView";

interface Props {
  params: { id: string };
}

export default function IngestionDetailPage({ params }: Props) {
  return <IngestionDetailView jobId={params.id} />;
}
