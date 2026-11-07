import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";
import { services } from "./env";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: "TALENT" | "EMPLOYER" | "ADMIN" | null;
  locale: string;
  isSandbox: boolean;
  emailVerified: boolean;
}

/** Current signed-in user (cached per request), or null. Never throws. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  // Read headers first: this marks every caller as dynamic, so pages are never
  // prerendered at build time with a signed-out result.
  const h = await headers();
  if (!services.database()) return null;
  try {
    const s = await auth.api.getSession({ headers: h });
    if (!s) return null;
    const u = await db.user.findUnique({
      where: { id: s.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        locale: true,
        isSandbox: true,
        emailVerified: true,
        suspendedAt: true,
      },
    });
    if (!u || u.suspendedAt) return null;
    return { ...u, role: u.role ?? null };
  } catch {
    return null;
  }
});

/** Where a user should land after signing in. */
export function homeFor(user: Pick<SessionUser, "role">): string {
  return user.role ? "/feed" : "/welcome";
}
