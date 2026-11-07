"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Building2, Check, Info, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chooseRole } from "@/server/account";
import { cn } from "@/lib/utils";

function Submit({ disabled, pending }: { disabled: boolean; pending: boolean }) {
  const t = useTranslations("welcome");
  return (
    <Button
      type="submit"
      size="lg"
      disabled={disabled}
      loading={pending}
      className="w-full sm:w-auto sm:self-start sm:px-10"
    >
      {pending ? t("saving") : t("continue")}
    </Button>
  );
}

export function RoleChooser({ initial }: { initial?: "TALENT" | "EMPLOYER" }) {
  const t = useTranslations("welcome");
  const [role, setRole] = React.useState<"TALENT" | "EMPLOYER" | undefined>(initial);
  const locale = useLocale();
  const [pending, start] = React.useTransition();
  const [failed, setFailed] = React.useState(false);
  const [nudge, setNudge] = React.useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setNudge(true);
      return;
    }
    start(async () => {
      const res = await chooseRole(role);
      if (res.ok) window.location.assign(`/${locale}${res.href}`);
      else if (res.error === "auth") window.location.assign(`/${locale}/login?next=/welcome`);
      else setFailed(true);
    });
  };
  const options = [
    {
      value: "TALENT" as const,
      title: t("talentTitle"),
      body: t("talentBody"),
      meta: t("talentMeta"),
      icon: UserRound,
    },
    {
      value: "EMPLOYER" as const,
      title: t("employerTitle"),
      body: t("employerBody"),
      meta: t("employerMeta"),
      icon: Building2,
    },
  ];
  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">{t("choose")}</legend>
        {options.map((o) => {
          const on = role === o.value;
          return (
            <motion.label
              key={o.value}
              whileTap={{ scale: 0.98 }}
              tabIndex={-1}
              className={cn(
                "bg-raised relative flex min-h-52 cursor-pointer flex-col gap-4 rounded-[20px] border p-6 transition-colors",
                "has-[:focus-visible]:outline-brand has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
                on ? "border-brand ring-brand ring-1" : "border-line hover:border-graphite",
              )}
            >
              <input
                type="radio"
                name="role"
                value={o.value}
                checked={on}
                onChange={() => {
                  setRole(o.value);
                  setNudge(false);
                }}
                className="sr-only"
              />
              <span
                className={cn(
                  "flex size-12 items-center justify-center rounded-full",
                  on ? "bg-brand-soft text-brand" : "bg-mist text-ink",
                )}
              >
                <o.icon className="size-6 stroke-[1.75]" aria-hidden />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-h3">{o.title}</span>
                <span className="text-graphite">{o.body}</span>
              </span>
              <span className="text-caption text-graphite mt-auto">{o.meta}</span>
              <span
                className={cn(
                  "absolute top-5 right-5 flex size-6 items-center justify-center rounded-full border transition-colors",
                  on ? "border-brand bg-brand text-white" : "border-graphite",
                )}
                aria-hidden
              >
                {on ? <Check className="size-4 stroke-[2.5]" /> : null}
              </span>
            </motion.label>
          );
        })}
      </fieldset>
      <div aria-live="polite" className="empty:hidden">
        {failed || nudge ? (
          <p className="text-small text-danger flex items-center gap-2">
            <Info className="size-4 shrink-0" aria-hidden />
            {failed ? t("error") : t("chooseFirst")}
          </p>
        ) : null}
      </div>
      <Submit disabled={false} pending={pending} />
    </form>
  );
}
