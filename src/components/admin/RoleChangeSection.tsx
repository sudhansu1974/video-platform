"use client";

import { useState, useTransition } from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { updateUserRole } from "@/app/actions/admin";
import type { UserRole } from "@/generated/prisma/client";

interface RoleChangeSectionProps {
  userId: string;
  currentRole: UserRole;
  isSelf: boolean;
}

const roleInfo: Record<
  UserRole,
  { label: string; description: string }
> = {
  VIEWER: {
    label: "Viewer",
    description: "Browse and watch only",
  },
  CREATOR: {
    label: "Creator",
    description: "Individual content creator with upload access",
  },
  STUDIO: {
    label: "Studio",
    description: "Organization account with upload access",
  },
  ADMIN: {
    label: "Admin",
    description: "Full platform administration access",
  },
};

function getRoleChangeWarning(
  currentRole: UserRole,
  newRole: UserRole
): string {
  if (newRole === "ADMIN") {
    return "This user will have full access to the admin panel. Are you sure?";
  }
  if (newRole === "VIEWER" && currentRole !== "VIEWER") {
    return "This user will lose upload access. Their existing videos will remain published.";
  }
  if (
    (newRole === "CREATOR" || newRole === "STUDIO") &&
    currentRole === "VIEWER"
  ) {
    return "This user will be able to upload videos and create a channel.";
  }
  return `Change role from ${roleInfo[currentRole].label} to ${roleInfo[newRole].label}?`;
}

export function RoleChangeSection({
  userId,
  currentRole,
  isSelf,
}: RoleChangeSectionProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (selectedRole === currentRole) return;
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    startTransition(async () => {
      const result = await updateUserRole({ userId, role: selectedRole });
      if (result.success) {
        toast.success(`Role updated to ${roleInfo[selectedRole].label}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-zinc-400" />
        <h3 className="text-lg font-semibold text-zinc-50">Change Role</h3>
      </div>

      {isSelf ? (
        <p className="text-sm text-zinc-500">
          You cannot change your own role.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {(
              ["VIEWER", "CREATOR", "STUDIO", "ADMIN"] as const
            ).map((role) => (
              <label
                key={role}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  selectedRole === role
                    ? "border-blue-500/50 bg-blue-500/5"
                    : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={selectedRole === role}
                  onChange={() => setSelectedRole(role)}
                  className="mt-0.5 accent-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-zinc-200">
                    {roleInfo[role].label}
                  </span>
                  {role === currentRole && (
                    <span className="ml-2 text-xs text-zinc-500">
                      (current)
                    </span>
                  )}
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {roleInfo[role].description}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <Button
            onClick={handleSave}
            disabled={selectedRole === currentRole || isPending}
            className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Update Role"}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Change User Role"
        description={getRoleChangeWarning(currentRole, selectedRole)}
        confirmLabel="Change Role"
        confirmVariant={
          selectedRole === "ADMIN" || selectedRole === "VIEWER"
            ? "destructive"
            : "default"
        }
        onConfirm={handleConfirm}
      />
    </div>
  );
}
