"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ToggleChips } from "@/components/ui/toggle-chips";
import { toast } from "@/components/ui/toaster";
import { currencies, payPeriods, reportReasons, type OfferInput } from "@/lib/schemas/message";
import { reportUser } from "@/server/messages";

/** "Send offer" (section 7.8). Pay is whatever the two people agree — no suggested rate. */
export function OfferDialog({
  open,
  onOpenChange,
  initial,
  counter,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Partial<OfferInput>;
  counter: boolean;
  onSubmit: (o: OfferInput) => void;
}) {
  const t = useTranslations("messages");
  const [role, setRole] = React.useState("");
  const [pay, setPay] = React.useState("");
  const [currency, setCurrency] = React.useState<OfferInput["currency"]>("THB");
  const [period, setPeriod] = React.useState<OfferInput["period"]>("MONTH");
  const [startDate, setStart] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [err, setErr] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    if (!open) return;
    setRole(initial?.role ?? "");
    setPay(initial?.pay ? String(initial.pay) : "");
    setCurrency(initial?.currency ?? "THB");
    setPeriod(initial?.period ?? "MONTH");
    setStart(initial?.startDate ?? "");
    setNotes("");
    setErr({});
  }, [open, initial]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={counter ? t("counterTitle") : t("offerTitle")}
        description={t("offerDialogNote")}
        closeLabel={t("close")}
      >
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            const amount = Number(pay.replace(/[,\s]/g, ""));
            const errors: Record<string, string> = {};
            if (!role.trim()) errors.role = t("required");
            if (!amount || amount <= 0) errors.pay = t("payInvalid");
            setErr(errors);
            if (Object.keys(errors).length) return;
            onSubmit({
              role: role.trim(),
              pay: amount,
              currency,
              period,
              startDate: startDate || null,
              notes: notes.trim() || undefined,
            });
          }}
        >
          <Field id="of-role" label={t("offerRole")} error={err.role}>
            {(a) => <Input {...a} maxLength={120} value={role} onChange={(e) => setRole(e.target.value)} />}
          </Field>
          <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
            <Field id="of-pay" label={t("offerPay")} error={err.pay}>
              {(a) => (
                <Input
                  {...a}
                  inputMode="decimal"
                  value={pay}
                  onChange={(e) => setPay(e.target.value.replace(/[^\d.,]/g, ""))}
                />
              )}
            </Field>
            <Field id="of-cur" label={t("currency")}>
              {(a) => (
                <Select
                  {...a}
                  value={currency}
                  onValueChange={(v) => setCurrency(v as OfferInput["currency"])}
                  options={currencies.map((c) => ({ value: c, label: c }))}
                />
              )}
            </Field>
          </div>
          <ToggleChips
            legend={t("per")}
            name="of-period"
            options={payPeriods}
            value={[period]}
            onChange={(v) => setPeriod(v[0] ?? "MONTH")}
            multiple={false}
            label={(v) => t(`period.${v}`)}
          />
          <Field id="of-start" label={t("offerStart")} optionalLabel={t("optional")}>
            {(a) => (
              <DatePicker
                {...a}
                value={startDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setStart(e.target.value)}
              />
            )}
          </Field>
          <Field id="of-notes" label={t("offerNotes")} optionalLabel={t("optional")}>
            {(a) => (
              <Textarea
                {...a}
                rows={3}
                maxLength={1000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            )}
          </Field>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit">{counter ? t("sendCounter") : t("sendOffer")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ReportDialog({
  open,
  onOpenChange,
  targetUserId,
  name,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  targetUserId: string;
  name: string;
}) {
  const t = useTranslations("messages");
  const [reason, setReason] = React.useState<(typeof reportReasons)[number]>("SPAM");
  const [details, setDetails] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t("reportTitle", { name })} description={t("reportBody")} closeLabel={t("close")}>
        <form
          className="flex flex-col gap-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const r = await reportUser(targetUserId, reason, details);
            setBusy(false);
            if (r.ok) {
              toast.success(t("reported"));
              onOpenChange(false);
            } else toast.error(t("reportFailed"));
          }}
        >
          <ToggleChips
            legend={t("reportReason")}
            name="rp-reason"
            options={reportReasons}
            value={[reason]}
            onChange={(v) => setReason(v[0] ?? "OTHER")}
            multiple={false}
            label={(v) => t(`reasons.${v}`)}
          />
          <Field id="rp-details" label={t("reportDetails")} optionalLabel={t("optional")}>
            {(a) => (
              <Textarea
                {...a}
                rows={3}
                maxLength={1000}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            )}
          </Field>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" loading={busy}>
              {t("sendReport")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Daily Prebuilt in a full-screen layer (camera/mic permissions delegated to the iframe). */
export function CallLayer({
  url,
  title,
  onClose,
}: {
  url: string | null;
  title: string;
  onClose: () => void;
}) {
  const t = useTranslations("messages");
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!url) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [url, onClose]);
  if (!url) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[60] flex flex-col bg-[#0F0E12] focus:outline-none"
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 text-white">
        <p className="text-small truncate font-medium">{title}</p>
        <Button
          size="sm"
          variant="destructive"
          className="border-white/40 text-white hover:bg-white/10"
          onClick={onClose}
        >
          {t("leaveCall")}
        </Button>
      </div>
      <iframe
        title={title}
        src={url}
        allow="camera; microphone; fullscreen; display-capture; autoplay; speaker-selection"
        className="min-h-0 w-full flex-1 border-0"
      />
    </div>
  );
}
