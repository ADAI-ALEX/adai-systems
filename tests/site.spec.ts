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
    expect(canonical).toBe(`https://adai.systems${path === '/' ? '' : path}`);
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

test('no WebGL: the mascot area collapses and the page still works', async ({ page }) => {
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
  for (const path of routes) expect(index).toContain(`<loc>https://adai.systems${path}</loc>`);
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

test('large display text cannot be highlighted; body copy, article headings and links can', async ({ page }) => {
  const sel = (loc: import('@playwright/test').Locator) => loc.evaluate((el) => getComputedStyle(el).userSelect);
  await page.goto('/mascot');
  const where = page.getByRole('heading', { name: `Where ${MASCOT.name} comes from` });
  expect(await sel(where)).toBe('none');
  expect(await sel(page.locator('.arrow-big'))).toBe('none');
  expect(await sel(page.locator('.origin p'))).not.toBe('none');
  // A real drag across the heading selects nothing.
  await where.scrollIntoViewIfNeeded();
  const r = (await where.boundingBox())!;
  await page.mouse.move(r.x + 4, r.y + r.height / 2); await page.mouse.down();
  await page.mouse.move(r.x + r.width - 4, r.y + r.height / 2, { steps: 8 }); await page.mouse.up();
  expect(await page.evaluate(() => getSelection()!.toString())).toBe('');
  await page.goto('/');
  for (const s of ['.chapter-copy h2', '.section-head h2', '.stat strong']) expect(await sel(page.locator(s).first()), s).toBe('none');
  expect(await sel(page.locator('.chapter-copy p').first())).not.toBe('none');
  await page.goto('/services/automation');
  expect(await sel(page.locator('.promise'))).toBe('none');
  await page.goto('/work/lockout');
  expect(await sel(page.locator('.case-row h2').first())).not.toBe('none');
  expect(await sel(page.locator('.case-row .prose p').first())).not.toBe('none');
  await page.goto('/privacy');
  expect(await sel(page.locator('.prose h2').first())).not.toBe('none');
});

test('Meet Auri: the mark in "Where Auri comes from" is the original mark, in white', async ({ page }) => {
  await page.goto('/mascot');
  const mark = page.locator('.origin svg');
  await expect(mark).toHaveCount(1);
  const fills = await mark.locator('path').evaluateAll((ps) => ps.map((p) => getComputedStyle(p).fill));
  expect(fills).toEqual(['rgb(255, 255, 255)', 'rgb(255, 255, 255)', 'rgb(255, 255, 255)']);
  expect(await mark.locator('path').first().getAttribute('d')).toContain('M123.22,0A123.22,123.22');
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

type Lens = { radius: number; frame: number; viewportH: number; dragging: boolean; x: number; y: number };
const lens = (page: import('@playwright/test').Page) => page.evaluate(() => (window as unknown as { __adaiLens: Lens }).__adaiLens);
/** Lens radius (in viewport heights): clamp(frame × 0.18, 0.045, 0.12375), midway between clamp(frame × 0.24, 0.06, 0.165) and clamp(frame × 0.12, 0.03, 0.0825). */
const expectedRadius = (frame: number) => Math.min(Math.max(frame * 0.18, 0.045), 0.12375);

test('cursor glyph lens is midway between its two previous sizes and follows the cursor', async ({ page }) => {
  await page.goto('/?glyphdebug', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 15_000 });
  await page.waitForTimeout(1200);
  const box = (await page.locator('.hero-mascot').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.4, { steps: 6 });
  await page.waitForTimeout(1200);
  const l = await lens(page);
  expect(l.radius).toBeGreaterThan(0);
  expect(l.radius).toBeCloseTo(expectedRadius(l.frame), 3);
  const larger = Math.min(Math.max(l.frame * 0.24, 0.06), 0.165), smaller = Math.min(Math.max(l.frame * 0.12, 0.03), 0.0825);
  expect(l.radius).toBeCloseTo((larger + smaller) / 2, 4); // the midpoint of the two previous lenses
  expect(Math.hypot(l.x - (box.x + box.width / 2), l.y - (box.y + box.height * 0.4))).toBeLessThan(3);
  await page.mouse.move(40, 860, { steps: 4 });
  await page.waitForTimeout(900);
  expect((await lens(page)).radius).toBe(0);
});

test.describe('phone: touching Auri', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('a drag that starts on Auri moves the lens and never scrolls; lift and cancel release it; scrolling elsewhere still works', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel', x = 0, y = 0) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' || type === 'touchCancel' ? [] : [{ x, y }] });
    await page.goto('/?glyphdebug', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 15_000 });
    await page.waitForTimeout(1500);
    const box = (await page.locator('.hero-mascot').boundingBox())!;
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;

    // 1. Drag across Auri: lens on, following the finger, page does not move.
    await touch('touchStart', cx, cy);
    const path = [[cx + 40, cy - 30], [cx + 70, cy - 70], [cx - 30, cy - 90], [cx - 70, cy + 10], [cx, cy + 40]];
    const scrolls: number[] = [];
    for (const [x, y] of path) {
      for (let i = 1; i <= 4; i++) { await touch('touchMove', x, y + i); await page.waitForTimeout(40); }
      scrolls.push(await page.evaluate(() => scrollY));
    }
    await page.waitForTimeout(400);
    const during = await lens(page);
    expect(scrolls.every((s) => s === 0)).toBe(true);
    expect(during.dragging).toBe(true);
    expect(during.radius).toBeCloseTo(expectedRadius(during.frame), 3);
    expect(Math.hypot(during.x - cx, during.y - (cy + 44))).toBeLessThan(4);
    await touch('touchEnd');
    await page.waitForTimeout(150);
    expect((await lens(page)).dragging).toBe(false);
    await page.waitForTimeout(2200);
    expect((await lens(page)).radius).toBe(0);

    // 2. A cancelled gesture cannot leave the interaction stuck.
    await touch('touchStart', cx, cy);
    await touch('touchMove', cx + 20, cy - 20);
    await page.waitForTimeout(100);
    expect((await lens(page)).dragging).toBe(true);
    await touch('touchCancel');
    await page.waitForTimeout(150);
    expect((await lens(page)).dragging).toBe(false);
    expect(await page.evaluate(() => scrollY)).toBe(0);

    // 3. A swipe that starts on the text scrolls the page as normal.
    const h1 = (await page.locator('h1').boundingBox())!;
    const sx = h1.x + 30, sy = h1.y + h1.height / 2;
    await touch('touchStart', sx, sy);
    for (let i = 1; i <= 12; i++) { await touch('touchMove', sx, sy - i * 25); await page.waitForTimeout(16); }
    await touch('touchEnd');
    await page.waitForTimeout(700);
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(100);
    expect((await lens(page)).dragging).toBe(false);
  });
});

