/** Routes covered by the QA loop. `stage` = the stage that last touched the page. */
export interface QaRoute {
  path: string;
  stage: number;
  name: string;
  /** Requires a signed-in session (set up by the judge-mode helper from Stage 3). */
  auth?: "new" | "talent" | "employer";
}

export const routes: QaRoute[] = [
  { path: "/", stage: 1, name: "landing" },
  { path: "/explore", stage: 1, name: "explore" },
  { path: "/styleguide", stage: 1, name: "styleguide" },
  { path: "/login", stage: 2, name: "login" },
  { path: "/welcome", stage: 2, name: "welcome", auth: "new" },
  { path: "/judge", stage: 3, name: "judge" },
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
