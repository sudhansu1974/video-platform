import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Calendar, Globe, MapPin, Video, Eye, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VideoGrid } from "@/components/video/VideoGrid";
import { PaginationControls } from "@/components/browse/PaginationControls";
import { ChannelSortTabs } from "@/components/channel/ChannelSortTabs";
import {
  getChannelByUsername,
  getChannelVideos,
  getChannelCategories,
} from "@/lib/queries/channel";
import { formatViewCount } from "@/lib/format";

interface ChannelPageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    category?: string;
  }>;
}

export async function generateMetadata({
  params,
}: ChannelPageProps): Promise<Metadata> {
  const { username } = await params;
  const channel = await getChannelByUsername(username);

  if (!channel) {
    return { title: "Channel Not Found" };
  }

  const description = channel.bio
    ? channel.bio.slice(0, 160)
    : `Watch videos by ${channel.name}`;

  return {
    title: `${channel.name}'s Channel`,
    description,
    openGraph: {
      title: `${channel.name}'s Channel`,
      description,
      type: "profile",
      images: channel.avatarUrl ? [{ url: channel.avatarUrl }] : [],
    },
  };
}

export default async function ChannelPage({
  params,
  searchParams,
}: ChannelPageProps) {
  const { username } = await params;
  const channel = await getChannelByUsername(username);

  if (!channel) {
    notFound();
  }

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const sort = (sp.sort as "recent" | "popular" | "oldest") || "recent";
  const categorySlug = sp.category;

  const [{ videos, totalCount, totalPages }, categories] = await Promise.all([
    getChannelVideos(channel.id, { page, limit: 12, sort, categorySlug }),
    getChannelCategories(channel.id),
  ]);

  const initials = channel.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinDate = new Date(channel.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="-mt-6 sm:-mt-8">
      {/* Banner */}
      <div className="relative h-32 w-full overflow-hidden sm:h-48 lg:h-56">
        {channel.bannerUrl ? (
          <img
            src={channel.bannerUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900" />
        )}
      </div>

      {/* Channel Info */}
      <div className="px-1 py-6 sm:px-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          {/* Avatar */}
          <Avatar className="-mt-12 h-24 w-24 border-4 border-zinc-950 sm:-mt-16 sm:h-28 sm:w-28">
            <AvatarImage src={channel.avatarUrl ?? undefined} alt={channel.name} />
            <AvatarFallback className="bg-zinc-700 text-2xl text-zinc-200">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-zinc-50">
                  {channel.name}
                </h1>
                <p className="text-sm text-zinc-400">@{channel.username}</p>
              </div>
              {channel.role !== "VIEWER" && (
                <Badge variant="secondary" className="text-xs">
                  {channel.role}
                </Badge>
              )}
            </div>

            {/* Stats */}
            <div className="mt-2 flex items-center gap-4 text-sm text-zinc-400">
              <span className="flex items-center gap-1">
                <Video className="h-3.5 w-3.5" />
                {channel.videoCount} {channel.videoCount === 1 ? "video" : "videos"}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {formatViewCount(channel.totalViews)} views
              </span>
            </div>

            {/* Bio */}
            {channel.bio && (
              <p className="mt-3 max-w-2xl text-sm text-zinc-300">
                {channel.bio}
              </p>
            )}

            {/* Meta */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
              {channel.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {channel.location}
                </span>
              )}
              {channel.websiteUrl && (
                <a
                  href={channel.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:underline"
                >
                  <Globe className="h-3 w-3" />
                  {new URL(channel.websiteUrl).hostname}
                </a>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Joined {joinDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sort & Filter Bar */}
      <Suspense>
        <ChannelSortTabs
          username={username}
          currentSort={sort}
          currentCategory={categorySlug}
          categories={categories}
        />
      </Suspense>

      {/* Video Grid */}
      <div className="mt-6">
        {videos.length > 0 ? (
          <>
            <VideoGrid
              videos={videos.map((v) => ({
                id: v.id,
                title: v.title,
                slug: v.slug,
                thumbnailUrl: v.thumbnailUrl,
                duration: v.duration,
                viewCount: v.viewCount,
                publishedAt: v.publishedAt,
                createdAt: v.createdAt,
                creator: v.creator,
              }))}
            />
            {totalPages > 1 && (
              <div className="mt-8">
                <Suspense>
                  <PaginationControls
                    currentPage={page}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    basePath={`/channel/${username}`}
                    itemsPerPage={12}
                  />
                </Suspense>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Video className="mb-3 h-12 w-12 text-zinc-600" />
            <p className="text-lg font-medium text-zinc-400">No videos yet</p>
            <p className="mt-1 text-sm text-zinc-500">
              This channel hasn&apos;t published any videos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
