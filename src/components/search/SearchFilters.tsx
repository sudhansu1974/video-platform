"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SearchFiltersProps {
  currentFilters: {
    sort?: string;
    duration?: string;
    uploadDate?: string;
    category?: string;
  };
  categories: Array<{ id: string; name: string; slug: string }>;
  query: string;
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "recent", label: "Most Recent" },
  { value: "popular", label: "Most Viewed" },
] as const;

const DURATION_OPTIONS = [
  { value: "any", label: "Any Duration" },
  { value: "short", label: "Short (< 4 min)" },
  { value: "medium", label: "Medium (4-20 min)" },
  { value: "long", label: "Long (> 20 min)" },
] as const;

const UPLOAD_DATE_OPTIONS = [
  { value: "any", label: "Any Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
] as const;

export function SearchFilters({
  currentFilters,
  categories,
  query,
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeFilterCount = [
    currentFilters.sort && currentFilters.sort !== "relevance",
    currentFilters.duration,
    currentFilters.uploadDate,
    currentFilters.category,
  ].filter(Boolean).length;

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "any" || value === "relevance" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // Reset to page 1 when filters change
    params.delete("page");
    router.push(`/search?${params.toString()}`);
  }

  function clearAllFilters() {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm text-zinc-400">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </div>

        <Select
          value={currentFilters.sort || "relevance"}
          onValueChange={(v) => updateFilter("sort", v)}
        >
          <SelectTrigger className="h-8 w-auto min-w-[130px] border-zinc-700 bg-zinc-800 text-sm text-zinc-200">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="border-zinc-700 bg-zinc-900">
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.uploadDate || "any"}
          onValueChange={(v) => updateFilter("uploadDate", v)}
        >
          <SelectTrigger className="h-8 w-auto min-w-[130px] border-zinc-700 bg-zinc-800 text-sm text-zinc-200">
            <SelectValue placeholder="Upload date" />
          </SelectTrigger>
          <SelectContent className="border-zinc-700 bg-zinc-900">
            {UPLOAD_DATE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.duration || "any"}
          onValueChange={(v) => updateFilter("duration", v)}
        >
          <SelectTrigger className="h-8 w-auto min-w-[130px] border-zinc-700 bg-zinc-800 text-sm text-zinc-200">
            <SelectValue placeholder="Duration" />
          </SelectTrigger>
          <SelectContent className="border-zinc-700 bg-zinc-900">
            {DURATION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {categories.length > 0 && (
          <Select
            value={currentFilters.category || "any"}
            onValueChange={(v) => updateFilter("category", v)}
          >
            <SelectTrigger className="h-8 w-auto min-w-[130px] border-zinc-700 bg-zinc-800 text-sm text-zinc-200">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-900">
              <SelectItem value="any">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-8 gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
