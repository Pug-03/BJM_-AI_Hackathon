import "server-only";
import { log } from "./log";

/** Topic for one conversation. Payloads are empty "something changed" nudges — the client
 * always re-fetches through an authorized server action, so nothing private travels here. */
export const convoTopic = (id: string) => `able-convo-${id}`;
export const userTopic = (id: string) => `able-user-${id}`;

/** Supabase Realtime broadcast via REST (works from serverless). No-op without keys: clients poll. */
export async function nudge(topics: string[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !topics.length) return;
  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ messages: topics.map((topic) => ({ topic, event: "change", payload: {} })) }),
    });
  } catch (e) {
    log.warn("realtime.nudge_failed", { message: e instanceof Error ? e.message.slice(0, 80) : "unknown" });
  }
}
