/**
 * The project archive. The single source of truth for every page.
 *
 * To add a project, append one object to `projects`. `start` decides where it
 * lands in the timeline, so array order does not matter. Every fact must come
 * from `content/inventory.md`.
 */

export type Status =
  | "active"
  | "live"
  | "open-source"
  | "demo"
  | "built"
  | "research"
  | "on-hold"
  | "discontinued";

export type Kind = "studio" | "product" | "research" | "demo" | "tool";

export type Media = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** "screen" is a real capture. "concept" is a generated illustration and must be labelled. */
  type: "screen" | "phone" | "pixel" | "concept";
};

export type Project = {
  slug: string;
  title: string;
  /** Sortable start, `YYYY-MM`. */
  start: string;
  /** Rendered as written, for example "Aug 2026 to now". */
  dateLabel: string;
  kind: Kind;
  kindLabel: string;
  status: Status;
  /** Shown wherever a status appears, so the wording never drifts. */
  statusLabel: string;
  /** Two or three words for the lineage strip. */
  chapter: string;
  pitch: string;
  summary: string;
  /** Short factual points. Used by the featured treatments. */
  points?: string[];
  /** Key figures, each one measured and recorded in the inventory. */
  facts?: { label: string; value: string }[];
  stack: string[];
  links?: { label: string; href: string }[];
  media?: Media[];
  /** A sentence the page must carry whenever this project is shown in full. */
  disclosure?: string;
  /** True when the source is public under an open licence. */
  openSource?: boolean;
};

