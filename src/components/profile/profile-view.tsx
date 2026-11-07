"use client";

import * as React from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  Briefcase,
  ExternalLink,
  FileText,
  AtSign,
  Globe,
  Heart,
  Languages,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Share2,
  Star,
  Trash2,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { RatingStars } from "@/components/ui/rating-stars";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toaster";
import { VerifiedBadge } from "@/components/able/verified-badge";
import { EmptyState } from "@/components/able/empty-state";
import { ProgressPill } from "@/components/able/progress-pill";
import { CoverImage } from "@/components/able/cover-image";
import { Lightbox, Thumb, useLightbox } from "@/components/able/lightbox";
import { Link } from "@/i18n/navigation";
import { provinceLabel } from "@/config/th-provinces";
import { staggerContainer, staggerItem, useReducedMotion, variantsFor } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { deletePost, toggleFollow, toggleStar } from "@/server/talent";
import { startConversation } from "@/server/conversations";
import type { TalentProfileData } from "@/server/profile-data";
import { PostComposer } from "./post-composer";

const contactIcon: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  PHONE: Phone,
  EMAIL: Mail,
  LINE: MessageCircle,
  INSTAGRAM: AtSign,
  TIKTOK: Globe,
  FACEBOOK: Globe,
  LINKEDIN: Briefcase,
  WEBSITE: Globe,
};

