import { Film } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoThumbnailProps {
  thumbnailUrl?: string | null;
  title: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-[120px]",
  md: "w-[240px]",
  lg: "w-full",
};

export function VideoThumbnail({
  thumbnailUrl,
  title,
  size = "md",
  className,
}: VideoThumbnailProps) {
  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden rounded-lg bg-zinc-800",
        sizeClasses[size],
        className
      )}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={title}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Film className="h-8 w-8 text-zinc-600" />
        </div>
      )}
    </div>
  );
}
