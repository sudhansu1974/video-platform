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
    console.log(`  [${i + 1}] ${created.name} (${created.slug})`);
  }
  console.log(`Created ${categories.length} categories.\n`);

  // Seed users
  console.log("Creating users...");
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
    console.log(`  ${created.role.padEnd(7)} — ${created.name} (${created.email})`);
  }
  console.log(`Created ${testUsers.length} users.\n`);

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
