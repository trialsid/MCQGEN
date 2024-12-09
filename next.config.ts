import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

module.exports = {
  env: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
};
