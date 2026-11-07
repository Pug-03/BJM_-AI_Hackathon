"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { LanguageSwitch } from "./language-switch";
import { ThemeSwitch } from "./theme-switch";

/** Header menu below 1024px: site links, sign-in, language and theme in a bottom sheet. */
export function SiteMenu() {
  const t = useTranslations("site");
  const tn = useTranslations("nav");
  const tc = useTranslations("common");
  const [open, setOpen] = React.useState(false);
  const links = [
    { href: "/#how", label: t("howItWorks") },
    { href: "/#employers", label: t("forEmployers") },
    { href: "/#faq", label: t("faq") },
    { href: "/explore", label: tn("explore") },
  ];
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <IconButton aria-label={t("openMenu")} className="lg:hidden">
          <Menu aria-hidden />
        </IconButton>
      </SheetTrigger>
      <SheetContent title={t("menu")} closeLabel={tc("close")}>
        <nav aria-label={t("primaryNav")}>
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="text-body hover:bg-mist flex min-h-12 items-center rounded-[14px] px-2 font-medium"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-line mt-4 flex items-center gap-1 border-t pt-4">
          <LanguageSwitch compact={false} side="top" />
          <ThemeSwitch side="top" />
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <Button asChild variant="secondary" block>
            <Link href="/login">{tn("login")}</Link>
          </Button>
          <Button asChild block>
            <Link href="/login">{tn("getStarted")}</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
