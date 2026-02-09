import { Skeleton } from "@/components/ui/skeleton";
import { VideoGridSkeleton } from "@/components/video/VideoCardSkeleton";

export default function TagLoading() {
  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-1 h-3 w-20" />
      </div>

      {/* Sort tabs */}
      <Skeleton className="h-10 w-48 rounded-lg" />

      {/* Grid */}
      <VideoGridSkeleton count={12} />

      {/* Pagination */}
      <div className="flex justify-center">
        <Skeleton className="h-8 w-64" />
      </div>
    </div>
  );
}
