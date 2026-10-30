import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // testele cu 15 ghiduri pornesc un al doilea server, cu alt dosar de build
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  // PDF-urile ghidurilor: link-uri trimise pe Instagram, nelistate și neindexate
  async headers() {
    return [{ source: "/pdf/:fisier*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
  // PDF-urile sunt fișiere statice: nu au ce căuta în funcțiile paginilor (cheia e un glob, deci nu „[slug]”)
  outputFileTracingExcludes: { "/*": ["./public/pdf/**"] },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
