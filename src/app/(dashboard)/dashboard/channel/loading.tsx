import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function ChannelSettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      {/* Banner skeleton */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-1 h-3 w-52" />
        <Separator className="my-4 bg-zinc-800" />
        <Skeleton className="aspect-[5/1] w-full rounded-lg" />
      </div>

      {/* Avatar skeleton */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-1 h-3 w-44" />
        <Separator className="my-4 bg-zinc-800" />
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-32 rounded-md" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>

      {/* Channel Info skeleton */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <Skeleton className="h-5 w-28" />
        <Separator className="my-4 bg-zinc-800" />
        <div className="space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Channel Content skeleton */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <Skeleton className="h-5 w-36" />
        <Separator className="my-4 bg-zinc-800" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      </div>

      {/* Customization skeleton */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <Skeleton className="h-5 w-32" />
        <Separator className="my-4 bg-zinc-800" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
