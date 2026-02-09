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
  {
    name: "Documentary",
    description: "Documentaries and non-fiction storytelling",
  },
  {
    name: "Education",
    description: "Tutorials, courses, and educational content",
  },
  { name: "Sports", description: "Sports highlights, analysis, and fitness" },
  { name: "Gaming", description: "Gameplay, reviews, and esports" },
  { name: "News", description: "News coverage and current events" },
  {
    name: "Technology",
    description: "Tech reviews, tutorials, and innovations",
  },
  {
    name: "Entertainment",
    description: "General entertainment and variety content",
  },
  { name: "How-To", description: "DIY, crafts, and instructional guides" },
  {
    name: "Travel",
    description: "Travel vlogs, guides, and destination content",
  },
];

async function main() {
  console.log("Starting seed...");

  // Seed categories
  console.log("Creating categories...");
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    await prisma.category.upsert({
      where: { slug: slugify(category.name, { lower: true }) },
      update: {},
      create: {
        name: category.name,
        slug: slugify(category.name, { lower: true }),
        description: category.description,
        sortOrder: i,
      },
    });
  }
  console.log(`Created ${categories.length} categories`);

  // Seed admin user
  console.log("Creating admin user...");
  const adminPassword = await hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      username: "admin",
      name: "Admin User",
      passwordHash: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log("Created admin user (admin@example.com / admin123)");

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