export const projects: Project[] = [
  {
    slug: "adai-systems",
    title: "ADAI Systems",
    start: "2024-12",
    dateLabel: "Dec 2024 to now",
    kind: "studio",
    kindLabel: "Studio",
    status: "active",
    statusLabel: "Active",
    chapter: "Agency",
    pitch: "The studio everything else comes out of.",
    summary:
      "Founded in December 2024 as an AI agency building custom systems for businesses: assistants, chatbots, voice agents, automated workflows and the software around them. Most later projects started as a problem met in that work.",
    stack: ["AI", "Automation", "Voice", "Custom software"],
  },
  {
    slug: "vantage-ai",
    title: "Vantage AI",
    start: "2025-11",
    dateLabel: "Nov 2025",
    kind: "product",
    kindLabel: "Platform",
    status: "discontinued",
    statusLabel: "Discontinued",
    chapter: "AI platform",
    pitch: "One workspace for a business's entire AI surface.",
    summary:
      "An attempt to turn the agency work into a product: one interface to configure, deploy and run a business's chatbots, voice agents and automations. Discontinued because the product surface was too large to carry alongside client work. The voice architecture it needed became its own project.",
    stack: ["Platform", "Chatbots", "Voice agents", "Workflow automation"],
  },
  {
    slug: "reinforcement-learning",
    openSource: true,
    title: "Reinforcement Learning",
    start: "2026-02",
    dateLabel: "Feb 2026",
    kind: "research",
    kindLabel: "Machine learning",
    status: "research",
    statusLabel: "Research",
    chapter: "Machine learning",
    pitch: "Teaching agents to make decisions, then watching what emerges.",
    summary:
      "Two experiments. An agent that learns to cross a grid of random obstacles, taken through four iterations until it could plan its way out of U-shaped traps. Then a predator and a prey, two networks trained against each other in one arena.",
    stack: ["Python", "Stable Baselines3 (PPO)", "Gymnasium"],
    links: [
      { label: "Source on GitHub", href: "https://github.com/ADAI-ALEX/AI-RL-Projects" },
    ],
    media: [
      {
        src: "/work/reinforcement-learning/predator-prey.gif",
        alt: "Two agents in a square arena: the predator chases while the prey swerves away.",
        width: 1080,
        height: 1080,
        type: "screen",
      },
      {
        src: "/work/reinforcement-learning/obstacle-avoidance.gif",
        alt: "An agent steering through a grid of random obstacles towards its goal.",
        width: 1080,
        height: 1080,
        type: "screen",
      },
    ],
  },
  {
    slug: "fitdawg",
    title: "FitDawg",
    start: "2026-03",
    dateLabel: "Mar to Aug 2026",
    kind: "product",
    kindLabel: "Consumer app",
    status: "discontinued",
    statusLabel: "Discontinued, may return",
    chapter: "Fitness product",
    pitch: "Exercise, structured like a game you do not want to lose.",
    summary:
      "A gamified fitness app: streaks, XP and levels, daily quests, weekly leagues with friends, GPS workout tracking and AI meal scanning from a photo. The idea later reappeared, inverted, in Lockout.",
    stack: ["Expo (React Native)", "Supabase", "TanStack Query", "OpenAI"],
    links: [{ label: "fitdawg.adai.systems", href: "https://fitdawg.adai.systems" }],
  },
  {
    slug: "acoustic-levitation",
    title: "Acoustic Levitation RL",
    start: "2026-04",
    dateLabel: "Apr 2026",
    kind: "research",
    kindLabel: "Physics simulation",
    status: "research",
    statusLabel: "Research",
    chapter: "Physics",
    pitch:
      "A physics simulator where an RL agent searches for the transducer set-up that lifts the most.",
    summary:
      "First-principles wave acoustics simulate the force sound puts on a small particle. An agent is rewarded for liftable mass, a deep potential well and a stiff trap, and penalised for instability and unrealistic pressure.",
    stack: ["Python", "stable-baselines3 (SAC, PPO)", "Gymnasium", "pyvista"],
    links: [
      {
        label: "Source on GitHub",
        href: "https://github.com/ADAI-ALEX/Acoustic-Levitation-RL",
      },
    ],
  },
  {
    slug: "voice-agent",
    title: "Voice Agent",
    start: "2026-05",
    dateLabel: "May 2026",
    kind: "demo",
    kindLabel: "Voice AI",
    status: "demo",
    statusLabel: "Demo",
    chapter: "Voice",
    pitch: "A voice pipeline that does not have to leave the machine.",
    summary:
      "Local voice pipeline research that turned into a working demo: an AI phone agent built for a UK construction and waste business. Speech-to-text and text-to-speech run on the machine. The agent asks, looks things up, quotes, confirms and books in one turn, and it can be interrupted mid-sentence and pick the thread back up.",
    stack: ["Python", "FastAPI", "faster-whisper", "Piper TTS", "SQLite"],
  },
  {
    slug: "call-analyser",
    title: "Call Recording Analyser",
    start: "2026-05",
    dateLabel: "May 2026",
    kind: "tool",
    kindLabel: "Local tool",
    status: "built",
    statusLabel: "Built",
    chapter: "Call analysis",
    pitch: "Drop call recordings in a folder. Get a written report for each one.",
    summary:
      "A local desktop tool that watches a folder of customer service call recordings, transcribes them on-device and uses Claude to write a report per call. Web UI, CSV export and HTML reports. Built to run on locked-down Windows machines without admin rights.",
    stack: ["Python", "Flask", "faster-whisper", "Claude"],
  },
  {
    slug: "apex-terminal",
    openSource: true,
    title: "Apex Terminal",
    start: "2026-06",
    dateLabel: "Jun 2026 to now",
    kind: "product",
    kindLabel: "Fintech",
    status: "open-source",
    statusLabel: "Open source",
    chapter: "Trading systems",
    pitch:
      "Write a trading strategy in the browser, backtest it offline, and promote it to a live book behind a hard risk gate.",
    summary:
      "A browser trading terminal with a strategy editor, an offline backtester and a risk-gated execution engine. Claude reviews signals and the portfolio but has no route to the broker. Python places every order, every entry passes the risk engine, and any AI error means no trade.",
    stack: ["Python", "FastAPI", "Next.js", "SQLite", "Claude (advisory only)"],
    links: [
      { label: "Source on GitHub", href: "https://github.com/ADAI-ALEX/apex-terminal" },
    ],
  },
  {
    slug: "holographic-display",
    title: "Holographic Display Study",
    start: "2026-06",
    dateLabel: "Jun 2026",
    kind: "research",
    kindLabel: "Feasibility study",
    status: "research",
    statusLabel: "Research",
    chapter: "Displays",
    pitch: "Could you build a real volumetric display? A feasibility study.",
    summary:
      "A feasibility study into a flat-array laser-plasma volumetric display: the physics, the laser choices, the geometry limits and realistic costs. The conclusion was that a swept-volume persistence-of-vision LED display is the practical first step.",
    stack: ["Feasibility study"],
    media: [
      {
        src: "/work/holographic-display/concept.webp",
        alt: "Concept illustration: a glowing wireframe cube floating inside a glass cylinder on a black plinth.",
        width: 1200,
        height: 1200,
        type: "concept",
      },
    ],
    disclosure: "Concept illustration. Nothing was built.",
  },
  {
    slug: "hospitality-platform",
    title: "Hospitality Platform",
    start: "2026-06",
    dateLabel: "Jun 2026",
    kind: "demo",
    kindLabel: "Business software",
    status: "demo",
    statusLabel: "Demo",
    chapter: "Hospitality",
    pitch: "A booking and staff platform for independent pubs.",
    summary:
      "A staff management and table booking system for independent pubs, restaurants and cafés, shown as a live demo site.",
    stack: ["Web app", "Table booking", "Staff management"],
  },
  {
    slug: "spatial-memory-scanner",
    title: "Spatial Memory Scanner",
    start: "2026-07",
    dateLabel: "Jul 2026",
    kind: "research",
    kindLabel: "Computer vision",
    status: "on-hold",
    statusLabel: "On hold",
    chapter: "Spatial computing",
    pitch: "Scan a room now. Walk back into it later.",
    summary:
      "Scan a real space using only Chrome on an Android phone, then walk through it in 3D on a laptop: up the stairs, with the camera following the real floor, hearing each area's own ambient sound. Nothing leaves the laptop. The walkable floor comes from the path the person actually walked.",
    stack: ["WebXR", "ARCore", "JavaScript", "onnxruntime-web", "WebGL"],
  },
  {
    slug: "lockout",
    title: "Lockout",
    start: "2026-08",
    dateLabel: "Aug 2026 to now",
    kind: "product",
    kindLabel: "iPhone app",
    status: "live",
    statusLabel: "Live on the App Store",
    chapter: "Behavioural wellbeing",
    pitch: "Stop scrolling. Start earning it.",
    summary:
      "An iPhone app that puts your most distracting apps behind a physical challenge. When an app's daily allowance runs out, you hit a wall. Do the push-ups, squats or jumping jacks, counted by on-device pose detection, or do a 1 km GPS walk. Finish and the app opens.",
    points: [
      "Push-ups, squats and jumping jacks counted through the camera, on the phone.",
      "Or a 1 km walk, measured by GPS.",
      "Camera frames are measured and released. Nothing is recorded or uploaded.",
      "Changing the device clock cannot extend an unlock.",
    ],
    facts: [
      { label: "On the App Store since", value: "Sep 2026" },
      { label: "Unit tests", value: "484" },
      { label: "UI tests", value: "38" },
    ],
    stack: ["Swift", "SwiftUI", "Screen Time", "Vision", "RevenueCat", "Supabase"],
    links: [
      { label: "View on the App Store", href: "https://apps.apple.com/app/id6804702332" },
      { label: "lockout.adai.systems", href: "https://lockout.adai.systems" },
    ],
    media: [
      {
        src: "/work/lockout/home.webp",
        alt: "Lockout home screen: four apps locked, a seven day streak and thirty minutes earned today.",
        width: 880,
        height: 1912,
        type: "phone",
      },
      {
        src: "/work/lockout/push-ups.webp",
        alt: "Lockout push-up challenge screen showing what the camera sees and how to set up.",
        width: 880,
        height: 1912,
        type: "phone",
      },
      {
        src: "/work/lockout/verified.webp",
        alt: "Lockout confirmation screen: fifteen push-ups complete, fifteen minutes unlocked.",
        width: 880,
        height: 1912,
        type: "phone",
      },
      {
        src: "/work/lockout/walk.webp",
        alt: "Lockout walking challenge: 670 metres of a 1 kilometre walk completed.",
        width: 880,
        height: 1912,
        type: "phone",
      },
    ],
  },
  {
    slug: "jeb-depot",
    openSource: true,
    title: "JEB Depot",
    start: "2026-09",
    dateLabel: "Sep 2026",
    kind: "demo",
    kindLabel: "Local AI demo",
    status: "open-source",
    statusLabel: "Open source",
    chapter: "Decision models",
    pitch:
      "A pixel-art warehouse where every robot decision is made by a 4-billion-parameter model running locally on a Mac.",
    summary:
      "A small robot hauls packages while forklifts, oil spills and a draining battery get in the way. Each tick the game asks the model a few typed questions, reads back a probability for every answer, and shows those probabilities live so you can watch it weigh its options. A rules-based controller plays the same seeded missions as a baseline.",
    points: [
      "The model never writes text. It returns a probability distribution per question.",
      "A Rust port of the model's protocol, checked against the official server: 40 of 40 matching top answers.",
      "A three-question tick cut from about 3.0 s to about 0.95 s on an M1 Pro.",
    ],
    facts: [
      { label: "Model size", value: "4B" },
      { label: "Tick", value: "~0.95 s" },
      { label: "Runs", value: "Offline" },
    ],
    stack: ["Tauri 2", "Rust", "TypeScript", "llama.cpp (Metal)"],
    links: [{ label: "Source on GitHub", href: "https://github.com/ADAI-ALEX/jeb-depot" }],
    media: [
      {
        src: "/work/jeb-depot/hero.png",
        alt: "JEB Depot mid-mission: a pixel-art warehouse on the left and a panel of live decision probabilities on the right.",
        width: 1920,
        height: 1080,
        type: "pixel",
      },
      {
        src: "/work/jeb-depot/sim-risk.png",
        alt: "JEB Depot simulator showing move, risk and reroute probabilities for the current tick.",
        width: 1920,
        height: 1080,
        type: "pixel",
      },
    ],
    disclosure:
      "An independent demo built on JEB-4B, a decision model published by szybkie.ai.",
  },
  {
    slug: "glimmer",
    openSource: true,
    title: "Glimmer",
    start: "2026-11",
    dateLabel: "Nov 2026 to now",
    kind: "research",
    kindLabel: "Research lab",
    status: "active",
    statusLabel: "Active, open source",
    chapter: "Language models",
    pitch: "A lab for training small language models from scratch on a laptop, in Rust.",
    summary:
      "Tokenizer, data pipeline, transformer, training loop, optimiser, hyperparameter search, inference engine and a nine-screen terminal app, all written in Rust and all running locally. No Python, no pretrained weights, no model APIs. Models start from random weights.",
    points: [
      "Its first model is STEVIE: 13.8 million parameters, trained from scratch on one 16 GB MacBook Pro.",
      "Pretraining on 131M tokens took 2 h 51 min. Fine-tuning took 66 seconds.",
      "120 tests, including gradient checks and GPU against CPU agreement.",
      "STEVIE has the voice and knows when to stop talking. It does not have the sense.",
    ],
    facts: [
      { label: "Parameters", value: "13.8M" },
      { label: "Pretraining", value: "2 h 51 min" },
      { label: "Validation loss", value: "2.397" },
      { label: "Tokens per second", value: "13.5k" },
    ],
    stack: ["Rust", "Burn", "Metal", "Ratatui"],
    links: [{ label: "Source on GitHub", href: "https://github.com/ADAI-ALEX/glimmer-rs" }],
    media: [
      {
        src: "/work/glimmer/training.webp",
        alt: "Glimmer's training lab in a terminal during STEVIE's fine-tuning run: loss curves, learning rate, throughput and live samples.",
        width: 1440,
        height: 841,
        type: "screen",
      },
      {
        src: "/work/glimmer/chat.webp",
        alt: "Glimmer's chat screen in a terminal, with STEVIE streaming a reply.",
        width: 1440,
        height: 841,
        type: "screen",
      },
    ],
    disclosure:
      "Screens are unedited captures of the real binary. STEVIE's conversation corpus is synthetic dialogue written for the project by Claude.",
  },
];

