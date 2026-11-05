// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the three steps
// built in the book's order, the fold, the images and hands read back from the state, the ray, the test.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('right-angle-mirrors: the three steps', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'right-angle-mirrors');
  const act = async (ms = 1700) => {
    await fig.frame.locator('.pvc-act').first().click();
    await fig.advance(ms);
  };
  let st = await fig.call('get');
  expect(st).toMatchObject({ step: 'one', stage: 0, arm: 0, alpha: 180, world: 'boy' });

  // one mirror: he raises his left hand, the image's is a right hand; then the writing
  await act();
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 1, arm: 1 });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('ডান হাত');
  await fig.advance(400);
  await act(1200);
  expect((await fig.call('get')).stage).toBe(2);
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('উল্টো');
  await fig.advance(400);
  await act(1400);
  expect(await fig.call('get')).toMatchObject({ step: 'two', stage: 0, alpha: 180, arm: 1 });

  // the fold: at an angle between, nothing is named yet; at 90° three images, and left stays left only in the corner one
  st = await fig.call('set', { alpha: 135, animate: false });
  expect(st).toMatchObject({ alpha: 135, stage: 0, images: [] });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('১৩৫');
  await fig.call('set', { alpha: 180, animate: false });
  await act(2600);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 1, alpha: 90 });
  expect(st.images.map((q) => [q.id, q.hand, q.reflections])).toEqual([
    ['b', 'right', 1],
    ['a', 'right', 1],
    ['ab', 'left', 2],
  ]);
  const [b, a, ab] = st.images;
  expect(ab.x).toBeCloseTo(0.3, 3);
  expect(ab.z).toBeCloseTo(-1.16, 3);
  expect(a.x).toBeCloseTo(1.16, 3);
  expect(a.z).toBeCloseTo(-0.3, 3);
  expect(b.x).toBeCloseTo(-1.16, 3);
  expect(b.z).toBeCloseTo(0.3, 3);
  await fig.advance(400);
  await act(1300);
  expect((await fig.call('get')).frame).toBe('close');
  await expect(fig.frame.locator('.pvc-rule')).toContainText('ডান-বামের পরিবর্তন হয় না');
  await fig.advance(400);
  await act(1300);
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('একবার');
  await fig.advance(400);

  // the book's plan
  await act(2800);
  expect(await fig.call('get')).toMatchObject({ step: 'top', stage: 0, world: 'fist', alpha: 90, images: [] });
  for (const [n, quarter] of /** @type {[number, string][]} */ ([
    [1, 'A′OB'],
    [2, 'AOB′'],
    [3, 'A′OB′'],
  ])) {
    await act(n === 3 ? 2700 : 1900);
    st = await fig.call('get');
    expect(st.stage).toBe(n);
    expect(st.images[n - 1].quarter).toBe(quarter);
    await fig.advance(400);
  }
  expect(st.images.map((q) => q.hand)).toEqual(['right', 'right', 'left']);
  expect(st.ray.quarter).toBe('A′OB′');
  expect(st.ray.onGlass).toBe(true);
  expect(st.ray.miss).toBeCloseTo(0, 6);
  expect(st.ray.backMiss).toBeCloseTo(0, 6);
  for (const q of st.ray.angles) expect(q.thetaR).toBeCloseTo(q.thetaI, 6);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('প্রতিবিম্বের প্রতিবিম্ব');

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'one', stage: 0, arm: 0, alpha: 180 });
  expect(log.errors).toEqual([]);
});

test('right-angle-mirrors: the mirror folds under a finger, and the arrows fold it too', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'right-angle-mirrors', { params: { step: 'two' } });
  await fig.advance(600);
  const stageBox = await fig.frame.locator('.pvc-canvas').boundingBox();
  // the handle shows before any drag, with its label; the ring of the action stands on it
  expect((await fig.call('get')).handle).toEqual({ shown: true, used: false });
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'টেনে সরাও' })).toBeVisible();
  const ring = await fig.frame.locator('.pvc-act-under .pvc-act-ring').boundingBox();
  const x = ring.x + ring.width / 2;
  const y = ring.y + ring.height / 2;
  expect(x).toBeGreaterThan(stageBox.x);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 60, y, { steps: 4 });
  await fig.advance(100);
  let st = await fig.call('get');
  expect(st.alpha).toBeLessThan(180);
  expect(st.alpha).toBeGreaterThan(90);
  await page.mouse.move(x - stageBox.width, y, { steps: 6 });
  await page.mouse.up();
  await fig.advance(300);
  st = await fig.call('get');
  expect(st).toMatchObject({ alpha: 90, stage: 1, handle: { shown: true, used: true } });
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'টেনে সরাও' })).toHaveCount(0);
  // and open again by the keys
  await fig.frame.locator('.ra').focus();
  await page.keyboard.press('ArrowRight');
  await fig.advance(300);
  st = await fig.call('get');
  expect(st).toMatchObject({ alpha: 95, stage: 0 });
  // the handle hides during the test: no question needs the drag
  await fig.call('practice');
  await fig.advance(1500);
  expect((await fig.call('get')).handle.shown).toBe(false);
  expect(log.errors).toEqual([]);
});

test('right-angle-mirrors: every question can be answered right: five of five', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'right-angle-mirrors');
  await fig.call('practice');
  const f = fig.frame;
  const kinds = [];
  for (let i = 0; i < 5; i++) {
    await fig.advance(1500);
    await expect(f.locator('.pvc-opt')).toHaveCount(4);
    const { question } = await fig.call('get');
    kinds.push(question.kind);
    await f.locator('.pvc-opt', { hasText: new RegExp(`^${question.answer}$`) }).click();
    await fig.advance(300);
    await expect(f.locator('.pvc-opt.right')).toHaveCount(1);
    await expect(f.locator('.pvc-q-feedback')).toContainText('ঠিক!');
    await fig.advance(600);
    await f.locator('[data-act="q-next"]').click();
  }
  await fig.advance(600);
  expect(kinds).toEqual(['fold', 'times', 'hand', 'place', 'ray']);
  await expect(f.locator('.pvc-q-result')).toContainText('৫ টির মধ্যে ৫ টি');
  await f.locator('[data-mode="explore"]').click();
  await fig.advance(900);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'one', stage: 0 });
  expect(log.errors).toEqual([]);
});

test('right-angle-mirrors: nothing is drawn when nothing changes', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 800, height: 500 });
  await page.addInitScript(() => {
    globalThis.__draws = 0;
    const p = globalThis.WebGL2RenderingContext?.prototype;
    if (!p) return;
    const o = p.clear;
    p.clear = function (...a) {
      globalThis.__draws++;
      return o.apply(this, a);
    };
  });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'right-angle-mirrors', { params: { step: 'two', stage: '1' } });
  await fig.advance(3000);
  const a = await fig.frame.evaluate(() => globalThis.__draws);
  await fig.advance(3000);
  expect(await fig.frame.evaluate(() => globalThis.__draws)).toBe(a);
  expect(log.errors).toEqual([]);
});
