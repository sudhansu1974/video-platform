"use client";

import { useState } from "react";
import Link from "next/link";
import { Video } from "lucide-react";
import { formatViewCount, formatRelativeTime } from "@/lib/format";
import { StatusBadge } from "@/components/video/StatusBadge";
import { VideoActions } from "@/components/admin/VideoActions";
import { BulkVideoActions } from "@/components/admin/BulkVideoActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { VideoStatus } from "@/generated/prisma/client";

interface VideoRow {
  id: string;
  title: string;
  slug: string;
  status: VideoStatus;
  thumbnailUrl: string | null;
  viewCount: number;
  createdAt: Date;
  creator: {
    id: string;
    name: string;
    username: string;
  };
  category: { id: string; name: string } | null;
}

interface AdminVideosTableProps {
  videos: VideoRow[];
}

export function AdminVideosTable({ videos }: AdminVideosTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allSelected =
    videos.length > 0 && selectedIds.length === videos.length;

  function toggleAll() {
    setSelectedIds(allSelected ? [] : videos.map((v) => v.id));
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="space-y-3">
      <BulkVideoActions
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
      />

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-zinc-600"
                />
              </TableHead>
              <TableHead className="text-zinc-400">Video</TableHead>
              <TableHead className="text-zinc-400">Creator</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Category</TableHead>
              <TableHead className="text-right text-zinc-400">Views</TableHead>
              <TableHead className="text-zinc-400">Uploaded</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.map((video) => (
              <TableRow
                key={video.id}
                className="border-zinc-800 hover:bg-zinc-800/50"
              >
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(video.id)}
                    onChange={() => toggleOne(video.id)}
                    className="rounded border-zinc-600"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-16 shrink-0 overflow-hidden rounded bg-zinc-800">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Video className="h-4 w-4 text-zinc-600" />
                        </div>
                      )}
                    </div>
                    <span className="max-w-[200px] truncate text-sm font-medium text-zinc-200">
                      {video.title}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/users/${video.creator.id}`}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    {video.creator.username}
                  </Link>
                </TableCell>
                <TableCell>
                  <StatusBadge status={video.status} />
                </TableCell>
                <TableCell className="text-sm text-zinc-400">
                  {video.category?.name ?? "—"}
                </TableCell>
                <TableCell className="text-right text-sm text-zinc-300">
                  {formatViewCount(video.viewCount)}
                </TableCell>
                <TableCell className="text-sm text-zinc-500">
                  {formatRelativeTime(video.createdAt)}
                </TableCell>
                <TableCell>
                  <VideoActions
                    videoId={video.id}
                    videoTitle={video.title}
                    videoSlug={video.slug}
                    currentStatus={video.status}
                    creatorId={video.creator.id}
                  />
                </TableCell>
              </TableRow>
            ))}
            {videos.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-zinc-500"
                >
                  No videos found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
