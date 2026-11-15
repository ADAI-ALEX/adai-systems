# Imagery plan

Every generated image is planned here before it is made. Generation spends Alex's Higgsfield credits (balance on 12 November 2026: 10 credits).

## Rules

1. Real products get real screenshots. Nothing generated ever stands in for product UI.
2. Generate only what a direction actually uses.
3. A generated image is always labelled as a concept on the page.
4. No text, logos, people or brand marks inside a generated image.

## What is not being generated, and why

| Slot | Decision |
|---|---|
| Hero art (all three directions) | None. The references agree that the work is the hero, so each hero is interactive and built in code. |
| Glimmer, JEB Depot, Lockout, Reinforcement Learning | Real media only: terminal captures, game screens, App Store captures, training GIFs. |
| Voice Agent, Call Recording Analyser, Apex Terminal, Spatial Memory Scanner, Hospitality Platform | No images at the directions stage. Real captures come in Phase 5 where they can be made (Apex backtester, the scanner's demo scan, the hospitality demo with branding masked). |
| Section backgrounds, textures | Built in CSS or canvas. Cheaper, sharper and themeable from the tweaks bar. |

## Shot list

### Shot 1: Holographic Display Study (planned, 1 image)

- **Used in:** the Research section of all three directions, tinted per direction in CSS. Later, the project's short Research entry.
- **Why generate:** Alex asked for an illustration framed as a concept, because no images exist. The study's conclusion was that a swept-volume persistence-of-vision LED display is the practical first step, so the picture shows that idea.
- **Label on the page:** "Concept illustration. Nothing was built."
- **Format:** square, dark background, mostly monochrome light so it can be recoloured to each palette.
- **Prompt:** "Long-exposure studio photograph of a concept device: a thin vertical blade of tiny LEDs spinning fast inside a clear glass cylinder on a plain black plinth, the light trails forming a glowing three-dimensional wireframe cube floating in mid-air inside the cylinder. Pure black background, soft white and pale amber light only, fine light streaks, shallow haze, centred composition with empty space around it. No text, no logos, no people, no user interface."
- **Budget:** one generation, one variant. Cost is checked before submitting. If it comes back unusable, the fallback is typography alone, not a second attempt.
- **Status:** done. Saved as `public/work/holographic-display/concept.webp`.

## Log

| Date | Shot | Model | Credits | Result |
|---|---|---|---|---|
| 12 Nov 2026 | 1. Holographic Display Study | gpt_image_2_6, 1:1 | 0.25 | Kept. A glowing wireframe cube inside a glass cylinder on black. No text or marks in frame. |

## 15 November 2026: Atlas

Higgsfield's unlimited trial does not work from Claude Code. The API says it applies in Claude chat, Claude Cowork and ChatGPT only, and the account held 0.05 credits. So nothing new was generated for Atlas. The art is the web, drawn in code, plus real project media.

### Shot list, if Alex wants generated art later

Run these in Claude chat, where the trial applies, and save the results under `public/art/`. Each is optional: no page depends on them. Anything used must be labelled as an illustration, and none may stand in for product screens.

| File | Where it would go | Prompt |
|---|---|---|
| `web-sculpture.webp` (21:9) | Behind the closing band on the home page | Dark gallery photograph of a suspended kinetic sculpture: hair-thin brass wires radiating from one central glass sphere to many smaller glass spheres, some glowing amber, some aqua, some coral, some pale blue. Deep black background, shallow depth of field, museum lighting, wide composition with empty black space on the left. No text, no logos, no people. |
| `voice.webp` (4:3) | Voice Agent case study, labelled as an illustration | Studio photograph of a single vintage desk telephone handset resting on matte black, lit by one warm amber light from the side, fine dust in the beam, very dark and minimal. No text, no logos, no people. |
| `spatial.webp` (4:3) | Spatial Memory Scanner case study, labelled as an illustration | A dark room rendered as a sparse cloud of tiny pale blue points of light tracing walls, a doorway and a staircase, seen from inside, black background, no surfaces, only points. No text, no people. |
