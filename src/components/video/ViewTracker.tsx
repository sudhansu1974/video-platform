"use client";

import { useEffect, useRef } from "react";
import { incrementViewCount } from "@/app/actions/view";

interface ViewTrackerProps {
  videoId: string;
}

export function ViewTracker({ videoId }: ViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    incrementViewCount(videoId).catch(() => {});
  }, [videoId]);

  return null;
}
