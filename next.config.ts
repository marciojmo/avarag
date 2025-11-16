import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // This line disables ESLint during Vercel builds
  },
};

export default nextConfig;
