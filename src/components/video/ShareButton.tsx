"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonProps {
  videoSlug: string;
  videoTitle: string;
}

export function ShareButton({ videoSlug, videoTitle }: ShareButtonProps) {
  const handleShare = async () => {
    const url = `${window.location.origin}/watch/${videoSlug}`;

    // Try native Web Share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title: videoTitle, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="gap-2"
    >
      <Share2 className="h-4 w-4" />
      Share
    </Button>
  );
}
