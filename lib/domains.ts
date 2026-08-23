import { projects, type Project } from "./projects";

/**
 * The technical domains the studio works across.
 *
 * This is the "what we build" index, and it is deliberately evidence-based:
 * each domain names the project ids that demonstrate it, so a domain cannot be
 * claimed without work behind it. A domain with no matching project simply does
 * not render.
 */
export type Domain = {
  id: string;
  label: string;
  /** One line on what the domain means here, in this studio. */
  note: string;
  projectIds: string[];
};

export const domains: Domain[] = [
  {
    id: "ai",
    label: "AI",
    note: "Assistants, chatbots and the systems that sit behind them.",
    projectIds: ["adai-systems", "vantage-ai"],
  },
  {
    id: "automation",
    label: "Automation",
    note: "Operational work handed to software that runs without supervision.",
    projectIds: ["adai-systems", "vantage-ai"],
  },
  {
    id: "computer-vision",
    label: "Computer Vision",
    note: "Reading the physical world through a camera or a depth sensor.",
    projectIds: ["lockout", "spatial-memory-scanner"],
  },
  {
    id: "machine-learning",
    label: "Machine Learning",
    note: "Systems that learn a policy instead of being given one.",
    projectIds: ["reinforcement-learning", "apex-terminal"],
  },
  {
    id: "consumer",
    label: "Consumer Software",
    note: "Products for people rather than for businesses.",
    projectIds: ["lockout", "fitdawg"],
  },
  {
    id: "fintech",
    label: "Fintech",
    note: "Market data, strategy development and systematic research tools.",
    projectIds: ["apex-terminal"],
  },
  {
    id: "voice",
    label: "Voice",
    note: "Speech pipelines built to run close to the machine.",
    projectIds: ["voice-agent", "adai-systems"],
  },
  {
    id: "spatial",
    label: "Spatial Computing",
    note: "Capturing real environments and making them persistent.",
    projectIds: ["spatial-memory-scanner"],
  },
];

/** Resolves a domain's evidence, dropping ids that no longer exist. */
export function domainProjects(domain: Domain): Project[] {
  return domain.projectIds
    .map((id) => projects.find((project) => project.id === id))
    .filter((project): project is Project => Boolean(project));
}
