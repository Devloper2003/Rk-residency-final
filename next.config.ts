import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the preview iframe origin to talk to the dev server without
  // triggering the cross-origin warning in development.
  allowedDevOrigins: ["*.space-z.ai"],
  reactStrictMode: true,
};

export default nextConfig;
