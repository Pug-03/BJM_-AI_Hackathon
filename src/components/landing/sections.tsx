import { getTranslations } from "next-intl/server";
import { BadgeCheck, ExternalLink, Languages, LockKeyhole, MessagesSquare, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { SponsorStrip } from "@/components/able/sponsor-strip";
import { TwoPaths } from "./two-paths";
import { SpeakDemo } from "./speak-demo";
import { Reveal, RevealItem, RevealList } from "@/components/able/reveal";

const wrap = "mx-auto w-full max-w-[1200px] px-4 md:px-8";
const section = "py-16 md:py-24";

function SectionHead({
  id,
  eyebrow,
  title,
  body,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  body?: string;
}) {
  return (
    <Reveal className="flex max-w-[640px] flex-col gap-3">
      {eyebrow ? <p className="text-small text-graphite font-medium">{eyebrow}</p> : null}
      <h2 id={id} className="text-h1 tracking-display">
        {title}
      </h2>
      {body ? <p className="text-graphite text-body measure">{body}</p> : null}
    </Reveal>
  );
}

export async function LandingSections() {
  const t = await getTranslations("home");
  const why = [
    { icon: Sparkles, k: "skills" },
    { icon: BadgeCheck, k: "verified" },
    { icon: MessagesSquare, k: "chat" },
    { icon: LockKeyhole, k: "data" },
  ] as const;
  const howTo = (["profile", "mic", "certs", "find", "chat", "delete"] as const).map((k) => ({
    id: `how-${k}`,
    title: t(`howTo.${k}.q`),
    content: t(`howTo.${k}.a`),
  }));
  const faq = (["free", "disclose", "phone", "verified", "ai", "phone2", "languages", "delete"] as const).map(
    (k) => ({
      id: `faq-${k}`,
      title: t(`faq.${k}.q`),
      content: t(`faq.${k}.a`),
    }),
  );
  return (
    <>
      <section
        aria-labelledby="how-title"
        id="how"
        className={`${section} border-line scroll-mt-20 border-t`}
      >
        <div className={`${wrap} flex flex-col gap-10`}>
          <SectionHead id="how-title" title={t("paths.title")} body={t("paths.body")} />
          <Reveal delay={0.1}>
            <TwoPaths />
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="speak-title" className={`${section} bg-mist`}>
        <div
          className={`${wrap} grid grid-cols-[minmax(0,1fr)] items-center gap-12 lg:grid-cols-2 lg:gap-16`}
        >
          <div className="flex flex-col gap-6">
            <SectionHead
              id="speak-title"
              eyebrow={t("speak.eyebrow")}
              title={t("speak.title")}
              body={t("speak.body")}
            />
            <p className="text-small text-graphite flex items-center gap-2">
              <Languages className="size-4" aria-hidden />
              {t("speak.languages")}
            </p>
          </div>
          <Reveal delay={0.1}>
            <SpeakDemo />
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="why-title" className={section}>
        <div
          className={`${wrap} grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16`}
        >
          <SectionHead id="why-title" title={t("why.title")} body={t("why.body")} />
          <RevealList className="divide-line border-line divide-y border-y">
            {why.map(({ icon: Icon, k }) => (
              <RevealItem key={k} className="flex gap-4 py-6">
                <Icon className="text-ink mt-0.5 size-6 shrink-0 stroke-[1.5]" aria-hidden />
                <div className="flex flex-col gap-1">
                  <h3 className="text-h3">{t(`why.${k}.title`)}</h3>
                  <p className="text-graphite">{t(`why.${k}.body`)}</p>
                </div>
              </RevealItem>
            ))}
          </RevealList>
        </div>
      </section>

      <section
        aria-labelledby="employers-title"
        id="employers"
        className={`${section} scroll-mt-20 pt-0 md:pt-0`}
      >
        <div className={wrap}>
          <Reveal
            dir="scale"
            className="bg-ink text-paper dark:bg-raised dark:text-ink dark:border-line grid grid-cols-[minmax(0,1fr)] gap-8 rounded-[28px] p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-12 dark:border"
          >
            <div className="flex max-w-[640px] flex-col gap-3">
              <p className="text-small font-medium opacity-70">{t("quota.eyebrow")}</p>
              <h2 id="employers-title" className="text-h1 tracking-display">
                {t("quota.title")}
              </h2>
              <p className="opacity-80">{t("quota.body")}</p>
              <a
                href="https://dep.go.th"
                target="_blank"
                rel="noopener"
                className="text-small inline-flex items-center gap-1.5 underline underline-offset-4 opacity-80 hover:opacity-100"
              >
                {t("quota.source")}
                <ExternalLink className="size-3.5" aria-hidden />
                <span className="sr-only">{t("newTab")}</span>
              </a>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <Button
                asChild
                size="lg"
                className="bg-paper text-ink dark:bg-ink dark:text-paper hover:opacity-90"
              >
                <Link href="/employer/quota">{t("quota.cta")}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="text-paper dark:text-ink dark:hover:bg-mist hover:bg-white/10"
              >
                <Link href="/login?next=/welcome%3Fintent%3Dhire">{t("ctaSecondary")}</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="guide-title" className={`${section} border-line border-t`}>
        <div
          className={`${wrap} grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16`}
        >
          <SectionHead id="guide-title" title={t("howTo.title")} body={t("howTo.body")} />
          <Reveal delay={0.1}>
            <Accordion items={howTo} />
          </Reveal>
        </div>
      </section>

      <section
        aria-labelledby="faq-title"
        id="faq"
        className={`${section} border-line scroll-mt-20 border-t`}
      >
        <div
          className={`${wrap} grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16`}
        >
          <SectionHead id="faq-title" title={t("faq.title")} />
          <Reveal delay={0.1}>
            <Accordion items={faq} />
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="thanks-title" className={`${section} bg-mist`}>
        <div className={`${wrap} flex flex-col items-center gap-8 text-center`}>
          <Reveal>
            <h2 id="thanks-title" className="text-h2 tracking-display max-w-[28ch]">
              {t("thanks")}
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <SponsorStrip size="lg" className="justify-center" />
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="cta-title" className={section}>
        <div className={`${wrap} flex flex-col items-center gap-6 text-center`}>
          <Reveal dir="scale">
            <h2 id="cta-title" className="text-display tracking-display max-w-[16ch]">
              {t("ctaTitle")}
            </h2>
          </Reveal>
          <Reveal delay={0.12} className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login">{t("ctaPrimary")}</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/explore">{t("ctaExplore")}</Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </>
  );
}
