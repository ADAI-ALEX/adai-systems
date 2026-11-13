# Design

| File | What it is |
|---|---|
| `tokens.css` | Every continuous design value: colours, type, spacing, timing. The baked config. |
| `tokens.ts` | Every discrete design choice: button style, panel style, pattern and so on. Set as data attributes on the site root. |
| `taste-brief.md` | What the reference sites have in common and what that means for ADAI |
| `directions.md` | The three directions, the critique, and the one that was built |
| `imagery-plan.md` | Every generated image, planned before it was made, with the credit log |
| `screenshots/` | The three directions as first shown. Regenerate the full QA set with `npm run check -- --shots`. |

## Tuning the design

1. Open any page on a preview deployment (or locally) with `?tweaks=1`.
2. Adjust. Changes are live and saved in the browser. "Surprise me" rolls a new combination, "Reset" returns to the baked design.
3. Press "Copy config" and hand the JSON over.
4. To bake it: put each `css` value into `tokens.css` and each `attrs` value into `tokens.ts`.

The tweaks bar is compiled out of production builds (`next.config.ts`). It has 75 controls in eight groups: palette, type, layout, hero, surfaces, motion, components and imagery.
