import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";
import slugify from "slugify";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const categories = [
  { name: "Film", description: "Movies, short films, and cinematic content" },
  { name: "Music", description: "Music videos, performances, and concerts" },
  { name: "Comedy", description: "Stand-up, sketches, and funny videos" },
  { name: "Documentary", description: "Documentaries and non-fiction storytelling" },
  { name: "Education", description: "Tutorials, courses, and educational content" },
  { name: "Sports", description: "Sports highlights, analysis, and fitness" },
  { name: "Gaming", description: "Gameplay, reviews, and esports" },
  { name: "News", description: "News coverage and current events" },
  { name: "Technology", description: "Tech reviews, tutorials, and innovations" },
  { name: "Entertainment", description: "General entertainment and variety content" },
  { name: "How-To", description: "DIY, crafts, and instructional guides" },
  { name: "Travel", description: "Travel vlogs, guides, and destination content" },
];

const testUsers = [
  {
    email: "admin@videoplatform.dev",
    username: "admin",
    name: "Admin",
    password: "Admin123!",
    role: "ADMIN" as const,
  },
  {
    email: "creator@videoplatform.dev",
    username: "creator-jane",
    name: "Jane Creator",
    password: "Creator123!",
    role: "CREATOR" as const,
  },
  {
    email: "studio@videoplatform.dev",
    username: "apex-studio",
    name: "Apex Studio",
    password: "Studio123!",
    role: "STUDIO" as const,
  },
];

const tagNames = [
  "tutorial", "vlog", "4k", "review", "cinematic", "behind-the-scenes",
  "live", "short-film", "interview", "highlights", "unboxing", "reaction",
  "timelapse", "drone", "acoustic", "indie", "beginner", "advanced",
];

// Test videos distributed across users and categories
const testVideos = [
  { title: "The Art of Cinematography", category: "Film", tags: ["cinematic", "4k", "tutorial"], duration: 1820, views: 452000, daysAgo: 3 },
  { title: "Building a PC in 2025 - Complete Guide", category: "Technology", tags: ["tutorial", "review", "beginner"], duration: 2400, views: 128000, daysAgo: 5 },
  { title: "Morning Routine Vlog - NYC", category: "Entertainment", tags: ["vlog", "4k"], duration: 620, views: 89000, daysAgo: 1 },
  { title: "Learn Guitar in 30 Days - Day 1", category: "Education", tags: ["tutorial", "acoustic", "beginner"], duration: 1200, views: 340000, daysAgo: 12 },
  { title: "Epic Mountain Drone Footage", category: "Travel", tags: ["drone", "4k", "cinematic"], duration: 480, views: 267000, daysAgo: 7 },
  { title: "Stand-Up Comedy Special: City Lights", category: "Comedy", tags: ["live"], duration: 3600, views: 510000, daysAgo: 15 },
  { title: "World Cup 2025 Best Goals", category: "Sports", tags: ["highlights", "4k"], duration: 900, views: 390000, daysAgo: 2 },
  { title: "Indie Game Dev Diary #12", category: "Gaming", tags: ["indie", "behind-the-scenes", "vlog"], duration: 1500, views: 23000, daysAgo: 4 },
  { title: "How to Make Sourdough Bread", category: "How-To", tags: ["tutorial", "beginner"], duration: 780, views: 175000, daysAgo: 20 },
  { title: "Breaking News: Tech Industry Shifts", category: "News", tags: ["interview"], duration: 300, views: 95000, daysAgo: 1 },
  { title: "Classical Piano Performance - Chopin", category: "Music", tags: ["live", "acoustic"], duration: 1080, views: 56000, daysAgo: 30 },
  { title: "Nature Documentary: Ocean Deep", category: "Documentary", tags: ["cinematic", "4k"], duration: 2700, views: 420000, daysAgo: 25 },
  { title: "React 19 Full Course for Beginners", category: "Education", tags: ["tutorial", "beginner"], duration: 3200, views: 210000, daysAgo: 8 },
  { title: "Tokyo Street Food Tour", category: "Travel", tags: ["vlog", "4k"], duration: 1100, views: 185000, daysAgo: 14 },
  { title: "iPhone 17 Pro Unboxing & Review", category: "Technology", tags: ["unboxing", "review", "4k"], duration: 720, views: 480000, daysAgo: 2 },
  { title: "Skateboard Tricks Compilation 2025", category: "Sports", tags: ["highlights", "timelapse"], duration: 540, views: 67000, daysAgo: 9 },
  { title: "Short Film: The Last Letter", category: "Film", tags: ["short-film", "cinematic"], duration: 960, views: 134000, daysAgo: 18 },
  { title: "Gaming Setup Tour - 2025 Edition", category: "Gaming", tags: ["review", "4k", "vlog"], duration: 850, views: 198000, daysAgo: 6 },
  { title: "Best Comedy Sketches Compilation", category: "Comedy", tags: ["reaction", "highlights"], duration: 1400, views: 315000, daysAgo: 11 },
  { title: "How to Fix a Leaky Faucet", category: "How-To", tags: ["tutorial", "beginner"], duration: 420, views: 92000, daysAgo: 35 },
  { title: "Behind the Scenes: Music Video Shoot", category: "Music", tags: ["behind-the-scenes", "vlog", "cinematic"], duration: 660, views: 41000, daysAgo: 22 },
  { title: "Climate Change Documentary 2025", category: "Documentary", tags: ["interview", "cinematic"], duration: 3400, views: 156000, daysAgo: 40 },
  { title: "Daily News Roundup - January", category: "News", tags: ["highlights"], duration: 240, views: 28000, daysAgo: 45 },
  { title: "Advanced CSS Animations Tutorial", category: "Education", tags: ["tutorial", "advanced"], duration: 1800, views: 73000, daysAgo: 16 },
  { title: "Bali Travel Guide - Hidden Gems", category: "Travel", tags: ["vlog", "drone", "4k"], duration: 1350, views: 142000, daysAgo: 10 },
  { title: "Survival Game Marathon - 12 Hours", category: "Gaming", tags: ["live", "highlights"], duration: 2100, views: 85000, daysAgo: 3 },
  // Draft/Unlisted videos (should NOT appear in public listings)
  { title: "Draft: Upcoming Review (Work in Progress)", category: "Technology", tags: ["review"], duration: 300, views: 0, daysAgo: 1, status: "DRAFT" as const },
  { title: "Unlisted BTS Footage", category: "Film", tags: ["behind-the-scenes"], duration: 450, views: 120, daysAgo: 5, status: "UNLISTED" as const },
];

