// Probes the mascot glyph reveal at several cursor positions and stages, saving clipped screenshots.
// Usage: node scripts/glyph-probe.mjs <outDir> [baseUrl] [--metric]
// Positions are relative to the hero mascot box. With --metric (needs ?glyphdebug support), uncovered
// 3D pixels are rendered magenta by the composite and counted.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const [outDir, base = 'http://localhost:4322'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const metric = process.argv.includes('--metric');
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto(`${base}/${metric ? '?glyphdebug' : ''}`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'));
await page.mouse.move(200, 450);
await page.waitForTimeout(2500);
const box = await page.locator('.hero-mascot').boundingBox();
const cx = box.x + box.width / 2, cy = box.y + box.height / 2, h = Math.min(box.height, box.width * 1.25) * 0.86;
const pts = {
  'face-left': [cx - h * 0.26, cy - h * 0.12], 'face-centre': [cx, cy - h * 0.12], 'face-right': [cx + h * 0.26, cy - h * 0.12],
  'head-top': [cx, cy - h * 0.38], 'body-bottom': [cx, cy + h * 0.38], 'hand-left': [cx - h * 0.33, cy + h * 0.18], 'hand-right': [cx + h * 0.33, cy + h * 0.18],
};
const clip = { x: Math.max(0, cx - h * 0.62), y: Math.max(0, cy - h * 0.62), width: h * 1.24, height: Math.min(h * 1.24, 900 - Math.max(0, cy - h * 0.62)) };
const results = {};
for (const [name, [x, y]] of Object.entries(pts)) {
  await page.mouse.move(200, 450, { steps: 2 });
  await page.waitForTimeout(1600);
  await page.mouse.move(x, y, { steps: 6 });
  for (const t of [200, 500, 1400]) {
    await page.waitForTimeout(t - (t === 200 ? 0 : t === 500 ? 200 : 500));
    const file = `${outDir}/${name}-${String(t).padStart(4, '0')}ms.png`;
    const png = await page.screenshot({ clip });
    fs.writeFileSync(file, png);
    if (metric) {
      results[`${name}@${t}`] = await page.evaluate(async (b64) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i] > 230 && d[i + 1] < 40 && d[i + 2] > 230) n++;
        return n;
      }, png.toString('base64'));
    }
  }
}
if (metric) { console.log(JSON.stringify(results)); fs.writeFileSync(`${outDir}/uncovered-pixels.json`, JSON.stringify(results, null, 1)); }
console.log('saved', outDir);
await browser.close();
