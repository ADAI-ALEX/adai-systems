// Composes the README banner from real project assets: the ADAI wordmark and a still of Auri.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const b64 = (f) => fs.readFileSync(f).toString('base64');
const wordmark = 'data:image/svg+xml;base64,' + b64('public/brand/adai-wordmark-white.svg');
const auri = 'data:image/png;base64,' + b64('docs/assets/auri.png');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1600, height: 560 }, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html><html><head><style>
  @font-face { font-family: Mona; src: url(data:font/woff2;base64,${b64('node_modules/@fontsource-variable/mona-sans/files/mona-sans-latin-wdth-normal.woff2')}) format('woff2'); font-weight: 200 900; font-stretch: 75% 125%; }
  body { margin: 0; width: 1600px; height: 560px; background: radial-gradient(60% 90% at 78% 50%, rgba(143,130,255,.13), transparent 70%), #06080b; color: #eceae4; font-family: Mona, sans-serif; overflow: hidden; position: relative; }
  .grid { position: absolute; inset: 0; background-image: radial-gradient(rgba(236,234,228,.10) 1px, transparent 1.2px); background-size: 14px 14px; mask-image: radial-gradient(55% 80% at 78% 50%, #000, transparent 75%); }
  .copy { position: absolute; left: 96px; top: 100px; width: 820px; }
  .copy img { height: 96px; display: block; margin-bottom: 52px; }
  h1 { margin: 0; font-size: 92px; line-height: .95; font-weight: 650; font-stretch: 120%; letter-spacing: -0.04em; }
  p { margin: 26px 0 0; font-size: 26px; color: #c9c6bd; }
  .hues { display: flex; gap: 10px; margin-top: 30px; }
  .hues span { font: 500 15px ui-monospace, monospace; padding: 6px 12px; border-radius: 99px; border: 1px solid rgba(236,234,228,.2); color: #c9c6bd; }
  .hues i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }
  .auri { position: absolute; right: 70px; top: 18px; height: 530px; filter: drop-shadow(0 40px 60px rgba(0,0,0,.5)); }
</style></head><body><div class="grid"></div>
  <div class="copy"><img src="${wordmark}" alt=""><h1>Building intelligent software.</h1><p>AI agents, automation, apps and research, with every project shown.</p>
  <div class="hues"><span><i style="background:#f2b560"></i>Agents</span><span><i style="background:#5cd6c4"></i>Automation</span><span><i style="background:#ff7d61"></i>Apps</span><span><i style="background:#8db3ff"></i>Research</span></div></div>
  <img class="auri" src="${auri}" alt=""></body></html>`);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'docs/assets/banner.png' });
console.log('banner written');
await browser.close();
