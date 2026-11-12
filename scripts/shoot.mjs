// Screenshots a local page at one or more widths.
// Usage: node scripts/shoot.mjs <path> <outPrefix> [widths=1440,390] [--fold]
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const [route, prefix, widthsArg] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const fold = process.argv.includes("--fold");
const base = process.env.BASE_URL ?? "http://localhost:3210";
const widths = (widthsArg ?? "1440,390").split(",").map(Number);
await mkdir(path.dirname(prefix), { recursive: true });
const browser = await chromium.launch();
for (const width of widths) {
  const mobile = width < 600;
  const context = await browser.newContext({
    viewport: { width, height: mobile ? 844 : 900 },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await page.goto(base + route, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  if (!fold) {
    // Scroll through once so lazy images load before the full-page capture.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(600);
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await page.screenshot({ path: `${prefix}-${width}${fold ? "-fold" : ""}.jpg`, type: "jpeg", quality: 80, fullPage: !fold });
  console.log(`${route} @${width}: overflow ${overflow}px, errors ${errors.length}${errors.length ? " -> " + errors.slice(0, 3).join(" | ") : ""}`);
  await context.close();
}
await browser.close();