async function main() {
  console.log("Starting seed...\n");

  // Clear existing data in correct FK order
  console.log("Clearing existing data...");
  await prisma.videoTag.deleteMany();
  await prisma.processingJob.deleteMany();
  await prisma.video.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  console.log("Cleared all tables.\n");

  // Seed categories
  console.log("Creating categories...");
  const categoryMap = new Map<string, string>();
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const created = await prisma.category.upsert({
      where: { slug: slugify(cat.name, { lower: true }) },
      update: {},
      create: {
        name: cat.name,
        slug: slugify(cat.name, { lower: true }),
        description: cat.description,
        sortOrder: i,
      },
    });
    categoryMap.set(cat.name, created.id);
    console.log(`  [${i + 1}] ${created.name} (${created.slug})`);
  }
  console.log(`Created ${categories.length} categories.\n`);

  // Seed tags
  console.log("Creating tags...");
  const tagMap = new Map<string, string>();
  for (const tagName of tagNames) {
    const created = await prisma.tag.upsert({
      where: { slug: tagName },
      update: {},
      create: {
        name: tagName,
        slug: tagName,
      },
    });
    tagMap.set(tagName, created.id);
    console.log(`  #${created.name}`);
  }
  console.log(`Created ${tagNames.length} tags.\n`);

  // Seed users
  console.log("Creating users...");
  const userIds: string[] = [];
  for (const user of testUsers) {
    const passwordHash = await hash(user.password, 12);
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        username: user.username,
        name: user.name,
        passwordHash,
        role: user.role,
        emailVerified: new Date(),
      },
    });
    userIds.push(created.id);
    console.log(`  ${created.role.padEnd(7)} — ${created.name} (${created.email})`);
  }
  console.log(`Created ${testUsers.length} users.\n`);

  // Seed videos
  console.log("Creating videos...");
  for (let i = 0; i < testVideos.length; i++) {
    const v = testVideos[i];
    const userId = userIds[i % userIds.length]; // distribute across users
    const categoryId = categoryMap.get(v.category);
    const slug = slugify(v.title, { lower: true, strict: true });
    const publishedAt = new Date();
    publishedAt.setDate(publishedAt.getDate() - v.daysAgo);
    const status = v.status ?? ("PUBLISHED" as const);

    const created = await prisma.video.create({
      data: {
        title: v.title,
        slug,
        description: `This is a sample description for "${v.title}". This video showcases great content in the ${v.category} category.`,
        userId,
        categoryId: categoryId ?? null,
        status,
        duration: v.duration,
        fileUrl: `/uploads/videos/${slug}.mp4`,
        thumbnailUrl: null,
        viewCount: v.views,
        publishedAt: status === "PUBLISHED" ? publishedAt : null,
        createdAt: publishedAt,
      },
    });

    // Create video-tag associations
    for (const tagSlug of v.tags) {
      const tagId = tagMap.get(tagSlug);
      if (tagId) {
        await prisma.videoTag.create({
          data: { videoId: created.id, tagId },
        });
      }
    }

    console.log(`  [${i + 1}] ${status.padEnd(9)} "${created.title}" (${v.tags.join(", ")})`);
  }
  console.log(`Created ${testVideos.length} videos.\n`);

  console.log("Seed completed!");
  console.log("Test accounts:");
  for (const user of testUsers) {
    console.log(`  ${user.email} / ${user.password} (${user.role})`);
  }
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
