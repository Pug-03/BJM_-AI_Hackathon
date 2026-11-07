"use client";

import { useTranslations } from "next-intl";
import { BadgeCheck, Building2, IdCard, Mail } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Tier 1 email, Tier 2 organization, Tier 3 identity (Phase 2 — never awarded in this MVP). */
export function VerifiedBadge({ tier, className, size = 18 }: { tier: number; className?: string; size?: number }) {
  const t = useTranslations("verified");
  const level = Math.max(1, Math.min(2, tier));
  const name = level === 2 ? t("org") : t("email");
  const rows = [
    { key: "email", icon: Mail, title: t("email"), detail: t("emailDetail"), on: level >= 1, next: false },
    { key: "org", icon: Building2, title: t("org"), detail: t("orgDetail"), on: level >= 2, next: false },
    { key: "identity", icon: IdCard, title: t("identity"), detail: t("identityDetail"), on: false, next: true },
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("badgeLabel", { tier: name })}
          className={cn(
            "relative inline-flex shrink-0 items-center justify-center rounded-full text-brand before:absolute before:-inset-3 before:content-['']",
            className,
          )}
        >
          <BadgeCheck style={{ width: size, height: size }} strokeWidth={2} aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <p className="mb-3 text-small font-semibold">{t("legend")}</p>
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.key} className={cn("flex gap-3", !r.on && "opacity-70")}>
              <span
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                  r.on ? "bg-brand-soft text-brand" : "bg-mist text-graphite",
                )}
              >
                <r.icon className="size-4" aria-hidden />
              </span>
              <span className="flex flex-col">
                <span className="text-small font-medium">
                  {r.title}
                  {r.on ? <span className="sr-only"> ✓</span> : null}
                </span>
                <span className="text-caption text-graphite">{r.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
