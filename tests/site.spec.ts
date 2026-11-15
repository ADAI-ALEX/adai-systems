import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { routes, staticRoutes } from './routes';
import { MASCOT } from '../src/lib/mascot';

for (const path of routes) {
  test(`page ${path}: renders, one h1, SEO tags, no console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));
    const res = await page.goto(path, { waitUntil: 'networkidle' });
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    expect((await page.title()).length).toBeGreaterThan(5);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc && desc.length > 50).toBeTruthy();
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe(`https://www.adai.systems${path === '/' ? '' : path}`);
    expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(1);
    expect(errors).toEqual([]);
  });
}

for (const path of staticRoutes) {
  test(`a11y ${path}: no serious or critical axe violations`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path, { waitUntil: 'networkidle' });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(bad.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });
}

test('no horizontal scroll at 375px on any page', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  const wide: string[] = [];
  for (const path of routes) {
    await page.goto(path);
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    if (w > 375) wide.push(`${path}: ${w}`);
  }
  expect(wide).toEqual([]);
});

test('home: WebGL world boots and the mascot is drawn', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 15_000 });
  await expect(page.locator('[data-gl-stage] canvas')).toHaveCount(1);
});

test('no WebGL: poster fallback is shown and the page still works', async ({ page }) => {
  await page.goto('/?nowebgl', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveClass(/gl-fallback/);
  await expect(page.locator('[data-gl-stage] canvas')).toHaveCount(0);
  await expect(page.locator('.hero-mascot .mascot-poster img')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start a project' }).first()).toBeVisible();
});

test('reduced motion: no smooth scrolling, motion flag set', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveClass(/motion-off/);
  await expect(page.locator('html')).not.toHaveClass(/lenis-smooth/);
});

test('no theme or motion toggle in the header', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-motion-toggle]')).toHaveCount(0);
  await expect(page.locator('header button')).toHaveCount(1); // only the mobile menu button remains
});

test('header shows the real ADAI wordmark asset', async ({ page }) => {
  await page.goto('/');
  const logo = page.locator('header .brand img');
  await expect(logo).toHaveAttribute('src', '/brand/adai-wordmark-white.svg');
  await expect(logo).toHaveAttribute('alt', 'ADAI Systems, home');
  const box = await logo.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(30);
  expect(box!.width / box!.height).toBeCloseTo(700 / 246.43, 1);
});

test('brief builder writes the email and nothing is sent', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => { if (!r.url().startsWith('http://localhost:4322')) requests.push(r.url()); });
  await page.goto('/start?type=automation', { waitUntil: 'networkidle' });
  await expect(page.locator('input[name="need"][value="automation"]')).toBeChecked();
  await expect(page.locator('[data-state]')).toHaveText('Keep going');
  await page.fill('#what', 'Watch our recordings folder and write a report for each call.');
  await page.fill('#name', 'Test Person');
  await expect(page.locator('[data-state]')).toHaveText('Ready to send');
  const href = await page.locator('[data-mailto]').getAttribute('href');
  expect(href).toContain('mailto:alex@adai.systems?subject=');
  expect(decodeURIComponent(href!)).toContain('Automation and internal tools');
  expect(decodeURIComponent(href!)).toContain('Test Person');
  expect(requests).toEqual([]);
});

test('work archive filters', async ({ page }) => {
  await page.goto('/work');
  const visible = () => page.locator('[data-archive] [data-match]:not([hidden])').count();
  const all = await visible();
  await page.getByRole('button', { name: /Open source/ }).click();
  const open = await visible();
  expect(open).toBeGreaterThan(0);
  expect(open).toBeLessThan(all);
});

test('unknown route serves the 404 page', async ({ page }) => {
  const res = await page.goto('/this-does-not-exist');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText(`${MASCOT.name} looked everywhere.`);
});

test('sitemap lists every case study and service', async ({ request }) => {
  const index = await (await request.get('/sitemap-0.xml')).text();
  for (const path of routes) expect(index).toContain(`<loc>https://www.adai.systems${path}</loc>`);
});
