// Photographs every share card at /og/<slug> into public/og/<slug>.png, then removes cards no page uses.
// Needs the site running locally (`npm run dev` or `npm run build && npm start`), then:
//   BASE_URL=http://localhost:3210 node scripts/make-og.mjs
import { chromium } from "playwright";
import { mkdir, readdir, unlink } from "node:fs/promises";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const out = "public/og";

// Page cards are fixed. Services and projects are read from the sitemap, so new ones are picked up.
const pages = ["home", "work", "services", "research", "studio", "contact", "start"];
const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const services = [...sitemap.matchAll(/\/services\/([a-z0-9-]+)</g)].map((match) => `service-${match[1]}`);
const projects = [...sitemap.matchAll(/\/work\/([a-z0-9-]+)</g)].map((match) => match[1]);
const cards = [...new Set([...pages, ...services, ...projects])];

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const clipped = [];
for (const slug of cards) {
  const response = await page.goto(`${base}/og/${slug}`, { waitUntil: "networkidle" });
  if (!response?.ok()) throw new Error(`/og/${slug} returned ${response?.status()}`);
  await page.evaluate(() => document.fonts.ready);
  // Anything that spills out of the card, or a title pushed into the top row, counts as clipped.
  const spill = await page.evaluate(() => {
    const card = document.querySelector(".og").getBoundingClientRect();
    const top = document.querySelector(".og-top").getBoundingClientRect();
    const copy = document.querySelector(".og-copy").getBoundingClientRect();
    return copy.top < top.bottom + 24 || copy.bottom > card.bottom || copy.right > card.right;
  });
  if (spill) clipped.push(slug);
  await page.locator(".og").screenshot({ path: `${out}/${slug}.png` });
  console.log(`og  ${slug}${spill ? "  (clipped)" : ""}`);
}
await browser.close();

const keep = new Set(cards.map((slug) => `${slug}.png`));
for (const file of await readdir(out)) {
  if (file.endsWith(".png") && !keep.has(file)) {
    await unlink(`${out}/${file}`);
    console.log(`removed  ${file}`);
  }
}
if (clipped.length) {
  console.error(`Clipped: ${clipped.join(", ")}`);
  process.exitCode = 1;
}
