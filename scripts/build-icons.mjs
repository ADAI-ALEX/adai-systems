// Renders the favicon set from public/favicon.svg (the original ADAI icon, inverted: white character, black face).
// Outputs: favicon.ico (16+32), favicon-32.png, apple-touch-icon.png (180, white square), icon-192/512.png.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const svg = fs.readFileSync('public/favicon.svg', 'utf8');
const browser = await chromium.launch({ channel: 'chrome' });
async function render(size, { square = false, pad = 0 } = {}) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  const inner = size - pad * 2;
  const src = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  await page.setContent(`<html><body style="margin:0;overflow:hidden;background:${square ? '#fff' : 'transparent'}"><img src="${src}" width="${inner}" height="${inner}" style="display:block;margin:${pad}px"></body></html>`);
  await page.locator('img').evaluate((i) => i.decode());
  const out = await page.screenshot({ omitBackground: !square, clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
  return out;
}
const png16 = await render(16), png32 = await render(32);
fs.writeFileSync('public/favicon-32.png', png32);
fs.writeFileSync('public/apple-touch-icon.png', await render(180, { square: true, pad: 14 }));
fs.writeFileSync('public/icon-192.png', await render(192));
fs.writeFileSync('public/icon-512.png', await render(512));
fs.writeFileSync('public/icon-maskable-512.png', await render(512, { square: true, pad: 64 }));
// ICO container with PNG payloads (supported by every current browser)
const imgs = [[16, png16], [32, png32]];
const header = Buffer.alloc(6 + 16 * imgs.length);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(imgs.length, 4);
let offset = header.length;
imgs.forEach(([s, data], i) => {
  const o = 6 + i * 16;
  header.writeUInt8(s, o); header.writeUInt8(s, o + 1); header.writeUInt8(0, o + 2); header.writeUInt8(0, o + 3);
  header.writeUInt16LE(1, o + 4); header.writeUInt16LE(32, o + 6); header.writeUInt32LE(data.length, o + 8); header.writeUInt32LE(offset, o + 12);
  offset += data.length;
});
fs.writeFileSync('public/favicon.ico', Buffer.concat([header, ...imgs.map(([, d]) => d)]));
console.log('icons written');
await browser.close();
