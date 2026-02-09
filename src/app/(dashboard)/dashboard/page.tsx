import Link from "next/link";
import { redirect } from "next/navigation";
import { Video, Globe, Loader, Eye, Upload, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCreatorStats, getCreatorVideos, getRecentProcessingJobs } from "@/lib/queries/video";
import { formatRelativeTime, formatViewCount } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/video/StatusBadge";
import { VideoThumbnail } from "@/components/video/VideoThumbnail";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [stats, recentVideos, recentJobs] = await Promise.all([
    getCreatorStats(session.user.id),
    getCreatorVideos(session.user.id, { limit: 5 }),
    getRecentProcessingJobs(session.user.id, 5),
  ]);

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Total Videos"
          value={stats.totalVideos}
          icon={<Video className="h-5 w-5 text-zinc-400" />}
        />
        <StatsCard
          label="Published"
          value={stats.publishedVideos}
          icon={<Globe className="h-5 w-5 text-green-400" />}
          accent="green"
        />
        <StatsCard
          label="Processing"
          value={stats.processingVideos}
          icon={<Loader className="h-5 w-5 text-yellow-400" />}
          accent="yellow"
        />
        <StatsCard
          label="Total Views"
          value={formatViewCount(stats.totalViews)}
          icon={<Eye className="h-5 w-5 text-blue-400" />}
          accent="blue"
        />
      </div>

      {/* Recent Videos */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg text-zinc-50">Recent Videos</CardTitle>
          {stats.totalVideos > 0 && (
            <Link
              href="/dashboard/videos"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View All
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {recentVideos.videos.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {recentVideos.videos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-zinc-800/50"
                >
                  <VideoThumbnail
                    thumbnailUrl={video.thumbnailUrl}
                    title={video.title}
                    size="sm"
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-50">
                      {video.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                      {video.category && <span>{video.category.name}</span>}
                      <span>{formatViewCount(video.viewCount)} views</span>
                      <span>{formatRelativeTime(video.createdAt)}</span>
                    </div>
                  </div>
                  <StatusBadge status={video.status} />
                  <Link
                    href={`/dashboard/videos/${video.id}/edit`}
                    className="shrink-0 text-xs text-zinc-400 hover:text-zinc-50"
                  >
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Activity */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-50">Processing Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <p className="text-sm text-zinc-500">No processing activity yet.</p>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center gap-4 rounded-lg p-2 hover:bg-zinc-800/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {job.video.title}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {job.startedAt
                        ? `Started ${formatRelativeTime(job.startedAt)}`
                        : `Queued ${formatRelativeTime(job.createdAt)}`}
                      {job.completedAt &&
                        ` \u2022 Completed ${formatRelativeTime(job.completedAt)}`}
                    </p>
                  </div>
                  <ProcessingStatusBadge status={job.status} />
                  {job.errorMessage && (
                    <span
                      className="max-w-[200px] truncate text-xs text-red-400"
                      title={job.errorMessage}
                    >
                      {job.errorMessage}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────

function StatsCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "green" | "yellow" | "blue";
}) {
  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardContent className="flex items-center gap-4 p-6">
        <div className="rounded-lg bg-zinc-800 p-3">{icon}</div>
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="text-2xl font-bold text-zinc-50">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-zinc-800 p-4">
        <Video className="h-8 w-8 text-zinc-500" />
      </div>
      <h3 className="mt-4 text-sm font-medium text-zinc-200">No videos yet</h3>
      <p className="mt-1 text-sm text-zinc-500">
        Upload your first video to get started.
      </p>
      <Button asChild className="mt-4">
        <Link href="/upload">
          <Upload className="mr-2 h-4 w-4" />
          Upload Video
        </Link>
      </Button>
    </div>
  );
}

function ProcessingStatusBadge({
  status,
}: {
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
}) {
  const config = {
    QUEUED: { label: "Queued", className: "bg-zinc-700 text-zinc-300" },
    PROCESSING: {
      label: "Processing",
      className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    },
    COMPLETED: {
      label: "Completed",
      className: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    FAILED: {
      label: "Failed",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
    },
  };

  const { label, className } = config[status];

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