/* ---------------------------------------------------------------- rendering quality and progressive rendering */
type Render = { outDpr: number; sceneDpr: number; cellPx: number; cellCss: number; atlasCell: number; canvas: [number, number]; scene: [number, number]; rendered: number; skipped: number; offscreen: boolean; anchor: string | null; geometries: number; textures: number; programs: number };
const render = (page: import('@playwright/test').Page) => page.evaluate(() => (window as unknown as { __adaiRender: Render }).__adaiRender);
const glReady = (page: import('@playwright/test').Page) => page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 15_000 });
const frames = (page: import('@playwright/test').Page, n: number) => page.evaluate((n) => new Promise<void>((r) => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);

test.describe('glyph resolution on a 2× screen', () => {
  test.use({ deviceScaleFactor: 2, viewport: { width: 1440, height: 900 } });

  test('glyphs are drawn at the screen pixel density, identically on the homepage and another page', async ({ page }) => {
    const seen: Render[] = [];
    for (const path of ['/', '/studio']) {
      await page.goto(`${path}?glyphdebug`, { waitUntil: 'networkidle' });
      await glReady(page);
      await page.waitForTimeout(800);
      const r = await render(page);
      expect(r.outDpr).toBe(2);
      expect(r.canvas).toEqual([2880, 1800]);
      expect(r.cellPx).toBe(19); // 9.5 CSS px on whole device pixels
      expect(r.atlasCell).toBe(r.cellPx); // pixel-exact glyph atlas
      expect(r.sceneDpr).toBe(1.5); // the 3D keeps its previous resolution
      seen.push(r);
    }
    expect(seen[0].outDpr).toBe(seen[1].outDpr);
    expect(seen[0].cellPx).toBe(seen[1].cellPx);
  });

  test('under sustained load only the 3D resolution reacts; glyphs keep full resolution; 3D recovers afterwards', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/?glyphdebug', { waitUntil: 'networkidle' });
    await glReady(page);
    await page.waitForTimeout(3000);
    // 30 ms of main-thread work per frame, like a busy machine
    await page.evaluate(() => { (window as unknown as { __jank: boolean }).__jank = true; const f = () => { if (!(window as unknown as { __jank: boolean }).__jank) return; const t = performance.now(); while (performance.now() - t < 30); requestAnimationFrame(f); }; requestAnimationFrame(f); });
    let minScene = 1.5;
    for (let i = 0; i < 24; i++) {
      await page.waitForTimeout(500);
      const r = await render(page);
      minScene = Math.min(minScene, r.sceneDpr);
      expect(r.outDpr).toBe(2);
      expect(r.cellPx).toBe(19);
      expect(r.sceneDpr).toBeGreaterThanOrEqual(1); // never below the floor
    }
    expect(minScene).toBeLessThan(1.5); // the watchdog did react
    await page.evaluate(() => ((window as unknown as { __jank: boolean }).__jank = false));
    await expect.poll(async () => (await render(page)).sceneDpr, { timeout: 15_000, intervals: [500] }).toBe(1.5);
    expect((await render(page)).outDpr).toBe(2);
  });
});

