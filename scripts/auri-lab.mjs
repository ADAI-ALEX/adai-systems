// Renders Auri from the site's own WebGL renderer in deterministic "lab" mode (?poster&lab): every expression,
// every gesture at a chosen moment, every colour variant, plus angles, and assembles a character sheet.
// Needs a running server (dev or preview).
//
// Usage: node scripts/auri-lab.mjs [baseUrl=http://localhost:4321] [outDir=docs/assets/auri] [--only=hero,expressions,gestures,hues,angles] [--sheet] [--dsf=2]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const pos = args.filter((a) => !a.startsWith('--'));
const base = pos[0] || 'http://localhost:4321';
const out = pos[1] || 'docs/assets/auri';
const opt = (k, d) => (args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d);
const only = opt('only', 'hero,expressions,gestures,hues,angles').split(',');
const dsf = +opt('dsf', 2);
fs.mkdirSync(out, { recursive: true });

const EXPRESSIONS = ['neutral', 'happy', 'curious', 'surprised', 'thinking', 'focused', 'talking', 'excited', 'confused', 'proud', 'sleepy'];
// Gesture and the moment (seconds after it starts) that shows it best.
const GESTURES = [['wave', 0.62], ['point', 0.8], ['think', 1.2], ['cheer', 0.55], ['present', 0.9], ['shrug', 0.7], ['nod', 0.2]];
const HUES = [['studio', 'Studio'], ['agents', 'Agents'], ['automation', 'Automation'], ['products', 'Apps'], ['research', 'Research'], ['signature', 'Signature']];

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dsf });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`${base}/mascot?poster&lab`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.documentElement.classList.contains('gl-ready'), null, { timeout: 30000 });
await page.addStyleTag({ content: `html,body{background:transparent!important} .site-header,.grain,.page>*:not(.page-hero),.site-footer,.hero-grid>.stack,.skip,.mascot-label{visibility:hidden!important}` });
await page.waitForTimeout(1200); // the canvas fades in over 700 ms
await page.evaluate(() => { window.adai.lab.pause(); });
const box = await page.locator('[data-mascot-anchor]').first().boundingBox();
const pad = 30;
const clip = { x: box.x - pad, y: Math.max(0, box.y - 40), width: box.width + pad * 2, height: box.height + 60 };

const lab = (fn, arg) => page.evaluate(([fn, arg]) => { const l = window.adai.lab; if (fn === 'set') l.set(arg); else l.step(arg); }, [fn, arg]);
async function shot(name, setup) {
  await lab('set', { expression: 'neutral', hue: 'signature', look: { x: 0, y: 0 }, turn: 0, facing: -1 });
  await lab('step', 1.5);
  await setup();
  const file = path.join(out, `${name}.png`);
  await page.screenshot({ path: file, clip, omitBackground: true });
  return file;
}

const results = {};
if (only.includes('hero')) {
  results.hero = [await shot('hero', async () => {
    await lab('set', { expression: 'happy', look: { x: 0.15, y: 0.12 }, turn: 0.6, facing: -1 });
    await lab('step', 0.4);
    await lab('set', { gesture: 'present' });
    await lab('step', 0.9);
  })];
}
if (only.includes('expressions')) {
  results.expressions = [];
  for (const e of EXPRESSIONS) results.expressions.push(await shot(`expression-${e}`, async () => {
    await lab('set', { expression: e, look: { x: 0.12, y: 0.04 } });
    await lab('step', 0.9);
  }));
}
if (only.includes('gestures')) {
  results.gestures = [];
  for (const [g, t] of GESTURES) results.gestures.push(await shot(`gesture-${g}`, async () => {
    await lab('set', { expression: 'neutral', look: { x: 0.1, y: 0.04 }, facing: 1 });
    await lab('step', 0.3);
    await lab('set', { gesture: g });
    await lab('step', t);
  }));
}
if (only.includes('hues')) {
  results.hues = [];
  for (const [h] of HUES) results.hues.push(await shot(`colour-${h}`, async () => {
    await lab('set', { expression: 'happy', hue: h, look: { x: 0.1, y: 0.04 } });
    await lab('step', 2.4);
  }));
}
if (only.includes('angles')) {
  results.angles = [];
  for (const [n, turn] of [['front', 0], ['three-quarter', -0.6], ['side', -1.35], ['back-three-quarter', -2.4]]) results.angles.push(await shot(`angle-${n}`, async () => {
    await lab('set', { expression: 'neutral', look: { x: 0, y: 0 }, turn });
    await lab('step', 2.5);
  }));
}
console.log(JSON.stringify({ out, clip, errors: errors.slice(0, 10) }));

