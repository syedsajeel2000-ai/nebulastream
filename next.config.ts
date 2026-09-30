import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // All remote artwork is proxied server-side through /api/art — no
  // remotePatterns needed since <img> elements only hit our own route.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // better-sqlite3 is a native addon: keep it external to the server bundle so
  // its prebuilt binding is loaded as-is (required for Vercel/serverless too).
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
