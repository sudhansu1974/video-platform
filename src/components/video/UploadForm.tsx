"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CloudUpload,
  FileVideo,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TagInput } from "@/components/video/TagInput";
import { cn } from "@/lib/utils";
import {
  videoUploadSchema,
  type VideoUploadInput,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
} from "@/lib/validations/video";

interface Category {
  id: string;
  name: string;
}

interface UploadFormProps {
  categories: Category[];
}

type UploadState =
  | "selecting" // File picker
  | "form" // Metadata form
  | "uploading" // Upload in progress
  | "processing" // Processing in background
  | "completed" // Done
  | "failed"; // Error

interface ProcessingStatus {
  status: string;
  progress: number;
  errorMessage: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function filenameWithoutExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

export function UploadForm({ categories }: UploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("selecting");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoSlug, setVideoSlug] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] =
    useState<ProcessingStatus | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<VideoUploadInput>({
    resolver: zodResolver(videoUploadSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: undefined,
      tags: [],
    },
  });

  // Validate selected file
  function validateFile(file: File): string | null {
    if (
      !ALLOWED_VIDEO_TYPES.includes(
        file.type as (typeof ALLOWED_VIDEO_TYPES)[number]
      )
    ) {
      return `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File too large. Maximum size is 2GB.";
    }
    return null;
  }

  function handleFileSelect(selectedFile: File) {
    const error = validateFile(selectedFile);
    if (error) {
      toast.error(error);
      return;
    }
    setFile(selectedFile);
    form.setValue("title", filenameWithoutExtension(selectedFile.name));
    setUploadState("form");
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) handleFileSelect(selected);
  }

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearFile() {
    setFile(null);
    setUploadState("selecting");
    form.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Upload using XMLHttpRequest for progress tracking
  async function onSubmit(data: VideoUploadInput) {
    if (!file) return;

    setUploadState("uploading");
    setUploadProgress(0);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    if (data.categoryId) formData.append("categoryId", data.categoryId);
    if (data.tags && data.tags.length > 0) {
      formData.append("tags", JSON.stringify(data.tags));
    }

    try {
      const result = await new Promise<{
        success: boolean;
        videoId?: string;
        slug?: string;
        error?: string;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          try {
            const response = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(response);
            } else {
              reject(new Error(response.error || "Upload failed"));
            }
          } catch {
            reject(new Error("Upload failed"));
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));

        xhr.open("POST", "/api/upload");
        xhr.send(formData);
      });

      if (result.success && result.videoId) {
        setVideoId(result.videoId);
        setVideoSlug(result.slug ?? null);
        setVideoTitle(data.title);
        setUploadState("processing");
        toast.success("Upload complete! Processing your video...");
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Upload failed"
      );
      setUploadState("form");
      toast.error(
        error instanceof Error ? error.message : "Upload failed"
      );
    }
  }

  // Poll processing status
  useEffect(() => {
    if (uploadState !== "processing" || !videoId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/upload/status/${videoId}`);
        if (!res.ok) return;

        const data = await res.json();

        if (data.processingJob) {
          setProcessingStatus(data.processingJob);
        }
        if (data.thumbnailUrl) {
          setThumbnailUrl(data.thumbnailUrl);
        }

        if (data.status === "PUBLISHED") {
          setUploadState("completed");
          clearInterval(interval);
        } else if (data.processingJob?.status === "FAILED") {
          setUploadState("failed");
          setErrorMessage(
            data.processingJob.errorMessage || "Processing failed"
          );
          clearInterval(interval);
        }
      } catch {
        // Silently retry
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [uploadState, videoId]);

  // ─── Render: File Selection ─────────────────────────

  if (uploadState === "selecting") {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 cursor-pointer transition-colors",
          isDragOver
            ? "border-blue-500 bg-blue-500/10"
            : "border-zinc-700 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800/50"
        )}
      >
        <CloudUpload
          className={cn(
            "h-12 w-12",
            isDragOver ? "text-blue-500" : "text-zinc-400"
          )}
        />
        <div className="text-center">
          <p className="text-lg font-medium text-zinc-200">
            Drag and drop your video here, or click to browse
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            MP4, MOV, AVI, WebM — up to 2GB
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_VIDEO_TYPES.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    );
  }

  // ─── Render: Upload Form ────────────────────────────

  if (uploadState === "form" || uploadState === "uploading") {
    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Selected file info */}
        {file && (
          <Card className="border-zinc-700 bg-zinc-900">
            <CardContent className="flex items-center gap-4 p-4">
              <FileVideo className="h-10 w-10 shrink-0 text-blue-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-200">
                  {file.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatFileSize(file.size)} · {file.type}
                </p>
              </div>
              {uploadState === "form" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            {...form.register("title")}
            placeholder="Video title"
            disabled={uploadState === "uploading"}
            className="bg-zinc-900 border-zinc-700"
          />
          {form.formState.errors.title && (
            <p className="text-xs text-red-400">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...form.register("description")}
            placeholder="Describe your video..."
            rows={4}
            disabled={uploadState === "uploading"}
            className="bg-zinc-900 border-zinc-700"
          />
          {form.formState.errors.description && (
            <p className="text-xs text-red-400">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Category</Label>
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={field.onChange}
                disabled={uploadState === "uploading"}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-700">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <Controller
            control={form.control}
            name="tags"
            render={({ field }) => (
              <TagInput
                value={field.value ?? []}
                onChange={field.onChange}
                maxTags={10}
              />
            )}
          />
        </div>

        {/* Upload progress */}
        {uploadState === "uploading" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Uploading...</span>
              <span className="text-zinc-200">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={uploadState === "uploading"}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {uploadState === "uploading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Video"
            )}
          </Button>
          {uploadState === "form" && (
            <Button type="button" variant="ghost" onClick={clearFile}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    );
  }

  // ─── Render: Processing Status ──────────────────────

  if (uploadState === "processing") {
    return (
      <Card className="border-zinc-700 bg-zinc-900">
        <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">
              Processing your video...
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              {videoTitle ?? "Your video"} is being transcoded. This may take a
              few minutes.
            </p>
          </div>
          {processingStatus && (
            <div className="w-full max-w-md space-y-2">
              <div className="flex items-center justify-between text-sm">
                <Badge
                  variant="secondary"
                  className="bg-zinc-800 text-zinc-200"
                >
                  {processingStatus.status}
                </Badge>
                <span className="text-zinc-400">
                  {processingStatus.progress}%
                </span>
              </div>
              <Progress value={processingStatus.progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ─── Render: Completed ──────────────────────────────

  if (uploadState === "completed") {
    return (
      <Card className="border-zinc-700 bg-zinc-900">
        <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">
              Video published!
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              {videoTitle ?? "Your video"} is now live.
            </p>
          </div>
          {thumbnailUrl && (
            <div className="aspect-video w-full max-w-md overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push(`/watch/${videoSlug}`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Watch Video
            </Button>
            <Button variant="outline" onClick={() => router.push("/upload")}>
              Upload Another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Render: Failed ─────────────────────────────────

  if (uploadState === "failed") {
    return (
      <Card className="border-zinc-700 bg-zinc-900">
        <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">
              Processing failed
            </h3>
            <p className="mt-1 text-sm text-red-400">
              {errorMessage || "An error occurred during video processing."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setUploadState("selecting");
                setFile(null);
                setVideoId(null);
                setErrorMessage(null);
                form.reset();
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
