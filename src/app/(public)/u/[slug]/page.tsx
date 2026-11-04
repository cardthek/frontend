import { ProfileClient } from "./profile-client";

export const instant = false;

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProfileClient slug={slug} />;
}
