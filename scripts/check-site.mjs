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
    if (!href.includes("?")) ok(`link ${href}`, href === "mailto:alex@adai.systems");
    else ok("link mailto with a prefilled brief", href.startsWith("mailto:alex@adai.systems?subject="));
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

// The web on the home page.
await page.goto(base, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
ok("web: every node is also a plain link", (await page.locator(".web-links a").count()) === 19, `${await page.locator(".web-links a").count()} links`);
const painted = await page.locator(".web canvas").evaluate((canvas) => {
  const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
  let lit = 0;
  for (let index = 3; index < data.length; index += 400) if (data[index] > 0) lit++;
  return lit;
});
ok("web: the canvas has drawn", painted > 50, `${painted} sampled pixels`);
await page.locator('.web-links a[data-node="margin"]').focus();
await page.waitForTimeout(250);
ok("web: focusing a link shows that node's card", (await page.locator(".web-card-title").textContent()) === "Margin");
await page.keyboard.press("Enter");
await page.waitForURL("**/work/margin");
ok("web: a node opens its case study", (await page.locator("h1").textContent()) === "Margin");
ok("home: no form element anywhere", (await page.locator("form").count()) === 0);

// The portfolio grid.
await page.goto(`${base}/work`, { waitUntil: "networkidle" });
const all = await page.locator(".wk-card").count();
await page.locator(".wk-filters button", { hasText: "Research" }).click();
await page.waitForTimeout(200);
const some = await page.locator(".wk-card").count();
ok("work: a filter narrows the grid", some > 0 && some < all, `${all} then ${some}`);

// A case study: the video, the gallery and STEVIE.
await page.goto(`${base}/work/margin`, { waitUntil: "networkidle" });
ok("case study: the demo video waits to be asked", (await page.locator("video").getAttribute("preload")) === "none");
await page.locator(".cs-tile").first().click();
ok("gallery: selecting an image opens the lightbox", await page.locator("dialog.cs-box").evaluate((dialog) => dialog.open));
await page.keyboard.press("ArrowRight");
await page.keyboard.press("Escape");
await page.waitForTimeout(200);
ok("gallery: Escape closes it", !(await page.locator("dialog.cs-box").evaluate((dialog) => dialog.open)));
await page.goto(`${base}/work/glimmer`, { waitUntil: "networkidle" });
await page.locator(".st-prompts button").nth(7).click();
await page.waitForTimeout(4000);
ok("stevie: the real reply is typed out exactly", (await page.locator(".st-sr").textContent())?.includes("8 times 9") ?? false);

// The brief builder.
await page.goto(`${base}/start?type=products`, { waitUntil: "networkidle" });
ok("start: ?type= preselects the service", (await page.locator('button[aria-pressed="true"]').first().textContent())?.includes("Apps and products") ?? false);
await page.locator("textarea").fill("A booking tool for a small clinic.");
const mailto = await page.locator('a.btn-primary[href^="mailto:"]').first().getAttribute("href");
ok("start: the email link carries the brief", (mailto ?? "").startsWith("mailto:alex@adai.systems?subject=") && decodeURIComponent(mailto ?? "").includes("A booking tool for a small clinic."));
ok("start: no form element, nothing to submit", (await page.locator("form").count()) === 0);
const stored = await page.evaluate(() => window.localStorage.length + window.sessionStorage.length + document.cookie.length);
ok("privacy: nothing stored in the browser", stored === 0, `${stored}`);

// Navigation on a phone.
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const small = await phone.newPage();
await small.goto(base, { waitUntil: "networkidle" });
await small.getByRole("button", { name: "Menu" }).click();
ok("menu: opens on a phone", await small.locator("#site-nav a", { hasText: "Services" }).isVisible());
await small.locator("#site-nav a", { hasText: "Services" }).click();
await small.waitForURL("**/services");
ok("menu: closes after choosing a page", !(await small.locator("#site-nav a", { hasText: "Research" }).isVisible()));
await phone.close();

ok("no page errors during interaction", errors.length === 0, errors.join(" | "));

await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
