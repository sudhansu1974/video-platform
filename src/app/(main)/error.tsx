"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MainError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
      <h2 className="mb-2 text-xl font-semibold text-zinc-50">Something went wrong</h2>
      <p className="mb-6 text-sm text-zinc-400">
        An unexpected error occurred. Please try again.
      </p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  );
}
