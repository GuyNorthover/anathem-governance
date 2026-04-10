import { PathwayDetailView } from "@/components/pathways/PathwayDetailView";

interface Props {
  params: { id: string };
}

export default function PathwayDetailPage({ params }: Props) {
  return <PathwayDetailView pathwayId={params.id} />;
}
