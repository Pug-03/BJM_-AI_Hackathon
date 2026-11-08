import { describe, expect, it } from "vitest";
import {
  WEIGHTS,
  agePenalty,
  lexicalSimilarity,
  matchedSkills,
  scoreMatch,
  skillOverlap,
  workFit,
  type NeedFacts,
  type TalentFacts,
} from "@/lib/match";

const talent: TalentFacts = {
  skills: ["Customer support", "Microsoft Excel", "Live chat"],
  workMode: "REMOTE",
  province: "Chiang Mai",
  hasPhoto: true,
  headline: "Support specialist",
  bio: "I help customers.",
  educationCount: 1,
  proofCount: 1,
  shownAge: null,
};
const need: NeedFacts = {
  skills: ["Live chat", "Excel", "Zendesk"],
  workMode: "REMOTE",
  location: "Bangkok",
  ageMin: null,
  ageMax: null,
};

describe("matching", () => {
  it("weights add up to 1", () => {
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it("finds fuzzy whole-word skill matches", () => {
    expect(matchedSkills(talent.skills, need.skills)).toEqual(["Live chat", "Excel"]);
    expect(matchedSkills(["Excellent"], ["Excel"])).toEqual([]);
    expect(skillOverlap(talent.skills, need.skills)).toBeCloseTo(2 / 4);
  });

  it("remote jobs ignore location; on-site jobs prefer the same province", () => {
    expect(workFit(talent, need)).toBe(1);
    expect(
      workFit({ workMode: "ONSITE", province: "Bangkok" }, { workMode: "ONSITE", location: "Bangkok" }),
    ).toBe(1);
    expect(
      workFit({ workMode: "ONSITE", province: "Phuket" }, { workMode: "ONSITE", location: "Bangkok" }),
    ).toBeLessThan(0.5);
  });

  it("combines parts with the documented weights", () => {
    const { score, parts } = scoreMatch(talent, need, 0.5, "lexical");
    expect(parts.raw).toBeCloseTo(0.55 * 0.5 + 0.25 * 0.5 + 0.1 * 1 + 0.1 * 1, 3);
    expect(score).toBe(parts.raw);
  });

  it("age preference never applies to talent who hide their age, and never removes anyone", () => {
    const n = { ...need, ageMin: 25, ageMax: 35 };
    expect(agePenalty({ shownAge: null }, n)).toBe(0);
    expect(agePenalty({ shownAge: 30 }, n)).toBe(0);
    const outside = scoreMatch({ ...talent, shownAge: 50 }, n, 0.5, "lexical");
    expect(outside.parts.agePenalty).toBeGreaterThan(0);
    expect(outside.parts.agePenalty).toBeLessThanOrEqual(0.05);
    expect(outside.score).toBeGreaterThan(0);
  });

  it("lexical similarity works for Thai and English", () => {
    expect(lexicalSimilarity("ฝ่ายบริการลูกค้า", "บริการลูกค้าออนไลน์")).toBeGreaterThan(0.3);
    expect(lexicalSimilarity("data analyst", "customer support")).toBeLessThan(
      lexicalSimilarity("data analyst", "data analysis"),
    );
  });

  it("has no inputs about disability, gender, religion or ethnicity", () => {
    const keys = [...Object.keys(talent), ...Object.keys(need)].join(" ");
    expect(keys).not.toMatch(/disab|gender|relig|ethnic|race|setup/i);
  });
});
