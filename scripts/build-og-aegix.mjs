// Composes the Aegix share card (public/og/aegix.png, 1200×630) in the style of the other project cards,
// from the exploratory band render in public/work/aegix. Usage: node scripts/build-og-aegix.mjs
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const b64 = (f) => fs.readFileSync(f).toString('base64');
const mark = 'data:image/svg+xml;base64,' + b64('public/brand/adai-mark-white.svg');
const band = 'data:image/webp;base64,' + b64('public/work/aegix/aegix-band-concept.webp');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html><html><head><style>
  @font-face { font-family: Mona; src: url(data:font/woff2;base64,${b64('node_modules/@fontsource-variable/mona-sans/files/mona-sans-latin-wdth-normal.woff2')}) format('woff2'); font-weight: 200 900; font-stretch: 75% 125%; }
  @font-face { font-family: Plex; src: url(data:font/woff2;base64,${b64('node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2')}) format('woff2'); }
  body { margin: 0; width: 1200px; height: 630px; background: #06080b; color: #eceae4; font-family: Mona, sans-serif; overflow: hidden; position: relative; }
  body::before { content: ''; position: absolute; inset: 0 0 auto; height: 4px; background: #ff7d61; z-index: 3; }
  .band { position: absolute; right: -170px; top: 0; height: 630px; width: auto; }
  .fade { position: absolute; inset: 0; background: linear-gradient(90deg, #06080b 0%, rgba(6,8,11,.92) 38%, rgba(6,8,11,.2) 64%, transparent 80%), linear-gradient(180deg, rgba(6,8,11,.5), transparent 25%, transparent 75%, rgba(6,8,11,.6)); }
  .brand { position: absolute; left: 72px; top: 56px; display: flex; align-items: center; gap: 16px; font-size: 28px; font-weight: 600; z-index: 2; }
  .brand img { width: 46px; height: 46px; }
  .domain { position: absolute; right: 72px; top: 68px; font: 18px Plex, monospace; color: #8b8a85; z-index: 2; }
  .meta { position: absolute; left: 72px; top: 290px; font: 20px Plex, monospace; color: #b9b7b0; display: flex; align-items: center; gap: 12px; z-index: 2; }
  .meta i { width: 10px; height: 10px; border-radius: 50%; background: #ff7d61; }
  h1 { position: absolute; left: 70px; top: 330px; margin: 0; display: flex; align-items: center; gap: 22px; font-size: 104px; line-height: 1; font-weight: 640; font-stretch: 125%; letter-spacing: 0.12em; z-index: 2; }
  h1 svg { width: 92px; height: 92px; }
  p { position: absolute; left: 72px; top: 470px; width: 640px; margin: 0; font-size: 28px; line-height: 1.35; color: #b9b7b0; z-index: 2; }
  .tag { position: absolute; right: 72px; bottom: 44px; font: 13px Plex, monospace; letter-spacing: .12em; color: #efe9df; padding: 8px 14px; border: 1px solid rgba(236,234,228,.25); border-radius: 99px; background: rgba(6,8,11,.6); z-index: 2; }
</style></head><body>
  <img class="band" src="${band}" alt=""><div class="fade"></div>
  <div class="brand"><img src="${mark}" alt="">ADAI Systems</div><div class="domain">adai.systems/work/aegix</div>
  <div class="meta"><i></i>Early stage · Health tech · Nov 2026</div>
  <h1><svg viewBox="0 0 48 48" fill="none"><rect x="13" y="4.5" width="22" height="39" rx="11" stroke="#efe9df" stroke-width="2.4"/><path d="M4.5 24C10.5 15.5 17 11.8 24 11.8S37.5 15.5 43.5 24C37.5 32.5 31 36.2 24 36.2S10.5 32.5 4.5 24Z" stroke="#efe9df" stroke-width="2.4" stroke-linejoin="round"/><circle cx="24" cy="24" r="4" fill="#ff7d61"/></svg>AEGIX</h1>
  <p>A closer watch over patient wellbeing.</p>
  <div class="tag">WEARABLE CONCEPT · EXPLORATORY DESIGN</div>
</body></html>`);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og/aegix.png' });
console.log('og card written');
await browser.close();
