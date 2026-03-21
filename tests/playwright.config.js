import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'file://' + process.cwd() + '/',
    headless: true,
  },
  reporter: [['list']],
});
