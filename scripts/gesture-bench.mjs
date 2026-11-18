// Frame cost while Auri plays gestures back to back on Meet Auri: rAF intervals and per-frame GPU time
// (EXT_disjoint_timer_query_webgl2, around each frame's WebGL work). Usage: node scripts/gesture-bench.mjs <baseUrl> [seconds=8] [--dsf=2]
import { chromium } from '@playwright/test';
const base = process.argv[2] || 'http://localhost:4322';
const secs = +(process.argv[3] || 8);
const dsf = +(process.argv.find((a) => a.startsWith('--dsf='))?.split('=')[1] ?? 2);
const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dsf });
await page.addInitScript(() => {
  const w = window; w.__gpu = []; w.__iv = []; w.__on = false;
  const raf = w.requestAnimationFrame.bind(w); let last = 0;
  w.requestAnimationFrame = (cb) => raf((t) => {
    if (w.__on && last) w.__iv.push(t - last); last = t;
    const gl = w.__gl, ext = gl && gl.getExtension('EXT_disjoint_timer_query_webgl2');
    let q = null; if (w.__on && ext) { q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); }
    cb(t);
    if (q) { gl.endQuery(ext.TIME_ELAPSED_EXT); const poll = () => { if (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) return setTimeout(poll, 5); if (!gl.getParameter(ext.GPU_DISJOINT_EXT)) w.__gpu.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6); gl.deleteQuery(q); }; setTimeout(poll, 5); }
  });
  const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, o) { const c = gc.call(this, t, o); if (t === 'webgl2' && c) w.__gl = c; /* the last one is the renderer's: the loader's probe comes first */ return c; };
});
await page.goto(`${base}/mascot`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'));
await page.waitForTimeout(2500);
const gestures = ['wave', 'point', 'think', 'cheer', 'present', 'shrug', 'nod'];
const stats = (a) => { const s = [...a].sort((x, y) => x - y); return { n: s.length, median: +s[Math.floor(s.length / 2)]?.toFixed(2), p95: +s[Math.floor(s.length * 0.95)]?.toFixed(2), max: +s[s.length - 1]?.toFixed(2) }; };
await page.evaluate(() => { window.__on = true; });
const t0 = Date.now(); let i = 0;
while (Date.now() - t0 < secs * 1000) { await page.locator(`[data-gesture="${gestures[i++ % gestures.length]}"]`).click(); await page.waitForTimeout(700); }
const r = await page.evaluate(() => { window.__on = false; return { iv: window.__iv, gpu: window.__gpu }; });
console.log(JSON.stringify({ base, dsf, seconds: secs, gestures: i, frameIntervalMs: stats(r.iv), gpuMs: stats(r.gpu) }));
await browser.close();
