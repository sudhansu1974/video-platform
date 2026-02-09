import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTagBySlug, getTagVideos } from "@/lib/queries/browse";
import { VideoGrid } from "@/components/video/VideoGrid";
import { PaginationControls } from "@/components/browse/PaginationControls";
import { BrowseSortTabs } from "@/components/browse/BrowseSortTabs";

interface TagPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return { title: "Tag Not Found" };
  return {
    title: `#${tag.name} Videos | VideoPlatform`,
    description: `Browse videos tagged with #${tag.name} on VideoPlatform`,
  };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const sort = sp.sort === "popular" ? "popular" : "latest";

  const result = await getTagVideos(tag.id, { page, sort });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">#{tag.name}</h1>
        <p className="mt-1 text-xs text-zinc-500">
          {tag._count.videoTags} {tag._count.videoTags === 1 ? "video" : "videos"}
        </p>
      </div>

      <Suspense>
        <BrowseSortTabs currentSort={sort} />
      </Suspense>

      <VideoGrid videos={result.videos} emptyMessage="No videos with this tag yet" />

      <Suspense>
        <PaginationControls
          currentPage={page}
          totalPages={result.totalPages}
          totalCount={result.totalCount}
          basePath={`/tag/${slug}`}
        />
      </Suspense>
    </div>
  );
}