/* -------------------------------------------------------------------------- */
/* Derived views                                                              */
/* -------------------------------------------------------------------------- */

export const byDate = [...projects].sort((a, b) => a.start.localeCompare(b.start));
export const byDateDesc = [...byDate].reverse();

export function getProject(slug: string): Project {
  const found = projects.find((project) => project.slug === slug);
  if (!found) throw new Error(`Unknown project: ${slug}`);
  return found;
}

export const nowBuilding = ["lockout", "glimmer"].map(getProject);
export const featured = getProject("jeb-depot");
export const selected = [
  "apex-terminal",
  "voice-agent",
  "spatial-memory-scanner",
  "hospitality-platform",
  "call-analyser",
].map(getProject);
export const research = [
  "reinforcement-learning",
  "acoustic-levitation",
  "holographic-display",
  "spatial-memory-scanner",
].map(getProject);

/** Archive filters. Each one is a plain predicate over the archive. */
export const filters: { id: string; label: string; test: (p: Project) => boolean }[] = [
  { id: "all", label: "All", test: () => true },
  { id: "running", label: "Running now", test: (p) => p.kind !== "studio" && (p.status === "active" || p.status === "live") },
  { id: "open", label: "Open source", test: (p) => Boolean(p.openSource) },
  { id: "products", label: "Products", test: (p) => p.kind === "product" },
  { id: "demos", label: "Demos and tools", test: (p) => p.kind === "demo" || p.kind === "tool" },
  { id: "research", label: "Research", test: (p) => p.kind === "research" },
];

