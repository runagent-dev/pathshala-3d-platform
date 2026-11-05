// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the four steps in
// the book's order, the pieces rolling, the rays read back from the state, a tap on a cell, the test with every answer right.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('kaleidoscope: the pattern, and turning it', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'kaleidoscope');
  const act = async (ms) => {
    await fig.frame.locator('.pvc-act').first().click();
    await fig.advance(ms);
  };
  let st = await fig.call('get');
  expect(st).toMatchObject({ step: 'pattern', stage: 0, eye: false, cells: { total: 100, one: 3, two: 6, three: 9 } });
  await act(2000);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 1, eye: true, peek: 1 });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('৯');
  const before = st.beads.stone;
  // the shown action turns it a third of a turn; the pieces roll, and come to rest
  await act(2800);
  st = await fig.call('get');
  expect(st.stage).toBe(2);
  expect(st.turned).toBe(120);
  await fig.advance(6500);
  st = await fig.call('get');
  expect(st.beads.settled).toBe(true);
  expect(st.beads.stone).not.toEqual(before);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('নড়ে');
  // the next word leaves the eye: the tube squares up and shows its open side again
  await act(2600);
  st = await fig.call('get');
  expect(st).toMatchObject({ step: 'why', stage: 0, eye: false, phi: 0, peek: 0 });
  expect(log.errors).toEqual([]);
});

test('kaleidoscope: a drag turns it, by touch of the view', async ({ page }) => {
  test.setTimeout(200_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'kaleidoscope', { params: { step: 'pattern', stage: '1' } });
  await fig.advance(600);
  // what can be moved shows: a handle with its word, until the first drag
  await expect(fig.frame.locator('.kld-grip')).toBeVisible();
  await expect(fig.frame.locator('.kld-grip-tag')).toHaveText('ঘোরাও');
  const box = await fig.frame.locator('.pvc-canvas').boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx + 120, cy);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) {
    const a = (i / 8) * 1.2;
    await page.mouse.move(cx + 120 * Math.cos(a), cy + 120 * Math.sin(a));
    await fig.advance(40);
  }
  await page.mouse.up();
  await fig.advance(300);
  const st = await fig.call('get');
  expect(st.stage).toBe(2);
  expect(st.phi).toBeCloseTo(1.2, 1); // clockwise on the screen is positive
  expect(st.turned).toBeGreaterThan(60);
  await expect(fig.frame.locator('.kld-grip')).toBeVisible();
  await expect(fig.frame.locator('.kld-grip-tag')).toBeHidden();
  await fig.call('practice');
  await fig.advance(900);
  await expect(fig.frame.locator('.kld-grip')).toBeHidden();
  expect(log.errors).toEqual([]);
});

test('kaleidoscope: the rays, one reflection at a time, and the cells', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'kaleidoscope', { params: { step: 'why' } });
  const act = async (ms) => {
    await fig.frame.locator('.pvc-act').first().click();
    await fig.advance(ms);
  };
  for (const n of [1, 2, 3]) {
    await act(2400);
    const st = await fig.call('get');
    expect(st.stage).toBe(n);
    expect(st.trace.reflections).toBe(n);
    expect(st.trace.hits).toHaveLength(n);
    for (const h of st.trace.hits) expect(h.theta).toBeGreaterThan(60);
    await expect(fig.frame.locator('.pvc-outcome')).toContainText(['১', '২', '৩'][n - 1]);
    await fig.advance(500);
  }
  await act(2100);
  let st = await fig.call('get');
  expect(st).toMatchObject({ stage: 4, eye: true });
  // a tap on the middle cell, then on a cell beside it
  const box = await fig.frame.locator('.pvc-canvas').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await fig.advance(300);
  st = await fig.call('get');
  expect(st.picked.n).toBe(0);
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('আসল');
  await fig.advance(800);
  await page.mouse.click(box.x + box.width / 2 + box.width * 0.2, box.y + box.height / 2 - 40);
  await fig.advance(300);
  st = await fig.call('get');
  expect(st.picked.n).toBeGreaterThan(0);
  expect(st.picked.light).toBeLessThan(0.8);
  expect(log.errors).toEqual([]);
});

