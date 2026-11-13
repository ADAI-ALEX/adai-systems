import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** The floating dev badge sits over the page and only exists in `next dev`. */
  devIndicators: false,
  env: {
    /**
     * The tweaks bar is compiled in everywhere except production. On a preview
     * deployment or locally, add ?tweaks=1 to any page to open it.
     */
    NEXT_PUBLIC_TWEAKS: process.env.VERCEL_ENV === "production" ? "" : "1",
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
