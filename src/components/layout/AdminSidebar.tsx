"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Video,
  FolderTree,
  Tags,
  Cpu,
  ArrowLeft,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface AdminSidebarProps {
  user: {
    name?: string | null;
    username?: string;
    avatarUrl?: string | null;
  };
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Videos", href: "/admin/videos", icon: Video },
  { label: "Categories", href: "/admin/categories", icon: FolderTree },
  { label: "Tags", href: "/admin/tags", icon: Tags },
  { label: "Processing", href: "/admin/processing", icon: Cpu },
];

const bottomItems = [
  { label: "Back to Site", href: "/", icon: ArrowLeft },
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
];

export function AdminSidebar({
  user,
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "A";

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-400" />
            <span className="text-lg font-bold text-zinc-50">Admin</span>
          </div>
        )}
        {collapsed && <Shield className="mx-auto h-5 w-5 text-red-400" />}
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
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-l-2 border-blue-500 bg-blue-500/10 text-blue-400"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
            </Link>
          );
        })}

        {!collapsed && <Separator className="my-3 bg-zinc-800" />}
        {collapsed && <div className="my-3" />}

        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onMobileClose}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-50"
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="flex-1">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* User info */}
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
              <p className="truncate text-xs text-red-400">Admin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] bg-zinc-900 transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
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
