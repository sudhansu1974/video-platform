"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UploadError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="rounded-full bg-red-500/10 p-4">
        <AlertCircle className="h-8 w-8 text-red-400" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-zinc-50">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-md text-sm text-zinc-400">
        {error.message || "An unexpected error occurred while loading the upload page."}
      </p>
      <Button onClick={reset} className="mt-6">
        Try Again
      </Button>
    </div>
  );
}
