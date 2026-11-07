"use client";

import * as React from "react";
import ReactDOM from "react-dom";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import { BadgeCheck, Mic, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { durations, easeSmooth, useReducedMotion } from "@/lib/motion";

/** One orchestrated entrance: headline → product mock → CTA (section 5). */
export function Hero() {
  // LCP image is a CSS background; preload it so the browser finds it early.
  ReactDOM.preload("/sample/cover-neutral.svg", { as: "image", fetchPriority: "high" });
  const t = useTranslations("home");
  const reduced = useReducedMotion();
  // Headline → subline → CTA → mock, within the 320ms duration token. The headline and mock
  // (LCP candidates) move but never start invisible, so LCP isn't held back by the entrance.
  const item = (delay: number, fade = true) =>
    reduced
      ? fade
        ? { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.2 } } }
        : {}
      : {
          initial: fade ? { opacity: 0, y: 12 } : { y: 12 },
          animate: { opacity: 1, y: 0, transition: { duration: durations.slow, ease: easeSmooth, delay } },
        };

  return (
    <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 py-14 md:px-8 md:py-20 lg:min-h-[calc(100dvh-120px)] lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-16">
      <div className="flex flex-col gap-6">
        <motion.h1 {...item(0, false)} className="text-display tracking-display max-w-[14ch]">
          {t.rich("headline", { nb: (c) => <span className="whitespace-nowrap">{c}</span> })}
        </motion.h1>
        <motion.p {...item(0.06)} className="measure text-graphite text-[1.125rem] md:text-[1.25rem]">
          {t("subline")}
        </motion.p>
        <motion.div {...item(0.2)} className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login">{t("ctaPrimary")}</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/login?next=/welcome%3Fintent%3Dhire">{t("ctaSecondary")}</Link>
          </Button>
        </motion.div>
      </div>
      <motion.div {...item(0.12, false)} className="min-w-0">
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
    const a = setTimeout(() => setPhase("listening"), 1000);
    const b = setTimeout(() => setPhase("filled"), 3200);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [reduced]);

  return (
    <figure className="relative mx-auto w-full max-w-[560px]">
      <figcaption className="sr-only">{t("mockAlt")}</figcaption>
      <div aria-hidden className="relative flex flex-col gap-4">
        <span className="border-line bg-paper text-caption text-graphite absolute -top-3 right-4 z-10 rounded-full border px-3 py-1">
          {t("example")}
        </span>

        {/* Profile card */}
        <div className="border-line bg-raised shadow-float overflow-hidden rounded-[20px] border">
          <div className="h-24 bg-[url('/sample/cover-neutral.svg')] bg-cover bg-center sm:h-28 dark:bg-[url('/sample/cover-neutral-dark.svg')]" />
          <div className="flex flex-col gap-3 px-5 pb-5">
            <div className="-mt-9 flex items-end gap-3">
              <span className="border-raised bg-avatar text-h3 text-graphite flex size-[72px] items-center justify-center rounded-full border-4 font-semibold">
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
                  className="bg-mist text-small text-ink inline-flex h-8 items-center rounded-full px-3 font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
            <p className="text-small text-graphite flex items-center gap-1.5">
              <Star className="text-star size-4" fill="currentColor" strokeWidth={0} />
              <span className="text-ink font-medium">{t("mockRating")}</span>
            </p>
            {/* Mic field: the filled text always reserves its height (no layout shift); the
                listening capsule expands from the mic button and overlays it. */}
            <div className="border-field-line bg-paper relative mt-1 rounded-[14px] border p-3 pr-14">
              <p className="text-caption text-graphite mb-1">{t("mockField")}</p>
              <motion.p
                initial={false}
                animate={{ opacity: phase === "filled" ? 1 : 0, y: phase === "filled" ? 0 : 4 }}
                transition={{ duration: 0.3, ease: easeSmooth }}
                className="text-small text-ink"
              >
                {t("mockFilled")}
              </motion.p>
              <AnimatePresence>
                {phase === "listening" ? (
                  <motion.div
                    key="wave"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0 }}
                    transition={{ duration: 0.3, ease: easeSmooth }}
                    className="bg-brand-soft absolute top-1/2 right-2 left-3 flex h-11 origin-right -translate-y-1/2 items-center gap-[3px] overflow-hidden rounded-full pr-12 pl-4"
                  >
                    <span className="text-caption text-brand mr-2 shrink-0">{t("mockListening")}</span>
                    {Array.from({ length: 18 }, (_, i) => (
                      <motion.span
                        key={i}
                        className="bg-brand block h-5 w-[3px] shrink-0 origin-center rounded-full"
                        animate={{
                          scaleY: [0.25, 0.4 + ((i * 37) % 60) / 100, 0.3, 0.9 - ((i * 23) % 50) / 100, 0.25],
                        }}
                        transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.03, ease: "easeInOut" }}
                      />
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
              <span
                className={`absolute top-1/2 right-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full transition-colors ${
                  phase === "listening" ? "bg-brand text-white" : "bg-mist text-ink"
                }`}
              >
                <Mic className="size-5 stroke-[1.75]" />
              </span>
            </div>
          </div>
        </div>

        {/* Employer message */}
        <div className="ml-auto flex max-w-[86%] flex-col gap-1.5 sm:-mt-2">
          <p className="text-caption text-graphite flex justify-between gap-2 px-1">
            <span>{t("mockFrom")}</span>
            <span>{t("mockJustNow")}</span>
          </p>
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
