import Link from "next/link";
import { Film } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDuration, formatViewCount, formatRelativeTime } from "@/lib/format";

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl: string | null;
    duration: number | null;
    viewCount: number;
    publishedAt: Date | null;
    createdAt: Date;
    creator: {
      name: string;
      username: string;
      avatarUrl: string | null;
    };
  };
  className?: string;
}

export function VideoCard({ video, className }: VideoCardProps) {
  const initials = video.creator.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link
      href={`/watch/${video.slug}`}
      className={cn("group block space-y-3", className)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-lg bg-zinc-800 transition-transform duration-200 group-hover:scale-[1.02]">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Film className="h-10 w-10 text-zinc-600" />
          </div>
        )}
        {/* Duration badge */}
        {video.duration != null && video.duration > 0 && (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
            {formatDuration(video.duration)}
          </span>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
      </div>

      {/* Info */}
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={video.creator.avatarUrl ?? undefined} alt={video.creator.name} />
          <AvatarFallback className="bg-zinc-700 text-xs text-zinc-200">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-medium leading-tight text-zinc-50">
            {video.title}
          </h3>
          <p className="mt-1 text-xs text-zinc-400">{video.creator.name}</p>
          <p className="text-xs text-zinc-500">
            {formatViewCount(video.viewCount)} views
            {" · "}
            {formatRelativeTime(video.publishedAt ?? video.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
