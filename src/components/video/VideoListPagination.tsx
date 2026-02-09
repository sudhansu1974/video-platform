"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoListPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export function VideoListPagination({
  currentPage,
  totalPages,
  totalCount,
}: VideoListPaginationProps) {
  const searchParams = useSearchParams();

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `/dashboard/videos?${params.toString()}`;
  }

  const start = (currentPage - 1) * 10 + 1;
  const end = Math.min(currentPage * 10, totalCount);

  // Build page numbers to show (max 5 around current)
  const pages: number[] = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-zinc-500">
        Showing {start}\u2013{end} of {totalCount} videos
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage <= 1}
          asChild={currentPage > 1}
        >
          {currentPage > 1 ? (
            <Link href={buildHref(currentPage - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : (
            <span>
              <ChevronLeft className="h-4 w-4" />
            </span>
          )}
        </Button>

        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "ghost"}
            size="icon"
            className={cn(
              "h-8 w-8 text-sm",
              page === currentPage && "bg-blue-600 text-white hover:bg-blue-700"
            )}
            asChild={page !== currentPage}
          >
            {page !== currentPage ? (
              <Link href={buildHref(page)}>{page}</Link>
            ) : (
              <span>{page}</span>
            )}
          </Button>
        ))}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage >= totalPages}
          asChild={currentPage < totalPages}
        >
          {currentPage < totalPages ? (
            <Link href={buildHref(currentPage + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span>
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
