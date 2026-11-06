import type { NextConfig } from "next";

// Production backend by default. Only an explicit BACKEND_URL points it elsewhere.
const rawBackend = process.env.BACKEND_URL || "https://stock.theavin.xyz";
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
