import type { MetadataRoute } from "next";

/** PWA manifest (Stage 10): installable on phones. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ABLE — Work that fits you",
    short_name: "ABLE",
    description: "Talent platform connecting people with disabilities and employers who want to hire them.",
    start_url: "/en/feed",
    scope: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#1E40AF",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
