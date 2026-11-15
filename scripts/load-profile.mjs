// Measures the homepage start-up phases on a cold visit and a cached visit (needs `npm run preview`).
// Usage: node scripts/load-profile.mjs [baseUrl] [runs=3]
import { chromium } from '@playwright/test';
const base = process.argv[2] || 'http://localhost:4322';
const runs = +(process.argv.filter((a) => !a.startsWith('--'))[3] || 3);
const throttle = process.argv.includes('--throttle');
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] });
const marks = ['adai:gl-start', 'adai:gl-imported', 'adai:gl-environment', 'adai:gl-mascot', 'adai:gl-atlas', 'adai:gl-compiled', 'adai:gl-first-frame'];
async function visit(page) {
  await page.goto(base + '/', { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 20000 });
  await page.waitForTimeout(300);
  return page.evaluate((names) => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paint = Object.fromEntries(performance.getEntriesByType('paint').map((p) => [p.name, Math.round(p.startTime)]));
    const m = Object.fromEntries(names.map((n) => [n.replace('adai:gl-', ''), Math.round(performance.getEntriesByName(n)[0]?.startTime ?? -1)]));
    return { ttfb: Math.round(nav.responseStart), dcl: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd), fcp: paint['first-contentful-paint'], ...m };
  }, marks);
}
const summary = { cold: [], cached: [] };
for (let i = 0; i < runs; i++) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  if (throttle) {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    // "Fast 4G"-like: 9 Mbps down, 1.5 Mbps up, 150 ms RTT; CPU 4x slower (a mid-range laptop / good phone)
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (1.5 * 1024 * 1024) / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }
  summary.cold.push(await visit(page));
  summary.cached.push(await visit(page));
  await ctx.close();
}
const med = (arr, k) => { const v = arr.map((x) => x[k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
for (const kind of ['cold', 'cached']) {
  const keys = Object.keys(summary[kind][0]);
  console.log(kind.padEnd(7), keys.map((k) => `${k}=${med(summary[kind], k)}`).join('  '));
}
await browser.close();
