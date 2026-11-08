"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { resolveReport, reviewOrg, setSuspended } from "@/server/admin";
import { reviewVerification } from "@/server/verification";

function useAct() {
  const t = useTranslations("admin");
  const [done, setDone] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const run = async (fn: () => Promise<{ ok: boolean }>, label: string) => {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (r.ok) setDone(label);
    else toast.error(t("failed"));
  };
  return { t, done, busy, run };
}

export function OrgReview({ orgId }: { orgId: string }) {
  const { t, done, busy, run } = useAct();
  if (done)
    return (
      <p className="text-small text-graphite" role="status">
        {done}
      </p>
    );
  return (
    <div className="flex gap-2">
      <Button size="sm" loading={busy} onClick={() => void run(() => reviewOrg(orgId, true), t("approved"))}>
        {t("approve")}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={busy}
        onClick={() => void run(() => reviewOrg(orgId, false), t("rejected"))}
      >
        {t("reject")}
      </Button>
    </div>
  );
}

export function ReportActions({
  reportId,
  targetUserId,
  suspended,
}: {
  reportId: string;
  targetUserId: string;
  suspended: boolean;
}) {
  const { t, done, busy, run } = useAct();
  if (done)
    return (
      <p className="text-small text-graphite" role="status">
        {done}
      </p>
    );
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="secondary"
        loading={busy}
        onClick={() => void run(() => resolveReport(reportId), t("resolved"))}
      >
        {t("resolve")}
      </Button>
      {!suspended ? (
        <Button
          size="sm"
          variant="destructive"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              const r = await setSuspended(targetUserId, true);
              return r.ok ? resolveReport(reportId) : r;
            }, t("suspendedDone"))
          }
        >
          {t("suspend")}
        </Button>
      ) : null}
    </div>
  );
}

export function RestoreUser({ userId }: { userId: string }) {
  const { t, done, busy, run } = useAct();
  if (done)
    return (
      <p className="text-small text-graphite" role="status">
        {done}
      </p>
    );
  return (
    <Button
      size="sm"
      variant="secondary"
      loading={busy}
      onClick={() => void run(() => setSuspended(userId, false), t("restored"))}
    >
      {t("restore")}
    </Button>
  );
}

export function VerificationReview({ requestId }: { requestId: string }) {
  const { t, done, busy, run } = useAct();
  const [reason, setReason] = React.useState("");
  if (done)
    return (
      <p className="text-small text-graphite" role="status">
        {done}
      </p>
    );
  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex gap-2">
        <Button
          size="sm"
          loading={busy}
          onClick={() => void run(() => reviewVerification(requestId, true), t("approved"))}
        >
          {t("approve")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => void run(() => reviewVerification(requestId, false, reason), t("rejected"))}
        >
          {t("reject")}
        </Button>
      </div>
      <label className="sr-only" htmlFor={`rr-${requestId}`}>
        {t("rejectReason")}
      </label>
      <input
        id={`rr-${requestId}`}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t("rejectReason")}
        maxLength={300}
        className="border-field-line text-small h-10 w-full rounded-full border px-4 sm:w-64"
      />
    </div>
  );
}
