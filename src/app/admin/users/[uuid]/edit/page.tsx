import { EditUserClient } from "./edit-user-client";

export const instant = false;

export default async function EditAdminUserPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  return <EditUserClient uuid={uuid} />;
}
