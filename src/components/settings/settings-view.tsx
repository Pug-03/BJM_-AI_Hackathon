"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toaster";
import { LanguageSwitch } from "@/components/able/language-switch";
import { useTheme } from "next-themes";
import { useAi } from "@/components/ai/ai-provider";
import { VerificationPanel } from "./verification-panel";
import type { VerificationStatus } from "@/server/verification";
import { deleteAccount, savePrefs, setConsent, setProfileVisibility, updateName } from "@/server/settings";

export interface SettingsData {
  name: string;
  email: string;
  isSandbox: boolean;
  role: string | null;
  google: boolean;
  handle: string | null;
  isTalent: boolean;
  isPublic: boolean;
  showAge: boolean;
  prefs: {
    emailMessages: boolean;
    emailOffers: boolean;
    showViewers: boolean;
    whoCanMessage: "EVERYONE" | "VERIFIED_ORGS";
  };
  consents: Record<string, boolean>;
  history: { id: string; kind: string; granted: boolean; version: string; at: string }[];
}

function Row({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <label htmlFor={id} className="text-small font-medium">
          {label}
        </label>
        {hint ? (
          <p id={`${id}-hint`} className="text-caption text-graphite">
            {hint}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Section({
  id,
  title,
  body,
  children,
}: {
  id: string;
  title: string;
  body?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[240px_minmax(0,1fr)] md:gap-10"
    >
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-h3">
          {title}
        </h2>
        {body ? <p className="text-small text-graphite">{body}</p> : null}
      </div>
      <div className="border-line bg-raised divide-line divide-y rounded-[20px] border px-5">{children}</div>
    </section>
  );
}

export function SettingsView({
  d,
  verification,
}: {
  d: SettingsData;
  verification?: VerificationStatus[] | null;
}) {
  const t = useTranslations("settings");
  const tv = useTranslations("verify");
  const locale = useLocale();
  const ai = useAi();
  const [name, setName] = React.useState(d.name);
  const [prefs, setPrefs] = React.useState(d.prefs);
  const [consents, setConsents] = React.useState(d.consents);
  const [vis, setVis] = React.useState({ isPublic: d.isPublic, showAge: d.showAge });
  const [confirm, setConfirm] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const savedToast = (ok: boolean) => (ok ? toast.success(t("saved")) : toast.error(t("failed")));
  const updatePrefs = async (p: Partial<typeof prefs>) => {
    const next = { ...prefs, ...p };
    setPrefs(next);
    savedToast((await savePrefs(next)).ok);
  };
  const consent = async (kind: string, v: boolean) => {
    setConsents((c) => ({ ...c, [kind]: v }));
    const r = await setConsent(kind, v);
    if (r.ok && kind === "AI_PROCESSING") ai.setConsent(v);
    savedToast(r.ok);
  };
  const confirmText = d.handle ?? d.email;

  return (
    <div className="flex flex-col gap-12">
      <Section id="s-account" title={t("account")}>
        <form
          className="flex flex-col gap-2 py-4"
          onSubmit={async (e) => {
            e.preventDefault();
            savedToast((await updateName(name)).ok);
          }}
        >
          <label htmlFor="set-name" className="text-small font-medium">
            {t("name")}
          </label>
          <div className="flex gap-2">
            <Input
              id="set-name"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            <Button type="submit" variant="secondary" disabled={!name.trim() || name === d.name}>
              {t("save")}
            </Button>
          </div>
        </form>
        <div className="flex flex-col gap-0.5 py-4">
          <p className="text-small font-medium">{t("email")}</p>
          <p className="text-small text-graphite break-all">{d.isSandbox ? t("demoAccount") : d.email}</p>
        </div>
        <div className="flex flex-col gap-0.5 py-4">
          <p className="text-small font-medium">{t("signIn")}</p>
          <p className="text-small text-graphite">{d.google ? t("googleConnected") : t("emailCode")}</p>
        </div>
      </Section>

      {verification ? (
        <Section id="s-verify" title={tv("title")} body={tv("intro")}>
          <VerificationPanel initial={verification} />
        </Section>
      ) : null}

      <Section id="s-display" title={t("display")}>
        <div className="flex items-center justify-between gap-6 py-3">
          <p className="text-small font-medium">{t("language")}</p>
          <LanguageSwitch compact={false} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
          <p className="text-small font-medium">{t("theme")}</p>
          <ThemeChoice />
        </div>
      </Section>

      <Section id="s-privacy" title={t("privacy")} body={t("privacyBody")}>
        {d.isTalent ? (
          <>
            <Row id="set-public" label={t("profilePublic")} hint={t("profilePublicHint")}>
              <Switch
                id="set-public"
                aria-describedby="set-public-hint"
                checked={vis.isPublic}
                onCheckedChange={async (v) => {
                  setVis((x) => ({ ...x, isPublic: v }));
                  savedToast((await setProfileVisibility({ isPublic: v })).ok);
                }}
              />
            </Row>
            <Row id="set-age" label={t("showAge")} hint={t("showAgeHint")}>
              <Switch
                id="set-age"
                aria-describedby="set-age-hint"
                checked={vis.showAge}
                onCheckedChange={async (v) => {
                  setVis((x) => ({ ...x, showAge: v }));
                  savedToast((await setProfileVisibility({ showAge: v })).ok);
                }}
              />
            </Row>
            <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <label htmlFor="set-who" className="text-small font-medium">
                {t("whoCanMessage")}
              </label>
              <Select
                id="set-who"
                className="sm:w-64"
                value={prefs.whoCanMessage}
                onValueChange={(v) => void updatePrefs({ whoCanMessage: v as "EVERYONE" })}
                options={[
                  { value: "EVERYONE", label: t("everyone") },
                  { value: "VERIFIED_ORGS", label: t("verifiedOrgs") },
                ]}
              />
            </div>
            <p className="text-caption text-graphite py-4">{t("contactsNote")}</p>
          </>
        ) : (
          <Row id="set-viewers" label={t("showViewing")} hint={t("showViewingHint")}>
            <Switch
              id="set-viewers"
              aria-describedby="set-viewers-hint"
              checked={prefs.showViewers}
              onCheckedChange={(v) => void updatePrefs({ showViewers: v })}
            />
          </Row>
        )}
      </Section>

      <Section id="s-notify" title={t("notifications")} body={t("notificationsBody")}>
        <Row id="set-em" label={t("emailMessages")}>
          <Switch
            id="set-em"
            checked={prefs.emailMessages}
            onCheckedChange={(v) => void updatePrefs({ emailMessages: v })}
          />
        </Row>
        <Row id="set-eo" label={t("emailOffers")}>
          <Switch
            id="set-eo"
            checked={prefs.emailOffers}
            onCheckedChange={(v) => void updatePrefs({ emailOffers: v })}
          />
        </Row>
      </Section>

      <Section id="s-consent" title={t("consents")} body={t("consentsBody")}>
        <Row id="set-ai" label={t("aiConsent")} hint={t("aiConsentHint")}>
          <Switch
            id="set-ai"
            aria-describedby="set-ai-hint"
            checked={Boolean(consents.AI_PROCESSING)}
            onCheckedChange={(v) => void consent("AI_PROCESSING", v)}
          />
        </Row>
        {d.isTalent ? (
          <Row id="set-ws" label={t("workSetupConsent")} hint={t("workSetupConsentHint")}>
            <Switch
              id="set-ws"
              aria-describedby="set-ws-hint"
              checked={Boolean(consents.WORK_SETUP)}
              onCheckedChange={(v) => void consent("WORK_SETUP", v)}
            />
          </Row>
        ) : null}
        <details className="group py-4">
          <summary className="text-small flex min-h-11 cursor-pointer list-none items-center justify-between font-medium [&::-webkit-details-marker]:hidden">
            {t("history")}
            <ChevronDown
              className="text-graphite size-4 transition-transform duration-200 group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <ul className="mt-3 flex flex-col gap-2">
            {d.history.map((h) => (
              <li key={h.id} className="text-caption text-graphite flex flex-wrap justify-between gap-2">
                <span>
                  {t(`kinds.${h.kind as "AI_PROCESSING"}`)} · {h.granted ? t("granted") : t("withdrawn")}
                </span>
                <span>
                  {new Date(h.at).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </li>
            ))}
          </ul>
        </details>
      </Section>

      <Section id="s-data" title={t("data")} body={t("dataBody")}>
        <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <p className="text-small font-medium">{t("download")}</p>
            <p className="text-caption text-graphite">{t("downloadHint")}</p>
          </div>
          <Button asChild variant="secondary">
            <a href="/api/export" download>
              <Download aria-hidden />
              {t("downloadCta")}
            </a>
          </Button>
        </div>
        <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <p className="text-small font-medium">{t("delete")}</p>
            <p className="text-caption text-graphite">{t("deleteHint")}</p>
          </div>
          <Button variant="destructive" onClick={() => setConfirm(true)}>
            <Trash2 aria-hidden />
            {t("deleteCta")}
          </Button>
        </div>
      </Section>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t("deleteTitle")}
        description={t("deleteBody")}
        requireText={confirmText}
        requireTextLabel={t("deleteType", { text: confirmText })}
        confirmLabel={t("deleteConfirm")}
        cancelLabel={t("cancel")}
        destructive
        loading={busy}
        onConfirm={async () => {
          setBusy(true);
          const r = await deleteAccount(confirmText);
          if (r.ok) window.location.assign(`/${locale}`);
          else {
            setBusy(false);
            toast.error(t("failed"));
          }
        }}
      />
    </div>
  );
}

/** Light / Dark / System as a visible segmented control (the current value is always shown as text). */
function ThemeChoice() {
  const t = useTranslations("theme");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const current = mounted ? (theme ?? "system") : "system";
  return (
    <div role="radiogroup" aria-label={t("label")} className="bg-mist flex rounded-full p-1">
      {(["light", "dark", "system"] as const).map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={current === v}
          onClick={() => setTheme(v)}
          className={`text-small min-h-10 rounded-full px-3 transition-colors ${current === v ? "bg-paper text-ink font-medium shadow-sm" : "text-graphite hover:text-ink"}`}
        >
          {t(v)}
        </button>
      ))}
    </div>
  );
}
