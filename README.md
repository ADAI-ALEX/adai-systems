# ADAI Systems: website (2026 rebuild with Auri)

The ADAI Systems studio site, rebuilt around **Auri**, an original real-time 3D character grown out of the ADAI mark, and a typographic **glyph renderer**. It keeps everything the current site does:
- every project, with honest case studies;
- four service lines backed by proof;
- a privacy-first brief builder;
- no tracking.

It adds an interactive story on top.

> Status: local build only. Not deployed and not connected to the live site. The live site at www.adai.systems is untouched.

![Home](docs/screenshots/home-desktop.png)

## Run it

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # astro check + static build to dist/
npm run preview      # serve dist/ (http://localhost:4321 by default)
npm test             # Playwright + axe suite (builds and serves on :4322)
```

Node 22.12+ is required. Tests and the asset scripts use the installed Google Chrome (`channel: 'chrome'`) so WebGL runs on the GPU.

| Script | What it does |
|---|---|
| `npm run poster` | Re-renders Auri's fallback still (`public/mascot/poster.*`) from the live renderer. Needs `npm run dev`. |
| `npm run mascot:glb` | Exports the procedural Auri as a GLB blockout for Blender (`assets-src/mascot/auri-blockout.glb`). Needs `npm run dev`. |
| `node scripts/shot.mjs <url> <out.png> [w h waitMs] [--mouse x,y] [--scroll y] [--reduced]` | Quick GPU screenshots for review. |
| `node scripts/glyph-probe.mjs <dir> [url] [--metric]` | Captures the glyph reveal at several cursor positions and stages; `--metric` counts uncovered 3D pixels. |
| `node scripts/load-profile.mjs [url] [runs] [--throttle]` | Times the start-up phases (FCP, WebGL import, build, first frame), cold and cached. |
| `node scripts/build-icons.mjs` | Renders the favicon set from `public/favicon.svg`. |

## What is on the site

| Route | Content |
|---|---|
| `/` | Hero with Auri. The four services, then four story chapters, each with a live demonstration and Auri in that service's colour and mood. Selected work, how a project runs, honest studio numbers, call to action. |
| `/work`, `/work/[slug]` | Filterable archive of all 15 projects, and 15 case studies (facts strip, lead media or video, story rows, "Said plainly", connected work, older and newer). |
| `/services`, `/services/[path]` | Overview with a side-by-side comparison, and four landing pages (`ai-agents`, `automation`, `apps`, `prototypes`), each with proof-linked capabilities, a demo, fit, proof projects and process. |
| `/process` | How ADAI works: steps, principles and FAQ (with FAQPage structured data). |
| `/studio` | Who runs the studio, the full project timeline, and domains. |
| `/research` | Research projects and STEVIE's real replies. |
| `/start` | Project brief builder. It writes the email live; nothing is sent or stored. It opens in your mail app or copies, and Auri reacts as the brief takes shape. |
| `/contact` | One address, read by a person. |
| `/mascot` | Meet Auri: live expression, gesture and colour controls, and where the character comes from. The name is set once in `src/lib/mascot.ts`. |
| `/privacy`, `/terms`, 404 | Legal wording carried over and updated for the motion toggle and the 3D character. A custom 404 with a confused Auri. |

URLs match the live site (no trailing slash, `/work/<slug>`, `/services/<path>`), so search rankings carry over. A `vercel.json` with `cleanUrls` is included for when it's deployed.

### The interactive demonstrations

| Demo | Basis |
|---|---|
| **Agents** | An illustrative phone-agent replay: ask, look up, quote, confirm, book, and recovering from an interruption. This is the documented Voice Agent flow, clearly labelled as a made-up example. |
| **Automation** | The Call Recording Analyser's watched-folder pipeline, with made-up file names, labelled. |
| **Apps** | Real Lockout iPhone captures and real Margin screens. |
| **Research** | STEVIE's real, unedited replies from the Glimmer repository. |

## Content: where it comes from

All facts, copy and media come from the existing ADAI site (`../adai-systems-site`, the Atlas rebuild). Nothing was invented:
- `src/content/projects.ts`, `services.ts` and `site.ts` are carried over from it;
- `docs/source/content-inventory.md` is its fact inventory, the source for every claim;
- `public/work/` holds the real project media (including the already-masked hospitality captures) and `public/og/` the share cards.

The private notes file was **not** copied. Its rules were respected:
- the voice-agent business is never named;
- no ratings are shown;
- hospitality media stays masked.

The only new copy describes how the studio works (restating `services.ts`), Auri, and the demo labels. To add a project, follow the instructions at the top of `src/content/projects.ts`.

## Architecture

| Layer | Implementation |
|---|---|
| Framework | **Astro 7** (static output). Every page is prerendered HTML. The page scripts are a few kilobytes. |
| WebGL | **three.js r187**. One fixed canvas behind the page, loaded as one 147 KB gzipped chunk after the page is interactive, and only on real GPUs (software rasterisers get the poster). |
| Mascot | `src/gl/mascot/`: procedural character behind a `MascotRig` interface, with a GLB adapter for an authored replacement. See [docs/MASCOT.md](docs/MASCOT.md). |
| Glyphs | `src/gl/passes/`: cell-averaged typographic glyph pass, an atlas built at runtime from IBM Plex Mono plus the ADAI mark. |
| Story | `src/gl/World.ts`: layout-driven choreography via `data-mascot-anchor` boxes, with no scroll hijacking. |
| Motion | `src/scripts/motion.ts`: follows the OS reduced-motion setting live. Lenis smooth scrolling only with a fine pointer and motion allowed. |
| Styles | `src/styles/global.css` tokens, carried over from Atlas (ink, bone; amber, aqua, coral and sky mean agents, automation, apps and research), plus scoped component styles. |
| Fonts | Mona Sans (wide display) and IBM Plex Mono, both SIL OFL and self-hosted via Fontsource. |

More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Quality checks (latest run)

- `astro check`: 0 errors, 0 warnings.
- `npm test`: **58/58 passing**:
  - all 30 routes return 200, with one h1, a title, a meta description, a canonical URL, JSON-LD and no console errors;
  - axe-core finds no serious or critical WCAG 2.2 AA issues on the 11 main pages;
  - no horizontal scroll at 375 px on any page;
  - the WebGL world boots on GPU Chrome, and the no-WebGL fallback works;
  - reduced motion works, and there is no toggle in the header;
  - the header uses the real wordmark asset, and the favicon follows the spec;
  - project cards are identical in size at 1440, 834 and 390 px;
  - images cannot be dragged, and display headings are not selectable (body copy is);
  - the glyph reveal leaves **0** uncovered 3D pixels at full activation (measured with `?glyphdebug`);
  - the brief builder makes no network requests and writes the email;
  - archive filters, the 404 page and the sitemap all check out.
- Lighthouse, mobile emulation with 4× CPU throttling:

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| `/` | 83 | 100 | 100 | 100 |
| `/services/ai-agents` | 84 | 100 | 100 | 100 |
| `/work/margin` | 96 | 100 | 100 | 100 |

## Research compliance

The techniques were informed by `../research/autopilot/` (spec §12). No code, shaders, assets, fonts, copy, narrative or parameter sets from the studied site were used:
- the glyph effect uses real letters and the ADAI mark, not rounded-square holes;
- there is no forced chapter auto-scroll;
- Auri is real-time 3D, not video plus depth maps;
- the story and palette are ADAI's own.

## Decisions for Alex

See the end of [docs/MASCOT.md](docs/MASCOT.md) and the final report. In short:
- the mascot's name;
- whether to commission a hand-authored Auri;
- confirming the process copy (it restates `services.ts`, which was marked "for Alex to confirm");
- when and where to deploy.
