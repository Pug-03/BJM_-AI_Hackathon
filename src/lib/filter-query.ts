import type { TalentFilter } from "./schemas/talent";

/** Serializes a talent filter into explore URL params (the page parses them back strictly). */
export function filterToQuery(f: TalentFilter) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  for (const s of f.skills ?? []) p.append("skill", s);
  if (f.location) p.set("location", f.location);
  if (f.workMode) p.set("mode", f.workMode);
  if (f.availability) p.set("availability", f.availability);
  if (f.educationLevel) p.set("education", f.educationLevel);
  if (f.hasCertificates) p.set("certs", "1");
  if (f.minRating) p.set("rating", String(f.minRating));
  return p.toString();
}

