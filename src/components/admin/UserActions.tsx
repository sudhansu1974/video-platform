"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Eye, Shield, UserX, Trash2 } from "lucide-react";
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
  updateUserRole,
  suspendUser,
  deleteUserAdmin,
} from "@/app/actions/admin";
import type { UserRole } from "@/generated/prisma/client";

interface UserActionsProps {
  userId: string;
  username: string;
  currentRole: UserRole;
}

const roles: { value: UserRole; label: string }[] = [
  { value: "VIEWER", label: "Viewer" },
  { value: "CREATOR", label: "Creator" },
  { value: "STUDIO", label: "Studio" },
  { value: "ADMIN", label: "Admin" },
];

export function UserActions({ userId, username, currentRole }: UserActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleRoleChange(role: UserRole) {
    startTransition(async () => {
      const result = await updateUserRole({ userId, role });
      if (result.success) {
        toast.success(`Role updated to ${role}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  async function handleSuspend() {
    const result = await suspendUser(userId);
    if (result.success) {
      toast.success(`User ${username} suspended`);
    } else {
      toast.error(result.error);
    }
  }

  async function handleDelete() {
    const result = await deleteUserAdmin(userId);
    if (result.success) {
      toast.success(`User ${username} deleted`);
      router.push("/admin/users");
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
          <DropdownMenuItem
            onClick={() => router.push(`/admin/users/${userId}`)}
            className="text-zinc-200 focus:bg-zinc-800 focus:text-zinc-50"
          >
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="text-zinc-200 focus:bg-zinc-800 focus:text-zinc-50">
              <Shield className="mr-2 h-4 w-4" />
              Change Role
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="border-zinc-700 bg-zinc-900">
              {roles.map((role) => (
                <DropdownMenuItem
                  key={role.value}
                  onClick={() => handleRoleChange(role.value)}
                  disabled={role.value === currentRole}
                  className="text-zinc-200 focus:bg-zinc-800 focus:text-zinc-50"
                >
                  {role.label}
                  {role.value === currentRole && " (current)"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator className="bg-zinc-700" />
          <DropdownMenuItem
            onClick={() => setSuspendOpen(true)}
            className="text-yellow-400 focus:bg-zinc-800 focus:text-yellow-300"
          >
            <UserX className="mr-2 h-4 w-4" />
            Suspend User
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-400 focus:bg-zinc-800 focus:text-red-300"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        title="Suspend User"
        description={`Suspend "${username}"? Their published videos will be unlisted and their role will be changed to Viewer.`}
        confirmLabel="Suspend"
        onConfirm={handleSuspend}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete User"
        description={`Permanently delete "${username}" and all their videos? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </>
  );
}
