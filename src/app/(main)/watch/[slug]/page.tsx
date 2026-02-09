import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { VideoCardCompact } from "@/components/video/VideoCardCompact";
import { ShareButton } from "@/components/video/ShareButton";
import { VideoDescription } from "@/components/video/VideoDescription";
import { ViewTracker } from "@/components/video/ViewTracker";
import { getVideoBySlug, getRelatedVideos, getCreatorInfo } from "@/lib/queries/watch";
import { formatViewCount, formatRelativeTime } from "@/lib/format";
import { toPublicUrl } from "@/lib/url";

interface WatchPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: WatchPageProps): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);

  if (!video) {
    return { title: "Video Not Found" };
  }

  const description = video.description
    ? video.description.slice(0, 160)
    : `Watch ${video.title} on our platform`;

  return {
    title: video.title,
    description,
    openGraph: {
      title: video.title,
      description,
      type: "video.other",
      images: video.thumbnailUrl
        ? [{ url: video.thumbnailUrl, width: 1280, height: 720 }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: video.title,
      description,
      images: video.thumbnailUrl ? [video.thumbnailUrl] : [],
    },
  };
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);

  if (!video) {
    notFound();
  }

  const tagIds = video.videoTags.map((vt) => vt.tagId);

  const [relatedVideos, creatorInfo] = await Promise.all([
    getRelatedVideos(video.id, {
      categoryId: video.categoryId,
      tagIds,
      userId: video.userId,
      limit: 12,
    }),
    getCreatorInfo(video.userId),
  ]);

  // Determine video source — prefer HLS, fall back to processed/raw file
  const videoSrc = toPublicUrl(video.hlsUrl || video.fileUrl);

  const creatorInitials = video.creator.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* View tracker (silent, fire-and-forget) */}
      <ViewTracker videoId={video.id} />

      {/* ─── Left Column: Player + Video Info ─── */}
      <div className="min-w-0 flex-1">
        {/* Video Player */}
        <VideoPlayer
          src={videoSrc}
          poster={video.thumbnailUrl ?? undefined}
          title={video.title}
        />

        {/* Video Info */}
        <div className="mt-4 space-y-4">
          {/* Title */}
          <h1 className="text-xl font-bold text-zinc-50 sm:text-2xl">
            {video.title}
          </h1>

          {/* Meta + Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-400">
              {formatViewCount(video.viewCount)} views
              {" · "}
              {formatRelativeTime(video.publishedAt ?? video.createdAt)}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <ShareButton videoSlug={video.slug} videoTitle={video.title} />

              {video.category && (
                <Link href={`/category/${video.category.slug}`}>
                  <Badge variant="secondary">{video.category.name}</Badge>
                </Link>
              )}

              {video.videoTags.map((vt) => (
                <Link key={vt.tagId} href={`/search?tag=${vt.tag.slug}`}>
                  <Badge variant="outline">{vt.tag.name}</Badge>
                </Link>
              ))}
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Creator Info */}
          <div className="flex items-center justify-between gap-4 rounded-lg bg-zinc-900 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={video.creator.avatarUrl ?? undefined}
                  alt={video.creator.name}
                />
                <AvatarFallback className="bg-zinc-700 text-sm text-zinc-200">
                  {creatorInitials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-zinc-50">
                  {video.creator.name}
                </p>
                {creatorInfo && (
                  <p className="text-xs text-zinc-400">
                    {creatorInfo.videoCount}{" "}
                    {creatorInfo.videoCount === 1 ? "video" : "videos"}
                  </p>
                )}
              </div>
            </div>
            <Link href={`/channel/${video.creator.username}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Channel
              </Button>
            </Link>
          </div>

          {/* Description */}
          {video.description && (
            <VideoDescription description={video.description} />
          )}
        </div>
      </div>

      {/* ─── Right Column: Related Videos ─── */}
      <aside className="w-full shrink-0 lg:w-[380px] xl:w-[420px]">
        <div className="sticky top-28">
          <h2 className="mb-4 text-lg font-semibold text-zinc-50">
            Related Videos
          </h2>
          {relatedVideos.length > 0 ? (
            <div className="space-y-1">
              {relatedVideos.map((rv) => (
                <VideoCardCompact
                  key={rv.id}
                  video={{
                    slug: rv.slug,
                    title: rv.title,
                    thumbnailUrl: rv.thumbnailUrl,
                    duration: rv.duration,
                    viewCount: rv.viewCount,
                    createdAt: rv.createdAt,
                    publishedAt: rv.publishedAt,
                    creator: {
                      name: rv.creator.name,
                      username: rv.creator.username,
                    },
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No related videos found</p>
          )}
        </div>
      </aside>
    </div>
  );
}
