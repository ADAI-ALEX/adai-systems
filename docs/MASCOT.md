# Adi: the ADAI Systems character

Adi is ADAI's real-time 3D companion. This document covers:
- the character design and where it comes from;
- the animation and expression system;
- the asset pipeline;
- the contract a future hand-authored model must follow to replace the procedural one without touching the website.

Working name: **Adi** (from ADAI). The name is a placeholder; see "Decisions for Alex" at the end.

## 1. Identity: from the mark to a character

The existing ADAI mark (favicon `public/favicon.svg`, also inside `public/brand/adai-wordmark-source.svg`) is a circle containing a **speech bubble** with its tail at the lower left and **two round eyes**. Adi keeps that face and that idea, and nothing is extruded or traced:

| Mark | Adi |
|---|---|
| Speech bubble | The whole **head** is a soft speech bubble, a sculpted superellipsoid with the bubble's tail as a nub at the lower left. |
| Bubble inside the circle | A glossy ink **visor** in the same bubble shape, tail included, sitting on the face. |
| Two round eyes | Two glowing round eyes at the **mark's exact proportions**: centres at ±25.8 % of the visor width, radius 12.5 % of it. |

Everything else is new:
- a soft plush pebble **body**;
- floating mitten **hands** with soft thumbs;
- felted **ear cushions**, deliberately unequal;
- a bendy **thought sprout** that grows off-centre and leans;
- a **chest light**.

### Design rules
- **Soft, not mechanical.** No joints, panels, seams, screws, circuit patterns or segmented limbs. Satin silicone for the head and hands, plush for the body, felt for the cushions.
- **Small asymmetries:** bubble tail on one side, sprout off-centre and leaning, right cushion 12 % bigger and tilted, top-right of the head slightly fuller.
- **Readable at low resolution.** Big shapes, one dark visor against a light shell, eyes that glow. The face survives being reduced to a handful of glyph cells.
- **Colour carries meaning.** Adi is cream. The eyes, sprout bulb, chest light and rim light take the colour of the kind of work on screen: amber for agents, aqua for automation, coral for apps, sky for research, warm cream for the studio. This follows the existing Atlas rule that a hue stands for one kind of work.
- **Personality:** friendly, curious and quick, slightly playful without being childish. Adi listens (cushions), thinks (the sprout glows, and the visor shows the three typing dots of a chat bubble) and talks (a voice waveform on the visor).

## 2. How Adi is built today (procedural)

All code is in `src/gl/mascot/`.

| File | What it does |
|---|---|
| `shapes.ts` | Sculpts every part from high-resolution spheres reshaped per direction (superellipsoids plus soft directional bulges). The visor is sampled from the same surface as the head, so it hugs it exactly. |
| `materials.ts` | Satin silicone, plush, cushion, glow and core materials (`MeshPhysicalMaterial`: sheen, clearcoat). Micro-surface normal maps are generated at runtime, so no texture downloads. |
| `faceMaterial.ts` | The face: a signed-distance-field shader for the bubble visor, both eyes, lids, smile crescents, gaze, catch-lights, blush, the talking waveform and the typing dots. |
| `expressions.ts` | Eleven expressions as parameter sets: neutral, happy, curious, surprised, thinking, focused, talking, excited, confused, sleepy, proud. |
| `poses.ts` | Story poses used by page sections: expression + arrival gesture + hue + glyph styling + body turn. |
| `ProceduralMascot.ts` | Assembles the rig and animates it. |
| `rig.ts` | The `MascotRig` interface the website talks to. |
| `GltfMascot.ts` | The same interface, for an authored GLB. |

### Animation system (all frame-rate independent)
- **Gaze leads.** Eyes (fast), then head (medium), then body (slow) follow the cursor, with clamps (head yaw ±31°, pitch ±19°). Micro-saccades run when the pointer is idle. A call to action under the pointer draws Adi's gaze to it.
- **Blinking:** random intervals of 2.2 to 5.6 s, with an 18 % chance of a double blink.
- **Idle life:**
  - breathing, plus a slow sway and head drift;
  - after 28 s with no input, Adi gets **sleepy** and wakes with a startle on the next input.
- **Springs everywhere.** The hands and the sprout are damped springs, so every move has follow-through. A jump has gravity and squash-and-stretch on landing.
- **Gestures:** keyframed hand targets layered over the springs: wave, point, think (hand to chin), cheer (both hands up and a hop), present (palm toward the content), shrug, nod.
- **Reactions:**
  - **Poke** (click on Adi): surprised, then happy, plus a hop and a boing of the sprout.
  - **Startle:** a very fast pointer flick near Adi.
  - **Notice:** the pointer arriving near Adi makes it curious.
- **Story choreography** (`src/gl/World.ts`):
  - Each page section can hold an empty box `data-mascot-anchor data-pose="…"`. Adi frames itself into the most central visible box.
  - Adi glides over short distances, and pops out and back in over long ones, so it never sweeps across text.
  - On arrival it changes pose, plays the gesture, shifts hue and runs a glyph sweep.
  - The boxes are ordinary CSS, so the choreography is responsive by construction. Scrolling is never hijacked.
- **Page events.** Any script can send `window.dispatchEvent(new CustomEvent('adai:mascot', { detail: { expression, gesture, pose, hue } }))`. The demos and the brief builder use this.

