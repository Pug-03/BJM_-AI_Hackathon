import "server-only";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/session";
import type { NeedCardData } from "@/components/feed/need-card";
import { st, stList } from "@/lib/sample-i18n";

/** Talent feed data: matched open positions + employers who viewed or starred you. */
export async function loadTalentFeed(user: SessionUser, locale = "en") {
  const me = await db.talentProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!me) return null;
  const scores = await db.matchScore.findMany({
    where: {
      talentId: me.id,
      need: { isOpen: true, org: { user: { isSandbox: false } } },
    },
    orderBy: { score: "desc" },
    take: 20,
    select: {
      parts: true,
      need: {
        include: {
          org: {
            select: {
              userId: true,
              handle: true,
              name: true,
              logoUrl: true,
              verifyTier: true,
              type: true,
              isSample: true,
            },
          },
        },
      },
    },
  });
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const [views, stars] = await Promise.all([
    db.profileView.findMany({
      where: { talentId: me.id, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { viewerUserId: true, createdAt: true },
    }),
    db.star.findMany({
      where: { talentId: me.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { employerUserId: true, createdAt: true },
    }),
  ]);
  const orgIds = [
    ...new Set([
      ...views.map((v) => v.viewerUserId),
      ...stars.map((s) => s.employerUserId),
      ...scores.map((s) => s.need.org.userId),
    ]),
  ];
  const [orgs, follows] = await Promise.all([
    db.orgProfile.findMany({
      where: { userId: { in: orgIds }, user: { isSandbox: user.isSandbox ? undefined : false } },
      select: {
        userId: true,
        handle: true,
        name: true,
        logoUrl: true,
        verifyTier: true,
        type: true,
        isSample: true,
        industry: true,
      },
    }),
    db.follow.findMany({
      where: { followerId: user.id, followeeUserId: { in: orgIds } },
      select: { followeeUserId: true },
    }),
  ]);
  const byUser = new Map(orgs.map((o) => [o.userId, o]));
  const followed = new Set(follows.map((f) => f.followeeUserId));
  const interested = new Map<
    string,
    { org: (typeof orgs)[number]; kind: "viewed" | "starred"; at: Date; following: boolean }
  >();
  for (const s of stars) {
    const o = byUser.get(s.employerUserId);
    if (o)
      interested.set(o.userId, {
        org: o,
        kind: "starred",
        at: s.createdAt,
        following: followed.has(o.userId),
      });
  }
  for (const v of views) {
    const o = byUser.get(v.viewerUserId);
    if (o && !interested.has(o.userId))
      interested.set(o.userId, {
        org: o,
        kind: "viewed",
        at: v.createdAt,
        following: followed.has(o.userId),
      });
  }
  const needs: NeedCardData[] = scores.map((s) => ({
    id: s.need.id,
    title: st(s.need.title, locale),
    skills: stList(s.need.skills, locale),
    matched: stList((s.parts as { matched?: string[] }).matched ?? [], locale),
    workMode: s.need.workMode,
    employmentType: s.need.employmentType,
    location: s.need.location,
    educationLevel: s.need.educationLevel,
    offeredSetup: s.need.offeredSetup,
    description: st(s.need.description, locale),
    org: s.need.org,
    following: followed.has(s.need.org.userId),
  }));
  return { needs, interested: [...interested.values()].slice(0, 12) };
}
