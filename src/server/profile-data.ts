import "server-only";
import { db } from "@/lib/db";
import { canViewProfile, serializeTalentForViewer, type ViewerContext } from "@/lib/privacy";
import { resolveUrl } from "@/lib/storage";
import type { SessionUser } from "@/lib/session";

/** Loads a talent profile as the given viewer may see it, or null if not visible. */
export async function loadTalentProfile(
  where: { handle: string } | { userId: string },
  viewer: SessionUser | null,
) {
  const p = await db.talentProfile.findUnique({
    where,
    include: {
      user: { select: { isSandbox: true } },
      contacts: true,
      skills: true,
      educations: { orderBy: { yearEnd: "desc" } },
      certificates: { orderBy: { issuedAt: "desc" } },
      portfolio: { orderBy: { createdAt: "desc" } },
      posts: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
  if (!p) return null;

  const [convo, share, blocked] = viewer
    ? await Promise.all([
        db.conversation.findFirst({
          where: { talentUserId: p.userId, employerUserId: viewer.id, blockedBy: null },
          select: { id: true },
        }),
        db.setupShare.findUnique({
          where: { talentId_employerUserId: { talentId: p.id, employerUserId: viewer.id } },
        }),
        db.block.findFirst({
          where: {
            OR: [
              { blockerUserId: p.userId, blockedUserId: viewer.id },
              { blockerUserId: viewer.id, blockedUserId: p.userId },
            ],
          },
        }),
      ])
    : [null, null, null];

  const ctx: ViewerContext = {
    userId: viewer?.id ?? null,
    isSandbox: viewer?.isSandbox ?? false,
    isAdmin: viewer?.role === "ADMIN",
    inConversation: Boolean(convo),
    setupShared: Boolean(share),
  };
  if (!canViewProfile(p, ctx) || (blocked && ctx.userId !== p.userId)) return null;
  const owner = ctx.userId === p.userId;
  const view = serializeTalentForViewer(p, ctx);

  const [followers, following, starred, reviews, liked] = await Promise.all([
    db.follow.count({ where: { followeeUserId: p.userId } }),
    viewer
      ? db.follow.findUnique({
          where: { followerId_followeeUserId: { followerId: viewer.id, followeeUserId: p.userId } },
        })
      : null,
    viewer?.role === "EMPLOYER"
      ? db.star.findUnique({
          where: { employerUserId_talentId: { employerUserId: viewer.id, talentId: p.id } },
        })
      : null,
    db.review.findMany({ where: { targetId: p.id }, orderBy: { createdAt: "desc" }, take: 30 }),
    viewer
      ? db.postLike.findMany({
          where: { userId: viewer.id, postId: { in: p.posts.map((x) => x.id) } },
          select: { postId: true },
        })
      : [],
  ]);
  const authors = await db.user.findMany({
    where: { id: { in: reviews.map((r) => r.authorUserId) } },
    select: {
      id: true,
      name: true,
      image: true,
      org: { select: { name: true, logoUrl: true, handle: true, verifyTier: true } },
    },
  });
  const byId = new Map(authors.map((a) => [a.id, a]));

  const certificates = await Promise.all(
    p.certificates
      .filter((c) => owner || c.isPublic)
      .map(async (c) => ({
        id: c.id,
        kind: c.kind,
        title: c.title,
        issuer: c.issuer,
        issuedAt: c.issuedAt?.toISOString() ?? null,
        fileUrl: await resolveUrl(c.fileUrl),
        isPdf: /\.pdf($|\?)/i.test(c.fileUrl),
      })),
  );

  const likedSet = new Set(liked.map((l) => l.postId));
  const dist = [5, 4, 3, 2, 1].map((n) => ({
    stars: n,
    count: reviews.filter((r) => r.rating === n).length,
  }));

  const checklist = owner
    ? [
        { key: "photo", done: Boolean(p.avatarUrl) },
        { key: "headline", done: Boolean(p.headline) },
        { key: "skills", done: p.skills.length >= 3 },
        { key: "education", done: p.educations.length > 0 },
        { key: "proof", done: p.certificates.length + p.portfolio.length > 0 },
        { key: "post", done: p.posts.length > 0 },
      ]
    : null;

  if (viewer && !owner && viewer.isSandbox === p.user.isSandbox) {
    // Record a profile view for the "employers who viewed you" list (employers only).
    if (viewer.role === "EMPLOYER")
      await db.profileView.create({ data: { viewerUserId: viewer.id, talentId: p.id } }).catch(() => {});
  }

  return {
    profile: view,
    skills: p.skills.map((s) => s.name),
    educations: p.educations.map((e) => ({
      id: e.id,
      level: e.level,
      school: e.school,
      field: e.field,
      yearEnd: e.yearEnd,
    })),
    certificates,
    portfolio: p.portfolio.map((x) => ({
      id: x.id,
      title: x.title,
      description: x.description,
      images: x.images,
      imageAlts: x.imageAlts,
      link: x.link,
    })),
    posts: p.posts.map((x) => ({
      id: x.id,
      kind: x.kind,
      text: x.text,
      images: x.images,
      imageAlts: x.imageAlts,
      likeCount: x.likeCount,
      commentCount: x.commentCount,
      liked: likedSet.has(x.id),
      createdAt: x.createdAt.toISOString(),
    })),
    reviews: reviews.map((r) => {
      const a = byId.get(r.authorUserId);
      return {
        id: r.id,
        rating: r.rating,
        text: r.text,
        createdAt: r.createdAt.toISOString(),
        author: {
          name: a?.org?.name ?? a?.name ?? "",
          image: a?.org?.logoUrl ?? a?.image ?? null,
          handle: a?.org?.handle ?? null,
          verifyTier: a?.org?.verifyTier ?? 1,
        },
      };
    }),
    ratingDist: dist,
    followers,
    isFollowing: Boolean(following),
    isStarred: Boolean(starred),
    conversationId: convo?.id ?? null,
    viewerRole: viewer?.role ?? null,
    viewerSignedIn: Boolean(viewer),
    checklist,
  };
}

export type TalentProfileData = NonNullable<Awaited<ReturnType<typeof loadTalentProfile>>>;
