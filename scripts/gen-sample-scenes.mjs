// Illustrated work scenes for sample posts/portfolio (fictional people, not photos).
// Replaces public/sample/work-1..10.svg. Run: node scripts/gen-sample-scenes.mjs
import fs from "fs";

const skins = ["#F3D3B8", "#E8B992", "#D19A6E", "#B57B52", "#8C5A3A", "#6A4029"];
const hairs = ["#1F1A17", "#3B2A20", "#5A3D2B", "#2B2B2B"];

function person({ x, y, s = 1, skin, hair, style = "short", top, glasses = false, headset = false }) {
  const hairBack = style === "long" ? `<path d="M-34 -6c0-30 15-46 34-46s34 16 34 46v54h-68z" fill="${hair}"/>` : style === "covered" ? `<path d="M-40 4c0-36 18-56 40-56s40 20 40 56v64h-80z" fill="#7A8F78"/>` : "";
  const hairFront = {
    short: `<path d="M-28 -12c2-22 13-32 28-32s26 10 28 32c-8-8-17-11-28-11s-20 3-28 11z" fill="${hair}"/>`,
    long: `<path d="M-30 -8c2-24 14-35 30-35s28 11 30 35c-9-10-19-14-30-14s-21 4-30 14z" fill="${hair}"/>`,
    bun: `<circle cx="0" cy="-48" r="11" fill="${hair}"/><path d="M-28 -12c2-22 13-32 28-32s26 10 28 32c-8-8-17-11-28-11s-20 3-28 11z" fill="${hair}"/>`,
    curly: `<g fill="${hair}">${[[-22,-26],[-11,-36],[0,-40],[11,-36],[22,-26],[-28,-14],[28,-14]].map(([a,b])=>`<circle cx="${a}" cy="${b}" r="10"/>`).join("")}</g>`,
    covered: `<path d="M-34 -2c0-24 15-40 34-40s34 16 34 40c-10-6-21-9-34-9s-24 3-34 9z" fill="#7A8F78"/>`,
  }[style];
  const specs = glasses ? `<g fill="none" stroke="#2A2A30" stroke-width="2.4"><circle cx="-11" cy="0" r="7"/><circle cx="11" cy="0" r="7"/><path d="M-4 0h8"/></g>` : "";
  const phones = headset ? `<path d="M-30 -2a30 30 0 0 1 60 0" fill="none" stroke="#2A2A30" stroke-width="4"/><rect x="-36" y="-6" width="10" height="18" rx="4" fill="#2A2A30"/><rect x="26" y="-6" width="10" height="18" rx="4" fill="#2A2A30"/><path d="M-30 10q4 18 20 20" fill="none" stroke="#2A2A30" stroke-width="3"/>` : "";
  return `<g transform="translate(${x} ${y}) scale(${s})">${hairBack}<path d="M-62 120c4-50 28-72 62-72s58 22 62 72z" fill="${top}"/><rect x="-10" y="28" width="20" height="24" rx="8" fill="${skin}"/><ellipse cx="0" cy="0" rx="28" ry="32" fill="${skin}"/>${hairFront}<g fill="#2A2A30"><circle cx="-10" cy="1" r="2.5"/><circle cx="10" cy="1" r="2.5"/></g><path d="M-8 16c5 4 11 4 16 0" stroke="#7A4A3A" stroke-width="2.4" fill="none" stroke-linecap="round"/>${specs}${phones}</g>`;
}
const plant = (x, y) => `<g transform="translate(${x} ${y})"><rect x="-18" y="0" width="36" height="40" rx="8" fill="#C9B9A6"/><path d="M0 0c-20-30-10-60 0-70c10 10 20 40 0 70z" fill="#7FA38A"/><path d="M0 2c-30-12-40-34-36-44c14 0 34 14 36 44z" fill="#93B79D"/><path d="M0 2c30-12 40-34 36-44c-14 0-34 14-36 44z" fill="#6E9579"/></g>`;
const laptop = (x, y, screen) => `<g transform="translate(${x} ${y})"><rect x="-150" y="-170" width="300" height="190" rx="14" fill="#2A2A30"/><rect x="-138" y="-158" width="276" height="166" rx="6" fill="#FFFFFF"/>${screen}<path d="M-180 20h360l-20 18h-320z" fill="#3A3A42"/></g>`;

