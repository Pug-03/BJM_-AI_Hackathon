import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ABLE talent profile";

// The OG renderer's built-in font has Latin glyphs only; non-Latin text falls back to a neutral line.
const latin = (s: string | null | undefined) => (s && /^[\x20-\x7E–—À-ɏ]+$/.test(s) ? s : null);

/** Per-profile Open Graph image (Stage 10). Only public, non-sandbox profiles; never private fields. */
export default async function OgImage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const p = await db.talentProfile
    .findUnique({
      where: { handle },
      select: {
        displayName: true,
        headline: true,
        isPublic: true,
        user: { select: { isSandbox: true } },
        skills: { select: { name: true }, take: 4 },
      },
    })
    .catch(() => null);
  const visible = p && p.isPublic && !p.user.isSandbox;
  const name = (visible && latin(p.displayName)) || "Talent on ABLE";
  const headline = (visible && latin(p.headline)) || "Work that fits you.";
  const skills = visible
    ? p.skills
        .map((s) => latin(s.name))
        .filter(Boolean)
        .slice(0, 4)
    : [];
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#FFFFFF",
        color: "#0F0E12",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 700 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "#0F0E12",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: 999, background: "#7C4DFF" }} />
        </div>
        ABLE
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2 }}>{name}</div>
        <div style={{ fontSize: 38, color: "#55525F" }}>{headline}</div>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          {skills.map((s) => (
            <div
              key={s!}
              style={{ fontSize: 26, padding: "10px 22px", borderRadius: 999, background: "#F3F2F5" }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>,
    size,
  );
}
