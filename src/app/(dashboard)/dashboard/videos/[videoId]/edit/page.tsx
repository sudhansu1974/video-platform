import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getVideoById } from "@/lib/queries/video";
import { getCategories } from "@/app/actions/video";
import { VideoEditForm } from "@/components/video/VideoEditForm";

interface PageProps {
  params: Promise<{ videoId: string }>;
}

export default async function VideoEditPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { videoId } = await params;

  const [video, categories] = await Promise.all([
    getVideoById(videoId),
    getCategories(),
  ]);

  if (!video) notFound();

  // Verify ownership (or admin)
  if (video.userId !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/dashboard/videos");
  }

  // Flatten tags for the form
  const tags = video.videoTags.map((vt) => vt.tag.name);
  const processingJob = video.processingJobs[0] ?? null;

  return (
    <VideoEditForm
      video={{
        id: video.id,
        title: video.title,
        slug: video.slug,
        description: video.description,
        status: video.status,
        categoryId: video.categoryId,
        tags,
        thumbnailUrl: video.thumbnailUrl,
        hlsUrl: video.hlsUrl,
        fileUrl: video.fileUrl,
        duration: video.duration,
        viewCount: video.viewCount,
        createdAt: video.createdAt.toISOString(),
        processingJob: processingJob
          ? {
              status: processingJob.status,
              resolution: processingJob.resolution,
              completedAt: processingJob.completedAt?.toISOString() ?? null,
            }
          : null,
      }}
      categories={categories}
    />
  );
}
