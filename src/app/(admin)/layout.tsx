import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/layout/AdminShell";
import { Toaster } from "@/components/ui/sonner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <>
      <AdminShell
        user={{
          name: session.user.name,
          username: session.user.username,
          avatarUrl: session.user.avatarUrl,
        }}
      >
        {children}
      </AdminShell>
      <Toaster />
    </>
  );
}
