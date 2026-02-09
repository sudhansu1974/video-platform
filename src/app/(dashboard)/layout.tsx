import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "VIEWER") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main className="container mx-auto max-w-screen-2xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
