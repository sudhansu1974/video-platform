"use client";

import { useState, useTransition } from "react";
import { Trash2, GitMerge } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { deleteTag, mergeTags } from "@/app/actions/admin";
import { formatRelativeTime } from "@/lib/format";

interface Tag {
  id: string;
  name: string;
  slug: string;
  videoCount: number;
  createdAt: Date;
}

interface TagsManagerProps {
  tags: Tag[];
  allTags: { id: string; name: string }[];
}

export function TagsManager({ tags, allTags }: TagsManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [mergeSource, setMergeSource] = useState<Tag | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string>("");

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await deleteTag(deleteTarget.id);
    if (result.success) {
      toast.success(`Tag "${deleteTarget.name}" deleted`);
    } else {
      toast.error(result.error);
    }
  }

  function handleMerge() {
    if (!mergeSource || !mergeTargetId) return;
    startTransition(async () => {
      const result = await mergeTags(mergeSource.id, mergeTargetId);
      if (result.success) {
        toast.success("Tags merged successfully");
        setMergeSource(null);
        setMergeTargetId("");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Tag</TableHead>
              <TableHead className="text-right text-zinc-400">Videos</TableHead>
              <TableHead className="text-zinc-400">Created</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map((tag) => (
              <TableRow
                key={tag.id}
                className="border-zinc-800 hover:bg-zinc-800/50"
              >
                <TableCell className="font-medium text-zinc-200">
                  {tag.name}
                </TableCell>
                <TableCell className="text-right text-sm text-zinc-300">
                  {tag.videoCount}
                </TableCell>
                <TableCell className="text-sm text-zinc-500">
                  {formatRelativeTime(tag.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-400 hover:text-blue-400"
                      onClick={() => {
                        setMergeSource(tag);
                        setMergeTargetId("");
                      }}
                      title="Merge into another tag"
                    >
                      <GitMerge className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-400 hover:text-red-400"
                      onClick={() => setDeleteTarget(tag)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {tags.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-12 text-center text-zinc-500"
                >
                  No tags found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Tag"
        description={
          deleteTarget
            ? `Delete tag "${deleteTarget.name}"? It will be removed from ${deleteTarget.videoCount} videos.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />

      {/* Merge Dialog */}
      <Dialog
        open={!!mergeSource}
        onOpenChange={(open) => !open && setMergeSource(null)}
      >
        <DialogContent className="border-zinc-800 bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="text-zinc-50">Merge Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Merge &ldquo;{mergeSource?.name}&rdquo; ({mergeSource?.videoCount}{" "}
              videos) into another tag. The source tag will be deleted.
            </p>
            <div className="space-y-2">
              <Label className="text-zinc-300">Target Tag</Label>
              <Select value={mergeTargetId} onValueChange={setMergeTargetId}>
                <SelectTrigger className="border-zinc-700 bg-zinc-800 text-zinc-200">
                  <SelectValue placeholder="Select target tag..." />
                </SelectTrigger>
                <SelectContent className="border-zinc-700 bg-zinc-900">
                  {allTags
                    .filter((t) => t.id !== mergeSource?.id)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setMergeSource(null)}
              disabled={isPending}
              className="text-zinc-400 hover:text-zinc-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMerge}
              disabled={!mergeTargetId || isPending}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isPending ? "Merging..." : "Merge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
