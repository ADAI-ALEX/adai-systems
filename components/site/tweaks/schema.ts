import type { TokenName } from "@/design/tokens";

/**
 * Every control in the tweaks bar.
 * A control either writes a CSS variable on the site root (`css`) or flips a
 * data attribute on it (`attr`). The page's styles read both, so every change
 * is live and nothing needs a rebuild.
 */
export type Control =
  | { type: "range"; id: string; label: string; css: string; min: number; max: number; step: number; unit: string; fallback: number }
  | { type: "colour"; id: string; label: string; css: string }
  | { type: "select"; id: string; label: string; css: string; options: [value: string, label: string][] }
  | { type: "choice"; id: string; label: string; attr: TokenName; options: [value: string, label: string][] }
  | { type: "toggle"; id: string; label: string; attr: TokenName };

export type Group = { name: string; controls: Control[] };

const range = (label: string, css: string, min: number, max: number, step: number, unit: string, fallback: number): Control => ({
  type: "range", id: css, label, css, min, max, step, unit, fallback,
});
const colour = (label: string, css: string): Control => ({ type: "colour", id: css, label, css });
const choice = (label: string, attr: TokenName, options: [string, string][]): Control => ({
  type: "choice", id: attr, label, attr, options,
});
const toggle = (label: string, attr: TokenName): Control => ({ type: "toggle", id: attr, label, attr });

export const DISPLAY_FONTS: [string, string][] = [
  ["var(--font-dot), ui-monospace, monospace", "Doto (dot matrix)"],
  ["var(--font-mono), ui-monospace, monospace", "JetBrains Mono"],
  ["var(--font-pixel), ui-monospace, monospace", "Pixelify Sans"],
  ["var(--font-wide), sans-serif", "Anybody (poster)"],
  ["var(--font-soft), Georgia, serif", "Fraunces (soft serif)"],
];
export const BODY_FONTS: [string, string][] = [
  ["var(--font-mono), ui-monospace, monospace", "JetBrains Mono"],
  ["var(--font-grotesk), system-ui, sans-serif", "Hanken Grotesk"],
  ["var(--font-sans), system-ui, sans-serif", "Instrument Sans"],
];

/** Named palettes. Choosing one sets all nine base colours at once. */
export const PALETTES: Record<string, { label: string; colours: Record<string, string> }> = {
  glimmer: {
    label: "Glimmer (default)",
    colours: { "--bg": "#0b0c10", "--panel": "#10121a", "--line-base": "#2a2e3a", "--ink": "#d9dce6", "--dim-base": "#8a90a3", "--accent-base": "#f2c46e", "--ok-base": "#7fc69a", "--info-base": "#93a8f5", "--warn-base": "#ee8478" },
  },
  phosphor: {
    label: "Phosphor",
    colours: { "--bg": "#050805", "--panel": "#0a110a", "--line-base": "#1f3522", "--ink": "#c8f5c8", "--dim-base": "#74ab7c", "--accent-base": "#7cff6b", "--ok-base": "#b4ff9f", "--info-base": "#5fd4c4", "--warn-base": "#ffb347" },
  },
  signal: {
    label: "Signal",
    colours: { "--bg": "#0a0a0a", "--panel": "#151515", "--line-base": "#343434", "--ink": "#ffffff", "--dim-base": "#a0a0a0", "--accent-base": "#ff5a26", "--ok-base": "#ffe600", "--info-base": "#ffffff", "--warn-base": "#ff8a70" },
  },
  cobalt: {
    label: "Cobalt",
    colours: { "--bg": "#2038ec", "--panel": "#1a2fd0", "--line-base": "#5a6ef6", "--ink": "#fff8e8", "--dim-base": "#ccd3ff", "--accent-base": "#ffe45c", "--ok-base": "#b9f2d0", "--info-base": "#ffffff", "--warn-base": "#ffb4a3" },
  },
  paper: {
    label: "Paper (light)",
    colours: { "--bg": "#f3f1ea", "--panel": "#e8e5da", "--line-base": "#c4c0b2", "--ink": "#17181c", "--dim-base": "#575b67", "--accent-base": "#a8400a", "--ok-base": "#176b3b", "--info-base": "#2543c4", "--warn-base": "#ad241c" },
  },
};

