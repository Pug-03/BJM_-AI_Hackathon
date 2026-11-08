/** Routes covered by the QA loop. `stage` = the stage that last touched the page. */
export interface QaRoute {
  path: string;
  stage: number;
  name: string;
  /** Requires a signed-in session (set up by the judge-mode helper from Stage 3). */
  auth?: "new" | "judge-talent" | "judge-employer" | "talent" | "employer";
}

export const routes: QaRoute[] = [
  { path: "/", stage: 1, name: "landing" },
  { path: "/explore", stage: 6, name: "explore" },
  { path: "/styleguide", stage: 1, name: "styleguide" },
  { path: "/login", stage: 2, name: "login" },
  { path: "/welcome", stage: 2, name: "welcome", auth: "new" },
  { path: "/judge", stage: 3, name: "judge" },
  { path: "/feed", stage: 6, name: "feed-talent", auth: "judge-talent" },
  { path: "/u/kittipong-design", stage: 4, name: "profile-public" },
  { path: "/me", stage: 5, name: "profile-me", auth: "judge-talent" },
  { path: "/onboarding/talent", stage: 5, name: "onboarding-talent", auth: "judge-talent" },
  { path: "/feed", stage: 6, name: "feed-employer", auth: "judge-employer" },
  { path: "/needs", stage: 6, name: "needs", auth: "judge-employer" },
  { path: "/saved", stage: 6, name: "saved-employer", auth: "judge-employer" },
  { path: "/o/pims-bakery", stage: 6, name: "org-public" },
  { path: "/onboarding/employer", stage: 6, name: "onboarding-employer", auth: "judge-employer" },
];

export const viewports = [
  { name: "320x568", width: 320, height: 568 },
  { name: "375x667", width: 375, height: 667 },
  { name: "390x844", width: 390, height: 844 },
  { name: "393x852", width: 393, height: 852 },
  { name: "430x932", width: 430, height: 932 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "820x1180", width: 820, height: 1180 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1024x1366", width: 1024, height: 1366 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
] as const;

export const locales = ["en", "th"] as const;
export const themes = ["light", "dark"] as const;
