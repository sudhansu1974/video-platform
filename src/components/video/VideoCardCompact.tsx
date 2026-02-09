import Link from "next/link";
import { Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration, formatViewCount, formatRelativeTime } from "@/lib/format";

interface VideoCardCompactProps {
  video: {
    slug: string;
    title: string;
    thumbnailUrl?: string | null;
    duration?: number | null;
    viewCount: number;
    createdAt: Date | string;
    publishedAt?: Date | string | null;
    creator: {
      name: string;
      username: string;
    };
  };
  className?: string;
}

export function VideoCardCompact({ video, className }: VideoCardCompactProps) {
  return (
    <Link
      href={`/watch/${video.slug}`}
      className={cn(
        "group flex gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-800",
        className
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-[168px] flex-shrink-0 overflow-hidden rounded-md bg-zinc-800">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Film className="h-6 w-6 text-zinc-600" />
          </div>
        )}
        {video.duration != null && video.duration > 0 && (
          <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white">
            {formatDuration(video.duration)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1 py-0.5">
        <h4 className="line-clamp-2 text-sm font-medium leading-tight text-zinc-50">
          {video.title}
        </h4>
        <p className="mt-1.5 text-xs text-zinc-400">{video.creator.name}</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {formatViewCount(video.viewCount)} views
          {" · "}
          {formatRelativeTime(video.publishedAt ?? video.createdAt)}
        </p>
      </div>
    </Link>
  );
}
