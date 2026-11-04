import { CardContributionClient } from "./card-contribution-client";

export const instant = false;

export default async function CardContributePage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return <CardContributionClient uuid={uuid} />;
}
