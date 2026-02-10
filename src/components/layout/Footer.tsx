import Link from "next/link";

// TODO: Create actual About, Terms, Privacy, Contact pages

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-900">
      <div className="container mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row">
        <Link href="/" className="text-sm font-semibold text-zinc-400">
          VideoHub
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/browse"
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Browse
          </Link>
          <span className="cursor-default text-xs text-zinc-600">About</span>
          <span className="cursor-default text-xs text-zinc-600">Terms</span>
          <span className="cursor-default text-xs text-zinc-600">Privacy</span>
          <span className="cursor-default text-xs text-zinc-600">Contact</span>
        </nav>
        <p className="text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} VideoHub. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
