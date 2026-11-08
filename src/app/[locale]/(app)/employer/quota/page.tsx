import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { QuotaCalculator } from "@/components/employer/quota-calculator";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "quota" });
  return { title: t("title"), description: t("intro") };
}

/** Section 33 calculator — public (works logged out); prefilled for employers. */
export default async function QuotaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  const org =
    user?.role === "EMPLOYER"
      ? await db.orgProfile.findUnique({
          where: { userId: user.id },
          select: { employeeCount: true, currentHires: true },
        })
      : null;
  const t = await getTranslations("quota");
  const levyEnv = Number(process.env.QUOTA_LEVY_PER_PERSON_THB);
  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-10">
      <header className="flex flex-col gap-2">
        <p className="text-small text-brand font-medium">{t("eyebrow")}</p>
        <h1 className="text-h1 tracking-display">{t("title")}</h1>
        <p className="text-graphite measure">{t("intro")}</p>
      </header>
      <QuotaCalculator
        initialEmployees={org?.employeeCount ?? null}
        initialHires={org?.currentHires ?? null}
        levy={Number.isFinite(levyEnv) && levyEnv > 0 ? levyEnv : null}
      />
      <section aria-labelledby="q-other" className="flex flex-col gap-3">
        <h2 id="q-other" className="text-h3">
          {t("otherTitle")}
        </h2>
        <p className="measure text-ink">{t("s34")}</p>
        <p className="measure text-ink">{t("s35")}</p>
        <p className="text-caption text-graphite measure">{t("verify")}</p>
        <a
          href="https://dep.go.th"
          target="_blank"
          rel="noopener"
          className="text-small text-ink inline-flex items-center gap-1.5 underline underline-offset-4"
        >
          {t("source")}
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </section>
      <div>
        <Button asChild>
          <Link href={user?.role === "EMPLOYER" ? "/feed" : "/login?next=/welcome%3Fintent%3Dhire"}>
            {t("cta")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
