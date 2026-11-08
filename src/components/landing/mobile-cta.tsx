import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/** Phones: sign-up / log-in stay within thumb reach at the bottom of the landing page. */
export async function MobileCta() {
  const t = await getTranslations("home");
  const tn = await getTranslations("nav");
  return (
    <div className="border-line bg-paper/90 fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
      <div className="flex gap-2">
        <Button asChild size="lg" className="flex-1">
          <Link href="/login">{t("ctaPrimary")}</Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="flex-1">
          <Link href="/login">{tn("login")}</Link>
        </Button>
      </div>
      <Link
        href="/login?next=/welcome%3Fintent%3Dhire"
        className="text-small text-graphite mt-2 block text-center underline-offset-4 hover:underline"
      >
        {t("ctaSecondary")}
      </Link>
    </div>
  );
}
