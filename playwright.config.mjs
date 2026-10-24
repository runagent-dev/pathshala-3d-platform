// Figure tests in headless Chromium (software WebGL). `npm run test:figures`; one figure: FIGURES=screw-gauge.
// The studio server is started on its own port for the run (4820, or PATHSHALA_TEST_PORT).
import { defineConfig } from '@playwright/test';
import { CHROMIUM_ARGS } from './scripts/lib/export/driver.mjs';

const PORT = Number(process.env.PATHSHALA_TEST_PORT || 4820);
// FIGURES=a,b limits the figures' own tests (assets/<id>/tests/) as it limits the generated ones.
const ONLY = (process.env.FIGURES || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const FIGURE_TESTS = ONLY.length ? ONLY.map((id) => `assets/${id}/tests/**/*.spec.mjs`) : ['assets/*/tests/**/*.spec.mjs'];

export default defineConfig({
  // The contract and layout tests for every figure, plus each figure's own tests in assets/<id>/tests/.
  testDir: '.',
  // test/browser (the model converter) is skipped when FIGURES picks figures (verify, CI per figure).
  testMatch: ['test/figures/**/*.spec.mjs', ...(ONLY.length ? [] : ['test/browser/**/*.spec.mjs']), ...FIGURE_TESTS],
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: Number(process.env.PATHSHALA_TEST_WORKERS || 2), // software rendering is CPU-heavy
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  outputDir: 'test-results/playwright',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    browserName: 'chromium',
    launchOptions: { args: CHROMIUM_ARGS },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/dev.mjs',
    env: { PORT: String(PORT), HOST: '127.0.0.1' },
    url: `http://127.0.0.1:${PORT}/api/me`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
