// QA for the built site. Run against a local production server:
//   npm run build && npm start   then   npm run check
// It checks every page at four widths for overflow and console errors, runs
// axe on each page, drives the interactive parts, and follows every link.
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const shots = process.argv.includes("--shots");
const WIDTHS = [375, 768, 1280, 1920];
let failures = 0;
const ok = (name, pass, detail = "") => {
  if (!pass) failures += 1;
  console.log(`${pass ? "ok  " : "FAIL"}  ${name}${detail ? "  " + detail : ""}`);
};

const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const routes = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((match) => match[1] || "/");
routes.push("/this-page-does-not-exist");
const browser = await chromium.launch();
if (shots) await mkdir("design/screenshots/site", { recursive: true });

// 1. Layout, console and accessibility, page by page.
const links = new Map();
for (const route of routes) {
  const name = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
  const problems = [];
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => message.type() === "error" && !message.text().includes("404") && errors.push(message.text()));
    await page.goto(base + route, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 1) problems.push(`overflow ${overflow}px at ${width}`);
    if (errors.length) problems.push(`console at ${width}: ${errors[0]}`);
    if (width === 1280) {
      const h1 = await page.locator("h1").count();
      if (h1 !== 1) problems.push(`${h1} h1 elements`);
      const missingAlt = await page.locator("img:not([alt])").count();
      if (missingAlt) problems.push(`${missingAlt} images without alt`);
      const text = await page.locator("body").innerText();
      if (text.includes("\u2014")) problems.push("em dash in copy");
      if (/TODO/.test(text)) problems.push("TODO in copy");
      for (const href of await page.locator("a[href]").evaluateAll((items) => items.map((a) => a.getAttribute("href")))) {
        if (!links.has(href)) links.set(href, route);
      }
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      for (const violation of axe.violations) problems.push(`axe ${violation.id} (${violation.nodes.length}): ${violation.nodes[0].target.join(" ")}`);
    }
    if (shots) {
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 700) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 40));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(250);
      await page.screenshot({ path: `design/screenshots/site/${name}-${width}.jpg`, type: "jpeg", quality: 62, fullPage: true });
    }
    await context.close();
  }
  ok(`page ${route}`, problems.length === 0, problems.join(" | "));
}

// 2. Every link goes somewhere.
for (const [href, from] of links) {
  if (href.startsWith("mailto:")) {
    ok(`link ${href}`, href === "mailto:alex@adai.systems");
    continue;
  }
  if (href.startsWith("#")) continue;
  const url = href.startsWith("/") ? base + href : href;
  try {
    const response = await fetch(url, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (link check)" } });
    ok(`link ${href}`, response.status < 400, response.status >= 400 ? `status ${response.status}, first seen on ${from}` : "");
  } catch (error) {
    ok(`link ${href}`, false, String(error).slice(0, 80));
  }
}

// 3. The interactive parts.
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
await page.goto(base, { waitUntil: "networkidle" });
await page.fill("#shell-input", "open glimmer");
await page.keyboard.press("Enter");
ok("shell: open glimmer prints the project", await page.locator(".shell-log").getByText("Rust, Burn, Metal, Ratatui").isVisible());
ok("shell: it links to the case study", (await page.locator('.shell-log a[href="/work/glimmer"]').count()) === 1);
await page.fill("#shell-input", "stevie 8");
await page.keyboard.press("Enter");
await page.waitForTimeout(3300);
ok("shell: stevie 8 types the real reply", await page.locator(".shell-log").getByText("8 times 9").isVisible());
await page.fill("#shell-input", "nonsense");
await page.keyboard.press("Enter");
ok("shell: unknown command is handled", await page.locator(".shell-log").getByText("command not found: nonsense").isVisible());
ok("privacy: the page has no form element", (await page.locator("form").count()) === 0);

const node = page.getByRole("button", { name: /^Lockout\./ });
await node.scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
await node.click();
ok("map: selecting a disc fills the inspector", (await page.locator(".inspect h3").textContent()) === "Lockout");
const before = await node.boundingBox();
await page.mouse.move(before.x + before.width / 2, before.y + 20);
await page.mouse.down();
await page.mouse.move(before.x - 120, before.y - 90, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(300);
ok("map: a disc can be dragged", Math.abs((await node.boundingBox()).x - before.x) > 40);
await page.locator(".inspect").getByRole("link", { name: /case study/ }).click();
await page.waitForURL("**/work/lockout");
ok("map: the inspector opens the case study", page.url().endsWith("/work/lockout"));

await page.locator("body").click({ position: { x: 4, y: 300 } });
await page.keyboard.press("2");
await page.waitForURL("**/work");
ok("keys: 2 opens the archive", page.url().endsWith("/work"));
await page.getByRole("button", { name: "research" }).click();
ok("archive: filter narrows the table", (await page.locator(".ls-table tbody tr").count()) === 5);
await page.locator(".ls-table tbody a").first().click();
await page.waitForURL("**/work/glimmer");
ok("archive: a row opens its case study", (await page.locator("h1").textContent()) === "Glimmer");

// 4. The tweaks bar (never present in production builds).
await page.goto(`${base}/?tweaks=1`, { waitUntil: "networkidle" });
const bar = page.locator(".tweaks");
if (await bar.count()) {
  const root = page.locator("#site");
  await bar.locator("select").first().selectOption("paper");
  ok("tweaks: a palette changes the page", (await root.evaluate((el) => getComputedStyle(el).backgroundColor)) === "rgb(243, 241, 234)");
  await bar.getByText("Surfaces").click();
  await bar.locator("label", { hasText: "Corner radius" }).locator("input").fill("20");
  ok("tweaks: a slider writes its variable", (await root.evaluate((el) => el.style.getPropertyValue("--radius"))) === "20px");
  await page.reload({ waitUntil: "networkidle" });
  ok("tweaks: settings survive a refresh", (await page.locator("#site").evaluate((el) => el.style.getPropertyValue("--radius"))) === "20px");
  await page.locator(".tweaks").getByRole("button", { name: "Surprise me" }).click();
  await page.locator(".tweaks").getByRole("button", { name: "Reset" }).click();
  ok("tweaks: reset restores the baked design", (await page.locator("#site").evaluate((el) => el.getAttribute("style") || "")) === "");
  const count = await page.locator(".tweaks header p").textContent();
  ok("tweaks: control count", /^7\d controls/.test(count ?? ""), count ?? "");
} else {
  console.log("note  tweaks bar not present in this build (expected in production)");
}
await page.goto(base, { waitUntil: "networkidle" });
ok("tweaks: absent without ?tweaks=1", (await page.locator(".tweaks, .tweaks-tab").count()) === 0);
ok("no page errors during interaction", errors.length === 0, errors.join(" | "));

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
