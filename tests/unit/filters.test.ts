import { describe, expect, it } from "vitest";
import { suggestHandle, talentFilterSchema } from "@/lib/schemas/talent";

describe("talent filters — no discrimination (principle 1)", () => {
  for (const key of ["disability", "disabilityType", "gender", "religion", "ethnicity", "race", "age"]) {
    it(`rejects a '${key}' filter`, () => {
      expect(talentFilterSchema.safeParse({ [key]: "x" }).success).toBe(false);
    });
  }
  it("accepts allowed filters", () => {
    expect(
      talentFilterSchema.safeParse({ skills: ["Excel"], workMode: "REMOTE", hasCertificates: true }).success,
    ).toBe(true);
  });
});

describe("suggestHandle", () => {
  it("slugs Latin names", () => expect(suggestHandle("Mali", "Srisuk")).toBe("mali-srisuk"));
  it("falls back for Thai-only names", () =>
    expect(suggestHandle("มะลิ", "ศรีสุข")).toMatch(/^talent-[a-z0-9]{6}$/));
});
