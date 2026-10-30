import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

// doar site-ul public se indexează; previzualizările și serverul local nu
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV !== "production") return { rules: { userAgent: "*", disallow: "/" } };
  // /pdf/ rămâne deschis: crawlerul trebuie să deschidă PDF-ul ca să vadă X-Robots-Tag: noindex (next.config.ts)
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${SITE.url}/sitemap.xml` };
}
