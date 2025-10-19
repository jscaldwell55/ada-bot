import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  reporter: [['list']],
});
