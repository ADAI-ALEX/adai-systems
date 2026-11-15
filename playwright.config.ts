import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  fullyParallel: true,
  workers: 4,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4322',
    channel: 'chrome',
    launchOptions: { args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=metal'] },
  },
  webServer: {
    command: 'npx astro build && npx astro preview --port 4322',
    url: 'http://localhost:4322',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
