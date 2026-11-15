import type { Aspect } from "./projects";

/**
 * The four things a client can hire the studio for.
 *
 * Each one is also a branch of the web: the projects hanging from it are the
 * proof. Every capability listed here is something a project in the archive
 * already does. Nothing is promised that has not been built.
 */
export type Service = {
  slug: Aspect;
  /** Path segment, e.g. /services/ai-agents. */
  path: string;
  title: string;
  short: string;
  promise: string;
  intro: string;
  /** What you get. Each line is demonstrated by a project. */
  builds: { text: string; proof: string }[];
  /** Signs this is the right service. */
  fit: string[];
  /** Slugs of the projects shown as proof, strongest first. */
  proof: string[];
  /** CSS colour token for this branch. */
  hue: string;
};

export const services: Service[] = [
  {
    slug: "agents",
    path: "ai-agents",
    title: "AI agents and voice",
    short: "Agents",
    promise: "Agents that answer, look things up and act.",
    intro:
      "Phone agents, chat agents and assistants that work against your own data and do the task, not just talk about it. Speech can run on your own machines where privacy matters.",
    builds: [
      { text: "A phone agent that asks, looks up, quotes, confirms and books in one turn.", proof: "voice-agent" },
      { text: "Speech-to-text and text-to-speech that run on the machine, with UK voices.", proof: "voice-agent" },
      { text: "An agent you can interrupt mid-sentence, which then picks the thread back up.", proof: "voice-agent" },
      { text: "AI that advises but cannot act alone: every action passes a hard rule first.", proof: "apex-terminal" },
      { text: "Local models that return a calibrated probability, not a paragraph.", proof: "jeb-depot" },
    ],
    fit: [
      "Your team answers the same calls or messages every day.",
      "The answers live in a system an agent could read.",
      "You need to know what the AI did and why.",
    ],
    proof: ["voice-agent", "jeb-depot", "apex-terminal", "call-analyser"],
    hue: "--amber",
  },
  {
    slug: "automation",
    path: "automation",
    title: "Automation and internal tools",
    short: "Automation",
    promise: "Hand the repetitive work to software.",
    intro:
      "Small, dependable tools that sit inside the way you already work. They watch a folder, a queue or a booking page, do the job, and leave a record you can read.",
    builds: [
      { text: "A tool that watches a folder of call recordings and writes a report for each one.", proof: "call-analyser" },
      { text: "Transcription that stays on the machine, with CSV and HTML output.", proof: "call-analyser" },
      { text: "Software that runs on locked-down Windows machines without admin rights.", proof: "call-analyser" },
      { text: "Table booking and staff management for a venue, shown as a working demo.", proof: "hospitality-platform" },
    ],
    fit: [
      "Someone on your team does the same task by hand every week.",
      "Your IT is locked down and most tools will not install.",
      "You want the data to stay on your own machines.",
    ],
    proof: ["call-analyser", "hospitality-platform", "voice-agent"],
    hue: "--aqua",
  },
  {
    slug: "products",
    path: "apps",
    title: "Apps and products",
    short: "Apps",
    promise: "From an idea to something people can open.",
    intro:
      "iPhone apps, web apps and the backend behind them, taken all the way: design, build, tests, payments, store review and launch.",
    builds: [
      { text: "An iPhone app live on the App Store, built in Swift on Apple's Screen Time frameworks.", proof: "lockout" },
      { text: "On-device computer vision that counts exercise reps through the camera.", proof: "lockout" },
      { text: "Subscriptions, sign-in and a synced backend.", proof: "lockout" },
      { text: "A data-heavy web app with bespoke charts, live and open source.", proof: "margin" },
      { text: "A browser trading terminal with a strategy editor and an offline backtester.", proof: "apex-terminal" },
      { text: "A cross-platform app with streaks, leagues, GPS tracking and AI meal scanning.", proof: "fitdawg" },
    ],
    fit: [
      "You have a product idea and need someone to build all of it.",
      "You need it tested, not just demoed.",
      "You want one person who owns the result.",
    ],
    proof: ["lockout", "margin", "apex-terminal", "fitdawg"],
    hue: "--coral",
  },
  {
    slug: "research",
    path: "prototypes",
    title: "Research and prototypes",
    short: "Research",
    promise: "Find out whether it can be done.",
    intro:
      "A working prototype or a straight answer, before you commit a budget. Machine learning experiments, feasibility studies and demos that are measured and written up honestly.",
    builds: [
      { text: "A language model trained from random weights on one laptop, with every part of the stack hand-built.", proof: "glimmer" },
      { text: "A feasibility study that ends in a clear recommendation.", proof: "holographic-display" },
      { text: "A playable demo that measures a model against a rules-based baseline.", proof: "jeb-depot" },
      { text: "Room capture in a phone browser, walked through in 3D on a laptop.", proof: "spatial-memory-scanner" },
      { text: "Reinforcement learning agents, taken through four iterations until they could plan.", proof: "reinforcement-learning" },
    ],
    fit: [
      "You have an idea and do not know if it is feasible.",
      "You need a demo to show before a bigger decision.",
      "You want the limits stated, not hidden.",
    ],
    proof: ["glimmer", "jeb-depot", "spatial-memory-scanner", "holographic-display", "reinforcement-learning"],
    hue: "--sky",
  },
];

export function getService(slug: Aspect): Service {
  const found = services.find((service) => service.slug === slug);
  if (!found) throw new Error(`Unknown service: ${slug}`);
  return found;
}

/**
 * How a project runs. Drafted for Alex to confirm: it describes a way of
 * working, so he should check it matches what he actually offers.
 */
export const process: { title: string; body: string }[] = [
  { title: "Send the brief", body: "Tell me what you need and what it has to do. A few lines is enough to start." },
  { title: "Agree the scope", body: "I reply with questions, then a written scope: what gets built, what does not, and what it will cost." },
  { title: "See it working early", body: "You get something you can click or call early on, not a slide deck. We adjust from the real thing." },
  { title: "Hand over", body: "You get the code, the documentation and a walkthrough. It is yours." },
];

/** Options in the project brief builder. Choices only: none of them is sent anywhere. */
export const brief = {
  stages: ["Just an idea", "I have a spec or a design", "There is an existing system to improve"],
  timelines: ["As soon as possible", "In the next one to three months", "Flexible"],
} as const;
