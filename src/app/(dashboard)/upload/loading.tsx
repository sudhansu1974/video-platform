import { Skeleton } from "@/components/ui/skeleton";

export default function UploadLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-6 rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        {/* Dropzone skeleton */}
        <Skeleton className="h-48 w-full rounded-lg" />
        {/* Title field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-9 w-full" />
        </div>
        {/* Description field */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-24 w-full" />
        </div>
        {/* Category + Tags */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        {/* Submit button */}
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
