import { ReviewEditClient } from "./review-edit-client";

export default async function ReviewEditPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return <ReviewEditClient uuid={uuid} />;
}
