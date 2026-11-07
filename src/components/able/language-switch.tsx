"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { useParams } from "next/navigation";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";

export function LanguageSwitch({
  compact = true,
  side = "bottom",
}: {
  compact?: boolean;
  side?: "bottom" | "right" | "top";
}) {
  const t = useTranslations("language");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [pending, start] = useTransition();

  const change = (next: string) => {
    start(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace({ pathname, params } as any, { locale: next as Locale });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <IconButton aria-label={`${t("label")}: ${t(locale)}`} disabled={pending}>
            <Languages aria-hidden />
          </IconButton>
        ) : (
          <Button variant="ghost" size="sm" disabled={pending}>
            <Languages aria-hidden />
            {t(locale)}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align="end">
        <DropdownMenuLabel>{t("label")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={locale} onValueChange={change}>
          <DropdownMenuRadioItem value="en" lang="en">
            {t("en")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="th" lang="th">
            {t("th")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
