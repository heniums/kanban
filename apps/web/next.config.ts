import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  async rewrites() {
    const serverUrl = process.env.SERVER_URL || "http://localhost:3001";
    return {
      beforeFiles: [
        {
          source: "/api/health",
          destination: `${serverUrl}/api/health`,
        },
        {
          source: "/api/auth/register",
          destination: `${serverUrl}/api/auth/register`,
        },
        {
          source: "/api/auth/login",
          destination: `${serverUrl}/api/auth/login`,
        },
      ],
    };
  },
};

export default nextConfig;
