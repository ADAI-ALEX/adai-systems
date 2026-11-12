// Lists the elements that stick out past the right edge of the viewport.
// Usage: node scripts/find-overflow.mjs <path> [widths=390,768]
import { chromium } from "playwright";
const [route, widthsArg] = process.argv.slice(2);
const base = process.env.BASE_URL ?? "http://localhost:3210";
const browser = await chromium.launch();
for (const width of (widthsArg ?? "390,768").split(",").map(Number)) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(base + route, { waitUntil: "networkidle" });
  const found = await page.evaluate((limit) => {
    const out = [];
    for (const el of document.querySelectorAll("body *")) {
      const box = el.getBoundingClientRect();
      if (box.width && box.right > limit + 1) {
        let scrollable = false;
        for (let p = el.parentElement; p; p = p.parentElement) {
          const o = getComputedStyle(p).overflowX;
          if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip") { scrollable = true; break; }
        }
        if (!scrollable) out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ").join(".")} right=${Math.round(box.right)}`);
      }
    }
    return [document.documentElement.scrollWidth, ...out.slice(0, 12)];
  }, width);
  console.log(`${route} @${width}: scrollWidth ${found[0]}`, found.slice(1));
  await page.close();
}
await browser.close();
