/**
 * Studio facts and shared copy.
 *
 * Every line here traces back to `content/inventory.md`. Nothing may be added
 * that the inventory does not hold.
 */
export const site = {
  name: "ADAI Systems",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.adai.systems",
  headline: "Building intelligent software.",
  line: "A system for building systems.",
  description:
    "ADAI Systems is an independent technology studio building AI systems, software products and experimental research.",
  email: "alex@adai.systems",
  contactLine: "One address, read by a person.",
  founded: "December 2024",
  foundedShort: "Dec 2024",
  operator: "ADAI Systems is a technology studio operated by FitDawg Ltd.",
  links: {
    lockout: "https://lockout.adai.systems",
    lockoutAppStore: "https://apps.apple.com/app/id6804702332",
    fitdawg: "https://fitdawg.adai.systems",
  },
} as const;

/** Shared section copy. Each direction sets it in its own voice and layout. */
export const copy = {
  intro:
    "An independent technology studio. AI systems, software products and research that sometimes turns into both.",
  now: {
    title: "Now building",
    body: "Two things are live. A product on the App Store and a lab on GitHub.",
  },
  work: {
    title: "Selected work",
    body: "Things that run. Some are open source, some are demos.",
  },
  archive: {
    title: "The archive",
    body: "Every project since the studio started, in the order it happened. Nothing is hidden because it was paused or dropped.",
  },
  domains: {
    title: "What the studio builds",
    body: "Eight areas the work keeps coming back to. Each one lists the projects that prove it.",
  },
  research: {
    title: "Research",
    body: "Some projects exist to answer a question. These are the ones that did.",
  },
  hire: {
    title: "Work with me",
    lead: "Need something built?",
    body: "I'm Alex. I build and ship across AI, automation and consumer apps, and I take on custom work: AI systems, automation and software for businesses. Email me what you need and what it has to do.",
    cta: "Email Alex",
  },
} as const;
