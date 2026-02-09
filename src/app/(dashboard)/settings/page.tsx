import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { AvatarUpload } from "@/components/settings/AvatarUpload";
import { BannerUpload } from "@/components/settings/BannerUpload";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { AccountSection } from "@/components/settings/AccountSection";
import { DangerZone } from "@/components/settings/DangerZone";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      avatarUrl: true,
      bannerUrl: true,
      bio: true,
      websiteUrl: true,
      location: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your profile, account, and preferences.
        </p>
      </div>

      {/* Account Info */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-zinc-50">Account</h2>
        <Separator className="my-4 bg-zinc-800" />
        <AccountSection
          email={user.email}
          username={user.username}
          role={user.role}
          createdAt={user.createdAt}
        />
      </section>

      {/* Avatar */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-zinc-50">Avatar</h2>
        <Separator className="my-4 bg-zinc-800" />
        <AvatarUpload
          currentAvatarUrl={user.avatarUrl}
          username={user.username}
          name={user.name}
        />
      </section>

      {/* Banner */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-zinc-50">Channel Banner</h2>
        <Separator className="my-4 bg-zinc-800" />
        <BannerUpload currentBannerUrl={user.bannerUrl} />
      </section>

      {/* Profile */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-zinc-50">Profile</h2>
        <Separator className="my-4 bg-zinc-800" />
        <ProfileForm
          defaultValues={{
            name: user.name,
            bio: user.bio ?? "",
            websiteUrl: user.websiteUrl ?? "",
            location: user.location ?? "",
          }}
        />
      </section>

      {/* Password */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-zinc-50">Change Password</h2>
        <Separator className="my-4 bg-zinc-800" />
        <ChangePasswordForm />
      </section>

      {/* Danger Zone */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-50">
          Danger Zone
        </h2>
        <DangerZone />
      </section>
    </div>
  );
}
