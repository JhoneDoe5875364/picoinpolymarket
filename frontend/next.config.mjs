/** @type {import('next').NextConfig} */
import path from "node:path";

const nextConfig = {
  typescript: { ignoreBuildErrors: true },

  // Dev-only: a local VPN adapter (e.g. Astrill, 198.18.x.x) makes browser
  // requests arrive from a non-localhost origin, which Next.js blocks by
  // default — that silently kills HMR, fonts, and CSS chunks.
  allowedDevOrigins: ["198.18.4.123", "198.18.*", "localhost", "127.0.0.1"],

  // Webpack configuration
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(process.cwd(), "src"),
    };

    return config;
  },
};

export default nextConfig;
