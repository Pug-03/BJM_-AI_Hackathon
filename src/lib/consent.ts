export const CONSENT_VERSION = "2026-11-01";

export const consentKinds = ["TERMS_PRIVACY", "AI_PROCESSING", "WORK_SETUP", "EMAIL_NOTIFICATIONS"] as const;
export type ConsentKind = (typeof consentKinds)[number];
