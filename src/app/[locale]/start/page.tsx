import { redirect } from "@/i18n/navigation";
import { getCurrentUser, homeFor } from "@/lib/session";

/** Post-sign-in router: first sign-in → /welcome, returning users → /feed (or ?next=). */
export default async function StartPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (!user) return redirect({ href: "/login", locale });
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  if (!user.role) return redirect({ href: "/welcome", locale });
  return redirect({ href: safe ?? homeFor(user), locale });
}
