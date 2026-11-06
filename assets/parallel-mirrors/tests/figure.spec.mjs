// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the build, one tap
// at a time, read back from the state; the rays; a tap on an image; the handle; the view turned; the test.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

// how long each tap plays, ms of the figure's clock
const PLAY = [0, 5200, 6000, 6200, 7000, 6800, 6300, 7800, 2800, 2800];

test('parallel-mirrors: from one mirror to the book’s whole picture, one tap at a time', async ({ page }) => {
  test.setTimeout(200_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'parallel-mirrors');
  const f = fig.frame;
  // the stage's clock takes at most 50 ms a frame, so a played tap costs its whole length in software rendering: the taps that
  // change most are played, the others jump to the same state
  const act = async (beat) => {
    await f.locator('.pvc-act').first().click();
    await fig.advance(PLAY[beat]);
    return fig.call('get');
  };
  const jump = async (step, stage) => {
    const after = await fig.call('set', { step, stage, animate: false });
    await fig.advance(200);
    return after;
  };
  let st = await fig.call('get');
  // it starts with the candle and one mirror, nothing else
  expect(st).toMatchObject({ step: 'one', beat: 0, x: 5, m2: 0, d1: 10, d2: 20, d3: 50, d4: 70, images: [], trace: null });

  // one image, the rule of a plane mirror, and no ray yet
  st = await jump('one', 1);
  expect(st).toMatchObject({ beat: 1, phase: 'b1', m2: 0, images: [{ id: 'r1', x: 25 }], trace: null });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('১০');
  for (const x of [-7, -2, 7]) {
    st = await fig.call('set', { x, animate: false });
    expect(st.images[0].x - 15).toBe(st.d1);
  }
  await fig.call('set', { x: 5, animate: false });

  // the second mirror slides in with its own image; it stays until the student taps
  st = await act(2);
  expect(st).toMatchObject({ step: 'two', beat: 2, m2: 1 });
  expect(st.images).toEqual([
    { id: 'r1', x: 25 },
    { id: 'l1', x: -35 },
  ]);
  await fig.advance(3000);
  expect((await fig.call('get')).beat).toBe(2);

  // the first image is an object for the second mirror
  st = await jump('image', 1);
  expect(st).toMatchObject({ step: 'image', beat: 3, trace: null });
  expect(st.images.at(-1)).toEqual({ id: 'l2', x: -55 });
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'এই x′ এখন বস্তু' })).toBeVisible();
  // … and one ray for it, traced by the law
  st = await act(4);
  expect(st.trace).toMatchObject({ id: 'l2', chain: ['m1', 'm2'], onGlass: true, clearsNear: true });
  for (const a of st.trace.angles) expect(a.thetaR).toBeCloseTo(a.thetaI, 6);
  expect(st.trace.miss).toBeCloseTo(0, 6);
  expect(st.trace.backMiss).toBeCloseTo(0, 6);

  // the other side: the book's d₃ and d₄
  st = await jump('again', 1);
  expect(st).toMatchObject({ step: 'again', beat: 5, trace: null });
  expect(st.images.at(-1)).toEqual({ id: 'r2', x: 65 });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('৫০');
  st = await jump('again', 2);
  expect(st.images.at(-1)).toEqual({ id: 'r3', x: 85 });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('৭০');
  // from step 4 on an older pair keeps its line, not its name
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'd' })).toHaveCount(2);

  // it goes on, into the mirror, and only then the book's whole picture
  st = await act(7);
  expect(st).toMatchObject({ step: 'many', beat: 7, frame: 'row' });
  expect(st.images.length).toBe(12);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('অসংখ্য প্রতিবিম্ব');
  st = await jump('many', 2);
  expect(st).toMatchObject({ beat: 8, inside: true, frame: 'inside' });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('৮১');
  st = await jump('book', 1);
  expect(st).toMatchObject({ step: 'book', beat: 9, inside: false, frame: 'book' });
  expect(st.images.map((q) => q.id)).toEqual(['r1', 'l1', 'l2', 'r2', 'r3']);
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'd' })).toHaveCount(8);
  expect(st.open).toEqual(['one', 'two', 'image', 'again', 'many', 'book']);

  // the test is offered only now
  await expect(fig.frame.locator('.pvc-act').first()).toContainText('পরীক্ষা দাও');
  await fig.frame.locator('.pvc-act').first().click();
  await fig.advance(600);
  expect((await fig.call('get')).mode).toBe('quiz');
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'one', beat: 0, m2: 0, x: 5 });
  expect(log.errors).toEqual([]);
});

