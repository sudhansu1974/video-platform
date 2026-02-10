export const revalidate = 60;

import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoryBySlug, getCategoryVideos } from "@/lib/queries/browse";
import { VideoGrid } from "@/components/video/VideoGrid";
import { PaginationControls } from "@/components/browse/PaginationControls";
import { BrowseSortTabs } from "@/components/browse/BrowseSortTabs";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category Not Found" };
  return {
    title: `${category.name} Videos | VideoHub`,
    description: category.description ?? `Browse ${category.name} videos on VideoHub`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const sort = sp.sort === "popular" ? "popular" : "latest";

  const result = await getCategoryVideos(category.id, { page, sort });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">{category.name}</h1>
        {category.description && (
          <p className="mt-1 text-sm text-zinc-400">{category.description}</p>
        )}
        <p className="mt-1 text-xs text-zinc-500">
          {category._count.videos} {category._count.videos === 1 ? "video" : "videos"}
        </p>
      </div>

      <Suspense>
        <BrowseSortTabs currentSort={sort} />
      </Suspense>

      <VideoGrid videos={result.videos} emptyMessage="No videos in this category yet" />

      <Suspense>
        <PaginationControls
          currentPage={page}
          totalPages={result.totalPages}
          totalCount={result.totalCount}
          basePath={`/category/${slug}`}
        />
      </Suspense>
    </div>
  );
}
