"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { BadgeCheck, Clock, IdCard, Loader2, ShieldCheck, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { toWebp, uploadFile } from "@/lib/upload-client";
import { submitVerification, type VerificationStatus } from "@/server/verification";

const slots: Record<VerificationStatus["kind"], ("idCard" | "selfie" | "disabilityCard")[]> = {
  IDENTITY: ["idCard", "selfie"],
  DISABILITY_CARD: ["disabilityCard"],
};

/** "Get verified" (IG-style check): upload documents; an admin reviews them, then they're deleted. */
export function VerificationPanel({ initial }: { initial: VerificationStatus[] }) {
  const t = useTranslations("verify");
  const [items, setItems] = React.useState(initial);
  return (
    <div className="flex flex-col gap-4 py-4">
      <p className="text-caption text-graphite flex gap-2">
        <ShieldCheck className="size-4 shrink-0" aria-hidden />
        {t("privacy")}
      </p>
      {items.map((it) => (
        <VerificationCard
          key={it.kind}
          item={it}
          onSubmitted={() =>
            setItems((xs) =>
              xs.map((x) => (x.kind === it.kind ? { ...x, state: "PENDING", reason: null } : x)),
            )
          }
        />
      ))}
    </div>
  );
}

function VerificationCard({ item, onSubmitted }: { item: VerificationStatus; onSubmitted: () => void }) {
  const t = useTranslations("verify");
  const tu = useTranslations("onboard");
  const [files, setFiles] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const need = slots[item.kind];
  const ready = need.every((s) => files[s]);
  const Icon = item.kind === "IDENTITY" ? BadgeCheck : IdCard;

  const pick = async (slot: string, file: File | undefined) => {
    if (!file) return;
    setBusy(slot);
    const r = await uploadFile(
      "verification",
      file.type.startsWith("image/") ? await toWebp(file, 2000) : file,
      { name: slot },
    );
    setBusy(null);
    if (r.ok) setFiles((f) => ({ ...f, [slot]: r.url }));
    else toast.error(tu(`uploadErrors.${r.error}`));
  };

  return (
    <section
      aria-labelledby={`v-${item.kind}`}
      className="border-line flex flex-col gap-3 rounded-[16px] border p-4"
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${item.state === "APPROVED" ? "bg-[#1D9BF0] text-white" : "bg-brand-soft text-brand"}`}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id={`v-${item.kind}`} className="text-small font-semibold">
            {t(`${item.kind}.title`)}
          </h3>
          <p className="text-caption text-graphite">{t(`${item.kind}.body`)}</p>
        </div>
        <span
          className="text-caption bg-mist text-ink inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-medium"
          role="status"
        >
          {item.state === "PENDING" ? <Clock className="size-3.5" aria-hidden /> : null}
          {t(`state.${item.state}`)}
        </span>
      </div>
      {item.state === "REJECTED" && item.reason ? (
        <p className="text-caption text-danger">{t("rejectedReason", { reason: item.reason })}</p>
      ) : null}
      {item.state === "NONE" || item.state === "REJECTED" ? (
        <>
          <ul className="grid gap-2 sm:grid-cols-2">
            {need.map((slot) => (
              <li key={slot}>
                <label className="border-field-line hover:bg-mist has-[:focus-visible]:outline-brand flex min-h-14 cursor-pointer items-center gap-3 rounded-[14px] border border-dashed px-4 py-3 has-[:focus-visible]:outline-2">
                  {busy === slot ? (
                    <Loader2 className="size-5 animate-spin" aria-hidden />
                  ) : files[slot] ? (
                    <BadgeCheck className="text-success size-5" aria-hidden />
                  ) : (
                    <Upload className="text-graphite size-5" aria-hidden />
                  )}
                  <span className="text-small min-w-0 flex-1">
                    {t(`slot.${slot}`)}
                    <span className="text-caption text-graphite block">
                      {files[slot] ? t("uploaded") : t(`slotHint.${slot}`)}
                    </span>
                  </span>
                  {files[slot] ? (
                    <button
                      type="button"
                      aria-label={t("remove")}
                      className="hover:bg-cloud flex size-9 items-center justify-center rounded-full"
                      onClick={(e) => {
                        e.preventDefault();
                        setFiles((f) => {
                          const { [slot]: _x, ...rest } = f;
                          return rest;
                        });
                      }}
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  ) : null}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    capture={slot === "selfie" ? "user" : undefined}
                    className="sr-only"
                    onChange={(e) => {
                      void pick(slot, e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            className="self-start"
            disabled={!ready}
            loading={sending}
            onClick={async () => {
              setSending(true);
              const r = await submitVerification(
                item.kind,
                need.map((s) => files[s]!),
              );
              setSending(false);
              if (r.ok) {
                toast.success(t("submitted"));
                onSubmitted();
              } else toast.error(t(`errors.${r.error as "invalid"}`));
            }}
          >
            {t("submit")}
          </Button>
        </>
      ) : null}
    </section>
  );
}