const scenes = [
  // 1 chat support (headset)
  { bg: "#E9EEF2", p: { skin: skins[1], hair: hairs[0], style: "long", top: "#6E6A8F", headset: true }, screen: [0,1,2,3].map(k=>`<rect x="${k%2?-20:-124}" y="${-146+k*38}" width="140" height="26" rx="13" fill="${k%2?"#1E40AF":"#ECEBF3"}"/>`).join("") },
  // 2 packaging design
  { bg: "#F2ECE6", p: { skin: skins[2], hair: hairs[0], style: "short", top: "#5B6B7A" }, screen: `<rect x="-60" y="-146" width="120" height="140" rx="10" fill="#D9822B"/><rect x="-36" y="-110" width="72" height="44" rx="6" fill="#FFF1E0"/>` },
  // 3 poster
  { bg: "#F1EAEE", p: { skin: skins[0], hair: hairs[1], style: "bun", top: "#4F7C82" }, screen: `<rect x="-70" y="-150" width="140" height="150" fill="#2E0F1A"/><circle cx="0" cy="-90" r="40" fill="#C2416B"/><rect x="-46" y="-30" width="92" height="10" fill="#FDE8EC"/>` },
  // 4 data dashboard
  { bg: "#E5F0FB", p: { skin: skins[3], hair: hairs[2], style: "short", top: "#7A8F78", glasses: true }, screen: [0,1,2,3,4,5].map(k=>{const h=30+((k*41)%100);return `<rect x="${-110+k*38}" y="${-10-h}" width="24" height="${h}" rx="5" fill="${k===4?"#2D6CB5":"#A9CBEF"}"/>`}).join("") },
  // 5 video editing
  { bg: "#EEF2E3", p: { skin: skins[2], hair: hairs[0], style: "curly", top: "#8C6F7E" }, screen: `<rect x="-124" y="-148" width="248" height="100" rx="8" fill="#1E2410"/><path d="M-12 -114 L16 -98 L-12 -82Z" fill="#fff"/><rect x="-124" y="-38" width="248" height="10" rx="5" fill="#CBD8A6"/><rect x="-124" y="-38" width="100" height="10" rx="5" fill="#6A7F2A"/><rect x="-124" y="-20" width="70" height="12" rx="4" fill="#CBD8A6"/><rect x="-46" y="-20" width="110" height="12" rx="4" fill="#9FB46A"/>` },
  // 6 code / accessibility testing (screen reader)
  { bg: "#E8F6F6", p: { skin: skins[4], hair: hairs[0], style: "short", top: "#5B6B7A", headset: true }, screen: [0,1,2,3,4,5].map(k=>`<rect x="${-120+(k%3)*16}" y="${-146+k*24}" width="${80+((k*57)%140)}" height="12" rx="6" fill="${k%2?"#2A8A8A":"#A8DCDC"}"/>`).join("") },
  // 7 teaching (class)
  { bg: "#FFF1E0", p: { skin: skins[1], hair: hairs[3], style: "covered", top: "#A07A5E" }, screen: `<rect x="-124" y="-148" width="248" height="70" rx="8" fill="#FFF7EC"/>${[0,1,2,3].map(k=>`<circle cx="${-90+k*60}" cy="-40" r="20" fill="${["#F3D3B8","#B57B52","#E8B992","#8C5A3A"][k]}"/>`).join("")}` },
  // 8 accessibility audit checklist
  { bg: "#ECEBF3", p: { skin: skins[5], hair: hairs[0], style: "curly", top: "#4F7C82", glasses: true }, screen: [0,1,2,3].map(k=>`<rect x="-110" y="${-146+k*36}" width="220" height="26" rx="8" fill="#F5F4F7"/><circle cx="-94" cy="${-133+k*36}" r="7" fill="${k===1?"#DC2626":"#16A34A"}"/>`).join("") },
  // 9 online listing (shop)
  { bg: "#FDE8EC", p: { skin: skins[0], hair: hairs[0], style: "long", top: "#7A8F78" }, screen: [0,1,2].map(k=>`<rect x="${-120+k*82}" y="-146" width="72" height="120" rx="8" fill="#F5F4F7"/><rect x="${-112+k*82}" y="-138" width="56" height="56" rx="6" fill="#F4B3C2"/>`).join("") },
  // 10 woodworking / furniture
  { bg: "#F2ECE6", p: { skin: skins[3], hair: hairs[2], style: "short", top: "#6B7C5A" }, screen: `<rect x="-90" y="-100" width="180" height="22" rx="6" fill="#8A6747"/><rect x="-74" y="-78" width="12" height="80" fill="#8A6747"/><rect x="62" y="-78" width="12" height="80" fill="#8A6747"/>` },
];

scenes.forEach((sc, i) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="${sc.bg}"/><rect x="470" y="60" width="200" height="140" rx="12" fill="#FFFFFF" opacity=".6"/>${person({ x: 250, y: 236, s: 1.35, ...sc.p })}<rect x="0" y="420" width="800" height="180" fill="#D9CFC4"/><rect x="0" y="420" width="800" height="12" fill="#C9BCAE"/><path d="M300 330 q60 30 110 88" stroke="${sc.p.top}" stroke-width="28" fill="none" stroke-linecap="round"/><circle cx="414" cy="420" r="11" fill="${sc.p.skin}"/>${laptop(545, 418, sc.screen)}${plant(735, 380)}</svg>`;
  fs.writeFileSync(`public/sample/work-${i + 1}.svg`, svg);
});
console.log("wrote", scenes.length, "work scenes");
