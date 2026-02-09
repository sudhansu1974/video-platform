import Link from "next/link";
import { Home, Compass } from "lucide-react";
import { UserMenu } from "@/components/layout/UserMenu";
import { UploadButton } from "@/components/layout/UploadButton";
import { SearchInput } from "@/components/search/SearchInput";
import { MobileSearchButton } from "@/components/search/MobileSearchButton";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { CategoriesDropdown } from "@/components/layout/CategoriesDropdown";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface HeaderProps {
  categories?: Category[];
}

export function Header({ categories = [] }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-4">
        {/* Left: Mobile menu + Logo + Nav */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <MobileMenu categories={categories} />
          <Link href="/" className="flex-shrink-0 text-lg font-bold text-zinc-50 sm:text-xl">
            <span className="sm:hidden">VP</span>
            <span className="hidden sm:inline">VideoPlatform</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-50"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link
              href="/browse"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-50"
            >
              <Compass className="h-4 w-4" />
              Browse
            </Link>
            {categories.length > 0 && (
              <CategoriesDropdown categories={categories} />
            )}
          </nav>
        </div>

        {/* Right: Search + Upload + User */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <MobileSearchButton />
          <SearchInput variant="header" className="hidden sm:block" />
          <UploadButton />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
