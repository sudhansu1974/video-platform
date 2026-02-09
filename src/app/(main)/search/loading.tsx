import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="space-y-6">
      {/* Search input skeleton */}
      <Skeleton className="h-12 w-full rounded-xl" />

      {/* Results summary skeleton */}
      <Skeleton className="h-5 w-64" />

      {/* Filters skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>

      {/* Result card skeletons */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 rounded-lg p-2 sm:gap-5"
          >
            {/* Thumbnail */}
            <Skeleton className="aspect-video w-40 flex-shrink-0 rounded-lg sm:w-64 md:w-80" />
            {/* Info */}
            <div className="flex-1 space-y-3 py-0.5">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="hidden h-4 w-full sm:block" />
              <Skeleton className="hidden h-4 w-2/3 sm:block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
