// Dev helper: screenshot a page with system Chrome (GPU) and print console errors.
// Usage: node scripts/shot.mjs <url> <out.png> [w=1440] [h=900] [waitMs=3500] [--mouse x,y] [--scroll y] [--reduced] [--full]
import { chromium } from '@playwright/test';
const [url, out, w = '1440', h = '900', wait = '3500', ...rest] = process.argv.slice(2);
const flag = (n) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] ?? true : null; };
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, reducedMotion: rest.includes('--reduced') ? 'reduce' : 'no-preference' });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
await page.goto(url, { waitUntil: 'networkidle' });
if (flag('--scroll')) { await page.evaluate((y) => window.scrollTo(0, +y), flag('--scroll')); }
if (flag('--mouse')) { const [mx, my] = flag('--mouse').split(',').map(Number); await page.mouse.move(mx, my, { steps: 8 }); }
await page.waitForTimeout(+wait);
await page.screenshot({ path: out, fullPage: rest.includes('--full') });
console.log(JSON.stringify({ out, errors: errors.slice(0, 12), glReady: await page.evaluate(() => document.documentElement.classList.contains('gl-ready')) }));
await browser.close();
