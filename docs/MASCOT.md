# Auri: the ADAI Systems character

Auri is ADAI's real-time 3D companion. This document covers:
- the character design and where it comes from;
- the animation and expression system;
- the asset pipeline;
- the contract a future hand-authored model must follow to replace the procedural one without touching the website.

Name: **Auri**, set once in `src/lib/mascot.ts`.

## 1. Identity: from the mark to a character

The ADAI mark (`public/brand/adai-mark.svg`) is a circle containing a **speech bubble** with two **round eyes**. Auri keeps that face and that idea, and nothing is extruded or traced:

| Mark | Auri |
|---|---|
| Two round eyes | Two glowing round eyes in the visor, at the **mark's proportions** (centres at ±25 % of the visor width, radius about 13 % of it). |
| The bubble's rounded body | A calm, **centred** ink visor with the same soft rounded-rectangle shape. |
| The speech bubble with its tail | A small **speech-bubble emblem on the chest**, lit from inside in the colour of the work. |

### Revision 2 (November 2026)

Feedback: the bubble-tail bump on the head made the face look uneven, and the surface read as leather.
- **Head:** now a smooth, evenly rounded cushion. The tail bump is gone. A touch of crown fullness and soft fullness under the chin keep it organic.
- **Face:** the visor and eyes are now centred and symmetrical.
- **Speech bubble:** moved to the chest emblem, a separate design detail rather than a distortion of the face.
- **Materials:** all grain and bump textures are removed. The head and hands are satin silicone, the body is a soft-touch matte oat, and depth comes from lighting and a gentle baked colour variation instead of micro-texture.
- **Signature accent:** a deep indigo (`AURI_ACCENT`, `#5a63f0`) on the antenna tip and the felt ear cushions. Everything else stays warm cream. The section hue still lights the eyes, the chest bubble and (while thinking) the antenna.

### Design rules
- **Soft, not mechanical.** No joints, panels, seams, screws, circuit patterns or segmented limbs.
- **Small asymmetries:** the antenna grows off-centre and leans, the right ear cushion is 12 % bigger and tilted, and the crown is slightly fuller on one side.
- **Readable at low resolution.** Big shapes, one dark visor against a light shell, glowing eyes.
- **Colour carries meaning.** The section hue (amber agents, aqua automation, coral apps, sky research, cream studio) lights the eyes, the chest bubble, the rim light and the antenna glow. The indigo accent is constant: a signature, not a signal.
- **Personality:** friendly, curious and quick, slightly playful without being childish.

## 2. How Auri is built today (procedural)

All code is in `src/gl/mascot/`.

| File | What it does |
|---|---|
| `shapes.ts` | Sculpts every part from high-resolution spheres reshaped per direction (superellipsoids plus soft directional bulges). The visor is sampled from the same surface as the head, so it hugs it exactly. The chest emblem is an extruded, bevelled speech bubble bent to the body's curve. |
| `materials.ts` | Satin silicone, soft-touch body, indigo felt cushions, the glossy indigo antenna tip and the emblem glass (`MeshPhysicalMaterial`: sheen, light clearcoat). No textures; `bakeWarmth()` adds a soft vertex-colour variation. |
| `faceMaterial.ts` | The face: a signed-distance-field shader for the bubble visor, both eyes, lids, smile crescents, gaze, catch-lights, blush, the talking waveform and the typing dots. |
| `expressions.ts` | Eleven expressions as parameter sets: neutral, happy, curious, surprised, thinking, focused, talking, excited, confused, sleepy, proud. |
| `poses.ts` | Story poses used by page sections: expression + arrival gesture + hue + glyph styling + body turn. |
| `ProceduralMascot.ts` | Assembles the rig and animates it. |
| `rig.ts` | The `MascotRig` interface the website talks to. |
| `GltfMascot.ts` | The same interface, for an authored GLB. |

### Animation system (all frame-rate independent)
- **Gaze leads.** Eyes (fast), then head (medium), then body (slow) follow the cursor, with clamps (head yaw ±31°, pitch ±19°). Micro-saccades run when the pointer is idle. A call to action under the pointer draws Auri's gaze to it.
- **Blinking:** random intervals of 2.2 to 5.6 s, with an 18 % chance of a double blink.
- **Idle life:**
  - breathing, plus a slow sway and head drift;
  - after 28 s with no input, Auri gets **sleepy** and wakes with a startle on the next input.
- **Springs everywhere.** The hands and the sprout are damped springs, so every move has follow-through. A jump has gravity and squash-and-stretch on landing.
- **Gestures:** keyframed hand targets layered over the springs: wave, point, think (hand to chin), cheer (both hands up and a hop), present (palm toward the content), shrug, nod.
- **Reactions:**
  - **Poke** (click on Auri): surprised, then happy, plus a hop and a boing of the sprout.
  - **Startle:** a very fast pointer flick near Auri.
  - **Notice:** the pointer arriving near Auri makes it curious.
