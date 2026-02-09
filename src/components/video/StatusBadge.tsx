import type { VideoStatus } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: VideoStatus;
  className?: string;
}

const statusConfig: Record<
  VideoStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-zinc-700 text-zinc-200",
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  PUBLISHED: {
    label: "Published",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  UNLISTED: {
    label: "Unlisted",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
