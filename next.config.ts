import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverComponentsExternalPackages: ['jsdom'],
};

export default nextConfig;
