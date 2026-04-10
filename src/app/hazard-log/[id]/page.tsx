import { HazardLogDetailView } from "@/components/hazard-log/HazardLogDetailView";

interface Props {
  params: { id: string };
}

export default function HazardLogDetailPage({ params }: Props) {
  return <HazardLogDetailView entryId={params.id} />;
}
