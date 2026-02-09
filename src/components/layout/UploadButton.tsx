"use client";

import Link from "next/link";
import { Upload } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";

const CREATOR_ROLES = ["CREATOR", "STUDIO", "ADMIN"];

export function UploadButton() {
  const { user, isAuthenticated } = useCurrentUser();

  if (!isAuthenticated || !user) return null;
  if (!CREATOR_ROLES.includes(user.role)) return null;

  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href="/upload" className="flex items-center gap-2">
        <Upload className="h-4 w-4" />
        Upload
      </Link>
    </Button>
  );
}
