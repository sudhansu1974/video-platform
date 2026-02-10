"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AdminProcessingFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleStatusChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const currentStatus = searchParams.get("status") || "ALL";

  return (
    <Select value={currentStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-[160px] border-zinc-700 bg-zinc-800 text-zinc-200">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent className="border-zinc-700 bg-zinc-900">
        <SelectItem value="ALL">All Status</SelectItem>
        <SelectItem value="QUEUED">Queued</SelectItem>
        <SelectItem value="PROCESSING">Processing</SelectItem>
        <SelectItem value="COMPLETED">Completed</SelectItem>
        <SelectItem value="FAILED">Failed</SelectItem>
      </SelectContent>
    </Select>
  );
}
