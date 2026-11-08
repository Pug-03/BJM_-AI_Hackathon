import { describe, expect, it } from "vitest";
import {
  canViewProfile,
  serializeTalentForViewer,
  type RawTalentProfile,
  type ViewerContext,
} from "@/lib/privacy";

const base: RawTalentProfile = {
  id: "t1",
  userId: "u-talent",
  handle: "mali",
  displayName: "Mali S.",
  firstName: "Mali",
  lastName: "S",
  avatarUrl: null,
  coverUrl: null,
  coverOffsetY: 50,
  headline: "Support",
  bio: "Bio",
  dob: new Date("1996-06-15"),
  showAge: false,
  gender: "female",
  country: "TH",
  province: "Bangkok",
  languages: ["Thai"],
  workMode: "REMOTE",
  availability: ["FULL_TIME"],
  specialTalents: null,
  workSetupNeeds: "Screen reader",
  isPublic: true,
  isSample: false,
  verifyTier: 3,
  ratingAvg: 4.8,
  ratingCount: 3,
  completedJobs: 1,
  rehires: 0,
  responseMins: 30,
  contacts: [
    { id: "c1", kind: "LINKEDIN", value: "li", visibility: "PUBLIC" },
    { id: "c2", kind: "PHONE", value: "+66", visibility: "CHAT_ONLY" },
    { id: "c3", kind: "EMAIL", value: "e@x", visibility: "HIDDEN" },
  ],
  user: { isSandbox: false },
};

const anon: ViewerContext = { userId: null, isSandbox: false, inConversation: false, setupShared: false };
const employer: ViewerContext = {
  userId: "u-emp",
  isSandbox: false,
  inConversation: false,
  setupShared: false,
};
const chatting: ViewerContext = { ...employer, inConversation: true };
const owner: ViewerContext = {
  userId: "u-talent",
  isSandbox: false,
  inConversation: false,
  setupShared: false,
};

const json = (o: unknown) => JSON.stringify(o);

describe("talent privacy", () => {
  it("never sends DOB, gender or work-setup needs to non-owners", () => {
    for (const v of [anon, employer, chatting]) {
      const out = serializeTalentForViewer(base, v);
      const s = json(out);
      expect(out.private).toBeNull();
      expect(s).not.toContain("1996");
      expect(s).not.toContain("female");
      expect(s).not.toContain("Screen reader");
      expect(s).not.toMatch(/"dob"|"gender"|"workSetupNeeds"/);
    }
  });

  it("shows age only when the talent turned it on", () => {
    expect(serializeTalentForViewer(base, anon).age).toBeNull();
    const shown = serializeTalentForViewer({ ...base, showAge: true }, anon, new Date("2026-11-08"));
    expect(shown.age).toBe(30);
  });

  it("contact visibility: public / chat-only / hidden", () => {
    expect(serializeTalentForViewer(base, anon).contacts.map((c) => c.kind)).toEqual(["LINKEDIN"]);
    expect(serializeTalentForViewer(base, chatting).contacts.map((c) => c.kind)).toEqual([
      "LINKEDIN",
      "PHONE",
    ]);
    expect(serializeTalentForViewer(base, owner).contacts.map((c) => c.kind)).toEqual([
      "LINKEDIN",
      "PHONE",
      "EMAIL",
    ]);
    expect(json(serializeTalentForViewer(base, chatting))).not.toContain("e@x");
  });

  it("work setup is shared only with an employer the talent chose", () => {
    expect(serializeTalentForViewer(base, { ...chatting, setupShared: true }).sharedWorkSetup).toBe(
      "Screen reader",
    );
    expect(serializeTalentForViewer(base, chatting).sharedWorkSetup).toBeNull();
  });

  it("owner sees their private fields", () => {
    const out = serializeTalentForViewer(base, owner);
    expect(out.private).toEqual({ dob: "1996-06-15", gender: "female", workSetupNeeds: "Screen reader" });
  });

  it("identity tier (Phase 2) is never shown", () => {
    expect(serializeTalentForViewer(base, anon).verifyTier).toBe(2);
  });

  it("sandbox profiles are invisible to real users; private profiles only to chat partners", () => {
    const sb = { ...base, user: { isSandbox: true } };
    expect(canViewProfile(sb, anon)).toBe(false);
    expect(canViewProfile(sb, { ...anon, isSandbox: true })).toBe(true);
    const priv = { ...base, isPublic: false };
    expect(canViewProfile(priv, employer)).toBe(false);
    expect(canViewProfile(priv, chatting)).toBe(true);
    expect(canViewProfile(priv, owner)).toBe(true);
  });
});

describe("disability information (sensitive, PDPA s.26)", () => {
  const withDis = { ...base, disabilityTypes: ["VISION"], disabilityNote: "Uses a screen reader", disabilityVisibility: "HIDDEN", disabilityCardVerifiedAt: new Date() };

  it("hidden by default from everyone but the owner", () => {
    for (const v of [anon, employer, chatting]) {
      const out = serializeTalentForViewer(withDis, v);
      expect(out.disability).toBeNull();
      expect(JSON.stringify(out)).not.toContain("screen reader");
    }
    expect(serializeTalentForViewer(withDis, owner).disability?.types).toEqual(["VISION"]);
  });

  it("CHAT_ONLY shows it only to employers in a conversation", () => {
    const p = { ...withDis, disabilityVisibility: "CHAT_ONLY" };
    expect(serializeTalentForViewer(p, employer).disability).toBeNull();
    expect(serializeTalentForViewer(p, chatting).disability?.note).toBe("Uses a screen reader");
  });

  it("PUBLIC shows it to everyone; the owner also sees the visibility setting", () => {
    const p = { ...withDis, disabilityVisibility: "PUBLIC" };
    expect(serializeTalentForViewer(p, anon).disability?.cardVerified).toBe(true);
    expect(serializeTalentForViewer(p, anon).disability).not.toHaveProperty("visibility");
    expect(serializeTalentForViewer(p, owner).disability?.visibility).toBe("PUBLIC");
  });

  it("identity verification raises the badge to tier 3", () => {
    expect(serializeTalentForViewer({ ...base, identityVerifiedAt: new Date() }, anon).verifyTier).toBe(3);
    expect(serializeTalentForViewer({ ...base, verifyTier: 3 }, anon).verifyTier).toBeLessThanOrEqual(2);
  });
});
