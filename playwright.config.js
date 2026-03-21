import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',

  timeout: 30000,

  use: {
    baseURL: 'file://' + process.cwd() + '/',
    headless: true
  },

  reporter: [['list']]
});
