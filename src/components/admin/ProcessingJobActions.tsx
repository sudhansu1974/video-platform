"use client";

import { useState, useTransition } from "react";
import { RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { retryProcessingJob } from "@/app/actions/admin";

interface ProcessingJobActionsProps {
  jobId: string;
  jobStatus: string;
  videoTitle: string;
}

export function ProcessingJobActions({
  jobId,
  jobStatus,
  videoTitle,
}: ProcessingJobActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [retryOpen, setRetryOpen] = useState(false);

  if (jobStatus !== "FAILED") return null;

  function handleRetry() {
    startTransition(async () => {
      const result = await retryProcessingJob(jobId);
      if (result.success) {
        toast.success(`Retrying processing for "${videoTitle}"`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-zinc-400 hover:text-blue-400"
        onClick={() => setRetryOpen(true)}
        disabled={isPending}
        title="Retry processing"
      >
        <RotateCw className="h-4 w-4" />
      </Button>

      <ConfirmDialog
        open={retryOpen}
        onOpenChange={setRetryOpen}
        title="Retry Processing"
        description={`Retry processing for "${videoTitle}"? This will reset the job and start processing again.`}
        confirmLabel="Retry"
        confirmVariant="default"
        onConfirm={handleRetry}
      />
    </>
  );
}
