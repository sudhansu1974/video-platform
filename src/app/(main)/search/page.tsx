import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Search, Film, TrendingUp, Tag } from "lucide-react";
import { searchVideos, searchCreators, getSearchLandingData } from "@/lib/queries/search";
import { getAllCategories } from "@/lib/queries/browse";
import { SearchInput } from "@/components/search/SearchInput";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { CreatorCard } from "@/components/search/CreatorCard";
import { SearchFilters } from "@/components/search/SearchFilters";
import { PaginationControls } from "@/components/browse/PaginationControls";
import { VideoGrid } from "@/components/video/VideoGrid";
import { Badge } from "@/components/ui/badge";
import { formatViewCount } from "@/lib/format";

// ─── Types ──────────────────────────────────────────

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    tag?: string;
    sort?: string;
    duration?: string;
    uploadDate?: string;
    page?: string;
  }>;
}

// ─── Metadata ───────────────────────────────────────

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q?.trim();

  return {
    title: query
      ? `Search results for "${query}" | VideoHub`
      : "Search | VideoHub",
    robots: { index: false, follow: true },
  };
}

// ─── Page ───────────────────────────────────────────

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim();

  if (!query) {
    return <SearchLanding />;
  }

  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const sort = (params.sort as "relevance" | "recent" | "popular" | "views") || "relevance";
  const duration = params.duration as "short" | "medium" | "long" | undefined;
  const uploadDate = params.uploadDate as "today" | "week" | "month" | "year" | undefined;
  const category = params.category;

  const [searchResult, creators, categories] = await Promise.all([
    searchVideos({
      query,
      category,
      tag: params.tag,
      sort,
      duration,
      uploadDate,
      page,
      limit: 20,
    }),
    searchCreators(query),
    getAllCategories(),
  ]);

  return (
    <div className="space-y-6">
      {/* Search input (large, page variant) */}
      <SearchInput defaultValue={query} variant="page" />

      {/* Results summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {searchResult.totalCount > 0 ? (
            <>
              About{" "}
              <span className="font-medium text-zinc-200">
                {formatViewCount(searchResult.totalCount)}
              </span>{" "}
              {searchResult.totalCount === 1 ? "result" : "results"} for{" "}
              <span className="font-medium text-zinc-200">
                &ldquo;{query}&rdquo;
              </span>
            </>
          ) : (
            <>
              No results for{" "}
              <span className="font-medium text-zinc-200">
                &ldquo;{query}&rdquo;
              </span>
            </>
          )}
        </p>
      </div>

      {/* Filters */}
      <Suspense>
        <SearchFilters
          currentFilters={{
            sort,
            duration,
            uploadDate,
            category,
          }}
          categories={categories}
          query={query}
        />
      </Suspense>

      {/* Creator results */}
      {creators.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-zinc-400">
            Creators matching &ldquo;{query}&rdquo;
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        </div>
      )}

      {/* Video results */}
      {searchResult.videos.length > 0 ? (
        <div className="space-y-2">
          {searchResult.videos.map((video) => (
            <SearchResultCard key={video.id} video={video} query={query} />
          ))}
        </div>
      ) : (
        <EmptySearchState query={query} />
      )}

      {/* Pagination */}
      {searchResult.totalPages > 1 && (
        <Suspense>
          <PaginationControls
            currentPage={page}
            totalPages={searchResult.totalPages}
            totalCount={searchResult.totalCount}
            basePath="/search"
            itemsPerPage={20}
          />
        </Suspense>
      )}
    </div>
  );
}

// ─── Search Landing (no query) ──────────────────────

async function SearchLanding() {
  const { trendingVideos, popularCategories, popularTags } =
    await getSearchLandingData();

  return (
    <div className="space-y-8">
      {/* Search input */}
      <div className="mx-auto max-w-2xl space-y-2 text-center">
        <h1 className="text-2xl font-bold text-zinc-50">Search</h1>
        <p className="text-sm text-zinc-400">
          Find videos, creators, and more
        </p>
        <SearchInput variant="page" className="mt-4" />
      </div>

      {/* Popular categories */}
      {popularCategories.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-50">
            <Tag className="h-5 w-5 text-zinc-400" />
            Popular Categories
          </h2>
          <div className="flex flex-wrap gap-2">
            {popularCategories.map((cat) => (
              <Link key={cat.id} href={`/category/${cat.slug}`}>
                <Badge
                  variant="secondary"
                  className="bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-50"
                >
                  {cat.name}
                  <span className="ml-1.5 text-xs text-zinc-500">
                    {cat._count.videos}
                  </span>
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trending searches (tags) */}
      {popularTags.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-50">
            <TrendingUp className="h-5 w-5 text-zinc-400" />
            Trending Searches
          </h2>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/search?q=${encodeURIComponent(tag.name)}`}
              >
                <Badge
                  variant="outline"
                  className="border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
                >
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trending videos */}
      {trendingVideos.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-50">
            <TrendingUp className="h-5 w-5 text-zinc-400" />
            Trending Videos
          </h2>
          <VideoGrid videos={trendingVideos} />
        </div>
      )}
    </div>
  );
}

// ─── Empty State ────────────────────────────────────

function EmptySearchState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
        <Search className="h-8 w-8 text-zinc-500" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-zinc-200">
        No results found
      </h3>
      <p className="mt-1 max-w-md text-sm text-zinc-400">
        We couldn&apos;t find any videos matching &ldquo;{query}&rdquo;.
        Try different keywords or remove some filters.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/search"
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
        >
          Clear search
        </Link>
        <Link
          href="/browse"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Browse all videos
        </Link>
      </div>
    </div>
  );
}
