import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end runs against a built Storybook, not against the console.
 *
 * The two flows worth testing here, a modal focus trap and a combobox, are
 * library behaviour rather than console behaviour, and they are exactly the
 * pair that break in a real browser while passing under jsdom. Pointing at
 * Storybook keeps the run hermetic: no ticketing API, no docker compose, no
 * seed data, so a red run means a real regression rather than a cold stack.
 *
 * The console gets its own coverage from the unit and accessibility suites plus
 * a typecheck; running it end to end would need the whole ticketing stack up,
 * which belongs in that repo's CI where it already exists.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: 'http://127.0.0.1:6008',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    /*
     * Firefox is not decoration here. Its focus handling differs from
     * Chromium's in ways that matter to a focus trap, particularly around which
     * elements are tabbable and what happens when focus leaves the document.
     */
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],

  webServer: {
    command: 'npx http-server packages/ui/storybook-static -p 6008 --silent',
    url: 'http://127.0.0.1:6008/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
