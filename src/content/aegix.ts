/**
 * Aegix: an early-stage health-tech venture shown in the Work archive (added November 2026).
 *
 * Kept apart from `projects` on purpose: it has its own page (`src/pages/work/aegix.astro`) and joins the
 * archive on /work only, so the home page counts, the lineage web and the other case studies are untouched.
 *
 * Honesty rule for every line in this file: Aegix is a concept. Nothing here may describe a planned
 * capability as built, a market as a customer, or an ambition as an achievement.
 */
import type { Project } from "./projects";

export const aegix: Project = {
  slug: "aegix",
  title: "Aegix",
  start: "2026-11",
  dateLabel: "Nov 2026 to now",
  kind: "product",
  kindLabel: "Health tech · Wearable monitoring",
  aspect: "products",
  status: "early-stage",
  statusLabel: "Early stage",
  chapter: "Health tech",
  pitch:
    "An early-stage concept: a wearable band and care-team platform for monitoring high-risk patients.",
  summary:
    "Aegix is an early-stage health-tech venture exploring wearable patient monitoring for high-risk individuals: a band that would collect physiological measurements, and a platform where authorised care teams could follow trends and receive configurable alerts.",
  stack: ["Health tech", "Wearables", "Patient monitoring", "Concept"],
  media: [
    {
      src: "/work/aegix/aegix-band-concept.webp",
      alt: "Exploratory design render of the proposed Aegix band: a slim graphite oval sensor module with a polished chamfer ring and a small side button, on a dark charcoal knit strap, against a graphite backdrop. A concept, not a built device.",
      width: 1376,
      height: 768,
      type: "concept",
    },
  ],
  disclosure:
    "Wearable concept, exploratory design. AI-generated industrial-design render. No physical device exists yet.",
};