export const counts = {
  total: projects.length,
  /** Products and labs running today. The studio itself is not counted. */
  running: projects.filter(filters[1].test).length,
  openSource: projects.filter(filters[2].test).length,
  research: projects.filter((p) => p.kind === "research").length,
};

/** The eight domains, each with the projects that prove it. */
export const domains: { label: string; note: string; slugs: string[] }[] = [
  { label: "AI", note: "Models, agents and the systems behind them.", slugs: ["adai-systems", "vantage-ai", "glimmer", "jeb-depot"] },
  { label: "Automation", note: "Operational work handed to software.", slugs: ["adai-systems", "vantage-ai", "call-analyser", "hospitality-platform"] },
  { label: "Machine Learning", note: "Systems that learn a policy instead of being given one.", slugs: ["glimmer", "reinforcement-learning", "acoustic-levitation"] },
  { label: "Computer Vision", note: "Reading the physical world through a camera.", slugs: ["lockout", "spatial-memory-scanner"] },
  { label: "Consumer Software", note: "Products for people, not for businesses.", slugs: ["lockout", "fitdawg"] },
  { label: "Voice", note: "Speech pipelines that run close to the machine.", slugs: ["voice-agent", "call-analyser"] },
  { label: "Spatial Computing", note: "Capturing real space and asking how to show it.", slugs: ["spatial-memory-scanner", "holographic-display"] },
  { label: "Fintech", note: "Strategy tools with the risk rules built in.", slugs: ["apex-terminal"] },
];

