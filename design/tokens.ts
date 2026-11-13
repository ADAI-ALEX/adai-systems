/**
 * Discrete design choices, set as data attributes on the site root.
 * Continuous values (colours, sizes, timings) live in design/tokens.css.
 * Together these two files are the baked design config.
 */
export const tokens = {
  palette: "glimmer",
  displayFont: "dot",
  bodyFont: "mono",
  align: "start",
  hero: "split",
  caret: "block",
  boot: "on",
  stats: "on",
  headline: "accent",
  shadow: "none",
  pattern: "dots",
  titles: "inset",
  entrance: "none",
  progress: "on",
  replay: "off",
  reduce: "off",
  blink: "on",
  buttons: "solid",
  links: "underline",
  cursor: "default",
  cards: "panel",
  nav: "tabs",
  status: "dot",
  image: "none",
  crop: "natural",
  pixels: "crisp",
  frames: "on",
} as const;

export type TokenName = keyof typeof tokens;

/** The attributes to spread onto the site root, e.g. data-buttons="solid". */
export function tokenAttributes(): Record<string, string> {
  return Object.fromEntries(Object.entries(tokens).map(([name, value]) => [`data-${name}`, value]));
}