test('parallel-mirrors: the words open as the student goes: no jump to the crowded picture', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'parallel-mirrors');
  const f = fig.frame;
  await fig.advance(300);
  expect((await fig.call('get')).open).toEqual(['one']);
  await expect(f.locator('[data-example="book"]')).toHaveAttribute('aria-disabled', 'true');
  for (const id of ['book', 'many', 'two']) {
    await f.locator(`[data-example="${id}"]`).click({ force: true }); // a real tap: Playwright alone would wait for aria-disabled to go
    await fig.advance(300);
    expect(await fig.call('get')).toMatchObject({ step: 'one', beat: 0, phase: 'b0' });
  }
  await f.locator('.pvc-act').first().click();
  await fig.advance(PLAY[1]);
  expect((await fig.call('get')).open).toEqual(['one', 'two']);
  await expect(f.locator('[data-example="two"]')).toHaveAttribute('aria-disabled', 'false');
  await expect(f.locator('[data-example="image"]')).toHaveAttribute('aria-disabled', 'true');
  await f.locator('[data-example="two"]').click();
  await fig.advance(PLAY[2]);
  expect(await fig.call('get')).toMatchObject({ step: 'two', beat: 2, m2: 1, reached: 2 });
  expect(log.errors).toEqual([]);
});

test('parallel-mirrors: taps wait while a step plays, and a word replays its step', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'parallel-mirrors', { params: { step: 'two', stage: '1' } });
  const act = fig.frame.locator('.pvc-act').first();
  await fig.frame.locator('[data-example="one"]').click();
  await fig.advance(500);
  // the word's step plays from its start, slowly: the mirror M₂ is gone, and the image has not come yet
  let st = await fig.call('get');
  expect(st).toMatchObject({ step: 'one', beat: 1, phase: 'busy', m2: 0 });
  // tapping again changes nothing, nor do the other words
  await act.click({ force: true });
  await fig.frame.locator('[data-example="many"]').click({ force: true });
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ step: 'one', beat: 1, phase: 'busy' });
  await fig.advance(PLAY[1]);
  st = await fig.call('get');
  expect(st).toMatchObject({ step: 'one', beat: 1, phase: 'b1' });
  // it waits, however long
  await fig.advance(6000);
  expect((await fig.call('get')).phase).toBe('b1');
  expect(log.errors).toEqual([]);
});

test('parallel-mirrors: a tap on an image traces its light, a second tap takes it away', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'parallel-mirrors', { params: { step: 'book', stage: '1' } });
  await fig.advance(600);
  const box = await fig.frame.locator('.pvc-anno', { hasText: 'x‴' }).boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y - 30);
  await fig.advance(200);
  const st = await fig.call('get');
  expect(st.trace).toMatchObject({ id: 'r3', chain: ['m1', 'm2', 'm1'] });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('৩ বার');
  await fig.advance(7000);
  const again = await fig.frame.locator('.pvc-anno', { hasText: 'x‴' }).boundingBox();
  await page.mouse.click(again.x + again.width / 2, again.y - 30);
  await fig.advance(200);
  expect((await fig.call('get')).trace).toBeNull();
  expect(log.errors).toEqual([]);
});

test('parallel-mirrors: the candle’s handle shows what can be moved, from any side', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'parallel-mirrors', { params: { coach: '1' } });
  const f = fig.frame;
  await fig.advance(400);
  // nothing to move yet
  await expect(f.locator('.pm2-hd')).toBeHidden();
  await fig.call('set', { stage: 1, animate: false });
  await fig.advance(400);
  let st = await fig.call('get');
  expect(st.handle).toEqual({ shown: true, used: false });
  await expect(f.locator('.pm2-hl')).toBeVisible();
  const drag = async (dx) => {
    const b = await f.locator('.pm2-hd').boundingBox();
    const [x, y] = [b.x + b.width / 2, b.y + b.height / 2];
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx / 2, y, { steps: 3 });
    await page.mouse.move(x + dx, y, { steps: 3 });
    await page.mouse.up();
    await fig.advance(300);
    return fig.call('get');
  };
  st = await drag(-60);
  expect(st.x).toBeLessThan(5);
  expect(st.view).toBe('front'); // moving the candle is not turning the view
  expect(st.images[0].x - 15).toBe(st.d1);
  expect(st.handle).toEqual({ shown: true, used: true });
  await expect(f.locator('.pm2-hl')).toBeHidden();
  await expect(f.locator('.pm2-hd')).toBeVisible();
  // from behind the same drag on the screen moves the candle the other way along the row
  const before = (await fig.call('set', { x: 0, azimuth: 180, polar: 75, animate: false })).x;
  await fig.advance(400);
  expect((await drag(-40)).x).toBeGreaterThan(before);
  await fig.call('practice');
  await fig.advance(900);
  await expect(f.locator('.pm2-hd')).toBeHidden();
  await expect(f.locator('.pm2-turn')).toBeHidden();
  expect(log.errors).toEqual([]);
});

