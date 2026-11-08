import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/able/site-header";
import { SiteFooter } from "@/components/able/site-footer";
import { Hero } from "@/components/landing/hero";
import { LandingSections } from "@/components/landing/sections";

/** Landing (section 6). Sponsors appear in the thank-you section and footer, never the header. */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {/* Warm "safe place" wash behind the hero. */}
        <div className="bg-[linear-gradient(180deg,var(--warm)_0%,var(--warm)_55%,var(--paper)_100%)]">
          <Hero />
        </div>
        <LandingSections />
      </main>
      <SiteFooter />
    </div>
  );
}