function contactHref(kind: string, value: string): string | undefined {
  if (kind === "EMAIL") return `mailto:${value}`;
  if (kind === "PHONE") return `tel:${value.replace(/\s+/g, "")}`;
  if (/^https?:\/\//.test(value)) return value;
  if (kind === "INSTAGRAM") return `https://instagram.com/${value.replace(/^@/, "")}`;
  if (kind === "TIKTOK") return `https://www.tiktok.com/@${value.replace(/^@/, "")}`;
  if (kind === "LINE") return `https://line.me/ti/p/~${value}`;
  return undefined;
}

export function ProfileView({ data }: { data: TalentProfileData }) {
  const t = useTranslations("profile");
  const te = useTranslations("enums");
  const tc = useTranslations("common");
  const locale = useLocale();
  const fmt = useFormatter();
  const reduced = useReducedMotion();
  const p = data.profile;
  const owner = p.isOwner;
  const [following, setFollowing] = React.useState(data.isFollowing);
  const [followers, setFollowers] = React.useState(data.followers);
  const [starred, setStarred] = React.useState(data.isStarred);
  const [posts, setPosts] = React.useState(data.posts);
  const [allSkills, setAllSkills] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);
  const [msgBusy, setMsgBusy] = React.useState(false);
  const lb = useLightbox();

  const follow = async () => {
    if (!data.viewerSignedIn) return window.location.assign(`/${locale}/login?next=/u/${p.handle}`);
    const next = !following;
    setFollowing(next);
    setFollowers((n) => n + (next ? 1 : -1));
    const r = await toggleFollow(p.userId, next);
    if (!r.ok) {
      setFollowing(!next);
      setFollowers((n) => n + (next ? -1 : 1));
    }
  };
  const star = async () => {
    const next = !starred;
    setStarred(next);
    const r = await toggleStar(p.id, next);
    if (!r.ok) setStarred(!next);
  };
  const message = async () => {
    if (!data.viewerSignedIn) return window.location.assign(`/${locale}/login?next=/u/${p.handle}`);
    if (data.conversationId) return window.location.assign(`/${locale}/messages/${data.conversationId}`);
    setMsgBusy(true);
    const r = await startConversation(p.userId);
    setMsgBusy(false);
    if (r.ok) window.location.assign(`/${locale}/messages/${r.id}`);
    else toast.error(tc("retry"));
  };
  const share = async () => {
    const url = `${window.location.origin}/${locale}/u/${p.handle}`;
    try {
      if (navigator.share) await navigator.share({ title: p.displayName, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(t("copied"));
      }
    } catch {}
  };

  const location = [
    provinceLabel(p.province, locale),
    p.country === "TH" ? (locale === "th" ? "ไทย" : "Thailand") : p.country,
  ]
    .filter(Boolean)
    .join(", ");
  const responseKey =
    p.responseMins == null
      ? null
      : p.responseMins <= 60
        ? "fast"
        : p.responseMins <= 24 * 60
          ? "same"
          : "other";
  const skillsShown = allSkills ? data.skills : data.skills.slice(0, 8);
  const canStar = data.viewerRole === "EMPLOYER" && !owner;

  const tabs = [
    { value: "posts", label: t("tabs.posts"), count: posts.length },
    { value: "portfolio", label: t("tabs.portfolio"), count: data.portfolio.length },
    { value: "certificates", label: t("tabs.certificates"), count: data.certificates.length },
    { value: "reviews", label: t("tabs.reviews"), count: p.ratingCount },
    { value: "about", label: t("tabs.about") },
  ];

  const actions = (
    <div className="flex flex-wrap gap-2">
      {owner ? (
        <>
          <Button asChild>
            <Link href="/onboarding/talent">
              <Pencil aria-hidden />
              {t("edit")}
            </Link>
          </Button>
          <Button variant="secondary" onClick={() => void share()}>
            <Share2 aria-hidden />
            {t("share")}
          </Button>
        </>
      ) : (
        <>
          <Button onClick={() => void message()} loading={msgBusy}>
            <MessageCircle aria-hidden />
            {t("message")}
          </Button>
          <Button variant="secondary" onClick={() => void follow()} aria-pressed={following}>
            {following ? <UserCheck aria-hidden /> : <UserPlus aria-hidden />}
            {following ? t("following") : t("follow")}
          </Button>
          {canStar ? (
            <Button
              variant={starred ? "brand" : "secondary"}
              onClick={() => void star()}
              aria-pressed={starred}
            >
              <Star aria-hidden fill={starred ? "currentColor" : "none"} />
              {starred ? t("starred") : t("star")}
            </Button>
          ) : (
            <IconButton variant="soft" aria-label={t("share")} onClick={() => void share()} className="size-12 md:size-11">
              <Share2 aria-hidden />
            </IconButton>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="-mx-4 -mt-6 md:mx-0 md:mt-0">
      <CoverImage src={p.coverUrl} offsetY={p.coverOffsetY} editable={owner} />
      <div className="grid gap-8 px-4 md:px-0 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-12">
        {/* Profile block */}
        <motion.aside
          variants={variantsFor(staggerContainer, reduced)}
          initial="initial"
          animate="animate"
          className="flex flex-col gap-5"
        >
          <motion.div variants={variantsFor(staggerItem, reduced)} className="-mt-14 sm:-mt-16">
            <Avatar
              src={p.avatarUrl}
              name={p.displayName}
              size="xl"
              alt={p.displayName}
              className="border-paper border-4"
            />
          </motion.div>
          <motion.div variants={variantsFor(staggerItem, reduced)} className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-h2">{p.displayName}</h1>
              <VerifiedBadge tier={p.verifyTier} size={22} />
              {p.isSample ? (
                <span className="bg-mist text-caption text-graphite rounded-full px-2.5 py-0.5">
                  {t("sample")}
                </span>
              ) : null}
            </div>
            <p className="text-small text-graphite">
              @{p.handle} · {t("followers", { count: followers })}
            </p>
          </motion.div>
          {p.headline ? (
            <motion.p variants={variantsFor(staggerItem, reduced)} className="text-body font-medium">
              {p.headline}
            </motion.p>
          ) : null}
          <motion.ul
            variants={variantsFor(staggerItem, reduced)}
            className="text-small text-graphite flex flex-col gap-1.5"
          >
            {location ? (
              <li className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0" aria-hidden />
                {location}
                {p.age ? ` · ${t("age", { age: p.age })}` : ""}
              </li>
            ) : null}
            {p.languages.length ? (
              <li className="flex items-center gap-2">
                <Languages className="size-4 shrink-0" aria-hidden />
                {p.languages.join(", ")}
              </li>
            ) : null}
            <li className="flex items-center gap-2">
              <Briefcase className="size-4 shrink-0" aria-hidden />
              {[te(`workMode.${p.workMode}`), ...p.availability.map((a) => te(`availability.${a}`))].join(
                " · ",
              )}
            </li>
          </motion.ul>
          {p.contacts.length ? (
            <motion.ul
              variants={variantsFor(staggerItem, reduced)}
              aria-label={t("contactsTitle")}
              className="flex flex-wrap gap-1"
            >
              {p.contacts.map((c) => {
                const Icon = contactIcon[c.kind] ?? Globe;
                const href = contactHref(c.kind, c.value);
                const label = `${te(`contact.${c.kind}`)}: ${c.value}`;
                return (
                  <li key={c.id}>
                    {href ? (
                      <a
                        href={href}
                        target={href.startsWith("http") ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        aria-label={label}
                        title={label}
                        className="bg-mist hover:bg-cloud flex size-11 items-center justify-center rounded-full"
                      >
                        <Icon className="size-5" aria-hidden />
                      </a>
                    ) : (
                      <span
                        title={label}
                        className="bg-mist text-small flex h-11 items-center gap-2 rounded-full px-3"
                      >
                        <Icon className="size-4" aria-hidden />
                        {c.value}
                      </span>
                    )}
                  </li>
                );
              })}
            </motion.ul>
          ) : null}
          <motion.dl
            variants={variantsFor(staggerItem, reduced)}
            className="border-line grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border bg-[var(--line)]"
          >
            <div className="bg-paper flex flex-col gap-0.5 px-4 py-3">
              <dt className="text-caption text-graphite">{t("rating")}</dt>
              <dd className="text-body flex items-center gap-1.5 font-semibold">
                {p.ratingCount ? (
                  <>
                    <Star className="text-star size-4" fill="currentColor" strokeWidth={0} aria-hidden />
                    {fmt.number(p.ratingAvg, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}
                    <span className="text-caption text-graphite font-normal">
                      ({t("reviewsCount", { count: p.ratingCount })})
                    </span>
                  </>
                ) : (
                  <span className="text-small text-graphite font-normal">{t("noRating")}</span>
                )}
              </dd>
            </div>
            <div className="bg-paper flex flex-col gap-0.5 px-4 py-3">
              <dt className="text-caption text-graphite">{t("completed")}</dt>
              <dd className="text-body font-semibold">{p.completedJobs}</dd>
            </div>
            <div className="bg-paper flex flex-col gap-0.5 px-4 py-3">
              <dt className="text-caption text-graphite">{t("rehired")}</dt>
              <dd className="text-body font-semibold">{p.rehires}</dd>
            </div>
            <div className="bg-paper flex flex-col gap-0.5 px-4 py-3">
              <dt className="text-caption text-graphite">{t("response")}</dt>
              <dd className="text-body font-semibold">
                {responseKey ? t("responseValue", { value: responseKey }) : "—"}
              </dd>
            </div>
          </motion.dl>
          <motion.div
            variants={variantsFor(staggerItem, reduced)}
            className={cn(!owner && "hidden md:block")}
          >
            {actions}
          </motion.div>
          {data.skills.length ? (
            <motion.section variants={variantsFor(staggerItem, reduced)} className="flex flex-col gap-3">
              <h2 className="text-small font-semibold">{t("skills")}</h2>
              <ul className="flex flex-wrap gap-2">
                {skillsShown.map((s) => (
                  <li key={s} className="bg-mist text-small flex h-9 items-center rounded-full px-3.5">
                    {s}
                  </li>
                ))}
                {data.skills.length > 8 ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => setAllSkills((v) => !v)}
                      aria-expanded={allSkills}
                      className="text-small text-brand flex h-9 min-w-11 items-center rounded-full px-3 font-medium hover:underline"
                    >
                      {allSkills ? tc("showLess") : tc("moreCount", { count: data.skills.length - 8 })}
                    </button>
                  </li>
                ) : null}
              </ul>
            </motion.section>
          ) : null}
          {p.sharedWorkSetup ? (
            <section className="bg-brand-soft flex flex-col gap-1 rounded-[20px] p-4">
              <h2 className="text-small font-semibold">{t("sharedSetup")}</h2>
              <p className="text-small">{p.sharedWorkSetup}</p>
            </section>
          ) : null}
        </motion.aside>

        {/* Tabs */}
        <div className="min-w-0 lg:pt-6">
          <Tabs label={t("tabs.label")} items={tabs}>
            <TabPanel value="posts">
              <div className="flex flex-col gap-4">
                {owner ? <PostComposer onCreated={(post) => setPosts((ps) => [post, ...ps])} /> : null}
                {posts.length ? (
                  <ul className="columns-1 gap-4 sm:columns-2 [&>li]:mb-4 [&>li]:break-inside-avoid">
                    {posts.map((post) => (
                      <li
                        key={post.id}
                        className="border-line bg-raised flex flex-col gap-3 rounded-[20px] border p-4"
                      >
                        {post.images.length ? (
                          <div className={cn("grid gap-2", post.images.length > 1 && "grid-cols-2")}>
                            {post.images.slice(0, 4).map((src, i) => (
                              <Thumb
                                key={src}
                                src={src}
                                alt={post.imageAlts[i] ?? ""}
                                layoutId={`post-${post.id}-${i}`}
                                label={t("openImage", { n: i + 1 })}
                                className="aspect-[4/3] overflow-hidden rounded-[16px]"
                                onOpen={() =>
                                  lb.open(
                                    post.images.map((s, j) => ({ src: s, alt: post.imageAlts[j] ?? "" })),
                                    i,
                                    `post-${post.id}`,
                                  )
                                }
                              />
                            ))}
                          </div>
                        ) : null}
                        {post.text ? <p className="text-small whitespace-pre-line">{post.text}</p> : null}
                        <div className="text-caption text-graphite flex items-center justify-between gap-2">
                          <span className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Heart className="size-4" aria-hidden />
                              {t("likes", { count: post.likeCount })}
                            </span>
                            <time dateTime={post.createdAt}>
                              {fmt.relativeTime(new Date(post.createdAt))}
                            </time>
                          </span>
                          {owner ? (
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(post.id)}
                              aria-label={t("postDelete")}
                              className="hover:bg-mist -m-2 flex size-11 items-center justify-center rounded-full"
                            >
                              <Trash2 className="size-4" aria-hidden />
                            </button>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title={t("noPosts")} body={owner ? t("noPostsOwner") : undefined} />
                )}
              </div>
            </TabPanel>
            <TabPanel value="portfolio">
              {data.portfolio.length ? (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {data.portfolio.map((item) => (
                    <li
                      key={item.id}
                      className="border-line bg-raised flex flex-col gap-3 rounded-[20px] border p-4"
                    >
                      {item.images[0] ? (
                        <Thumb
                          src={item.images[0]}
                          alt={item.imageAlts[0] ?? item.title}
                          layoutId={`pf-${item.id}-0`}
                          label={t("openImage", { n: 1 })}
                          className="aspect-[4/3] overflow-hidden rounded-[16px]"
                          onOpen={() =>
                            lb.open(
                              item.images.map((s, j) => ({ src: s, alt: item.imageAlts[j] ?? item.title })),
                              0,
                              `pf-${item.id}`,
                            )
                          }
                        />
                      ) : null}
                      <h3 className="font-medium">{item.title}</h3>
                      {item.description ? (
                        <p className="text-small text-graphite">{item.description}</p>
                      ) : null}
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-small text-brand inline-flex min-h-11 items-center gap-1.5 self-start hover:underline"
                        >
                          <ExternalLink className="size-4" aria-hidden />
                          {new URL(item.link).hostname}
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title={t("noPortfolio")} />
              )}
            </TabPanel>
            <TabPanel value="certificates">
              {data.certificates.length ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {data.certificates.map((c) => (
                    <li key={c.id} className="border-line bg-raised flex gap-3 rounded-[20px] border p-4">
                      <span className="bg-mist flex size-11 shrink-0 items-center justify-center rounded-full">
                        <FileText className="size-5" aria-hidden />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="font-medium">{c.title}</span>
                        <span className="text-caption text-graphite">
                          {te(`cert.${c.kind}`)}
                          {c.issuer ? ` · ${c.issuer}` : ""}
                        </span>
                        {c.issuedAt ? (
                          <span className="text-caption text-graphite">
                            {t("issued", {
                              date: fmt.dateTime(new Date(c.issuedAt), { year: "numeric", month: "short" }),
                            })}
                          </span>
                        ) : null}
                        {c.fileUrl ? (
                          <a
                            href={c.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-small text-brand mt-1 inline-flex min-h-11 items-center gap-1.5 self-start hover:underline"
                          >
                            <ExternalLink className="size-4" aria-hidden />
                            {t("viewCert")}
                          </a>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title={t("noCerts")} />
              )}
            </TabPanel>
            <TabPanel value="reviews">
              <div className="flex flex-col gap-6">
                {p.ratingCount ? (
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    <div className="flex flex-col gap-1">
                      <p className="text-display tracking-display leading-none">
                        {fmt.number(p.ratingAvg, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}
                      </p>
                      <RatingStars value={p.ratingAvg} size={18} label={`${p.ratingAvg} / 5`} />
                      <p className="text-caption text-graphite">
                        {t("reviewsCount", { count: p.ratingCount })}
                      </p>
                    </div>
                    <ul className="flex flex-1 flex-col gap-1.5">
                      {data.ratingDist.map((r) => (
                        <li key={r.stars} className="text-caption text-graphite flex items-center gap-3">
                          <span className="w-3 tabular-nums">{r.stars}</span>
                          <span className="bg-mist h-2 flex-1 overflow-hidden rounded-full" aria-hidden>
                            <span
                              className="bg-star block h-full origin-left rounded-full"
                              style={{ transform: `scaleX(${p.ratingCount ? r.count / p.ratingCount : 0})` }}
                            />
                          </span>
                          <span className="w-6 text-right tabular-nums">{r.count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {data.reviews.length ? (
                  <ul className="flex flex-col gap-3">
                    {data.reviews.map((r) => (
                      <li
                        key={r.id}
                        className="border-line bg-raised flex flex-col gap-3 rounded-[20px] border p-4"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar src={r.author.image} name={r.author.name} size="sm" />
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="flex items-center gap-1.5 truncate font-medium">
                              {r.author.name}
                              {r.author.verifyTier >= 2 ? (
                                <VerifiedBadge tier={r.author.verifyTier} size={16} />
                              ) : null}
                            </span>
                            <time dateTime={r.createdAt} className="text-caption text-graphite">
                              {fmt.dateTime(new Date(r.createdAt), {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </time>
                          </span>
                          <RatingStars value={r.rating} label={`${r.rating} / 5`} />
                        </div>
                        {r.text ? <p className="text-small">{r.text}</p> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title={t("noReviews")} />
                )}
                <p className="text-caption text-graphite">{t("reviewsRule")}</p>
              </div>
            </TabPanel>
            <TabPanel value="about">
              <dl className="flex flex-col gap-6">
                {p.bio ? (
                  <div>
                    <dt className="text-small mb-1 font-semibold">{t("aboutBio")}</dt>
                    <dd className="measure whitespace-pre-line">{p.bio}</dd>
                  </div>
                ) : null}
                {data.educations.length ? (
                  <div>
                    <dt className="text-small mb-2 font-semibold">{t("aboutEducation")}</dt>
                    <dd>
                      <ul className="flex flex-col gap-2">
                        {data.educations.map((e) => (
                          <li key={e.id} className="flex flex-col">
                            <span className="font-medium">{e.school}</span>
                            <span className="text-small text-graphite">
                              {[
                                te.has(`education.${e.level}`) ? te(`education.${e.level}`) : e.level,
                                e.field,
                                e.yearEnd,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                ) : null}
                {p.specialTalents ? (
                  <div>
                    <dt className="text-small mb-1 font-semibold">{t("aboutSpecial")}</dt>
                    <dd>{p.specialTalents}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-small mb-1 font-semibold">{t("aboutWorkMode")}</dt>
                  <dd>{te(`workMode.${p.workMode}`)}</dd>
                </div>
                {p.availability.length ? (
                  <div>
                    <dt className="text-small mb-1 font-semibold">{t("aboutAvailability")}</dt>
                    <dd>{p.availability.map((a) => te(`availability.${a}`)).join(", ")}</dd>
                  </div>
                ) : null}
              </dl>
            </TabPanel>
          </Tabs>
        </div>
      </div>

      {/* Mobile sticky actions (non-owner) */}
      {!owner ? (
        <div className="bg-paper/95 border-line shadow-float fixed inset-x-0 bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+20px)] z-30 mx-4 flex gap-2 rounded-full border p-1.5 backdrop-blur md:hidden">
          <Button className="flex-1" onClick={() => void message()} loading={msgBusy}>
            <MessageCircle aria-hidden />
            {t("message")}
          </Button>
          <Button
            className="flex-1"
            variant="secondary"
            onClick={() => void follow()}
            aria-pressed={following}
          >
            {following ? <UserCheck aria-hidden /> : <UserPlus aria-hidden />}
            {following ? t("following") : t("follow")}
          </Button>
        </div>
      ) : null}

      {owner && data.checklist ? (
        <ProgressPill
          items={data.checklist.map((c) => ({
            key: c.key,
            label: t(`checklist.${c.key}`),
            done: c.done,
            href: `/${locale}/onboarding/talent`,
          }))}
        />
      ) : null}

      <Lightbox lb={lb} closeLabel={t("closeImage")} prevLabel={t("prevImage")} nextLabel={t("nextImage")} />
      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
        title={t("postDeleteConfirm")}
        confirmLabel={tc("delete")}
        cancelLabel={tc("cancel")}
        closeLabel={tc("close")}
        destructive
        onConfirm={async () => {
          const id = confirmDelete!;
          setConfirmDelete(null);
          setPosts((ps) => ps.filter((x) => x.id !== id));
          await deletePost(id);
        }}
      />
    </div>
  );
}
