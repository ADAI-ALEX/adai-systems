import type { Metadata, Viewport } from "next";
import { site } from "@/content/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}. ${site.headline}`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: "FitDawg Ltd",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0c10",
  colorScheme: "dark",
};

/**
 * Organisation schema. Every field is a fact stated on the site itself:
 * nothing is asserted here that a visitor could not also read.
 */
const organisation = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  logo: `${site.url}/assets/logo/adai-mark.svg`,
  description: site.description,
  foundingDate: "2024-12",
  email: site.email,
  parentOrganization: { "@type": "Organization", name: "FitDawg Ltd" },
  contactPoint: { "@type": "ContactPoint", contactType: "general enquiries", email: site.email },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>
        <script
          type="application/ld+json"
          // Static, first-party JSON built above. No user input reaches it.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation) }}
        />
        {children}
      </body>
    </html>
  );
}
