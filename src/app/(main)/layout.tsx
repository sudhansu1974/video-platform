import { Header } from "@/components/layout/Header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main className="container mx-auto max-w-screen-2xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
