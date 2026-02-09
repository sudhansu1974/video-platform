"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  MoreHorizontal,
  Pencil,
  ExternalLink,
  Link as LinkIcon,
  Trash2,
  Video,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/video/StatusBadge";
import { VideoThumbnail } from "@/components/video/VideoThumbnail";
import { formatRelativeTime, formatViewCount } from "@/lib/format";
import { deleteVideo } from "@/app/actions/video";
import type { VideoStatus } from "@/generated/prisma/client";

interface VideoItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: VideoStatus;
  thumbnailUrl: string | null;
  viewCount: number;
  createdAt: Date;
  category: { id: string; name: string } | null;
}

interface VideoListTableProps {
  videos: VideoItem[];
}

export function VideoListTable({ videos }: VideoListTableProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<VideoItem | null>(null);
  const [isPending, startTransition] = useTransition();

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 py-16 text-center">
        <div className="rounded-full bg-zinc-800 p-4">
          <Video className="h-8 w-8 text-zinc-500" />
        </div>
        <h3 className="mt-4 text-sm font-medium text-zinc-200">
          No videos found
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Try adjusting your filters or upload a new video.
        </p>
        <Button asChild className="mt-4">
          <Link href="/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload Video
          </Link>
        </Button>
      </div>
    );
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteVideo(deleteTarget.id);
      if (result.success) {
        toast.success("Video deleted successfully");
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete video");
      }
    });
  }

  function handleCopyLink(slug: string) {
    const url = `${window.location.origin}/watch/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-lg border border-zinc-800 md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Video</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Category</TableHead>
              <TableHead className="text-zinc-400">Views</TableHead>
              <TableHead className="text-zinc-400">Date</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.map((video) => (
              <TableRow
                key={video.id}
                className="border-zinc-800 hover:bg-zinc-800/50"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <VideoThumbnail
                      thumbnailUrl={video.thumbnailUrl}
                      title={video.title}
                      size="sm"
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-50">
                        {video.title}
                      </p>
                      {video.description && (
                        <p className="mt-0.5 truncate text-xs text-zinc-500">
                          {video.description.slice(0, 80)}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={video.status} />
                </TableCell>
                <TableCell className="text-sm text-zinc-400">
                  {video.category?.name ?? "\u2014"}
                </TableCell>
                <TableCell className="text-sm text-zinc-400">
                  {formatViewCount(video.viewCount)}
                </TableCell>
                <TableCell className="text-sm text-zinc-500">
                  {formatRelativeTime(video.createdAt)}
                </TableCell>
                <TableCell>
                  <VideoActionsMenu
                    video={video}
                    onDelete={() => setDeleteTarget(video)}
                    onCopyLink={() => handleCopyLink(video.slug)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {videos.map((video) => (
          <div
            key={video.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-3"
          >
            <VideoThumbnail
              thumbnailUrl={video.thumbnailUrl}
              title={video.title}
              size="lg"
            />
            <div className="mt-3 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-50">
                  {video.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge status={video.status} />
                  <span className="text-xs text-zinc-500">
                    {formatViewCount(video.viewCount)} views
                  </span>
                  <span className="text-xs text-zinc-500">
                    {formatRelativeTime(video.createdAt)}
                  </span>
                </div>
              </div>
              <VideoActionsMenu
                video={video}
                onDelete={() => setDeleteTarget(video)}
                onCopyLink={() => handleCopyLink(video.slug)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete &ldquo;{deleteTarget?.title}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The video and all associated data
              will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Actions Dropdown ────────────────────────────────

function VideoActionsMenu({
  video,
  onDelete,
  onCopyLink,
}: {
  video: VideoItem;
  onDelete: () => void;
  onCopyLink: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link
            href={`/dashboard/videos/${video.id}/edit`}
            className="flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={`/watch/${video.slug}`}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View on site
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onCopyLink}
          className="flex items-center gap-2"
        >
          <LinkIcon className="h-4 w-4" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="flex items-center gap-2 text-red-400 focus:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
