// Generates fictional, abstract sample artwork (covers, work images, certificates)
// into public/sample/. No real logos, photos or organizations are depicted.
import fs from "fs";
fs.mkdirSync("public/sample", { recursive: true });

const palettes = [
  ["#EDE7FF", "#C9B8FF", "#6D28FF", "#17151C"],
  ["#E6F4EA", "#A7D7B5", "#2F7D4F", "#14281C"],
  ["#FFF1E0", "#FFD1A1", "#D9822B", "#2B1A0A"],
  ["#E5F0FB", "#A9CBEF", "#2D6CB5", "#0E1E33"],
  ["#FDE8EC", "#F4B3C2", "#C2416B", "#2E0F1A"],
  ["#EEF2E3", "#CBD8A6", "#6A7F2A", "#1E2410"],
  ["#F2ECE6", "#D9C7B5", "#8A6747", "#271C12"],
  ["#E8F6F6", "#A8DCDC", "#2A8A8A", "#0E2626"],
];

function rng(seed) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

// Covers 16:5 — soft layered shapes.
for (let i = 1; i <= 8; i++) {
  const [a, b, c] = palettes[i - 1];
  const r = rng(i);
  const shapes = Array.from({ length: 6 }, (_, k) => {
    const cx = Math.round(r() * 1600), cy = Math.round(r() * 500), rad = Math.round(120 + r() * 260);
    const fill = [b, c, a][k % 3];
    const op = (0.25 + r() * 0.5).toFixed(2);
    return `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${fill}" opacity="${op}"/>`;
  }).join("");
  fs.writeFileSync(`public/sample/cover-${i}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 500" preserveAspectRatio="xMidYMid slice"><rect width="1600" height="500" fill="${a}"/>${shapes}</svg>`);
}

// Work images 4:3 — stylised "work sample" compositions.
const kinds = ["chat", "pack", "poster", "chart", "video", "code", "class", "audit", "listing", "wood", "copy"];
for (let i = 1; i <= 10; i++) {
  const [a, b, c, d] = palettes[(i - 1) % 8];
  const kind = kinds[i - 1];
  let body = "";
  if (kind === "chat") body = [0, 1, 2, 3].map((k) => `<rect x="${k % 2 ? 360 : 120}" y="${110 + k * 110}" width="320" height="70" rx="35" fill="${k % 2 ? c : "#fff"}"/>`).join("");
  else if (kind === "pack") body = `<rect x="260" y="120" width="280" height="380" rx="24" fill="${c}"/><rect x="300" y="200" width="200" height="120" rx="12" fill="${a}"/><circle cx="400" cy="420" r="40" fill="${b}"/>`;
  else if (kind === "poster") body = `<rect x="200" y="80" width="400" height="440" fill="${d}"/><circle cx="400" cy="260" r="120" fill="${c}"/><rect x="250" y="430" width="300" height="24" fill="${a}"/>`;
  else if (kind === "chart") body = [0, 1, 2, 3, 4, 5].map((k) => { const h = 80 + ((k * 53) % 260); return `<rect x="${150 + k * 90}" y="${480 - h}" width="56" height="${h}" rx="10" fill="${k === 4 ? c : b}"/>`; }).join("");
  else if (kind === "video") body = `<rect x="120" y="110" width="560" height="320" rx="20" fill="${d}"/><path d="M370 220 L460 270 L370 320 Z" fill="#fff"/><rect x="160" y="460" width="480" height="14" rx="7" fill="${b}"/><rect x="160" y="460" width="200" height="14" rx="7" fill="${c}"/>`;
  else if (kind === "code") body = [0, 1, 2, 3, 4, 5, 6].map((k) => `<rect x="${140 + (k % 3) * 40}" y="${130 + k * 50}" width="${200 + ((k * 77) % 260)}" height="20" rx="10" fill="${k % 2 ? c : b}"/>`).join("");
  else if (kind === "class") body = [0, 1, 2, 3, 4].map((k) => `<circle cx="${180 + k * 110}" cy="380" r="44" fill="${k === 2 ? c : b}"/>`).join("") + `<rect x="250" y="120" width="300" height="160" rx="16" fill="#fff"/>`;
  else if (kind === "audit") body = [0, 1, 2, 3].map((k) => `<rect x="160" y="${140 + k * 90}" width="480" height="60" rx="14" fill="#fff"/><circle cx="200" cy="${170 + k * 90}" r="16" fill="${k === 1 ? "#DC2626" : c}"/>`).join("");
  else if (kind === "listing") body = [0, 1, 2].map((k) => `<rect x="${110 + k * 200}" y="160" width="170" height="260" rx="18" fill="#fff"/><rect x="${125 + k * 200}" y="175" width="140" height="140" rx="12" fill="${b}"/>`).join("");
  else if (kind === "wood") body = `<rect x="250" y="220" width="300" height="40" rx="10" fill="${c}"/><rect x="280" y="260" width="24" height="220" fill="${c}"/><rect x="496" y="260" width="24" height="220" fill="${c}"/>`;
  else body = `<rect x="160" y="150" width="480" height="300" rx="20" fill="#fff"/>` + [0, 1, 2].map((k) => `<rect x="200" y="${200 + k * 60}" width="${360 - k * 80}" height="22" rx="11" fill="${k ? b : c}"/>`).join("");
  fs.writeFileSync(`public/sample/work-${i}.svg`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="${a}"/>${body}</svg>`);
}

// Certificate placeholder (clearly labelled sample).
fs.writeFileSync("public/sample/certificate.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 566"><rect width="800" height="566" fill="#FBFAFD"/><rect x="24" y="24" width="752" height="518" fill="none" stroke="#C9B8FF" stroke-width="4"/><text x="400" y="190" text-anchor="middle" font-family="system-ui,sans-serif" font-size="40" font-weight="600" fill="#17151C">Certificate</text><text x="400" y="250" text-anchor="middle" font-family="system-ui,sans-serif" font-size="22" fill="#5C5866">Sample document for demo purposes</text><circle cx="400" cy="380" r="48" fill="#F0EAFF"/><path d="M380 380 l14 14 l28 -28" stroke="#6D28FF" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
console.log("sample art written");

// Neutral hero covers (light + dark) — the hero keeps violet for the mic only.
const neutral = (bg, a, b, c) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 500" preserveAspectRatio="xMidYMid slice"><rect width="1600" height="500" fill="${bg}"/><circle cx="260" cy="520" r="360" fill="${a}"/><circle cx="1180" cy="-40" r="300" fill="${b}"/><circle cx="1500" cy="420" r="200" fill="${c}"/><rect x="560" y="180" width="420" height="22" rx="11" fill="${b}" opacity=".7"/><rect x="560" y="226" width="300" height="22" rx="11" fill="${a}" opacity=".9"/></svg>`;
fs.writeFileSync("public/sample/cover-neutral.svg", neutral("#F5F4F7", "#ECEBF0", "#E4E2EA", "#DCD9E3"));
fs.writeFileSync("public/sample/cover-neutral-dark.svg", neutral("#18171C", "#232129", "#2E2C35", "#1E1D23"));
console.log("neutral covers written");
