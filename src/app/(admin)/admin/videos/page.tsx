import { Suspense } from "react";
import { getAdminVideos } from "@/lib/queries/admin";
import { PaginationControls } from "@/components/browse/PaginationControls";
import { AdminVideosFilters } from "@/components/admin/AdminVideosFilters";
import { AdminVideosTable } from "@/components/admin/AdminVideosTable";
import prisma from "@/lib/prisma";
import type { VideoStatus } from "@/generated/prisma/client";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    category?: string;
    userId?: string;
    sort?: string;
    order?: string;
  }>;
}

export default async function AdminVideosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || undefined;
  const status = (params.status as VideoStatus) || undefined;
  const categoryId = params.category || undefined;
  const userId = params.userId || undefined;
  const sort =
    (params.sort as "createdAt" | "title" | "viewCount" | "status") ||
    "createdAt";
  const sortOrder = (params.order as "asc" | "desc") || "desc";

  const [{ videos, totalCount, totalPages }, categories] = await Promise.all([
    getAdminVideos({ page, limit: 20, search, status, categoryId, userId, sort, sortOrder }),
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <Suspense>
        <AdminVideosFilters categories={categories} />
      </Suspense>

      <AdminVideosTable videos={videos} />

      <Suspense>
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          basePath="/admin/videos"
          itemsPerPage={20}
        />
      </Suspense>
    </div>
  );
}
