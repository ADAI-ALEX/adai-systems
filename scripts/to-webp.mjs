// Dev helper: converts PNGs to WebP in the browser (no native tools). Usage: node scripts/to-webp.mjs <maxWidth> <quality 0-1> a.png b.png ...
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const [maxW, q, ...files] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage();
for (const f of files) {
  const webp = await p.evaluate(async ({ b64, maxW, q }) => {
    const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode();
    const s = Math.min(1, maxW / i.width); const c = document.createElement('canvas'); c.width = Math.round(i.width * s); c.height = Math.round(i.height * s);
    const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(i, 0, 0, c.width, c.height);
    return c.toDataURL('image/webp', q).split(',')[1];
  }, { b64: fs.readFileSync(f).toString('base64'), maxW: +maxW, q: +q });
  const out = f.replace(/\.png$/, '.webp'); fs.writeFileSync(out, Buffer.from(webp, 'base64')); console.log(out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
}
await b.close();
