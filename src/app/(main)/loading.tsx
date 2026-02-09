import { Skeleton } from "@/components/ui/skeleton";
import { VideoGridSkeleton } from "@/components/video/VideoCardSkeleton";

export default function HomeLoading() {
  return (
    <div className="space-y-10">
      {/* Category Pills Skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 flex-shrink-0 rounded-full" />
        ))}
      </div>

      {/* Trending Section */}
      <section className="space-y-4">
        <Skeleton className="h-7 w-32" />
        <VideoGridSkeleton count={8} />
      </section>

      {/* Latest Section */}
      <section className="space-y-4">
        <Skeleton className="h-7 w-24" />
        <VideoGridSkeleton count={8} />
      </section>
    </div>
  );
}
