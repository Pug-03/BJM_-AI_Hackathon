/**
 * Seeding shared by `pnpm db:seed` and judge-mode sandboxes.
 * Pure functions over a PrismaClient — no `server-only`, no path aliases, so
 * tsx can run it from prisma/seed.ts.
 */
import fs from "node:fs";
import path from "node:path";
import type { PrismaClient, Prisma } from "@prisma/client";
import { sampleOrgs, sampleReviews, sampleTalent, type SampleTalent } from "./sample-data";

const SAMPLE_DOMAIN = "sample.able.example";
const day = 24 * 60 * 60 * 1000;
const ago = (days: number, hours = 0) => new Date(Date.now() - days * day - hours * 3600_000);

export const sampleTalentEmail = (key: string) => `talent-${key}@${SAMPLE_DOMAIN}`;
export const sampleOrgEmail = (key: string) => `org-${key}@${SAMPLE_DOMAIN}`;

/** A provided photo in public/sample/people/<key>.(jpg|png|webp) wins over the illustration. */
function sampleAvatar(key: string): string {
  for (const ext of ["webp", "jpg", "jpeg", "png"]) {
    try {
      if (fs.existsSync(path.join(process.cwd(), "public", "sample", "people", `${key}.${ext}`)))
        return `/sample/people/${key}.${ext}`;
    } catch {
      // ignore (e.g. read-only FS)
    }
  }
  return `/sample/avatar-${key}.svg`;
}

async function upsertTalent(
  db: PrismaClient,
  t: SampleTalent,
  opts: { email: string; isSandbox: boolean; handle: string },
) {
  const user = await db.user.upsert({
    where: { email: opts.email },
    update: {},
    create: {
      email: opts.email,
      emailVerified: true,
      name: t.displayName,
      image: sampleAvatar(t.key),
      role: "TALENT",
      isSandbox: opts.isSandbox,
    },
  });
  const avatarUrl = sampleAvatar(t.key);
  const existing = await db.talentProfile.findUnique({ where: { userId: user.id } });
  if (existing) {
    // Backfill the illustrated avatar on older seeds (never overwrites a photo someone uploaded).
    // Backfill, or upgrade an illustrated avatar to a provided photo (never touches real uploads).
    if (
      !existing.avatarUrl ||
      (existing.avatarUrl.startsWith("/sample/") && existing.avatarUrl !== avatarUrl)
    ) {
      const profile = await db.talentProfile.update({ where: { id: existing.id }, data: { avatarUrl } });
      await db.user.update({ where: { id: user.id }, data: { image: avatarUrl } });
      return { user, profile };
    }
    return { user, profile: existing };
  }

  const profile = await db.talentProfile.create({
    data: {
      userId: user.id,
      handle: opts.handle,
      firstName: t.firstName,
      lastName: t.lastName,
      displayName: t.displayName,
      coverUrl: `/sample/cover-${t.cover}.svg`,
      avatarUrl,
      headline: t.headline,
      bio: t.bio,
      dob: new Date(`${t.dobYear}-06-15`),
      showAge: t.showAge,
      country: t.country,
      province: t.province,
      languages: t.languages,
      workMode: t.workMode,
      availability: t.availability,
      specialTalents: t.specialTalents,
      workSetupNeeds: t.workSetupNeeds,
      isSample: true,
      completedJobs: t.stats.completedJobs,
      rehires: t.stats.rehires,
      responseMins: t.stats.responseMins,
      skills: { create: t.skills.map((name) => ({ name })) },
      educations: { create: t.education },
      certificates: {
        create: t.certificates.map((c) => ({
          kind: c.kind,
          title: c.title,
          issuer: c.issuer,
          issuedAt: new Date(`${c.year}-03-01`),
          fileUrl: "/sample/certificate.svg",
        })),
      },
      portfolio: {
        create: t.portfolio.map((p) => ({
          title: p.title,
          description: p.description,
          images: [`/sample/work-${p.art}.svg`],
          imageAlts: [p.title],
          link: p.link,
        })),
      },
      posts: {
        create: t.posts.map((p) => ({
          kind: p.kind,
          text: p.text,
          images: p.art ? [`/sample/work-${p.art}.svg`] : [],
          imageAlts: p.art ? [p.text.slice(0, 80)] : [],
          likeCount: 3 + ((p.daysAgo * 7) % 20),
          createdAt: ago(p.daysAgo),
        })),
      },
      contacts: { create: t.contacts },
    },
  });
  return { user, profile };
}

