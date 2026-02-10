"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createCategory, updateCategory } from "@/app/actions/admin";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  } | null;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
}: CategoryDialogProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const isEditing = !!category;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setDescription(category.description || "");
    } else {
      setName("");
      setSlug("");
      setDescription("");
    }
  }, [category, open]);

  // Auto-generate slug from name
  function handleNameChange(value: string) {
    setName(value);
    if (!isEditing) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        const result = await updateCategory({
          categoryId: category!.id,
          name,
          slug,
          description: description || undefined,
        });
        if (result.success) {
          toast.success("Category updated");
          onOpenChange(false);
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await createCategory({
          name,
          slug: slug || undefined,
          description: description || undefined,
        });
        if (result.success) {
          toast.success("Category created");
          onOpenChange(false);
        } else {
          toast.error(result.error);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-zinc-800 bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-zinc-50">
            {isEditing ? "Edit Category" : "Add Category"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">Name</Label>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Category name"
              required
              className="border-zinc-700 bg-zinc-800 text-zinc-200"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="category-slug"
              required
              className="border-zinc-700 bg-zinc-800 text-zinc-200"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              rows={3}
              className="border-zinc-700 bg-zinc-800 text-zinc-200"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-zinc-400 hover:text-zinc-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {loading ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
