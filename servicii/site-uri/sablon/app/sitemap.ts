import type { MetadataRoute } from "next";
import { FIRMA } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/confidentialitate"].map((cale) => ({ url: `${FIRMA.url}${cale === "/" ? "" : cale}` }));
}
