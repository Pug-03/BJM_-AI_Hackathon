"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Gavel } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { JudgeChoices } from "./judge-choices";

/** Footer "Judge mode" button + dialog. */
export function JudgeModeDialog() {
  const t = useTranslations("judge");
  const tc = useTranslations("common");
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="bg-paper border-line hover:bg-cloud dark:bg-paper border"
        >
          <Gavel aria-hidden />
          {t("button")}
        </Button>
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
