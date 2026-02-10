import type { UserRole } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: UserRole;
  className?: string;
}

const roleConfig: Record<UserRole, { label: string; className: string }> = {
  VIEWER: {
    label: "Viewer",
    className: "bg-zinc-700 text-zinc-200",
  },
  CREATOR: {
    label: "Creator",
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  STUDIO: {
    label: "Studio",
    className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  ADMIN: {
    label: "Admin",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
