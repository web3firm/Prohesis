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
  },
  async redirects() {
    return [
      // admin index now lives at /admin/dashboard
      { source: "/admin", destination: "/admin/dashboard", permanent: true },
      // old nested routes to new top-level
      { source: "/user/leaderboard", destination: "/leaderboard", permanent: true },
      // handle case-insensitive /Leaderboard
      { source: "/Leaderboard", destination: "/leaderboard", permanent: true },
      // convenience redirect if someone hits /docs/README
      { source: "/docs/README", destination: "/docs", permanent: true },
      // move login route under /admin/auth/login
      { source: "/login", destination: "/admin/auth/login", permanent: true },
      // retire old user Markets routes
      { source: "/user/Markets", destination: "/markets", permanent: true },
      { source: "/user/Markets/:id", destination: "/markets/:id", permanent: true },
      // migrate from old username-scoped user area to top-level routes
      { source: "/:username/dashboard", destination: "/dashboard", permanent: true },
      { source: "/:username/profile", destination: "/profile", permanent: true },
      { source: "/:username/settings", destination: "/settings", permanent: true },
      { source: "/:username/analytics", destination: "/analytics", permanent: true },
    ];
  }
};

export default nextConfig;
