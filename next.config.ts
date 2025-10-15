import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["wagmi", "viem", "@rainbow-me/rainbowkit"],
  },
  transpilePackages: ["wagmi", "viem", "@rainbow-me/rainbowkit"]
  ,webpack: (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = config.resolve.alias || {}
    // point the react-native async-storage import to a small browser shim
    config.resolve.alias['@react-native-async-storage/async-storage'] = require('path').resolve(__dirname, 'src/shims/async-storage-browser.js')
    return config
  }
};

export default nextConfig;
