"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Film, Clock, Eye, Calendar, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TagInput } from "@/components/video/TagInput";
import { StatusBadge } from "@/components/video/StatusBadge";
import { VideoThumbnail } from "@/components/video/VideoThumbnail";
import { formatDuration, formatRelativeTime, formatViewCount } from "@/lib/format";
import { updateVideoMetadata, deleteVideo, updateVideoStatus } from "@/app/actions/video";
import type { VideoStatus, ProcessingJobStatus } from "@/generated/prisma/client";

const editSchema = z.object({
  title: z
    .string()
    .min(3, { error: "Title must be at least 3 characters" })
    .max(200, { error: "Title must be at most 200 characters" }),
  description: z
    .string()
    .max(5000, { error: "Description must be at most 5000 characters" })
    .optional(),
  categoryId: z.string().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

interface VideoEditFormProps {
  video: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    status: VideoStatus;
    categoryId: string | null;
    tags: string[];
    thumbnailUrl: string | null;
    hlsUrl: string | null;
    fileUrl: string;
    duration: number | null;
    viewCount: number;
    createdAt: string;
    processingJob: {
      status: ProcessingJobStatus;
      resolution: string | null;
      completedAt: string | null;
    } | null;
  };
  categories: { id: string; name: string; slug: string }[];
}

export function VideoEditForm({ video, categories }: VideoEditFormProps) {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>(video.tags);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isTogglingStatus, startTogglingStatus] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: video.title,
      description: video.description ?? "",
      categoryId: video.categoryId ?? undefined,
    },
  });

  const categoryId = watch("categoryId");

  function onSubmit(data: EditFormData) {
    startSaving(async () => {
      const result = await updateVideoMetadata({
        videoId: video.id,
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        tags,
      });

      if (result.success) {
        toast.success("Video updated successfully");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update video");
      }
    });
  }

  function handleDelete() {
    startDeleting(async () => {
      const result = await deleteVideo(video.id);
      if (result.success) {
        toast.success("Video deleted successfully");
        router.push("/dashboard/videos");
      } else {
        toast.error(result.error ?? "Failed to delete video");
      }
    });
  }

  function handleToggleStatus() {
    const newStatus = video.status === "PUBLISHED" ? "UNLISTED" : "PUBLISHED";
    startTogglingStatus(async () => {
      const result = await updateVideoStatus(video.id, newStatus);
      if (result.success) {
        toast.success(`Video ${newStatus === "PUBLISHED" ? "published" : "unlisted"}`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update status");
      }
    });
  }

  const canToggleStatus =
    video.status === "PUBLISHED" || video.status === "UNLISTED";

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left column — Metadata form */}
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register("title")}
                className="border-zinc-700 bg-zinc-900"
              />
              {errors.title && (
                <p className="text-sm text-red-400">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                rows={6}
                className="border-zinc-700 bg-zinc-900"
              />
              {errors.description && (
                <p className="text-sm text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={categoryId ?? "none"}
                onValueChange={(v) =>
                  setValue("categoryId", v === "none" ? undefined : v)
                }
              >
                <SelectTrigger className="border-zinc-700 bg-zinc-900">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <TagInput value={tags} onChange={setTags} />
            </div>

            {/* Status toggle (if applicable) */}
            {canToggleStatus && (
              <div className="space-y-2">
                <Label>Visibility</Label>
                <div className="flex items-center gap-3">
                  <StatusBadge status={video.status} />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleToggleStatus}
                    disabled={isTogglingStatus}
                  >
                    {isTogglingStatus
                      ? "Updating..."
                      : video.status === "PUBLISHED"
                        ? "Make Unlisted"
                        : "Publish"}
                  </Button>
                </div>
              </div>
            )}

            {/* Save / Cancel */}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/videos")}
              >
                Cancel
              </Button>
            </div>
          </div>

          {/* Right column — Preview & Info */}
          <div className="space-y-6">
            {/* Thumbnail preview */}
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-sm text-zinc-400">
                  Thumbnail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VideoThumbnail
                  thumbnailUrl={video.thumbnailUrl}
                  title={video.title}
                  size="lg"
                />
              </CardContent>
            </Card>

            {/* Video info */}
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-sm text-zinc-400">
                  Video Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow
                  icon={<Film className="h-4 w-4" />}
                  label="Status"
                >
                  <StatusBadge status={video.status} />
                </InfoRow>
                {video.duration != null && (
                  <InfoRow
                    icon={<Clock className="h-4 w-4" />}
                    label="Duration"
                  >
                    {formatDuration(video.duration)}
                  </InfoRow>
                )}
                {video.processingJob?.resolution && (
                  <InfoRow
                    icon={<HardDrive className="h-4 w-4" />}
                    label="Resolution"
                  >
                    {video.processingJob.resolution}
                  </InfoRow>
                )}
                <InfoRow
                  icon={<Eye className="h-4 w-4" />}
                  label="Views"
                >
                  {formatViewCount(video.viewCount)}
                </InfoRow>
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Uploaded"
                >
                  {formatRelativeTime(video.createdAt)}
                </InfoRow>
                <div className="pt-1 text-xs text-zinc-500">
                  Slug: /watch/{video.slug}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Danger Zone */}
      <Card className="border-red-500/30 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-sm text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Delete this video
              </p>
              <p className="text-xs text-zinc-500">
                This action cannot be undone.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete Video
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Are you sure you want to delete &ldquo;{video.title}&rdquo;?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The video and all associated
                    data will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Info Row helper ─────────────────────────────────

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-zinc-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-zinc-200">{children}</div>
    </div>
  );
}
