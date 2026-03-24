/** @type {import('next').NextConfig} */
import path from "node:path";

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  
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
