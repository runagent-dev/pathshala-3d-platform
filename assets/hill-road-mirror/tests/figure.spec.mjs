// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the story
// built one part at a time, the angles read back from the traced path, the two mirrors, the drag, and a test answered
// right from start to finish (the kit's quiz compares numbers: a slip there would mark every answer wrong).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('hill-road-mirror: the story, step by step', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'hill-road-mirror');
  const act = () => fig.frame.locator('.pvc-act').first().click();
  expect(await fig.call('get')).toMatchObject({ part: 0, mirror: 'none', framing: 'far', pip: false });

  const steps = [
    { part: 1, ms: 5500, framing: 'wide', word: 'পৌঁছায় না' },
    { part: 2, ms: 6000, framing: 'close', word: 'কোণে' },
    { part: 3, ms: 6500, framing: 'wide', word: 'দেখা যাচ্ছে' },
    { part: 4, ms: 5000, framing: 'close', word: '৪৫' },
    { part: 5, ms: 5000, framing: 'wide', word: 'গাড়িটি দেখছেন' },
    { part: 6, ms: 4000, framing: 'wide', word: 'গুণ' },
  ];
  for (const { part, ms, framing, word } of steps) {
    await act();
    await fig.advance(200);
    await expect(fig.frame.locator('.pvc-act').first()).toBeDisabled();
    await fig.advance(ms);
    expect(await fig.call('get')).toMatchObject({ part, framing, busy: false });
    await expect(fig.frame.locator('.pvc-outcome')).toContainText(word);
    await expect(fig.frame.locator('.pvc-act').first()).toBeEnabled();
    await fig.advance(500);
  }
  const st = await fig.call('get');
  expect(st).toMatchObject({ part: 6, mirror: 'convex', who: 'car', blocked: true });
  expect(st.fieldAngle).toBeGreaterThan(20);
  expect(st.magnification).toBeLessThan(0.15);

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ part: 0, mirror: 'none', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('hill-road-mirror: the angles, the two mirrors, the keys and the drawing in a capture', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'hill-road-mirror');
  let st = await fig.call('set', { part: 4, animate: false });
  expect(Math.round(st.thetaI)).toBe(45);
  expect(st.thetaR).toBeCloseTo(st.thetaI, 6);
  expect(st.turn).toBeCloseTo(90, 0);
  await fig.advance(300);
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('θ');

  // the plane mirror's strip against the convex mirror's: the same place, far wider
  st = await fig.call('set', { part: 6, mirror: 'plane', animate: false });
  const plane = st.fieldWidth;
  expect(st).toMatchObject({ mirror: 'plane', magnification: 1 });
  st = await fig.call('set', { mirror: 'convex', animate: false });
  expect(st.mirror).toBe('convex');
  expect(st.fieldWidth).toBeGreaterThan(3 * plane);
  await fig.frame.locator('.pvc-examples button[data-example="plane"]').click();
  await fig.advance(300);
  expect((await fig.call('get')).mirror).toBe('plane');
  await fig.frame.locator('.pvc-examples button[data-example="bend"]').click();
  await fig.advance(300);
  expect(await fig.call('get')).toMatchObject({ mirror: 'none', part: 1 });

  await fig.call('set', { part: 6, mirror: 'convex', animate: false });
  await fig.advance(300);
  await fig.frame.locator('.pvc').first().press('ArrowRight');
  expect((await fig.call('get')).busX).toBe(18);

  // a capture carries the drawing: the rays' amber is in the picture, not only on the screen
  const png = await fig.call('capture', { width: 422, height: 195 });
  const amber = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] > 120 && d[i + 1] < 190 && d[i + 2] < 90) n++;
    return n;
  }, png);
  expect(amber).toBeGreaterThan(40);
  expect(log.errors).toEqual([]);
});

test('hill-road-mirror: the bus shows that it can be moved, and a finger on its handle moves it', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'hill-road-mirror');
  const handle = fig.frame.locator('.hrm-handle');
  expect((await fig.call('get')).handle).toBe(false); // nothing to drag before the vehicles reach the bend
  await fig.call('set', { part: 3, animate: false });
  await fig.advance(400);
  expect(await fig.call('get')).toMatchObject({ handle: true, dragged: false });
  await expect(handle).toHaveClass(/\bin\b/);
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'টেনে সরাও' })).toBeVisible();

  // a grab at the disc, along the road
  const stage = fig.frame.locator('.pvc-canvas').first();
  const at = await handle.boundingBox();
  const send = async (type, x, y) => {
    await stage.dispatchEvent(type, { bubbles: true, pointerType: 'touch', isPrimary: true, pointerId: 7, clientX: x, clientY: y });
    await fig.advance(40);
  };
  await send('pointerdown', at.x, at.y);
  for (let i = 1; i <= 8; i++) await send('pointermove', at.x + i * 7, at.y + i * 1.2);
  await send('pointerup', at.x + 56, at.y + 10);
  const st = await fig.call('get');
  expect(st.dragged).toBe(true);
  expect(st.busX).toBeGreaterThan(18);
  expect(st.thetaR).toBeCloseTo(st.thetaI, 6);
  await fig.advance(300);
  // it stays, calmer, and the word has done its work
  await expect(handle).toHaveClass(/calm/);
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'টেনে সরাও' })).toHaveCount(0);

  // the mirror's close-up and the test have no handle
  await fig.call('set', { part: 4, animate: false });
  await fig.advance(300);
  expect((await fig.call('get')).handle).toBe(false);
  await fig.call('practice');
  await fig.advance(1500);
  await expect(handle).toBeHidden();
  expect(log.errors).toEqual([]);
});

test('hill-road-mirror: every right answer scores, and the test gives back the learn view', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'hill-road-mirror');
  await fig.call('set', { part: 3, animate: false });
  await fig.advance(300);
  await fig.call('practice');
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ mode: 'quiz', locked: true });
  const seen = [];
  for (let i = 0; i < 5; i++) {
    await fig.advance(1200);
    const { question } = await fig.call('get');
    seen.push(question.kind);
    expect(question.right).toBeGreaterThanOrEqual(0);
    await fig.frame.locator(`.pvc-opt[data-q="${question.right}"]`).click();
    await fig.advance(300);
    expect(await fig.frame.locator('.pvc-q-feedback').getAttribute('data-tone')).toBe('ok');
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  expect(seen).toEqual(['right', 'tilt', 'reverse', 'which', 'formula']);
  await fig.advance(900);
  await expect(fig.frame.locator('.pvc-quiz')).toContainText(/৫/);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(900);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', part: 3, mirror: 'plane', busX: 17 });
  expect(log.errors).toEqual([]);
});
