import { describe, expect, it } from "vitest";
import { levyEstimate, quotaGap, requiredHires } from "@/lib/quota";

describe("Section 33 calculator", () => {
  it.each([
    [99, 0],
    [100, 1],
    [150, 1],
    [151, 2],
    [250, 2],
    [251, 3],
    [320, 3],
  ])("requiredHires(%i) = %i", (n, want) => expect(requiredHires(n)).toBe(want));

  it("gap is never negative", () => {
    expect(quotaGap(320, 1)).toEqual({ required: 3, gap: 2 });
    expect(quotaGap(320, 5)).toEqual({ required: 3, gap: 0 });
  });

  it("levy needs a configured amount", () => {
    expect(levyEstimate(2, null)).toBeNull();
    expect(levyEstimate(2, 1000)).toBe(2000);
  });
});
