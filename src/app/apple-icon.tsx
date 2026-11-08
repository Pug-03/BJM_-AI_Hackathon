import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** App icon generated from the logo mark (no binary assets in the repo). */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0F0E12",
        borderRadius: 0,
      }}
    >
      <svg width="128" height="128" viewBox="0 0 32 32" fill="none">
        <path
          d="M9.5 22.5 16 9l6.5 13.5"
          stroke="#FFFFFF"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="19.4" r="2.2" fill="#7C4DFF" />
      </svg>
    </div>,
    size,
  );
}