async function upsertOrg(
  db: PrismaClient,
  o: (typeof sampleOrgs)[number],
  opts: { email: string; isSandbox: boolean; handle: string; name?: string },
) {
  const user = await db.user.upsert({
    where: { email: opts.email },
    update: {},
    create: {
      email: opts.email,
      emailVerified: true,
      name: opts.name ?? o.name,
      role: "EMPLOYER",
      isSandbox: opts.isSandbox,
    },
  });
  const existing = await db.orgProfile.findUnique({ where: { userId: user.id }, include: { needs: true } });
  if (existing) return { user, org: existing };
  const org = await db.orgProfile.create({
    data: {
      userId: user.id,
      handle: opts.handle,
      type: o.type,
      name: opts.name ?? o.name,
      coverUrl: `/sample/cover-${o.cover}.svg`,
      description: o.description,
      industry: o.industry,
      country: "TH",
      province: o.province,
      website: o.website,
      employeeCount: o.employeeCount,
      currentHires: o.currentHires,
      registrationNo: o.verified ? `SAMPLE-${o.key.toUpperCase()}` : null,
      verifyTier: o.verified ? 2 : 1,
      isSample: true,
      contacts: o.website
        ? { create: [{ kind: "WEBSITE", value: o.website, visibility: "PUBLIC" }] }
        : undefined,
      needs: { create: o.needs.map((n) => ({ ...n, location: n.location ?? o.province })) },
    },
    include: { needs: true },
  });
  return { user, org };
}

function offerJson(
  role: string,
  amount: number,
  status: "PENDING" | "ACCEPTED" | "DECLINED",
  startInDays = 14,
) {
  return {
    role,
    pay: amount,
    currency: "THB",
    period: "MONTH",
    startDate: new Date(Date.now() + startInDays * day).toISOString().slice(0, 10),
    notes: "Remote, flexible hours. Equipment provided.",
    status,
  } satisfies Prisma.InputJsonObject;
}

async function conversation(
  db: PrismaClient,
  talentUserId: string,
  employerUserId: string,
  messages: {
    from: "talent" | "employer";
    kind?: "TEXT" | "OFFER" | "CALL" | "SYSTEM";
    text?: string;
    offer?: Prisma.InputJsonObject;
    callRoom?: string;
    at: Date;
    read?: boolean;
  }[],
) {
  const convo = await db.conversation.upsert({
    where: { talentUserId_employerUserId: { talentUserId, employerUserId } },
    update: {},
    create: { talentUserId, employerUserId, lastMessageAt: messages[messages.length - 1]?.at ?? new Date() },
  });
  const count = await db.message.count({ where: { conversationId: convo.id } });
  if (count === 0) {
    await db.message.createMany({
      data: messages.map((m) => ({
        conversationId: convo.id,
        senderUserId: m.from === "talent" ? talentUserId : employerUserId,
        kind: m.kind ?? "TEXT",
        text: m.text,
        offer: m.offer,
        callRoom: m.callRoom,
        deliveredAt: m.at,
        readAt: m.read === false ? null : m.at,
        createdAt: m.at,
      })),
    });
  }
  return convo;
}

/** Recomputes ratingAvg / ratingCount for a talent profile from its reviews. */
export async function refreshRating(db: PrismaClient, talentId: string) {
  const agg = await db.review.aggregate({
    where: { targetId: talentId },
    _avg: { rating: true },
    _count: true,
  });
  await db.talentProfile.update({
    where: { id: talentId },
    data: { ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10, ratingCount: agg._count },
  });
}

