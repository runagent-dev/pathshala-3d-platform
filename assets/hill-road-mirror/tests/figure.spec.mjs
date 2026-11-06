// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the story
// built one part at a time, the angles read back from the traced path, the two mirrors, the drag, and a test answered
// right from start to finish (the kit's quiz compares numbers: a slip there would mark every answer wrong).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

// few pixels and a coarse virtual frame keep this quick in software rendering: the clock still runs the real seconds
const FRAME_MS = 50;

// slow on purpose: each step is still playing at `playing` ms, ends by `done` ms, holds, and waits for the next tap
const STEPS = [
  { part: 1, playing: 4000, done: 6400, framing: 'wide', word: 'পৌঁছায় না', windows: 1 },
  { part: 2, playing: 4500, done: 6800, framing: 'close', word: 'কোণে', windows: 0 },
  { part: 3, playing: 5500, done: 7800, framing: 'wide', word: 'দেখা যাচ্ছে', windows: 1 },
  { part: 4, playing: 3500, done: 5500, framing: 'close', word: '৪৫', windows: 0 },
  { part: 5, playing: 3500, done: 5800, framing: 'wide', word: 'গাড়িটি দেখছেন', windows: 1 },
  { part: 6, playing: 2500, done: 4000, framing: 'wide', word: 'চওড়া', windows: 2 },
];
/** What every step shows when it has played: its framing, its words, its mirror windows, and the action ready again. */
async function expectSettled(fig, { part, framing, word, windows }) {
  expect(await fig.call('get')).toMatchObject({ part, framing, busy: false });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText(word);
  await expect(fig.frame.locator('.pvc-act').first()).toBeEnabled();
  await expect(fig.frame.locator('.hrm-pip:not([hidden])')).toHaveCount(windows);
  // each step ends and waits for the student: nothing moves on by itself
  await fig.advance(1000, FRAME_MS);
  expect(await fig.call('get')).toMatchObject({ part, busy: false });
}

// the first two steps played at their real pace (the pacing itself); the later ones are reached directly in the next test,
// so that neither test runs for minutes on CI's software rendering
test('hill-road-mirror: the story, step by step, at its real pace', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 600, height: 300 }); // narrower than 600 px the panel stacks and the 3D view has no height
  const log = await preparePage(page);
  const fig = await openFigure(page, 'hill-road-mirror');
  const act = () => fig.frame.locator('.pvc-act').first().click();
  expect(await fig.call('get')).toMatchObject({ part: 0, mirror: 'none', framing: 'far', pip: false });

  for (const step of STEPS.slice(0, 2)) {
    const { part, playing, done } = step;
    await act();
    await fig.advance(200, FRAME_MS);
    await expect(fig.frame.locator('.pvc-act').first()).toBeDisabled();
    await expect(fig.frame.locator('[data-act="replay"]').first()).toBeDisabled();
    // no step can be rushed: a second tap now changes nothing
    await fig.advance(playing - 200, FRAME_MS);
    expect(await fig.call('get')).toMatchObject({ part, busy: true });
    await fig.advance(done - playing, FRAME_MS);
    await expectSettled(fig, step);
  }
  expect(log.errors).toEqual([]);
});

test('hill-road-mirror: the later steps, each as it stands when it has played', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'hill-road-mirror');
  for (const step of STEPS.slice(2)) {
    await fig.call('set', { part: step.part, animate: false });
    await fig.advance(300, FRAME_MS);
    await expectSettled(fig, step);
  }
  expect(log.errors).toEqual([]);
});

test('hill-road-mirror: the last step: both mirrors, the offer of the test, and seeing it again', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'hill-road-mirror');
  await fig.call('set', { part: 5, animate: false });
  await fig.advance(300, FRAME_MS);
  await expect(fig.frame.locator('.hrm-offer')).toBeHidden();
  await fig.frame.locator('.pvc-act').first().click();
  await fig.advance(4200, FRAME_MS);
  const st = await fig.call('get');
  expect(st).toMatchObject({ part: 6, mirror: 'convex', who: 'car', blocked: true, busy: false });
  expect(st.fieldAngle).toBeGreaterThan(20);
  expect(st.magnification).toBeLessThan(0.25);
  // side by side: the same bus in both mirrors, and the test is offered now, not before
  await expect(fig.frame.locator('.hrm-pip:not([hidden])')).toHaveCount(2);
  await expect(fig.frame.locator('.hrm-offer')).toBeVisible();

  // the step just finished, once more: it plays from the picture before it, and nothing else moves on
  await fig.frame.locator('[data-act="replay"]').first().click();
  await fig.advance(300, FRAME_MS);
  expect(await fig.call('get')).toMatchObject({ part: 6, busy: true });
  await expect(fig.frame.locator('.hrm-offer')).toBeHidden();
  await fig.advance(4200, FRAME_MS);
  expect(await fig.call('get')).toMatchObject({ part: 6, mirror: 'convex', busy: false });

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
  expect((await fig.call('get')).busX).toBe(14.5);

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
  const handle = fig.frame.locator('.pvc-dh');
  expect((await fig.call('get')).handle).toBe(false); // nothing to drag before the vehicles reach the bend
  await fig.call('set', { part: 3, animate: false });
  await fig.advance(400);
  expect(await fig.call('get')).toMatchObject({ handle: true, dragged: false });
  await expect(handle).toBeVisible();
  await expect(handle.locator('.pvc-dh-word')).toHaveText('টেনে সরাও');

  // a grab at the disc, along the road
  const stage = fig.frame.locator('.pvc-canvas').first();
  const box = await handle.boundingBox();
  const at = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const send = async (type, x, y) => {
    await stage.dispatchEvent(type, { bubbles: true, pointerType: 'touch', isPrimary: true, pointerId: 7, clientX: x, clientY: y });
    await fig.advance(40);
  };
  await send('pointerdown', at.x, at.y);
  for (let i = 1; i <= 8; i++) await send('pointermove', at.x + i * 7, at.y + i * 1.2);
  await send('pointerup', at.x + 56, at.y + 10);
  const st = await fig.call('get');
  expect(st.dragged).toBe(true);
  expect(st.busX).toBeGreaterThan(14.5);
  expect(st.thetaR).toBeCloseTo(st.thetaI, 6);
  await fig.advance(300);
  // it stays, calmer, and the word has done its work
  await expect(handle).toHaveClass(/used/);
  await expect(handle.locator('.pvc-dh-word')).toHaveCount(0);

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
  expect(await fig.call('get')).toMatchObject({ mode: 'quiz', locked: true });
  const seen = [];
  for (let i = 0; i < 5; i++) {
    await fig.advance(2100);
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
  await fig.advance(2100);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', part: 3, mirror: 'plane', busX: 13.5 });
  expect(log.errors).toEqual([]);
});

