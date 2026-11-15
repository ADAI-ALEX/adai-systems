// Renders Adi's fallback poster from the site's own WebGL renderer (no external art involved).
// Needs the dev or preview server running. Usage: node scripts/render-poster.mjs [baseUrl]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const base = process.argv[2] || 'http://localhost:4321';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto(`${base}/mascot?poster`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'));
await page.addStyleTag({ content: `html,body{background:transparent!important} .site-header,.grain,.page>*:not(.page-hero),.site-footer,.hero-grid>.stack,.mascot-poster,.mascot-label{visibility:hidden!important}` });
await page.mouse.move(720, 330);
await page.evaluate(() => window.adai?.mascot({ expression: 'happy', hold: 30 }));
await page.waitForTimeout(3500);
const box = await page.locator('[data-mascot-anchor]').first().boundingBox();
const pad = 20, top = 90;
const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - top), width: box.width + pad * 2, height: box.height + top + pad };
const png = await page.screenshot({ clip, omitBackground: true });
fs.mkdirSync('public/mascot', { recursive: true });
fs.writeFileSync('public/mascot/poster.png', png);
// Encode WebP in the browser (no native tooling needed)
const webp = await page.evaluate(async (b64) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
  const scale = Math.min(1, 900 / img.width);
  const c = document.createElement('canvas'); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/webp', 0.86).split(',')[1];
}, png.toString('base64'));
fs.writeFileSync('public/mascot/poster.webp', Buffer.from(webp, 'base64'));
console.log('poster', clip, fs.statSync('public/mascot/poster.png').size, fs.statSync('public/mascot/poster.webp').size);
await browser.close();
