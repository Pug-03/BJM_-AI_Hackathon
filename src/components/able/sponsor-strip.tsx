import Image from "next/image";
import { useTranslations } from "next-intl";
import { sponsors } from "@/config/sponsors";
import { cn } from "@/lib/utils";

/** Sponsor logos; neutral placeholders until real files are added to /public/sponsors/. */
export function SponsorStrip({ size = "sm", className }: { size?: "sm" | "lg"; className?: string }) {
  const t = useTranslations("site");
  const h = size === "sm" ? "h-7" : "h-14";
  return (
    <ul className={cn("flex flex-wrap items-center", size === "sm" ? "gap-2" : "gap-4 md:gap-6", className)}>
      {sponsors.map((s) => (
        <li key={s.id}>
          {s.logo ? (
            <Image
              src={s.logo}
              alt={s.name ?? t("sponsorLogo")}
              width={size === "sm" ? 84 : 168}
              height={size === "sm" ? 28 : 56}
              className={cn(h, "w-auto object-contain")}
            />
          ) : (
            <span
              className={cn(
                "border-line text-graphite flex items-center justify-center rounded-full border border-dashed px-3",
                h,
                size === "sm" ? "text-[11px]" : "text-caption min-w-36",
              )}
            >
              {t("sponsorLogo")}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
