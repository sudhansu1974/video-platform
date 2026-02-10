import { Skeleton } from "@/components/ui/skeleton";

export default function AdminTagsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-72" />

      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <div className="border-b border-zinc-800 px-4 py-3">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-zinc-800 px-4 py-3 last:border-0"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-20" />
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
