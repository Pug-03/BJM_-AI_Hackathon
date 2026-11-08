import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";

export const revalidate = 3600;

/** Public pages + public, non-sandbox talent and organization profiles, in EN and TH. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  const pages = [
    "",
    "/explore",
    "/login",
    "/privacy",
    "/terms",
    "/cookies",
    "/data-rights",
    "/accessibility",
    "/employer/quota",
    "/built-vs-planned",
  ];
  const [talent, orgs] = await Promise.all([
    db.talentProfile
      .findMany({
        where: { isPublic: true, user: { isSandbox: false } },
        select: { handle: true, updatedAt: true },
        take: 5000,
      })
      .catch(() => []),
    db.orgProfile
      .findMany({
        where: { user: { isSandbox: false } },
        select: { handle: true, updatedAt: true },
        take: 5000,
      })
      .catch(() => []),
  ]);
  const entry = (path: string, lastModified?: Date) => ({
    url: `${base}/en${path}`,
    lastModified,
    alternates: { languages: { en: `${base}/en${path}`, th: `${base}/th${path}` } },
  });
  return [
    ...pages.map((p) => entry(p)),
    ...talent.map((t) => entry(`/u/${t.handle}`, t.updatedAt)),
    ...orgs.map((o) => entry(`/o/${o.handle}`, o.updatedAt)),
  ];
}
