/**
 * Privacy rules for talent profiles (principles 3–4, section 9).
 * Pure functions so the rules are unit-tested: private fields — date of birth,
 * gender, "work setup I need", hidden contacts — never leave the server for
 * viewers who aren't allowed to see them.
 */
import { ageFromDob } from "./utils";

export type VisibilityT = "PUBLIC" | "CHAT_ONLY" | "HIDDEN";

export interface ViewerContext {
  /** Signed-in viewer's user id, or null for logged-out visitors. */
  userId: string | null;
  isSandbox: boolean;
  isAdmin?: boolean;
  /** Viewer has a conversation with this talent (unblocked). */
  inConversation: boolean;
  /** Talent explicitly shared their work-setup note with this viewer. */
  setupShared: boolean;
}

export interface RawContact {
  id: string;
  kind: string;
  value: string;
  visibility: VisibilityT;
}

export interface RawTalentProfile {
  id: string;
  userId: string;
  handle: string;
  displayName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  coverOffsetY: number;
  headline: string | null;
  bio: string | null;
  dob: Date | null;
  showAge: boolean;
  gender: string | null;
  country: string;
  province: string | null;
  languages: string[];
  workMode: string;
  availability: string[];
  specialTalents: string | null;
  workSetupNeeds: string | null;
  disabilityTypes?: string[];
  disabilityNote?: string | null;
  disabilityVisibility?: string;
  identityVerifiedAt?: Date | null;
  disabilityCardVerifiedAt?: Date | null;
  isPublic: boolean;
  isSample: boolean;
  verifyTier: number;
  ratingAvg: number;
  ratingCount: number;
  completedJobs: number;
  rehires: number;
  responseMins: number | null;
  contacts: RawContact[];
  user: { isSandbox: boolean };
}

export function isOwner(p: { userId: string }, v: ViewerContext) {
  return v.userId !== null && v.userId === p.userId;
}

/** Can this viewer see the profile at all? */
export function canViewProfile(
  p: Pick<RawTalentProfile, "userId" | "isPublic" | "user">,
  v: ViewerContext,
): boolean {
  if (isOwner(p, v) || v.isAdmin) return true;
  // Judge sandboxes are invisible to real users.
  if (p.user.isSandbox && !v.isSandbox) return false;
  if (!p.isPublic) return v.inConversation;
  return true;
}

export function canSeeContact(
  c: Pick<RawContact, "visibility">,
  p: { userId: string },
  v: ViewerContext,
): boolean {
  if (isOwner(p, v)) return true;
  if (c.visibility === "PUBLIC") return true;
  if (c.visibility === "CHAT_ONLY") return v.inConversation;
  return false;
}

/** Disability info is sensitive (PDPA s.26): shown only as the talent chose. */
export function canSeeDisability(
  p: Pick<RawTalentProfile, "userId" | "disabilityVisibility">,
  v: ViewerContext,
): boolean {
  if (isOwner(p, v) || v.isAdmin) return true;
  if (p.disabilityVisibility === "PUBLIC") return true;
  if (p.disabilityVisibility === "CHAT_ONLY") return v.inConversation;
  return false;
}

/** The profile as this viewer may see it. Private fields are removed, not just hidden in UI. */
export function serializeTalentForViewer(p: RawTalentProfile, v: ViewerContext, now = new Date()) {
  const owner = isOwner(p, v);
  return {
    id: p.id,
    userId: p.userId,
    handle: p.handle,
    displayName: p.displayName,
    firstName: p.firstName,
    lastName: p.lastName,
    avatarUrl: p.avatarUrl,
    coverUrl: p.coverUrl,
    coverOffsetY: p.coverOffsetY,
    headline: p.headline,
    bio: p.bio,
    age: p.dob && (p.showAge || owner) ? ageFromDob(p.dob, now) : null,
    showAge: p.showAge,
    country: p.country,
    province: p.province,
    languages: p.languages,
    workMode: p.workMode,
    availability: p.availability,
    specialTalents: p.specialTalents,
    isPublic: p.isPublic,
    isSample: p.isSample,
    // Tier 3 = identity verified by an admin (ID card + selfie, documents deleted after review).
    verifyTier: p.identityVerifiedAt ? 3 : Math.min(p.verifyTier, 2),
    identityVerified: Boolean(p.identityVerifiedAt),
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    completedJobs: p.completedJobs,
    rehires: p.rehires,
    responseMins: p.responseMins,
    contacts: p.contacts
      .filter((c) => canSeeContact(c, p, v))
      .map((c) => ({
        id: c.id,
        kind: c.kind,
        value: c.value,
        ...(owner ? { visibility: c.visibility } : {}),
      })),
    // Owner-only private fields.
    private: owner
      ? {
          dob: p.dob ? p.dob.toISOString().slice(0, 10) : null,
          gender: p.gender,
          workSetupNeeds: p.workSetupNeeds,
        }
      : null,
    // Shared only when the talent chose to share it with this employer.
    sharedWorkSetup: !owner && v.setupShared ? p.workSetupNeeds : null,
    disability: canSeeDisability(p, v)
      ? {
          types: p.disabilityTypes ?? [],
          note: p.disabilityNote ?? null,
          cardVerified: Boolean(p.disabilityCardVerifiedAt),
          ...(owner ? { visibility: p.disabilityVisibility ?? "HIDDEN" } : {}),
        }
      : null,
    isOwner: owner,
  };
}

export type TalentView = ReturnType<typeof serializeTalentForViewer>;

/** Keys that must never appear in a non-owner payload. */
export const PRIVATE_TALENT_KEYS = [
  "dob",
  "gender",
  "workSetupNeeds",
  "registrationNo",
  "disabilityTypes",
  "disabilityNote",
] as const;
