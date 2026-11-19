import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tailwind 4 prin Turbopack
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
