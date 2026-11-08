import { describe, expect, it } from "vitest";
import { cleanText, offerSchema, sendSchema } from "@/lib/schemas/message";

describe("message schemas", () => {
  it("strips control characters and rejects empty text", () => {
    expect(cleanText("hi\u0007 there\n")).toBe("hi there");
    expect(sendSchema.safeParse({ kind: "TEXT", text: "  \u0000 " }).success).toBe(false);
  });

  it("only accepts chat-bucket attachment refs", () => {
    const ok = sendSchema.safeParse({
      kind: "FILE",
      attachments: [{ url: "local://chat/c1/a.pdf", type: "application/pdf" }],
    });
    expect(ok.success).toBe(true);
    const bad = sendSchema.safeParse({
      kind: "FILE",
      attachments: [{ url: "https://evil.example/x.pdf", type: "application/pdf" }],
    });
    expect(bad.success).toBe(false);
    const other = sendSchema.safeParse({
      kind: "FILE",
      attachments: [{ url: "local://certificates/u/x.pdf", type: "application/pdf" }],
    });
    expect(other.success).toBe(false);
  });

  it("offers need a role and a positive amount, and have no per-person rate field", () => {
    expect(
      offerSchema.safeParse({ role: "Designer", pay: 0, currency: "THB", period: "MONTH" }).success,
    ).toBe(false);
    expect(
      offerSchema.safeParse({ role: "Designer", pay: 25000, currency: "THB", period: "MONTH" }).success,
    ).toBe(true);
    expect(Object.keys(offerSchema.shape)).not.toContain("suggestedPay");
  });
});
