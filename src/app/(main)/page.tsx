export const revalidate = 60;

import { getHomepageData } from "@/lib/queries/browse";
import { VideoGrid } from "@/components/video/VideoGrid";
import { SectionHeader } from "@/components/browse/SectionHeader";

export default async function HomePage() {
  const { trending, latest, categorySections } = await getHomepageData();

  return (
    <div className="space-y-10">
      {/* Trending */}
      <section className="space-y-4">
        <SectionHeader title="Trending" href="/browse?sort=popular" />
        <VideoGrid videos={trending} emptyMessage="No trending videos yet" />
      </section>

      {/* Latest */}
      <section className="space-y-4">
        <SectionHeader title="Latest" href="/browse?sort=latest" />
        <VideoGrid videos={latest} emptyMessage="No videos yet" />
      </section>

      {/* Category Sections */}
      {categorySections.map(({ category, videos }) => (
        <section key={category.id} className="space-y-4">
          <SectionHeader
            title={category.name}
            href={`/category/${category.slug}`}
            linkText="See all"
          />
          <VideoGrid videos={videos} />
        </section>
      ))}
    </div>
  );
}
