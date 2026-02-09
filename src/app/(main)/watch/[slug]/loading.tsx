import { Skeleton } from "@/components/ui/skeleton";

export default function WatchLoading() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Left Column */}
      <div className="min-w-0 flex-1 space-y-4">
        {/* Player skeleton */}
        <Skeleton className="aspect-video w-full rounded-lg" />

        {/* Title */}
        <Skeleton className="h-7 w-3/4" />

        {/* Meta */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>

        {/* Separator */}
        <Skeleton className="h-px w-full" />

        {/* Creator card skeleton */}
        <div className="flex items-center gap-3 rounded-lg bg-zinc-900 p-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        {/* Description skeleton */}
        <div className="space-y-2 rounded-lg bg-zinc-900 p-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>

      {/* Right Column */}
      <aside className="w-full shrink-0 lg:w-[380px] xl:w-[420px]">
        <Skeleton className="mb-4 h-6 w-36" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-2">
              <Skeleton className="aspect-video w-[168px] rounded-md" />
              <div className="flex-1 space-y-2 py-0.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
