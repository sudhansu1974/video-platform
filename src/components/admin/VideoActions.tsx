"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  Globe,
  EyeOff,
  XCircle,
  FileText,
  UserCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  adminUpdateVideoStatus,
  deleteVideoAdmin,
} from "@/app/actions/admin";
import type { VideoStatus } from "@/generated/prisma/client";

interface VideoActionsProps {
  videoId: string;
  videoTitle: string;
  videoSlug: string;
  currentStatus: VideoStatus;
  creatorId: string;
}

const statusOptions: { value: VideoStatus; label: string; icon: React.ElementType }[] = [
  { value: "PUBLISHED", label: "Publish", icon: Globe },
  { value: "UNLISTED", label: "Unlist", icon: EyeOff },
  { value: "REJECTED", label: "Reject", icon: XCircle },
  { value: "DRAFT", label: "Set as Draft", icon: FileText },
];

export function VideoActions({
  videoId,
  videoTitle,
  videoSlug,
  currentStatus,
  creatorId,
}: VideoActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleStatusChange(status: VideoStatus) {
    startTransition(async () => {
      const result = await adminUpdateVideoStatus(videoId, status);
      if (result.success) {
        toast.success(`Video status changed to ${status}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  async function handleDelete() {
    const result = await deleteVideoAdmin(videoId);
    if (result.success) {
      toast.success("Video deleted");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-zinc-50"
            disabled={isPending}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border-zinc-700 bg-zinc-900"
        >
          {currentStatus === "PUBLISHED" && (
            <DropdownMenuItem
              onClick={() => window.open(`/watch/${videoSlug}`, "_blank")}
              className="text-zinc-200 focus:bg-zinc-800 focus:text-zinc-50"
            >
              <Eye className="mr-2 h-4 w-4" />
              View on Site
            </DropdownMenuItem>
          )}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-zinc-200 focus:bg-zinc-800 focus:text-zinc-50">
              <Globe className="mr-2 h-4 w-4" />
              Change Status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="border-zinc-700 bg-zinc-900">
              {statusOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  disabled={opt.value === currentStatus}
                  className="text-zinc-200 focus:bg-zinc-800 focus:text-zinc-50"
                >
                  <opt.icon className="mr-2 h-4 w-4" />
                  {opt.label}
                  {opt.value === currentStatus && " (current)"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem
            onClick={() => router.push(`/admin/users/${creatorId}`)}
            className="text-zinc-200 focus:bg-zinc-800 focus:text-zinc-50"
          >
            <UserCircle className="mr-2 h-4 w-4" />
            View Creator
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-700" />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-400 focus:bg-zinc-800 focus:text-red-300"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Video
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Video"
        description={`Permanently delete "${videoTitle}"? This will remove all files and data. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </>
  );
}
