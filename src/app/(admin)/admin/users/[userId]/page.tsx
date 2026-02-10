import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Video,
  Eye,
  Globe,
  FileText,
  Clock,
  MapPin,
  LinkIcon,
  Mail,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getAdminUserById } from "@/lib/queries/admin";
import { formatViewCount, formatRelativeTime } from "@/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/admin/RoleBadge";
import { StatusBadge } from "@/components/video/StatusBadge";
import { UserActions } from "@/components/admin/UserActions";
import { RoleChangeSection } from "@/components/admin/RoleChangeSection";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default async function AdminUserDetailPage({ params }: PageProps) {
  const { userId } = await params;
  const [user, session] = await Promise.all([
    getAdminUserById(userId),
    auth(),
  ]);

  if (!user) {
    notFound();
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="text-zinc-400 hover:text-zinc-50"
      >
        <Link href="/admin/users">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Link>
      </Button>

      {/* User Profile Card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-zinc-700 text-lg text-zinc-200">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-zinc-50">{user.name}</h2>
                <RoleBadge role={user.role} />
              </div>
              <p className="text-sm text-zinc-400">@{user.username}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Joined{" "}
                  {formatRelativeTime(user.createdAt)}
                </span>
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {user.location}
                  </span>
                )}
                {user.websiteUrl && (
                  <a
                    href={user.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                  >
                    <LinkIcon className="h-3.5 w-3.5" /> Website
                  </a>
                )}
              </div>
              {user.bio && (
                <p className="mt-2 max-w-xl text-sm text-zinc-400">
                  {user.bio}
                </p>
              )}
            </div>
          </div>
          <UserActions
            userId={user.id}
            username={user.username}
            currentRole={user.role}
          />
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <Video className="h-4 w-4" />
            <span className="text-sm">Total Videos</span>
          </div>
          <p className="mt-1 text-xl font-bold text-zinc-50">
            {user.videoCount}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <Eye className="h-4 w-4" />
            <span className="text-sm">Total Views</span>
          </div>
          <p className="mt-1 text-xl font-bold text-zinc-50">
            {formatViewCount(user.totalViews)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <Globe className="h-4 w-4" />
            <span className="text-sm">Published</span>
          </div>
          <p className="mt-1 text-xl font-bold text-zinc-50">
            {user.publishedCount}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <FileText className="h-4 w-4" />
            <span className="text-sm">Drafts</span>
          </div>
          <p className="mt-1 text-xl font-bold text-zinc-50">
            {user.draftCount}
          </p>
        </div>
      </div>

      {/* Role Change */}
      <RoleChangeSection
        userId={user.id}
        currentRole={user.role}
        isSelf={session?.user?.id === user.id}
      />

      {/* User's Videos */}
      <div className="rounded-lg border border-zinc-800">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h3 className="text-lg font-semibold text-zinc-50">
            Videos ({user.videoCount})
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Video</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-right text-zinc-400">Views</TableHead>
              <TableHead className="text-zinc-400">Uploaded</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {user.recentVideos.map((video) => (
              <TableRow
                key={video.id}
                className="border-zinc-800 hover:bg-zinc-800/50"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-16 shrink-0 overflow-hidden rounded bg-zinc-800">
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
                    <span className="truncate text-sm font-medium text-zinc-200">
                      {video.title}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={video.status} />
                </TableCell>
                <TableCell className="text-right text-sm text-zinc-300">
                  {formatViewCount(video.viewCount)}
                </TableCell>
                <TableCell className="text-sm text-zinc-500">
                  {formatRelativeTime(video.createdAt)}
                </TableCell>
              </TableRow>
            ))}
            {user.recentVideos.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-zinc-500"
                >
                  No videos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
