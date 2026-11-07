import "server-only";
import { after } from "next/server";
import { log } from "@/lib/log";
import { recomputeForTalent } from "@/lib/match-jobs";

/** Runs after the response is sent: refresh embeddings and cached match scores (section 7.7). */
export function onTalentChanged(talentId: string) {
  try {
    after(async () => {
      try {
        await recomputeForTalent(talentId);
      } catch (e) {
        log.warn("match.recompute_failed", {
          talentId,
          message: e instanceof Error ? e.message.slice(0, 120) : "unknown",
        });
      }
    });
  } catch {
    // Outside a request scope (e.g. scripts): skip; scores refresh on next read.
  }
}