export const GROUPS: Group[] = [
  {
    name: "Palette",
    controls: [
      colour("Background", "--bg"),
      colour("Panel", "--panel"),
      colour("Lines", "--line-base"),
      colour("Text", "--ink"),
      colour("Quiet text", "--dim-base"),
      colour("Accent", "--accent-base"),
      colour("Live / success", "--ok-base"),
      colour("Links / info", "--info-base"),
      colour("Warning", "--warn-base"),
      range("Hue shift", "--hue", -180, 180, 1, "", 0),
      range("Contrast", "--contrast", 0.7, 1.4, 0.01, "", 1),
    ],
  },
  {
    name: "Type",
    controls: [
      { type: "select", id: "--display", label: "Heading font", css: "--display", options: DISPLAY_FONTS },
      { type: "select", id: "--body", label: "Body font", css: "--body", options: BODY_FONTS },
      range("Body size", "--base", 0.8125, 1.125, 0.0125, "rem", 0.9375),
      range("Scale ratio", "--scale", 1.05, 1.5, 0.01, "", 1.2),
      range("Heading weight", "--display-weight", 100, 900, 50, "", 900),
      range("Body weight", "--body-weight", 300, 700, 50, "", 400),
      range("Heading tracking", "--display-tracking", -0.08, 0.1, 0.005, "em", -0.03),
      range("Body tracking", "--body-tracking", -0.03, 0.08, 0.005, "em", 0),
      range("Heading line height", "--display-leading", 0.8, 1.3, 0.01, "", 0.92),
      range("Body line height", "--body-leading", 1.3, 1.9, 0.01, "", 1.6),
      {
        type: "select", id: "--display-case", label: "Heading case", css: "--display-case",
        options: [["none", "As written"], ["uppercase", "UPPERCASE"], ["lowercase", "lowercase"]],
      },
      range("Headline size", "--h1-size", 0.6, 1.4, 0.01, "", 1),
    ],
  },
  {
    name: "Layout",
    controls: [
      range("Max width", "--max", 60, 120, 1, "rem", 96),
      range("Side gutter", "--gutter", 0.5, 4, 0.125, "rem", 2),
      range("Section spacing", "--section", 0.5, 1.8, 0.05, "", 1),
      range("Density", "--density", 0.6, 1.6, 0.05, "", 1),
      range("Column balance", "--hero-split", 0.7, 2, 0.05, "fr", 1.2),
      choice("Section headings", "align", [["start", "Left, with a note beside"], ["centre", "Centred"]]),
      range("Card minimum width", "--cols-min", 12, 26, 0.5, "rem", 17),
      range("Archive row height", "--row-pad", 0.3, 1.2, 0.05, "rem", 0.6),
    ],
  },
  {
    name: "Hero",
    controls: [
      choice("Arrangement", "hero", [["split", "Headline left, terminal right"], ["flip", "Terminal left"], ["stack", "Stacked"]]),
      range("Minimum height", "--hero-min", 60, 100, 1, "", 100),
      range("Terminal height", "--shell-h", 40, 80, 1, "", 62),
      range("Typing speed (ms per letter)", "--type-ms", 5, 80, 1, "", 22),
      choice("Caret", "caret", [["block", "Block"], ["bar", "Bar"], ["underline", "Underline"]]),
      choice("Headline colour", "headline", [["accent", "Accent"], ["ink", "Text colour"]]),
      toggle("Opening demo in the terminal", "boot"),
      toggle("Counts under the headline", "stats"),
    ],
  },
  {
    name: "Surfaces",
    controls: [
      range("Corner radius", "--radius", 0, 24, 1, "px", 6),
      range("Border width", "--border", 0, 4, 0.5, "px", 1),
      {
        type: "select", id: "--border-style", label: "Border style", css: "--border-style",
        options: [["solid", "Solid"], ["dashed", "Dashed"], ["dotted", "Dotted"], ["double", "Double"]],
      },
      range("Panel fill", "--panel-fill", 0, 1, 0.05, "", 0),
      choice("Shadow", "shadow", [["none", "None"], ["glow", "Glow"], ["hard", "Hard offset"]]),
      range("Grain", "--grain", 0, 0.4, 0.01, "", 0),
      choice("Background pattern", "pattern", [["dots", "Dot grid"], ["grid", "Square grid"], ["lines", "Scan lines"], ["none", "None"]]),
      range("Pattern size", "--pattern-size", 8, 48, 1, "px", 18),
      range("Pattern strength", "--pattern-alpha", 0, 1.6, 0.05, "", 1),
      choice("Panel titles", "titles", [["inset", "Set into the border"], ["tab", "Tab above"], ["none", "Hidden"]]),
    ],
  },
  {
    name: "Motion",
    controls: [
      range("Global speed (0 is instant)", "--speed", 0, 3, 0.05, "", 1),
      {
        type: "select", id: "--ease", label: "Easing", css: "--ease",
        options: [["steps(2)", "Stepped"], ["ease-out", "Ease out"], ["cubic-bezier(0.34, 1.56, 0.64, 1)", "Spring"], ["linear", "Linear"]],
      },
      choice("Section entrance", "entrance", [["none", "None"], ["fade", "Fade"], ["rise", "Rise"]]),
      toggle("Replay entrances on scroll", "replay"),
      toggle("Reading progress line", "progress"),
      toggle("Caret blink", "blink"),
      range("Hover lift", "--lift", 0, 8, 0.5, "px", 2),
      toggle("Preview reduced motion", "reduce"),
    ],
  },
  {
    name: "Components",
    controls: [
      choice("Buttons", "buttons", [["solid", "Solid"], ["outline", "Outline"], ["bracket", "[ Bracket ]"]]),
      choice("Links", "links", [["underline", "Underline"], ["bracket", "[Bracket]"], ["highlight", "Highlight"]]),
      choice("Cursor", "cursor", [["default", "Default"], ["crosshair", "Crosshair"], ["block", "Block"]]),
      choice("Panels", "cards", [["panel", "Bordered"], ["filled", "Filled"], ["flat", "Flat, rule on top"]]),
      choice("Navigation", "nav", [["tabs", "Numbered tabs"], ["plain", "Plain links"], ["boxed", "Boxed"]]),
      choice("Status marks", "status", [["dot", "Dot and label"], ["tag", "Tag"], ["text", "Label only"]]),
      range("Button height", "--btn-h", 2.25, 4, 0.125, "rem", 2.75),
      range("Focus ring", "--ring", 1, 4, 0.5, "px", 2),
    ],
  },
  {
    name: "Imagery",
    controls: [
      choice("Treatment", "image", [["none", "As captured"], ["mono", "Monochrome"], ["amber", "Amber duotone"], ["hard", "High contrast"]]),
      range("Saturation", "--img-sat", 0, 2, 0.05, "", 1),
      range("Contrast", "--img-contrast", 0.6, 1.6, 0.05, "", 1),
      range("Brightness", "--img-bright", 0.6, 1.4, 0.05, "", 1),
      range("Image radius", "--img-radius", 0, 24, 1, "px", 6),
      range("Phone radius", "--phone-radius", 0, 36, 1, "px", 14),
      choice("Screenshot crop", "crop", [["natural", "Natural"], ["wide", "16:9"], ["square", "Square"]]),
      choice("Pixel art scaling", "pixels", [["crisp", "Crisp"], ["smooth", "Smooth"]]),
      toggle("Image borders", "frames"),
    ],
  },
];

export const CONTROL_COUNT = GROUPS.reduce((sum, group) => sum + group.controls.length, 0) + 1; // + the palette picker
