import Link from "next/link";
import { Film } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDuration, formatViewCount, formatRelativeTime } from "@/lib/format";
import { highlightSearchTerms, truncateWithContext } from "@/lib/search-utils";

interface SearchResultCardProps {
  video: {
    id: string;
    slug: string;
    title: string;
    description?: string | null;
    thumbnailUrl?: string | null;
    duration?: number | null;
    viewCount: number;
    publishedAt?: Date | string | null;
    createdAt: Date | string;
    creator: {
      name: string;
      username: string;
      avatarUrl?: string | null;
    };
    category?: {
      name: string;
      slug: string;
    } | null;
  };
  query: string;
}

export function SearchResultCard({ video, query }: SearchResultCardProps) {
  const initials = video.creator.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const descriptionSnippet = video.description
    ? truncateWithContext(video.description, query)
    : null;

  return (
    <Link
      href={`/watch/${video.slug}`}
      className="group flex gap-4 rounded-lg p-2 transition-colors hover:bg-zinc-800/50 sm:gap-5"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800 sm:w-64 md:w-80">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Film className="h-8 w-8 text-zinc-600" />
          </div>
        )}
        {video.duration != null && video.duration > 0 && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
            {formatDuration(video.duration)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 py-0.5">
        <h3 className="line-clamp-2 text-base font-medium leading-snug text-zinc-50">
          {highlightSearchTerms(video.title, query)}
        </h3>

        <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-500">
          <span>{formatViewCount(video.viewCount)} views</span>
          <span>·</span>
          <span>
            {formatRelativeTime(video.publishedAt ?? video.createdAt)}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage
              src={video.creator.avatarUrl ?? undefined}
              alt={video.creator.name}
            />
            <AvatarFallback className="bg-zinc-700 text-[10px] text-zinc-200">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-zinc-400">{video.creator.name}</span>
        </div>

        {descriptionSnippet && (
          <p className="mt-2 hidden text-sm leading-relaxed text-zinc-400 sm:line-clamp-2">
            {highlightSearchTerms(descriptionSnippet, query)}
          </p>
        )}

        {video.category && (
          <Badge
            variant="secondary"
            className="mt-2 bg-zinc-800 text-xs text-zinc-400 hover:bg-zinc-700"
          >
            {video.category.name}
          </Badge>
        )}
      </div>
    </Link>
  );
}
