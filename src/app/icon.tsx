import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** App icon generated from the logo mark (no binary assets in the repo). */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#6D28FF",
        borderRadius: 140,
      }}
    >
      <svg width="420" height="420" viewBox="0 0 32 32" fill="none">
        <path
          d="M9.5 24.5v-8a6.5 6.5 0 0 1 13 0v8"
          stroke="#FFFFFF"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <circle cx="16" cy="18.6" r="2.7" fill="#FFD9B8" />
        <path
          d="M13 24.4c.9-1.6 1.9-2.3 3-2.3s2.1.7 3 2.3"
          stroke="#FFD9B8"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </div>,
    size,
  );
}
