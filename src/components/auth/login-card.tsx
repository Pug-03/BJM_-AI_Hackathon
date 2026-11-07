"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Info, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { tabSlide, useReducedMotion, variantsFor } from "@/lib/motion";
import { GoogleIcon } from "./google-icon";
import { OtpInput } from "./otp-input";

type Step = "choose" | "email" | "otp";

export interface LoginCardProps {
  googleEnabled: boolean;
  devOtpInLog: boolean;
  available: boolean;
  next?: string;
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function LoginCard({ googleEnabled, devOtpInLog, available, next }: LoginCardProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const reduced = useReducedMotion();
  const [step, setStep] = React.useState<Step>("choose");
  const [dir, setDir] = React.useState(1);
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);
  const [googleNote, setGoogleNote] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const emailRef = React.useRef<HTMLInputElement>(null);

  const chooseHeadingRef = React.useRef<HTMLHeadingElement>(null);
  const navigated = React.useRef(false);
  const [otpFocus, setOtpFocus] = React.useState(0);
  // Focus moves once the new step has finished animating in (AnimatePresence "wait"
  // keeps the old step mounted during its exit).
  const onStepShown = (s: Step) => (def: unknown) => {
    if (def !== "animate" || !navigated.current) return;
    if (s === "email") emailRef.current?.focus();
    if (s === "choose") chooseHeadingRef.current?.focus();
  };

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const go = (s: Step, d: number) => {
    navigated.current = true;
    setDir(d);
    setError(null);
    setStep(s);
  };

  const afterSignIn = () => {
    const q = next ? `?next=${encodeURIComponent(next)}` : "";
    window.location.assign(`/${locale}/start${q}`);
  };

  const mapError = (code?: string, status?: number) => {
    if (status === 429 || code === "RATE_LIMITED") return t("rateLimited");
    if (code === "OTP_EXPIRED") return t("otpExpired");
    if (code === "TOO_MANY_ATTEMPTS") return t("otpTooMany");
    if (code === "INVALID_OTP") return t("otpInvalid");
    return t("genericError");
  };

