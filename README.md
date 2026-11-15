<p align="center"><img src="docs/assets/banner.png" alt="ADAI Systems: Building intelligent software. The ADAI wordmark beside Auri, the studio's soft 3D character, with the four kinds of work: agents, automation, apps and research." width="100%"></p>

<p align="center">
  <a href="https://www.adai.systems"><img src="https://img.shields.io/badge/live-adai.systems-eceae4?labelColor=06080b" alt="Live: adai.systems"></a>
  <img src="https://img.shields.io/badge/Astro-7.4-ff5d01?logo=astro&logoColor=white" alt="Astro 7.4">
  <img src="https://img.shields.io/badge/three.js-r187-000000?logo=threedotjs" alt="three.js r187">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white" alt="TypeScript 5.9">
  <img src="https://img.shields.io/badge/GLSL-custom%20shaders-5a63f0" alt="Custom GLSL shaders">
  <img src="https://img.shields.io/badge/Playwright-1.65-2ead33?logo=playwright" alt="Playwright 1.65">
  <img src="https://img.shields.io/badge/axe--core-4.14-8db3ff" alt="axe-core 4.14">
  <a href="https://www.adai.systems"><img src="https://img.shields.io/badge/deployed-Vercel-000000?logo=vercel" alt="Deployed on Vercel"></a>
  <img src="https://img.shields.io/badge/tracking-none-5cd6c4" alt="No tracking: no analytics and no cookies">
</p>

**ADAI Systems** is an independent technology studio, run by Alex, that designs and builds AI agents, automation, apps and research prototypes. This repository is its website: every project the studio has made, four services backed by that proof, and a short path to starting a project.

The site is built around **Auri**, an original real-time 3D character grown out of the ADAI mark. Auri follows your cursor, reacts to what you do and changes colour with the kind of work on screen. Under your cursor it turns into typographic glyphs.

<p align="center"><img src="docs/screenshots/home-desktop.png" alt="The ADAI Systems home page: the headline 'Building intelligent software.' on the left and Auri, a soft cream 3D character with a dark visor and two glowing eyes, on the right." width="100%"></p>
<p align="center"><sub>The home page at 1440 × 900. Auri is drawn live in the browser with WebGL; the headline and every link are ordinary HTML.</sub></p>

- **Live site:** https://www.adai.systems
- **Start a project:** https://www.adai.systems/start
- **Meet Auri:** https://www.adai.systems/mascot
- **Contact:** alex@adai.systems

## Contents

