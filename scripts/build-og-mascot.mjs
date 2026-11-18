// Composes the Meet Auri share card (public/og/mascot.png, 1200×630) in the style of the other cards,
// from a still of the live model (docs/assets/auri.png, made by `npm run still`).
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const b64 = (f) => fs.readFileSync(f).toString('base64');
const mark = 'data:image/svg+xml;base64,' + b64('public/brand/adai-mark-white.svg');
const auri = 'data:image/png;base64,' + b64('docs/assets/auri.png');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html><html><head><style>
  @font-face { font-family: Mona; src: url(data:font/woff2;base64,${b64('node_modules/@fontsource-variable/mona-sans/files/mona-sans-latin-wdth-normal.woff2')}) format('woff2'); font-weight: 200 900; font-stretch: 75% 125%; }
  @font-face { font-family: Plex; src: url(data:font/woff2;base64,${b64('node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2')}) format('woff2'); }
  body { margin: 0; width: 1200px; height: 630px; background: radial-gradient(50% 75% at 80% 55%, rgba(143,130,255,.16), transparent 70%), #06080b; color: #eceae4; font-family: Mona, sans-serif; overflow: hidden; position: relative; }
  .brand { position: absolute; left: 72px; top: 56px; display: flex; align-items: center; gap: 16px; font-size: 28px; font-weight: 600; }
  .brand img { width: 46px; height: 46px; }
  .domain { position: absolute; right: 72px; top: 68px; font: 18px Plex, monospace; color: #8b8a85; }
  h1 { position: absolute; left: 72px; top: 300px; margin: 0; font-size: 104px; line-height: .95; font-weight: 650; font-stretch: 118%; letter-spacing: -0.04em; }
  p { position: absolute; left: 72px; top: 430px; width: 600px; margin: 0; font-size: 26px; line-height: 1.4; color: #b9b7b0; }
  .auri { position: absolute; right: 40px; top: 70px; height: 540px; filter: drop-shadow(0 30px 50px rgba(0,0,0,.55)); }
</style></head><body>
  <div class="brand"><img src="${mark}" alt="">ADAI Systems</div><div class="domain">adai.systems</div>
  <h1>Meet Auri.</h1><p>The ADAI character: a soft companion drawn live in your browser, in real-time 3D.</p>
  <img class="auri" src="${auri}" alt=""></body></html>`);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og/mascot.png' });
console.log('og card written');
await browser.close();
