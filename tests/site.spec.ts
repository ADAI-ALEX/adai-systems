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

test('no flat 2D mascot image anywhere; the 3D character appears once ready', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(await page.locator('img[src*="/mascot/"], picture.mascot-poster, .mascot-anchor img').count()).toBe(0);
  await expect(page.locator('h1')).toBeVisible();
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
  await expect(page.locator('.hero-mascot')).toBeHidden(); // the mascot space closes up: no flat stand-in
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
  await page.goto('/start?type=automation', { waitUntil: 'networkidle' });
  // From here on, filling in the brief must not send anything anywhere.
  const requests: string[] = [];
  page.on('request', (r) => { if (!r.url().startsWith('data:')) requests.push(r.url()); });
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

for (const [w, h] of [[1440, 900], [834, 1194], [390, 844]]) {
  test(`work cards have identical dimensions at ${w}px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/work', { waitUntil: 'networkidle' });
    const sizes = await page.evaluate(() => [...document.querySelectorAll('[data-archive] [data-match]:not([hidden]) .card')].map((c) => {
      const r = c.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`;
    }));
    expect(sizes.length).toBeGreaterThan(10);
    expect(new Set(sizes).size).toBe(1);
  });
}

test('visual assets cannot be dragged; display headings are not selectable but body copy is', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const imgs = await page.evaluate(() => [...document.images].filter((i) => i.draggable).map((i) => i.src));
  expect(imgs).toEqual([]);
  expect(await page.locator('h1').evaluate((el) => getComputedStyle(el).userSelect)).toBe('none');
  expect(await page.locator('.hero .lead').evaluate((el) => getComputedStyle(el).userSelect)).not.toBe('none');
  const prevented = await page.evaluate(() => {
    const img = document.querySelector('.card img')!;
    const ev = new DragEvent('dragstart', { bubbles: true, cancelable: true });
    img.dispatchEvent(ev);
    return ev.defaultPrevented;
  });
  expect(prevented).toBe(true);
  await page.goto('/start');
  expect(await page.locator('#what').evaluate((el) => getComputedStyle(el).userSelect)).not.toBe('none');
});

test('favicon is the original ADAI icon, inverted (white character, black face), no orange', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute('href', '/favicon.svg');
  await expect(page.locator('link[rel="icon"][href="/favicon.ico"]')).toHaveCount(1);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');
  const svg = await (await request.get('/favicon.svg')).text();
  const original = 'M123.22,0A123.22,123.22,0,1,0,246.46,123.22,123.21,123.21,0,0,0,123.22,0Zm82.92,159.84';
  expect(svg).toContain(`<path fill="#ffffff" d="${original}`); // the original character shape, now white
  expect(svg).toContain('<path fill="#000000" d="M206.14,159.84a52.3,52.3'); // its bubble interior, solid black
  expect(svg.toLowerCase()).not.toMatch(/#f2|amber|orange|prefers-color-scheme|stroke=/);
  for (const f of ['/favicon.ico', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/site.webmanifest']) expect((await request.get(f)).status()).toBe(200);
});

test('mascot name comes from one place', async ({ page }) => {
  await page.goto('/mascot');
  await expect(page.locator('h1')).toHaveText(`Meet ${MASCOT.name}.`);
  await expect(page.locator('footer')).toContainText(`Meet ${MASCOT.name}`);
});

test('cursor glyph lens: no 3D pixels inside the lens core anywhere around the character', async ({ page }) => {
  await page.goto('/?glyphdebug', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 15_000 });
  await page.mouse.move(150, 450);
  await page.waitForTimeout(1500);
  const box = (await page.locator('.hero-mascot').boundingBox())!;
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2, h = Math.min(box.height, box.width * 1.25) * 0.86;
  const clip = { x: Math.max(0, cx - h * 0.62), y: Math.max(0, cy - h * 0.62), width: h * 1.24, height: Math.min(h * 1.24, 900 - Math.max(0, cy - h * 0.62)) };
  const points = { 'face-left': [cx - h * 0.26, cy - h * 0.12], centre: [cx, cy - h * 0.1], 'face-right': [cx + h * 0.26, cy - h * 0.12], 'hand-left': [cx - h * 0.33, cy + h * 0.18], top: [cx, cy - h * 0.36] };
  const uncovered: Record<string, number> = {};
  for (const [name, [x, y]] of Object.entries(points)) {
    await page.mouse.move(150, 450, { steps: 2 });
    await page.waitForTimeout(900);
    await page.mouse.move(x, y, { steps: 6 });
    await page.waitForTimeout(1300);
    const png = await page.screenshot({ clip });
    uncovered[name] = await page.evaluate(async (b64) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d')!; g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] > 230 && d[i + 1] < 40 && d[i + 2] > 230) n++;
      return n;
    }, png.toString('base64'));
  }
  expect(uncovered).toEqual({ 'face-left': 0, centre: 0, 'face-right': 0, 'hand-left': 0, top: 0 });
});
