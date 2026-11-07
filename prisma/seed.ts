/**
 * ABLE seed script. Stage 1 skeleton — Stage 3 fills in sample talent,
 * organizations, needs, posts, reviews and conversations (all labelled "Sample").
 * Run: pnpm db:seed
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  await db.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS vector");
  console.log("Seed: nothing to insert yet (Stage 3 adds sample data).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
