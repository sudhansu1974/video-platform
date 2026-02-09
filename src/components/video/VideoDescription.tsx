"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface VideoDescriptionProps {
  description: string;
  className?: string;
}

export function VideoDescription({
  description,
  className,
}: VideoDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const [needsExpand, setNeedsExpand] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (el) {
      // Check if text overflows the 3-line clamp
      setNeedsExpand(el.scrollHeight > el.clientHeight);
    }
  }, [description]);

  return (
    <div className={cn("rounded-lg bg-zinc-900 p-4", className)}>
      <div
        ref={textRef}
        className={cn(
          "whitespace-pre-line text-sm text-zinc-300",
          !expanded && "line-clamp-3"
        )}
      >
        {description}
      </div>
      {needsExpand && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-sm font-medium text-zinc-400 hover:text-zinc-200"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
