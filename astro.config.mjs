// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

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
  ],
  vite: {
    build: { assetsInlineLimit: 2048, chunkSizeWarningLimit: 700 },
  },
  devToolbar: { enabled: false },
});
