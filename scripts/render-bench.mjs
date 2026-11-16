// Rendering and start-up benchmark for the homepage and a comparison page.
// Usage: node scripts/render-bench.mjs <baseUrl> <out.json> [--runs=5] [--throttle] [--dsf=2] [--pages=/,/studio] [--reading | --gpu] [--vw=1440 --vh=900]
//
// What is measured (all in a real GPU-backed Chrome, see playwright.config.ts for the flags):
//  • load, per trial, cold (new browser context) and warm (a second visit in the same context):
//      FCP, LCP, Auri's first rendered frame (performance mark adai:gl-first-frame), total blocking time
//      (sum of long-task time over 50 ms) and the longest task, from navigation until 1 s after the first frame;
//  • rendering, per page: requestAnimationFrame interval distribution while idle, while the cursor lens is on
//    Auri, and while scrolling; WebGL draw calls per frame; the number of distinct rAF loops running; the
//    canvas backing resolution over time (to see adaptive-resolution steps);
//  • serialised frame cost: each rAF callback that issues WebGL calls is followed by gl.finish(), so the
//    timed span includes the GPU work. It is a comparative cost measure, NOT a frame rate: finish() stalls
//    the pipeline that browsers normally overlap. GPU timer queries are reported if the browser exposes them.
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const args = process.argv.slice(2);
const base = args[0] || 'http://localhost:4322';
const out = args[1] || 'bench.json';
const opt = (k, d) => (args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d);
const runs = +opt('runs', 5);
const dsf = +opt('dsf', 2);
const throttle = args.includes('--throttle');
const pages = opt('pages', '/,/studio').split(',');
const launch = { channel: 'chrome', headless: !args.includes('--headed'), args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] };

/** Injected before any page script: observers and rAF / WebGL instrumentation. */
const instrument = () => {
  const w = window;
  w.__bench = { lcp: 0, longtasks: [], frames: [], loops: [], draws: 0, drawsPerFrame: [], costs: [], finish: false };
  new PerformanceObserver((l) => { for (const e of l.getEntries()) w.__bench.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) w.__bench.longtasks.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true });
  // Count draw calls on every WebGL2 context.
  const P = WebGL2RenderingContext.prototype;
  for (const fn of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced', 'drawRangeElements']) {
    const orig = P[fn];
    P[fn] = function (...a) { w.__bench.draws++; w.__bench.gl = this; return orig.apply(this, a); };
  }
  // Wrap rAF: per frame, record which distinct callbacks ran, the draw calls, and (optionally) serialised cost.
  const raf = w.requestAnimationFrame.bind(w);
  let frameCbs = new Set(), lastT = 0, frameDraws = 0;
  const ids = new WeakMap(); let nextId = 1;
  w.requestAnimationFrame = (cb) => raf((t) => {
    if (t !== lastT) {
      if (lastT) { w.__bench.frames.push(t - lastT); w.__bench.loops.push(frameCbs.size); w.__bench.drawsPerFrame.push(frameDraws); }
      lastT = t; frameCbs = new Set(); frameDraws = 0;
    }
    if (!ids.has(cb)) ids.set(cb, nextId++);
    frameCbs.add(ids.get(cb));
    const d0 = w.__bench.draws, t0 = performance.now();
    cb(t);
    const dd = w.__bench.draws - d0;
    frameDraws += dd;
    if (dd > 0 && w.__bench.finish && w.__bench.gl) { w.__bench.gl.finish(); w.__bench.costs.push(performance.now() - t0); }
  });
};

const stats = (a) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  const mean = s.reduce((x, y) => x + y, 0) / s.length;
  const sd = Math.sqrt(s.reduce((x, y) => x + (y - mean) ** 2, 0) / s.length);
  return { n: s.length, mean: +mean.toFixed(2), median: +q(0.5).toFixed(2), p95: +q(0.95).toFixed(2), max: +s[s.length - 1].toFixed(2), sd: +sd.toFixed(2) };
};
const median = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); return s.length ? +s[s.length >> 1].toFixed(0) : null; };

async function newPage(browser, viewport = { width: +opt('vw', 1440), height: +opt('vh', 900) }) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dsf });
  await ctx.addInitScript(instrument);
  const page = await ctx.newPage();
  if (throttle) {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (1.5 * 1024 * 1024) / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }
  return { ctx, page };
}

async function loadMetrics(page, path) {
  // cold = first visit in a fresh context; warm = a second visit in the same context (HTTP cache primed)
  await page.goto(base + path, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 30000 });
  await page.waitForTimeout(1000);
  return page.evaluate(() => {
    const b = window.__bench;
    const first = performance.getEntriesByName('adai:gl-first-frame')[0]?.startTime ?? null;
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null;
    const end = (first ?? 0) + 1000;
    const tasks = b.longtasks.filter(([s]) => s < end);
    const nav = performance.getEntriesByType('navigation')[0];
    return {
      fcp, lcp: b.lcp, load: nav.loadEventEnd, glStart: performance.getEntriesByName('adai:gl-start')[0]?.startTime ?? null, firstFrame: first,
      tbt: tasks.reduce((a, [, d]) => a + Math.max(0, d - 50), 0), longest: tasks.reduce((a, [, d]) => Math.max(a, d), 0),
    };
  });
}

