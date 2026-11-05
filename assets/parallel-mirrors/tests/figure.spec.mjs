// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the three steps
// built in the book's order, the row read back from the state, the rays, a tap on an image, the test.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('parallel-mirrors: the three steps', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'parallel-mirrors');
  const act = async (ms = 2300) => {
    await fig.frame.locator('.pvc-act').first().click();
    await fig.advance(ms);
  };
  let st = await fig.call('get');
  expect(st).toMatchObject({ step: 'first', first: 0, x: 5, d1: 10, d2: 20, d3: 50, d4: 70, images: [] });

  // the image in each mirror, with its ray
  await act();
  st = await fig.call('get');
  expect(st.first).toBe(1);
  expect(st.images).toEqual([{ id: 'r1', x: 25 }]);
  expect(st.trace).toMatchObject({ id: 'r1', chain: ['m1'], onGlass: true, clearsNear: true });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('১০');
  await fig.advance(500);
  await act();
  st = await fig.call('get');
  expect(st.images).toEqual([
    { id: 'r1', x: 25 },
    { id: 'l1', x: -35 },
  ]);

  // dragging: each x′ stays as far behind its mirror as the candle is in front
  await act(1800);
  st = await fig.call('get');
  expect(st.first).toBe(3);
  expect(st.x).not.toBe(5);
  for (const x of [-7, -2, 7]) {
    st = await fig.call('set', { x, animate: false });
    expect(st.images[0].x - 15).toBe(st.d1);
    expect(-15 - st.images[1].x).toBe(st.d2);
    expect(st.d1 + st.d2).toBe(30);
  }
  await fig.call('set', { x: 5, animate: false });
  await act(400);
  expect((await fig.call('get')).step).toBe('second');

  // the image of the image: the book's row
  for (const [n, id, x] of [
    [1, 'r2', 65],
    [2, 'l2', -55],
    [3, 'r3', 85],
  ]) {
    await act(2900);
    st = await fig.call('get');
    expect(st.second).toBe(n);
    expect(st.images.find((q) => q.id === id).x).toBe(x);
    expect(st.trace.id).toBe(id);
    for (const a of st.trace.angles) expect(a.thetaR).toBeCloseTo(a.thetaI, 6);
    expect(st.trace.miss).toBeCloseTo(0, 6);
    expect(st.trace.backMiss).toBeCloseTo(0, 6);
    await fig.advance(400);
  }
  await expect(fig.frame.locator('.pvc-rule')).toContainText('d');

  // a tap on an image traces its light, a second tap takes it away
  await fig.call('set', { step: 'second', stage: 3, trace: '', animate: false });
  await fig.advance(600);
  const box = await fig.frame.locator('.pvc-anno', { hasText: 'x‴' }).boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y - 30);
  await fig.advance(200);
  st = await fig.call('get');
  expect(st.trace).toMatchObject({ id: 'r3', chain: ['m1', 'm2', 'm1'] });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('৩ বার');
  await fig.advance(1200);
  const again = await fig.frame.locator('.pvc-anno', { hasText: 'x‴' }).boundingBox();
  await page.mouse.click(again.x + again.width / 2, again.y - 30);
  await fig.advance(200);
  expect((await fig.call('get')).trace).toBeNull();

  // it goes on, and then into the mirror and out
  await act(1200);
  expect((await fig.call('get')).step).toBe('many');
  await act(2600);
  st = await fig.call('get');
  expect(st).toMatchObject({ many: 1, frame: 'row' });
  expect(st.images.length).toBe(12);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('অসংখ্য প্রতিবিম্ব');
  await act(2800);
  st = await fig.call('get');
  expect(st).toMatchObject({ many: 2, inside: true, frame: 'inside' });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('৮১');
  await act(2200);
  expect(await fig.call('get')).toMatchObject({ many: 1, inside: false });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'first', first: 0, x: 5 });
  expect(log.errors).toEqual([]);
});

test('parallel-mirrors: the test runs to its end and leaves the learn state as it was', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'parallel-mirrors', { params: { step: 'many', stage: '2', x: '3' } });
  await fig.call('practice');
  const f = fig.frame;
  for (let i = 0; i < 5; i++) {
    await fig.advance(900);
    await expect(f.locator('.pvc-opt')).toHaveCount(4);
    await f.locator('.pvc-opt').first().click();
    await fig.advance(300);
    await expect(f.locator('.pvc-q-feedback')).not.toBeEmpty();
    await fig.advance(1300);
    await f.locator('[data-act="q-next"]').click();
  }
  await fig.advance(600);
  await expect(f.locator('.pvc-q-result')).toContainText('৫');
  await f.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'many', many: 2, inside: true, x: 3 });
  expect(log.errors).toEqual([]);
});

test('parallel-mirrors: every question can be answered right: five of five', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'parallel-mirrors');
  await fig.call('practice');
  const f = fig.frame;
  const kinds = [];
  for (let i = 0; i < 5; i++) {
    await fig.advance(900);
    await expect(f.locator('.pvc-opt')).toHaveCount(4);
    const { question } = await fig.call('get');
    kinds.push(question.kind);
    await f.locator('.pvc-opt', { hasText: question.answer }).click();
    await fig.advance(300);
    await expect(f.locator('.pvc-opt.right')).toHaveCount(1);
    await expect(f.locator('.pvc-q-feedback')).toContainText('ঠিক!');
    await fig.advance(600);
    await f.locator('[data-act="q-next"]').click();
  }
  await fig.advance(600);
  expect(kinds).toEqual(['pair', 'times', 'spot', 'sum', 'dim']);
  await expect(f.locator('.pvc-q-result')).toContainText('৫ টির মধ্যে ৫ টি');
  expect(log.errors).toEqual([]);
});

test('parallel-mirrors: the flames rest when nothing happens, and wake on a touch', async ({ page }) => {
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
  const fig = await openFigure(page, 'parallel-mirrors');
  const draws = () => fig.frame.evaluate(() => globalThis.__draws);
  await fig.advance(10000);
  const a = await draws();
  await fig.advance(3000);
  expect(await draws()).toBe(a);
  await fig.frame.locator('.pvc-canvas').dispatchEvent('pointerdown', { pointerId: 3, clientX: 5, clientY: 5 });
  await fig.advance(1000);
  expect(await draws()).toBeGreaterThan(a);
  expect(log.errors).toEqual([]);
});
