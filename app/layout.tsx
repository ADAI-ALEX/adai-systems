import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "ADAI Systems — Intelligent Software & Digital Products",
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "ADAI Systems",
    "technology studio",
    "AI systems",
    "AI agency",
    "software products",
    "automation",
    "computer vision",
    "machine learning",
    "voice agents",
  ],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.legal.entityName,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: "ADAI Systems — Intelligent Software & Digital Products",
    description: siteConfig.description,
    url: "/",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "ADAI Systems — Intelligent Software & Digital Products",
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fafafa",
  colorScheme: "light",
};

/**
 * Organisation schema.
 *
 * This is the machine-readable version of what the Studio section says in
 * words: who the studio is, what it does, who operates it, and how to reach
 * it. Every field is a fact stated elsewhere on the page — nothing is asserted
 * here that a visitor could not also read.
 */
const organisationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  alternateName: siteConfig.legal.entityName,
  url: siteConfig.url,
  logo: `${siteConfig.url}/assets/logo/adai-wordmark.svg`,
  description: siteConfig.description,
  foundingDate: "2024-12",
  email: siteConfig.contactEmail,
  parentOrganization: {
    "@type": "Organization",
    name: siteConfig.legal.entityName,
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "general enquiries",
    email: siteConfig.contactEmail,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          // Static, first-party JSON built above — no user input reaches it.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organisationSchema),
          }}
        />
        <a
          href="#main"
          className="meta sr-only focus:not-sr-only focus:absolute focus:left-5 focus:top-5 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-ink-inverse"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
