import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import th from "../../messages/th.json";

type Tree = { [k: string]: string | Tree };
const keys = (o: Tree, p = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? keys(v, `${p}${k}.`) : [`${p}${k}`]));

describe("i18n messages", () => {
  it("EN and TH have exactly the same keys", () => {
    const a = keys(en as Tree).sort();
    const b = keys(th as Tree).sort();
    expect(b.filter((k) => !a.includes(k))).toEqual([]);
    expect(a.filter((k) => !b.includes(k))).toEqual([]);
  });

  it("never uses 'normal people' wording", () => {
    const all = JSON.stringify(en).toLowerCase();
    expect(all).not.toMatch(/normal (people|person)/);
    expect(JSON.stringify(th)).not.toMatch(/คนปกติ/);
  });

  it("has no empty strings", () => {
    const empty = (o: Tree, p = ""): string[] =>
      Object.entries(o).flatMap(([k, v]) =>
        typeof v === "object" ? empty(v, `${p}${k}.`) : v.trim() ? [] : [`${p}${k}`],
      );
    expect(empty(en as Tree)).toEqual([]);
    expect(empty(th as Tree)).toEqual([]);
  });
});
