import { Skeleton } from "@/components/ui/skeleton";

export default function AdminVideosLoading() {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 flex-1 sm:min-w-[200px]" />
        <Skeleton className="h-10 w-[150px]" />
        <Skeleton className="h-10 w-[160px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <div className="border-b border-zinc-800 px-4 py-3">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-zinc-800 px-4 py-3 last:border-0"
          >
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-9 w-16 rounded" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}
