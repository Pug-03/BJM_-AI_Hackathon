import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { services } from "@/lib/env";
import { redirect } from "@/i18n/navigation";
import { listConversations } from "@/server/messages";
import { getThread } from "@/server/messages";
import { ThreadView } from "@/components/messages/thread-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "messages" });
  return { title: t("title"), robots: { index: false } };
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  // "/messages/latest" opens the most recent conversation (deep link used in notifications and QA).
  if (id === "latest") {
    const first = (await listConversations())[0];
    return redirect({ href: first ? `/messages/${first.id}` : "/messages", locale });
  }
  const thread = await getThread(id);
  if (!thread) notFound();
  return <ThreadView key={id} initial={thread} callsAvailable={services.calls()} />;
}