test('Auri is initialised once and reused: one WebGL canvas, one context on every page', async ({ page }) => {
  await page.goto('/?glyphdebug', { waitUntil: 'networkidle' });
  await glReady(page);
  expect(await page.locator('canvas').count()).toBe(1);
});

test('offscreen: no GPU work while no mascot area is in view; rendering resumes on return', async ({ page }) => {
  await page.goto('/?glyphdebug', { waitUntil: 'networkidle' });
  await glReady(page);
  await page.waitForTimeout(500);
  expect((await render(page)).offscreen).toBe(false);
  // The archive grid has no mascot area: Auri fades out and frames stop rendering.
  await page.evaluate(() => document.querySelector('.more-title')!.scrollIntoView({ block: 'center' }));
  await expect.poll(async () => (await render(page)).offscreen, { timeout: 5000 }).toBe(true);
  const a = await render(page);
  await page.waitForTimeout(1000);
  const b = await render(page);
  expect(b.rendered).toBe(a.rendered); // nothing drawn
  expect(b.skipped).toBeGreaterThan(a.skipped + 20); // while the loop keeps watching the layout
  expect(await page.locator('.gl-stage').evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
  // Back to the top: rendering resumes on the next frames, at the hero.
  await page.evaluate(() => window.scrollTo(0, 0));
  await frames(page, 3);
  const c = await render(page);
  expect(c.offscreen).toBe(false);
  expect(c.anchor).toBe('hero');
  expect(c.rendered).toBeGreaterThan(b.rendered);
});

test('fast scroll: jumping straight to a lower section draws Auri there within a few frames', async ({ page }) => {
  await page.goto('/?glyphdebug', { waitUntil: 'networkidle' });
  await glReady(page);
  await page.waitForTimeout(500);
  // From the hero straight to the fourth chapter, in one jump (no intermediate sections rendered).
  await page.evaluate(() => document.querySelector('#ch-research')!.scrollIntoView({ block: 'start' }));
  await frames(page, 3);
  const r = await render(page);
  expect(r.anchor).toBe('research');
  expect(r.offscreen).toBe(false);
  await expect.poll(() => page.locator('.gl-stage').evaluate((el) => +getComputedStyle(el).opacity), { timeout: 2000 }).toBeGreaterThan(0.9);
  // And from far below the last mascot area straight back to one.
  await page.evaluate(() => document.querySelector('.more-title')!.scrollIntoView({ block: 'center' }));
  await expect.poll(async () => (await render(page)).offscreen, { timeout: 5000 }).toBe(true);
  await page.evaluate(() => document.querySelector('.hire-mascot')!.scrollIntoView({ block: 'center' }));
  await frames(page, 3);
  expect((await render(page)).anchor).toBe('cta');
});

test('no leaks: GPU resources and window listeners stay constant across a full scroll and resizes', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/?glyphdebug', { waitUntil: 'networkidle' });
  await glReady(page);
  await page.waitForTimeout(800);
  const cdp = await page.context().newCDPSession(page);
  const listeners = async () => {
    const { result } = await cdp.send('Runtime.evaluate', { expression: 'window' });
    const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId! });
    return listeners.length;
  };
  const before = { ...(await render(page)), listeners: await listeners() };
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 700) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(120); }
  await page.evaluate(() => window.scrollTo(0, 0));
  // resizes, crossing the phone breakpoint (the glyph atlas is redrawn at a new cell size) and back
  for (const vp of [{ width: 600, height: 800 }, { width: 1000, height: 700 }, { width: 1280, height: 720 }]) { await page.setViewportSize(vp); await page.waitForTimeout(400); }
  await page.waitForTimeout(800);
  const after = { ...(await render(page)), listeners: await listeners() };
  expect(after.geometries).toBe(before.geometries);
  expect(after.textures).toBe(before.textures);
  expect(after.programs).toBe(before.programs);
  expect(after.listeners).toBe(before.listeners);
});

test('WebGL chunk is preloaded early on mascot pages only, and not with ?nowebgl', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('link[rel="modulepreload"][href*="/_astro/boot."]').count()).toBe(1);
  await glReady(page);
  await page.goto('/privacy');
  expect(await page.locator('link[rel="modulepreload"]').count()).toBe(0);
  await page.goto('/?nowebgl');
  expect(await page.locator('link[rel="modulepreload"]').count()).toBe(0);
});

test('reduced motion: Auri still renders (on demand) and the offscreen pause still applies', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?glyphdebug', { waitUntil: 'networkidle' });
  await glReady(page);
  await page.waitForTimeout(500);
  const a = await render(page);
  expect(a.rendered).toBeGreaterThan(0);
  await page.waitForTimeout(800);
  expect((await render(page)).rendered).toBe(a.rendered); // nothing changes, nothing is drawn
  await page.evaluate(() => document.querySelector('.more-title')!.scrollIntoView({ block: 'center' }));
  await expect.poll(async () => (await render(page)).offscreen, { timeout: 3000 }).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(async () => (await render(page)).anchor, { timeout: 3000 }).toBe('hero');
});
