import { EditCardClient } from "./edit-card-client";

export default async function EditAdminCardPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return <EditCardClient uuid={uuid} />;
}