// Character sheet: assembled in the browser (no native image tools needed).
if (args.includes('--sheet')) {
  const read = (f) => (fs.existsSync(f) ? fs.readFileSync(f).toString('base64') : null);
  const rows = [
    ['Expressions', EXPRESSIONS.map((e) => [e, read(path.join(out, `expression-${e}.png`))])],
    ['Gestures', GESTURES.map(([g]) => [g, read(path.join(out, `gesture-${g}.png`))])],
    ['Colours', HUES.map(([h, label]) => [label, read(path.join(out, `colour-${h}.png`))])],
  ];
  const hero = read(path.join(out, 'hero.png'));
  const sheet = await page.evaluate(async ({ rows, hero }) => {
    const load = (b64) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + b64; });
    const W = 3200, cell = 250, cols = 6, heroW = 1150;
    const H = 2050;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const bg = g.createRadialGradient(W * 0.2, H * 0.4, 50, W * 0.4, H * 0.5, W * 0.8);
    bg.addColorStop(0, '#1b1a3e'); bg.addColorStop(1, '#09090f');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = '#f4f1ff'; g.font = '600 64px "Mona Sans Variable", system-ui, sans-serif'; g.fillText('Auri', 80, 120);
    g.fillStyle = '#a69cff'; g.font = '400 30px "Mona Sans Variable", system-ui, sans-serif'; g.fillText('Character sheet, rendered live from the production model', 80, 170);
    if (hero) { const i = await load(hero); const s = Math.min(heroW / i.width, 1650 / i.height); g.drawImage(i, 40, 240, i.width * s, i.height * s); }
    let y = 230;
    for (const [title, items] of rows) {
      g.fillStyle = '#8f86c9'; g.font = '500 26px "IBM Plex Mono", monospace'; g.fillText(title.toUpperCase(), heroW + 60, y + 10);
      y += 30;
      let i = 0;
      for (const [label, b64] of items) {
        const col = i % cols, row = Math.floor(i / cols);
        const x = heroW + 40 + col * (cell + 85), yy = y + row * (cell + 60);
        if (b64) { const img = await load(b64); const s = Math.min(cell / img.width, cell / img.height) * 1.1; g.drawImage(img, x + (cell - img.width * s) / 2 + 30, yy, img.width * s, img.height * s); }
        g.fillStyle = '#e8e4f6'; g.font = '400 24px "Mona Sans Variable", system-ui, sans-serif'; g.textAlign = 'center';
        g.fillText(label[0].toUpperCase() + label.slice(1), x + cell / 2 + 30, yy + cell + 38); g.textAlign = 'left';
        i++;
      }
      y += Math.ceil(items.length / cols) * (cell + 60) + 30;
    }
    return c.toDataURL('image/png').split(',')[1];
  }, { rows, hero });
  fs.writeFileSync(path.join(out, 'character-sheet.png'), Buffer.from(sheet, 'base64'));
  console.log('sheet', path.join(out, 'character-sheet.png'));

  // Separate sheets for the README: one row set each, same styling.
  for (const [file, title, items, cols] of [['expressions', 'Expressions', rows[0][1], 6], ['gestures', 'Gestures', rows[1][1], 7], ['colours', 'Colour variants', rows[2][1], 6]]) {
    const png = await page.evaluate(async ({ title, items, cols }) => {
      const load = (b64) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + b64; });
      const cell = 300, gap = 20, top = 110, labelH = 56;
      const rowsN = Math.ceil(items.length / cols);
      const W = cols * (cell + gap) + gap + 40, H = top + rowsN * (cell + labelH) + 40;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const g = c.getContext('2d');
      const bg = g.createRadialGradient(W * 0.5, H * 0.45, 40, W * 0.5, H * 0.5, W * 0.7);
      bg.addColorStop(0, '#1a1938'); bg.addColorStop(1, '#09090f');
      g.fillStyle = bg; g.fillRect(0, 0, W, H);
      g.fillStyle = '#a69cff'; g.font = '500 26px "IBM Plex Mono", monospace'; g.fillText(title.toUpperCase(), 40, 62);
      for (let i = 0; i < items.length; i++) {
        const [label, b64] = items[i];
        const x = 40 + (i % cols) * (cell + gap), y = top + Math.floor(i / cols) * (cell + labelH);
        if (b64) { const img = await load(b64); const s = Math.min(cell / img.width, cell / img.height); g.drawImage(img, x + (cell - img.width * s) / 2, y, img.width * s, img.height * s); }
        g.fillStyle = '#e8e4f6'; g.font = '400 24px "Mona Sans Variable", system-ui, sans-serif'; g.textAlign = 'center';
        g.fillText(label[0].toUpperCase() + label.slice(1), x + cell / 2, y + cell + 34); g.textAlign = 'left';
      }
      return c.toDataURL('image/png').split(',')[1];
    }, { title, items, cols });
    fs.writeFileSync(path.join(out, `${file}.png`), Buffer.from(png, 'base64'));
    console.log('sheet', file);
  }
}
await browser.close();
