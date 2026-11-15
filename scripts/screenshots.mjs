// Captures the documentation screenshot set from a running server (default: preview on :4322).
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const base = process.argv[2] || 'http://localhost:4322';
const out = 'docs/screenshots';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] });
async function shoot(name, path, { w = 1440, h = 900, at, mouse, wait = 2800, before } = {}) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto(base + path, { waitUntil: 'networkidle' });
  if (at) { await page.locator(at).first().scrollIntoViewIfNeeded(); await page.evaluate((sel) => { const el = document.querySelector(sel); window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 70); }, at); }
  if (before) await before(page);
  if (mouse) await page.mouse.move(mouse[0], mouse[1], { steps: 10 });
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${out}/${name}.png` });
  await page.close();
  console.log(name);
}
await shoot('home-desktop', '/', { mouse: [560, 640] });
await shoot('home-glyph-lens', '/', { mouse: [1010, 330] });
await shoot('home-services', '/', { at: '#services' });
await shoot('chapter-agents', '/', { at: '#ch-agents', wait: 6500 });
await shoot('chapter-automation', '/', { at: '#ch-automation', wait: 5000 });
await shoot('chapter-apps', '/', { at: '#ch-products' });
await shoot('chapter-research', '/', { at: '#ch-research', before: async (p) => { await p.waitForTimeout(1200); await p.locator('[data-prompt="6"]').click(); }, wait: 4500 });
await shoot('selected-work', '/', { at: '#work-title' });
await shoot('work-archive', '/work');
await shoot('work-grid', '/work', { at: '[data-archive]', before: async (p) => p.evaluate(() => document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-in'))) });
await shoot('mobile-work-grid', '/work', { w: 390, h: 844, at: '[data-archive]', before: async (p) => p.evaluate(() => document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-in'))) });
await shoot('case-study-margin', '/work/margin');
await shoot('case-study-lockout', '/work/lockout', { at: '.lead-media' });
await shoot('service-automation', '/services/automation');
await shoot('start-brief', '/start?type=agents', { before: async (p) => { await p.fill('#what', 'Answer our booking calls after hours and put the bookings in our calendar.'); await p.fill('#name', 'Sam Example'); }, wait: 3500 });
await shoot('meet-auri', '/mascot', { before: async (p) => { await p.waitForTimeout(1500); await p.locator('[data-expression="curious"]').click(); await p.locator('[data-set-hue="research"]').click(); }, mouse: [400, 300], wait: 2500 });
await shoot('not-found', '/nope');
await shoot('mobile-home', '/', { w: 390, h: 844 });
await shoot('mobile-chapter', '/', { w: 390, h: 844, at: '#ch-agents', wait: 5000 });
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${out}/header.png`, clip: { x: 0, y: 0, width: 1440, height: 80 } });
  await page.close();
  console.log('header');
}
await browser.close();
