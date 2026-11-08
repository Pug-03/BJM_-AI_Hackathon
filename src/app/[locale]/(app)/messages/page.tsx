import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MessageCircle } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "messages" });
  return { title: t("title"), robots: { index: false } };
}

export default async function MessagesIndex() {
  const t = await getTranslations("messages");
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <MessageCircle className="text-graphite size-8" aria-hidden />
      <p className="text-h3">{t("pickTitle")}</p>
      <p className="text-small text-graphite measure">{t("pickBody")}</p>
    </div>
  );
}
