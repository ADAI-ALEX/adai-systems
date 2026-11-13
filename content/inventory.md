# ADAI Systems: content inventory

The only source the site may draw facts from. Compiled 12 November 2026 from the live site, the product sites, GitHub, the App Store listing and Alex's answers at Checkpoint 1.

This repo is public, so this file holds publishable facts only. Recon notes that should stay private (infrastructure, excluded repos, source mapping) live in `content/notes.private.md`, which is gitignored.

**Marking**

- `APPROVED`: confirmed by Alex or read from a primary source, and cleared for the site.
- `DEFAULT`: Alex has not answered yet. The safe default shown is in use until he does.
- `TODO(alex)`: missing. Must not appear on a shipped page.

---

## 1. Rules for every page

1. Name no clients anywhere: not in copy, alt text, metadata or image filenames. Speculative work is presented as a demo or a concept.
2. No user counts, ratings, revenue, testimonials, client logos or awards.
3. Lockout: the site may say "Live on the App Store" (since September 2026) with a link to the listing. Nothing else about its numbers. No pricing statement until Alex confirms one (`DEFAULT`).
4. Real products get real screenshots. Generated imagery is for concepts only and is labelled as a concept.
5. No em dashes in copy, alt text or metadata.
6. No analytics. The privacy notice says the site collects nothing, and that stays true.
7. Privacy and Terms carry over word for word at the same URLs, with one permitted change: em dashes are swapped for other punctuation.
8. Registered address, company number and governing law stay "to be confirmed", exactly as the legal pages say now.

---

## 2. Studio facts

| Fact | Value | Marking |
|---|---|---|
| Name | ADAI Systems | APPROVED |
| What it is | Independent technology studio building AI systems, software products and experimental research | APPROVED |
| Headline | "Building intelligent software." | APPROVED |
| Line | "A system for building systems." | APPROVED |
| Founded | December 2024. This is the founding of the studio, not a portfolio piece. | APPROVED |
| Operator line | "ADAI Systems is a technology studio operated by FitDawg Ltd." | APPROVED |
| Contact | alex@adai.systems. "One address, read by a person." | APPROVED |
| Who | "Alex". First person, short: a builder who ships across AI, automation and consumer apps. | DEFAULT (surname not confirmed, so not used) |
| Studies | Left out | DEFAULT |
| Photo | None for now. The About section must work without one and accept one later. | APPROVED |
| What clients can hire the studio for | Custom AI, automation and software | APPROVED (from the brief) |

**Product sites:** https://lockout.adai.systems and https://fitdawg.adai.systems. Both are separate sites with their own legal pages.

**URLs that must keep resolving:** `/privacy`, `/terms`, `/work/adai-systems`, `/work/vantage-ai`, `/work/reinforcement-learning`, `/work/fitdawg`, `/work/voice-agent`, `/work/apex-terminal`, `/work/spatial-memory-scanner`, `/work/lockout`.

---

## 3. Projects

Fourteen entries, oldest first. Slugs marked (existing) are live URLs today.

### 3.1 ADAI Systems · `adai-systems` (existing)

- **Pitch:** The studio everything else comes out of.
- **Description:** Founded in December 2024 as an AI agency building custom systems for businesses: assistants, chatbots, voice agents, automated workflows and the software around them. Most later projects started as a problem met in that work.
- **Type / status:** Studio. Active.
- **Dates:** December 2024 to now.
- **Media:** Wordmark and mark SVGs.
- **Note:** A founding entry, not a case study. Do not pad it.

### 3.2 Vantage AI · `vantage-ai` (existing)

- **Pitch:** One workspace for a business's entire AI surface.
- **Description:** An attempt to turn the agency work into a product: one interface to configure, deploy and run a business's chatbots, voice agents and automations. Discontinued because the product surface was too large to carry alongside client work. The voice architecture it needed became its own project.
- **Type / status:** Platform. Discontinued.
- **Dates:** November 2025.
- **Media:** None. Text only.
- **Note:** Short archive entry using only the above. Do not pad it.

