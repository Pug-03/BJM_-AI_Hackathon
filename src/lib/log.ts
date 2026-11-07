/**
 * Structured server logs without PII. Never pass emails, names, phone numbers,
 * message text or tokens in `meta` — use ids and counts only.
 */
type Level = "info" | "warn" | "error";
const PII_KEYS = /email|phone|name|text|token|otp|password|dob|address/i;

function scrub(meta: Record<string, unknown> = {}) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) out[k] = PII_KEYS.test(k) ? "[redacted]" : v;
  return out;
}

function write(level: Level, event: string, meta?: Record<string, unknown>) {
  const line = JSON.stringify({ t: new Date().toISOString(), level, event, ...scrub(meta) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const log = {
  info: (e: string, m?: Record<string, unknown>) => write("info", e, m),
  warn: (e: string, m?: Record<string, unknown>) => write("warn", e, m),
  error: (e: string, m?: Record<string, unknown>) => write("error", e, m),
};
