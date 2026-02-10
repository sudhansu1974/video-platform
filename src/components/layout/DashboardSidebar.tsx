"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  Upload,
  BarChart3,
  Settings,
  Tv,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface DashboardSidebarProps {
  user: {
    name?: string | null;
    username?: string;
    email?: string | null;
    avatarUrl?: string | null;
    role?: string;
  };
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function getNavItems(role?: string) {
  const isChannelRole = role === "CREATOR" || role === "STUDIO" || role === "ADMIN";

  return [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "My Videos",
      href: "/dashboard/videos",
      icon: Video,
    },
    {
      label: "Upload",
      href: "/upload",
      icon: Upload,
    },
    ...(isChannelRole
      ? [
          {
            label: "Channel",
            href: "/dashboard/channel",
            icon: Tv,
          },
        ]
      : []),
    {
      label: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
      disabled: true,
      badge: "Soon",
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];
}

export function DashboardSidebar({
  user,
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(user.role);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
        {!collapsed && (
          <Link href="/" className="text-lg font-bold text-zinc-50">
            VideoHub
          </Link>
        )}
        {/* Desktop collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="hidden text-zinc-400 hover:text-zinc-50 lg:flex"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileClose}
          className="text-zinc-400 hover:text-zinc-50 lg:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);

          return (
            <Link
              key={item.href}
              href={item.disabled ? "#" : item.href}
              onClick={item.disabled ? (e) => e.preventDefault() : onMobileClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-l-2 border-blue-500 bg-blue-500/10 text-blue-400"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50",
                item.disabled && "cursor-not-allowed opacity-50"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="bg-zinc-700 text-xs text-zinc-400">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );
        })}

        {/* Admin link — only for ADMIN users */}
        {user.role === "ADMIN" && (
          <>
            {!collapsed && <Separator className="my-2 bg-zinc-800" />}
            {collapsed && <div className="my-2" />}
            <Link
              href="/admin"
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "border-l-2 border-red-500 bg-red-500/10 text-red-400"
                  : "text-red-400/70 hover:bg-zinc-800 hover:text-red-400"
              )}
              title={collapsed ? "Admin Panel" : undefined}
            >
              <Shield className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="flex-1">Admin Panel</span>}
            </Link>
          </>
        )}
      </nav>

      {/* User info at bottom */}
      <div className="border-t border-zinc-800 p-3">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? ""} />
            <AvatarFallback className="bg-zinc-700 text-xs text-zinc-200">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-200">
                {user.name}
              </p>
              <p className="truncate text-xs text-zinc-500">
                {user.role}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] bg-zinc-900 transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:border-r lg:border-zinc-800 lg:bg-zinc-900",
          collapsed ? "lg:w-[68px]" : "lg:w-[240px]",
          "transition-[width] duration-200"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
