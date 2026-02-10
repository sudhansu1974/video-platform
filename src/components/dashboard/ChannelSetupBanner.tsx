"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "channel-setup-banner-dismissed";

interface ChannelSetupBannerProps {
  hasAvatar: boolean;
  hasBanner: boolean;
  hasBio: boolean;
}

export function ChannelSetupBanner({
  hasAvatar,
  hasBanner,
  hasBio,
}: ChannelSetupBannerProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  // Don't show if setup is complete or dismissed
  if (dismissed || (hasAvatar && hasBanner && hasBio)) {
    return null;
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  }

  return (
    <div className="relative rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
        <div>
          <p className="text-sm font-medium text-zinc-200">
            Complete your channel setup
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Add a profile photo, banner, and bio to make your channel stand out.
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link href="/dashboard/channel">Set Up Channel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
