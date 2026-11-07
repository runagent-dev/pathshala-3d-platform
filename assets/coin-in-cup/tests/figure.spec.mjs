// This figure's own behaviour, through the bridge (dev only, never packaged): the first screen is calm; the empty cup
// hides the coin; the pour makes it visible (the light reaches the eye) with n₁ sin θ₁ = n₂ sin θ₂ at the surface; the
// coin looks raised; the level can be changed and the panel follows it; the test scores four right answers. Steps are
// jumped with animate: false so each test stays short under software rendering.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/coin-in-cup/'));

test('coin-in-cup: hidden when empty, seen and raised with water', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'coin-in-cup');
  const frame = frameOf(page);
  expect(await fig.call('get')).toMatchObject({ step: 'intro', water: 0, seen: false, cut: false, next: 'look' });
  expect(await frame.locator('[data-example]').count()).toBe(4);
  expect(await frame.locator('.cc-lead.pvc-note').count()).toBe(1);

  // one tap: the cup is cut open, the sight line and the stopped light
  await frame.locator('.pvc-act').click();
  await fig.advance(5400);
  expect(await fig.call('get')).toMatchObject({ step: 'hidden', busy: false, cut: true, seen: false, water: 0, next: 'pour' });
  expect(await frame.locator('.pvc-rule b').first().textContent()).toBe('আটকে যায়');

  // the pour: the coin is seen; the angles obey the law and bend away from the normal
  const pour = await fig.call('set', { step: 'pour', animate: false });
  expect(pour).toMatchObject({ step: 'pour', seen: true, water: 5.4 });
  expect(pour.theta2).toBeGreaterThan(pour.theta1);
  const s1 = 1.33 * Math.sin((pour.theta1 * Math.PI) / 180);
  const s2 = Math.sin((pour.theta2 * Math.PI) / 180);
  expect(Math.abs(s1 - s2)).toBeLessThan(0.02);
  expect(await frame.locator('.pvc-rule b').first().textContent()).toBe('প্রতিসরণের');

  // the coin looks raised: shallower than it is
  const img = await fig.call('set', { step: 'image', animate: false });
  expect(img.apparent).toBeGreaterThan(0);
  expect(img.apparent).toBeLessThan(img.depth);

  // less water: hidden again, and the panel says so
  const low = await fig.call('set', { water: 2 });
  expect(low).toMatchObject({ step: 'image', water: 2, seen: false, apparent: null });
  expect(await frame.locator('.pvc-outcome').textContent()).toContain('পানি বাড়াও');
  // the keys move the level
  await frame.locator('.pvc').press('ArrowUp');
  expect((await fig.call('get')).water).toBe(2.2);

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'intro', water: 0, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('coin-in-cup: the test scores four right answers', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'coin-in-cup');
  const frame = frameOf(page);
  await fig.call('practice');
  for (let i = 0; i < 4; i++) {
    await fig.advance(900);
    // the right choice: the quiz marks it after a pick, so read the expected index from the bridge's state instead
    const right = await frame.evaluate(() => {
      const opts = [...document.querySelectorAll('[data-q]')];
      const words = ['আলো সোজা চলে, কিনারা আটকায়', 'লম্ব থেকে দূরে সরে যায়', '৫০°', 'আসল জায়গার চেয়ে উপরে'];
      return opts.findIndex((b) => words.includes(b.textContent.trim()));
    });
    expect(right).toBeGreaterThanOrEqual(0);
    await frame.locator('[data-q]').nth(right).click();
    await fig.advance(300);
    expect(await frame.locator('.pvc-q-feedback').textContent()).not.toContain('হয়নি');
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  expect(await frame.locator('.pvc-quiz').textContent()).toContain('৪টির মধ্যে ৪টি সঠিক');
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'intro' });
  expect(log.errors).toEqual([]);
});
