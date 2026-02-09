"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { VideoStatus } from "@/generated/prisma/client";

interface VideoListFiltersProps {
  currentStatus?: VideoStatus;
  currentSort: string;
  currentOrder: string;
  currentSearch?: string;
}

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Draft", value: "DRAFT" },
  { label: "Unlisted", value: "UNLISTED" },
  { label: "Rejected", value: "REJECTED" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "createdAt-desc" },
  { label: "Oldest", value: "createdAt-asc" },
  { label: "Most Views", value: "viewCount-desc" },
  { label: "Title A-Z", value: "title-asc" },
  { label: "Title Z-A", value: "title-desc" },
];

export function VideoListFilters({
  currentStatus,
  currentSort,
  currentOrder,
  currentSearch,
}: VideoListFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(currentSearch ?? "");

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset to page 1 when filtering
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  const activeSort = `${currentSort}-${currentOrder}`;

  return (
    <div className="space-y-4">
      {/* Status tabs */}
      <div className="flex flex-wrap gap-1">
        {STATUS_TABS.map((tab) => {
          const isActive =
            tab.value === "all" ? !currentStatus : currentStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() =>
                updateParams({
                  status: tab.value === "all" ? undefined : tab.value,
                })
              }
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-500/10 text-blue-400"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateParams({ search: searchValue || undefined });
              }
            }}
            placeholder="Search videos..."
            className="border-zinc-700 bg-zinc-900 pl-9"
          />
        </div>
        <Select
          value={activeSort}
          onValueChange={(value) => {
            const [sort, order] = value.split("-");
            updateParams({ sort, order });
          }}
        >
          <SelectTrigger className="w-full border-zinc-700 bg-zinc-900 sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
