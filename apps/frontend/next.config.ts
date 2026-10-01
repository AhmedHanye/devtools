import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  pageExtensions: ["next.tsx", "next.ts"],
};

export default nextConfig;
