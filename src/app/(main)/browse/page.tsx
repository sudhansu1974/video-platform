import { Suspense } from "react";
import type { Metadata } from "next";
import { getBrowseVideos } from "@/lib/queries/browse";
import { VideoGrid } from "@/components/video/VideoGrid";
import { PaginationControls } from "@/components/browse/PaginationControls";
import { BrowseSortTabs } from "@/components/browse/BrowseSortTabs";

export const metadata: Metadata = {
  title: "Browse Videos | VideoPlatform",
  description: "Browse and discover videos across all categories",
};

interface BrowsePageProps {
  searchParams: Promise<{ page?: string; sort?: string; category?: string; tag?: string }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const sort = params.sort === "popular" ? "popular" : "latest";
  const categorySlug = params.category;
  const tagSlug = params.tag;

  const result = await getBrowseVideos({ page, sort, categorySlug, tagSlug });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Browse Videos</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Discover videos from creators across the platform
        </p>
      </div>

      {/* Sort */}
      <Suspense>
        <BrowseSortTabs currentSort={sort} />
      </Suspense>

      {/* Video Grid */}
      <VideoGrid videos={result.videos} emptyMessage="No videos found matching your filters" />

      {/* Pagination */}
      <Suspense>
        <PaginationControls
          currentPage={page}
          totalPages={result.totalPages}
          totalCount={result.totalCount}
          basePath="/browse"
        />
      </Suspense>
    </div>
  );
}