- **Story choreography** (`src/gl/World.ts`):
  - Each page section can hold an empty box `data-mascot-anchor data-pose="…"`. Auri frames itself into the most central visible box.
  - Auri glides over short distances, and pops out and back in over long ones, so it never sweeps across text.
  - On arrival it changes pose, plays the gesture, shifts hue and runs a glyph sweep.
  - The boxes are ordinary CSS, so the choreography is responsive by construction. Scrolling is never hijacked.
- **Page events.** Any script can send `window.dispatchEvent(new CustomEvent('adai:mascot', { detail: { expression, gesture, pose, hue } }))`. The demos and the brief builder use this.

### Reduced motion
With `prefers-reduced-motion`, or the header toggle:
- no idle motion, gestures, springs, glide or glyph animation;
- Auri holds a static pose and renders only when something changes.

## 3. The glyph renderer (Auri in letters)

Code: `src/gl/passes/`.
1. Auri renders into an HDR target with a transparent background.
2. A reduction pass reads each glyph cell in **screen pixels**, on exactly the grid the composite draws, and stores the cell's average colour and its **maximum** coverage. Any cell the silhouette touches counts as part of it.
3. The composite decides **per cell**: either glyph or 3D, never a blend. Glyphs come from a ramp set in IBM Plex Mono (`· . : - ~ + = * o x % # @`), and the densest glyph is the ADAI mark itself.

**The reveal.** While the cursor is over Auri, or briefly after a tap on touch screens, a dissolve disc grows from the cursor over 0.7 s:
- every frame, its target radius is the distance to the furthest corner of Auri's **projected bounding box** (hands, antenna and gestures included);
- at full activation, coverage is forced complete;
- glyphs are only drawn where the rendered silhouette is, so the effect never bleeds into the background.

### Coverage fix (revision 2)

The first version left pieces of the 3D model visible, most noticeably on the left. The causes were:
- a fixed-size circular lens that could never cover the whole character;
- a deliberate 12 % "ghost" of the 3D render under the glyphs;
- a coverage gate that let thin edge slivers (hands, silhouette edges) pass through;
- a grid mismatch between the two passes that drifted by a few pixels across the screen;
- partial cells cross-fading between the two layers.

All five are fixed. `?glyphdebug` paints any 3D pixel left uncovered at full activation magenta. The automated test and `scripts/glyph-probe.mjs --metric` count **0** at every probed position (face left, centre and right, head top, body, both hands). Before and after: `docs/screenshots/glyph-before-after.png`.

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
- `npm run mascot:glb`: exports the live procedural Auri as `assets-src/mascot/auri-blockout.glb` (2 MB), with named nodes per the contract below. It's the **starting blockout for Blender**: correct proportions and naming, ready to retopologise, UV, rig and animate.
- `npm run poster`: renders `public/mascot/poster.{png,webp}` from the site's own renderer. It's the still shown before WebGL starts and whenever WebGL is unavailable. Re-run it after changing Auri.

Both scripts need the dev server (`npm run dev`) running.

### GLB contract

To replace the procedural Auri, deliver a GLB with:

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

## 5. Producing the final hand-authored Auri (recommended plan)

1. **Concept round.** Three to five sheets exploring proportions and materials around this design: the bubble head and the mark's eyes are fixed; the rest is open.
   - Higgsfield: generation was **not** used. On 15 November 2026 its unlimited allowance reported `available: false` and the balance was 0.05 credits, so nothing was generated to avoid paid credits.
   - If the allowance is activated, use `generate_image` for turnaround and expression sheets from written prompts only. Never use reference images of other mascots or of the studied site.
2. **Blockout.** Start from `assets-src/mascot/auri-blockout.glb` in Blender. Proportions and names are already correct.
3. **Sculpt and retopologise** to budget. Add subtle surface detail: soft creases where the head meets the body, a stitched seam on the plush, a slight dent in the cushions.
4. **UV and textures:** a subtle colour variation on the silicone, and a plush fibre normal. Bake to KTX2.
5. **Rig:** root, spine, neck, head, hands, and a two-bone sprout chain. Do not bake look-at; the site does it.
6. **Animate** the clips in the contract. Keep them additive-friendly and avoid root motion.
7. **Swap.** Drop `adi.glb` in `public/mascot/`, set the manifest, re-run `npm run poster`, then run the tests.

AI image-to-3D output (e.g. Higgsfield `generate_3d`) is a **blockout only**. It still needs steps 3 to 6.

## 6. Decisions for Alex
- Whether Auri appears on case-study pages (currently it doesn't, to keep them fast and focused).
- Whether to commission a hand-authored Auri or keep the procedural one: it already meets the budgets.
