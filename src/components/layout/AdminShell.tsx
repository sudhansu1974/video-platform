"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

interface AdminShellProps {
  user: {
    name?: string | null;
    username?: string;
    avatarUrl?: string | null;
  };
  children: React.ReactNode;
}

const pageTitles: Record<string, string> = {
  "/admin": "Overview",
  "/admin/users": "User Management",
  "/admin/videos": "Video Management",
  "/admin/categories": "Categories",
  "/admin/tags": "Tags",
  "/admin/processing": "Processing Queue",
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (/^\/admin\/users\/[^/]+$/.test(pathname)) return "User Details";
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path)) return title;
  }
  return "Admin";
}

export function AdminShell({ user, children }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const title = getPageTitle(pathname);

  return (
    <div className="flex h-screen bg-zinc-950">
      <AdminSidebar
        user={user}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          title={title}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
