"use client";

import { useState, useRef } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateBanner } from "@/app/actions/profile";
import { ALLOWED_BANNER_TYPES, MAX_BANNER_SIZE } from "@/lib/validations/profile";

interface BannerUploadProps {
  currentBannerUrl?: string | null;
}

export function BannerUpload({ currentBannerUrl }: BannerUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_BANNER_TYPES.includes(file.type as (typeof ALLOWED_BANNER_TYPES)[number])) {
      toast.error("Invalid file type. Use JPEG, PNG, or WebP.");
      return;
    }

    if (file.size > MAX_BANNER_SIZE) {
      toast.error("File too large. Maximum 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("banner", file);
      const result = await updateBanner(formData);

      if (result.success) {
        toast.success("Banner updated");
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
      } else {
        toast.error(result.error || "Failed to upload banner");
      }
    } catch {
      toast.error("Failed to upload banner");
    } finally {
      setUploading(false);
    }
  }

  function handleCancel() {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const displayUrl = preview || currentBannerUrl;

  return (
    <div className="space-y-3">
      <div className="relative aspect-[5/1] w-full overflow-hidden rounded-lg bg-zinc-800">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Channel banner"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900">
            <p className="text-sm text-zinc-500">No banner set</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_BANNER_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleUpload} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={uploading}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          className="gap-2"
        >
          <ImagePlus className="h-4 w-4" />
          Change Banner
        </Button>
      )}
      <p className="text-xs text-zinc-500">
        JPEG, PNG, or WebP. Max 10MB. Recommended: 1920x400.
      </p>
    </div>
  );
}
