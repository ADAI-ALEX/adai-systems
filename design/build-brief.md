# Build brief for the Atlas redesign (read this first)

You are building part of adai.systems, the site of ADAI Systems, an independent technology studio run by Alex. The lead designer has already built the design system, the site frame and the home page. Your job is to build the pages assigned to you so they look and feel like the same site, at the same level of finish.

The site has two jobs: show the work (a portfolio) and win work (a funnel that leads visitors to `/start`).

## Read before writing anything

1. `AGENTS.md`. This is Next.js 16 and it differs from what you know: `params` is a Promise you must await, `next/image` uses `preload` not `priority`. Check `node_modules/next/dist/docs/` if unsure.
2. `app/(site)/site.css`. Every token and shared class. This is the design system.
3. `app/(site)/page.tsx` and `app/(site)/home.css`. The reference for quality, tone and how sections are composed.
4. `components/site/parts.tsx` (Status, Facts, Links, Shot, Arrow, Cta, Footer), `components/site/video.tsx` (Player), `components/site/web.tsx` (Web), `components/site/meta.ts` (pageMeta).
5. `content/projects.ts`, `content/services.ts`, `content/site.ts`. All copy and facts.

## The design language

- Dark and precise. Ground `--ink-0`, raised surfaces `--ink-1` and `--ink-2`, hairlines `--line` and `--line-2`, text `--bone`, secondary text `--mute`.
- One sans family. Headings (`h1`, `h2`, `.display`) are set wide and tight. Mono (`.meta`) is only for facts about a thing: dates, statuses, counts, stacks.
- Four hues, and colour always means "which kind of work": agents amber, automation aqua, products coral, research sky. Put `data-hue="<aspect>"` on a container and use `var(--hue)` inside it. Never use a hue decoratively.
- Real media does the visual work: screenshots, phone captures, GIFs and one video. Make pages visual, not walls of text. Use `Shot` for images and `Player` for video.
- Motion is quiet and purposeful: hover lifts, lines that draw, images that ease. Add class `rise` to a section for the standard entrance. Everything must rest under `prefers-reduced-motion`.
- Layout: `.wrap` for width, `.section` for vertical rhythm, `.section-head` for a heading with a note beside it, `.card`, `.frame`, `.btn`, `.btn-primary`, `.link`, `.tag`, `.ticks`, `.facts`, `.phones`, `.cta`.

## Hard rules

- **Facts come only from the content files.** Never invent numbers, clients, testimonials, prices, timelines, awards or results. If you need a fact that is not there, leave it out and say so in your report.
- **No client or venue names.** None exist in the content. Do not add any.
- **No em dashes anywhere**: not in copy, alt text, metadata or code comments. Use full stops, commas, colons or brackets.
- **British English.** Short, plain, confident. No buzzwords (leverage, seamless, cutting-edge, unlock, elevate, solutions).
- **No small label above a section heading** (no "eyebrows"). No purple or violet. No gradient text. No glass cards inside cards. No centred hero plus three feature cards.
- **No new npm dependencies.**
- **Privacy:** no `<form>` that submits anywhere, no cookies, no localStorage or sessionStorage, no analytics, no requests to other origins. The privacy notice says the site collects nothing and that must stay true.
- **Accessibility:** one `h1` per page, headings in order, alt text on every image (empty alt only for decoration), visible focus, every control at least 44px tall, everything reachable by keyboard, AA contrast.
- **No horizontal overflow at 375px wide.**
- Every image needs explicit width and height. Lazy by default. Only the first large image on a page gets `priority`.

## Files

- Put page styles in a CSS file beside the page and import it from the page. Prefix every selector with `.site `. Use only the tokens in `site.css`.
- Do not edit `app/(site)/site.css`, `app/(site)/home.css`, `app/(site)/page.tsx`, `components/site/parts.tsx`, `components/site/web.tsx`, `components/site/bar.tsx` or anything in `content/`. If you think one needs changing, say so in your report.
- Other agents are working in this folder at the same time on other pages. Only touch the files listed in your task.

## Checking your work

- A dev server is already running at http://localhost:3210. Do not start another one and do not run `next build`.
- Typecheck: `npx tsc --noEmit`. Lint: `npx eslint <your files>`. Both must be clean for your files.
- Look at your pages. Screenshot with:
  `BASE_URL=http://localhost:3210 node scripts/shoot.mjs /your/path /tmp/adai-shots/<name> 1440,390`
  That writes full-page JPEGs you can open with the Read tool (`/tmp/adai-shots/<name>-1440.jpg`, `-390.jpg`). Add `--fold` for only the first screen. The script prints the overflow in pixels and any console errors: both must be 0.
- If a screenshot shows a build error in a file that is not yours, another agent is mid-edit. Wait 30 seconds and try again.
- Critique your own screenshots honestly and fix what looks weak before you report.

## Report back

List the files you created or changed, anything you were unsure about, any content gaps, and anything you think the lead should look at.
