import "server-only";
import { after } from "next/server";
import { log } from "@/lib/log";
import { recomputeForNeed, recomputeForTalent } from "@/lib/match-jobs";

function background(event: string, id: string, fn: () => Promise<void>) {
  try {
    after(async () => {
      try {
        await fn();
      } catch (e) {
        log.warn(event, { id, message: e instanceof Error ? e.message.slice(0, 120) : "unknown" });
      }
    });
  } catch {
    // Outside a request scope (e.g. scripts): skip; scores refresh on next change.
  }
}

/** Runs after the response is sent: refresh embeddings and cached match scores (section 7.7). */
export function onTalentChanged(talentId: string) {
  background("match.recompute_failed", talentId, () => recomputeForTalent(talentId));
}

export function onNeedChanged(needId: string) {
  background("match.need_recompute_failed", needId, () => recomputeForNeed(needId));
}
