import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CreatorCardProps {
  creator: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string | null;
    videoCount: number;
  };
}

export function CreatorCard({ creator }: CreatorCardProps) {
  const initials = creator.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link
      href={`/channel/${creator.username}`}
      className="flex items-center gap-3 rounded-lg bg-zinc-900 p-3 transition-colors hover:bg-zinc-800"
    >
      <Avatar className="h-12 w-12">
        <AvatarImage
          src={creator.avatarUrl ?? undefined}
          alt={creator.name}
        />
        <AvatarFallback className="bg-zinc-700 text-sm text-zinc-200">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-50">
          {creator.name}
        </p>
        <p className="text-xs text-zinc-400">@{creator.username}</p>
        <p className="text-xs text-zinc-500">
          {creator.videoCount} {creator.videoCount === 1 ? "video" : "videos"}
        </p>
      </div>
    </Link>
  );
}
