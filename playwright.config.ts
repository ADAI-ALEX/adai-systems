import { defineConfig } from '@playwright/test';

// Set BASE_URL (for example https://www.adai.systems) to run the same suite against a deployed site.
const remote = process.env.BASE_URL;

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  fullyParallel: true,
  workers: 4,
  reporter: [['list']],
  use: {
    baseURL: remote ?? 'http://localhost:4322',
    channel: 'chrome',
    launchOptions: { args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] },
  },
  webServer: remote ? undefined : {
    command: 'npx astro build && npx astro preview --port 4322',
    url: 'http://localhost:4322',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
