import Link from "next/link";
import { UserX, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChannelNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <UserX className="mb-4 h-16 w-16 text-zinc-600" />
      <h1 className="text-2xl font-bold text-zinc-50">Channel not found</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-400">
        This user doesn&apos;t exist or hasn&apos;t created a channel yet.
      </p>
      <div className="mt-6">
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Browse Videos
          </Button>
        </Link>
      </div>
    </div>
  );
}
