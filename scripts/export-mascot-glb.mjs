// Exports the live procedural Adi as a GLB blockout for Blender (named nodes per docs/MASCOT.md).
// Needs the dev or preview server. Usage: node scripts/export-mascot-glb.mjs [baseUrl]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const base = process.argv[2] || 'http://localhost:4321';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] });
const page = await browser.newPage();
await page.goto(`${base}/mascot?poster`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'));
await page.evaluate(() => window.adai.mascot({ expression: 'neutral', hold: 60 }));
await page.waitForTimeout(1500);
const b64 = await page.evaluate(() => window.adai.exportGlb());
fs.mkdirSync('assets-src/mascot', { recursive: true });
fs.writeFileSync('assets-src/mascot/adi-blockout.glb', Buffer.from(b64, 'base64'));
console.log('wrote assets-src/mascot/adi-blockout.glb', fs.statSync('assets-src/mascot/adi-blockout.glb').size, 'bytes');
await browser.close();
