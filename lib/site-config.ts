/**
 * Company-level configuration.
 *
 * Everything here is a fact about the business rather than a design choice, so
 * it lives in one place: the studio name, the legal entity behind it, and the
 * single contact address. Components import from here instead of hard-coding
 * a name or an email into copy.
 *
 * Nothing in this file may be invented. `adai.systems` is the intended
 * production domain and `alex@adai.systems` is the only configured mailbox —
 * no second address is listed until one actually exists.
 */
export const siteConfig = {
  name: "ADAI Systems",
  tagline: "Building intelligent software and digital products.",
  description:
    "ADAI Systems is an independent technology studio building AI systems, software products and experimental research projects.",

  /** Canonical URL. Vercel sets NEXT_PUBLIC_SITE_URL for preview builds. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://adai.systems",

  /** The only configured mailbox. Do not add a second one speculatively. */
  contactEmail: "alex@adai.systems",

  /** Founded as a studio in December 2024 — the ADAI Systems project entry. */
  foundedYear: 2024,

  legal: {
    /**
     * ADAI Systems is a trading name, not its own incorporated company. The
     * site says so plainly wherever the entity is named, because implying a
     * separate company would be false.
     */
    entityName: "FitDawg Ltd",
    relationship:
      "ADAI Systems is a technology studio operated by FitDawg Ltd.",
    lastUpdated: "23 August 2026",
  },
} as const;

/** External destinations that belong to the studio. */
export const externalLinks = {
  lockout: "https://lockout.adai.systems",
  fitdawg: "https://fitdawg.adai.systems",
} as const;
