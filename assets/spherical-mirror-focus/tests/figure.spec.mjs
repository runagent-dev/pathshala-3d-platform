// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the book's story
// on one action, f = r/2 at every r, the bulb at F, the pace (no queued taps, replay, the test offered at the end), the view all the
// way round, leaving the test, and the test itself.
//
// The steps are slow on purpose and every frame is drawn in software, so a test plays only what it is about: each opens on a small
// page at the stage just before that (common.md, "CI trap"). The story is cut into pieces that overlap: each starts where the last ended.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const ID = 'spherical-mirror-focus';
const LIMIT = 200_000; // well inside CI's 300 s, which runs many times slower than this machine
// The smallest page with a real view: the side layout starts at 600 wide. At 480 × 300 the panel fills the page and the 3D view has no
// height at all, so nothing is drawn and no finger can reach it.
const SMALL = [600, 300];
const PANEL = [640, 400]; // where a test taps the words, the choice of r or the answers in the panel

test.describe.configure({ timeout: LIMIT });

async function open(page, { size = SMALL, params = {} } = {}) {
  await page.setViewportSize({ width: size[0], height: size[1] });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID, { params });
  return { fig, log };
}
const settled = async (fig) => {
  for (let i = 0; i < 120; i++) {
    await fig.advance(400);
    if (!(await fig.call('get')).busy) return fig.advance(200);
  }
  throw new Error('the step never ended');
};
const action = (fig) => fig.frame.locator('.pvc-act').first();
const acting = (fig) => async () => {
  await action(fig).click();
  await settled(fig);
  return fig.call('get');
};

