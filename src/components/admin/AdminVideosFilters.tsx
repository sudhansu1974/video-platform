"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminVideosFiltersProps {
  categories: { id: string; name: string }[];
}

export function AdminVideosFilters({ categories }: AdminVideosFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") || ""
  );

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      params.delete("page");
      return params.toString();
    },
    [searchParams]
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const qs = createQueryString({ search: searchValue || null });
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleStatusChange(value: string) {
    const qs = createQueryString({
      status: value === "ALL" ? null : value,
    });
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleCategoryChange(value: string) {
    const qs = createQueryString({
      category: value === "ALL" ? null : value,
    });
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleSortChange(value: string) {
    const [sort, order] = value.split("-");
    const qs = createQueryString({ sort, order });
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const currentStatus = searchParams.get("status") || "ALL";
  const currentCategory = searchParams.get("category") || "ALL";
  const currentSort = `${searchParams.get("sort") || "createdAt"}-${searchParams.get("order") || "desc"}`;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <form onSubmit={handleSearch} className="relative flex-1 sm:min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Search videos..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="border-zinc-700 bg-zinc-800 pl-9 text-zinc-200 placeholder:text-zinc-500"
        />
      </form>
      <Select value={currentStatus} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-[150px] border-zinc-700 bg-zinc-800 text-zinc-200">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="border-zinc-700 bg-zinc-900">
          <SelectItem value="ALL">All Status</SelectItem>
          <SelectItem value="PUBLISHED">Published</SelectItem>
          <SelectItem value="PROCESSING">Processing</SelectItem>
          <SelectItem value="DRAFT">Draft</SelectItem>
          <SelectItem value="UNLISTED">Unlisted</SelectItem>
          <SelectItem value="REJECTED">Rejected</SelectItem>
        </SelectContent>
      </Select>
      <Select value={currentCategory} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-[160px] border-zinc-700 bg-zinc-800 text-zinc-200">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent className="border-zinc-700 bg-zinc-900">
          <SelectItem value="ALL">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[150px] border-zinc-700 bg-zinc-800 text-zinc-200">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent className="border-zinc-700 bg-zinc-900">
          <SelectItem value="createdAt-desc">Newest</SelectItem>
          <SelectItem value="createdAt-asc">Oldest</SelectItem>
          <SelectItem value="title-asc">Title A-Z</SelectItem>
          <SelectItem value="viewCount-desc">Most Views</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
