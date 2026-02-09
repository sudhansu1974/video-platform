import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-zinc-50">Video Platform</h1>
      {session ? (
        <p className="text-zinc-400">
          Welcome back, {session.user.name}! Your role: {session.user.role}
        </p>
      ) : (
        <p className="text-zinc-400">
          Browse and discover videos. Sign in to upload your own.
        </p>
      )}
    </div>
  );
}
