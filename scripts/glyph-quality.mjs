// Glyph quality comparison: before/after builds, homepage vs a comparison page, at several viewports.
// Usage: node scripts/glyph-quality.mjs <outDir> <beforeUrl> <afterUrl>
//
// For each build, page and viewport it moves the cursor onto Auri's face, waits for the lens, and
//  • saves the lens area at the device's pixel ratio;
//  • measures two sharpness proxies in a small square inside the lens core (all glyph cells there):
//      gradient energy (mean squared Sobel response on luminance, higher = crisper edges) and the
//      mid-tone share (pixels between 20 % and 80 % of the local range among inked pixels; lower = fewer
//      blurred edge pixels). They are proxies, not perceptual scores, so the images are saved too;
//  • repeats the measurement after 7 s of injected main-thread load (30 ms per frame), which makes the
//    frame-time watchdog react, to show what each build does to the glyphs under load;
//  • records the lens radius and the canvas/scene resolutions (from the ?glyphdebug hook, when present).
// It finishes with side-by-side sheets (nearest-neighbour zoom) in <outDir>.
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const [outDir, beforeUrl, afterUrl] = process.argv.slice(2);
if (!afterUrl) { console.error('usage: glyph-quality.mjs <outDir> <beforeUrl> <afterUrl>'); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] });
const viewports = {
  desktop: { width: 1440, height: 900, dsf: 2 },
  'desktop-1x': { width: 1440, height: 900, dsf: 1 },
  tablet: { width: 834, height: 1112, dsf: 2, touch: true },
  mobile: { width: 390, height: 844, dsf: 3, touch: true },
};
const pages = { home: '/', studio: '/studio' };
const builds = { before: beforeUrl, after: afterUrl };

/** Sharpness proxies computed in the page on a PNG screenshot. */
async function measure(page, png) {
  return page.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height;
    const L = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) L[i] = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255;
    let min = 1, max = 0; for (const v of L) { min = Math.min(min, v); max = Math.max(max, v); }
    let energy = 0, n = 0, inked = 0, mid = 0;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const p = (dx, dy) => L[(y + dy) * W + x + dx];
      const gx = p(1, -1) + 2 * p(1, 0) + p(1, 1) - p(-1, -1) - 2 * p(-1, 0) - p(-1, 1);
      const gy = p(-1, 1) + 2 * p(0, 1) + p(1, 1) - p(-1, -1) - 2 * p(0, -1) - p(1, -1);
      energy += gx * gx + gy * gy; n++;
      const t = (L[y * W + x] - min) / Math.max(1e-3, max - min);
      if (t > 0.2) { inked++; if (t < 0.8) mid++; }
    }
    return { energy: +(energy / n).toFixed(4), midtone: +(mid / Math.max(1, inked)).toFixed(3) };
  }, png.toString('base64'));
}

async function capture(build, pageName, vpName) {
  const vp = viewports[vpName];
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dsf, hasTouch: !!vp.touch });
  const page = await ctx.newPage();
  await page.goto(builds[build] + pages[pageName] + '?glyphdebug', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 30000 });
  await page.mouse.move(5, vp.height - 5);
  await page.waitForTimeout(2500);
  const box = await page.locator('[data-mascot-anchor]').first().boundingBox();
  const h = Math.min(box.height, box.width * 1.25, vp.height * 0.86) * 0.97;
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const target = { x: cx - h * 0.06, y: cy - h * 0.12 };
  const lensArea = { x: Math.max(0, target.x - h * 0.22), y: Math.max(0, target.y - h * 0.2), width: h * 0.44, height: h * 0.4 };
  const core = { x: target.x - 10, y: target.y - 10, width: 20, height: 20 }; // inside the lens core at every viewport
  const state = () => page.evaluate(() => ({ lens: window.__adaiLens ?? null, render: window.__adaiRender ?? null, canvas: (() => { const c = document.querySelector('.gl-stage canvas'); return [c.width, c.height, +(c.width / c.clientWidth).toFixed(3)]; })() }));
  const shoot = async (tag) => {
    // a touch device has no hover: a tap on Auri pulses the lens open at the tap point
    if (vp.touch) await page.touchscreen.tap(target.x, target.y); else await page.mouse.move(target.x, target.y, { steps: 10 });
    await page.waitForTimeout(vp.touch ? 500 : 1000);
    const lensPng = await page.screenshot({ clip: lensArea });
    const corePng = await page.screenshot({ clip: core });
    fs.writeFileSync(`${outDir}/${build}-${pageName}-${vpName}${tag}.png`, lensPng);
    const s = await state();
    const m = await measure(page, corePng);
    if (!vp.touch) { await page.mouse.move(5, vp.height - 5, { steps: 4 }); await page.waitForTimeout(600); }
    return { ...m, ...s };
  };
  const res = { normal: await shoot('') };
  if (vpName === 'desktop') {
    // 7 s of heavy main-thread load (30 ms per frame), then measure again while it continues
    await page.evaluate(() => { window.__jank = true; const f = () => { if (!window.__jank) return; const t = performance.now(); while (performance.now() - t < 30); requestAnimationFrame(f); }; requestAnimationFrame(f); });
    await page.waitForTimeout(7000);
    res.underLoad = await shoot('-under-load');
    await page.evaluate(() => (window.__jank = false));
  }
  await ctx.close();
  return res;
}