### 3.3 Reinforcement Learning · `reinforcement-learning` (existing)

- **Pitch:** Teaching agents to make decisions, then watching what emerges.
- **Description:** Two projects built with Python, Stable Baselines3 (PPO) and Gymnasium.
  - *Obstacle avoidance:* an agent learns to cross a grid of random obstacles. Four iterations: an 8-sensor radar baseline, ray-cast vision, a reward rebalance that fixed infinite-loop behaviour, and a final spatially aware model that can plan out of U-shaped traps.
  - *Predator vs prey:* two networks trained against each other in one arena with a custom alternating training loop, because Stable Baselines3 is single-agent.
- **Type / status:** Research.
- **Dates:** February 2026.
- **Stack:** Python, Stable Baselines3 (PPO), Gymnasium.
- **Links:** https://github.com/ADAI-ALEX/AI-RL-Projects (public, MIT).
- **Media (real):** `P01_Demo.gif`, `P01_Controller.PNG`, `P02_Demo.gif`, `P02_Controller.PNG` from the repo.

### 3.4 FitDawg · `fitdawg` (existing)

- **Pitch:** Exercise, structured like a game you do not want to lose.
- **Description:** A gamified fitness app: streaks, XP and levels, gems and a shop, daily quests, weekly leagues with friends, an animated mascot, GPS workout tracking and AI meal scanning from a photo. The idea later reappeared, inverted, in Lockout.
- **Type / status:** Consumer app. Discontinued, may return.
- **Dates:** March 2026 to August 2026.
- **Stack:** Expo (React Native), Supabase, TanStack Query, Zustand, zod, react-native-maps, OpenAI for the meal scan.
- **Links:** https://fitdawg.adai.systems. **No Google Play link.**
- **Media:** App icon and mascot art. No device screenshots yet.
- **Open:** Whether it was ever published. `DEFAULT`: the site says nothing about store availability.

### 3.5 Acoustic Levitation RL · `acoustic-levitation`

