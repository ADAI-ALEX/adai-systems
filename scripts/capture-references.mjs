// Captures above-the-fold screenshots of reference sites into references/found/.
// These are Claude's additions to the mood board, not Alex's picks.
// Usage: node scripts/capture-references.mjs [slug ...]
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const SITES = [
  ["rauno", "https://rauno.me"],
  ["basement", "https://basement.studio"],
  ["oxide", "https://oxide.computer"],
  ["posthog", "https://posthog.com"],
  ["teenage-engineering", "https://teenage.engineering"],
  ["ghostty", "https://ghostty.org"],
  ["sfcompute", "https://sfcompute.com"],
  ["railway", "https://railway.com"],
  ["lusion", "https://lusion.co"],
  ["poolsuite", "https://poolsuite.net"],
  ["pangram", "https://pangrampangram.com"],
  ["ohno", "https://ohnotype.co"],
  ["tldraw", "https://tldraw.dev"],
  ["neal-fun", "https://neal.fun"],
  ["modal", "https://modal.com"],
  ["locomotive", "https://locomotive.ca"],
  ["zed", "https://zed.dev"],
  ["obys", "https://obys.agency"],
  ["snellenberg", "https://dennissnellenberg.com"],
  ["mistral", "https://mistral.ai"],
  ["val-town", "https://www.val.town"],
  ["charm", "https://charm.land"],
  ["klim", "https://klim.co.nz"],
  ["browser-company", "https://thebrowser.company"],
];

const only = process.argv.slice(2);
const list = only.length ? SITES.filter(([s]) => only.includes(s)) : SITES;
await mkdir("references/found", { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
});

async function shoot([slug, url]) {
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(3500);
    await page.screenshot({ path: `references/found/${slug}.jpg`, type: "jpeg", quality: 72 });
    console.log(`ok    ${slug}  ${await page.title()}`);
  } catch (err) {
    console.log(`fail  ${slug}  ${String(err).split("\n")[0]}`);
  } finally {
    await page.close();
  }
}

const queue = [...list];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (queue.length) await shoot(queue.shift());
  }),
);
await browser.close();
