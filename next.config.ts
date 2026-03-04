import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // spark.js and three.js are loaded via CDN importmap (see layout.tsx)
  // so they don't need to be processed by webpack
  async headers() {
    return [
      {
        source: "/models/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
