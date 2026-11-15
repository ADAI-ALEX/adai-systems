# Design

The site's design is called Atlas. It is dark and precise, so the work and the web carry the colour.

| File | What it is |
|---|---|
| `../app/(site)/site.css` | The design system: every token and shared class. Start here. |
| `../app/(site)/home.css` | The home page, the web, the video player and the process steps |
| `build-brief.md` | The rules every page is built to: language, hard rules, accessibility, how to check work |
| `taste-brief.md` | What the reference sites have in common and what that means for ADAI |
| `directions.md` | The three directions tried first, and why none of them is the site |
| `imagery-plan.md` | Every generated image, planned before it was made, plus a shot list for later |

## The system in one minute

- **Ground:** `--ink-0` to `--ink-3`, hairlines `--line` and `--line-2`.
- **Text:** `--bone`, `--mute`, `--faint`.
- **Four hues, and colour always means which kind of work:** agents `--amber`, automation `--aqua`, apps `--coral`, research `--sky`. Put `data-hue="<aspect>"` on a container and use `var(--hue)` inside it.
- **Type:** Mona Sans for everything, set wide and tight for headings. IBM Plex Mono only for facts about a thing: dates, statuses, counts, stacks.
- **Motion:** quiet. Hover lifts, lines that draw, one entrance (`.rise`). Everything rests under reduced motion.

## History

1. Three directions were built and compared: Lab Terminal, Specimen and Orbit. Alex turned down all three as designs but liked the interactivity, and the web most of all.
2. Atlas replaced them on 15 November 2026, when the site's job widened from portfolio to portfolio plus funnel. It takes its tone from Margin, the studio's own best-finished project.
3. The tweaks bar from the first build was removed with the old design. It can be rebuilt on Atlas if wanted.
