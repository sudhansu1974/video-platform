import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUserDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />

      {/* Profile Card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-2 h-7 w-12" />
          </div>
        ))}
      </div>

      {/* Videos Table */}
      <div className="rounded-lg border border-zinc-800">
        <div className="border-b border-zinc-800 px-6 py-4">
          <Skeleton className="h-6 w-28" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-zinc-800 px-6 py-3 last:border-0"
          >
            <Skeleton className="h-9 w-16 rounded" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
