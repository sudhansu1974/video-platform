"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-50">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-zinc-400">An unexpected error occurred.</p>
          <button
            onClick={reset}
            className="rounded-md bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
