import { getLocale, getTranslations } from "next-intl/server";
import { Building2, Check, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { VerifiedBadge } from "@/components/able/verified-badge";
import { provinceLabel } from "@/config/th-provinces";
import { educationLevels } from "@/lib/schemas/talent";
import { OrgActions } from "./org-actions";

export interface NeedCardData {
  id: string;
  title: string;
  skills: string[];
  matched: string[];
  workMode: string;
  employmentType: string;
  location: string | null;
  educationLevel: string | null;
  offeredSetup: string[];
  description: string | null;
  org: {
    userId: string;
    handle: string;
    name: string;
    logoUrl: string | null;
    verifyTier: number;
    type: string;
    isSample: boolean;
  };
  following: boolean;
}

/** An open position matched to the talent (talent feed, org page). */
export async function NeedCard({
  n,
  sampleLabel,
  showOrg = true,
  canAct = true,
}: {
  n: NeedCardData;
  sampleLabel: boolean;
  showOrg?: boolean;
  canAct?: boolean;
}) {
  const t = await getTranslations("feed");
  const te = await getTranslations("enums");
  const locale = await getLocale();
  const matched = new Set(n.matched);
  const edu = n.educationLevel
    ? (educationLevels as readonly string[]).includes(n.educationLevel)
      ? te(`education.${n.educationLevel as (typeof educationLevels)[number]}`)
      : n.educationLevel
    : null;
  return (
    <article
      className="border-line bg-raised flex flex-col gap-4 rounded-[20px] border p-5"
      aria-labelledby={`need-${n.id}`}
    >
      {showOrg ? (
        <div className="flex items-center gap-3">
          {n.org.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={n.org.logoUrl} alt="" className="size-11 rounded-full object-cover" loading="lazy" />
          ) : (
            <span className="bg-avatar text-graphite flex size-11 shrink-0 items-center justify-center rounded-full">
              <Building2 className="size-5" aria-hidden />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-small flex items-center gap-1.5 font-medium">
              <Link href={`/o/${n.org.handle}`} className="truncate hover:underline">
                {n.org.name}
              </Link>
              <VerifiedBadge tier={n.org.verifyTier} size={16} />
            </p>
            <p className="text-caption text-graphite">{te(`orgType.${n.org.type as "STARTUP"}`)}</p>
          </div>
          {sampleLabel && n.org.isSample ? (
            <span className="bg-mist text-caption text-graphite shrink-0 rounded-full px-2.5 py-0.5">
              {t("sample")}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        <h3 id={`need-${n.id}`} className="text-h3">
          {n.title}
        </h3>
        <p className="text-caption text-graphite flex flex-wrap items-center gap-x-2 gap-y-1">
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
          {edu ? (
            <>
              · <span>{edu}</span>
            </>
          ) : null}
        </p>
      </div>
      {n.description ? <p className="text-small text-ink line-clamp-3">{n.description}</p> : null}
      {n.skills.length ? (
        <ul className="flex flex-wrap gap-2" aria-label={t("skillsNeeded")}>
          {n.skills.map((s) => {
            const m = matched.has(s);
            return (
              <li
                key={s}
                className={`text-small inline-flex h-8 items-center gap-1 rounded-full px-3 ${m ? "bg-brand-soft text-brand font-medium" : "bg-mist text-ink"}`}
              >
                {m ? <Check className="size-3.5" aria-hidden /> : null}
                {s}
                {m ? <span className="sr-only"> ({t("youHaveThis")})</span> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
      {n.offeredSetup.length ? (
        <div className="flex flex-col gap-2">
          <p className="text-caption text-graphite">{t("setupOffered")}</p>
          <ul className="text-small flex flex-wrap gap-x-4 gap-y-1">
            {n.offeredSetup.map((s) => (
              <li key={s} className="inline-flex items-center gap-1.5">
                <Check className="text-success size-3.5" aria-hidden />
                {te(`setup.${s as "REMOTE"}`)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {canAct ? <OrgActions orgUserId={n.org.userId} following={n.following} /> : null}
    </article>
  );
}
