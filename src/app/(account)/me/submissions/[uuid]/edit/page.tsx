import { EditSubmissionClient } from "./edit-submission-client";

export const instant = false;

export default async function EditSubmissionPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return <EditSubmissionClient uuid={uuid} />;
}
