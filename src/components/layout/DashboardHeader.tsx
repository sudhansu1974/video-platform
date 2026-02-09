"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/UserMenu";

interface DashboardHeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function DashboardHeader({ title, onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="text-zinc-400 hover:text-zinc-50 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold text-zinc-50">{title}</h1>
      </div>
      <UserMenu />
    </header>
  );
}