/** Idempotent: creates the 12 sample talent, 25 sample organizations, needs, reviews and conversations. */
export async function seedSamples(db: PrismaClient) {
  const talents = new Map<string, { userId: string; profileId: string }>();
  for (const t of sampleTalent) {
    const { user, profile } = await upsertTalent(db, t, {
      email: sampleTalentEmail(t.key),
      isSandbox: false,
      handle: t.handle,
    });
    talents.set(t.key, { userId: user.id, profileId: profile.id });
  }
  const orgs = new Map<string, { userId: string; orgId: string; needTitle: string }>();
  for (const o of sampleOrgs) {
    const { user, org } = await upsertOrg(db, o, {
      email: sampleOrgEmail(o.key),
      isSandbox: false,
      handle: o.handle,
    });
    orgs.set(o.key, { userId: user.id, orgId: org.id, needTitle: o.needs[0]?.title ?? "Role" });
  }

  // Reviews come from a real conversation with an accepted offer (same rule the app enforces).
  for (const [i, [tk, ok, rating, text]] of sampleReviews.entries()) {
    const t = talents.get(tk)!;
    const o = orgs.get(ok)!;
    const convo = await conversation(db, t.userId, o.userId, [
      {
        from: "employer",
        text: "Hello! We liked your profile. Are you available for a project?",
        at: ago(60 + i, 3),
      },
      { from: "talent", text: "Hi, yes I am. Happy to hear more.", at: ago(60 + i, 2) },
      {
        from: "employer",
        kind: "OFFER",
        offer: offerJson(o.needTitle, 18000 + i * 750, "ACCEPTED", -30),
        at: ago(59 + i),
      },
      { from: "talent", kind: "SYSTEM", text: "OFFER_ACCEPTED", at: ago(59 + i, -1) },
    ]);
    await db.review.upsert({
      where: {
        authorUserId_targetId_conversationId: {
          authorUserId: o.userId,
          targetId: t.profileId,
          conversationId: convo.id,
        },
      },
      update: {},
      create: {
        authorUserId: o.userId,
        targetId: t.profileId,
        conversationId: convo.id,
        rating,
        text,
        createdAt: ago(40 + i),
      },
    });
  }
  for (const t of talents.values()) await refreshRating(db, t.profileId);

  // A few follows so follower counts aren't all zero.
  const orgList = [...orgs.values()];
  for (const [i, t] of [...talents.values()].entries()) {
    for (let k = 0; k < (i % 4) + 2; k++) {
      const o = orgList[(i * 3 + k) % orgList.length]!;
      await db.follow.upsert({
        where: { followerId_followeeUserId: { followerId: o.userId, followeeUserId: t.userId } },
        update: {},
        create: { followerId: o.userId, followeeUserId: t.userId },
      });
    }
  }
  return { talents, orgs };
}

/** Deletes every row tied to a user (account deletion and sandbox reset). */
export async function deleteUserData(db: PrismaClient, userId: string) {
  const convos = await db.conversation.findMany({
    where: { OR: [{ talentUserId: userId }, { employerUserId: userId }] },
    select: { id: true },
  });
  const talent = await db.talentProfile.findUnique({ where: { userId }, select: { id: true } });
  await db.$transaction([
    db.conversation.deleteMany({ where: { id: { in: convos.map((c) => c.id) } } }),
    db.follow.deleteMany({ where: { OR: [{ followerId: userId }, { followeeUserId: userId }] } }),
    db.star.deleteMany({
      where: { OR: [{ employerUserId: userId }, ...(talent ? [{ talentId: talent.id }] : [])] },
    }),
    db.skip.deleteMany({
      where: { OR: [{ employerUserId: userId }, ...(talent ? [{ talentId: talent.id }] : [])] },
    }),
    db.profileView.deleteMany({
      where: { OR: [{ viewerUserId: userId }, ...(talent ? [{ talentId: talent.id }] : [])] },
    }),
    db.review.deleteMany({ where: { authorUserId: userId } }),
    db.postLike.deleteMany({ where: { userId } }),
    db.postComment.deleteMany({ where: { authorUserId: userId } }),
    db.notification.deleteMany({ where: { userId } }),
    db.block.deleteMany({ where: { OR: [{ blockerUserId: userId }, { blockedUserId: userId }] } }),
    db.typingState.deleteMany({ where: { userId } }),
    db.setupShare.deleteMany({ where: { employerUserId: userId } }),
    ...(talent ? [db.matchScore.deleteMany({ where: { talentId: talent.id } })] : []),
    db.user.delete({ where: { id: userId } }),
  ]);
}

