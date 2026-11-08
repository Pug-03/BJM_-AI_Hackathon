"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toaster";
import { EmptyState } from "@/components/able/empty-state";
import { provinceLabel } from "@/config/th-provinces";
import { deleteNeed, saveNeed, setNeedOpen } from "@/server/employer";
import { NeedForm, emptyNeed, needToInput, type NeedDraft } from "./need-form";

export interface NeedRow extends NeedDraft {
  id: string;
  isOpen: boolean;
  matches: number;
}

export function NeedsManager({
  initial,
  openNew,
  province,
}: {
  initial: NeedRow[];
  openNew: boolean;
  province: string;
}) {
  const t = useTranslations("employer");
  const to = useTranslations("onboard");
  const te = useTranslations("enums");
  const locale = useLocale();
  const [rows, setRows] = React.useState(initial);
  const [editing, setEditing] = React.useState<NeedDraft | null>(openNew ? emptyNeed(province) : null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [confirm, setConfirm] = React.useState<NeedRow | null>(null);

  const submit = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      setErrors({ title: to("required") });
      document.getElementById("nm-title")?.focus();
      return;
    }
    setBusy(true);
    const r = await saveNeed(needToInput(editing));
    setBusy(false);
    if (!r.ok || !r.data) {
      setErrors(r.ok ? {} : r.error === "age_range" ? { ageMax: t("ageRangeError") } : {});
      return void toast.error(to("saveFailed"));
    }
    const id = r.data.id;
    setRows((cur) => {
      const row: NeedRow = {
        ...editing,
        id,
        isOpen: true,
        matches: cur.find((x) => x.id === id)?.matches ?? 0,
      };
      return cur.some((x) => x.id === id)
        ? cur.map((x) => (x.id === id ? { ...row, isOpen: x.isOpen } : x))
        : [row, ...cur];
    });
    setEditing(null);
    setErrors({});
    toast.success(t("needSaved"));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button onClick={() => setEditing(emptyNeed(province))}>
          <Plus aria-hidden />
          {t("addPosition")}
        </Button>
      </div>
      {rows.length ? (
        <ul className="flex flex-col gap-3">
          {rows.map((n) => (
            <li
              key={n.id}
              className="border-line bg-raised flex flex-col gap-4 rounded-[20px] border p-5 lg:flex-row lg:items-center"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-h3 truncate">{n.title}</p>
                <p className="text-caption text-graphite flex flex-wrap items-center gap-x-2">
                  <span>{te(`workMode.${n.workMode as "REMOTE"}`)}</span>·
                  <span>{te(`availability.${n.employmentType as "FULL_TIME"}`)}</span>
                  {n.location ? (
                    <>
                      ·
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" aria-hidden />
                        {provinceLabel(n.location, locale)}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-small text-graphite flex min-h-11 items-center gap-2">
                  <Switch
                    checked={n.isOpen}
                    onCheckedChange={async (v) => {
                      setRows((cur) => cur.map((x) => (x.id === n.id ? { ...x, isOpen: v } : x)));
                      const r = await setNeedOpen(n.id, v);
                      if (!r.ok) setRows((cur) => cur.map((x) => (x.id === n.id ? { ...x, isOpen: !v } : x)));
                    }}
                    aria-label={t("openToggle", { title: n.title })}
                  />
                  {n.isOpen ? t("open") : t("closed")}
                </label>
                {n.isOpen ? (
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/feed?need=${n.id}`}>
                      <Users aria-hidden />
                      {t("seeMatches")}
                    </Link>
                  </Button>
                ) : null}
                <IconButton aria-label={t("editNeed", { title: n.title })} onClick={() => setEditing(n)}>
                  <Pencil aria-hidden />
                </IconButton>
                <IconButton aria-label={t("deleteNeed", { title: n.title })} onClick={() => setConfirm(n)}>
                  <Trash2 aria-hidden />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={t("noNeeds")} body={t("noNeedsBody")} />
      )}

      <Sheet open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent
          title={editing?.id ? t("editPosition") : t("addPosition")}
          closeLabel={t("close")}
          className="md:max-w-[640px]"
        >
          {editing ? (
            <form
              className="flex flex-col gap-8"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <NeedForm value={editing} onChange={setEditing} errors={errors} idPrefix="nm" />
              <div className="bg-paper sticky bottom-0 flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                  {t("cancel")}
                </Button>
                <Button type="submit" loading={busy}>
                  {t("saveNeed")}
                </Button>
              </div>
            </form>
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("deleteTitle")}
        description={t("deleteBody", { title: confirm?.title ?? "" })}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        destructive
        onConfirm={async () => {
          if (!confirm) return;
          const r = await deleteNeed(confirm.id);
          if (r.ok) setRows((cur) => cur.filter((x) => x.id !== confirm.id));
          setConfirm(null);
        }}
      />
    </div>
  );
}
