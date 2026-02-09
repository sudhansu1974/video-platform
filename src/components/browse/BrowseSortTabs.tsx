"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface BrowseSortTabsProps {
  currentSort: "latest" | "popular";
}

export function BrowseSortTabs({ currentSort }: BrowseSortTabsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildHref(sort: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    params.delete("page");
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
      <Link
        href={buildHref("latest")}
        className={cn(
          "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
          currentSort === "latest"
            ? "bg-zinc-800 text-zinc-50"
            : "text-zinc-400 hover:text-zinc-200"
        )}
      >
        Latest
      </Link>
      <Link
        href={buildHref("popular")}
        className={cn(
          "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
          currentSort === "popular"
            ? "bg-zinc-800 text-zinc-50"
            : "text-zinc-400 hover:text-zinc-200"
        )}
      >
        Popular
      </Link>
    </div>
  );
}
