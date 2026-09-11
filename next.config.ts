import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      exceljs: path.resolve("./node_modules/exceljs/dist/exceljs.min.js"),
    };
    return config;
  },
};

export default nextConfig;
