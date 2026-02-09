import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CategoryNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <FolderOpen className="mb-4 h-12 w-12 text-zinc-500" />
      <h2 className="mb-2 text-xl font-semibold text-zinc-50">Category not found</h2>
      <p className="mb-6 text-sm text-zinc-400">
        The category you&apos;re looking for doesn&apos;t exist.
      </p>
      <Button asChild variant="outline">
        <Link href="/browse">Browse all videos</Link>
      </Button>
    </div>
  );
}
