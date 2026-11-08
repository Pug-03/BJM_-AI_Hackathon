// Fictional illustrated avatars + calm covers for sample data (no real people, no photos).
// Run: node scripts/gen-sample-people.mjs
import fs from "fs";
fs.mkdirSync("public/sample", { recursive: true });

const skins = ["#F3D3B8", "#E8B992", "#D19A6E", "#B57B52", "#8C5A3A", "#6A4029"];
const hairs = ["#1F1A17", "#3B2A20", "#5A3D2B", "#2B2B2B", "#7A5B3E", "#B8B0A6"];
const tops = ["#5B6B7A", "#7A8F78", "#A07A5E", "#6E6A8F", "#4F7C82", "#8C6F7E", "#6B7C5A"];
const bgs = ["#E9EEF2", "#EEF0E8", "#F2ECE6", "#ECEBF3", "#E7F1F1", "#F1EAEE"];

// key, skin, hair, style, top, bg, glasses
const people = [
  ["mali", 1, 0, "long", 3, 0, true],
  ["kittipong", 2, 0, "short", 0, 1, false],
  ["ananya", 0, 1, "bun", 4, 2, false],
  ["somchai", 3, 5, "bald", 6, 3, true],
  ["nok", 2, 0, "bob", 5, 4, false],
  ["daniel", 4, 0, "curly", 1, 5, false],
  ["preeya", 1, 2, "long", 2, 1, false],
  ["wichai", 2, 3, "short", 4, 0, true],
  ["linmei", 0, 0, "bob", 3, 3, false],
  ["arthit", 3, 1, "short", 6, 2, false],
  ["siriporn", 2, 0, "covered", 5, 4, false],
  ["maya", 5, 0, "curly", 0, 5, true],
  ["judge-talent", 1, 0, "long", 4, 0, false],
];

function avatar([, s, h, style, top, bg, glasses]) {
  const skin = skins[s], hair = hairs[h], shirt = tops[top], back = bgs[bg];
  const hairBack = {
    long: `<path d="M58 70c0-28 18-44 42-44s42 16 42 44v62H58z" fill="${hair}"/>`,
    bob: `<path d="M60 72c0-27 17-42 40-42s40 15 40 42v34H60z" fill="${hair}"/>`,
    covered: `<path d="M52 86c0-34 20-54 48-54s48 20 48 54v60H52z" fill="${tops[(top + 3) % tops.length]}"/>`,
  }[style] ?? "";
  const hairFront = {
    short: `<path d="M70 66c2-20 15-30 30-30s28 10 30 30c-8-8-18-11-30-11s-22 3-30 11z" fill="${hair}"/>`,
    long: `<path d="M68 70c2-22 15-33 32-33s30 11 32 33c-10-10-20-14-32-14s-22 4-32 14z" fill="${hair}"/>`,
    bun: `<circle cx="100" cy="32" r="12" fill="${hair}"/><path d="M70 66c2-20 15-30 30-30s28 10 30 30c-8-8-18-11-30-11s-22 3-30 11z" fill="${hair}"/>`,
    bob: `<path d="M68 70c2-22 15-33 32-33s30 11 32 33c-10-10-20-14-32-14s-22 4-32 14z" fill="${hair}"/>`,
    curly: `<g fill="${hair}">${[[76,52],[88,42],[100,38],[112,42],[124,52],[70,64],[130,64]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="11"/>`).join("")}</g>`,
    bald: "",
    covered: `<path d="M64 74c0-24 16-40 36-40s36 16 36 40c-10-6-22-9-36-9s-26 3-36 9z" fill="${tops[(top + 3) % tops.length]}"/>`,
  }[style];
  const specs = glasses
    ? `<g fill="none" stroke="#2A2A30" stroke-width="2.4"><circle cx="88" cy="80" r="8"/><circle cx="112" cy="80" r="8"/><path d="M96 80h8"/></g>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="28 18 144 144"><rect x="0" y="0" width="200" height="200" fill="${back}"/>${hairBack}<path d="M40 200c4-34 28-52 60-52s56 18 60 52z" fill="${shirt}"/><rect x="90" y="112" width="20" height="26" rx="8" fill="${skin}"/><ellipse cx="100" cy="80" rx="30" ry="34" fill="${skin}"/>${hairFront}<g fill="#2A2A30"><circle cx="88" cy="81" r="2.6"/><circle cx="112" cy="81" r="2.6"/></g><path d="M91 97c5 4 13 4 18 0" stroke="#7A4A3A" stroke-width="2.4" fill="none" stroke-linecap="round"/>${specs}</svg>`;
}
for (const p of people) fs.writeFileSync(`public/sample/avatar-${p[0]}.svg`, avatar(p));

// Calm covers: one neutral ground, one muted tone, quiet geometry (no repeated blobs).
const tones = [["#EEF1F4", "#C9D3DC"], ["#F0F1EC", "#CFD6C2"], ["#F3EFEA", "#DCCDBE"], ["#EFEEF4", "#D2CFE0"], ["#EEF3F3", "#C4DADA"], ["#F3EEF0", "#DCC8D0"], ["#F1F0EC", "#D8D3C4"], ["#EDF0F3", "#C8D1DB"]];
const patterns = [
  (b) => Array.from({ length: 9 }, (_, i) => `<path d="M${-200 + i * 220} 500 L${100 + i * 220} 0" stroke="${b}" stroke-width="46" opacity=".55"/>`).join(""),
  (b) => Array.from({ length: 6 }, (_, i) => `<circle cx="1350" cy="560" r="${120 + i * 110}" fill="none" stroke="${b}" stroke-width="22" opacity=".6"/>`).join(""),
  (b) => Array.from({ length: 12 * 4 }, (_, i) => `<circle cx="${1000 + (i % 12) * 50}" cy="${120 + Math.floor(i / 12) * 60}" r="7" fill="${b}"/>`).join(""),
  (b) => `<path d="M0 330 C300 250 520 420 820 330 S1300 240 1600 320 V500 H0z" fill="${b}" opacity=".7"/><path d="M0 400 C340 340 560 470 860 400 S1320 330 1600 390 V500 H0z" fill="${b}"/>`,
  (b) => Array.from({ length: 5 }, (_, i) => `<rect x="${980 + i * 110}" y="${200 - i * 30}" width="80" height="${300 + i * 30}" rx="40" fill="${b}" opacity="${0.4 + i * 0.12}"/>`).join(""),
  (b) => Array.from({ length: 4 }, (_, i) => `<circle cx="${250}" cy="${-60}" r="${200 + i * 120}" fill="none" stroke="${b}" stroke-width="30" opacity=".55"/>`).join(""),
  (b) => Array.from({ length: 7 }, (_, i) => `<rect x="${i * 240 - 40}" y="${i % 2 ? 300 : 240}" width="200" height="300" rx="24" fill="${b}" opacity=".55"/>`).join(""),
  (b) => Array.from({ length: 10 }, (_, i) => `<path d="M${900 + i * 70} 500 Q${1000 + i * 70} 250 ${900 + i * 70} 0" stroke="${b}" stroke-width="10" fill="none" opacity=".7"/>`).join(""),
];
tones.forEach(([a, b], i) =>
  fs.writeFileSync(`public/sample/cover-${i + 1}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 500" preserveAspectRatio="xMidYMid slice"><rect width="1600" height="500" fill="${a}"/>${patterns[i](b)}</svg>`),
);
console.log("wrote", people.length, "avatars and 8 covers");
