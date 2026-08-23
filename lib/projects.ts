/**
 * The project archive — the single source of truth for the whole site.
 *
 * Every view (timeline, network, currently-building, research, the domain
 * index, the per-project pages, the sitemap) is derived from this array. No
 * project copy is written anywhere else, so adding to the studio's history is
 * one object here plus, optionally, a coordinate in `node`.
 *
 * Adding a project:
 *   1. append an object to `projects` — `start` decides where it lands on the
 *      timeline, so the array order does not matter;
 *   2. give it a `node` position if it should appear in the network view;
 *   3. name its `related` projects. Relationships are treated as undirected
 *      when the graph is built, so listing it on one side is enough — but
 *      listing both reads better on the two detail pages.
 *
 * Descriptions must reflect what the project actually was. No user numbers, no
 * revenue, no clients, no outcomes that did not happen.
 */

export type ProjectStatus =
  | "active"
  | "discontinued"
  | "on-hold"
  | "private"
  | "research";

export type ProjectType =
  | "agency"
  | "platform"
  | "consumer"
  | "research"
  | "fintech"
  | "computer-vision"
  | "voice-ai"
  | "machine-learning";

export type Project = {
  id: string;
  title: string;
  /** Human-readable span, e.g. "Aug 2026 — Now". Rendered verbatim. */
  dateLabel: string;
  /** Sortable start, `YYYY-MM`. Drives timeline order and the sitemap. */
  start: string;
  /** Sortable end, or null while the project is still running. */
  end: string | null;
  type: ProjectType;
  /** Uppercase label shown next to the status, e.g. "CONSUMER APP". */
  typeLabel: string;
  status: ProjectStatus;
  /**
   * Archived, but explicitly not abandoned. Renders as
   * "DISCONTINUED · MAY RETURN" rather than a harder ending.
   */
  mayReturn?: boolean;
  /**
   * The project's chapter in the studio's evolution, in two or three words.
   * Rendered as one link in the lineage strip above the archive.
   */
  chapter: string;
  /** One line. Used on cards and in the network readout. */
  short: string;
  /** The considered description. Used at the top of the detail page. */
  summary: string;
  /** Paragraphs for the detail page body. */
  body: string[];
  /** What the project was made of — technical themes, not marketing tags. */
  tags: string[];
  /** Ids of related projects. Treated as undirected by the graph. */
  related: string[];
  /** A live public destination, if one genuinely exists. */
  url?: string;
  /** Label for `url`, e.g. "lockout.adai.systems". */
  urlLabel?: string;
  /** Raised to the top of the page under "Currently building". */
  featured?: boolean;
  /**
   * Position in the network view, on the 1000 x 560 canvas, plus which
   * side of the dot its label sits on. Hand-placed: the layout is composed
   * rather than force-directed, so edges stay legible and the hub reads as
   * the hub. A project without a `node` is simply left out of the graph.
   */
  node?: { x: number; y: number; label: "top" | "bottom" };
};

