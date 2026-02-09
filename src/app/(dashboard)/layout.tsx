import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Toaster } from "@/components/ui/sonner";

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
    <>
      <DashboardShell
        user={{
          name: session.user.name,
          username: session.user.username,
          email: session.user.email,
          avatarUrl: session.user.avatarUrl,
          role: session.user.role,
        }}
      >
        {children}
      </DashboardShell>
      <Toaster />
    </>
  );
}