test('parallel-mirrors: a tap is not a turn; the view goes all the way round and comes back', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'parallel-mirrors', { params: { coach: '1' } });
  const f = fig.frame;
  await fig.advance(400);
  const c = await f.locator('.pvc-canvas').boundingBox();
  const [x, y] = [c.x + 60, c.y + 70];
  await expect(f.locator('.pm2-tw')).toBeVisible();
  await expect(f.locator('.pm2-turn b')).toContainText('৩৬০°');
  // a plain tap, with a finger's small slip
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 4, y + 2);
  await page.mouse.up();
  await fig.advance(600);
  let st = await fig.call('get');
  expect(st).toMatchObject({ view: 'front', turned: false });
  await expect(f.locator('[data-view="front"]')).toBeHidden();
  // a real drag
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 90, y + 4, { steps: 6 });
  await page.mouse.up();
  await fig.advance(1200);
  st = await fig.call('get');
  expect(st).toMatchObject({ view: '3d', turned: true });
  // the pill keeps ⟲ ৩৬০°, never the icon alone
  await expect(f.locator('.pm2-tw')).toBeHidden();
  await expect(f.locator('.pm2-turn svg')).toBeVisible();
  await expect(f.locator('.pm2-turn b')).toBeVisible();
  // all the way round, and the সামনে button brings the guided view back
  for (const azimuth of [90, 180, -90]) expect((await fig.call('set', { azimuth, animate: false })).view).toBe('3d');
  await expect(f.locator('[data-view="front"]')).toContainText('সামনে');
  await f.locator('[data-view="front"]').click();
  await fig.advance(2200);
  st = await fig.call('get');
  expect(st.view).toBe('front');
  await expect(f.locator('[data-view="front"]')).toBeHidden();
  // looking into M₁ the camera stands between the mirrors: the pill does not promise 360°
  await fig.call('set', { step: 'many', stage: 2, animate: false });
  await fig.advance(300);
  await expect(f.locator('.pm2-tn')).toBeVisible();
  await expect(f.locator('.pm2-turn b')).toBeHidden();
  expect(log.errors).toEqual([]);
});

test.describe('on a sharp screen', () => {
  test.use({ deviceScaleFactor: 2 });
  test('parallel-mirrors: the kit lowering the resolution mid-turn leaves the student’s view alone', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 640, height: 400 });
    const log = await preparePage(page);
    const fig = await openFigure(page, 'parallel-mirrors');
    await fig.advance(300);
    const start = await fig.call('get');
    expect(start.pixelRatio).toBe(2);
    const c = await fig.frame.locator('.pvc-canvas').boundingBox();
    const [x, y] = [c.x + 40, c.y + 60];
    await page.mouse.move(x, y);
    await page.mouse.down();
    // 50 ms a frame is slow to the stage: after 30 frames in a row it steps the pixel ratio down and reports a resize
    for (let i = 1; i <= 40; i++) {
      await page.mouse.move(x + i * 3, y);
      await fig.advance(50);
    }
    await page.mouse.up();
    await fig.advance(800);
    const st = await fig.call('get');
    expect(st.pixelRatio).toBeLessThan(2);
    expect(st).toMatchObject({ view: '3d', turned: true });
    expect(Math.abs(st.azimuth - start.azimuth)).toBeGreaterThan(30); // all forty moves of the finger counted
    // the view stays where the student left it, also with the flames still drawing (the damping may glide a degree or two)
    await fig.advance(1000);
    expect(Math.abs((await fig.call('get')).azimuth - st.azimuth)).toBeLessThan(3);
    // a real change of size does frame it again
    await page.setViewportSize({ width: 800, height: 500 });
    await fig.advance(400);
    expect(await fig.call('get')).toMatchObject({ view: 'front' });
    expect(log.errors).toEqual([]);
  });
});

test('parallel-mirrors: the test runs to its end and leaves the learn state as it was', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'parallel-mirrors', { params: { step: 'many', stage: '2', x: '3' } });
  await fig.call('practice');
  const f = fig.frame;
  for (let i = 0; i < 5; i++) {
    await fig.advance(1300);
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
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'many', beat: 8, inside: true, x: 3 });
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
    await fig.advance(1300);
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
  // turned all the way round, it rests just the same once the damping has settled
  await fig.call('set', { azimuth: 180, animate: false });
  await fig.advance(10000);
  const b = await draws();
  await fig.advance(3000);
  expect(await draws()).toBe(b);
  expect(log.errors).toEqual([]);
});
