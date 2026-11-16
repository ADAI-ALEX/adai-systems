# Architecture notes

## Rendering

- **One renderer, one canvas.** `.gl-stage` is fixed behind the page (`pointer-events: none`, `aria-hidden`).
- **Loading conditions.** `src/scripts/gl-loader.ts` only boots WebGL when all of these hold:
  - WebGL2 is available with `failIfMajorPerformanceCaveat`;
  - the renderer isn't a software rasteriser (SwiftShader or llvmpipe);
  - `Save-Data` is off and `?nowebgl` isn't set.

  Otherwise `html.gl-fallback` is set and every `MascotAnchor` collapses, so the layout closes up around the text. No flat image stands in for Auri.
- **Start-up** (`World.init`) yields to the main thread between steps (environment map, mascot, glyph atlas, async shader compile), so no single task blocks input for long. See "Start-up" below for the order things load in.
- **Frame:**
  1. key light with a 1024² soft shadow that follows Auri's scale;
  2. scene into a half-float target, at the 3D resolution;
  3. 16-tap cell reduction, on the composite's cell grid, storing average colour and max coverage;
  4. a per-cell noise pass (lens dither, aura field, glyph jitter);
  5. per-cell composite (glyph or 3D) with tone mapping (Neutral) straight to the canvas, at the screen's pixel density.

  A small glyph lens follows the cursor near Auri (radius scales with Auri, capped at 8.25 % of the viewport height); a finger dragging across Auri drives it on touch screens without scrolling the page, and `?glyphdebug` exposes any uncovered 3D pixel inside it.
- **Two resolutions.**
  - The canvas, and so the glyph pass, runs at the screen's own pixel density (up to 3×; 2× when a 3× canvas would exceed 6 megapixels), with a glyph atlas drawn at the exact cell size. Glyph quality is identical on every page.
  - The 3D scene renders into its own target at 1.5× (desktop) or 1.25× (touch), as before. The animated noise is computed once per glyph cell in a small pass, and the composite skips, exactly, every pixel where it would output nothing: beyond 2.4 mascot radii, and where neither Auri nor the aura reaches. As a result the sharper glyph pass costs no more GPU time on desktop than the old one (see `docs/performance/README.md`).
- **Frame-time watchdog** (`trackPerformance` in `World.ts`):
  - it only changes the 3D resolution (steps of 0.25, floor 1×), never the glyphs;
  - it judges two-second windows by their median against the display's refresh rate, so isolated slow frames are ignored;
  - a step that doesn't make frames faster is undone (the cost was elsewhere, e.g. another tab);
  - it steps back up as soon as frames are smooth;
  - last resort, on 3× phones only: glyphs may drop to 2×.
- **Pausing.**
  - Rendering stops when the tab is hidden.
  - When no mascot area is in view and Auri has faded out, frames skip the character, shadow and glyph passes entirely. Anchors are still checked from live layout every frame, so a fast scroll to any section draws Auri there on the next frame.
  - Under reduced motion it renders only when something changes.
- **One context.** One renderer, one set of geometry, materials and render targets, reused by every section. Below-the-fold sections have no 3D of their own to initialise. Their demos start when scrolled into view, and their images are lazy.

## Choreography

- `[data-mascot-anchor]` boxes in the page layout say where Auri stands and in which pose.
- The world picks the most central box that's visible enough, then:
  - frames Auri to the box's size;
  - glides over short distances, and pops out and in over long ones;
  - applies the pose: expression, gesture, hue, glyph amount, turn toward the content.
- Sticky boxes (the chapters) keep Auri parked beside their demo while the text scrolls.
- Scroll is never written to by script.

## Page ↔ mascot API

`window.dispatchEvent(new CustomEvent('adai:mascot', { detail }))`, where `detail` is `{ pose?, expression?, hold?, gesture?, hue? }`.
- The helper is `src/scripts/mascot-bus.ts`.
- Pages never import WebGL code, so they work identically without it.
- Elements with `data-mascot-react` (main calls to action) make Auri look at them and react on hover or focus.

## Accessibility

- Semantic HTML: a single h1, ordered headings, landmarks, a skip link, visible focus, and 44 px targets.
- Canvas content is decorative; everything meaningful is DOM.
- Demos:
  - keyboard operable, using real buttons, a tablist with arrow keys, and live regions for updates;
  - illustrative content is labelled as such;
  - under reduced motion they show their final state.
- Motion follows the OS `prefers-reduced-motion` setting live; the site stores nothing in the browser.

## SEO

- Static HTML, same URLs as the live site, and canonical URLs on www.
- Sitemap (`@astrojs/sitemap`) and `robots.txt`.
- Open Graph and Twitter cards, reusing the existing share cards.
- JSON-LD:
  - Organization and WebSite on every page;
  - BreadcrumbList on inner pages;
  - CreativeWork for case studies, Service for services, FAQPage for `/process`.
- Descriptions come from content.

## Start-up

Order of work on a page with Auri:
1. HTML, styles and the headline paint first. The hero needs no script and no WebGL.
2. At the end of `<body>`, a build-time hint (`preloadWebGL` in `astro.config.mjs`) starts a low-priority download of the WebGL chunk. It is skipped with Save-Data or `?nowebgl`.
3. When the page scripts run, `gl-loader.ts` also fetches the mascot manifest and the glyph font, so initialisation never waits on the network.
4. After `load` and an idle moment, `World.init` builds the environment, Auri and the glyph atlas. It compiles every shader (both glyph passes included) asynchronously before the first frame.
5. Auri fades in. Sections further down cost nothing until a mascot area scrolls into view.

Before/after measurements of this work are in `docs/performance/README.md`.

Earlier measurement (before November 2026), with `scripts/load-profile.mjs --throttle` (fast 4G, 4× CPU), as medians of 3 runs:

| Visit | First contentful paint | First interactive mascot frame |
|---|---|---|
| Cold | 0.56 s | 1.67 s (was 1.89 s) |
| Cached | 0.40 s | 1.28 s (was 1.40 s) |

Without throttling the first frame is at about 0.27 s. Four things keep this smooth:
- the WebGL chunk downloads straight after first paint;
- initialisation waits for load and idle;
- the glyph font warms while the character builds;
- the mascot area stays empty until the first frame, then the canvas fades in over 700 ms while Auri rises and settles (about 0.9 s), so there is no flash, no flat stand-in and no loading screen.

## Performance budget (spec §10) vs actual

| Budget | Spec | Actual |
|---|---|---|
| Initial JS | ≤ 300 KB br | About 3 KB gzipped of page scripts, plus Lenis 5 KB gzipped at idle |
| WebGL chunk | Deferred ≤ 150 KB | 147 KB gzipped (three.js + world), after load and idle |
| Hero-critical assets | ≤ 4 MB | Poster WebP 26 KB, fonts about 90 KB. Auri is procedural: 0 bytes of 3D assets downloaded. |
