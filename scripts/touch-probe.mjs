// Drags a finger across Auri on a phone-sized viewport (real Chrome touch input) and reports whether the page
// scrolled during the drag, plus a mid-drag screenshot. Expected: scrollY stays 0 while the finger is on Auri.
// Usage: node scripts/touch-probe.mjs <out.png> [baseUrl]
import { chromium } from '@playwright/test';
const [out, base = 'http://localhost:4322'] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
const touch = (type, x = 0, y = 0) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
await page.goto(`${base}/`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 15000 });
await page.waitForTimeout(1500);
const b = await page.locator('.hero-mascot').boundingBox();
const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
await touch('touchStart', cx, cy);
for (let i = 1; i <= 12; i++) { await touch('touchMove', cx + i * 3, cy - i * 12); await page.waitForTimeout(30); }
await page.waitForTimeout(250);
const during = await page.evaluate(() => scrollY);
if (out) await page.screenshot({ path: out });
await touch('touchEnd');
await page.waitForTimeout(500);
console.log(`${base} | scrollY while dragging on Auri: ${during} | after lift: ${await page.evaluate(() => scrollY)}`);
await browser.close();
