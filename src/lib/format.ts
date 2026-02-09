// ─── Formatting Utilities ─────────────────────────────

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;
const WEEK = 604800;
const MONTH = 2592000; // 30 days

export function formatRelativeTime(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 60) return "just now";
  if (diffSeconds < HOUR) {
    const mins = Math.floor(diffSeconds / MINUTE);
    return `${mins} ${mins === 1 ? "minute" : "minutes"} ago`;
  }
  if (diffSeconds < DAY) {
    const hrs = Math.floor(diffSeconds / HOUR);
    return `${hrs} ${hrs === 1 ? "hour" : "hours"} ago`;
  }
  if (diffSeconds < WEEK) {
    const days = Math.floor(diffSeconds / DAY);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }
  if (diffSeconds < MONTH) {
    const weeks = Math.floor(diffSeconds / WEEK);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }

  // After 30 days, show formatted date
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatViewCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (count >= 10_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return count.toLocaleString("en-US");
}
