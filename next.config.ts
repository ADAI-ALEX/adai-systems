import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** The floating dev badge sits over the page and only exists in `next dev`. */
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
