import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // testele cu 15 ghiduri pornesc un al doilea server, cu alt dosar de build
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
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
