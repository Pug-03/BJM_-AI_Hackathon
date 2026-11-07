import { setRequestLocale } from "next-intl/server";
import { SiteHeader } from "@/components/able/site-header";
import { SiteFooter } from "@/components/able/site-footer";
import { Hero } from "@/components/landing/hero";

// Landing — hero now; the remaining section 6 blocks are built in Stage 8.
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Hero />
      </main>
      <SiteFooter />
    </>
  );
}