export const projects: Project[] = [
  {
    id: "adai-systems",
    title: "ADAI Systems",
    dateLabel: "Dec 2024 — Now",
    start: "2024-12",
    end: null,
    type: "agency",
    typeLabel: "Agency / Studio",
    status: "active",
    chapter: "Agency",
    short: "The studio everything else comes out of.",
    summary:
      "ADAI Systems is an independent technology studio building intelligent software, AI systems and digital products — from custom business automation to experimental consumer applications.",
    body: [
      "ADAI Systems began as an AI agency: designing and building custom systems for businesses that wanted automation to do real operational work rather than sit next to it. Assistants, chatbots, voice agents, automated workflows and the custom software around them.",
      "That client work is still the studio's foundation, and it is also where most of the other projects on this page started. A problem shows up in a build, becomes worth understanding on its own, and turns into a platform, a product or a piece of research.",
      "The studio has stayed deliberately small and technical. It builds its own tools, ships its own products, and keeps the research that does not become a product.",
    ],
    tags: ["AI", "Automation", "Voice", "Custom software"],
    related: [
      "vantage-ai",
      "reinforcement-learning",
      "fitdawg",
      "voice-agent",
      "apex-terminal",
      "spatial-memory-scanner",
      "lockout",
    ],
    featured: true,
    node: { x: 168, y: 288, label: "top" },
  },
  {
    id: "vantage-ai",
    title: "Vantage AI",
    dateLabel: "Nov 2025",
    start: "2025-11",
    end: "2025-11",
    type: "platform",
    typeLabel: "Platform",
    status: "discontinued",
    chapter: "AI platform",
    short: "One workspace for a business's entire AI surface.",
    summary:
      "An all-in-one AI operating system for businesses — bringing chatbots, voice agents and automations into one workspace.",
    body: [
      "Vantage AI was an attempt to turn the studio's agency work into a product. Every client build repeated the same shape: a chatbot here, a voice agent there, a set of automations behind them, and no single place to deploy or manage any of it.",
      "The platform was designed to be that single place — one interface to configure, deploy and operate a business's AI systems together instead of as separate integrations.",
      "It was discontinued. The problem it was aimed at is real, but the product surface required to solve it properly was far larger than a studio of this size could carry alongside client work. What survived is the voice architecture it needed, which became its own project.",
    ],
    tags: ["Platform", "Chatbots", "Voice agents", "Workflow automation"],
    related: ["adai-systems", "voice-agent"],
    node: { x: 352, y: 116, label: "top" },
  },
  {
    id: "reinforcement-learning",
    title: "Reinforcement Learning",
    dateLabel: "Feb 2026",
    start: "2026-02",
    end: "2026-02",
    type: "machine-learning",
    typeLabel: "Research / Machine Learning",
    status: "research",
    chapter: "Machine learning",
    short: "Teaching agents to make decisions, then watching what emerges.",
    summary:
      "A collection of reinforcement-learning experiments exploring decision-making, navigation and emergent behaviour — including obstacle avoidance and predator-versus-prey environments.",
    body: [
      "A set of experiments rather than a product: purpose-built environments used to study how an agent learns to act when it is given an objective and nothing else.",
      "The environments included obstacle avoidance, predator-versus-prey scenarios, and simple worlds built specifically to make a policy's behaviour legible while it trained.",
      "The interesting results were rarely the scores. They were the strategies that appeared without being designed — the point of the exercise, and the reason the work fed into later projects that had to make decisions under uncertainty.",
    ],
    tags: [
      "Reinforcement learning",
      "Policy optimisation",
      "Simulation",
      "Emergent behaviour",
    ],
    related: ["apex-terminal", "adai-systems"],
    node: { x: 318, y: 470, label: "bottom" },
  },
  {
    id: "fitdawg",
    title: "FitDawg",
    dateLabel: "Mar 2026 — Aug 2026",
    start: "2026-03",
    end: "2026-08",
    type: "consumer",
    typeLabel: "Consumer App",
    status: "discontinued",
    mayReturn: true,
    chapter: "Fitness product",
    short: "Exercise, structured like a game you do not want to lose.",
    summary:
      "A gamified fitness app built to make staying active feel like a game — with streaks, levels, friends and competitive leagues.",
    body: [
      "FitDawg took the motivational mechanics that language apps use to hold attention — streaks, levels, leagues — and applied them to exercise.",
      "The design bet was social rather than individual: friends, competition and visible standings, on the theory that accountability to other people outlasts accountability to yourself.",
      "It is no longer in active development, but the underlying idea did not go away. It reappeared, inverted, in Lockout — where the exercise is the price of a distraction rather than a score on a leaderboard.",
    ],
    tags: ["Gamification", "Habit design", "Social", "Fitness"],
    related: ["lockout", "adai-systems"],
    url: "https://fitdawg.adai.systems",
    urlLabel: "fitdawg.adai.systems",
    node: { x: 548, y: 322, label: "bottom" },
  },
  {
    id: "voice-agent",
    title: "Voice Agent Architecture",
    dateLabel: "May 2026",
    start: "2026-05",
    end: "2026-05",
    type: "voice-ai",
    typeLabel: "R&D / Voice AI",
    status: "discontinued",
    mayReturn: true,
    chapter: "Voice architecture",
    short: "A voice pipeline that does not have to leave the machine.",
    summary:
      "A custom voice-agent architecture engineered for privacy-first, largely local execution and full control over the voice pipeline.",
    body: [
      "Hosted voice-AI infrastructure is fast to adopt and hard to own. Every call goes through someone else's stack, at their latency, under their pricing, with their retention policy.",
      "This was the alternative: a voice-agent architecture built specifically for ADAI Systems, prioritising local execution and privacy over convenience, with the studio in control of each stage of the pipeline rather than renting the whole thing.",
      "It is archived rather than finished. The economics of hosted voice keep shifting, and the reasons to own the pipeline have not gone away.",
    ],
    tags: ["Voice AI", "Local inference", "Privacy", "Architecture"],
    related: ["adai-systems", "vantage-ai"],
    node: { x: 562, y: 118, label: "top" },
  },
  {
    id: "apex-terminal",
    title: "Apex Terminal",
    dateLabel: "Jun 2026",
    start: "2026-06",
    end: "2026-06",
    type: "fintech",
    typeLabel: "Private Research / Fintech",
    status: "private",
    chapter: "Trading systems",
    short: "A market workspace and a strategy lab in the same window.",
    summary:
      "A private trading research environment combining a Bloomberg-style market workspace with Python strategy development and backtesting.",
    body: [
      "Systematic trading research is normally split across a terminal for looking at markets and a notebook for testing ideas about them. Apex Terminal was built to collapse that gap.",
      "One web workspace: market data and analysis tools on one side, Python strategy development and backtesting on the other, so an observation and the test of that observation live in the same place.",
      "It is private. There is no public build, no waitlist and no demo — this entry exists because the work is part of the studio's history, not because there is something to sign up for.",
    ],
    tags: ["Fintech", "Backtesting", "Python", "Systematic trading"],
    related: ["reinforcement-learning", "adai-systems"],
    node: { x: 600, y: 470, label: "bottom" },
  },
  {
    id: "spatial-memory-scanner",
    title: "Spatial Memory Scanner",
    dateLabel: "Jul 2026",
    start: "2026-07",
    end: "2026-07",
    type: "computer-vision",
    typeLabel: "Research / Computer Vision",
    status: "on-hold",
    chapter: "Spatial computing",
    short: "Scan a room now. Walk back into it later.",
    summary:
      "A spatial-memory experiment that uses LiDAR to capture environments as persistent 3D memories — designed to let people return to and re-experience places they have scanned.",
    body: [
      "A spatial-computing concept built around the LiDAR scanner already in the iPhone: capture a real environment as geometry, store it, and treat it as a memory rather than a scan file.",
      "The interesting part was never the capture. It was persistence — what it feels like to walk back into a room you recorded months ago, at the scale you recorded it, and move through it again.",
      "On hold. The capture side works well enough to be convincing; the question of what a captured place is actually for is the part still open.",
    ],
    tags: ["LiDAR", "Spatial computing", "Computer vision", "iOS"],
    related: ["lockout", "adai-systems"],
    node: { x: 818, y: 438, label: "bottom" },
  },
  {
    id: "lockout",
    title: "Lockout",
    dateLabel: "Aug 2026 — Now",
    start: "2026-08",
    end: null,
    type: "consumer",
    typeLabel: "Consumer App",
    status: "active",
    chapter: "Behavioural wellbeing",
    short: "Turn distraction into movement.",
    summary:
      "A behavioural wellbeing app that turns distracting apps into something you have to earn — using physical challenges and on-device verification to turn automatic scrolling into deliberate action.",
    body: [
      "Lockout is an iPhone app built on behavioural friction. You choose the apps you lose time to, and the app puts a physical challenge between you and them: push-ups, squats, sit-ups, jumping jacks or a walk.",
      "Complete the challenge and you earn temporary access. The point is not punishment — it is the pause. A tap that used to be automatic has to become a decision, and the cost of that decision is movement.",
      "Verification happens on the device. It is the studio's most complete consumer product to date, and the clearest example of the pattern the archive keeps returning to: take something people do without thinking, and make it cost a little something.",
    ],
    tags: [
      "Behavioural design",
      "On-device vision",
      "Digital wellbeing",
      "iOS",
    ],
    related: ["fitdawg", "adai-systems", "spatial-memory-scanner"],
    url: "https://lockout.adai.systems",
    urlLabel: "lockout.adai.systems",
    featured: true,
    node: { x: 832, y: 236, label: "top" },
  },
];