[What the site does](#what-the-site-does) · [Auri](#auri) · [Visual identity](#visual-identity) · [Tour](#a-tour-of-the-site) · [Tech stack](#tech-stack) · [Architecture](#architecture) · [Run it](#run-it) · [Quality](#quality) · [Deployment](#deployment) · [Content and privacy](#content-and-privacy) · [How AI was used](#how-ai-was-used) · [Ownership](#ownership)

## What the site does

| Job | How |
|---|---|
| **Show the work** | Fifteen projects since December 2024, each with a case study: facts, real screenshots or video, what was built, how it works and "said plainly", which states the limits. Paused and discontinued work stays listed. |
| **Explain the services** | AI agents and voice, automation and internal tools, apps and products, research and prototypes. Every capability links to the project that proves it. |
| **Show it working** | Four live demonstrations on the home page: an agent call replay, a folder-watching automation pipeline, real app screens, and real replies from a model trained from scratch. |
| **Win work** | A brief builder at `/start` writes the enquiry email as you answer. Nothing is sent from the site: it opens in your own mail app. |

## Auri

<p align="center"><img src="docs/assets/auri.png" alt="Auri, front view: a smooth cream silicone head with a centred dark visor and two smiling eyes, indigo ear cushions and antenna tip, mitten hands and a soft body with a small speech-bubble emblem on the chest." width="300"></p>

Auri grew out of the ADAI mark, a speech bubble with two round eyes:
- **The eyes** sit in a calm, centred visor at the mark's proportions.
- **The speech bubble** is worn as a glowing emblem on the chest.

It's soft rather than mechanical: satin silicone, a soft-touch body, felt ear cushions, and one deep indigo accent.

| | |
|---|---|
| **Alive** | Gaze led by the eyes, then head, then body. Blinking, breathing, idle glances. It gets sleepy if left alone. |
| **Expressive** | 11 expressions (curious, thinking, talking, proud and more) and 7 gestures (wave, point, think, cheer, present, shrug, nod). |
| **In the story** | Each section of the home page has its own pose and colour. Auri glides between them as you scroll, and nothing hijacks the scroll. |
| **Made of letters** | A small circle of typographic glyphs follows your cursor over Auri. The glyphs are set in IBM Plex Mono, and the densest one is the ADAI mark. |
| **Replaceable** | The site talks to Auri through one interface. An authored Blender model (GLB) can replace the procedural one with a single manifest change. See [docs/MASCOT.md](docs/MASCOT.md). |

<p align="center"><img src="docs/screenshots/lens-sheet.png" alt="Eight views of Auri with the glyph lens at different cursor positions: the left and right edges of the face, the centre, the antenna, both hands, the left ear, and after the cursor leaves." width="100%"></p>
<p align="center"><sub>The glyph lens around the character. Inside the circle every cell is glyphs (verified at 0 uncovered 3D pixels); outside it, Auri stays in 3D.</sub></p>

## Visual identity

| Swatch | Token | Hex | Meaning |
|---|---|---|---|
| <img src="https://img.shields.io/badge/-ink-06080b?style=flat-square" alt="#06080b"> | `--ink-0` | `#06080b` | The ground |
| <img src="https://img.shields.io/badge/-bone-eceae4?style=flat-square" alt="#eceae4"> | `--bone` | `#eceae4` | Text, and Auri's shell |
| <img src="https://img.shields.io/badge/-amber-f2b560?style=flat-square" alt="#f2b560"> | `--amber` | `#f2b560` | AI agents and voice |
| <img src="https://img.shields.io/badge/-aqua-5cd6c4?style=flat-square" alt="#5cd6c4"> | `--aqua` | `#5cd6c4` | Automation and internal tools |
| <img src="https://img.shields.io/badge/-coral-ff7d61?style=flat-square" alt="#ff7d61"> | `--coral` | `#ff7d61` | Apps and products |
| <img src="https://img.shields.io/badge/-sky-8db3ff?style=flat-square" alt="#8db3ff"> | `--sky` | `#8db3ff` | Research and prototypes |
| <img src="https://img.shields.io/badge/-indigo-5a63f0?style=flat-square" alt="#5a63f0"> | `AURI_ACCENT` | `#5a63f0` | Auri's signature accent |

- **Colour means one thing.** A hue stands for one kind of work, and Auri's eyes and chest light take the hue of the section on screen.
- **Type:** Mona Sans (wide display headings) and IBM Plex Mono (facts, and Auri's glyphs), both SIL OFL and self-hosted.
- **Brand:** the genuine ADAI wordmark sits in the header and footer. The favicon is the original ADAI icon, inverted (white character, black face).

## A tour of the site

<table>
<tr>
<td width="50%"><img src="docs/screenshots/chapter-agents.png" alt="The AI agents chapter: Auri in amber, talking, beside an illustrative phone-agent call replay."></td>
<td width="50%"><img src="docs/screenshots/chapter-automation.png" alt="The automation chapter: Auri in aqua beside a folder-watching pipeline demo."></td>
</tr>
<tr>
<td><b>AI agents.</b> An illustrative call replay: ask, look up, quote, confirm, book, and recover from an interruption.</td>
<td><b>Automation.</b> The call analyser's pipeline: watched folder, on-device transcription, analysis, report.</td>
</tr>
<tr>
<td><img src="docs/screenshots/chapter-apps.png" alt="The apps chapter: Auri in coral beside real Lockout iPhone screens."></td>
<td><img src="docs/screenshots/chapter-research.png" alt="The research chapter: Auri in sky blue beside STEVIE's real replies."></td>
</tr>
<tr>
<td><b>Apps.</b> Real Lockout and Margin screens.</td>
<td><b>Research.</b> STEVIE's real, unedited replies from the Glimmer repository.</td>
</tr>
<tr>
<td><img src="docs/screenshots/work-grid.png" alt="The work archive: a grid of identical project cards with real screenshots."></td>
<td><img src="docs/screenshots/case-study-margin.png" alt="The Margin case study: title, pitch, facts strip and links."></td>
</tr>
<tr>
<td><b>The work.</b> Every project, filterable, as uniform cards.</td>
<td><b>Case studies.</b> Facts first, then the story and its limits.</td>
</tr>
<tr>
<td><img src="docs/screenshots/start-brief.png" alt="The brief builder writing an email live beside the form."></td>
<td><img src="docs/screenshots/meet-auri.png" alt="The Meet Auri page with expression, gesture and colour controls."></td>
</tr>
<tr>
<td><b>Start a project.</b> The brief writes itself. Nothing is sent from the site.</td>
<td><b>Meet Auri.</b> Try every expression, gesture and colour.</td>
</tr>
</table>

<p align="center">
  <img src="docs/screenshots/mobile-home.png" alt="The home page on a phone: Auri above the headline." width="30%">
  <img src="docs/screenshots/mobile-chapter.png" alt="The agents chapter on a phone." width="30%">
  <img src="docs/screenshots/mobile-work-grid.png" alt="The work archive on a phone." width="30%">
</p>

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [Astro 7](https://astro.build): static output, every page prerendered HTML |
| 3D | [three.js](https://threejs.org) r187 (WebGL2) with custom GLSL: the face shader, the glyph reduction pass and the composite |
| Character | Procedural sculpting, spring-based animation, signed-distance-field face (`src/gl/mascot/`) |
| Scrolling | [Lenis](https://lenis.darkroom.engineering) with a fine pointer only; native scrolling otherwise |
| Language | TypeScript (strict), checked by `astro check` |
| Fonts | Mona Sans and IBM Plex Mono via Fontsource, self-hosted |
| Testing | Playwright 1.65 and axe-core 4.14 |
| Hosting | Vercel (static), `main` deploys to production |

## Architecture

```text
src/
  pages/            every route: home, work + 15 case studies, services + 4, process, studio,
                    research, start, contact, mascot, privacy, terms, 404, robots.txt
  components/       header, footer, cards, process steps, mascot anchors, the four demos
  content/          projects.ts, services.ts, site.ts: every fact and line of copy
  gl/               the WebGL world
    World.ts        renderer, story choreography, pointer, glyph lens, quality tiers
    mascot/         Auri: shapes, materials, face shader, expressions, poses, rig + GLB adapter
    passes/         the glyph atlas and pipeline (reduction + per-cell composite)
  scripts/          site behaviour, motion preference, WebGL loader, the mascot event bus
  lib/              navigation, SEO / JSON-LD, hues, the mascot's name
public/             brand, favicons, project media (work/), share cards (og/), mascot manifest
tests/              Playwright + axe suite
scripts/            screenshots, glyph probe, load profile, icons, banner, Auri still and GLB export
docs/               MASCOT.md, ARCHITECTURE.md, screenshots and assets
```

- **One canvas, layout-driven.** Each section marks an empty box with `data-mascot-anchor` and a pose. Auri frames itself into the most central visible box, so the story is responsive by construction.
- **Glyphs that line up.** Auri renders into an HDR target. A reduction pass averages each glyph cell on exactly the pixel grid the composite draws. Inside the cursor lens each cell is either glyph or 3D, never a blend.
- **Fast first paint.** Pages ship a few kilobytes of script. The WebGL world (147 KB gzipped) downloads after first paint and starts once the page is idle, on real GPUs only. Without WebGL, the layout closes up around the copy.
- **Pages never import WebGL.** They talk to Auri through a DOM event (`adai:mascot`).

More in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/MASCOT.md](docs/MASCOT.md).

## Run it

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # astro check + static build to dist/
npm run preview    # serve dist/
npm test           # Playwright + axe (builds and serves on :4322)
```

Node 22.12 or newer is required. Tests use the installed Google Chrome so WebGL runs on the GPU.

| Tool | What it does |
|---|---|
| `node scripts/glyph-probe.mjs <dir> [url] --metric` | Moves the cursor around Auri and counts any 3D pixel inside the glyph lens (expected: 0) |
| `node scripts/load-profile.mjs [url] 3 --throttle` | Times start-up (first paint, WebGL import, build, first frame) on cold and cached visits |
| `npm run mascot:glb` | Exports the procedural Auri as a GLB blockout for Blender |
| `npm run still` · `node scripts/build-banner.mjs` · `node scripts/build-icons.mjs` | Regenerate the README art and the favicon set |

## Quality

- `astro check`: 0 errors, 0 warnings.
- `npm test`: 59 tests, covering:
  - every route: status, a single h1, title, description, canonical, JSON-LD and no console errors;
  - axe WCAG 2.2 AA (no serious or critical issues);
  - no horizontal scroll at 375 px;
  - the WebGL boot, and the no-WebGL fallback;
  - reduced motion;
  - glyph-lens coverage (0 uncovered pixels);
  - identical project cards at three widths;
  - no draggable images;
  - the favicon, the header wordmark, the brief builder (no network requests), filters, the 404 page and the sitemap.
- Lighthouse, mobile emulation:

| Page | Accessibility | Best practices | SEO |
|---|---|---|---|
| All main pages | 100 | 100 | 100 |

  Performance is 82–86 on the home page (with live 3D) and about 90 on the other pages.

## Deployment

The site deploys on [Vercel](https://vercel.com) from this repository:
- `main` is production; every other branch gets a preview.
- `www.adai.systems` is the canonical host, and `adai.systems` redirects to it (308).
- `vercel.json` sets clean URLs (`/work/lockout`, matching the previous site's URLs) and cache headers for built assets.
- No environment variables are needed.

## Content and privacy

- **Facts.** Every fact comes from `src/content/` and the inventory in `docs/source/content-inventory.md`. Nothing goes on a page that is not in the inventory. Illustrative demos are labelled as such.
- **No tracking.** No analytics, cookies, third-party scripts or browser storage. Fonts and media are served from the site itself.
- **Nothing submits.** The brief builder writes an email you send yourself.
- `/privacy` and `/terms` describe the site exactly as built.

## How AI was used

The site, its character and its shaders were built with Claude Code (Anthropic) working under Alex's direction. Auri is procedural code: no AI-generated images or models are used anywhere on the site. Project screenshots are real captures of the projects.

## Ownership

ADAI Systems is a technology studio operated by FitDawg Ltd.

There is no licence file in this repository. The site's code, content, design, the Auri character and its images are all rights reserved: the source is public to read, not to reuse. Projects linked from the site have their own licences in their own repositories.

Contact: alex@adai.systems