### Reduced motion
With `prefers-reduced-motion`, or the header toggle:
- no idle motion, gestures, springs, glide or glyph animation;
- Adi holds a static pose and renders only when something changes.

## 3. The glyph renderer (Adi in letters)

Code: `src/gl/passes/`.
1. Adi renders into an HDR target with a transparent background.
2. A reduction pass averages each glyph cell (16 taps), so glyph choice is stable rather than flickering.
3. The composite:
   - draws the clean render;
   - swaps in **typographic glyphs** from a ramp set in IBM Plex Mono (`· . : - ~ + = * o x % # @`), whose densest glyph is **the ADAI mark itself**;
   - shows them inside a cursor lens and during story sweeps, with a dithered edge so they dissolve cell by cell;
   - adds an ambient glyph aura in the section hue, a soft halo and a contact shadow.

This is deliberately different from the studied reference site, which uses rounded-square holes and no letters (see the research spec §12).

## 4. Asset pipeline (replaceable without touching the site)

```text
public/mascot/manifest.json   { "renderer": "procedural" }  or  { "renderer": "gltf", "src": "/mascot/adi.glb", "faceShader": true }
        │
        ▼
World.loadMascot() ── gltf ok? ──► GltfMascot (authored)  ──┐
        │ (any failure)                                     ├─► MascotRig interface ─► story, glyphs, events
        └────────────────────────► ProceduralMascot ────────┘
```

**Scripts:**
- `npm run mascot:glb`: exports the live procedural Adi as `assets-src/mascot/adi-blockout.glb` (2 MB), with named nodes per the contract below. It's the **starting blockout for Blender**: correct proportions and naming, ready to retopologise, UV, rig and animate.
- `npm run poster`: renders `public/mascot/poster.{png,webp}` from the site's own renderer. It's the still shown before WebGL starts and whenever WebGL is unavailable. Re-run it after changing Adi.

Both scripts need the dev server (`npm run dev`) running.

### GLB contract

To replace the procedural Adi, deliver a GLB with:

| Kind | Required names | Notes |
|---|---|---|
| Nodes | `head` (look-at pivot), `body`, `hand_L`, `hand_R`; optional `sprout` | Y up, +Z forward, metres-like units. Floor at y=0, total height about 2.55, visual centre at y≈1.25 (or set `headCenterY` in the manifest). |
| Mesh | `visor` | Its material is replaced by the procedural face shader (`faceShader: true`). The shader reads **object-space x/y in head units**: visor centre at the origin, width about 1.28. Keep the visor front-facing in that space. |
| Morph targets | `blink_L`, `blink_R`, `smile`, `surprise`, `squint`, `think` | Optional. These are used if present, and only matter if you turn the face shader off and author the face instead. |
| Clips | `idle_loop`, `wave`, `point`, `think`, `cheer`, `present`, `shrug`, `nod` | `idle_loop` plays continuously; the others play once on demand. |
| Materials | `glow`, `core` | These take the section hue as emissive. |

**Budgets** (from research spec §4.1):

| | Desktop | Mobile |
|---|---|---|
| Triangles | ≤ 25k | ≤ 10k |
| Bones | ≤ 60 | ≤ 60 |
| Morph targets | ≤ 8 | ≤ 8 |
| Textures | KTX2: ETC1S colour, UASTC normal | KTX2 |
| GLB size (meshopt + KTX2) | ≤ 2.5 MB | ≤ 1.0 MB |
| GPU texture memory | ≤ 24 MB | ≤ 8 MB |

Optimise with `gltf-transform optimize --compress meshopt --texture-compress ktx2`.

## 5. Producing the final hand-authored Adi (recommended plan)

1. **Concept round.** Three to five sheets exploring proportions and materials around this design: the bubble head and the mark's eyes are fixed; the rest is open.
   - Higgsfield: generation was **not** used. On 15 November 2026 its unlimited allowance reported `available: false` and the balance was 0.05 credits, so nothing was generated to avoid paid credits.
   - If the allowance is activated, use `generate_image` for turnaround and expression sheets from written prompts only. Never use reference images of other mascots or of the studied site.
2. **Blockout.** Start from `assets-src/mascot/adi-blockout.glb` in Blender. Proportions and names are already correct.
3. **Sculpt and retopologise** to budget. Add subtle surface detail: soft creases where the head meets the body, a stitched seam on the plush, a slight dent in the cushions.
4. **UV and textures:** a subtle colour variation on the silicone, and a plush fibre normal. Bake to KTX2.
5. **Rig:** root, spine, neck, head, hands, and a two-bone sprout chain. Do not bake look-at; the site does it.
6. **Animate** the clips in the contract. Keep them additive-friendly and avoid root motion.
7. **Swap.** Drop `adi.glb` in `public/mascot/`, set the manifest, re-run `npm run poster`, then run the tests.

AI image-to-3D output (e.g. Higgsfield `generate_3d`) is a **blockout only**. It still needs steps 3 to 6.

## 6. Decisions for Alex
- The name "Adi".
- Whether Adi appears on case-study pages (currently it doesn't, to keep them fast and focused).
- Whether to commission a hand-authored Adi or keep the procedural one: it already meets the budgets.
