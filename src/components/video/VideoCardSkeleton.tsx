import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface VideoCardSkeletonProps {
  className?: string;
}

export function VideoCardSkeleton({ className }: VideoCardSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="aspect-video w-full rounded-lg" />
      <div className="flex gap-3">
        <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function VideoGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
}
