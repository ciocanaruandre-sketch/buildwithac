import type { MetadataRoute } from "next";
import { FIRMA } from "@/lib/config";
import { seIndexeaza } from "@/lib/indexare";

// doar site-ul public se indexează; previzualizările și serverul local nu (regula în lib/indexare.ts)
export default function robots(): MetadataRoute.Robots {
  if (!seIndexeaza(process.env)) return { rules: { userAgent: "*", disallow: "/" } };
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${FIRMA.url}/sitemap.xml` };
}
