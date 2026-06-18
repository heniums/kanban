import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  async rewrites() {
    const serverUrl = process.env.SERVER_URL || "http://localhost:3001";
    return {
      afterFiles: [
        {
          source: "/api/:path*",
          destination: `${serverUrl}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
