/**
 * ABLE seed: 12 sample talent, 5 sample organizations of each type, hiring
 * needs, posts, certificates, reviews and conversations. All fictional and
 * flagged `isSample` (shown with a "Sample" label). Idempotent.
 * Run: pnpm db:seed
 */
import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { seedSamples } from "../src/server/seed-core";
import { recomputeNeed, type EmbedFn } from "../src/lib/match-engine";

const db = new PrismaClient();

async function main() {
  try {
    await db.$executeRawUnsafe("CREATE EXTENSION IF NOT EXISTS vector");
  } catch {
    console.warn("pgvector not available — matching falls back to skill overlap until it is installed.");
  }
  const { talents, orgs } = await seedSamples(db);
  console.log(`Seeded ${talents.size} sample talent and ${orgs.size} sample organizations.`);

  // Match scores for every open need (embeddings when OPENAI_API_KEY is set, lexical otherwise).
  const openai = process.env.OPENAI_API_KEY ? new OpenAI() : null;
  const embed: EmbedFn | undefined = openai
    ? async (input) => (await openai.embeddings.create({ model: "text-embedding-3-small", input })).data.map((d) => d.embedding)
    : undefined;
  const needs = await db.hiringNeed.findMany({ where: { isOpen: true }, select: { id: true } });
  for (const n of needs) await recomputeNeed(db, n.id, embed);
  console.log(`Scored ${needs.length} hiring needs (${embed ? "embeddings" : "lexical similarity"}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
