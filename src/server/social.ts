"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { cleanText } from "@/lib/schemas/message";
import { notify } from "@/lib/notify";
import { refreshRating } from "./seed-core";

async function visiblePost(postId: string, viewer: { id: string; isSandbox: boolean }) {
  const p = await db.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      talent: { select: { userId: true, isPublic: true, user: { select: { isSandbox: true } } } },
    },
  });
  if (!p) return null;
  if (p.talent.user.isSandbox && !viewer.isSandbox) return null;
  return p;
}

export async function togglePostLike(postId: string, on: boolean) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const };
  const p = await visiblePost(postId, user);
  if (!p) return { ok: false as const };
  const key = { postId_userId: { postId, userId: user.id } };
  const exists = await db.postLike.findUnique({ where: key });
  if (on && !exists) {
    await db.$transaction([
      db.postLike.create({ data: { postId, userId: user.id } }),
      db.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } }),
    ]);
    if (p.talent.userId !== user.id) await notify(p.talent.userId, "LIKE", { postId, fromName: user.name });
  } else if (!on && exists) {
    await db.$transaction([
      db.postLike.delete({ where: key }),
      db.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } }),
    ]);
  }
  const post = await db.post.findUnique({ where: { id: postId }, select: { likeCount: true } });
  return { ok: true as const, likeCount: post?.likeCount ?? 0 };
}

export interface CommentView {
  id: string;
  text: string;
  createdAt: string;
  author: { name: string; image: string | null; href: string | null };
  mine: boolean;
}

export async function listComments(postId: string): Promise<CommentView[]> {
  const user = await getCurrentUser();
  const rows = await db.postComment.findMany({ where: { postId }, orderBy: { createdAt: "asc" }, take: 100 });
  const ids = [...new Set(rows.map((r) => r.authorUserId))];
  const [users, talents, orgs] = await Promise.all([
    db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, image: true } }),
    db.talentProfile.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, displayName: true, avatarUrl: true, handle: true },
    }),
    db.orgProfile.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, name: true, logoUrl: true, handle: true },
    }),
  ]);
  const by = new Map<string, CommentView["author"]>();
  for (const u of users) by.set(u.id, { name: u.name ?? "", image: u.image, href: null });
  for (const t of talents)
    by.set(t.userId, { name: t.displayName, image: t.avatarUrl, href: `/u/${t.handle}` });
  for (const o of orgs) by.set(o.userId, { name: o.name, image: o.logoUrl, href: `/o/${o.handle}` });
  return rows.map((r) => ({
    id: r.id,
    text: r.text,
    createdAt: r.createdAt.toISOString(),
    author: by.get(r.authorUserId) ?? { name: "", image: null, href: null },
    mine: r.authorUserId === user?.id,
  }));
}

export async function addComment(postId: string, text: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "auth" };
  const t = z.string().max(1000).transform(cleanText).pipe(z.string().min(1)).safeParse(text);
  if (!t.success) return { ok: false as const, error: "invalid" };
  const p = await visiblePost(postId, user);
  if (!p) return { ok: false as const, error: "not_found" };
  if (!(await rateLimit(`comment:${user.id}`, 20, 600)).ok)
    return { ok: false as const, error: "rate_limited" };
  await db.$transaction([
    db.postComment.create({ data: { postId, authorUserId: user.id, text: t.data } }),
    db.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } }),
  ]);
  if (p.talent.userId !== user.id) await notify(p.talent.userId, "COMMENT", { postId, fromName: user.name });
  return { ok: true as const, comments: await listComments(postId) };
}

export async function deleteComment(id: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const c = await db.postComment.findUnique({
    where: { id },
    include: { post: { select: { talent: { select: { userId: true } } } } },
  });
  // The author, or the post's owner, can remove a comment.
  if (!c || (c.authorUserId !== user.id && c.post.talent.userId !== user.id && user.role !== "ADMIN"))
    return { ok: false };
  await db.$transaction([
    db.postComment.delete({ where: { id } }),
    db.post.update({ where: { id: c.postId }, data: { commentCount: { decrement: 1 } } }),
  ]);
  return { ok: true };
}

/** Conversations where this employer may review this talent: an accepted offer, and no review yet. */
export async function reviewableConversations(talentId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER") return [];
  const t = await db.talentProfile.findUnique({ where: { id: talentId }, select: { userId: true } });
  if (!t) return [];
  const convo = await db.conversation.findUnique({
    where: { talentUserId_employerUserId: { talentUserId: t.userId, employerUserId: user.id } },
    select: { id: true, messages: { where: { kind: "OFFER" }, select: { offer: true } } },
  });
  if (!convo || !convo.messages.some((m) => (m.offer as { status?: string } | null)?.status === "ACCEPTED"))
    return [];
  const done = await db.review.findFirst({
    where: { authorUserId: user.id, targetId: talentId, conversationId: convo.id },
  });
  return done ? [] : [convo.id];
}

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().max(1000).transform(cleanText).optional(),
});

/** Review flow (Stage 9): only after a conversation with an accepted offer; 1–5 stars + text; one per conversation. */
export async function submitReview(talentId: string, input: unknown) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "auth" };
  const p = reviewSchema.safeParse(input);
  if (!p.success) return { ok: false as const, error: "invalid" };
  const [convoId] = await reviewableConversations(talentId);
  if (!convoId) return { ok: false as const, error: "not_eligible" };
  await db.review.create({
    data: {
      targetId: talentId,
      authorUserId: user.id,
      conversationId: convoId,
      rating: p.data.rating,
      text: p.data.text || null,
    },
  });
  await refreshRating(db, talentId);
  const t = await db.talentProfile.findUnique({ where: { id: talentId }, select: { userId: true } });
  if (t) await notify(t.userId, "REVIEW", { fromName: user.name, rating: p.data.rating });
  return { ok: true as const };
}

export interface NotificationView {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export async function listNotifications(): Promise<NotificationView[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const rows = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    payload: (r.payload as Record<string, unknown>) ?? {},
    read: Boolean(r.readAt),
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function markNotificationsRead(ids?: string[]) {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  await db.notification.updateMany({
    where: { userId: user.id, readAt: null, ...(ids ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  });
  return { ok: true };
}
