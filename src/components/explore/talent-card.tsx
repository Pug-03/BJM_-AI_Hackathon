import { getLocale, getTranslations } from "next-intl/server";
import { MapPin, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/able/verified-badge";
import { provinceLabel } from "@/config/th-provinces";
import type { TalentCard as Card } from "@/lib/talent-query";

/** Directory card — the whole card is one link (name is the accessible label). */
export async function TalentCard({ c, sampleLabel }: { c: Card; sampleLabel: boolean }) {
  const t = await getTranslations("explore");
  const te = await getTranslations("enums");
  const locale = await getLocale();
  return (
    <article className="border-line bg-raised group hover:shadow-float relative flex h-full flex-col overflow-hidden rounded-[20px] border transition-shadow duration-200">
      <div className="bg-mist h-16">
        {c.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.cover} alt="" loading="lazy" className="size-full object-cover" />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
        <div className="-mt-7 flex items-end justify-between">
          <Avatar src={c.avatar} name={c.name} size="md" className="border-raised size-14 border-4" />
          {sampleLabel && c.sample ? (
            <span className="bg-mist text-caption text-graphite rounded-full px-2.5 py-0.5">
              {t("sample")}
            </span>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="text-body flex items-center gap-1.5 font-semibold">
            <Link
              href={`/u/${c.handle}`}
              className="truncate after:absolute after:inset-0 focus-visible:underline"
            >
              {c.name}
            </Link>
            <VerifiedBadge tier={c.verifyTier} size={16} className="relative z-10" />
          </h2>
          {c.headline ? <p className="text-small text-graphite line-clamp-2">{c.headline}</p> : null}
        </div>
        <p className="text-caption text-graphite flex flex-wrap items-center gap-x-2 gap-y-1">
          {c.province ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden />
              {provinceLabel(c.province, locale)}
            </span>
          ) : null}
          <span>{te(`workMode.${c.workMode as "REMOTE"}`)}</span>
          {c.ratingCount ? (
            <span className="inline-flex items-center gap-1">
              <Star className="text-star size-3.5" fill="currentColor" strokeWidth={0} aria-hidden />
              <span className="text-ink font-medium">{c.rating.toFixed(1)}</span>({c.ratingCount})
            </span>
          ) : null}
        </p>
        {c.skills.length ? (
          <ul className="mt-auto flex flex-wrap gap-1.5" aria-label={t("skills")}>
            {c.skills.slice(0, 3).map((s) => (
              <li key={s} className="bg-mist text-caption text-ink rounded-full px-2.5 py-1">
                {s}
              </li>
            ))}
            {c.skills.length > 3 ? (
              <li className="text-caption text-graphite px-1 py-1">+{c.skills.length - 3}</li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