/** Page copy. Everything planned is written as planned. */
export const aegixPage = {
  headline: "A closer watch over patient wellbeing.",
  lead: "Aegix is exploring intelligent wearable technology to support continuous patient monitoring and safer care.",
  conceptLabel: "Wearable concept — exploratory design",

  /** Where the venture stands today. Shown near the top, so nobody has to scroll to find it. */
  stage: [
    { label: "Stage", value: "Early concept" },
    { label: "First priority", value: "Software MVP" },
    { label: "Hardware", value: "To be investigated" },
    { label: "Team", value: "Founder-led" },
  ],
  notYet: [
    "No physical wearable prototype has been built.",
    "No monitoring system has been clinically validated.",
    "No NHS partnerships or deployments are in place.",
    "Fall detection has not been built or proven.",
    "No regulatory approval has been sought or granted.",
    "There are no commercial sales.",
  ],

  problem: {
    title: "Changes in condition don't wait for the next observation.",
    lead: "High-risk patients are often monitored through periodic checks and a patchwork of separate systems. That makes a consolidated view of someone's wellbeing hard to keep.",
    items: [
      {
        title: "Periodic observations",
        body: "Vital signs are typically recorded at scheduled intervals. Between them, there is limited visibility of how a patient is doing.",
      },
      {
        title: "Disconnected devices",
        body: "Care staff can work across several separate monitoring devices and records, each with its own screen, alarms and data.",
      },
      {
        title: "Change between checks",
        body: "A patient's condition can shift between scheduled observations, and may not be noticed until the next one.",
      },
      {
        title: "Unwitnessed falls",
        body: "Falls can happen when no one is present, which can delay assistance for the people most at risk.",
      },
    ],
  },

  concept: {
    title: "One band. One platform. One view of the patient.",
    lead: "Aegix aims to combine a wearable band with a software platform, so care teams can work from an integrated picture instead of disconnected devices and processes.",
    body: [
      "The band would collect relevant physiological measurements and send them to a central monitoring platform.",
      "Authorised healthcare professionals and carers could review measurements, follow trends over time and receive alerts configured to each patient.",
      "Fall detection is another intended capability.",
    ],
    flow: [
      { id: "band", title: "Wearable band", body: "Collects physiological measurements, worn continuously." },
      { id: "platform", title: "Software platform", body: "Receives, stores and processes data securely." },
      { id: "dashboard", title: "Monitoring dashboard", body: "Measurements and trends for authorised staff." },
      { id: "alerts", title: "Care-team alerts", body: "Configurable alerts to the right people." },
    ],
    flowNote: "Proposed architecture. This is not a working system.",
    wornAlt:
      "Exploratory concept image: an older adult's wrist resting on a wool blanket over the arm of a chair at home, wearing the proposed Aegix band. AI-generated; no device exists yet.",
  },

  capabilities: [
    {
      id: "vitals",
      title: "Vital-sign monitoring",
      body: "The proposed wearable would collect relevant physiological measurements and transmit them to the software platform. Which measurements, and which sensors, is part of the research still to do.",
      state: "Planned",
    },
    {
      id: "alerts",
      title: "Intelligent monitoring and alerts",
      body: "A central dashboard would let authorised care teams view patient measurements, follow trends and receive configurable alerts. This is the first thing to be built, as a software MVP.",
      state: "Planned · first to build",
    },
    {
      id: "falls",
      title: "Fall detection and patient safety",
      body: "A future fall-detection capability could identify potential falls and notify relevant care staff. It would need careful engineering and validation before any claim is made about it.",
      state: "Future",
    },
  ],

  deployment: {
    title: "Built for the places closer monitoring matters.",
    lead: "Intended markets, not existing partners or customers. The people wearing the band would be high-risk patients; the organisations paying for it would be healthcare and care providers.",
    items: [
      { title: "NHS and community healthcare", body: "Supporting clinical teams caring for high-risk patients in the community." },
      { title: "Virtual wards and remote monitoring", body: "Giving remote teams better visibility of patients being cared for at home." },
      { title: "Residential and nursing care homes", body: "Helping care staff keep a closer eye on residents, day and night." },
      { title: "After hospital discharge", body: "Monitoring high-risk patients through the weeks after they go home." },
    ],
  },

  roadmap: [
    {
      n: "01",
      title: "Discovery and clinical requirements",
      body: "Research patient-monitoring needs, interview healthcare professionals and care-home operators, investigate competitors and define the technical requirements.",
      state: "Now",
    },
    {
      n: "02",
      title: "Software MVP",
      body: "Develop the first monitoring platform: patient dashboard, vital-sign visualisation and alert workflows. Initially using simulated or suitable third-party sensor data where appropriate.",
      state: "First priority",
    },
    {
      n: "03",
      title: "Team formation and wearable engineering",
      body: "Recruit technical co-founders and collaborators across embedded systems, electronics, wearable hardware, sensing, software and healthcare. Investigate sensor technologies, industrial design, battery life, comfort, safety and manufacturability.",
      state: "Planned",
    },
    {
      n: "04",
      title: "Physical wearable prototype",
      body: "Design and build the first functional Aegix band. Integrate the sensor capabilities available with the software platform and begin technical testing.",
      state: "Planned",
    },
    {
      n: "05",
      title: "Clinical and customer validation",
      body: "Engage prospective care providers and healthcare professionals. Explore pilot opportunities, assess clinical requirements, investigate regulatory pathways and refine the product on what is learned.",
      state: "Planned",
    },
    {
      n: "06",
      title: "Investment and scaling",
      body: "With a credible prototype, a capable founding team and real customer-validation evidence, prepare to seek seed-stage investment and apply to leading startup accelerators, potentially including Y Combinator. San Francisco is the aspiration, for access to the wider technology and investment ecosystem.",
      state: "Future ambition",
    },
  ],
  roadmapNote:
    "A plan, not a record. There is no fundraising round and no accelerator place. Stage 06 is an ambition that depends on everything before it.",

  team: {
    title: "Founder-led today. Looking for co-founders.",
    lead: "Aegix is currently developed independently. Assembling a multidisciplinary founding team is the most important next step, and no co-founders or employees have been appointed yet.",
    body: "If you want to build wearable medical technology that care teams actually rely on, from the first sensor decision to the first pilot, this is an early seat at the table.",
    areas: [
      { title: "Wearable hardware and electronics", body: "Circuit design, power, enclosure and the path to a manufacturable band." },
      { title: "Embedded systems and sensors", body: "Firmware, sensor integration and reliable low-power data capture." },
      { title: "Software engineering and AI", body: "The monitoring platform, data pipelines and intelligent alerting." },
      { title: "Healthcare and clinical practice", body: "What care teams need, how they work, and what would make this safe." },
      { title: "Industrial design and regulation", body: "Comfort for older wearers, and the regulatory route to market." },
    ],
  },

  portfolio: {
    title: "Part of the ADAI Systems portfolio.",
    lead: "Aegix is shown here alongside the other software and technology projects developed through ADAI Systems. They are separate projects, and none of them is part of Aegix.",
    /** Existing projects that show relevant engineering, each with the reason it is shown. */
    related: [
      { slug: "lockout", why: "Consumer software and on-device computer vision." },
      { slug: "margin", why: "A data instrument that says exactly what it is not." },
      { slug: "glimmer", why: "Machine learning built from first principles." },
    ],
  },

  involve: {
    title: "Help shape Aegix.",
    lead: "Healthcare professionals, care providers, researchers, engineers and potential collaborators: if this is a problem you know, or one you want to work on, get in touch.",
    subject: "Aegix",
  },
} as const;
