import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** The floating dev badge sits over the page and only exists in `next dev`. */
  devIndicators: false,
  images: {
    /**
     * Every image on this site is a first-party SVG served from /public — the
     * ADAI wordmark and mark. SVG stays sharp at any size, which requires
     * opting in explicitly; the CSP below blocks scripts inside them, and no
     * remote or user-supplied SVG is ever rendered.
     */
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox; style-src 'unsafe-inline'",
  },
};

export default nextConfig;
