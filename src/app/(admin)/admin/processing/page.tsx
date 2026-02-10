import { Suspense } from "react";
import Link from "next/link";
import { getAdminProcessingJobs } from "@/lib/queries/admin";
import { formatRelativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/browse/PaginationControls";
import { ProcessingJobActions } from "@/components/admin/ProcessingJobActions";
import { AdminProcessingFilters } from "@/components/admin/AdminProcessingFilters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ProcessingJobStatus } from "@/generated/prisma/client";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
  }>;
}

const jobStatusConfig: Record<
  ProcessingJobStatus,
  { label: string; className: string }
> = {
  QUEUED: {
    label: "Queued",
    className: "bg-zinc-700 text-zinc-200",
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

export default async function AdminProcessingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const status = (params.status as ProcessingJobStatus) || undefined;

  const { jobs, totalCount, totalPages, summary } =
    await getAdminProcessingJobs({ page, limit: 20, status });

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">Queued</p>
          <p className="mt-1 text-xl font-bold text-zinc-50">
            {summary.queued}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-yellow-400">Processing</p>
          <p className="mt-1 text-xl font-bold text-zinc-50">
            {summary.processing}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-green-400">Completed Today</p>
          <p className="mt-1 text-xl font-bold text-zinc-50">
            {summary.completedToday}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-red-400">Failed Today</p>
          <p className="mt-1 text-xl font-bold text-zinc-50">
            {summary.failedToday}
          </p>
        </div>
      </div>

      <Suspense>
        <AdminProcessingFilters />
      </Suspense>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Video</TableHead>
              <TableHead className="text-zinc-400">Creator</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-right text-zinc-400">
                Progress
              </TableHead>
              <TableHead className="text-zinc-400">Started</TableHead>
              <TableHead className="text-zinc-400">Completed</TableHead>
              <TableHead className="text-zinc-400">Error</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => {
              const config = jobStatusConfig[job.status];
              return (
                <TableRow
                  key={job.id}
                  className="border-zinc-800 hover:bg-zinc-800/50"
                >
                  <TableCell>
                    <span className="max-w-[180px] truncate text-sm font-medium text-zinc-200">
                      {job.video.title}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/users/${job.video.creator.id}`}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      {job.video.creator.username}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(config.className)}
                    >
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-zinc-300">
                    {job.progress}%
                  </TableCell>
                  <TableCell className="text-sm text-zinc-500">
                    {job.startedAt
                      ? formatRelativeTime(job.startedAt)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-500">
                    {job.completedAt
                      ? formatRelativeTime(job.completedAt)
                      : "—"}
                  </TableCell>
                  <TableCell
                    className="max-w-[200px] truncate text-sm text-red-400"
                    title={job.errorMessage ?? undefined}
                  >
                    {job.errorMessage || "—"}
                  </TableCell>
                  <TableCell>
                    <ProcessingJobActions
                      jobId={job.id}
                      jobStatus={job.status}
                      videoTitle={job.video.title}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {jobs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-zinc-500"
                >
                  No processing jobs found
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
          basePath="/admin/processing"
          itemsPerPage={20}
        />
      </Suspense>
    </div>
  );
}
