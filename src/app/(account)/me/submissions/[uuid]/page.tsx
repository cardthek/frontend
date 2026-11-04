import { SubmissionDetailClient } from "./submission-detail-client";

export const instant = false;

export default async function SubmissionDetailPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return <SubmissionDetailClient uuid={uuid} />;
}
