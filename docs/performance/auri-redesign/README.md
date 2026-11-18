# Performance: the Auri redesign (November 2026)

Before/after measurements for the new Auri (revision 3, see `docs/MASCOT.md`).

- **Before:** commit `b5e67c5`, the production build before this work.
- **After:** the redesign build.
- **How it was served:** both builds were served side by side by `scripts/serve-static.mjs`, which mirrors Vercel: clean URLs, brotli, immutable assets.

## Method

- **Browser:** Google Chrome via Playwright, GPU enabled (Apple M1 Pro, ANGLE Metal), headless.
- **Viewports:** 1440×900 at 2×, and for the phone figures 390×844 at 3×.
- **Tools:** `scripts/render-bench.mjs` for start-up, rendering and GPU, and `scripts/gesture-bench.mjs` for gestures. The JSON files in this folder are the raw results, with the options used.
- **Medians:** of 5 runs for start-up (3 when throttled). Cold is a first visit in a fresh context; warm is a second visit.
- **GPU time:** `EXT_disjoint_timer_query_webgl2` around each frame's WebGL work, on this GPU only. A slower GPU will show larger numbers; nothing here is an FPS claim for other hardware.
- **Which build:** the "after" start-up, rendering and GPU runs used the redesign build just before its last geometry trim (the display glass and body meshes were then made lighter, about 14k fewer triangles). The final build can only be cheaper than these figures.

## Results

### Start-up (local, 1440×900 at 2×)

| | Before | After |
|---|---|---|
| First contentful paint, cold (`/`) | 68 ms | 68 ms |
| Auri's first frame, cold (`/`) | 271 ms | 307 ms |
| Auri's first frame, warm (`/`) | 226 ms | 249 ms |
| Auri's first frame, cold (`/mascot`) | 249 ms | 270 ms |
| Total blocking time, cold (`/`) | 16 ms | 25 ms |
| Longest task, cold (`/`) | 66 ms | 75 ms |

### Throttled start-up (fast 4G, 4× CPU, `/`, median of 3)

| | Before | After |
|---|---|---|
| First contentful paint, cold | 572 ms | 580 ms |
| Auri's first frame, cold | 1476 ms | 1544 ms |
| Auri's first frame, warm | 707 ms | 768 ms |
| Total blocking time, cold | 209 ms | 184 ms |
| Longest task, cold | 123 ms | 138 ms |

The page itself is unaffected: first paint is the same, the hero needs no script, and WebGL still starts after load and idle. Auri appears 20 to 70 ms later because there is more to build and shade.

During the redesign, four changes kept that cost down:
- the geometry is built in three short tasks with yields between them;
- shader programs are shared (plush, velvet and arms use one; the ear and antenna lights use one), taking the count from 28 to 23. The old Auri had 21;
- only the big forms cast shadows;
- hidden sprites issue no draw call.

Before those changes, the first frame was at 338 ms and the longest task at 97 ms.

### Rendering (1440×900 at 2×, 2880×1800 canvas)

| | Before | After |
|---|---|---|
| Frame interval, idle / lens / scrolling p95 | 16.7 / 16.7 / 16.7 ms | 16.7 / 16.7 / 16.7 ms |
| GPU time per frame, idle, median (`/`) | 3.97 ms | 4.52 ms |
| GPU time per frame, lens on Auri, median (`/`) | 3.78 ms | 4.38 ms |
| GPU time per frame, idle, median (`/mascot`) | 3.76 ms | 4.23 ms |
| GPU time during back-to-back gestures, median / p95 (`/mascot`) | 1.74 / 4.69 ms | 1.99 / 5.49 ms |
| Frame interval during gestures, median / max | 16.5 / 16.8 ms | 16.5 / 16.8 ms |
| WebGL draw calls per frame | 23 | 34 |
| Distinct `requestAnimationFrame` loops | 2 | 2 |

### Phone viewport (390×844 at 3×, 1170×2532 canvas, `/`)

| | Before | After |
|---|---|---|
| GPU time per frame, idle, median / p95 | 2.25 / 4.50 ms | 2.68 / 5.05 ms |
| GPU time per frame, lens, median / p95 | 2.65 / 4.36 ms | 2.69 / 5.05 ms |

### Offscreen pause

The offscreen pause works exactly as before. Over a full-page reading scroll of `/mascot`, frames with any WebGL work are 18.1 % in both builds; everywhere else Auri is out of view and nothing is drawn. On the homepage (Auri is in view almost everywhere) GL time per second of scrolling rose from 66 to 97 ms. The tests check that no GPU work happens offscreen and that a fast scroll redraws Auri within a few frames.

### Download size

| | Before | After |
|---|---|---|
| WebGL chunk set (everything preloaded for Auri), gzip -9 | 169.1 KB | 182.0 KB |
| Of which `boot.*.js` (three.js + world + Auri), gzip -9 | 99.3 KB | 110.9 KB |
| 3D assets downloaded | 0 bytes | 0 bytes |

### Character

Measured from the live scene (`?glyphdebug`, `__adaiRender.mascot`): 20 meshes, 7 shadow casters, up to 4 visible sprites. About 86k triangles at desktop detail and 59k on touch screens. There are no texture downloads, only two small canvas textures.

## Glyph quality

Unchanged by design:
- glyphs at the screen's pixel density (19 px cells at 2×) with a pixel-exact atlas;
- the frame-time watchdog lowers only the 3D resolution;
- the lens is glyph-only. The coverage probe counts 0 uncovered 3D pixels at every position at 1×, 2× and 3× (`scripts/glyph-probe.mjs --metric`), and the test suite checks this on every run.

## Follow-up: smooth shell and fixed-length arms (18 November 2026)

The plush fibre shader was replaced by a smooth satin shell (no noise), arms got a fixed length, and the chest tile was darkened. Measured against production (the redesign as first shipped), same machine, homepage at 1440×900 at 2×:

| | Redesign as first shipped | With the follow-up |
|---|---|---|
| GPU time per frame, idle, median / p95 | 3.94 / 6.72 ms | 3.87 / 6.55 ms |
| GPU time per frame, lens on Auri, median / p95 | 4.11 / 6.55 ms | 3.75 / 6.36 ms |

The difference is within run-to-run noise, so the honest reading is "no slower". The per-frame arm solve (a nine-step bisection on two 14-segment curves) costs nothing measurable.
