import "server-only";

/**
 * Daily.co Prebuilt (section 2): one private room per conversation, created server-side,
 * with short-lived meeting tokens. Without DAILY_API_KEY the call buttons explain why.
 */
const API = "https://api.daily.co/v1";
const TTL = 2 * 60 * 60; // 2 hours

async function daily<T>(path: string, init?: RequestInit): Promise<T | null> {
  const key = process.env.DAILY_API_KEY;
  if (!key) return null;
  const r = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!r.ok) return null;
  return (await r.json()) as T;
}

/** Returns the room URL, creating (or re-creating after expiry) the conversation's room. */
export async function ensureRoom(name: string): Promise<string | null> {
  const exp = Math.floor(Date.now() / 1000) + TTL;
  const existing = await daily<{ url: string; config?: { exp?: number } }>(`/rooms/${name}`);
  if (existing?.url && (!existing.config?.exp || existing.config.exp > Date.now() / 1000 + 300))
    return existing.url;
  if (existing) await daily(`/rooms/${name}`, { method: "DELETE" });
  const created = await daily<{ url: string }>(`/rooms`, {
    method: "POST",
    body: JSON.stringify({
      name,
      privacy: "private",
      properties: { exp, enable_prejoin_ui: true, enable_chat: false, eject_at_room_exp: true },
    }),
  });
  return created?.url ?? null;
}

export async function meetingToken(room: string, userName: string, video: boolean): Promise<string | null> {
  const r = await daily<{ token: string }>(`/meeting-tokens`, {
    method: "POST",
    body: JSON.stringify({
      properties: {
        room_name: room,
        user_name: userName.slice(0, 60),
        exp: Math.floor(Date.now() / 1000) + TTL,
        start_video_off: !video,
      },
    }),
  });
  return r?.token ?? null;
}

export const roomName = (conversationId: string) => `able-${conversationId}`.slice(0, 64);
