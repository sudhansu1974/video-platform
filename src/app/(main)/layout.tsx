import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <Header />
      <main className="container mx-auto max-w-screen-2xl flex-1 px-3 py-6 sm:px-4 sm:py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
