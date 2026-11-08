"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, useInView, useScroll, useTransform } from "motion/react";
import { AudioLines, BadgeCheck, Heart, Mic, ShieldCheck, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { durations, easeSmooth, useReducedMotion } from "@/lib/motion";

/**
 * Hero (section 6.2) with one orchestrated entrance (section 5): headline → mock → CTA.
 * The entrance runs in CSS (`able-rise`) so it starts with the first paint instead of
 * waiting for JavaScript; reduced-motion users get no movement (global CSS rule).
 */
export function Hero() {
  const t = useTranslations("home");
  return (
    <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 py-12 md:px-8 md:py-16 lg:min-h-[calc(100dvh-112px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16 lg:py-16">
      <div className="flex flex-col gap-6">
        <p className="bg-brand-soft text-brand text-small inline-flex w-fit animate-[able-rise-fade_320ms_var(--ease-smooth)_both] items-center gap-2 rounded-full px-4 py-1.5 font-medium">
          <Heart className="size-4" aria-hidden fill="currentColor" />
          {t("forEveryone")}
        </p>
        <h1 className="text-display tracking-display max-w-[14ch] animate-[able-rise_320ms_var(--ease-smooth)_both]">
          {t.rich("headline", { nb: (c) => <span className="whitespace-nowrap">{c}</span> })}
        </h1>
        <p className="measure text-h3 text-graphite animate-[able-rise-fade_320ms_var(--ease-smooth)_60ms_both] font-normal">
          {t("subline")}
        </p>
        {/* Voice sign-up callout: the standout feature, right where people decide to join. */}
        <a
          href="#speak"
          className="bg-brand-soft/60 hover:bg-brand-soft group flex animate-[able-rise-fade_320ms_var(--ease-smooth)_160ms_both] items-center gap-4 rounded-[20px] p-4 transition-colors"
        >
          <span className="relative flex size-12 shrink-0 items-center justify-center">
            <span
              aria-hidden
              className="bg-brand/25 absolute inset-0 rounded-full motion-safe:animate-ping"
            />
            <span className="bg-brand relative flex size-12 items-center justify-center rounded-full text-white">
              <Mic className="size-6 stroke-[1.75]" aria-hidden />
            </span>
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-ink font-semibold">{t("voiceSignupTitle")}</span>
            <span className="text-small text-graphite">{t("voiceSignupBody")}</span>
          </span>
        </a>
        {/* On phones these move to the sticky bottom bar. */}
        <div className="mt-2 flex animate-[able-rise-fade_320ms_var(--ease-smooth)_240ms_both] flex-col gap-3 max-md:hidden sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login">{t("ctaPrimary")}</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/login?next=/welcome%3Fintent%3Dhire">{t("ctaSecondary")}</Link>
          </Button>
        </div>
        <ul
          className="text-small text-graphite flex animate-[able-rise-fade_320ms_var(--ease-smooth)_320ms_both] flex-wrap gap-x-5 gap-y-2"
          aria-label={t("trustLabel")}
        >
          {(
            [
              [Mic, "trustVoice"],
              [AudioLines, "trustScreenReader"],
              [ShieldCheck, "trustPrivate"],
              [Heart, "trustFree"],
            ] as const
          ).map(([Icon, k]) => (
            <li key={k} className="inline-flex items-center gap-1.5">
              <Icon className="text-brand size-4" aria-hidden />
              {t(k)}
            </li>
          ))}
        </ul>
      </div>
      {/* Phones: the example profile leads (decorative, aria-hidden), the headline follows. */}
      <div className="min-w-0 animate-[able-rise_320ms_var(--ease-smooth)_120ms_both] max-lg:order-first">
        <Parallax>
          <HeroMock />
        </Parallax>
      </div>
    </section>
  );
}

function HeroMock() {
  const t = useTranslations("home");
  const reduced = useReducedMotion();
  const skills = [t("mockSkill1"), t("mockSkill2"), t("mockSkill3")];
  const micRef = React.useRef<HTMLDivElement>(null);
  const inView = useInView(micRef, { once: true, amount: 0.6 });
  // Mic demo (section 4.1's one bold moment): listening → filled. Starts when the field is on screen.
  const [phase, setPhase] = React.useState<"idle" | "listening" | "filled">("idle");
  React.useEffect(() => {
    if (reduced) return setPhase("filled");
    if (!inView) return;
    const a = setTimeout(() => setPhase("listening"), 400);
    const b = setTimeout(() => setPhase("filled"), 2800);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [reduced, inView]);

  return (
    <figure className="relative w-full max-w-[560px] lg:mx-auto">
      <figcaption className="sr-only">{t("mockAlt")}</figcaption>
      <div aria-hidden className="relative flex flex-col gap-4">
        <span className="border-line bg-paper text-caption text-graphite absolute -top-3 right-4 z-10 rounded-full border px-3 py-1">
          {t("example")}
        </span>

        {/* Profile card */}
        <div className="border-line bg-raised shadow-float overflow-hidden rounded-[20px] border">
          {/* Decorative cover as CSS (not an <img>), so the headline text is the page's LCP element. */}
          <div
            aria-hidden
            className="bg-mist h-14 w-full sm:h-28 bg-[repeating-linear-gradient(115deg,transparent_0_44px,var(--line)_44px_68px)]"
          />
          <div className="flex flex-col gap-3 px-5 pb-5 sm:gap-4 sm:px-6 sm:pb-6">
            {/* AI-generated photo of a fictional person (not a real individual). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sample/people/judge-talent.jpg"
              alt=""
              width={72}
              height={72}
              className="border-raised bg-avatar -mt-8 size-14 rounded-full border-4 sm:-mt-9 sm:size-[72px]"
            />
            <div className="flex flex-col gap-1">
              <p className="text-h3 flex items-center gap-2">
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
            <p className="text-small text-graphite flex items-center gap-2 max-sm:hidden">
              <Star className="text-star size-4" fill="currentColor" strokeWidth={0} />
              <span className="text-ink font-medium">{t("mockRating")}</span>
            </p>
            {/* Mic field: the filled text reserves its height (no layout shift). The listening
                capsule grows out of the mic button, then hands over to the text. */}
            <div ref={micRef} className="border-field-line bg-paper relative rounded-[14px] border p-3 pr-16">
              <p className="text-caption text-graphite mb-1">{t("mockField")}</p>
              <motion.p
                initial={false}
                animate={{ opacity: phase === "filled" ? 1 : 0, x: phase === "filled" ? 0 : 8 }}
                transition={{
                  duration: durations.base,
                  ease: easeSmooth,
                  delay: phase === "filled" ? 0.22 : 0,
                }}
                className="text-small text-ink"
              >
                {t("mockFilled")}
              </motion.p>
              <AnimatePresence>
                {phase === "listening" ? (
                  <motion.div
                    key="capsule"
                    className="absolute inset-1 z-[1] flex items-center"
                    exit={{ opacity: 0 }}
                    transition={{ duration: durations.base }}
                  >
                    {/* Background expands from the mic (origin right); content fades in after, never squashed. */}
                    <motion.span
                      className="absolute inset-0 rounded-[11px] bg-[color-mix(in_srgb,var(--brand-soft)_100%,var(--paper))]"
                      // Grows out of the mic as a pill (clip-path keeps the round end caps; no squash).
                      initial={{ clipPath: "inset(0 0 0 calc(100% - 48px) round 11px)" }}
                      animate={{ clipPath: "inset(0 0 0 0px round 11px)" }}
                      transition={{ duration: durations.slow, ease: easeSmooth }}
                    />
                    <motion.span
                      className="relative flex min-w-0 items-center gap-[3px] overflow-hidden pr-14 pl-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: durations.fast, delay: 0.08 }}
                    >
                      <span className="text-caption text-brand mr-2 shrink-0 font-medium">
                        {t("mockListening")}
                      </span>
                      {Array.from({ length: 18 }, (_, i) => (
                        <motion.span
                          key={i}
                          className="bg-brand block h-5 w-[3px] shrink-0 origin-center rounded-full"
                          animate={{
                            scaleY: [
                              0.25,
                              0.4 + ((i * 37) % 60) / 100,
                              0.3,
                              0.9 - ((i * 23) % 50) / 100,
                              0.25,
                            ],
                          }}
                          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.03, ease: "easeInOut" }}
                        />
                      ))}
                    </motion.span>
                  </motion.div>
                ) : null}
              </AnimatePresence>
              <span
                className={`absolute top-1/2 right-3 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full transition-colors duration-200 ${
                  phase === "listening" ? "bg-brand text-white" : "bg-mist text-ink"
                }`}
              >
                <Mic className="size-5 stroke-[1.75]" />
              </span>
            </div>
          </div>
        </div>

        {/* Employer message */}
        <div className="ml-auto flex max-w-[86%] flex-col gap-2 max-sm:hidden">
          <p className="text-caption text-graphite flex justify-between gap-2 px-1">
            <span>{t("mockFrom")}</span>
            <span>{t("mockJustNow")}</span>
          </p>
          <div className="border-line bg-raised text-small shadow-float rounded-[20px] rounded-tl-md border px-4 py-3">
            {t("mockMessage")}
          </div>
          <p className="text-caption text-graphite flex items-center gap-2 pl-1">
            <span className="bg-brand size-1.5 rounded-full" />
            {t("mockMatch")}
          </p>
        </div>
      </div>
    </figure>
  );
}

/** The example card drifts up a little slower than the page as you scroll (transform only). */
function Parallax({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 700], [0, -56]);
  return <motion.div style={reduced ? undefined : { y }}>{children}</motion.div>;
}
