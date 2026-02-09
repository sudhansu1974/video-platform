import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCreatorVideos } from "@/lib/queries/video";
import { Button } from "@/components/ui/button";
import type { VideoStatus } from "@/generated/prisma/client";
import { VideoListFilters } from "@/components/video/VideoListFilters";
import { VideoListTable } from "@/components/video/VideoListTable";
import { VideoListPagination } from "@/components/video/VideoListPagination";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    sort?: string;
    order?: string;
    search?: string;
  }>;
}

const VALID_STATUSES: VideoStatus[] = [
  "DRAFT",
  "PROCESSING",
  "PUBLISHED",
  "UNLISTED",
  "REJECTED",
];
const VALID_SORT_FIELDS = ["createdAt", "title", "viewCount", "status"] as const;

export default async function VideosPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const statusFilter = VALID_STATUSES.includes(params.status as VideoStatus)
    ? (params.status as VideoStatus)
    : undefined;
  const sortBy = VALID_SORT_FIELDS.includes(params.sort as typeof VALID_SORT_FIELDS[number])
    ? (params.sort as typeof VALID_SORT_FIELDS[number])
    : "createdAt";
  const sortOrder = params.order === "asc" ? "asc" : "desc";
  const search = params.search || undefined;

  const { videos, totalCount, totalPages } = await getCreatorVideos(
    session.user.id,
    { status: statusFilter, page, limit: 10, sortBy, sortOrder, search }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-50">My Videos</h2>
          <p className="text-sm text-zinc-400">
            {totalCount} {totalCount === 1 ? "video" : "videos"} total
          </p>
        </div>
        <Button asChild>
          <Link href="/upload">
            <Plus className="mr-2 h-4 w-4" />
            Upload New Video
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <VideoListFilters
        currentStatus={statusFilter}
        currentSort={sortBy}
        currentOrder={sortOrder}
        currentSearch={search}
      />

      {/* Video list */}
      <VideoListTable videos={videos} />

      {/* Pagination */}
      {totalPages > 1 && (
        <VideoListPagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
        />
      )}
    </div>
  );
}