/* -------------------------------------------------------------------------- */
/* Derived views                                                              */
/* -------------------------------------------------------------------------- */

/** Oldest first — the order the studio actually happened in. */
export const projectsByDate = [...projects].sort((a, b) =>
  a.start.localeCompare(b.start),
);

/** Newest first, for the archive and the sitemap. */
export const projectsByDateDesc = [...projectsByDate].reverse();

export const activeProjects = projectsByDate.filter(
  (project) => project.status === "active",
);

/**
 * The research half of the studio: work that answered a question rather than
 * shipping to the public. Private and on-hold projects belong here too — the
 * distinction the section draws is product versus enquiry, not live versus dead.
 */
const RESEARCH_IDS = new Set([
  "apex-terminal",
  "spatial-memory-scanner",
  "reinforcement-learning",
  "voice-agent",
]);

export const researchProjects = projectsByDate.filter((project) =>
  RESEARCH_IDS.has(project.id),
);

export function getProject(id: string): Project | undefined {
  return projects.find((project) => project.id === id);
}

/** Resolves `related` ids to projects, dropping anything that no longer exists. */
export function relatedProjects(project: Project): Project[] {
  return project.related
    .map(getProject)
    .filter((related): related is Project => Boolean(related));
}

/* -------------------------------------------------------------------------- */
/* Status vocabulary                                                          */
/* -------------------------------------------------------------------------- */

