"use client";

import Link from "next/link";
import { LayoutDashboard, Settings, LogOut, ChevronDown } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserMenu() {
  const { user, isAuthenticated, isLoading } = useCurrentUser();

  if (isLoading) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-zinc-800" />;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-1 sm:gap-2">
        <Button variant="ghost" size="sm" className="px-2 sm:px-3" asChild>
          <Link href="/login">Login</Link>
        </Button>
        <Button size="sm" className="hidden px-2 sm:inline-flex sm:px-3" asChild>
          <Link href="/register">Sign Up</Link>
        </Button>
      </div>
    );
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-1 px-1 sm:gap-2 sm:px-2">
          <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? ""} />
            <AvatarFallback className="bg-zinc-700 text-xs text-zinc-200">
              {initials}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="hidden h-4 w-4 text-zinc-400 sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          className="flex items-center gap-2 text-red-400 focus:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