test(`${ID}: the story 1: the piece is cut out, then coated, and goes to the bench`, async ({ page }) => {
  const { fig, log } = await open(page);
  const act = acting(fig);
  expect(await fig.call('get')).toMatchObject({ stage: 'sphere', r: 30, coat: 0, mounted: false });
  expect(await act()).toMatchObject({ stage: 'cut', mounted: false });
  expect(await act()).toMatchObject({ stage: 'coated', coat: 1, mounted: true, kind: 'concave', frame: 'bench' });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the story 2: parallel light meets at F, and f is measured`, async ({ page }) => {
  const { fig, log } = await open(page, { params: { stage: 'coated' } });
  const act = acting(fig);
  let st = await act();
  expect(st).toMatchObject({ stage: 'rays', frame: 'focus', focusAt: 15, f: 15 });
  expect(st.drawn).toMatchObject({ in: true, out: true });
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'ফোকাস বিন্দু F' })).toHaveCount(1);
  st = await act();
  expect(st).toMatchObject({ stage: 'measure', frame: 'measure' });
  expect(st.drawn.bars).toBe(true);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('১৫ cm');
  expect(log.errors).toEqual([]);
});

test(`${ID}: every mirror: f is half of r, read from the rays themselves`, async ({ page }) => {
  const { fig, log } = await open(page, { size: PANEL, params: { stage: 'measure' } });
  for (const [i, r] of [
    [0, 20],
    [2, 40],
    [3, 60],
    [1, 30],
  ]) {
    await fig.frame.locator(`.lab-r[data-r="${i}"]`).click();
    await settled(fig);
    const st = await fig.call('get');
    expect(st).toMatchObject({ r, f: r / 2, focusAt: r / 2 });
    for (const x of st.crossings) expect(Math.abs(x - r / 2)).toBeLessThan(0.65);
  }
  expect(log.errors).toEqual([]);
});

test(`${ID}: the story 3: the wide bundle shows f = r/2 is only nearly true`, async ({ page }) => {
  const { fig, log } = await open(page, { params: { stage: 'measure' } });
  const st = await acting(fig)();
  expect(st).toMatchObject({ stage: 'wide', frame: 'wide' });
  expect(st.crossings[1]).toBeLessThan(st.crossings[0]); // the rim rays cross nearer the mirror
  expect(15 - st.crossings[1]).toBeGreaterThan(0.8);
  expect(log.errors).toEqual([]);
});

test(`${ID}: the story 4: the mirror turns over and is coated, then the light spreads`, async ({ page }) => {
  const { fig, log } = await open(page, { params: { stage: 'wide' } });
  const act = acting(fig);
  let st = await act();
  expect(st).toMatchObject({ stage: 'turned', kind: 'convex', coat: 1, focusAt: -15, frame: 'turn' });
  expect(st.drawn.in).toBe(false);
  st = await act();
  expect(st).toMatchObject({ stage: 'convex', kind: 'convex', frame: 'convex' });
  expect(st.drawn).toMatchObject({ in: true, out: true });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the story 5: the rays extended behind, then a bulb at F`, async ({ page }) => {
  const { fig, log } = await open(page, { params: { stage: 'convex' } });
  const act = acting(fig);
  let st = await act();
  expect(st).toMatchObject({ stage: 'virtual', frame: 'virtual' });
  expect(st.drawn.ext).toBe(true);
  for (const x of st.crossings) expect(Math.abs(x + 15)).toBeLessThan(0.25);
  st = await act();
  expect(st).toMatchObject({ stage: 'torch', kind: 'concave', bulbX: 15, beam: 'parallel' });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('সমান্তরাল');
  expect(log.errors).toEqual([]);
});

test(`${ID}: the story 6: the action moves the bulb off F and back, and the end offers the test`, async ({ page }) => {
  const { fig, log } = await open(page, { params: { stage: 'torch' } });
  const act = acting(fig);
  // the spread of a parallel beam is nothing to the eye
  let st = await fig.call('get');
  for (const x of st.spreads) expect(Math.abs(x)).toBeLessThan(1.1);
  st = await act();
  expect(st.beam).toBe('spread');
  for (const x of st.spreads) expect(x).toBeGreaterThan(5);
  st = await act();
  expect(st.beam).toBe('closing');
  for (const x of st.spreads) expect(x).toBeLessThan(-3);
  st = await act();
  expect(st).toMatchObject({ beam: 'parallel', bulbX: 15 });

  // the test is offered; it is not forced
  await expect(action(fig)).toContainText('তাহলে পরীক্ষা দাও');
  expect((await fig.call('get')).mode).toBe('explore');
  await action(fig).click();
  await fig.advance(300);
  expect((await fig.call('get')).mode).toBe('quiz');
  expect(log.errors).toEqual([]);
});

test(`${ID}: a word walks the whole way to its step`, async ({ page }) => {
  const { fig, log } = await open(page, { size: PANEL });
  await fig.frame.locator('[data-example="torch"]').click();
  await settled(fig);
  expect(await fig.call('get')).toMatchObject({ stage: 'torch', beam: 'parallel', mounted: true, coat: 1 });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the words go back as well as on`, async ({ page }) => {
  const { fig, log } = await open(page, { size: PANEL, params: { stage: 'torch' } });
  await fig.frame.locator('[data-example="convex"]').click();
  await settled(fig);
  expect(await fig.call('get')).toMatchObject({ stage: 'turned', kind: 'convex', beam: null, coat: 1 });
  await fig.frame.locator('[data-example="sphere"]').click();
  await settled(fig);
  expect(await fig.call('get')).toMatchObject({ stage: 'sphere', kind: 'concave', coat: 0 });
  expect(log.errors).toEqual([]);
});

test(`${ID}: set works at once, and the keys move the part`, async ({ page }) => {
  const { fig, log } = await open(page);
  let st = await fig.call('set', { stage: 'virtual', r: 40, animate: false });
  expect(st).toMatchObject({ stage: 'virtual', r: 40, focusAt: -20, busy: false });
  await fig.frame.locator('.pvc').first().focus();
  await page.keyboard.press('ArrowRight');
  await settled(fig);
  expect((await fig.call('get')).r).toBe(60);
  st = await fig.call('set', { stage: 'torch', animate: false });
  await fig.frame.locator('.pvc').first().focus();
  await page.keyboard.press('ArrowLeft');
  await fig.advance(100);
  expect((await fig.call('get')).bulbX).toBe(st.bulbX - 1);
  await fig.call('set', { bulb: 12 });
  expect((await fig.call('get')).beam).toBe('spread');
  await fig.call('reset');
  await fig.advance(600);
  expect(await fig.call('get')).toMatchObject({ stage: 'sphere', r: 30 });
  expect(log.errors).toEqual([]);
});

test(`${ID}: taps wait for a step to end, and a finished step can be seen again`, async ({ page }) => {
  const { fig, log } = await open(page, { size: PANEL, params: { stage: 'rays', coach: '1' } });
  await action(fig).click();
  await fig.advance(400);
  // nothing jumps ahead while it plays: the words and the big button do nothing, and the button says to watch
  await fig.frame.locator('[data-example="sphere"]').click();
  await expect(action(fig)).toBeDisabled();
  await expect(fig.frame.locator('[data-act="replay"]')).toBeDisabled();
  await fig.advance(1000);
  expect(await fig.call('get')).toMatchObject({ stage: 'measure', busy: true });
  await settled(fig);
  expect(await fig.call('get')).toMatchObject({ stage: 'measure', busy: false });
  // it never moves on by itself
  await fig.advance(4000);
  expect((await fig.call('get')).stage).toBe('measure');
  // a finished step plays again, from where it began
  await fig.frame.locator('[data-act="replay"]').click();
  await fig.advance(400);
  const st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'measure', busy: true });
  expect(st.drawn.bars).toBe(false);
  await settled(fig);
  expect((await fig.call('get')).drawn.bars).toBe(true);
  // the first step has nothing to play
  await fig.call('set', { stage: 'sphere', animate: false });
  await fig.advance(100);
  await expect(fig.frame.locator('[data-act="replay"]')).toBeHidden();
  expect(log.errors).toEqual([]);
});

test(`${ID}: the bulb is dragged along the rail, and a tap on it is the action`, async ({ page }) => {
  const { fig, log } = await open(page, { params: { stage: 'torch', coach: '1' } });
  await fig.advance(600);
  // the numbered ring sits on the bulb: a finger there moves it along the rail
  const ring = await fig.frame.locator('.pvc-act-ringbox').first().boundingBox();
  const cx = ring.x + ring.width / 2;
  const cy = ring.y + ring.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(cx - i * 8, cy - i * 3);
    await fig.advance(40);
  }
  await page.mouse.up();
  await fig.advance(200);
  let st = await fig.call('get');
  expect(st.bulbX).toBeLessThan(13);
  expect(st.beam).toBe('spread');
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('ছড়িয়ে');
  // a short tap on the bulb is the action, not a drag
  const again = await fig.frame.locator('.pvc-act-ringbox').first().boundingBox();
  await page.mouse.click(again.x + again.width / 2, again.y + again.height / 2);
  await settled(fig);
  st = await fig.call('get');
  expect(st.beam).not.toBe('parallel');
  expect(log.errors).toEqual([]);
});

test(`${ID}: the rotate cue stays, and a tap is not a turn`, async ({ page }) => {
  const { fig, log } = await open(page, { params: { coach: '1' } });
  const cue = fig.frame.locator('.pvc-rc');
  await expect(fig.frame.locator('.pvc-dh')).toBeHidden(); // no handle where nothing can be dragged
  await expect(cue).toContainText('৩৬০°');
  await expect(cue).toContainText('ঘুরিয়ে দেখো');
  const free = await fig.frame.locator('.pvc-canvas').boundingBox();
  const at = { x: free.x + 30, y: free.y + free.height - 30 };
  // a tap is not a turn, however slightly the finger moves
  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  await page.mouse.move(at.x + 4, at.y + 2);
  await page.mouse.up();
  await fig.advance(300);
  let st = await fig.call('get');
  expect(st).toMatchObject({ view: 'front', orbited: false });
  const az0 = st.az;
  // a drag is
  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(at.x + i * 18, at.y);
    await fig.advance(40);
  }
  await page.mouse.up();
  await fig.advance(800);
  st = await fig.call('get');
  expect(st).toMatchObject({ view: '3d', orbited: true });
  expect(Math.abs(st.az - az0)).toBeGreaterThan(20);
  await expect(fig.frame.locator('.pvc-rc-word')).toBeHidden();
  await expect(cue).toBeVisible(); // the pill stays
  await expect(cue).toContainText('৩৬০°');
  expect(log.errors).toEqual([]);
});

test(`${ID}: the view goes all the way round, and comes back`, async ({ page }) => {
  const { fig, log } = await open(page, { params: { stage: 'measure' } });
  // behind the bench, then back to the step's own view
  let st = await fig.call('set', { az: 200 });
  await fig.advance(300);
  st = await fig.call('get');
  expect(Math.abs(st.az)).toBeGreaterThan(150);
  // the camera stays over the table
  await fig.call('set', { az: 200, el: -30 });
  await fig.advance(300);
  expect((await fig.call('get')).polar).toBeLessThanOrEqual(88.01);
  const front = fig.frame.locator('[data-view="front"]');
  await expect(front).toBeVisible();
  await expect(front).toHaveAttribute('aria-label', 'সামনে');
  await expect(front).toContainText('সামনে');
  await front.click();
  await fig.advance(2400);
  st = await fig.call('get');
  expect(st.view).toBe('front');
  expect(st.az).toBeCloseTo(33, 0);
  await expect(front).toBeHidden();

  // a step asked for at once brings the camera back: a turned view would be left looking at nothing
  await fig.call('set', { az: 200 });
  await fig.call('set', { stage: 'measure', animate: false });
  await fig.advance(300);
  st = await fig.call('get');
  expect(st.view).toBe('front');
  expect(st.az).toBeCloseTo(33, 0);
  expect(log.errors).toEqual([]);
});

test(`${ID}: the handle shows that the bulb moves`, async ({ page }) => {
  const { fig, log } = await open(page, { params: { stage: 'torch', coach: '1' } });
  const handle = fig.frame.locator('.pvc-dh');
  await fig.advance(600);
  // the word until the first drag, then it stays, smaller; dragged, the bulb goes
  await expect(handle).toBeVisible();
  await expect(handle).toContainText('টেনে সরাও');
  await expect(handle).toHaveClass(/pulse/);
  const box = await handle.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(cx + i * 8, cy + i * 2);
    await fig.advance(40);
  }
  await page.mouse.up();
  await fig.advance(200);
  const st = await fig.call('get');
  expect(st.bulbX).toBeGreaterThan(16);
  expect(st.beam).toBe('closing');
  await expect(handle).toHaveClass(/used/);
  await expect(handle).not.toHaveClass(/pulse/);
  await expect(fig.frame.locator('.pvc-dh-word')).toBeHidden();
  await expect(handle).toBeVisible();
  // it hides during the test
  await fig.call('practice');
  await fig.advance(600);
  await expect(handle).toBeHidden();
  expect(log.errors).toEqual([]);
});

test(`${ID}: the kit lowering the resolution mid-orbit does not take the view back`, async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'devicePixelRatio', { get: () => 2 }));
  const { fig, log } = await open(page);
  let st = await fig.call('get');
  expect(st.pixelRatio).toBe(2);
  const az0 = st.az;
  const box = await fig.frame.locator('.pvc-canvas').boundingBox();
  const x0 = box.x + 20;
  const y = box.y + box.height - 30;
  // a long, steady drag: the test clock's 50 ms frames are slow frames, so the kit steps the pixel ratio down during it
  await page.mouse.move(x0, y);
  await page.mouse.down();
  for (let i = 1; i <= 45; i++) {
    await page.mouse.move(x0 + i * 2, y);
    await fig.advance(50);
  }
  st = await fig.call('get');
  expect(st.pixelRatio).toBeLessThan(2); // the low-resolution resize really happened, at the same CSS size
  expect(st).toMatchObject({ view: '3d', orbited: true });
  const turned = st.az;
  expect(Math.abs(turned - az0)).toBeGreaterThan(60);
  // and the drag goes on from where it was
  await page.mouse.move(x0 + 120, y);
  await fig.advance(100);
  await page.mouse.up();
  await fig.advance(800);
  st = await fig.call('get');
  expect(st.view).toBe('3d');
  expect(Math.abs(st.az - az0)).toBeGreaterThanOrEqual(Math.abs(turned - az0));
  // a page that really changes size frames the step again
  await page.setViewportSize({ width: 640, height: 400 });
  await fig.advance(600);
  st = await fig.call('get');
  expect(st.view).toBe('front');
  expect(st.az).toBeCloseTo(34, 0);
  expect(log.errors).toEqual([]);
});

/** The test's five questions, each as soon as it is ready. wrongAt: the question answered wrongly (−1: none). */
async function playTest(fig, wrongAt) {
  for (let i = 0; i < 5; i++) {
    let question = null;
    for (let wait = 0; wait < 20 && question?.right == null; wait++) {
      await fig.advance(300);
      question = (await fig.call('get')).question;
    }
    const right = fig.frame.locator(`.pvc-opt[data-q="${question.right}"]`);
    if (i === wrongAt) {
      const other = fig.frame.locator(`.pvc-opt[data-q="${(question.right + 1) % 4}"]`);
      await other.click();
      await expect(other).toHaveClass(/wrong/);
      await expect(fig.frame.locator('.pvc-q-feedback')).toContainText('হয়নি');
    } else {
      await right.click();
      await expect(fig.frame.locator('.pvc-q-feedback')).toContainText('ঠিক');
    }
    await expect(right).toHaveClass(/right/); // the right choice is marked either way
    await fig.advance(1200);
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(800);
}

test(`${ID}: every right answer scores`, async ({ page }) => {
  const { fig, log } = await open(page, { size: PANEL });
  await fig.call('practice');
  await playTest(fig, -1);
  await expect(fig.frame.locator('.pvc-q-result')).toContainText('৫টির মধ্যে ৫টি');
  expect(log.errors).toEqual([]);
});

test(`${ID}: a wrong answer does not score`, async ({ page }) => {
  const { fig, log } = await open(page, { size: PANEL });
  await fig.call('practice');
  await playTest(fig, 2);
  await expect(fig.frame.locator('.pvc-q-result')).toContainText('৫টির মধ্যে ৪টি');
  expect(log.errors).toEqual([]);
});

test(`${ID}: the test leaves the learn state as it was`, async ({ page }) => {
  const { fig, log } = await open(page, { size: PANEL });
  await fig.call('set', { stage: 'measure', r: 40, animate: false });
  await fig.call('practice');
  await fig.advance(2400);
  expect((await fig.call('get')).locked).toBe(true);
  await playTest(fig, 0);
  await expect(fig.frame.locator('.pvc-q-result')).toBeVisible();
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(2400);
  expect(await fig.call('get')).toMatchObject({ locked: false, stage: 'measure', r: 40, kind: 'concave' });
  expect(log.errors).toEqual([]);
});
