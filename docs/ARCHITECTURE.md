# Architecture notes

## Rendering

- **One renderer, one canvas.** `.gl-stage` is fixed behind the page (`pointer-events: none`, `aria-hidden`).
- **Loading conditions.** `src/scripts/gl-loader.ts` only boots WebGL when all of these hold:
  - WebGL2 is available with `failIfMajorPerformanceCaveat`;
  - the renderer isn't a software rasteriser (SwiftShader or llvmpipe);
  - `Save-Data` is off and `?nowebgl` isn't set.

  Otherwise `html.gl-fallback` is set and every `MascotAnchor` collapses, so the layout closes up around the text. No flat image stands in for Auri.
- **Start-up** (`World.init`) yields to the main thread between steps (environment map, mascot, glyph atlas, async shader compile), so no single task blocks input for long.
- **Frame:**
  1. key light with a 1024² soft shadow that follows Auri's scale;
  2. scene into a half-float target;
  3. 16-tap cell reduction, addressed in screen pixels, storing average colour and max coverage;
  4. per-cell composite (glyph or 3D) with tone mapping (Neutral) straight to the canvas.

  A small glyph lens follows the cursor near Auri (radius scales with Auri, capped at 16.5 % of the viewport height); a finger dragging across Auri drives it on touch screens without scrolling the page, and `?glyphdebug` exposes any uncovered 3D pixel inside it.

  The device pixel ratio is capped at 1.5 on desktop and 1.25 on coarse pointers. A frame-time watchdog steps it down (to 0.85) or back up.
- **Pausing.** Rendering stops when the tab is hidden. Under reduced motion it renders only when something changes.

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

`scripts/load-profile.mjs --throttle` (fast 4G, 4× CPU) measured, as medians of 3 runs:

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
