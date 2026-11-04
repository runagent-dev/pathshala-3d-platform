// বেলুন গরম পানিতে (book p175, the "নিজে করো" at the end of topic 6.3.3) through the bridge: the big button keeps both
// balloons in the hot water, the balloon of air grows by T₂/T₁ (kelvin) and the balloon of water by about a percent or
// three, the panel says the book's two sentences, the test sets up its own scenes, reset brings everything back.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('balloons-hot-water: air swells a lot, water hardly', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'balloons-hot-water');
  const text = async (sel) => (await fig.frame.locator(sel).first().textContent()).replace(/ /g, ' ');

  // before: both balloons 1 L, water at 30 °C
  const start = await fig.call('get');
  expect(start).toMatchObject({ hot: 90, T: 30, heated: false, running: false, stage: 0 });
  expect(start.air).toEqual({ mL: 1000, percent: 0 });
  expect(start.water).toEqual({ mL: 1000, percent: 0 });
  expect(start.next).toEqual({ label: 'act_hot', step: 1 });
  expect(await text('.pvc-rule')).toContain('দুটি বেলুন নাও');

  // the big button: both in 90 °C water for a while: air +20 %, water +3 %
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(5500);
  const s1 = await fig.call('get');
  expect(s1).toMatchObject({ hot: 90, T: 90, heated: true, running: false, stage: 1, results: { 90: 20 } });
  expect(s1.air).toEqual({ mL: 1200, percent: 20 });
  expect(s1.water).toEqual({ mL: 1030, percent: 3 });
  expect(s1.next).toEqual({ label: 'act_cool', step: 2 });
  expect(await text('[data-r="Pa"]')).toBe('+২০%');
  expect(await text('[data-r="Pw"]')).toBe('+৩%');
  expect(await text('.pvc-rule')).toContain('তাপে তরলের তেমন প্রসারণ হয় না');
  expect(await text('.pvc-rule')).toContain('তাপে গ্যাসের প্রসারণ তরলের চেয়ে অনেক বেশি');
  expect(await text('[data-example="90"] .pvc-ex-res')).toBe('+২০%');

  // 70 °C: air +13 % (T₂/T₁ = 343/303), water +2 %
  await fig.frame.locator('[data-example="70"]').click();
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ hot: 70, T: 30, heated: false });
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(5500);
  const s2 = await fig.call('get');
  expect(s2.air).toEqual({ mL: 1130, percent: 13 });
  expect(s2.water).toEqual({ mL: 1020, percent: 2 });
  expect(s2.results).toEqual({ 90: 20, 70: 13 });

  // cooling takes them back
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(2500);
  expect(await fig.call('get')).toMatchObject({ T: 30, heated: false });

  // set(): the other temperatures, and straight to the result
  const s3 = await fig.call('set', { hot: 50, heated: true, animate: false });
  expect(s3).toMatchObject({ hot: 50, T: 50, heated: true });
  expect(s3.air.percent).toBe(7);

  // the test: three questions, each sets up its own scene
  await fig.frame.locator('[data-mode="quiz"]').click();
  await fig.advance(500);
  for (let i = 0; i < 3; i++) {
    await expect(fig.frame.locator('.pvc-q-text')).not.toHaveText(/^\s*$/);
    await fig.frame.locator('.pvc-opt').first().click();
    await fig.advance(300);
    if (i < 2) await fig.frame.locator('[data-act="q-next"]').click();
    await fig.advance(500);
  }
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  expect(await fig.call('get')).toMatchObject({ hot: 50, T: 50, mode: 'explore', locked: false });

  // reset: cold, 90 °C chosen, the rule back to its start
  await fig.call('reset');
  await fig.advance(2000);
  expect(await fig.call('get')).toMatchObject({ hot: 90, T: 30, heated: false, stage: 0, results: {} });
  expect(log.errors).toEqual([]);
});
