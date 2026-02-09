"use client";

import { useState, useRef } from "react";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateAvatar } from "@/app/actions/profile";
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_SIZE } from "@/lib/validations/profile";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  username: string;
  name: string;
}

export function AvatarUpload({
  currentAvatarUrl,
  username,
  name,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_TYPES)[number])) {
      toast.error("Invalid file type. Use JPEG, PNG, WebP, or GIF.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("File too large. Maximum 5MB.");
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
      formData.append("avatar", file);
      const result = await updateAvatar(formData);

      if (result.success) {
        toast.success("Avatar updated");
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
      } else {
        toast.error(result.error || "Failed to upload avatar");
      }
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  }

  function handleCancel() {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const displayUrl = preview || currentAvatarUrl;

  return (
    <div className="flex items-center gap-6">
      <Avatar className="h-24 w-24">
        <AvatarImage src={displayUrl ?? undefined} alt={name} />
        <AvatarFallback className="bg-zinc-700 text-xl text-zinc-200">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_AVATAR_TYPES.join(",")}
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
            <Camera className="h-4 w-4" />
            Change Avatar
          </Button>
        )}
        <p className="text-xs text-zinc-500">JPEG, PNG, WebP, or GIF. Max 5MB.</p>
      </div>
    </div>
  );
}