const sample = async (page, ms) => {
  await page.evaluate(() => { const b = window.__bench; b.frames = []; b.loops = []; b.drawsPerFrame = []; });
  await page.waitForTimeout(ms);
  return page.evaluate(() => { const b = window.__bench; return { frames: b.frames, loops: b.loops, draws: b.drawsPerFrame }; });
};

async function renderMetrics(browser, path) {
  const { ctx, page } = await newPage(browser);
  await page.goto(base + path + '?glyphdebug', { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 30000 });
  await page.mouse.move(60, 860);
  await page.waitForTimeout(2500);
  const box = await page.locator('[data-mascot-anchor]').first().boundingBox();
  const res = {};
  const canvas = () => page.evaluate(() => {
    const c = document.querySelector('.gl-stage canvas');
    return { canvas: [c.width, c.height], css: [c.clientWidth, c.clientHeight], dpr: +(c.width / c.clientWidth).toFixed(3), render: window.__adaiRender ?? null };
  });
  res.resolution = await canvas();
  const idle = await sample(page, 4000);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.38, { steps: 12 });
  await page.waitForTimeout(400);
  const lens = await sample(page, 4000);
  // serialised cost with the lens on (the most expensive steady state): 60 frames
  await page.evaluate(() => { window.__bench.costs = []; window.__bench.finish = true; });
  await page.waitForTimeout(1000);
  const costs = await page.evaluate(() => { window.__bench.finish = false; return window.__bench.costs.slice(); });
  await page.waitForTimeout(500);
  const scrollP = sample(page, 6000);
  for (let i = 0; i < 30; i++) { await page.mouse.wheel(0, i < 15 ? 300 : -300); await page.waitForTimeout(180); }
  const scroll = await scrollP;
  // A slow pass over the whole page: how many frames still render WebGL, and with what serialised cost.
  await page.evaluate(() => { window.__bench.costs = []; window.__bench.finish = true; });
  const fullP = sample(page, 9000);
  for (let i = 0; i < 45; i++) { await page.mouse.wheel(0, 400); await page.waitForTimeout(190); }
  const fullScroll = await fullP;
  const fullCosts = await page.evaluate(() => { window.__bench.finish = false; return window.__bench.costs.slice(); });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);
  const dprTimeline = [];
  for (let i = 0; i < 8; i++) { await page.waitForTimeout(500); dprTimeline.push((await canvas()).dpr); }
  const timer = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl2')?.getExtension('EXT_disjoint_timer_query_webgl2'));
  const gpu = await page.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'); const i = gl.getExtension('WEBGL_debug_renderer_info'); return gl.getParameter(i.UNMASKED_RENDERER_WEBGL); });
  for (const [k, v] of Object.entries({ idle, lens, scroll, fullScroll })) {
    res[k] = { frameMs: stats(v.frames), over20ms: +(v.frames.filter((f) => f > 20).length / Math.max(1, v.frames.length)).toFixed(3), loopsPerFrame: stats(v.loops), drawCallsPerFrame: stats(v.draws.filter((d) => d > 0)), framesWithGl: +(v.draws.filter((d) => d > 0).length / Math.max(1, v.draws.length)).toFixed(3) };
  }
  res.serialisedCostMs = stats(costs);
  res.fullScroll.serialisedCostMs = stats(fullCosts);
  res.fullScroll.glMsPerSecond = +(fullCosts.reduce((a, b) => a + b, 0) / 9).toFixed(1);
  res.resolutionAfter = await canvas();
  res.dprTimelineAfterScroll = dprTimeline;
  res.gpuTimerQuery = timer;
  res.gpu = gpu;
  await ctx.close();
  return res;
}

/** Reading pass: scroll ~700 px, pause 1.5 s, down the whole page; share of frames that drew with WebGL. */
async function readingMetrics(browser, path) {
  const { ctx, page } = await newPage(browser);
  await page.goto(base + path, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const b = window.__bench; b.frames = []; b.loops = []; b.drawsPerFrame = []; b.costs = []; b.finish = true; });
  const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await page.mouse.move(720, 450);
  for (let y = 0; y < height; y += 700) { await page.mouse.wheel(0, 700); await page.waitForTimeout(1500); }
  const r = await page.evaluate(() => { const b = window.__bench; b.finish = false; return { draws: b.drawsPerFrame, costs: b.costs, seconds: b.frames.reduce((a, f) => a + f, 0) / 1000 }; });
  await ctx.close();
  return { frames: r.draws.length, framesWithGl: +(r.draws.filter((d) => d > 0).length / r.draws.length).toFixed(3), glMsPerSecond: +(r.costs.reduce((a, b) => a + b, 0) / r.seconds).toFixed(1), seconds: +r.seconds.toFixed(1) };
}

