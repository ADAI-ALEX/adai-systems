// Drives the signature interaction of each direction in a real browser and reports what happened.
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3210";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
const ok = (name, pass, detail = "") => console.log(`${pass ? "ok  " : "FAIL"}  ${name}${detail ? "  " + detail : ""}`);

// A: the terminal
await page.goto(`${base}/directions/terminal`, { waitUntil: "networkidle" });
await page.fill("#shell-input", "open glimmer");
await page.keyboard.press("Enter");
ok("A terminal: open glimmer prints the project", await page.locator(".shell-log").getByText("Rust, Burn, Metal, Ratatui").isVisible());
await page.fill("#shell-input", "stevie 8");
await page.keyboard.press("Enter");
await page.waitForTimeout(3200);
ok("A terminal: stevie 8 types the real reply", await page.locator(".shell-log").getByText("8 times 9").isVisible());
await page.fill("#shell-input", "nonsense");
await page.keyboard.press("Enter");
ok("A terminal: unknown command is handled", await page.locator(".shell-log").getByText("command not found: nonsense").isVisible());
await page.locator("body").click({ position: { x: 5, y: 400 } });
await page.keyboard.press("4");
await page.waitForTimeout(2600); // a long smooth scroll
ok("A keys: 4 jumps to the archive", await page.evaluate(() => Math.abs(document.getElementById("archive").getBoundingClientRect().top) < 80));
await page.getByRole("button", { name: "research" }).click();
ok("A archive: filter narrows the table", (await page.locator(".ls-table tbody tr").count()) === 5, `rows ${await page.locator(".ls-table tbody tr").count()}`);

// B: the kinetic headline
await page.goto(`${base}/directions/specimen`, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
const letter = page.locator(".kinetic [data-ch]").nth(2);
const rest = await letter.evaluate((el) => el.style.fontVariationSettings);
const box = await letter.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
await page.waitForTimeout(500);
const near = await letter.evaluate((el) => el.style.fontVariationSettings);
const rowWidth = await page.locator(".kinetic [data-row]").first().evaluate((el) => [el.scrollWidth, el.clientWidth]);
ok("B headline: letter widens and thickens under the cursor", rest !== near, `${rest} -> ${near}`);
ok("B headline: the line does not overflow while stretched", rowWidth[0] <= rowWidth[1] + 1, `scroll ${rowWidth[0]} client ${rowWidth[1]}`);
await page.getByRole("button", { name: "Open source" }).click();
ok("B archive: filter narrows the index", (await page.locator(".index .year li").count()) === 4);
await page.getByRole("button", { name: /Pause/ }).click();
ok("B marquee: pause button pauses", (await page.locator(".marquee").getAttribute("data-paused")) === "true");

// C: the network
await page.goto(`${base}/directions/orbit`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const node = page.getByRole("button", { name: /^Lockout\./ });
await node.click();
ok("C map: selecting a disc fills the card", (await page.locator(".card h2").textContent()) === "Lockout");
const before = await node.boundingBox();
await page.mouse.move(before.x + before.width / 2, before.y + 30);
await page.mouse.down();
await page.mouse.move(before.x - 160, before.y - 120, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(400);
const after = await node.boundingBox();
ok("C map: a disc can be dragged", Math.abs(after.x - before.x) > 60, `moved ${Math.round(after.x - before.x)}px`);
await page.locator(".card-links-list button").first().click();
ok("C map: a link in the card jumps to the linked project", (await page.locator(".card h2").textContent()) !== "Lockout", await page.locator(".card h2").textContent());
await page.keyboard.press("Tab");
const overlaps = await page.evaluate(() => {
  const discs = [...document.querySelectorAll(".node .disc")].map((d) => d.getBoundingClientRect());
  let count = 0;
  for (let i = 0; i < discs.length; i++) for (let j = i + 1; j < discs.length; j++) {
    const a = discs[i], b = discs[j];
    const d = Math.hypot(a.x + a.width / 2 - b.x - b.width / 2, a.y + a.height / 2 - b.y - b.height / 2);
    if (d < (a.width + b.width) / 2) count++;
  }
  return count;
});
ok("C map: no two discs overlap", overlaps === 0, `overlaps ${overlaps}`);

// Reduced motion: nothing should be hidden or broken.
const calm = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
for (const id of ["terminal", "specimen", "orbit"]) {
  await calm.goto(`${base}/directions/${id}`, { waitUntil: "networkidle" });
  ok(`reduced motion: ${id} renders its headline`, await calm.locator("h1").isVisible());
}
ok("no page errors", errors.length === 0, errors.join(" | "));
await browser.close();
