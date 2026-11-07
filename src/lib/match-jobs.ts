import "server-only";

/**
 * Background match recomputation. Stage 6 fills this in with embeddings
 * (OpenAI text-embedding-3-small + pgvector) and cached MatchScore rows.
 */
export async function recomputeForTalent(_talentId: string): Promise<void> {
  // Implemented in Stage 6 (matching).
}
