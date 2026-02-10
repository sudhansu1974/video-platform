"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AdminUsersFilters() {
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

  function handleRoleChange(value: string) {
    const qs = createQueryString({
      role: value === "ALL" ? null : value,
    });
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleSortChange(value: string) {
    const [sort, order] = value.split("-");
    const qs = createQueryString({ sort, order });
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const currentRole = searchParams.get("role") || "ALL";
  const currentSort = `${searchParams.get("sort") || "createdAt"}-${searchParams.get("order") || "desc"}`;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form onSubmit={handleSearch} className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Search users..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="border-zinc-700 bg-zinc-800 pl-9 text-zinc-200 placeholder:text-zinc-500"
        />
      </form>
      <Select value={currentRole} onValueChange={handleRoleChange}>
        <SelectTrigger className="w-[140px] border-zinc-700 bg-zinc-800 text-zinc-200">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent className="border-zinc-700 bg-zinc-900">
          <SelectItem value="ALL">All Roles</SelectItem>
          <SelectItem value="VIEWER">Viewer</SelectItem>
          <SelectItem value="CREATOR">Creator</SelectItem>
          <SelectItem value="STUDIO">Studio</SelectItem>
          <SelectItem value="ADMIN">Admin</SelectItem>
        </SelectContent>
      </Select>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[150px] border-zinc-700 bg-zinc-800 text-zinc-200">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent className="border-zinc-700 bg-zinc-900">
          <SelectItem value="createdAt-desc">Newest</SelectItem>
          <SelectItem value="createdAt-asc">Oldest</SelectItem>
          <SelectItem value="username-asc">Username A-Z</SelectItem>
          <SelectItem value="name-asc">Name A-Z</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
