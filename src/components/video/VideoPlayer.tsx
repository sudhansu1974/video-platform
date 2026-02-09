"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title: string;
  autoPlay?: boolean;
  className?: string;
}

export function VideoPlayer({
  src,
  poster,
  title,
  autoPlay = false,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<import("hls.js").default | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initPlayer = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);

    // Clean up any previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (src.endsWith(".m3u8")) {
      // HLS source
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support (Safari)
        video.src = src;
      } else {
        // Use hls.js for other browsers
        const { default: Hls } = await import("hls.js");
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
          });
          hlsRef.current = hls;
          hls.loadSource(src);
          hls.attachMedia(video);

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  setError("Network error — could not load video");
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  // Try to recover from media errors once
                  hls.recoverMediaError();
                  break;
                default:
                  setError("Video could not be loaded");
                  hls.destroy();
                  break;
              }
            }
          });

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (autoPlay) {
              video.play().catch(() => {});
            }
          });
        } else {
          setError("HLS playback is not supported in this browser");
        }
      }
    } else {
      // Regular MP4 / WebM
      video.src = src;
      if (autoPlay) {
        video.play().catch(() => {});
      }
    }
  }, [src, autoPlay]);

  useEffect(() => {
    initPlayer();

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [initPlayer]);

  const handleRetry = () => {
    initPlayer();
  };

  const handleVideoError = () => {
    if (!error) {
      setError("Video could not be loaded");
    }
  };

  if (error) {
    return (
      <div
        className={cn(
          "flex aspect-video items-center justify-center rounded-lg bg-zinc-950",
          className
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-zinc-500" />
          <p className="text-sm text-zinc-400">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg bg-zinc-950",
        className
      )}
    >
      <video
        ref={videoRef}
        controls
        poster={poster}
        preload="metadata"
        playsInline
        aria-label={title}
        onError={handleVideoError}
        className="aspect-video w-full"
      />
      {/* TODO: Custom player controls with quality selection in production */}
    </div>
  );
}
