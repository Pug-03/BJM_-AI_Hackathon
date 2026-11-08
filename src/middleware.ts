import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { getSessionCookie } from "better-auth/cookies";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

const PROTECTED = [
  "/feed",
  "/me",
  "/needs",
  "/saved",
  "/messages",
  "/notifications",
  "/settings",
  "/welcome",
  "/onboarding",
  "/admin",
];

export default function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const m = pathname.match(/^\/(en|th)(\/.*)?$/);
  const locale = m?.[1] ?? routing.defaultLocale;
  const rest = m?.[2] ?? "/";
  if (PROTECTED.some((p) => rest === p || rest.startsWith(p + "/")) && !getSessionCookie(req)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.search = `?next=${encodeURIComponent(rest + search)}`;
    return NextResponse.redirect(url);
  }
  return intl(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|icon|apple-icon|opengraph-image|.*\\..*).*)"],
};
