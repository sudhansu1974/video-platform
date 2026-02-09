"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Search, Home, Compass, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface MobileMenuProps {
  categories: Category[];
}

export function MobileMenu({ categories }: MobileMenuProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => setMounted(true), []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      setOpen(false);
      setQuery("");
    }
  }

  // Render a plain button during SSR to avoid Radix ID hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="sm:hidden">
        <Menu className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="sm:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-zinc-900 p-0">
        <SheetHeader className="border-b border-zinc-800 p-4">
          <SheetTitle className="text-left text-lg font-bold text-zinc-50">
            VideoPlatform
          </SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="border-b border-zinc-800 p-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              type="search"
              placeholder="Search videos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 border-zinc-700 bg-zinc-800 pl-9 text-sm text-zinc-200 placeholder:text-zinc-500"
            />
          </form>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 p-4">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-50"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          <Link
            href="/browse"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-50"
          >
            <Compass className="h-4 w-4" />
            Browse
          </Link>
        </nav>

        {/* Categories */}
        <div className="border-t border-zinc-800 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <FolderOpen className="h-3.5 w-3.5" />
            Categories
          </h3>
          <nav className="space-y-1">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-50"
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
