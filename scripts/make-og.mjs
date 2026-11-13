// Photographs every share card at /og/<slug> into public/og/<slug>.png.
// Needs the site running locally: `npm run build && npm start`, then `npm run og`.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const pages = ["home", "work", "research", "studio", "contact"];
const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const projects = [...sitemap.matchAll(/\/work\/([a-z0-9-]+)</g)].map((match) => match[1]);

await mkdir("public/og", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const slug of [...pages, ...projects]) {
  await page.goto(`${base}/og/${slug}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".og").screenshot({ path: `public/og/${slug}.png` });
  console.log(`og  ${slug}`);
}
await browser.close();
