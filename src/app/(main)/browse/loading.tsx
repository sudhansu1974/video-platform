import { Skeleton } from "@/components/ui/skeleton";
import { VideoGridSkeleton } from "@/components/video/VideoCardSkeleton";

export default function BrowseLoading() {
  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      {/* Category pills */}
      <div className="flex gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 flex-shrink-0 rounded-full" />
        ))}
      </div>

      {/* Sort tabs */}
      <Skeleton className="h-10 w-48 rounded-lg" />

      {/* Grid */}
      <VideoGridSkeleton count={24} />

      {/* Pagination */}
      <div className="flex justify-center">
        <Skeleton className="h-8 w-64" />
      </div>
    </div>
  );
}
