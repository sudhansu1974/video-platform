import { getAdminCategories } from "@/lib/queries/admin";
import { CategoriesManager } from "@/components/admin/CategoriesManager";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return <CategoriesManager categories={categories} />;
}
