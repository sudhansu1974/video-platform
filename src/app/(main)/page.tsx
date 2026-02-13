export const revalidate = 60;

import { getSimpleVideos } from "@/lib/queries/browse";
import { SimpleVideoCard } from "@/components/video/SimpleVideoCard";

export default async function HomePage() {
  const videos = await getSimpleVideos(4);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {videos.map((video) => (
          <SimpleVideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