/**
 * Relationships between projects, each with the reason it exists.
 * Drawn as the edges of the lineage network.
 */
export const relations: { from: string; to: string; why: string }[] = [
  { from: "adai-systems", to: "vantage-ai", why: "The agency work, turned into a product." },
  { from: "vantage-ai", to: "voice-agent", why: "The voice architecture Vantage needed became its own project." },
  { from: "adai-systems", to: "voice-agent", why: "Voice agents were part of the agency's work." },
  { from: "voice-agent", to: "call-analyser", why: "The same on-device speech-to-text, pointed at recorded calls." },
  { from: "adai-systems", to: "hospitality-platform", why: "Software for small businesses." },
  { from: "adai-systems", to: "reinforcement-learning", why: "The first project that was research, not a build." },
  { from: "reinforcement-learning", to: "acoustic-levitation", why: "Reinforcement learning again, with real physics as the environment." },
  { from: "reinforcement-learning", to: "apex-terminal", why: "Decisions under uncertainty, this time in markets." },
  { from: "reinforcement-learning", to: "jeb-depot", why: "From training a policy to questioning a decision model." },
  { from: "adai-systems", to: "fitdawg", why: "The studio's first consumer product." },
  { from: "fitdawg", to: "lockout", why: "The same idea, inverted: exercise as the price, not the score." },
  { from: "lockout", to: "spatial-memory-scanner", why: "Both read the physical world through a phone camera." },
  { from: "spatial-memory-scanner", to: "holographic-display", why: "Capturing 3D space, then asking how to display it." },
  { from: "jeb-depot", to: "glimmer", why: "Local models on Apple silicon, in Rust." },
  { from: "reinforcement-learning", to: "glimmer", why: "Training models from nothing, at a different scale." },
];

/**
 * STEVIE's real replies to held-out evaluation prompts. First sample,
 * unedited, exactly as published in the Glimmer repository. Never alter them.
 */
export const stevie: { prompt: string; reply: string }[] = [
  { prompt: "How are you going, mate?", reply: "A week or two, mate. You'll get a bit of the chat, so you'll be in it at night." },
  { prompt: "What should I learn first in Rust?", reply: "Ha, a classic classic. If it's worth taking a few minutes off of the world, that's all about it." },
  { prompt: "I've had a really rubbish day.", reply: "Ah, that's a great way to start. What's on your mind?" },
  { prompt: "What's your favourite animal?", reply: "I'm a little of your own animal. What are you holding up?" },
  { prompt: "Are you a human or a computer?", reply: "I'm a big fan, and I can't read it. I'll just watch about people who are in the city. What's your mind?" },
  { prompt: "What does chockers mean?", reply: "Try to chock an AI, or a rip with a chock in front of you. Make sure you can." },
  { prompt: "Are koalas dangerous?", reply: "Sounds like you're not afraid, but they're friendly. What are you in the mornings?" },
  { prompt: "What is 7 times 8?", reply: "A. It's a hundred and a half of the year, and the longest-running is 8 times 9." },
];