/** Persona for the judge's own talent sandbox. */
const judgeTalent: SampleTalent = {
  key: "judge-talent",
  firstName: "Ploy",
  lastName: "Jaidee",
  displayName: "Ploy Jaidee",
  handle: "",
  headline: "Customer support and data entry",
  bio: "I answer customer chats in Thai and English and keep spreadsheets tidy. I use a screen magnifier and work best remotely. Looking for a full-time remote role.",
  province: "Bangkok",
  country: "TH",
  languages: ["Thai", "English"],
  workMode: "REMOTE",
  availability: ["FULL_TIME", "PART_TIME"],
  skills: ["Customer support", "Live chat", "Data entry", "Excel", "Thai–English translation"],
  specialTalents: "Fast, accurate typing (70 wpm)",
  workSetupNeeds: "Screen magnifier; remote work",
  dobYear: 1997,
  showAge: true,
  education: [
    {
      level: "Bachelor's degree",
      school: "Sukhothai Thammathirat Open University",
      field: "Business Administration",
      yearEnd: 2020,
    },
  ],
  certificates: [
    {
      kind: "EMPLOYMENT",
      title: "Data entry clerk, 2020–2024",
      issuer: "Sample distribution company",
      year: 2024,
    },
    {
      kind: "TRAINING",
      title: "Customer service online course",
      issuer: "Sample training institute",
      year: 2023,
    },
  ],
  portfolio: [
    {
      title: "Order tracking sheet",
      description: "A shared Excel tracker used by a 6-person sales team.",
      art: 4,
    },
  ],
  posts: [
    {
      kind: "WORK",
      text: "Completed an online customer service course this month. Ready for new chat support work!",
      daysAgo: 2,
    },
    { kind: "PHOTO", text: "My home workspace — big screen, magnifier, coffee.", art: 1, daysAgo: 9 },
  ],
  stats: { completedJobs: 6, rehires: 2, responseMins: 30 },
  cover: 1,
  contacts: [
    { kind: "EMAIL", value: "ploy.sample@able.example", visibility: "CHAT_ONLY" },
    { kind: "LINE", value: "ploy.sample", visibility: "CHAT_ONLY" },
  ],
};

const judgeOrg: (typeof sampleOrgs)[number] = {
  key: "judge-employer",
  type: "STARTUP",
  name: "Bright Path Co.",
  handle: "",
  description: "A sample startup used in judge mode: online customer service for Thai e-commerce brands.",
  industry: "E-commerce services",
  province: "Bangkok",
  employeeCount: 140,
  currentHires: 0,
  verified: true,
  cover: 3,
  needs: [
    {
      title: "Customer support specialist (TH/EN)",
      skills: ["Customer support", "Live chat", "Zendesk", "Thai–English translation"],
      workMode: "REMOTE",
      employmentType: "FULL_TIME",
      ageMin: 22,
      ageMax: 45,
      offeredSetup: ["REMOTE", "SCREEN_READER", "FLEXIBLE_HOURS"],
      description: "Answer customer chats and emails for our brand partners in Thai and English.",
    },
    {
      title: "Data analyst",
      skills: ["SQL", "Excel", "Power BI", "Data visualization"],
      workMode: "HYBRID",
      employmentType: "FULL_TIME",
      educationLevel: "Bachelor's degree",
      offeredSetup: ["FLEXIBLE_HOURS", "STEP_FREE"],
      description: "Build weekly dashboards on chat volume and customer satisfaction.",
    },
  ],
};

export interface Sandbox {
  talentUserId: string;
  employerUserId: string;
  talentEmail: string;
  employerEmail: string;
}

