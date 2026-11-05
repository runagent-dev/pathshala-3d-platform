// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the three steps
// built in the book's order, the fold, the images and hands read back from the state, the ray, the test.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

// Slow software rendering on CI: each step plays in its own test, at the smallest frame with the panel beside the view,
// jumping to where it starts.
async function start(page, params = {}) {
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'right-angle-mirrors', { params });
  const settle = async () => {
    for (let i = 0; i < 80; i++) {
      await fig.advance(500);
      if ((await fig.call('get')).phase !== 'busy') return;
    }
    throw new Error('still busy');
  };
  const act = async () => {
    await fig.frame.locator('.pvc-act').first().click();
    await settle();
  };
  return { fig, log, act };
}

test('right-angle-mirrors: one mirror', async ({ page }) => {
  test.setTimeout(150_000);
  const { fig, log, act } = await start(page);
  expect(await fig.call('get')).toMatchObject({ step: 'one', stage: 0, arm: 0, alpha: 180, world: 'boy' });
  // he raises his left hand, the image's is a right hand; then the writing
  await act();
  expect(await fig.call('get')).toMatchObject({ stage: 1, arm: 1 });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('ডান হাত');
  await act();
  expect((await fig.call('get')).stage).toBe(2);
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('উল্টো');
  await act();
  expect(await fig.call('get')).toMatchObject({ step: 'two', stage: 0, alpha: 180, arm: 1 });
  expect(log.errors).toEqual([]);
});

test('right-angle-mirrors: two mirrors', async ({ page }) => {
  test.setTimeout(150_000);
  const { fig, log, act } = await start(page, { step: 'two' });
  // at an angle between, nothing is named yet; at 90° three images, and left stays left only in the corner one
  let st = await fig.call('set', { alpha: 135, animate: false });
  expect(st).toMatchObject({ alpha: 135, stage: 0, images: [] });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('১৩৫');
  await fig.call('set', { alpha: 180, animate: false });
  await act();
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
  await act();
  expect((await fig.call('get')).frame).toBe('close');
  await expect(fig.frame.locator('.pvc-rule')).toContainText('ডান-বামের পরিবর্তন হয় না');
  await act();
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('একবার');
  await act();
  expect(await fig.call('get')).toMatchObject({ step: 'top', stage: 0, world: 'fist', alpha: 90, images: [] });
  expect(log.errors).toEqual([]);
});

test('right-angle-mirrors: the book’s plan', async ({ page }) => {
  test.setTimeout(150_000);
  const { fig, log, act } = await start(page, { step: 'top' });
  let st = await fig.call('get');
  expect(st).toMatchObject({ step: 'top', stage: 0, world: 'fist', alpha: 90, images: [] });
  for (const [n, quarter] of /** @type {[number, string][]} */ ([
    [1, 'A′OB'],
    [2, 'AOB′'],
    [3, 'A′OB′'],
  ])) {
    await act();
    st = await fig.call('get');
    expect(st.stage).toBe(n);
    expect(st.images[n - 1].quarter).toBe(quarter);
    expect(st.ray).toBeNull(); // the ghost alone: the ray is a tap of its own
  }
  expect(st.images.map((q) => q.hand)).toEqual(['right', 'right', 'left']);
  await act();
  st = await fig.call('get');
  expect(st.stage).toBe(4);
  expect(st.ray.quarter).toBe('A′OB′');
  expect(st.ray.onGlass).toBe(true);
  expect(st.ray.miss).toBeCloseTo(0, 6);
  expect(st.ray.backMiss).toBeCloseTo(0, 6);
  for (const q of st.ray.angles) expect(q.thetaR).toBeCloseTo(q.thetaI, 6);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('উপর-নিচ প্রতিবিম্ব');
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('পরীক্ষা দাও');
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'one', stage: 0, arm: 0, alpha: 180 });
  expect(log.errors).toEqual([]);
});

for (const [width, height] of [
  [390, 700],
  [390, 520],
  [844, 390],
  [640, 400],
  [800, 500],
  [1280, 800],
]) {
  test(`right-angle-mirrors: the action stays on one line at ${width}×${height}`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height });
    const log = await preparePage(page);
    const fig = await openFigure(page, 'right-angle-mirrors');
    const f = fig.frame;
    const rows = new Set();
    for (const [step, stage] of /** @type {[string, number][]} */ ([
      ['one', 0],
      ['one', 1],
      ['one', 2],
      ['two', 0],
      ['two', 1],
      ['two', 2],
      ['two', 3],
      ['top', 0],
      ['top', 1],
      ['top', 2],
      ['top', 3],
      ['top', 4],
    ])) {
      await fig.call('set', { step, stage, animate: false });
      await fig.advance(100);
      const m = await f
        .locator('.pvc-act-text')
        .first()
        .evaluate((el) => {
          const r = document.createRange();
          r.selectNodeContents(el);
          const lines = new Set([...r.getClientRects()].map((q) => Math.round(q.top / 8)));
          return { lines: lines.size, wide: el.scrollWidth - el.clientWidth };
        });
      expect(m.lines, `${step}${stage} is one line`).toBe(1);
      expect(m.wide, `${step}${stage} fits`).toBeLessThanOrEqual(1); // a pixel of rounding
      rows.add(Math.round((await f.locator('.pvc-act-row').boundingBox()).height));
    }
    expect([...rows].length, `the row keeps its height: ${[...rows]}`).toBe(1);
    expect(log.errors).toEqual([]);
  });
}

