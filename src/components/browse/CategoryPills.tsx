"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryPillsProps {
  categories: Category[];
}

export function CategoryPills({ categories }: CategoryPillsProps) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Auto-detect active category from URL: /category/film → "film"
  const match = pathname.match(/^\/category\/([^/]+)/);
  const activeSlug = match ? match[1] : null;
  // "All" is active on homepage and browse (any page without a specific category)
  const allActive = !activeSlug;

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      observer.disconnect();
    };
  }, [checkScroll]);

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {/* Left arrow + fade */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 z-10 flex h-full items-center bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent pr-4">
          <button
            onClick={() => scroll("left")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-50"
            aria-label="Scroll categories left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Scrollable pills */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex gap-2 overflow-x-auto"
      >
        <Link
          href="/"
          className={cn(
            "flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            allActive
              ? "bg-zinc-50 text-zinc-900"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          )}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className={cn(
              "flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeSlug === cat.slug
                ? "bg-zinc-50 text-zinc-900"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            )}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Right arrow + fade */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 z-10 flex h-full items-center bg-gradient-to-l from-zinc-950 via-zinc-950/80 to-transparent pl-4">
          <button
            onClick={() => scroll("right")}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-50"
            aria-label="Scroll categories right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
