import th from "@/config/sample-th.json";

/**
 * Thai display text for the fictional sample dataset (seeded in English). Exact-string lookup,
 * applied only for the Thai UI, so real users' text is never changed (it won't match a key).
 */
const map = th as Record<string, string>;

export function st<T extends string | null | undefined>(text: T, locale: string): T {
  if (locale !== "th" || !text) return text;
  return (map[text] ?? text) as T;
}

export function stList(list: string[], locale: string): string[] {
  return locale === "th" ? list.map((x) => map[x] ?? x) : list;
}
