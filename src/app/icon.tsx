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
        background: "transparent",
        borderRadius: 140,
      }}
    >
      <svg width="512" height="512" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="#1E40AF" />
        <path
          d="M8.6 24.4 16 7.6l7.4 16.8"
          stroke="#FFFFFF"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="19.6" r="2.5" fill="#FFD3AE" />
      </svg>
    </div>,
    size,
  );
}
