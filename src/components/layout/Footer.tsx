import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-900">
      <div className="container mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row">
        <Link href="/" className="text-sm font-semibold text-zinc-400">
          VideoPlatform
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/browse" className="text-xs text-zinc-500 transition-colors hover:text-zinc-300">
            Browse
          </Link>
          <span className="text-xs text-zinc-600">About</span>
          <span className="text-xs text-zinc-600">Terms</span>
          <span className="text-xs text-zinc-600">Privacy</span>
        </nav>
        <p className="text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} VideoPlatform
        </p>
      </div>
    </footer>
  );
}
