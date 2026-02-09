import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AccountSectionProps {
  email: string;
  username: string;
  role: string;
  createdAt: Date | string;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const masked = local[0] + "***" + (local.length > 1 ? local[local.length - 1] : "");
  return `${masked}@${domain}`;
}

export function AccountSection({
  email,
  username,
  role,
  createdAt,
}: AccountSectionProps) {
  const joinDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs text-zinc-500">Email</p>
          <p className="mt-1 text-sm text-zinc-300">{maskEmail(email)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Username</p>
          <p className="mt-1 text-sm text-zinc-300">@{username}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Role</p>
          <div className="mt-1">
            <Badge variant="secondary" className="text-xs">
              {role}
            </Badge>
          </div>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Member Since</p>
          <p className="mt-1 text-sm text-zinc-300">{joinDate}</p>
        </div>
      </div>

      <Link href={`/channel/${username}`}>
        <Button variant="outline" size="sm" className="mt-2 gap-2">
          <ExternalLink className="h-4 w-4" />
          View My Channel
        </Button>
      </Link>
    </div>
  );
}