test('kaleidoscope: one strip: more light as the eye grazes the glass', async ({ page }) => {
  test.setTimeout(200_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'kaleidoscope', { params: { step: 'graze' } });
  let st = await fig.call('get');
  expect(st).toMatchObject({ step: 'graze', theta: 18, reflected: 4 });
  await fig.frame.locator('.pvc-act').first().click();
  await fig.advance(3000);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 1, theta: 83, reflected: 51 });
  await expect(fig.frame.locator('.pvc-rule')).toContainText('ঘেঁষে');
  for (const [theta, reflected] of [
    [30, 4],
    [60, 9],
    [80, 39],
  ]) {
    st = await fig.call('set', { theta, animate: false });
    expect(st.reflected).toBe(reflected);
  }
  expect(log.errors).toEqual([]);
});

test('kaleidoscope: চিত্র ৮.১৩, a ray at 60° comes straight back', async ({ page }) => {
  test.setTimeout(200_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'kaleidoscope', { params: { step: 'two' } });
  const act = async (ms) => {
    await fig.frame.locator('.pvc-act').first().click();
    await fig.advance(ms);
  };
  await act(1900);
  let st = await fig.call('get');
  expect(st).toMatchObject({ step: 'two', stage: 1, angle: 60, atB: 0, back: true });
  await fig.advance(500);
  await act(500);
  st = await fig.call('get');
  expect(st.stage).toBe(2);
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('ঠিক বিপরীত দিকে');
  st = await fig.call('set', { angle: 45, animate: false });
  expect(st).toMatchObject({ atB: 15, back: false });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('১৫');
  expect(log.errors).toEqual([]);
});

test('kaleidoscope: every question can be answered right: five of five, and the test leaves the learn state', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'kaleidoscope', { params: { step: 'why', stage: '2' } });
  await fig.call('practice');
  const f = fig.frame;
  const kinds = [];
  for (let i = 0; i < 5; i++) {
    await fig.advance(1000);
    await expect(f.locator('.pvc-opt')).toHaveCount(4);
    const { question } = await fig.call('get');
    kinds.push(question.kind);
    await f.locator('.pvc-opt', { hasText: question.answer }).first().click();
    await fig.advance(300);
    await expect(f.locator('.pvc-opt.right')).toHaveCount(1);
    await expect(f.locator('.pvc-q-feedback')).toContainText('ঠিক!');
    await fig.advance(600);
    await f.locator('[data-act="q-next"]').click();
  }
  await fig.advance(600);
  expect(kinds).toEqual(['count', 'spot', 'corner', 'graze', 'sixty']);
  await expect(f.locator('.pvc-q-result')).toContainText('৫ টির মধ্যে ৫ টি');
  await f.locator('[data-mode="explore"]').click();
  await fig.advance(900);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'why', stage: 2, eye: false, locked: false });
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'pattern', stage: 0, eye: false, phi: 0 });
  expect(log.errors).toEqual([]);
});

test('kaleidoscope: nothing is drawn while it rests', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 800, height: 500 });
  await page.addInitScript(() => {
    globalThis.__draws = 0;
    const raf = globalThis.WebGL2RenderingContext?.prototype;
    if (!raf) return;
    const o = raf.clear;
    raf.clear = function (...a) {
      globalThis.__draws++;
      return o.apply(this, a);
    };
  });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'kaleidoscope', { params: { step: 'pattern', stage: '1' } });
  const draws = () => fig.frame.evaluate(() => globalThis.__draws);
  await fig.advance(3000);
  const a = await draws();
  await fig.advance(3000);
  expect(await draws()).toBe(a);
  expect(log.errors).toEqual([]);
});
