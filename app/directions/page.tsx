import type { Metadata } from "next";
import Link from "next/link";
import { previewOnly } from "@/lib/preview";
import { Frames, type Direction } from "@/components/directions/frames";
import "./directions.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Three directions",
  description: "Three directions for the new adai.systems, side by side.",
};

const directions: Direction[] = [
  {
    id: "terminal",
    letter: "A",
    name: "Lab Terminal",
    concept: "The studio as a running terminal.",
    rationale:
      "This one takes Glimmer's own palette and panel layout, so the site looks like the studio's newest work. Ghostty and Oxide both open on the product running, not on a slogan. Modal builds its texture out of glyphs, which is where the dot-matrix headline comes from. Teenage Engineering supplied the tiny numbered navigation.",
    specs: [
      { label: "Type", value: "Doto (dot matrix) for display, JetBrains Mono for everything else" },
      { label: "Colour", value: "Near-black with amber, green and periwinkle, lifted from Glimmer" },
      { label: "Layout", value: "Bordered panels with titles set into the frame, tables over cards" },
      { label: "Motion", value: "Stepped and typed. Nothing fades." },
      { label: "Signature", value: "A terminal you can type into. `stevie` replays real, unedited replies from the 13.8M parameter model. Keys 1 to 6 jump between sections." },
    ],
    swatches: ["#0b0c10", "#f2c46e", "#7fc69a", "#93a8f5", "#d9dce6"],
    strengths: [
      "The most ownable. It is the look of the studio's own software.",
      "STEVIE is on the first screen, and you can talk to it straight away.",
      "The densest of the three. Most information per screen.",
    ],
    risks: [
      "A portfolio dressed as a terminal is a known idea. It lives or dies on the detail.",
      "Mono text everywhere is slower to read for a client who is not technical.",
      "Dark only, and its pitch to new clients is the quietest of the three.",
    ],
  },
  {
    id: "specimen",
    letter: "B",
    name: "Specimen",
    concept: "The studio as a type poster that reacts to you.",
    rationale:
      "One variable typeface does all the work. Rauno's site is a single plain sentence set huge beside one flat circle of colour. Oh No and Pangram treat type as the image. Snellenberg sets a name so large it runs off the page. Here the headline fills the screen and each letter stretches and thickens towards the cursor.",
    specs: [
      { label: "Type", value: "Anybody (variable width and weight) for display, Hanken Grotesk for reading" },
      { label: "Colour", value: "White, black, one hot orange and a yellow highlighter" },
      { label: "Layout", value: "Edge-to-edge type, full-bleed colour tiles, a numbered index, sticky year numerals" },
      { label: "Motion", value: "Kinetic type, hard snaps, a running lineage band you can pause" },
      { label: "Signature", value: "The headline responds to the cursor, letter by letter, and never reflows" },
    ],
    swatches: ["#ffffff", "#0a0a0a", "#ff4b14", "#ffe600"],
    strengths: [
      "The loudest first impression, and it needs no imagery to land.",
      "The contact band is the strongest sales moment of the three.",
      "The simplest to maintain and the lightest to load.",
    ],
    risks: [
      "The cursor effect is a desktop pleasure. On a phone it plays once on load and that is all.",
      "Heavy capitals everywhere can tire. It reads more design studio than AI lab.",
      "Black, white and orange brutalism is in fashion now, so it may date.",
    ],
  },
  {
    id: "orbit",
    letter: "C",
    name: "Orbit",
    concept: "The studio as a living map of how one project led to the next.",
    rationale:
      "Fourteen projects as discs on a flat blue field, joined by the reason each one led to another. Rauno's yellow circle and the ADAI mark itself are both discs. Mistral shows an AI lab can be built from flat blocks of colour. Poolsuite and tldraw give visitors something to pick up and move in the first screen.",
    specs: [
      { label: "Type", value: "Fraunces (soft, heavy, no italics) for display, Instrument Sans for reading" },
      { label: "Colour", value: "Cobalt, lemon, mint, tomato and a deep navy, in flat fields" },
      { label: "Layout", value: "Colour bands that slide over each other like sheets, discs as the recurring shape" },
      { label: "Motion", value: "Springy and physical. Things overshoot and settle." },
      { label: "Signature", value: "A physics network you can drag. Select a disc and it explains its links." },
    ],
    swatches: ["#2038ec", "#ffe45c", "#b9f2d0", "#ff5a3c", "#0d1440", "#fff8e8"],
    strengths: [
      "The lineage is the hero at last. It shows how the work connects, which is the studio's best story.",
      "The friendliest for a visitor who is not technical.",
      "The furthest from the old site and from every other AI studio site.",
    ],
    risks: [
      "A soft serif on bright colour can read as a consumer brand, not an engineering studio.",
      "The map is crowded on a phone. Labels sit close together.",
      "The row of white cards under Selected work is the most ordinary thing on any of the three pages.",
    ],
  },
];

export default function DirectionsPage() {
  previewOnly();
  return (
    <main className="dirs">
      <header className="intro">
        <h1>Three directions for adai.systems</h1>
        <p>
          The same content, three different sites. Every word and picture is real: nothing is placeholder. Scroll inside
          any preview, or open it full screen to try it properly.
        </p>
        <p className="ask">
          The site now on this branch is A with C&apos;s map as its archive and B&apos;s scale on the contact band. If
          you would sooner go another way, say which: one of these as it stands, another round of three, or a different
          mix. <Link href="/">Open the built site</Link>.
        </p>
      </header>
      <Frames directions={directions} />
      <footer className="outro">
        <p>
          Preview only. Not linked from anywhere, hidden from search engines, and switched off in production.
        </p>
      </footer>
    </main>
  );
}