/** Creates the judge's talent + employer sandbox accounts with complete, realistic sample data. */
export async function createSandbox(db: PrismaClient, judgeId: string): Promise<Sandbox> {
  await seedSamples(db);
  const short = judgeId.slice(0, 8).toLowerCase();
  const talentEmail = `judge-${judgeId}-talent@sandbox.able.example`;
  const employerEmail = `judge-${judgeId}-employer@sandbox.able.example`;

  const { user: tu, profile: tp } = await upsertTalent(db, judgeTalent, {
    email: talentEmail,
    isSandbox: true,
    handle: `ploy-${short}`,
  });
  const { user: eu, org } = await upsertOrg(db, judgeOrg, {
    email: employerEmail,
    isSandbox: true,
    handle: `bright-path-${short}`,
    name: "Bright Path Co.",
  });

  const sample = (k: string) =>
    db.user.findUniqueOrThrow({ where: { email: sampleTalentEmail(k) }, include: { talent: true } });
  const sampleOrg = (k: string) =>
    db.user.findUniqueOrThrow({ where: { email: sampleOrgEmail(k) }, include: { org: true } });

  // Talent sandbox: 3 conversations with sample employers.
  const payleaf = await sampleOrg("payleaf");
  const hotels = await sampleOrg("cp-hotels");
  const transport = await sampleOrg("gov-transport");
  await conversation(db, tu.id, payleaf.id, [
    {
      from: "employer",
      text: "Hi Ploy, your chat support experience fits our merchant support team. Could we talk this week?",
      at: ago(3, 5),
    },
    {
      from: "talent",
      text: "Hello! Yes, I’d love to. I’m free Wednesday or Thursday afternoon.",
      at: ago(3, 4),
    },
    { from: "employer", text: "Great — after our call we’d like to make you an offer.", at: ago(2, 2) },
    {
      from: "employer",
      kind: "OFFER",
      offer: offerJson("Customer support specialist (TH/EN)", 24000, "PENDING"),
      at: ago(1, 6),
      read: false,
    },
  ]);
  await conversation(db, tu.id, hotels.id, [
    {
      from: "employer",
      text: "Hello Ploy, we saw your profile. Are you open to guest relations work by chat and email?",
      at: ago(6, 3),
    },
    { from: "talent", text: "Yes! I’m interested. Remote is best for me.", at: ago(6, 2) },
    { from: "employer", kind: "CALL", text: "VIDEO", callRoom: "past-call", at: ago(5, 1) },
    { from: "employer", text: "Thanks for the call today. We’ll share next steps by Friday.", at: ago(5) },
  ]);
  await conversation(db, tu.id, transport.id, [
    {
      from: "employer",
      text: "Hi, we’re hiring remote passenger support staff. Would you like details?",
      at: ago(1, 3),
      read: false,
    },
  ]);
  for (const o of [payleaf, hotels, transport]) {
    await db.follow.upsert({
      where: { followerId_followeeUserId: { followerId: o.id, followeeUserId: tu.id } },
      update: {},
      create: { followerId: o.id, followeeUserId: tu.id },
    });
    await db.profileView.create({ data: { viewerUserId: o.id, talentId: tp.id, createdAt: ago(1) } });
  }
  await db.star.upsert({
    where: { employerUserId_talentId: { employerUserId: payleaf.id, talentId: tp.id } },
    update: {},
    create: { employerUserId: payleaf.id, talentId: tp.id },
  });
  await db.notification.createMany({
    data: [
      { userId: tu.id, kind: "OFFER", payload: { fromName: payleaf.org?.name ?? "" }, createdAt: ago(1, 6) },
      {
        userId: tu.id,
        kind: "MESSAGE",
        payload: { fromName: transport.org?.name ?? "" },
        createdAt: ago(1, 3),
      },
      { userId: tu.id, kind: "FOLLOW", payload: { fromName: hotels.org?.name ?? "" }, createdAt: ago(4) },
    ],
  });

  // Employer sandbox: 3 conversations with sample talent.
  const mali = await sample("mali");
  const ananya = await sample("ananya");
  const wichai = await sample("wichai");
  const need0 = org.needs[0]!;
  await conversation(db, mali.id, eu.id, [
    {
      from: "employer",
      text: "Hi Mali, your Zendesk and bilingual experience is exactly what we need.",
      at: ago(2, 6),
    },
    { from: "talent", text: "Thank you! I’d be glad to hear more about the role.", at: ago(2, 5) },
    { from: "employer", kind: "OFFER", offer: offerJson(need0.title, 26000, "PENDING"), at: ago(1, 2) },
    {
      from: "talent",
      text: "Thanks for the offer — could we discuss the start date?",
      at: ago(0, 5),
      read: false,
    },
  ]);
  await conversation(db, ananya.id, eu.id, [
    {
      from: "employer",
      text: "Hello Ananya, would you like to talk about our data analyst role?",
      at: ago(4, 4),
    },
    { from: "talent", text: "Hi! Sure, I’m available for a call.", at: ago(4, 3) },
    { from: "employer", kind: "CALL", text: "VOICE", callRoom: "past-call", at: ago(3, 2) },
    { from: "talent", text: "Thanks for the call. I’ll send my dashboard samples.", at: ago(3, 1) },
  ]);
  await conversation(db, wichai.id, eu.id, [
    {
      from: "talent",
      text: "Hello, I saw you follow my profile. I do screen reader testing if you need it.",
      at: ago(0, 8),
      read: false,
    },
  ]);
  for (const t of [mali, ananya, wichai]) {
    await db.star.upsert({
      where: { employerUserId_talentId: { employerUserId: eu.id, talentId: t.talent!.id } },
      update: {},
      create: { employerUserId: eu.id, talentId: t.talent!.id, needId: need0.id },
    });
    await db.follow.upsert({
      where: { followerId_followeeUserId: { followerId: eu.id, followeeUserId: t.id } },
      update: {},
      create: { followerId: eu.id, followeeUserId: t.id },
    });
  }
  await db.notification.createMany({
    data: [
      { userId: eu.id, kind: "MESSAGE", payload: { fromName: "Mali Srisuk" }, createdAt: ago(0, 5) },
      { userId: eu.id, kind: "MESSAGE", payload: { fromName: "Wichai Saelim" }, createdAt: ago(0, 8) },
    ],
  });

  return { talentUserId: tu.id, employerUserId: eu.id, talentEmail, employerEmail };
}
