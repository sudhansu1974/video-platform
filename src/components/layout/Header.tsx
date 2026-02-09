import Link from "next/link";
import { UserMenu } from "@/components/layout/UserMenu";
import { UploadButton } from "@/components/layout/UploadButton";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-900">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-zinc-50">
          VideoPlatform
        </Link>
        <div className="flex items-center gap-3">
          <UploadButton />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
