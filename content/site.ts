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
    margin: "https://margin.adai.systems",
  },
} as const;

/** Shared copy. Written for a visitor who might hire the studio. */
export const copy = {
  hero: {
    sub: "ADAI Systems is an independent studio that designs and builds AI agents, automation and apps for businesses. The proof is below: every project, and how one led to the next.",
    primary: "Start a project",
    secondary: "See the work",
  },
  services: {
    title: "What I can build for you",
    body: "Four kinds of work. Each one is backed by projects you can open, not by a promise.",
  },
  showcase: {
    title: "Selected work",
    body: "Things that run. One is on the App Store, one is on the web, two are open source.",
  },
  web: {
    title: "Everything, and how it connects",
    body: "The studio at the centre, four branches, and every project since it started. Drag it. Select anything to read it.",
  },
  process: {
    title: "How a project runs",
    body: "Small steps, and something real to look at early.",
  },
  archive: {
    title: "The work",
    body: "Every project since the studio started. Nothing is hidden because it was paused or dropped.",
  },
  research: {
    title: "Research",
    body: "Some projects exist to answer a question. These are the ones that did.",
  },
  hire: {
    lead: "Need something built?",
    body: "I'm Alex. I build and ship across AI, automation and consumer apps, and I take on custom work for businesses. Tell me what you need and what it has to do.",
    cta: "Start a project",
  },
  start: {
    title: "Start a project",
    body: "Answer a few questions and this page writes the email for you. Nothing is sent from here: it opens in your own mail app, and you press send.",
  },
} as const;
