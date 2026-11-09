import type { NextConfig } from "next";

// Fără cacheComponents: CRM-ul e o aplicație de lucru, toate paginile sunt dinamice.
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
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
