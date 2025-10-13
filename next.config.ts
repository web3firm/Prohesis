import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["wagmi", "viem", "@rainbow-me/rainbowkit"],
  },
  transpilePackages: ["wagmi", "viem", "@rainbow-me/rainbowkit"]
};

export default nextConfig;
