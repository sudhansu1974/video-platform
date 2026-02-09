import Link from "next/link";
import { Hash } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TagNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <Hash className="mb-4 h-12 w-12 text-zinc-500" />
      <h2 className="mb-2 text-xl font-semibold text-zinc-50">Tag not found</h2>
      <p className="mb-6 text-sm text-zinc-400">
        The tag you&apos;re looking for doesn&apos;t exist.
      </p>
      <Button asChild variant="outline">
        <Link href="/browse">Browse all videos</Link>
      </Button>
    </div>
  );
}
