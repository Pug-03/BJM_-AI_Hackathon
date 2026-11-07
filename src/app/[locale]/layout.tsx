import type { Metadata, Viewport } from "next";
import { Geist, Noto_Sans_Thai } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/providers/providers";
import { KeyNotice } from "@/components/able/key-notice";
import { missingServices, appUrl } from "@/lib/env";
import "../globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const thai = Noto_Sans_Thai({
  subsets: ["thai"],
  weight: ["400", "500", "600"],
  variable: "--font-thai",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(appUrl()),
    title: { default: t("title"), template: "%s · ABLE" },
    description: t("description"),
    alternates: { languages: { en: "/en", th: "/th" } },
    openGraph: { title: t("title"), description: t("description"), siteName: "ABLE", locale },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0E12" },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations("common");

  return (
    <html lang={locale} suppressHydrationWarning className={`${geist.variable} ${thai.variable}`}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <a
              href="#main"
              className="fixed top-2 left-2 z-[100] -translate-y-20 rounded-full bg-ink px-4 py-3 text-small font-medium text-paper focus:translate-y-0"
            >
              {t("skipToContent")}
            </a>
            <KeyNotice missing={missingServices()} />
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
