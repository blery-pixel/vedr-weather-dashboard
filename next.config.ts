import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel handles build output automatically — no `output: "standalone"` needed */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
