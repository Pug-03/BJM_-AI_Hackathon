// Finds translation keys used in components that are missing from messages/en.json.
// Usage: node scripts/check-i18n.mjs [files...]  (defaults to all of src/)
import fs from "node:fs";
import path from "node:path";
const en = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));
const has = (key) => key.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), en) !== undefined;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(d, e.name)] : []));
const files = process.argv.slice(2).length ? process.argv.slice(2) : walk("src");
let missing = 0;
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  const vars = {};
  for (const m of src.matchAll(/(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(?:"([\w.]+)"|\{[^}]*namespace:\s*"([\w.]+)"[^}]*\})\s*\)/g))
    vars[m[1]] = m[2] ?? m[3];
  for (const [v, ns] of Object.entries(vars)) {
    const re = new RegExp(`\\b${v}(?:\\.rich)?\\(\\s*"([\\w.]+)"`, "g");
    for (const m of src.matchAll(re)) {
      const key = `${ns}.${m[1]}`;
      if (!has(key)) {
        missing++;
        console.log(`${f}: ${key}`);
      }
    }
  }
}
process.exit(missing ? 1 : 0);
