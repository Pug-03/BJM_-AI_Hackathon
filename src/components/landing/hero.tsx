"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import { BadgeCheck, Check, Mic, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { easeSmooth, useReducedMotion } from "@/lib/motion";

/** One orchestrated entrance: headline → product mock → CTA (section 5). */
export function Hero() {
  const t = useTranslations("home");
  const reduced = useReducedMotion();
  const item = (delay: number) =>
    reduced
      ? {
          initial: { opacity: 0 },
          animate: { opacity: 1, transition: { duration: 0.2, delay: delay * 0.3 } },
        }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeSmooth, delay } },
        };

  return (
    <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 py-14 md:px-8 md:py-20 lg:min-h-[calc(100dvh-120px)] lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-16">
      <div className="flex flex-col gap-6">
        <motion.h1 {...item(0)} className="text-display tracking-display max-w-[14ch]">
          {t("headline")}
        </motion.h1>
        <motion.p {...item(0.08)} className="measure text-graphite text-[1.125rem] md:text-[1.25rem]">
          {t("subline")}
        </motion.p>
        <motion.div {...item(0.9)} className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login">{t("ctaPrimary")}</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/login?next=/welcome%3Fintent%3Dhire">{t("ctaSecondary")}</Link>
          </Button>
        </motion.div>
      </div>
      <motion.div {...item(0.35)}>
        <HeroMock />
      </motion.div>
    </section>
  );
}

function HeroMock() {
  const t = useTranslations("home");
  const reduced = useReducedMotion();
  const skills = [t("mockSkill1"), t("mockSkill2"), t("mockSkill3")];
  // Mic demo: listening (waveform) → filled text. Runs once, after the entrance.
  const [phase, setPhase] = React.useState<"idle" | "listening" | "filled">(reduced ? "filled" : "idle");
  React.useEffect(() => {
    if (reduced) return;
    const a = setTimeout(() => setPhase("listening"), 1500);
    const b = setTimeout(() => setPhase("filled"), 3700);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [reduced]);

  return (
    <figure className="relative mx-auto w-full max-w-[520px]">
      <figcaption className="sr-only">{t("mockAlt")}</figcaption>
      <div aria-hidden className="relative flex flex-col gap-4">
        <span className="border-line bg-paper text-caption text-graphite absolute -top-3 right-4 z-10 rounded-full border px-3 py-1">
          {t("example")}
        </span>

        {/* Profile card */}
        <div className="border-line bg-raised shadow-float overflow-hidden rounded-[20px] border">
          <div className="h-24 bg-[url('/sample/cover-1.svg')] bg-cover bg-center sm:h-28" />
          <div className="flex flex-col gap-3 px-5 pb-5">
            <div className="-mt-9 flex items-end gap-3">
              <span className="border-raised bg-brand-soft text-h3 text-brand flex size-[72px] items-center justify-center rounded-full border-4 font-semibold">
                PJ
              </span>
            </div>
            <div>
              <p className="text-h3 flex items-center gap-1.5">
                {t("mockName")}
                <BadgeCheck className="text-brand size-5" />
              </p>
              <p className="text-small text-graphite">{t("mockHeadline")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span
                  key={s}
                  className="bg-brand-soft text-small text-ink inline-flex h-8 items-center gap-1 rounded-full px-3 font-medium"
                >
                  <Check className="text-brand size-3.5" />
                  {s}
                </span>
              ))}
            </div>
            <p className="text-small text-graphite flex items-center gap-1.5">
              <Star className="text-star size-4" fill="currentColor" strokeWidth={0} />
              <span className="text-ink font-medium">{t("mockRating")}</span>
            </p>
            {/* Mic field */}
            <div className="border-field-line bg-paper relative mt-1 min-h-[76px] rounded-[14px] border p-3 pr-14">
              <p className="text-caption text-graphite mb-1">{t("mockField")}</p>
              <AnimatePresence mode="wait" initial={false}>
                {phase === "listening" ? (
                  <motion.div
                    key="wave"
                    initial={{ opacity: 0, scaleX: 0.6 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: easeSmooth }}
                    className="flex h-6 origin-left items-center gap-[3px]"
                  >
                    {Array.from({ length: 22 }, (_, i) => (
                      <motion.span
                        key={i}
                        className="bg-brand block h-6 w-[3px] origin-center rounded-full"
                        animate={{
                          scaleY: [0.25, 0.4 + ((i * 37) % 60) / 100, 0.3, 0.9 - ((i * 23) % 50) / 100, 0.25],
                        }}
                        transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.03, ease: "easeInOut" }}
                      />
                    ))}
                    <span className="text-caption text-brand ml-2">{t("mockListening")}</span>
                  </motion.div>
                ) : phase === "filled" ? (
                  <motion.p
                    key="text"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: easeSmooth }}
                    className="text-small text-ink"
                  >
                    {t("mockFilled")}
                  </motion.p>
                ) : (
                  <motion.span key="idle" className="block h-6" />
                )}
              </AnimatePresence>
              <span
                className={`absolute top-1/2 right-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-full transition-colors ${
                  phase === "listening" ? "bg-brand text-white" : "bg-mist text-ink"
                }`}
              >
                <Mic className="size-5 stroke-[1.75]" />
              </span>
            </div>
          </div>
        </div>

        {/* Employer message */}
        <div className="ml-auto flex max-w-[86%] flex-col gap-1.5 sm:-mt-2 sm:mr-[-12px]">
          <p className="text-caption text-graphite pl-1">{t("mockFrom")}</p>
          <div className="border-line bg-raised text-small shadow-float rounded-[20px] rounded-tl-md border px-4 py-3">
            {t("mockMessage")}
          </div>
          <p className="text-caption text-graphite flex items-center gap-1.5 pl-1">
            <span className="bg-brand size-1.5 rounded-full" />
            {t("mockMatch")}
          </p>
        </div>
      </div>
    </figure>
  );
}
