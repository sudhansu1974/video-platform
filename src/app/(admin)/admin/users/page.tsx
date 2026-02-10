import Link from "next/link";
import { Suspense } from "react";
import { getAdminUsers } from "@/lib/queries/admin";
import { formatRelativeTime, formatViewCount } from "@/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/admin/RoleBadge";
import { UserActions } from "@/components/admin/UserActions";
import { PaginationControls } from "@/components/browse/PaginationControls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserRole } from "@/generated/prisma/client";
import { AdminUsersFilters } from "@/components/admin/AdminUsersFilters";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    role?: string;
    sort?: string;
    order?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || undefined;
  const role = (params.role as UserRole) || undefined;
  const sort = (params.sort as "createdAt" | "username" | "name") || "createdAt";
  const sortOrder = (params.order as "asc" | "desc") || "desc";

  const { users, totalCount, totalPages } = await getAdminUsers({
    page,
    limit: 20,
    search,
    role,
    sort,
    sortOrder,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Suspense>
            <AdminUsersFilters />
          </Suspense>
        </div>
        <CreateUserDialog />
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">User</TableHead>
              <TableHead className="text-zinc-400">Email</TableHead>
              <TableHead className="text-zinc-400">Role</TableHead>
              <TableHead className="text-right text-zinc-400">Videos</TableHead>
              <TableHead className="text-right text-zinc-400">Views</TableHead>
              <TableHead className="text-zinc-400">Joined</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="border-zinc-800 hover:bg-zinc-800/50"
              >
                <TableCell>
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-zinc-700 text-xs text-zinc-200">
                        {user.name?.charAt(0).toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-200">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        @{user.username}
                      </p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-zinc-400">
                  {user.email}
                </TableCell>
                <TableCell>
                  <RoleBadge role={user.role} />
                </TableCell>
                <TableCell className="text-right text-sm text-zinc-300">
                  {user.videoCount}
                </TableCell>
                <TableCell className="text-right text-sm text-zinc-300">
                  {formatViewCount(user.totalViews)}
                </TableCell>
                <TableCell className="text-sm text-zinc-500">
                  {formatRelativeTime(user.createdAt)}
                </TableCell>
                <TableCell>
                  <UserActions
                    userId={user.id}
                    username={user.username}
                    currentRole={user.role}
                  />
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-zinc-500"
                >
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Suspense>
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          basePath="/admin/users"
          itemsPerPage={20}
        />
      </Suspense>
    </div>
  );
}
