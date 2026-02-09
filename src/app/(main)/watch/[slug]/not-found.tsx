import Link from "next/link";
import { Film, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WatchNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <Film className="mb-4 h-16 w-16 text-zinc-600" />
      <h1 className="text-2xl font-bold text-zinc-50">Video not found</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-400">
        This video may have been deleted, set to private, or the link might be
        incorrect.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Browse Videos
          </Button>
        </Link>
        <Link href="/search">
          <Button variant="outline" className="gap-2">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </Link>
      </div>
    </div>
  );
}
