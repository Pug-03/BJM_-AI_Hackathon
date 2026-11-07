import { describe, expect, it } from "vitest";
import { ageFromDob, initials } from "@/lib/utils";

describe("utils", () => {
  it("initials", () => {
    expect(initials("Mali Srisuk")).toBe("MS");
    expect(initials("มะลิ")).toBe("ม");
    expect(initials("")).toBe("?");
    expect(initials(null)).toBe("?");
  });
  it("ageFromDob handles birthdays not yet reached", () => {
    const now = new Date("2026-06-15");
    expect(ageFromDob(new Date("2000-06-15"), now)).toBe(26);
    expect(ageFromDob(new Date("2000-06-16"), now)).toBe(25);
  });
});
