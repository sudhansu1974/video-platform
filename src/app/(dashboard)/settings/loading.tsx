import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-64" />
      </div>

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

      {/* Avatar skeleton */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <Skeleton className="h-5 w-16" />
        <Separator className="my-4 bg-zinc-800" />
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-32 rounded-md" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>

      {/* Banner skeleton */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <Skeleton className="h-5 w-32" />
        <Separator className="my-4 bg-zinc-800" />
        <Skeleton className="aspect-[5/1] w-full rounded-lg" />
      </div>

      {/* Profile form skeleton */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <Skeleton className="h-5 w-16" />
        <Separator className="my-4 bg-zinc-800" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <Skeleton className="h-9 w-28" />
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
