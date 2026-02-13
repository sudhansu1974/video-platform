import Link from "next/link";
import { UserMenu } from "@/components/layout/UserMenu";
import { UploadButton } from "@/components/layout/UploadButton";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-4">
        {/* Left: Logo */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link href="/" className="flex-shrink-0 text-lg font-bold text-zinc-50 sm:text-xl">
            <span className="sm:hidden">VH</span>
            <span className="hidden sm:inline">VideoHub</span>
          </Link>
        </div>

        {/* Right: Upload + User */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <UploadButton />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
