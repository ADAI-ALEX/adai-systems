import type { Metadata, Viewport } from "next";
import { site } from "@/content/site";
import "./globals.css";

/**
 * Root shell for the redesign branch.
 *
 * Deliberately bare: each of the three directions brings its own fonts and
 * tokens, so nothing visual lives here. Indexing is off until a direction is
 * chosen and the real pages exist.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
