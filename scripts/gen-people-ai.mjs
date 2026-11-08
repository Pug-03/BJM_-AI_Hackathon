// Generates photorealistic headshots of FICTIONAL people (AI-generated, not real persons)
// for the sample profiles, into public/sample/people/<key>.webp.
//
// Run (your key stays on your machine):
//   OPENAI_API_KEY=sk-... node scripts/gen-people-ai.mjs          # only missing photos
//   OPENAI_API_KEY=sk-... node scripts/gen-people-ai.mjs --force  # regenerate all
// Then: pnpm db:seed   (profiles switch from illustrations to these photos)
import fs from "node:fs";
import OpenAI from "openai";

const people = [
  ["mali", "a Thai woman, about 30, long straight black hair, thin glasses, warm smile, wearing a plain lavender blouse"],
  ["kittipong", "a Thai man, early 30s, short black hair, friendly smile, wearing a grey crew-neck T-shirt"],
  ["ananya", "a Thai woman, about 28, black hair in a neat bun, confident smile, wearing a teal shirt"],
  ["somchai", "a Thai man, mid 50s, bald, rimless glasses, kind smile, wearing an olive polo shirt"],
  ["nok", "a Thai woman, about 26, chin-length bob haircut, cheerful smile, wearing a mauve top"],
  ["daniel", "a Nigerian man, early 30s, short curly black hair, relaxed smile, wearing a sage green shirt"],
  ["preeya", "a Thai woman, late 30s, long brown hair, gentle smile, wearing a beige cardigan"],
  ["wichai", "a Thai man, mid 30s, short hair, round glasses, calm smile, wearing a blue-grey shirt"],
  ["linmei", "a Chinese-Thai woman, mid 30s, black bob haircut, polite smile, wearing a dark violet blouse"],
  ["arthit", "a Thai man, about 40, short dark hair, light stubble, warm smile, wearing a green work shirt"],
  ["siriporn", "a Thai Muslim woman, mid 30s, wearing a soft sage hijab, bright smile, wearing a rose cardigan"],
  ["maya", "a woman of mixed Indian and Portuguese descent, about 30, curly dark hair, glasses, wide smile, wearing a slate blue top"],
  ["judge-talent", "a Thai woman, about 28, long black hair, friendly smile, wearing a teal blouse"],
];

const style =
  "Professional head-and-shoulders portrait photo for a job profile. Soft natural window light, plain light grey studio background, shallow depth of field, looking at the camera, realistic skin, 50mm lens. A fictional person, not a celebrity. No text, no logo, no watermark.";

if (!process.env.OPENAI_API_KEY) {
  console.error("Set OPENAI_API_KEY first, e.g. OPENAI_API_KEY=sk-... node scripts/gen-people-ai.mjs");
  process.exit(1);
}
const force = process.argv.includes("--force");
const openai = new OpenAI();
fs.mkdirSync("public/sample/people", { recursive: true });

for (const [key, who] of people) {
  const out = `public/sample/people/${key}.webp`;
  if (!force && fs.existsSync(out)) {
    console.log("skip", key);
    continue;
  }
  process.stdout.write(`generating ${key}… `);
  try {
    const r = await openai.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt: `${style} Subject: ${who}.`,
      size: "1024x1024",
      quality: "medium",
      output_format: "webp",
      output_compression: 82,
      n: 1,
    });
    const b64 = r.data?.[0]?.b64_json;
    if (!b64) throw new Error("no image returned");
    fs.writeFileSync(out, Buffer.from(b64, "base64"));
    console.log("ok");
  } catch (e) {
    console.log("failed:", e instanceof Error ? e.message : e);
  }
}
console.log("\nDone. Now run: pnpm db:seed  (then restart the app)");
