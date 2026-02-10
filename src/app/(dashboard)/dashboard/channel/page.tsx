import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ExternalLink,
  Lock,
  MonitorPlay,
  Upload,
  Video,
  Eye,
} from "lucide-react";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getChannelStats } from "@/lib/queries/channel";
import { formatViewCount, formatRelativeTime } from "@/lib/format";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { AvatarUpload } from "@/components/settings/AvatarUpload";
import { BannerUpload } from "@/components/settings/BannerUpload";

export default async function ChannelSettingsPage() {
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
      avatarUrl: true,
      bannerUrl: true,
      bio: true,
      websiteUrl: true,
      location: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Redirect VIEWERs — they can't have channels
  if (user.role === "VIEWER") {
    redirect("/become-creator");
  }

  const stats = await getChannelStats(user.id);

  const roleBadge: Record<string, { label: string; className: string }> = {
    CREATOR: {
      label: "Creator",
      className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    STUDIO: {
      label: "Studio",
      className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    },
    ADMIN: {
      label: "Admin",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
    },
  };

  const badge = roleBadge[user.role];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">Channel Settings</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Customize how your channel appears to viewers.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link
            href={`/channel/${user.username}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            View My Channel
          </Link>
        </Button>
      </div>

      {/* Banner */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-zinc-50">Channel Banner</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Recommended: 1920x400px, JPEG or PNG
        </p>
        <Separator className="my-4 bg-zinc-800" />
        <BannerUpload currentBannerUrl={user.bannerUrl} />
      </section>

      {/* Avatar */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-zinc-50">Channel Avatar</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Square image, at least 256x256px
        </p>
        <Separator className="my-4 bg-zinc-800" />
        <AvatarUpload
          currentAvatarUrl={user.avatarUrl}
          username={user.username}
          name={user.name}
        />
      </section>

      {/* Channel Info */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-50">Channel Info</h2>
          {badge && (
            <Badge variant="outline" className={badge.className}>
              {badge.label}
            </Badge>
          )}
        </div>
        <Separator className="my-4 bg-zinc-800" />

        {/* Username (read-only) */}
        <div className="mb-4 space-y-1">
          <p className="text-sm font-medium text-zinc-300">Username</p>
          <div className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2">
            <Lock className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-sm text-zinc-400">@{user.username}</span>
          </div>
          <p className="text-xs text-zinc-500">
            Your channel URL: /channel/{user.username}
          </p>
          {/* TODO: Username change flow */}
        </div>

        <ProfileForm
          defaultValues={{
            name: user.name,
            bio: user.bio ?? "",
            websiteUrl: user.websiteUrl ?? "",
            location: user.location ?? "",
          }}
        />
      </section>

      {/* Studio-specific section */}
      {user.role === "STUDIO" && (
        <section className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-6">
          <div className="flex items-center gap-2">
            <MonitorPlay className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-purple-400">
              Studio Account
            </h2>
          </div>
          <Separator className="my-4 bg-purple-500/20" />
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <Lock className="h-4 w-4 text-zinc-500" />
              <span>
                Team Management — Invite team members to help manage your
                channel.{" "}
                <span className="text-zinc-500">Coming soon.</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <Lock className="h-4 w-4 text-zinc-500" />
              <span>
                Brand Kit — Upload logos and set brand colors.{" "}
                <span className="text-zinc-500">Coming soon.</span>
              </span>
            </div>
          </div>
          {/* TODO: Multi-channel support for Studio accounts */}
          {/* TODO: Team member invites and role-based channel access */}
        </section>
      )}

      {/* Channel Content / Stats */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-zinc-50">Channel Content</h2>
        <Separator className="my-4 bg-zinc-800" />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-zinc-800/50 p-4">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Video className="h-4 w-4" />
              Total Videos
            </div>
            <p className="mt-1 text-2xl font-bold text-zinc-50">
              {stats.totalVideos}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-4">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Eye className="h-4 w-4" />
              Total Views
            </div>
            <p className="mt-1 text-2xl font-bold text-zinc-50">
              {formatViewCount(stats.totalViews)}
            </p>
          </div>
        </div>

        {/* Most Popular Video */}
        {stats.mostPopular && (
          <div className="mt-4 rounded-lg bg-zinc-800/50 p-4">
            <p className="text-xs text-zinc-500">Most Popular Video</p>
            <Link
              href={`/watch/${stats.mostPopular.slug}`}
              className="mt-1 block text-sm font-medium text-zinc-200 hover:text-blue-400"
            >
              {stats.mostPopular.title}
            </Link>
            <p className="text-xs text-zinc-500">
              {formatViewCount(stats.mostPopular.viewCount)} views
            </p>
          </div>
        )}

        {/* Latest Upload */}
        {stats.recentUpload && (
          <div className="mt-3 rounded-lg bg-zinc-800/50 p-4">
            <p className="text-xs text-zinc-500">Latest Upload</p>
            <Link
              href={`/watch/${stats.recentUpload.slug}`}
              className="mt-1 block text-sm font-medium text-zinc-200 hover:text-blue-400"
            >
              {stats.recentUpload.title}
            </Link>
            <p className="text-xs text-zinc-500">
              {stats.recentUpload.publishedAt
                ? formatRelativeTime(stats.recentUpload.publishedAt)
                : "Not published yet"}
            </p>
          </div>
        )}

        {/* Quick actions */}
        <div className="mt-4 flex gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/videos">
              <Video className="mr-2 h-4 w-4" />
              Manage Videos
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload New Video
            </Link>
          </Button>
        </div>
      </section>

      {/* Customization (MVP Placeholder) */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-zinc-50">Customization</h2>
        <p className="mt-1 text-xs text-zinc-500">
          These features are coming soon
        </p>
        <Separator className="my-4 bg-zinc-800" />
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-zinc-800/30 px-4 py-3 text-sm text-zinc-500">
            <Lock className="h-4 w-4 shrink-0" />
            <span>Featured Video — Pick a video to feature at the top of your channel</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-zinc-800/30 px-4 py-3 text-sm text-zinc-500">
            <Lock className="h-4 w-4 shrink-0" />
            <span>Channel Trailer — Set a trailer for new visitors</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-zinc-800/30 px-4 py-3 text-sm text-zinc-500">
            <Lock className="h-4 w-4 shrink-0" />
            <span>Custom Sections — Organize your channel page into sections</span>
          </div>
        </div>
        {/* TODO: Channel customization (featured video, sections, trailer) */}
      </section>
    </div>
  );
}
