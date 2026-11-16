// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * Starts downloading the WebGL chunk (three.js + Auri) as soon as the HTML has been parsed, instead of
 * after the page scripts have run. The hint is placed at the end of <body>, after the page's own scripts
 * have been requested, and is low priority, so fonts, styles and page scripts still come first;
 * and it is skipped with Save-Data or ?nowebgl, the same cases in which gl-loader.ts never boots WebGL.
 * The chunk list is the one Vite generated for the loader's dynamic import, so it can't go stale.
 */
function preloadWebGL() {
  return {
    name: 'adai-preload-webgl',
    hooks: {
      /** @param {{ dir: URL }} options */
      'astro:build:done': ({ dir }) => {
        const out = fileURLToPath(dir);
        const assets = path.join(out, '_astro');
        const loader = fs.readdirSync(assets).filter((f) => f.endsWith('.js'))
          .map((f) => fs.readFileSync(path.join(assets, f), 'utf8'))
          .find((src) => src.includes('adai:gl-start') && src.includes('__vite__mapDeps'));
        const deps = loader?.match(/m\.f=\[([^\]]*)\]/)?.[1].match(/"([^"]+)"/g)?.map((s) => '/' + s.slice(1, -1));
        if (!deps?.length || !deps.some((d) => /\/boot\.[\w-]+\.js$/.test(d))) throw new Error('[adai-preload-webgl] could not find the WebGL chunk list');
        const tag = `<script>(()=>{if(navigator.connection?.saveData||/[?&]nowebgl/.test(location.search))return;for(const h of ${JSON.stringify(deps)}){const l=document.createElement('link');l.rel='modulepreload';l.href=h;l.fetchPriority='low';document.head.append(l)}})()</script>`;
        /** @type {(d: string) => string[]} */
        const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
        for (const file of walk(out).filter((f) => f.endsWith('.html'))) {
          const html = fs.readFileSync(file, 'utf8');
          if (html.includes('data-gl-stage') && !html.includes('adai-preload')) fs.writeFileSync(file, html.replace('</body>', `${tag.replace('<script>', '<script data-adai-preload>')}</body>`));
        }
      },
    },
  };
}

// URLs match the live site (no trailing slash, e.g. /work/lockout) so search rankings carry over.
export default defineConfig({
  site: 'https://adai.systems',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'auto' },
  compressHTML: true,
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize(item) {
        item.url = item.url.replace(/\/$/, '') || item.url;
        return item;
      },
    }),
    preloadWebGL(),
  ],
  vite: {
    build: { assetsInlineLimit: 2048, chunkSizeWarningLimit: 700 },
  },
  devToolbar: { enabled: false },
});
