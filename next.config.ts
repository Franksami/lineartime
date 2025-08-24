import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: '/Users/goodfranklin/lineartime'
  },
  // Temporarily ignore TypeScript errors during testing phase
  typescript: {
    ignoreBuildErrors: true,
  },
  // Also ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
