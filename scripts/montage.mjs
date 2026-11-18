// Dev helper: node scripts/montage.mjs out.png cols cellPx a.png b.png ... (labelled grid on a dark background)
import { chromium } from '@playwright/test';
import fs from 'node:fs'; import path from 'node:path';
const [out, cols, cell, ...files] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage();
const data = files.map((f) => [path.basename(f, '.png'), fs.readFileSync(f).toString('base64')]);
const png = await p.evaluate(async ({ data, cols, cell }) => {
  const rows = Math.ceil(data.length / cols); const c = document.createElement('canvas'); c.width = cols * cell; c.height = rows * (cell + 30);
  const g = c.getContext('2d'); g.fillStyle = '#12111f'; g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < data.length; i++) { const img = new Image(); img.src = 'data:image/png;base64,' + data[i][1]; await img.decode();
    const s = Math.min(cell / img.width, cell / img.height); const x = (i % cols) * cell, y = Math.floor(i / cols) * (cell + 30);
    g.drawImage(img, x + (cell - img.width * s) / 2, y, img.width * s, img.height * s); g.fillStyle = '#ddd'; g.font = '16px sans-serif'; g.fillText(data[i][0], x + 8, y + cell + 20); }
  return c.toDataURL('image/png').split(',')[1]; }, { data, cols: +cols, cell: +cell });
fs.writeFileSync(out, Buffer.from(png, 'base64')); await b.close();
