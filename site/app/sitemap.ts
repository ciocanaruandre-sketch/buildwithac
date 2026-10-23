import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";
import { toateGhidurile } from "@/lib/ghiduri";

export default function sitemap(): MetadataRoute.Sitemap {
  const pagini = ["", "/ghiduri", "/confidentialitate"].map((cale) => ({ url: `${SITE.url}${cale}` }));
  const ghiduri = toateGhidurile().map((g) => ({ url: `${SITE.url}/ghiduri/${g.slug}`, lastModified: g.actualizat }));
  return [...pagini, ...ghiduri];
}
