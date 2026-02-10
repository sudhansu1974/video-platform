import Link from "next/link";
import {
  Users,
  UserCheck,
  Video,
  Globe,
  Eye,
  UserPlus,
  Upload,
  Cpu,
} from "lucide-react";
import { getPlatformStats, getRecentUsers, getRecentVideos } from "@/lib/queries/admin";
import { formatViewCount, formatRelativeTime } from "@/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/admin/RoleBadge";
import { StatusBadge } from "@/components/video/StatusBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: string;
}

function StatCard({ label, value, icon: Icon, accent }: StatCardProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="mt-1 text-2xl font-bold text-zinc-50">{value}</p>
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            accent || "bg-zinc-800"
          )}
        >
          <Icon className="h-5 w-5 text-zinc-300" />
        </div>
      </div>
    </div>
  );
}

export default async function AdminOverviewPage() {
  const [stats, recentUsers, recentVideos] = await Promise.all([
    getPlatformStats(),
    getRecentUsers(5),
    getRecentVideos(5),
  ]);

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
        />
        <StatCard
          label="Total Creators"
          value={stats.totalCreators.toLocaleString()}
          icon={UserCheck}
        />
        <StatCard
          label="Total Videos"
          value={stats.totalVideos.toLocaleString()}
          icon={Video}
        />
        <StatCard
          label="Published"
          value={stats.publishedVideos.toLocaleString()}
          icon={Globe}
          accent="bg-green-500/10"
        />
        <StatCard
          label="Total Views"
          value={formatViewCount(stats.totalViews)}
          icon={Eye}
        />
        <StatCard
          label="New Users Today"
          value={stats.newUsersToday}
          icon={UserPlus}
        />
        <StatCard
          label="New Videos Today"
          value={stats.newVideosToday}
          icon={Upload}
        />
        <StatCard
          label="Active Jobs"
          value={stats.activeProcessingJobs}
          icon={Cpu}
          accent={stats.activeProcessingJobs > 0 ? "bg-yellow-500/10" : undefined}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-50">Recent Users</h2>
            <Link
              href="/admin/users"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-800"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-zinc-700 text-xs text-zinc-200">
                    {user.name?.charAt(0).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {user.username}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatRelativeTime(user.createdAt)}
                  </p>
                </div>
                <RoleBadge role={user.role} />
              </Link>
            ))}
            {recentUsers.length === 0 && (
              <p className="text-sm text-zinc-500">No users yet</p>
            )}
          </div>
        </div>

        {/* Recent Videos */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-50">Recent Videos</h2>
            <Link
              href="/admin/videos"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentVideos.map((video) => (
              <Link
                key={video.id}
                href="/admin/videos"
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-zinc-800"
              >
                <div className="h-10 w-16 shrink-0 overflow-hidden rounded bg-zinc-800">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Video className="h-4 w-4 text-zinc-600" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {video.title}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {video.creator.username} &middot;{" "}
                    {formatRelativeTime(video.createdAt)}
                  </p>
                </div>
                <StatusBadge status={video.status} />
              </Link>
            ))}
            {recentVideos.length === 0 && (
              <p className="text-sm text-zinc-500">No videos yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" className="border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700">
          <Link href="/admin/users">Manage Users</Link>
        </Button>
        <Button asChild variant="outline" className="border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700">
          <Link href="/admin/videos?status=PROCESSING">Moderate Videos</Link>
        </Button>
        <Button asChild variant="outline" className="border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700">
          <Link href="/admin/processing">View Processing Queue</Link>
        </Button>
      </div>
    </div>
  );
}
