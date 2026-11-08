import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/*/feed",
          "/*/messages",
          "/*/settings",
          "/*/admin",
          "/*/onboarding",
          "/*/welcome",
          "/*/needs",
          "/*/saved",
          "/*/notifications",
          "/*/me",
        ],
      },
    ],
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
