"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Globe, EyeOff, XCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { bulkUpdateVideoStatus } from "@/app/actions/admin";

type BulkStatus = "PUBLISHED" | "UNLISTED" | "REJECTED" | "DRAFT";

interface BulkVideoActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
}

export function BulkVideoActions({
  selectedIds,
  onClearSelection,
}: BulkVideoActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<{
    status: BulkStatus;
    label: string;
  } | null>(null);

  if (selectedIds.length === 0) return null;

  function handleBulkAction(status: BulkStatus, label: string) {
    setConfirmAction({ status, label });
  }

  async function executeBulkAction() {
    if (!confirmAction) return;
    startTransition(async () => {
      const result = await bulkUpdateVideoStatus({
        videoIds: selectedIds,
        status: confirmAction.status,
      });
      if (result.success) {
        toast.success(`${result.updated} videos updated to ${confirmAction.status}`);
        onClearSelection();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2">
        <span className="text-sm font-medium text-blue-400">
          {selectedIds.length} selected
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => handleBulkAction("PUBLISHED", "Publish")}
            className="h-7 text-xs text-zinc-300 hover:text-zinc-50"
          >
            <Globe className="mr-1 h-3 w-3" />
            Publish
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => handleBulkAction("UNLISTED", "Unlist")}
            className="h-7 text-xs text-zinc-300 hover:text-zinc-50"
          >
            <EyeOff className="mr-1 h-3 w-3" />
            Unlist
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => handleBulkAction("REJECTED", "Reject")}
            className="h-7 text-xs text-zinc-300 hover:text-zinc-50"
          >
            <XCircle className="mr-1 h-3 w-3" />
            Reject
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() => handleBulkAction("DRAFT", "Draft")}
            className="h-7 text-xs text-zinc-300 hover:text-zinc-50"
          >
            <FileText className="mr-1 h-3 w-3" />
            Draft
          </Button>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          className="ml-auto h-7 text-xs text-zinc-500 hover:text-zinc-300"
        >
          Clear
        </Button>
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={`Bulk ${confirmAction?.label}`}
        description={`${confirmAction?.label} ${selectedIds.length} videos? This action will change their status.`}
        confirmLabel={confirmAction?.label ?? "Confirm"}
        confirmVariant={confirmAction?.status === "REJECTED" ? "destructive" : "default"}
        onConfirm={executeBulkAction}
      />
    </>
  );
}