/**
 * GPU time per frame from EXT_disjoint_timer_query_webgl2 (TIME_ELAPSED around every rAF callback that
 * issues WebGL calls; results read back asynchronously, disjoint periods discarded). Measured while idle
 * and with the cursor lens on Auri.
 */
async function gpuMetrics(browser, path) {
  const { ctx, page } = await newPage(browser);
  await page.addInitScript(() => {
    const raf = window.requestAnimationFrame;
    const pending = []; window.__gpu = [];
    window.requestAnimationFrame = (cb) => raf((t) => {
      const gl = window.__bench?.gl, ext = gl && (window.__gpuExt ??= gl.getExtension('EXT_disjoint_timer_query_webgl2'));
      if (!ext || !window.__gpuOn) return cb(t);
      for (let i = pending.length - 1; i >= 0; i--) {
        const q = pending[i];
        if (gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) {
          if (!gl.getParameter(ext.GPU_DISJOINT_EXT)) window.__gpu.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6);
          gl.deleteQuery(q); pending.splice(i, 1);
        }
      }
      const d0 = window.__bench.draws, q = gl.createQuery();
      gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
      cb(t);
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      if (window.__bench.draws > d0) pending.push(q); else gl.deleteQuery(q);
    });
  });
  await page.goto(base + path, { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 30000 });
  await page.mouse.move(5, +opt('vh', 900) - 5);
  await page.waitForTimeout(2500);
  const run = async () => { await page.evaluate(() => { window.__gpu = []; window.__gpuOn = true; }); await page.waitForTimeout(3000); return page.evaluate(() => { window.__gpuOn = false; return window.__gpu.slice(); }); };
  const idle = await run();
  const box = await page.locator('[data-mascot-anchor]').first().boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.38, { steps: 12 });
  await page.waitForTimeout(600);
  const lens = await run();
  const resolution = await page.evaluate(() => { const c = document.querySelector('.gl-stage canvas'); return [c.width, c.height]; });
  await ctx.close();
  return { resolution, idleGpuMs: stats(idle), lensGpuMs: stats(lens) };
}

const browser = await chromium.launch(launch);
if (args.includes('--gpu')) {
  const res = { base, date: new Date().toISOString(), dsf, viewport: `${opt('vw', 1440)}x${opt('vh', 900)}`, method: 'EXT_disjoint_timer_query_webgl2 TIME_ELAPSED per WebGL frame', pages: {} };
  for (const path of pages) { res.pages[path] = await gpuMetrics(browser, path); const r = res.pages[path]; console.log(path, r.resolution.join('x'), 'idle GPU ms', JSON.stringify(r.idleGpuMs), '| lens GPU ms', JSON.stringify(r.lensGpuMs)); }
  fs.writeFileSync(out, JSON.stringify(res, null, 1));
  await browser.close();
  process.exit(0);
}
if (args.includes('--reading')) {
  const res = { base, date: new Date().toISOString(), dsf, viewport: `${opt('vw', 1440)}x${opt('vh', 900)}`, scenario: 'scroll 700 px, pause 1.5 s, to the bottom; serialised GL cost per second of wall time', pages: {} };
  for (const path of pages) { res.pages[path] = await readingMetrics(browser, path); console.log(path, JSON.stringify(res.pages[path])); }
  fs.writeFileSync(out, JSON.stringify(res, null, 1));
  await browser.close();
  process.exit(0);
}
const result = { base, date: new Date().toISOString(), runs, dsf, throttle, viewport: '1440x900', load: {}, render: {} };
for (const path of pages) {
  const cold = [], warm = [];
  for (let i = 0; i < runs; i++) {
    const { ctx, page } = await newPage(browser);
    cold.push(await loadMetrics(page, path));
    await page.goto('about:blank');
    warm.push(await loadMetrics(page, path));
    await ctx.close();
  }
  const summarise = (arr) => Object.fromEntries(Object.keys(arr[0]).map((k) => [k, median(arr.map((x) => x[k]))]));
  result.load[path] = { cold: summarise(cold), warm: summarise(warm), trials: { cold, warm } };
  console.log(path, 'cold', JSON.stringify(result.load[path].cold), 'warm', JSON.stringify(result.load[path].warm));
}
if (!throttle) for (const path of pages) {
  result.render[path] = await renderMetrics(browser, path);
  const r = result.render[path];
  console.log(path, 'dpr', r.resolution.dpr, '→', r.resolutionAfter.dpr, '| idle', r.idle.frameMs.median, 'ms | lens', r.lens.frameMs.median, 'ms | scroll p95', r.scroll.frameMs.p95, 'ms | cost', r.serialisedCostMs?.median, 'ms | draws', r.lens.drawCallsPerFrame?.median, '| loops', r.idle.loopsPerFrame?.median, '| full-page scroll: frames with GL', r.fullScroll.framesWithGl, 'GL ms/s', r.fullScroll.glMsPerSecond);
}
await browser.close();
fs.mkdirSync(out.replace(/\/[^/]*$/, '') || '.', { recursive: true });
fs.writeFileSync(out, JSON.stringify(result, null, 1));
console.log('saved', out);
