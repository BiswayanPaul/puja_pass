// Public URL of the site, used for canonical links, Open Graph, robots and sitemap.
// Set NEXT_PUBLIC_SITE_URL once you have a custom domain; on Vercel it otherwise
// falls back to the project's production domain.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
