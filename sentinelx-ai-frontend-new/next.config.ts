import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Explicitly expose the backend API URL at build time.
   * This value is used as a fallback if NEXT_PUBLIC_API_BASE_URL is not set
   * in the Render environment dashboard.
   *
   * The env block here is overridden by actual NEXT_PUBLIC_* env vars at build time,
   * so setting NEXT_PUBLIC_API_BASE_URL in Render dashboard will always take priority.
   */
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "https://cybercore-backend-csqd.onrender.com/api",
  },
};

export default nextConfig;
