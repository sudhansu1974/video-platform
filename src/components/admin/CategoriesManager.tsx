"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryDialog } from "@/components/admin/CategoryDialog";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { deleteCategory } from "@/app/actions/admin";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  totalVideoCount: number;
  publishedVideoCount: number;
}

interface CategoriesManagerProps {
  categories: Category[];
}

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  function handleEdit(cat: Category) {
    setEditCategory(cat);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditCategory(null);
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await deleteCategory(deleteTarget.id);
    if (result.success) {
      toast.success("Category deleted");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {categories.length} categories
        </p>
        <Button
          onClick={handleAdd}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Name</TableHead>
              <TableHead className="text-zinc-400">Slug</TableHead>
              <TableHead className="text-zinc-400">Description</TableHead>
              <TableHead className="text-right text-zinc-400">
                Total Videos
              </TableHead>
              <TableHead className="text-right text-zinc-400">
                Published
              </TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow
                key={cat.id}
                className="border-zinc-800 hover:bg-zinc-800/50"
              >
                <TableCell className="font-medium text-zinc-200">
                  {cat.name}
                </TableCell>
                <TableCell className="text-sm text-zinc-400">
                  {cat.slug}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-sm text-zinc-500">
                  {cat.description || "—"}
                </TableCell>
                <TableCell className="text-right text-sm text-zinc-300">
                  {cat.totalVideoCount}
                </TableCell>
                <TableCell className="text-right text-sm text-zinc-300">
                  {cat.publishedVideoCount}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-400 hover:text-zinc-50"
                      onClick={() => handleEdit(cat)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-400 hover:text-red-400"
                      onClick={() => setDeleteTarget(cat)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-zinc-500"
                >
                  No categories yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editCategory}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Category"
        description={
          deleteTarget
            ? deleteTarget.totalVideoCount > 0
              ? `Cannot delete "${deleteTarget.name}" — it has ${deleteTarget.totalVideoCount} videos. Reassign them first.`
              : `Delete "${deleteTarget.name}"? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </>
  );
}
