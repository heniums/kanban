import { verifySession } from "@/lib/dal";
import { getUserById } from "@/lib/data/auth";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { notFound } from "next/navigation";

export default async function ProfilePage() {
  const { userId } = await verifySession();
  const user = await getUserById(userId);

  if (!user) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Profile Settings</h1>
      <ProfileSettings user={user} />
    </main>
  );
}
