import "server-only";
import { db } from "./db";
import { services } from "./env";
import { recomputeNeed, recomputeTalent } from "./match-engine";
import { embedder } from "./ai";

const embed = () => (services.speech() ? (t: string[]) => embedder.embed(t) : undefined);

/** Background recomputation (run via `after()`): embeddings + cached MatchScore rows. */
export async function recomputeForTalent(talentId: string): Promise<void> {
  await recomputeTalent(db, talentId, embed());
}

export async function recomputeForNeed(needId: string): Promise<void> {
  await recomputeNeed(db, needId, embed());
}