- **Pitch:** A physics simulator where an RL agent searches for the transducer set-up that lifts the most.
- **Description:** First-principles wave acoustics (Rayleigh integral point-source summation, Gor'kov potential) simulate the radiation force on a small particle. A Gymnasium environment wraps the physics, and SAC or PPO agents are rewarded for liftable mass, well depth and trap stiffness, and penalised for instability and unrealistic pressure. 2D and 3D visualisation.
- **Type / status:** Research.
- **Dates:** April 2026.
- **Stack:** Python, stable-baselines3 (SAC, PPO), Gymnasium, matplotlib, pyvista.
- **Links:** https://github.com/ADAI-ALEX/Acoustic-Levitation-RL (public).
- **Media:** None. No results are published in the repo, so the site claims none.

### 3.6 Voice Agent · `voice-agent` (existing)

- **Pitch:** A voice pipeline that does not have to leave the machine.
- **Description:** Local voice pipeline research (May 2026) that turned into a working phone agent demo: an AI phone agent built for a UK construction and waste business. Speech-to-text and text-to-speech run on the machine (Whisper and Piper with UK voices). The agent works through a call in one autonomous turn: ask, look things up, quote, confirm, book. It can be interrupted mid-reply and picks the thread back up. A second build tested the same idea as a Pipecat cascade pipeline over WebRTC.
- **Type / status:** Demo.
- **Dates:** May 2026.
- **Stack:** Python, FastAPI (server-sent events), faster-whisper, Piper TTS, SQLite, tool-calling agent loop. Second build: Pipecat, WebRTC.
- **Also true of the demo (from its private README):**
  - You talk to it through the browser by holding a button or the space bar.
  - It works against a local database of customers, products, depots and bookings. The data is fictional.
  - A live activity feed shows every lookup the agent makes and what came back.
  - Slow lookups get a spoken "let me check that for you" while the work happens.
  - What the agent knows about the business lives in editable context, so its behaviour changes without a restart.
- **Why it exists (from the old site):** hosted voice AI is fast to adopt and hard to own. Every call goes through someone else's stack, at their latency, under their pricing, with their retention policy.
- **Links:** None. Source is private.
- **Media:** None yet.
- **Open:** Alex has not confirmed that the old "Voice Agent Architecture" entry and the phone agent are the same work. `DEFAULT`: merged into this one entry, because both date from May 2026 and no other voice work exists in the record.
- **Careful:** in the demo's later version the language model is hosted, and only the audio and data stay local. Do not describe the whole pipeline as fully local.

### 3.7 Call Recording Analyser · `call-analyser`

- **Pitch:** Drop call recordings in a folder. Get a written report for each one.
- **Description:** A local Python and Flask desktop tool that watches a folder of customer service call recordings, transcribes them on-device with faster-whisper and uses Claude to write a report per call. Web UI, CSV export and HTML reports. Built to run on locked-down Windows machines without admin rights.
- **Type / status:** Tool. Built May 2026.
- **Dates:** May 2026.
- **Stack:** Python, Flask, faster-whisper, Claude.
- **Links:** None. Source is private.
- **Media:** None.
- **Source:** Alex's description at Checkpoint 1. Name no client and no staff.

### 3.8 Apex Terminal · `apex-terminal` (existing)

- **Pitch:** Write a trading strategy in the browser, backtest it offline, and promote it to a live book behind a hard risk gate.
- **Description:** A browser trading terminal. Strategies are short scripts in a sandboxed Python-like language. The backtester replays them over bundled local data with no network calls. A compare view overlays strategies and runs a Monte Carlo estimate of prop-challenge pass and breach probability. A Python engine trades the promoted strategy through a broker API, with a separate MetaTrader 5 bridge. Claude reviews signals and the portfolio but has no route to the broker: Python places every order, every entry passes the risk engine, and any AI error means no trade.
- **Type / status:** Fintech. **Open source** (MIT).
- **Dates:** June 2026 to now.
- **Stack:** Python, FastAPI, Next.js, SQLite, MQL5, Claude (advisory only).
- **Links:** https://github.com/ADAI-ALEX/apex-terminal
- **Media:** None yet. Could be captured from a local run of the backtester, which needs no broker credentials.
- **Open:** Name. `DEFAULT`: "Apex Terminal", which matches the repo name and the existing URL.
- **Careful:** educational software with a risk warning in its README. The site makes no performance claims.

### 3.9 Holographic Display Study · `holographic-display`

- **Pitch:** Could you build a real volumetric display? A feasibility study.
- **Description:** A feasibility study (June 2026) into a flat-array laser-plasma volumetric display: the physics, the laser choices, the geometry limits and realistic costs. The conclusion was that a swept-volume persistence-of-vision LED display is the practical first step.
- **Type / status:** Research.
- **Dates:** June 2026.
- **Media:** No images exist. A generated illustration may be used if it is clearly framed as a concept, or typography alone.
- **Source:** Alex's description at Checkpoint 1. Short entry only.

### 3.10 Hospitality Platform · `hospitality-platform`

- **Pitch:** A booking and staff platform for independent pubs.
- **Description:** A staff management and table booking system for independent pubs, restaurants and cafés, shown as a live demo site.
- **Type / status:** Demo.
- **Dates:** June 2026.
- **Links:** None. Source is not public, and the demo URL carries a venue name, so it is not linked.
- **Media (real):** two captures of the demo's table booking flow (choose a date and party size, choose a time). Taken with the site header, navigation and footer hidden, so no venue name, logo or photography shows. The booking details step is not used because its consent line names the venue.
- **Careful:** a speculative demo. Not a client engagement.

### 3.11 Spatial Memory Scanner · `spatial-memory-scanner` (existing)

- **Pitch:** Scan a room now. Walk back into it later.
- **Description:** Scan a real space using only Chrome on an Android phone (WebXR with ARCore depth, no app install), then walk through it in 3D on a laptop: up the stairs, with the camera following the real floor, hearing each area's own ambient sound placed in space. Local only: the laptop is the server and scans never leave it.
  - Three depth paths chosen automatically: WebXR depth sensing, ARCore hit-test rays, and a monocular depth model fitted to metric scale every frame.
  - The walkable floor comes from the path the person actually walked, which gives correct stairs and natural bounds with no collision geometry.
  - Audio is pooled by place in 2 m cells and crossfaded into one loop per region.
  - Eye-dome lighting makes the raw point cloud read as surfaces.
- **Type / status:** Research. On hold.
- **Dates:** July 2026.
- **Stack / tags:** WebXR, ARCore, JavaScript (no bundler), onnxruntime-web, WebGL. Tags: WebXR, ARCore, Spatial computing, Computer vision.
- **Links:** None. Source is private.
- **Media:** None yet.
- **Correction:** the old site said iPhone LiDAR. That was wrong and is dropped.

### 3.12 Lockout · `lockout` (existing)

- **Pitch:** Stop scrolling. Start earning it.
- **Description:** An iPhone app that puts distracting apps behind a physical challenge. Each protected app gets a daily allowance that drains only while you use it. When it runs out you hit a wall. Do the push-ups, squats or jumping jacks, counted by on-device pose detection through the camera, or do a 1 km GPS walk. Finish and you earn more time. A streak counts the days protection stays on.
- **Challenges (complete list):** push-ups, squats, jumping jacks, and the 1 km GPS walk.
- **How it works:**
  - Built on Apple's Screen Time frameworks, with three extensions and a custom shield screen.
  - One idempotent reconcile recomputes what is locked, so no missed event can leave the lock out of step.
  - Shared state fails closed: any read it cannot trust resolves to "locked".
  - A trusted clock measures against wall time and uptime, so changing the device clock cannot extend an unlock.
  - Pose detection runs on the phone. Camera frames are measured and released. Nothing is recorded or uploaded.
  - Rep counters are tested against synthetic pose sequences. 484 unit tests and 38 UI tests.
- **Type / status:** Consumer app. Active. **Live on the App Store** since September 2026.
- **Dates:** August 2026 to now.
- **Stack:** Swift, SwiftUI, Screen Time (FamilyControls, ManagedSettings, DeviceActivity), Vision, AVFoundation, Core Location, RevenueCat, Supabase.
- **Links:** https://lockout.adai.systems and https://apps.apple.com/app/id6804702332
- **Media (real):** raw App Store screenshots at 1320 × 2868: home, rules, push-ups, squats, jumping jacks, challenge verified, walking, history.

### 3.13 JEB Depot · `jeb-depot`

- **Pitch:** A pixel-art warehouse where every robot decision is made by a 4-billion-parameter model running locally on a Mac.
- **Description:** A playable demo built on JEB-4B, a decision model published by szybkie.ai. The model never writes text. Each tick the game asks it a few typed questions about what the robot sees (which job next, reroute or not, which way to move, how risky), reads back a probability distribution for each, and shows those probabilities live in the HUD. Three policies turn distributions into actions, and a rules-based controller plays the same seeded missions so the model can be measured against a baseline. Replay, analysis and benchmark screens are built in. Everything runs locally on llama.cpp with Metal.
- **Engineering highlights:**
  - A Rust port of the model's protocol, checked against the official server: 221 tokenizer test strings with 0 mismatches, 40 of 40 matching top answers.
  - A priming technique that took a three-question tick from about 3.0 s to about 0.95 s on an M1 Pro.
  - The whole screen is a deterministic 480 × 270 software framebuffer, which also lets the tests render real screens.
- **Type / status:** Demo. Open source (MIT).
- **Dates:** September 2026.
- **Stack:** Tauri 2, Rust, TypeScript, llama.cpp (Metal).
- **Links:** https://github.com/ADAI-ALEX/jeb-depot
- **Media (real):** seven screenshots from the repo: hero, boot, simulator, summary, replay, analysis, bench.
- **Careful:** the model is third-party work. The site must say this is an independent demo built on JEB-4B.

### 3.14 Glimmer · `glimmer` (headline project, full case study)

- **Name:** "Glimmer". The demo model is "STEVIE".
- **Pitch:** A lab for training small language models from scratch on a laptop, in Rust.
- **Lead with the lab.** STEVIE is the hook inside the story.
- **What it does:** Builds, trains, evaluates and chats with small language models. Tokenizer, data pipeline, transformer, training loop, optimiser, hyperparameter search, inference engine and a full-screen terminal app are all written in Rust and run locally. No Python, no pretrained weights, no external model APIs. Models start from random weights. A new model is a TOML file and a new dataset is a source manifest.
- **STEVIE:** a 13.8 million parameter conversational model with an Australian personality, trained from scratch on one 16 GB M1 Pro MacBook Pro. An original fictional character.
- **How it works:**
  - Ten crates: core, tokenizer (byte-level BPE), data, models, training, optimisation, inference, evaluation, bench, terminal.
  - Tensor maths, autodiff and GPU kernels through Burn. Training on the Apple GPU through Metal, with a pure-Rust CPU fallback that is never silently substituted. Both backends are verified numerically at start-up.
  - Transformer: pre-norm RMSNorm, rotary position embeddings, fused causal attention, SwiGLU, tied embeddings. STEVIE: 6 layers, d_model 384, 6 heads, 512 context, 8,192-token vocabulary.
  - Two-stage training: pretraining on a 137M-token corpus of openly licensed text (TinyStories V2, Simple English Wikipedia, 28 Australian public-domain books), then fine-tuning on 628 original conversations with loss on the assistant's turns only.
  - Exact resumption, verified against an uninterrupted run.
  - Hyperparameter search: random, TPE and successive halving.
  - Inference: KV-cached decoding with prefix reuse across chat turns.
  - A nine-screen terminal laboratory built with Ratatui.
  - 120 tests, including finite-difference gradient checks and Metal versus CPU agreement.
- **Measured results (all on one 16 GB M1 Pro):**
  - Pretraining: 16,000 steps, 131.1M tokens seen, 2 h 51 min, 13.5k tokens/s, best validation loss 2.397 (perplexity 11.0).
  - Fine-tuning: best at step 33, 66 seconds, best validation loss 3.898.
  - Hyperparameter search: 24 trials in 4.5 minutes.
  - Evaluation on 40 held-out prompts × 3 seeds: 100% of replies close their turn (0% before fine-tuning). Australian vocabulary in 18% of replies against a corpus reference of 44%. No reply quotes 8 or more words of a training reply.
  - Training is about 5.5× faster on the GPU than the CPU. For chat the CPU wins: 590 tokens/s against 437 with the KV cache.
- **Real STEVIE exchanges (held-out prompts, first sample, unedited). These may be quoted exactly and must never be altered:**
  - "How are you going, mate?" → "A week or two, mate. You'll get a bit of the chat, so you'll be in it at night."
  - "What should I learn first in Rust?" → "Ha, a classic classic. If it's worth taking a few minutes off of the world, that's all about it."
  - "I've had a really rubbish day." → "Ah, that's a great way to start. What's on your mind?"
  - "What's your favourite animal?" → "I'm a little of your own animal. What are you holding up?"
  - "Are you a human or a computer?" → "I'm a big fan, and I can't read it. I'll just watch about people who are in the city. What's your mind?"
  - "What does chockers mean?" → "Try to chock an AI, or a rip with a chock in front of you. Make sure you can."
  - "Are koalas dangerous?" → "Sounds like you're not afraid, but they're friendly. What are you in the mornings?"
  - "What is 7 times 8?" → "A. It's a hundred and a half of the year, and the longest-running is 8 times 9."
- **The honest part, which is the point:** STEVIE has the voice and knows when to stop talking. It does not have the sense. It gets arithmetic wrong and forgets a name it was just told. That is what 14 million parameters and about 46k tokens of conversation buy. It is a demonstration of training and personality learning on a laptop, not a competitor to foundation models.
- **Worth stating:** the STEVIE conversation corpus is original synthetic dialogue written for the project by Claude, and the repo documents it.
- **Type / status:** Research lab. Active. Open source (Apache-2.0).
- **Dates:** November 2026.
- **Stack:** Rust, Burn, Metal (wgpu), Ratatui.
- **Links:** https://github.com/ADAI-ALEX/glimmer-rs
- **Media (real):** ten unedited terminal screenshots (training, training finished, chat, home, models, datasets, experiments, evaluation, hardware, settings), the transformer diagram and the pretraining loss curve.
- **Backstory:** none supplied. `DEFAULT`: tell the story from the repo only.

---

## 4. Groupings

- **Now building:** Lockout, Glimmer.
- **Selected work (case studies with real media):** Glimmer, Lockout, JEB Depot. Apex Terminal, Voice Agent, Hospitality Platform and Spatial Memory Scanner get case studies as media becomes available.
- **Research:** Reinforcement Learning, Acoustic Levitation RL, Holographic Display Study, Spatial Memory Scanner.
- **Not on the site:** Rizzly (`DEFAULT`: left out until Alex says yes. If yes, it goes in a lighter "Experiments" group, not with featured work). The lead-generation pipeline, the browser automation test and the shop site are out by Alex's decision.
- **To add later:** the NASA Space Apps Challenge 2026 entry, after the hackathon (from 14 November 2026).

**Domains and the projects behind them**

| Domain | Evidence |
|---|---|
| AI | ADAI Systems, Vantage AI, Glimmer, JEB Depot |
| Automation | ADAI Systems, Vantage AI, Call Recording Analyser, Hospitality Platform |
| Computer Vision | Lockout, Spatial Memory Scanner |
| Machine Learning | Glimmer, Reinforcement Learning, Acoustic Levitation RL |
| Consumer Software | Lockout, FitDawg |
| Fintech | Apex Terminal |
| Voice | Voice Agent, Call Recording Analyser |
| Spatial Computing | Spatial Memory Scanner, Holographic Display Study |

**Lineage:** Agency → AI platform → Machine learning → Fitness product → Voice → Trading systems → Hospitality → Spatial computing → Behavioural wellbeing → Decision models → Language models.

---

## 5. Decisions taken without a checkpoint

On 13 November 2026 Alex asked for the build to continue to a finished site without stopping. These calls were made on his behalf and can all be reversed.

1. **Direction.** Lab Terminal (A) as the base, with Orbit's draggable lineage map (C) as the archive on the home page, and Specimen's scale (B) on the contact band. All three directions stay viewable at `/directions` on preview deployments.
2. **Tweaks config.** No tuned config was supplied, so the baked tokens are the direction's own defaults. The tweaks bar stays available on preview deployments at `?tweaks=1`.
3. **Every project has a page.** All fourteen get a case study at `/work/[slug]`, so the eight existing URLs keep working and the archive has no dead rows. Depth follows what the inventory holds: Glimmer, Lockout and JEB Depot are full, Vantage AI and ADAI Systems are short on purpose.

## 6. Still open (defaults in use)

1. Glimmer backstory (why Rust, why Australian). Default: none.
2. Lockout pricing wording. Default: not stated.
3. FitDawg: published then delisted, or never published. Default: not stated.
4. Voice Agent Architecture and the phone agent: same work? Default: merged.
5. "Apex Terminal" or "Apex Algo". Default: Apex Terminal.
6. Rizzly: yes or no. Default: no.
7. Surname and studies in About. Default: "Alex", no studies.
8. Registered address, company number, governing law. Default: unchanged.
