import { Film } from "lucide-react";
import { VideoCard } from "@/components/video/VideoCard";
import { cn } from "@/lib/utils";

interface VideoGridVideo {
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
}

interface VideoGridProps {
  videos: VideoGridVideo[];
  className?: string;
  emptyMessage?: string;
}

export function VideoGrid({ videos, className, emptyMessage = "No videos found" }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
        <Film className="mb-4 h-12 w-12" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
