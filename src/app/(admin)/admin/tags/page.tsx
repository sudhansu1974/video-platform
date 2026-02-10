import { Suspense } from "react";
import { getAdminTags, getAllTags } from "@/lib/queries/admin";
import { PaginationControls } from "@/components/browse/PaginationControls";
import { TagsManager } from "@/components/admin/TagsManager";
import { AdminTagsFilters } from "@/components/admin/AdminTagsFilters";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sort?: string;
    order?: string;
  }>;
}

export default async function AdminTagsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || undefined;
  const sort = (params.sort as "name" | "createdAt") || "name";
  const sortOrder = (params.order as "asc" | "desc") || "asc";

  const [{ tags, totalCount, totalPages }, allTags] = await Promise.all([
    getAdminTags({ page, limit: 20, search, sort, sortOrder }),
    getAllTags(),
  ]);

  return (
    <div className="space-y-6">
      <Suspense>
        <AdminTagsFilters />
      </Suspense>

      <TagsManager tags={tags} allTags={allTags} />

      <Suspense>
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          basePath="/admin/tags"
          itemsPerPage={20}
        />
      </Suspense>
    </div>
  );
}
