import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-52" />
      </div>

      {/* Channel link skeleton */}
      <Skeleton className="h-16 w-full rounded-lg" />

      {/* Account skeleton */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <Skeleton className="h-5 w-20" />
        <Separator className="my-4 bg-zinc-800" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>

      {/* Password skeleton */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <Skeleton className="h-5 w-36" />
        <Separator className="my-4 bg-zinc-800" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
    </div>
  );
}
