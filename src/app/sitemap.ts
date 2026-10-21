import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { getPandalSlugs } from "@/server/pandals";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getPandalSlugs();
  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/pandals`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/trail`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/clubs/register`, changeFrequency: "monthly", priority: 0.5 },
    ...slugs.map((slug) => ({ url: `${siteUrl}/pandals/${slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
