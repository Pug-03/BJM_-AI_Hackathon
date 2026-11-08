import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { OrgReview, ReportActions, RestoreUser, VerificationReview } from "@/components/admin/admin-actions";
import { resolveUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

/** Minimal admin (Stage 9): organization verification, reports queue, suspensions. Admins only (ADMIN_EMAILS). */
export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") notFound();
  const t = await getTranslations("admin");
  const te = await getTranslations("enums");
  const fmt = await getFormatter();
  const [verifs, orgs, reports, suspended] = await Promise.all([
    db.verificationRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
    db.orgProfile.findMany({
      where: { verifyRequestedAt: { not: null }, verifyTier: { lt: 2 } },
      orderBy: { verifyRequestedAt: "asc" },
      select: {
        id: true,
        name: true,
        handle: true,
        type: true,
        registrationNo: true,
        website: true,
        verifyRequestedAt: true,
      },
    }),
    db.report.findMany({ where: { resolvedAt: null }, orderBy: { createdAt: "asc" }, take: 100 }),
    db.user.findMany({
      where: { suspendedAt: { not: null } },
      select: { id: true, name: true, email: true, suspendedAt: true },
    }),
  ]);
  const verifUsers = new Map(
    (
      await db.user.findMany({
        where: { id: { in: verifs.map((v) => v.userId) } },
        select: { id: true, name: true, email: true },
      })
    ).map((u) => [u.id, u]),
  );
  const ids = [...new Set(reports.flatMap((r) => [r.reporterUserId, r.targetUserId]))];
  const people = new Map(
    (
      await db.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, email: true, suspendedAt: true },
      })
    ).map((u) => [u.id, u]),
  );
  const card =
    "border-line bg-raised flex flex-col gap-3 rounded-[20px] border p-5 sm:flex-row sm:items-center sm:justify-between";
  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-12">
      <h1 className="text-h1 tracking-display">{t("title")}</h1>
      <section aria-labelledby="a-verify" className="flex flex-col gap-4">
        <h2 id="a-verify" className="text-h3">
          {t("verifyQueue", { count: verifs.length })}
        </h2>
        <p className="text-caption text-graphite">{t("verifyNote")}</p>
        {verifs.length ? (
          <ul className="flex flex-col gap-3">
            {await Promise.all(
              verifs.map(async (v) => {
                const who = verifUsers.get(v.userId);
                const links = await Promise.all(v.files.map((f) => resolveUrl(f)));
                return (
                  <li key={v.id} className={card}>
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="font-medium">
                        {who?.name ?? who?.email} · {t(`verifyKind.${v.kind as "IDENTITY"}`)}
                      </p>
                      <p className="text-small flex flex-wrap gap-3">
                        {links.map((href, i) => (
                          <a
                            key={i}
                            href={href}
                            target="_blank"
                            rel="noopener"
                            className="text-brand underline underline-offset-4"
                          >
                            {t("viewDoc", { n: i + 1 })}
                          </a>
                        ))}
                      </p>
                      <p className="text-caption text-graphite">{fmt.relativeTime(v.createdAt)}</p>
                    </div>
                    <VerificationReview requestId={v.id} />
                  </li>
                );
              }),
            )}
          </ul>
        ) : (
          <p className="text-small text-graphite">{t("noneVerify")}</p>
        )}
      </section>
      <section aria-labelledby="a-orgs" className="flex flex-col gap-4">
        <h2 id="a-orgs" className="text-h3">
          {t("verifications", { count: orgs.length })}
        </h2>
        {orgs.length ? (
          <ul className="flex flex-col gap-3">
            {orgs.map((o) => (
              <li key={o.id} className={card}>
                <div className="flex flex-col gap-0.5">
                  <p className="font-medium">{o.name}</p>
                  <p className="text-small text-graphite">
                    {te(`orgType.${o.type}`)} · {t("regNo")}:{" "}
                    <span className="text-ink font-mono">{o.registrationNo}</span>
                    {o.website ? ` · ${o.website}` : ""}
                  </p>
                  <p className="text-caption text-graphite">
                    {o.verifyRequestedAt ? fmt.relativeTime(o.verifyRequestedAt) : ""}
                  </p>
                </div>
                <OrgReview orgId={o.id} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-small text-graphite">{t("noneVerifications")}</p>
        )}
      </section>
      <section aria-labelledby="a-reports" className="flex flex-col gap-4">
        <h2 id="a-reports" className="text-h3">
          {t("reports", { count: reports.length })}
        </h2>
        {reports.length ? (
          <ul className="flex flex-col gap-3">
            {reports.map((r) => {
              const target = people.get(r.targetUserId);
              return (
                <li key={r.id} className={card}>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="font-medium">
                      {target?.name ?? target?.email ?? r.targetUserId} · {r.reason}
                    </p>
                    {r.details ? <p className="text-small whitespace-pre-line">{r.details}</p> : null}
                    <p className="text-caption text-graphite">
                      {t("reportedBy", { name: people.get(r.reporterUserId)?.name ?? "—" })} ·{" "}
                      {fmt.relativeTime(r.createdAt)}
                    </p>
                  </div>
                  <ReportActions
                    reportId={r.id}
                    targetUserId={r.targetUserId}
                    suspended={Boolean(target?.suspendedAt)}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-small text-graphite">{t("noneReports")}</p>
        )}
      </section>
      <section aria-labelledby="a-susp" className="flex flex-col gap-4">
        <h2 id="a-susp" className="text-h3">
          {t("suspended", { count: suspended.length })}
        </h2>
        {suspended.length ? (
          <ul className="flex flex-col gap-3">
            {suspended.map((u) => (
              <li key={u.id} className={card}>
                <p className="font-medium">{u.name ?? u.email}</p>
                <RestoreUser userId={u.id} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-small text-graphite">{t("noneSuspended")}</p>
        )}
      </section>
    </div>
  );
}
