// Probes the cursor glyph lens around the whole character and saves clipped screenshots.
// Usage: node scripts/glyph-probe.mjs <outDir> [baseUrl] [--metric]
// With --metric the page runs with ?glyphdebug, where any 3D pixel inside the lens core renders magenta;
// those pixels are counted (expected: 0 everywhere).
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const [outDir, base = 'http://localhost:4322'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const metric = process.argv.includes('--metric');
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto(`${base}/${metric ? '?glyphdebug' : ''}`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'));
await page.mouse.move(150, 450);
await page.waitForTimeout(2500);
const box = await page.locator('.hero-mascot').boundingBox();
const cx = box.x + box.width / 2, cy = box.y + box.height / 2, h = Math.min(box.height, box.width * 1.25) * 0.97;
const pts = {
  'face-left-edge': [cx - h * 0.3, cy - h * 0.08], 'face-centre': [cx, cy - h * 0.08], 'face-right-edge': [cx + h * 0.3, cy - h * 0.08],
  'antenna': [cx + h * 0.08, cy - h * 0.42], 'hand-left': [cx - h * 0.32, cy + h * 0.2], 'hand-right': [cx + h * 0.32, cy + h * 0.2],
  'body-bottom': [cx, cy + h * 0.36], 'ear-left': [cx - h * 0.36, cy - h * 0.06],
};
const clip = { x: Math.max(0, cx - h * 0.6), y: Math.max(0, cy - h * 0.58), width: h * 1.2, height: Math.min(h * 1.16, 900 - Math.max(0, cy - h * 0.58)) };
const count = (png) => page.evaluate(async (b64) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] > 230 && d[i + 1] < 40 && d[i + 2] > 230) n++;
  return n;
}, png.toString('base64'));
const results = {};
for (const [name, [x, y]] of Object.entries(pts)) {
  await page.mouse.move(x, y, { steps: 10 });
  for (const t of [120, 600]) {
    await page.waitForTimeout(t === 120 ? 120 : 480);
    const png = await page.screenshot({ clip });
    fs.writeFileSync(`${outDir}/${name}-${String(t).padStart(4, '0')}ms.png`, png);
    if (metric) results[`${name}@${t}`] = await count(png);
  }
}
// moving away: the lens retracts and Auri is fully 3D again
await page.mouse.move(150, 450, { steps: 6 });
await page.waitForTimeout(700);
fs.writeFileSync(`${outDir}/after-leaving.png`, await page.screenshot({ clip }));
if (metric) { console.log(JSON.stringify(results)); fs.writeFileSync(`${outDir}/uncovered-pixels.json`, JSON.stringify(results, null, 1)); }
console.log('saved', outDir);
await browser.close();
