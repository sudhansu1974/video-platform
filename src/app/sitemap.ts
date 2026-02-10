import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/browse`,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Category pages
  const categories = await prisma.category.findMany({
    select: { slug: true },
  });

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/category/${cat.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Published videos
  const videos = await prisma.video.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
    take: 5000,
  });

  const videoPages: MetadataRoute.Sitemap = videos.map((video) => ({
    url: `${baseUrl}/watch/${video.slug}`,
    lastModified: video.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Channel pages (users with published videos)
  const channels = await prisma.user.findMany({
    where: {
      role: { in: ["CREATOR", "STUDIO", "ADMIN"] },
      videos: { some: { status: "PUBLISHED" } },
    },
    select: { username: true },
  });

  const channelPages: MetadataRoute.Sitemap = channels.map((user) => ({
    url: `${baseUrl}/channel/${user.username}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...videoPages, ...channelPages];
}
