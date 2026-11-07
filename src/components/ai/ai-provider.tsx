"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { aiConsentStatus, grantAiConsent } from "@/server/ai";

interface AiCtx {
  /** Speech-to-text configured in this environment. */
  speech: boolean;
  /** Claude configured in this environment. */
  text: boolean;
  /** Resolves true when the person has (or just gave) AI-processing consent. */
  ensureConsent: () => Promise<boolean>;
  /** Called after consent is given elsewhere (e.g. the onboarding checkbox). */
  setConsent: (v: boolean) => void;
}

const Ctx = React.createContext<AiCtx>({
  speech: false,
  text: false,
  ensureConsent: async () => false,
  setConsent: () => {},
});
export const useAi = () => React.useContext(Ctx);

/**
 * AI availability + inline consent (section 9: AI processing consent). The first mic or
 * "Write with AI" use asks once, records a ConsentRecord, and never asks again.
 */
export function AiProvider({
  speech,
  text,
  children,
}: {
  speech: boolean;
  text: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("ai");
  const consent = React.useRef<boolean | null>(null);
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const pending = React.useRef<((v: boolean) => void) | null>(null);

  const ensureConsent = React.useCallback(async () => {
    if (consent.current === null) {
      const s = await aiConsentStatus().catch(() => ({ signedIn: false, consent: false }));
      consent.current = s.consent;
    }
    if (consent.current) return true;
    return new Promise<boolean>((resolve) => {
      pending.current = resolve;
      setOpen(true);
    });
  }, []);

  const finish = (v: boolean) => {
    pending.current?.(v);
    pending.current = null;
    setOpen(false);
  };

  const value = React.useMemo(
    () => ({ speech, text, ensureConsent, setConsent: (v: boolean) => (consent.current = v) }),
    [speech, text, ensureConsent],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <ConfirmDialog
        open={open}
        onOpenChange={(o) => (o ? setOpen(true) : finish(false))}
        title={t("consentTitle")}
        description={t("consentBody")}
        confirmLabel={t("consentAllow")}
        cancelLabel={t("consentNotNow")}
        closeLabel={t("close")}
        loading={busy}
        onConfirm={async () => {
          setBusy(true);
          const r = await grantAiConsent().catch(() => ({ ok: false }));
          setBusy(false);
          if (r.ok) {
            consent.current = true;
            window.dispatchEvent(new Event("able:ai-consent"));
          }
          finish(r.ok);
        }}
      />
    </Ctx.Provider>
  );
}
