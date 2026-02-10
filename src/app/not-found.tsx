import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <FileQuestion className="mb-6 h-16 w-16 text-zinc-600" />
      <h1 className="text-3xl font-bold text-zinc-50">Page not found</h1>
      <p className="mt-3 max-w-md text-center text-sm text-zinc-400">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/browse">Browse Videos</Link>
        </Button>
      </div>
    </div>
  );
}
