"use client";

import Link from "next/link";
import { FolderOpen, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoriesDropdownProps {
  categories: Category[];
}

export function CategoriesDropdown({ categories }: CategoriesDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-50"
        >
          <FolderOpen className="h-4 w-4" />
          Categories
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {categories.map((cat) => (
          <DropdownMenuItem key={cat.id} asChild>
            <Link href={`/category/${cat.slug}`}>{cat.name}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
