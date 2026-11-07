/**
 * ABLE seed: 12 sample talent, 5 sample organizations of each type, hiring
 * needs, posts, certificates, reviews and conversations. All fictional and
 * flagged `isSample` (shown with a "Sample" label). Idempotent.
 * Run: pnpm db:seed
 */
import { PrismaClient } from "@prisma/client";
import { seedSamples } from "../src/server/seed-core";

const db = new PrismaClient();

async function main() {
  try {
    await db.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS vector");
  } catch {
    console.warn("pgvector not available — matching falls back to skill overlap until it is installed.");
  }
  const { talents, orgs } = await seedSamples(db);
  console.log(`Seeded ${talents.size} sample talent and ${orgs.size} sample organizations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