test('hill-road-mirror: a step cut short keeps its picture, and taps wait while a step plays', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'hill-road-mirror');
  await fig.advance(300);
  await fig.frame.locator('.pvc-act').first().click();
  await fig.advance(600);
  // a word of the row does nothing while the vehicles are on their way
  await fig.frame.locator('.pvc-examples button[data-example="convex"]').click();
  await fig.advance(100);
  expect(await fig.call('get')).toMatchObject({ part: 1, mirror: 'none', busy: true });
  // into the test mid-way, and back: the vehicles are at the bend, nothing is left half-way
  await fig.frame.locator('[data-mode="quiz"]').click();
  await fig.advance(2100);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(2100);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', part: 1, busX: 13.5, carZ: 13, busy: false });
  expect(log.errors).toEqual([]);
});

test('hill-road-mirror: a lower render resolution leaves the view where the student turned it', async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await browser.newPage({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 2 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'hill-road-mirror');
  await fig.call('set', { part: 3, animate: false });
  await fig.advance(400);
  const canvas = fig.frame.locator('.pvc-canvas canvas').first();
  const ratio = () => canvas.evaluate((c) => c.width / c.clientWidth);
  expect(await ratio()).toBe(2);
  const box = await canvas.boundingBox();
  const x = box.x + 30;
  const y = box.y + box.height - 30;
  await page.mouse.move(x, y);
  await page.mouse.down();
  // slow frames while the view turns: the stage lowers its resolution, and tells the figure through onResize
  for (let i = 1; i <= 60 && (await ratio()) === 2; i++) {
    await page.mouse.move(x + (i % 20) * 6, y);
    await fig.advance(40, 40);
  }
  await page.mouse.up();
  expect(await ratio()).toBeLessThan(2);
  await fig.advance(600);
  expect(await fig.call('get')).toMatchObject({ view: '3d', orbited: true });
  expect(log.errors).toEqual([]);
  await page.close();
});

test('hill-road-mirror: the whole way round, with the guided view a tap away', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'hill-road-mirror');
  await fig.call('set', { part: 3, animate: false });
  await fig.advance(400);
  const cue = fig.frame.locator('.pvc-rc');
  await expect(cue).toContainText('ঘুরিয়ে দেখো');
  const stage = fig.frame.locator('.pvc-canvas').first();
  const send = async (type, x, y) => {
    await stage.dispatchEvent(type, {
      bubbles: true,
      pointerType: 'mouse',
      button: 0,
      buttons: 1,
      isPrimary: true,
      pointerId: 1,
      clientX: x,
      clientY: y,
    });
    await fig.advance(40);
  };
  // a tap is not a turn
  await send('pointerdown', 120, 60);
  await send('pointermove', 123, 61);
  await send('pointerup', 123, 61);
  expect(await fig.call('get')).toMatchObject({ view: 'front', orbited: false });

  // every side of the bend: the camera stays above the ground
  for (const az of [100, 190, 280, -30]) {
    const st = await fig.call('set', { orbit: { az, el: 3 }, animate: false });
    await fig.advance(200);
    expect(st.view).toBe('3d');
    expect((await fig.call('get')).aboveGround).toBeGreaterThan(1.5);
  }
  // the words have gone, the pill stays: never the arrow alone
  await expect(cue).toHaveClass(/used/);
  await expect(cue.locator('.pvc-rc-word')).toBeHidden();
  await expect(cue.locator('.pvc-rc-deg')).toHaveText('৩৬০°');

  // the quiet button goes back to the guided framing
  const front = fig.frame.locator('[data-view="front"]');
  await expect(front).toBeVisible();
  await front.click();
  await fig.advance(2000);
  expect(await fig.call('get')).toMatchObject({ view: 'front', framing: 'wide' });
  await expect(front).toBeHidden();
  expect(log.errors).toEqual([]);
});
