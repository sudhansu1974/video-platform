"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AdminTagsFilters() {
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

  return (
    <form onSubmit={handleSearch} className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <Input
        placeholder="Search tags..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="border-zinc-700 bg-zinc-800 pl-9 text-zinc-200 placeholder:text-zinc-500"
      />
    </form>
  );
}
