"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface ChannelSortTabsProps {
  username: string;
  currentSort: string;
  currentCategory?: string;
  categories: { id: string; name: string; slug: string; videoCount: number }[];
}

const SORT_OPTIONS = [
  { value: "recent", label: "Latest" },
  { value: "popular", label: "Popular" },
  { value: "oldest", label: "Oldest" },
] as const;

export function ChannelSortTabs({
  username,
  currentSort,
  currentCategory,
  categories,
}: ChannelSortTabsProps) {
  const searchParams = useSearchParams();

  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    // Always reset page when changing sort/category
    params.delete("page");
    for (const [key, value] of Object.entries(overrides)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    const qs = params.toString();
    return qs ? `/channel/${username}?${qs}` : `/channel/${username}`;
  }

  return (
    <div className="space-y-3 border-b border-zinc-800 pb-4">
      {/* Sort tabs */}
      <div className="flex gap-1">
        {SORT_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={buildHref({ sort: opt.value === "recent" ? undefined : opt.value })}
            scroll={false}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              currentSort === opt.value
                ? "bg-zinc-50 text-zinc-900"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            )}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={buildHref({ category: undefined })}
            scroll={false}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              !currentCategory
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
            )}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={buildHref({ category: cat.slug })}
              scroll={false}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                currentCategory === cat.slug
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
              )}
            >
              {cat.name} ({cat.videoCount})
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
