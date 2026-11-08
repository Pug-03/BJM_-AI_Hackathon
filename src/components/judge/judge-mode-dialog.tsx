"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Gavel } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { JudgeChoices } from "./judge-choices";

/** Footer "Judge mode" button + dialog. */
export function JudgeModeDialog({ variant = "footer" }: { variant?: "footer" | "header" }) {
  const t = useTranslations("judge");
  const tc = useTranslations("common");
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "header" ? (
          <Button variant="ghost" size="sm" aria-label={t("button")} className="max-sm:w-11 max-sm:px-0">
            <Gavel aria-hidden />
            <span className="max-sm:sr-only">{t("button")}</span>
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="bg-paper border-line hover:bg-cloud dark:bg-paper border"
          >
            <Gavel aria-hidden />
            {t("button")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        title={t("title")}
        description={t.rich("body", { nb: (c) => <span className="whitespace-nowrap">{c}</span> })}
        closeLabel={tc("close")}
      >
        <JudgeChoices onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
