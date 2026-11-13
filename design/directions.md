# Phase 3: three directions

> **Outcome.** Alex asked for the build to continue without a checkpoint, so the mix recommended below was built: A as the base, C's lineage map as the archive, B's scale on the contact band. The three prototypes are kept at `/directions` on preview deployments and return 404 in production.

Compared live at `/directions`. Each direction is a real, scrollable homepage built from `content/projects.ts`. Screenshots are in `design/screenshots/`.

## Information architecture (shared by all three)

1. **Hero.** Headline, one line of positioning, two actions, and the direction's signature interaction.
2. **Now building.** Lockout (live on the App Store) and Glimmer.
3. **Selected work.** JEB Depot in full, then Apex Terminal, Voice Agent, Spatial Memory Scanner, Hospitality Platform and Call Recording Analyser.
4. **The archive.** The lineage, then all fourteen projects, filterable (All, Running now, Open source, Products, Demos and tools, Research).
5. **What the studio builds.** Eight domains, each with the projects that prove it.
6. **Research.** Reinforcement Learning, Acoustic Levitation RL, Holographic Display Study, Spatial Memory Scanner.
7. **Work with me and contact.** One paragraph in the first person and one email address.
8. **Footer.** Product links, Privacy, Terms and the operator line.

Phase 5 adds a case study per featured project at `/work/[slug]`, keeping the eight existing URLs.

## The directions

| | A. Lab Terminal | B. Specimen | C. Orbit |
|---|---|---|---|
| Route | `/directions/terminal` | `/directions/specimen` | `/directions/orbit` |
| Idea | The studio as a running terminal | The studio as a type poster that reacts to you | The studio as a living map of its lineage |
| References | Ghostty, Oxide, Modal, Teenage Engineering | Rauno, Oh No, Pangram, Snellenberg | Rauno, Mistral, Poolsuite, tldraw |
| Display type | Doto (dot matrix) | Anybody (variable width and weight) | Fraunces (soft, heavy, no italics) |
| Reading type | JetBrains Mono | Hanken Grotesk | Instrument Sans |
| Colour | Near-black, amber, green, periwinkle (Glimmer's palette) | White, black, hot orange, yellow | Cobalt, lemon, mint, tomato, navy |
| Layout | Bordered panels, tables | Edge-to-edge type, colour tiles, numbered index | Colour bands as stacked sheets, discs |
| Motion | Stepped and typed | Kinetic type, hard snaps | Springs that overshoot and settle |
| Signature | A terminal you can type into, with real STEVIE replies. Keys 1 to 6 jump sections. | The headline stretches towards the cursor and never reflows | A physics network you can drag. Select a disc to read its links. |

## Honest critique

**A. Lab Terminal**
- Works: the most ownable (it is the look of the studio's own software), STEVIE is on the first screen, and it is the densest.
- Worries: a portfolio dressed as a terminal is a known idea, mono text is slower for a non-technical client, and its pitch for new work is the quietest.

**B. Specimen**
- Works: the loudest first impression with no imagery needed, the strongest contact moment, the lightest to load and maintain.
- Worries: the cursor effect is a desktop pleasure (on a phone it plays once on load), heavy capitals can tire, and the look may date. On a phone the headline is three short lines and loses most of its force.

**C. Orbit**
- Works: the lineage is the hero, it is the friendliest for non-technical visitors, and it is the furthest from the old site.
- Worries: a soft serif on bright colour can read as a consumer brand, the map is tight on a phone, and the row of white cards under Selected work is the most ordinary element across the three.

**If asked to choose:** A as it stands is the safest strong option. The mix worth trying is A's palette and terminal with C's draggable map as the archive, and B's scale for the contact band.

## Checks run

- `npm run build`, `tsc --noEmit` and `eslint` all pass.
- `node scripts/check-interactions.mjs`: 17 checks pass (terminal commands, key navigation, archive filters, kinetic headline with no overflow, marquee pause, disc select and drag, no overlapping discs, reduced motion).
- `node scripts/find-overflow.mjs`: no horizontal overflow at 320, 390, 768, 1280 or 1920 on any direction.
- No em dashes in any new copy, alt text or metadata.

## Not done at this stage, on purpose

- No Lighthouse or axe pass yet. That is Phase 6, on the chosen direction.
- Archive rows and work items do not link anywhere yet, because case-study pages come in Phase 5.
- The legal pages keep their exact wording inside a plain holding layout. The em dash swap happens in Phase 5 with a diff for Alex.
- Apex Terminal, Voice Agent, Spatial Memory Scanner and the Hospitality Platform have no screenshots yet. They are shown as text.

## About the design skill

Taste Skill (`design-taste-frontend`) is installed and recorded in `skills-lock.json`. Its installer flagged it as risk-rated, so it was read in full before use and none of its scripts were run. It is a kit that deals a hero, a palette and a section order from templates and then gates the result, which cuts against building three bespoke directions from references. So its rules were used as a checklist instead: the work as the hero, no fade-in on every section, no parallax on text, every control answers the pointer, a pause for anything that keeps moving, reduced motion rests, 44 px targets, no violet, nothing invented. Two of its house rules were set aside deliberately: "one section per screen" (the archive needs length) and "no caption under any image" (the concept illustration must be labelled as one).
