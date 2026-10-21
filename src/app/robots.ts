import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/club/", "/checkout", "/my-bookings", "/bookings/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
