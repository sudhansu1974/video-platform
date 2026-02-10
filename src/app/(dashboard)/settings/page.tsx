import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Separator } from "@/components/ui/separator";
import { AccountSection } from "@/components/settings/AccountSection";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
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
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const isChannelRole =
    user.role === "CREATOR" || user.role === "STUDIO" || user.role === "ADMIN";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your account and security.
        </p>
      </div>

      {/* Channel settings link */}
      {isChannelRole && (
        <Link
          href="/dashboard/channel"
          className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 transition-colors hover:bg-blue-500/10"
        >
          <div>
            <p className="text-sm font-medium text-blue-400">
              Looking for channel settings?
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Manage your avatar, banner, bio, and channel appearance
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-blue-400" />
        </Link>
      )}

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