  const sendCode = async (isResend = false) => {
    if (!emailRe.test(email.trim())) {
      setError(t("emailInvalid"));
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.emailOtp.sendVerificationOtp({
      email: email.trim().toLowerCase(),
      type: "sign-in",
    });
    setBusy(false);
    if (err) {
      setError(mapError(err.code, err.status));
      return;
    }
    setCooldown(30);
    setOtp("");
    if (devOtpInLog) toast(t("devCode"));
    if (isResend) {
      toast.success(t("resent"));
      setStatus(t("resent"));
    } else go("otp", 1);
  };

  const verify = async (code: string) => {
    if (code.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    setStatus(t("verifying"));
    const { error: err } = await authClient.signIn.emailOtp({ email: email.trim().toLowerCase(), otp: code });
    if (err) {
      setBusy(false);
      setStatus("");
      setError(mapError(err.code, err.status));
      setOtp("");
      setOtpFocus((n) => n + 1);
      return;
    }
    setStatus(t("signedIn"));
    afterSignIn();
  };

  const google = async () => {
    if (!googleEnabled) {
      setGoogleNote(true);
      return;
    }
    setBusy(true);
    const q = next ? `?next=${encodeURIComponent(next)}` : "";
    await authClient.signIn.social({ provider: "google", callbackURL: `/${locale}/start${q}` });
  };

  const v = variantsFor(tabSlide, reduced);

  return (
    <div className="border-line bg-raised w-full max-w-[440px] rounded-[28px] border p-6 sm:p-10">
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
      <AnimatePresence mode="wait" initial={false} custom={dir}>
        {step === "choose" ? (
          <motion.div
            key="choose"
            onAnimationComplete={onStepShown("choose")}
            custom={dir}
            variants={v}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col gap-6"
          >
            <header className="flex flex-col items-center gap-2 text-center">
              <h1 ref={chooseHeadingRef} tabIndex={-1} className="text-h2 focus:outline-none">
                {t("title")}
              </h1>
              <p className="text-graphite">{t("subtitle")}</p>
            </header>
            {!available ? (
              <p className="bg-mist text-small text-graphite flex gap-3 rounded-[20px] p-4" role="note">
                <Info className="mt-0.5 size-5 shrink-0" aria-hidden />
                {t("unavailable")}
              </p>
            ) : null}
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                size="lg"
                block
                className="bg-raised"
                onClick={google}
                disabled={!available}
                aria-describedby={googleNote ? "google-note" : undefined}
              >
                <GoogleIcon className="size-5" />
                {t("google")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                block
                className="bg-raised"
                onClick={() => go("email", 1)}
                disabled={!available}
              >
                <Mail aria-hidden />
                {t("email")}
              </Button>
            </div>
            <div aria-live="polite" className="empty:hidden">
              {googleNote ? (
                <p id="google-note" className="text-caption text-graphite -mt-2 flex items-start gap-2">
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {t("googleUnavailable")}
                </p>
              ) : null}
            </div>
          </motion.div>
        ) : step === "email" ? (
          <motion.form
            key="email"
            onAnimationComplete={onStepShown("email")}
            custom={dir}
            variants={v}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col gap-6"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void sendCode();
            }}
          >
            <button
              type="button"
              onClick={() => go("choose", -1)}
              className="text-small text-graphite hover:text-ink -ml-2 flex h-11 w-fit items-center gap-1 rounded-full px-2"
            >
              <ArrowLeft className="size-5" aria-hidden />
              {t("back")}
            </button>
            <h1 className="text-h2">{t("email")}</h1>
            <Field id="login-email" label={t("emailLabel")} error={error}>
              {(a) => (
                <Input
                  {...a}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  ref={emailRef}
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </Field>
            <Button type="submit" size="lg" block loading={busy}>
              {t("sendCode")}
            </Button>
          </motion.form>
        ) : (
          <motion.form
            key="otp"
            custom={dir}
            variants={v}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col gap-6"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void verify(otp);
            }}
          >
            <button
              type="button"
              onClick={() => go("email", -1)}
              className="text-small text-graphite hover:text-ink -ml-2 flex h-11 w-fit items-center gap-1 rounded-full px-2"
            >
              <ArrowLeft className="size-5" aria-hidden />
              {t("changeEmail")}
            </button>
            <header className="flex flex-col gap-2">
              <h1 className="text-h2">{t("otpTitle")}</h1>
              <p id="otp-sent" className="text-graphite">
                {t("otpSent", { email: email.trim() })} {t("expires")}
              </p>
            </header>
            <div className="flex flex-col gap-2">
              <OtpInput
                focusSignal={otpFocus}
                value={otp}
                onChange={(v) => {
                  setOtp(v);
                  if (error) setError(null);
                }}
                onComplete={(v) => void verify(v)}
                digitLabel={(n) => t("otpDigit", { n })}
                groupLabel={t("otpLabel")}
                invalid={!!error}
                disabled={busy}
                describedBy={error ? "otp-sent otp-error" : "otp-sent"}
              />
              <div aria-live="assertive">
                {error ? (
                  <p id="otp-error" className="text-caption text-danger flex items-center gap-1.5">
                    <Info className="size-4" aria-hidden />
                    {error}
                  </p>
                ) : null}
              </div>
            </div>
            <Button type="submit" size="lg" block loading={busy} disabled={otp.length !== 6}>
              {busy ? t("verifying") : t("verify")}
            </Button>
            <div className="text-center">
              {cooldown > 0 ? (
                <p className="text-small text-graphite tabular-nums">
                  {t("resendIn", { seconds: cooldown })}
                </p>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void sendCode(true)}
                  disabled={busy}
                >
                  {t("resend")}
                </Button>
              )}
            </div>
          </motion.form>
        )}
      </AnimatePresence>
      <p className="border-line text-caption text-graphite mt-8 border-t pt-6 text-center">
        {t.rich("terms", {
          terms: (c) => (
            <Link
              href="/terms"
              prefetch={false}
              className="text-ink hover:text-brand whitespace-nowrap underline underline-offset-2"
            >
              {c}
            </Link>
          ),
          privacy: (c) => (
            <Link
              href="/privacy"
              prefetch={false}
              className="text-ink hover:text-brand whitespace-nowrap underline underline-offset-2"
            >
              {c}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
