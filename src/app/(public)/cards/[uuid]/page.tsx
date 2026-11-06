import { CardDetailClient } from "./card-detail-client";

export default async function CardDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return <CardDetailClient uuid={uuid} />;
}
