import Link from "next/link";
import { Film } from "lucide-react";

interface SimpleVideoCardProps {
  video: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl: string | null;
  };
}

export function SimpleVideoCard({ video }: SimpleVideoCardProps) {
  return (
    <Link href={`/watch/${video.slug}`} className="group block">
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
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
      </div>

      {/* Title only */}
      <h3 className="mt-3 line-clamp-2 text-sm font-medium leading-tight text-zinc-50 transition-colors group-hover:text-blue-400">
        {video.title}
      </h3>
    </Link>
  );
}