/**
 * One label per status, used everywhere a status is shown so the wording never
 * drifts between the card, the detail page and the filter bar.
 */
const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  discontinued: "Discontinued",
  "on-hold": "On hold",
  private: "Private",
  research: "Research",
};

export function statusLabel(project: Project): string {
  const base = STATUS_LABELS[project.status];
  return project.mayReturn ? `${base} · May return` : base;
}

/** A short plain-English gloss, shown as the status label's tooltip. */
export const STATUS_MEANING: Record<ProjectStatus, string> = {
  active: "Currently being built and maintained.",
  discontinued: "No longer in active development.",
  "on-hold": "Paused, with the work intact.",
  private: "Exists, but is not publicly accessible.",
  research: "Experimental work rather than a public product.",
};

/* -------------------------------------------------------------------------- */
/* The network                                                                */
/* -------------------------------------------------------------------------- */

export type Edge = { source: string; target: string };

/**
 * Undirected edges built from every `related` list, de-duplicated so a pair
 * that names each other still only draws one line.
 */
export const edges: Edge[] = (() => {
  const seen = new Set<string>();
  const result: Edge[] = [];

  for (const project of projects) {
    for (const otherId of project.related) {
      if (!getProject(otherId)) continue;
      const key = [project.id, otherId].sort().join("::");
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ source: project.id, target: otherId });
    }
  }

  return result;
})();

/** Every project one hop from `id`, by graph edge rather than by `related`. */
export function neighbours(id: string): Set<string> {
  const result = new Set<string>();
  for (const edge of edges) {
    if (edge.source === id) result.add(edge.target);
    if (edge.target === id) result.add(edge.source);
  }
  return result;
}
