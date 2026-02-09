import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UploadForm } from "@/components/video/UploadForm";

export default async function UploadPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const creatorRoles = ["CREATOR", "STUDIO", "ADMIN"] as const;
  if (!creatorRoles.includes(session.user.role as (typeof creatorRoles)[number])) {
    redirect("/");
  }

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Upload Video</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Upload a video to share with your audience.
        </p>
      </div>
      <UploadForm categories={categories} />
    </div>
  );
}