const results = {};
for (const build of Object.keys(builds)) for (const pageName of Object.keys(pages)) for (const vpName of Object.keys(viewports)) {
  const r = await capture(build, pageName, vpName);
  (results[`${pageName}/${vpName}`] ??= {})[build] = r;
  const f = (x) => x ? `energy ${x.energy} midtone ${x.midtone} canvas ${x.canvas[2]}× scene ${x.render?.sceneDpr ?? x.canvas[2]}× cell ${x.render?.cellPx ?? '-'}px lens r ${x.lens?.radius?.toFixed(4) ?? '-'}` : '';
  console.log(build.padEnd(6), pageName.padEnd(6), vpName.padEnd(10), f(r.normal), r.underLoad ? ` | under load: ${f(r.underLoad)}` : '');
}
fs.writeFileSync(`${outDir}/glyph-quality.json`, JSON.stringify(results, null, 1));

// Side-by-side sheets: before | after for each case, nearest-neighbour zoom so glyph pixels are visible.
const sheet = await (await browser.newContext({ deviceScaleFactor: 1 })).newPage();
async function compose(name, rows, zoom = 1) {
  const imgs = rows.map(([label, files]) => [label, files.map((f) => 'data:image/png;base64,' + fs.readFileSync(`${outDir}/${f}`).toString('base64'))]);
  const png = await sheet.evaluate(async ({ imgs, zoom }) => {
    const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = s; });
    const rows = await Promise.all(imgs.map(async ([label, srcs]) => [label, await Promise.all(srcs.map(load))]));
    const cw = Math.max(...rows.flatMap(([, a]) => a.map((i) => i.width))) * zoom, ch = Math.max(...rows.flatMap(([, a]) => a.map((i) => i.height))) * zoom;
    const c = document.createElement('canvas'); c.width = cw * 2 + 30; c.height = rows.length * (ch + 40) + 10;
    const g = c.getContext('2d'); g.fillStyle = '#06080b'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingEnabled = false;
    g.font = '600 18px system-ui'; g.fillStyle = '#f3e6cf';
    rows.forEach(([label, a], r) => {
      const y = r * (ch + 40) + 30;
      a.forEach((img, k) => { g.fillText(`${label} · ${k ? 'after' : 'before'}`, 10 + k * (cw + 10), y - 8); g.drawImage(img, 10 + k * (cw + 10), y, img.width * zoom, img.height * zoom); });
    });
    return c.toDataURL('image/png').split(',')[1];
  }, { imgs, zoom });
  fs.writeFileSync(`${outDir}/${name}`, Buffer.from(png, 'base64'));
}
await compose('sheet-desktop.png', [['Homepage, 1440×900 @2×', ['before-home-desktop.png', 'after-home-desktop.png']], ['Studio, 1440×900 @2×', ['before-studio-desktop.png', 'after-studio-desktop.png']]]);
await compose('sheet-under-load.png', [['Homepage under load, @2×', ['before-home-desktop-under-load.png', 'after-home-desktop-under-load.png']]]);
await compose('sheet-viewports.png', [['Tablet 834×1112 @2×', ['before-home-tablet.png', 'after-home-tablet.png']], ['Phone 390×844 @3×', ['before-home-mobile.png', 'after-home-mobile.png']], ['Desktop @1×', ['before-home-desktop-1x.png', 'after-home-desktop-1x.png']]]);
// zoomed crops of the lens centre (where the brand-mark glyphs are) at 4×
await sheet.setViewportSize({ width: 800, height: 600 });
for (const f of ['before-home-desktop.png', 'after-home-desktop.png', 'before-home-desktop-under-load.png', 'after-home-desktop-under-load.png']) {
  const b64 = await sheet.evaluate(async (src) => {
    const img = new Image(); img.src = src; await img.decode();
    const s = Math.round(img.width * 0.3), c = document.createElement('canvas'); c.width = s; c.height = s;
    c.getContext('2d').drawImage(img, img.width / 2 - s / 2, img.height / 2 - s / 2, s, s, 0, 0, s, s);
    return c.toDataURL('image/png').split(',')[1];
  }, 'data:image/png;base64,' + fs.readFileSync(`${outDir}/${f}`).toString('base64'));
  fs.writeFileSync(`${outDir}/zoom-${f}`, Buffer.from(b64, 'base64'));
}
await compose('sheet-zoom.png', [['Lens centre, homepage, 4×', ['zoom-before-home-desktop.png', 'zoom-after-home-desktop.png']], ['Lens centre under load, 4×', ['zoom-before-home-desktop-under-load.png', 'zoom-after-home-desktop-under-load.png']]], 4);
await browser.close();
console.log('saved', outDir);
