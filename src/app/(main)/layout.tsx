import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategoryPills } from "@/components/browse/CategoryPills";
import { getAllCategories } from "@/lib/queries/browse";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getAllCategories();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <Header categories={categories} />
      <div className="sticky top-14 z-40 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm sm:top-16">
        <div className="container mx-auto max-w-screen-2xl px-3 py-2 sm:px-4 sm:py-3">
          <CategoryPills categories={categories} />
        </div>
      </div>
      <main className="container mx-auto max-w-screen-2xl flex-1 px-3 py-6 sm:px-4 sm:py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
