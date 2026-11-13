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
  /** The case study. Every line traces back to the inventory. */
  story?: Story;
};

export type Story = {
  /** Why the project exists, in a sentence or two. */
  problem?: string;
  /** What was made, as short factual points. */
  built?: string[];
  /** How it works. */
  how?: string[];
  /** Where it ended up. */
  outcome?: string;
  /** Limits and caveats, stated plainly. */
  honest?: string[];
};

export const projects: Project[] = [
  {
    slug: "adai-systems",
    story: {
      outcome:
        "Still the foundation. The studio stays small, builds its own tools, and keeps the research that did not become a product.",
    },
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
    story: {
      problem:
        "Every client build repeated the same shape: a chatbot here, a voice agent there, a set of automations behind them, and no single place to deploy or manage any of it.",
      outcome:
        "Discontinued. The problem is real, but the product surface needed to solve it properly was far larger than a studio this size could carry alongside client work. What survived is the voice architecture it needed, which became its own project.",
    },
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
    story: {
      problem:
        "A set of experiments, not a product: environments built to study how an agent learns to act when it is given an objective and nothing else.",
      how: [
        "Model 1, an 8-sensor radar. It only knew what was directly next to it, so it acted blind.",
        "Model 2, ray casting. Longer-range vision, so it could see walls before hitting them.",
        "Model 2.1, a reward rebalance. The agent had been getting stuck in infinite loops because the penalties made it afraid to backtrack.",
        "Model 3, spatial awareness. It can plan a path out of U-shaped traps and dense clusters of obstacles.",
        "Predator and prey are two separate networks. The library is built for single agents, so a custom loop lets them take turns learning from each other.",
      ],
      outcome:
        "Research. The interesting results were rarely the scores. They were the strategies that appeared without being designed.",
    },
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
    story: {
      problem:
        "Language apps hold attention with streaks, levels and leagues. FitDawg applied the same mechanics to exercise. The bet was social: friends, competition and visible standings, on the theory that accountability to other people outlasts accountability to yourself.",
      built: [
        "Streaks, XP and levels, gems and a shop, daily quests and an animated mascot.",
        "Weekly leagues with friends.",
        "GPS workout tracking.",
        "AI meal scanning from a photo.",
      ],
      outcome:
        "No longer in active development, and it may return. The idea did not go away: it reappeared, inverted, in Lockout, where exercise is the price of a distraction and not a score on a leaderboard.",
    },
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
    story: {
      how: [
        "Pressure at any point is the sum of every transducer treated as a point source (the Rayleigh integral).",
        "The Gor'kov potential turns that pressure field into the force on a small sphere.",
        "A Gymnasium environment wraps the physics so an agent can set each transducer and see what happens.",
        "The reward favours liftable mass first, then a deep potential well, a stiff trap and distance. It penalises instability and unrealistic sound pressure.",
        "Transducers can run at different frequencies, summed correctly.",
      ],
      outcome: "Research. No results are published in the repository, so none are claimed here.",
    },
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
    story: {
      problem:
        "Hosted voice AI is fast to adopt and hard to own. Every call goes through someone else's stack, at their latency, under their pricing, with their retention policy.",
      built: [
        "A phone-style agent you talk to through the browser, by holding a button or the space bar.",
        "Speech-to-text with Whisper and text-to-speech with Piper, both running on the machine, with a choice of UK voices.",
        "A local database of customers, products, depots and bookings for the agent to work against. The data is fictional.",
        "A live activity feed showing every lookup the agent makes and what came back.",
      ],
      how: [
        "One autonomous turn can ask, look something up, quote, confirm and book.",
        "Interrupt it mid-reply and it stops, remembers what it was doing, and offers to pick the thread back up.",
        "Slow lookups get a spoken \"let me check that for you\" while the work happens.",
        "What the agent knows about the business lives in editable context, so its behaviour changes without a restart.",
        "A second build tested the same idea as a streaming pipeline over WebRTC.",
      ],
      outcome: "A working demo, built speculatively. Not a client engagement.",
      honest: [
        "In the later version the language model is a hosted one. The audio and the data stay on the machine.",
      ],
    },
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
    story: {
      built: [
        "It watches a folder for new call recordings.",
        "Each one is transcribed on the machine.",
        "Claude writes a report for each call from the transcript.",
        "Results are read in a web UI and exported as CSV or as HTML reports.",
      ],
      how: [
        "It runs on locked-down Windows machines without admin rights, which rules out most installers and services.",
      ],
      outcome: "Built in May 2026.",
    },
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
    story: {
      problem:
        "Systematic trading research is normally split across a terminal for looking at markets and a notebook for testing ideas about them.",
      built: [
        "A live terminal of dockable widgets: charts, watchlist, positions, a profit and loss calendar, risk status and the system log.",
        "A strategy editor. A strategy is a short script that runs once per bar and sets a signal.",
        "A backtester that replays strategies over bundled local data with no network calls.",
        "A compare view that overlays strategies, with a Monte Carlo estimate of the chance of passing or breaching a prop challenge.",
        "A live book: a tested strategy is promoted to the engine, which trades it under the same risk rules.",
      ],
      how: [
        "Every entry passes a risk engine first: kill switch, daily and weekly loss limits, position caps, news blackouts and total open risk. It can shrink a position and never grows one.",
        "On prop accounts a second guard samples equity every second and flattens everything before a drawdown limit is reached.",
        "Claude reviews signals and the portfolio and returns recommendations. It has no route to the broker.",
        "If the AI errors or times out, the answer is no trade.",
        "Demo by default. Live trading needs an explicit flag.",
      ],
      outcome: "Open source under the MIT licence, and still being worked on.",
      honest: [
        "Educational software. Leveraged trading can lose you more than you expect, and nothing here is a claim about performance.",
      ],
    },
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
    story: {
      problem: "Could a true volumetric display be built from a flat array of lasers making points of plasma in the air?",
      how: [
        "The study worked through the physics, the laser choices, the limits the geometry puts on the image, and what it would realistically cost.",
      ],
      outcome:
        "The conclusion was that a swept-volume persistence-of-vision LED display is the practical first step. Nothing was built.",
    },
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
    story: {
      built: [
        "Table booking for guests.",
        "Staff management for the venue.",
        "A live demo site that shows both.",
      ],
      outcome: "A demo, built speculatively for independent pubs, restaurants and cafés. Not a client engagement.",
    },
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
    media: [
      {
        src: "/work/hospitality-platform/booking-date.webp",
        alt: "Table booking, step one: choose a party size and pick a date from a calendar.",
        width: 1100,
        height: 1365,
        type: "screen",
      },
      {
        src: "/work/hospitality-platform/booking-time.webp",
        alt: "Table booking, step two: choose a lunch or dinner time for the chosen date.",
        width: 1100,
        height: 727,
        type: "screen",
      },
    ],
    disclosure: "Real captures of the demo's booking flow. The demo venue's name and branding are left out.",
  },
  {
    slug: "spatial-memory-scanner",
    story: {
      problem:
        "Capturing a room is the easy part. The question is what it feels like to walk back into it later, at the scale you recorded it.",
      built: [
        "A capture page that runs in Chrome on an Android phone. No app to install.",
        "A live overlay that paints the room in as you scan and points you at what you have not covered yet.",
        "A walkthrough viewer on the laptop: first person, up and down stairs, with footsteps and each area's own ambient sound.",
      ],
      how: [
        "Three depth paths are chosen automatically: the phone's own depth map, a fan of hit-test rays, and a monocular depth model fitted to real scale every frame.",
        "The walkable floor comes from the path the person actually walked. That gives correct stairs and natural bounds with no collision geometry.",
        "Sound is pooled by place in 2 m cells, and each area keeps only its best few seconds, crossfaded into one loop.",
        "Eye-dome lighting, a depth-only pass, makes the raw point cloud read as surfaces.",
        "The scan streams to disk while you walk, so an interrupted scan is still a usable one.",
        "A check script asserts the floor directly. Level ground matches the walked path within 7 cm, 1.3 cm on average.",
      ],
      outcome: "On hold. The laptop is the only server and scans never leave it.",
      honest: [
        "You can only walk where the phone was carried.",
        "Depth is noisy past a few metres and poor on glass, mirrors and matte black.",
        "Android and Chrome only. Safari does not expose what this needs.",
      ],
    },
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
    story: {
      problem: "Traditional app blockers tell you no, so you turn them off. Lockout asks you to earn it.",
      built: [
        "Pick the apps that take your time. Each gets a daily allowance that drains only while you are in the app.",
        "When it runs out you get a wall, not the feed.",
        "Push-ups, squats and jumping jacks, counted through the camera.",
        "Or a 1 km walk, measured by GPS and checked against your step count.",
        "Finish and you have earned more time. A streak counts the days protection stays on.",
      ],
      how: [
        "Built on Apple's Screen Time frameworks, with three extensions and a custom shield screen.",
        "One idempotent reconcile recomputes what is locked from the rules and the live grants, so a missed event or a crash cannot leave the lock out of step.",
        "Everything the app and its extensions share fails closed: a read it cannot trust resolves to locked.",
        "Elapsed time is measured against two clocks. Winding the device clock back cannot extend an unlock.",
        "Pose detection runs on the phone and returns thirteen joints. The camera frame is not kept.",
        "Rep counters are tested against synthetic pose sequences, for both failure directions: counting a half rep and refusing a good one.",
      ],
      outcome: "Live on the App Store since September 2026.",
      honest: [
        "Rep counting is a product feature, not a fitness or medical assessment. A rep can be missed or miscounted.",
      ],
    },
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
      },      {
        src: "/work/lockout/rules.webp",
        alt: "Lockout rules screen: five locked apps, each with its own challenge and daily allowance.",
        width: 880,
        height: 1912,
        type: "phone",
      },
      {
        src: "/work/lockout/squats.webp",
        alt: "Lockout squat challenge screen showing what the camera sees and how to set up.",
        width: 880,
        height: 1912,
        type: "phone",
      },
      {
        src: "/work/lockout/history.webp",
        alt: "Lockout history screen: a week of completed challenges and the minutes they earned.",
        width: 880,
        height: 1912,
        type: "phone",
      },
    ],
  },
  {
    slug: "jeb-depot",
    story: {
      problem:
        "Some software needs a calibrated probability, not a sentence. A robot deciding whether to detour round a forklift is one example. JEB Depot is a playable demo of that idea.",
      built: [
        "A seeded warehouse simulation with four levels, from a training depot to a night shift with short sensors and urgent deadlines.",
        "A side panel that shows every probability the model produced for the current tick, its confidence and how long it took.",
        "Three policies: take the most likely answer, sample from the distribution, or act only when confident enough for the risk the model itself reports.",
        "A rules-based controller and a manual mode on the same missions.",
        "Replay, analysis and benchmark screens.",
      ],
      how: [
        "Code owns the geometry: routes, distances and where the forklifts will be. The model only judges.",
        "Each tick asks up to four typed questions: which job next, reroute or not, which way to move, and how risky that is.",
        "The model runs in a local server on the Mac's GPU, bound to loopback. After one download the game works offline.",
        "The protocol was ported to Rust and checked against the official server: 221 tokenizer test strings with no mismatches, and 40 of 40 matching top answers.",
        "Priming one slot with the shared game state took a three-question tick from about 3.0 s to about 0.95 s on an M1 Pro.",
        "The whole screen is a 480 by 270 software framebuffer, scaled by whole numbers. That is also what lets the tests render real screens.",
      ],
      outcome: "Open source under the MIT licence.",
      honest: [
        "JEB-4B is a research model published by szybkie.ai. This is an independent demo, and in it the model only steers a simulated robot.",
      ],
    },
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
      },      {
        src: "/work/jeb-depot/boot.png",
        alt: "JEB Depot boot screen: checking the local runtime, verifying the model and warming up the GPU.",
        width: 1920,
        height: 1080,
        type: "pixel",
      },
      {
        src: "/work/jeb-depot/summary.png",
        alt: "JEB Depot mission summary: deliveries, collisions, battery and score for the run.",
        width: 1920,
        height: 1080,
        type: "pixel",
      },
      {
        src: "/work/jeb-depot/analysis.png",
        alt: "JEB Depot analysis screen: latency, confidence and calibration for a recorded run.",
        width: 1920,
        height: 1080,
        type: "pixel",
      },
      {
        src: "/work/jeb-depot/bench.png",
        alt: "JEB Depot benchmark screen: inference latency on this machine and the model against the rules baseline.",
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
    story: {
      problem:
        "What does it take to train a language model from nothing, on a laptop, with every part of the stack written by hand in one language?",
      built: [
        "A byte-level BPE tokenizer and a data pipeline with licences, checksums, deduplication and leak-free splits.",
        "A transformer, a training loop and three optimisers.",
        "Hyperparameter search: random, Bayesian and successive halving.",
        "An inference engine with cached decoding and streaming chat.",
        "Evaluation that stores every generated response.",
        "A nine-screen terminal laboratory: training dashboard, chat, models, datasets, experiments, evaluation, hardware and settings.",
      ],
      how: [
        "Ten crates. Only the ones that touch tensors depend on Burn, which supplies the maths and the GPU kernels.",
        "Training runs on the Apple GPU through Metal. A pure-Rust CPU fallback exists and is never silently substituted. Both are verified numerically at start-up.",
        "The model is a small modern transformer: 6 layers, 384 wide, 6 heads, a 512-token context and an 8,192-token vocabulary.",
        "Stage one is pretraining on 137M tokens of openly licensed English: simple stories, Simple English Wikipedia and 28 Australian public-domain books.",
        "Stage two is fine-tuning on 628 original conversations, with loss counted only on the model's own turns.",
        "Training can stop and resume exactly. That is verified against an uninterrupted run.",
        "For chat, the CPU is faster than the GPU on this machine, so the lab picks it automatically.",
      ],
      outcome:
        "STEVIE trained in under three hours on one MacBook Pro. After fine-tuning, every reply closes its turn (none did before), and no reply quotes eight or more words of its training data.",
      honest: [
        "STEVIE has the voice and knows when to stop talking. It does not have the sense. It gets arithmetic wrong and forgets a name it was just told.",
        "Australian vocabulary shows up in 18% of replies. The corpus it learned from manages 44%.",
        "The first hyperparameter study was mis-designed and had to be rebuilt. Both are documented.",
        "The conversation corpus is synthetic dialogue written for the project by Claude.",
        "It is a demonstration of training on a laptop, not a competitor to foundation models.",
      ],
    },
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
      },      {
        src: "/work/glimmer/training-finished.webp",
        alt: "Glimmer's training lab at the end of the run: the monitor flags overfitting and early stopping is logged.",
        width: 1440,
        height: 841,
        type: "screen",
      },
      {
        src: "/work/glimmer/models.webp",
        alt: "Glimmer's models screen: architecture and the full training lineage from random weights to fine-tuning.",
        width: 1440,
        height: 841,
        type: "screen",
      },
      {
        src: "/work/glimmer/evaluation.webp",
        alt: "Glimmer's evaluation screen: metrics and every generated response for each model.",
        width: 1440,
        height: 841,
        type: "screen",
      },
      {
        src: "/work/glimmer/hardware.webp",
        alt: "Glimmer's hardware screen: verified backends and live GPU counters during pretraining.",
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

/** Projects linked to this one, each with the reason for the link. */
export function linksOf(slug: string): { project: Project; why: string }[] {
  return relations
    .filter((relation) => relation.from === slug || relation.to === slug)
    .map((relation) => ({
      project: getProject(relation.from === slug ? relation.to : relation.from),
      why: relation.why,
    }));
}

/** The projects either side of this one in date order, for paging through the archive. */
export function neighboursOf(slug: string): { previous?: Project; next?: Project } {
  const index = byDate.findIndex((project) => project.slug === slug);
  return { previous: byDate[index - 1], next: byDate[index + 1] };
}
