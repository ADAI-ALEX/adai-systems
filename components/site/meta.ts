import type { Metadata } from "next";
import { site } from "@/content/site";

/** Page metadata with a canonical URL and the page's own share card. */
export function pageMeta({
  title,
  description,
  path,
  card,
}: {
  title?: string;
  description: string;
  path: string;
  card: string;
}): Metadata {
  const image = { url: `/og/${card}.png`, width: 1200, height: 630, alt: title ? `${title}. ${site.name}` : site.name };
  return {
    // Leaving the key out lets the home page inherit the default title.
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "en_GB",
      url: path,
      title: title ? `${title} · ${site.name}` : `${site.name}. ${site.headline}`,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: title ? `${title} · ${site.name}` : `${site.name}. ${site.headline}`,
      description,
      images: [image.url],
    },
  };
}
