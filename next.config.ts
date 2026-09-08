import type { NextConfig } from "next";

const rawBackend = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const targetBackend = rawBackend.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["antd", "@ant-design/icons"],
  experimental: {
    optimizePackageImports: ["antd", "@ant-design/icons"],
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${targetBackend}/:path*`,
      },
    ];
  },
};

export default nextConfig;