test('right-angle-mirrors: taps never run ahead of the student', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'right-angle-mirrors', { params: { step: 'two', stage: '1' } });
  await fig.advance(800);
  await fig.frame.locator('.ra').focus();
  // three taps half a second apart: one idea, the zoom to the corner
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Space');
    await fig.advance(500);
  }
  expect(await fig.call('get')).toMatchObject({ step: 'two', stage: 2, phase: 'busy' });
  await expect(fig.frame.locator('.pvc-act').first()).toBeDisabled();
  // the camera takes 1.6 s, then the result stands a second more
  await fig.advance(100);
  expect((await fig.call('get')).phase).toBe('busy');
  await fig.advance(2000);
  expect((await fig.call('get')).phase).toBe('two2');
  // a word does nothing while something plays, and the quiet button plays the last move again
  await fig.call('set', { step: 'top', stage: 4, animate: false });
  await fig.advance(600);
  await fig.frame.locator('[data-act="replay"]').click();
  await fig.advance(300);
  let st = await fig.call('get');
  expect(st).toMatchObject({ stage: 4, phase: 'busy' });
  expect(st.ray).not.toBeNull();
  await fig.advance(7600);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 4, phase: 'top4' });
  expect(st.images.length).toBe(3);
  expect(log.errors).toEqual([]);
});

test('right-angle-mirrors: a window with no room for the view stays quiet', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 480, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'right-angle-mirrors', { params: { step: 'two', stage: '3' } });
  await fig.advance(1000);
  expect(log.errors).toEqual([]);
});

for (const params of [{ mode: 'quiz' }, { step: 'two', mode: 'quiz' }, { step: 'top', stage: '3', mode: 'quiz' }]) {
  test(`right-angle-mirrors: opens straight in the test (${JSON.stringify(params)})`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 800, height: 500 });
    const log = await preparePage(page);
    const fig = await openFigure(page, 'right-angle-mirrors', { params });
    await fig.advance(2500);
    await expect(fig.frame.locator('.pvc-opt')).toHaveCount(4);
    expect(log.errors).toEqual([]);
  });
}

test('right-angle-mirrors: the view goes all the way round, and the front button brings it back', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'right-angle-mirrors', { params: { step: 'two', stage: '3' } });
  await fig.advance(1200);
  const f = fig.frame;
  await expect(f.locator('.ra-turn')).toContainText('ঘুরিয়ে দেখো');
  await expect(f.locator('[data-view="front"]')).toBeHidden();
  // a tap is not a turn
  const box = await f.locator('.pvc-canvas').boundingBox();
  await page.mouse.click(box.x + 60, box.y + 60);
  await fig.advance(300);
  expect((await fig.call('get')).orbited).toBe(false);
  // from every side, nothing breaks and the image of the far side never hangs in the air
  for (const az of [0, 60, 120, 180, 240, 300]) {
    const st = await fig.call('set', { turn: { az, el: 14 }, animate: false });
    expect(st).toMatchObject({ view: '3d', orbited: true });
    await fig.advance(300);
    expect(log.errors).toEqual([]);
    if (az === 180) await expect(f.locator('.pvc-anno', { hasText: 'ডান হাত' })).toHaveCount(0);
  }
  await expect(f.locator('.ra-turn.used')).toHaveCount(1);
  await expect(f.locator('[data-view="front"]')).toBeVisible();
  await expect(f.locator('[data-view="front"]')).toContainText('সামনে');
  await f.locator('[data-view="front"]').click();
  await fig.advance(2600);
  expect(await fig.call('get')).toMatchObject({ view: 'front', phase: 'two3' });
  expect(log.errors).toEqual([]);
});

test('right-angle-mirrors: the mirror folds under a finger, and the arrows fold it too', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'right-angle-mirrors', { params: { step: 'two' } });
  await fig.advance(1200);
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
  await fig.advance(2600);
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
    await fig.advance(2600);
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
  await fig.advance(2600);
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
  // and after a turn of the view, once its damping has settled
  await fig.call('set', { turn: { az: 200, el: 30 }, animate: false });
  await fig.advance(3000);
  const b = await fig.frame.evaluate(() => globalThis.__draws);
  await fig.advance(3000);
  expect(await fig.frame.evaluate(() => globalThis.__draws)).toBe(b);
  expect(log.errors).toEqual([]);
});
