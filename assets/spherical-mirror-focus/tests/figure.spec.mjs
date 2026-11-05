// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the book's story
// on one action, f = r/2 at every r, the bulb at F, leaving the test, and the test itself.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const ID = 'spherical-mirror-focus';
const settled = async (fig) => {
  for (let i = 0; i < 80; i++) {
    await fig.advance(300);
    if (!(await fig.call('get')).busy) return fig.advance(200);
  }
  throw new Error('the step never ended');
};

test(`${ID}: the whole story on one action`, async ({ page }) => {
  test.setTimeout(420_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const act = async () => {
    await fig.frame.locator('.pvc-act').first().click();
    await settled(fig);
    return fig.call('get');
  };
  let st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'sphere', r: 30, coat: 0, mounted: false });

  st = await act();
  expect(st).toMatchObject({ stage: 'cut', mounted: false });
  st = await act();
  expect(st).toMatchObject({ stage: 'coated', coat: 1, mounted: true, kind: 'concave', frame: 'bench' });
  st = await act();
  expect(st).toMatchObject({ stage: 'rays', frame: 'focus', focusAt: 15, f: 15 });
  expect(st.drawn).toMatchObject({ in: true, out: true });
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'ফোকাস বিন্দু F' })).toHaveCount(1);
  st = await act();
  expect(st).toMatchObject({ stage: 'measure', frame: 'measure' });
  expect(st.drawn.bars).toBe(true);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('১৫ cm');

  // every mirror: f is half of r, read from the rays themselves
  for (const [i, r] of [
    [0, 20],
    [2, 40],
    [3, 60],
    [1, 30],
  ]) {
    await fig.frame.locator(`.lab-r[data-r="${i}"]`).click();
    await fig.advance(1200);
    st = await fig.call('get');
    expect(st).toMatchObject({ r, f: r / 2, focusAt: r / 2 });
    for (const x of st.crossings) expect(Math.abs(x - r / 2)).toBeLessThan(0.65);
  }

  st = await act();
  expect(st).toMatchObject({ stage: 'wide', frame: 'wide' });
  expect(st.crossings[1]).toBeLessThan(st.crossings[0]); // the rim rays cross nearer the mirror
  expect(15 - st.crossings[1]).toBeGreaterThan(0.8);

  st = await act();
  expect(st).toMatchObject({ stage: 'convex', kind: 'convex', coat: 1, focusAt: -15 });
  st = await act();
  expect(st).toMatchObject({ stage: 'virtual', frame: 'virtual' });
  expect(st.drawn.ext).toBe(true);
  for (const x of st.crossings) expect(Math.abs(x + 15)).toBeLessThan(0.25);

  st = await act();
  expect(st).toMatchObject({ stage: 'torch', kind: 'concave', bulbX: 15, beam: 'parallel' });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('সমান্তরাল');
  // the spread of a parallel beam is nothing to the eye, and the action moves the bulb off F and back
  for (const x of st.spreads) expect(Math.abs(x)).toBeLessThan(1.1);
  st = await act();
  expect(st.beam).toBe('spread');
  for (const x of st.spreads) expect(x).toBeGreaterThan(5);
  st = await act();
  expect(st.beam).toBe('closing');
  for (const x of st.spreads) expect(x).toBeLessThan(-3);
  st = await act();
  expect(st).toMatchObject({ beam: 'parallel', bulbX: 15 });

  // the last tap starts again
  st = await act();
  expect(st).toMatchObject({ stage: 'sphere', coat: 0, mounted: false, r: 30 });
  expect(log.errors).toEqual([]);
});

test(`${ID}: the words jump, set works at once, keys move the part`, async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  await fig.frame.locator('[data-example="torch"]').click();
  await settled(fig);
  expect(await fig.call('get')).toMatchObject({ stage: 'torch', beam: 'parallel', mounted: true, coat: 1 });
  await fig.frame.locator('[data-example="convex"]').click();
  await settled(fig);
  expect(await fig.call('get')).toMatchObject({ stage: 'convex', kind: 'convex', beam: null });
  await fig.frame.locator('[data-example="sphere"]').click();
  await settled(fig);
  expect(await fig.call('get')).toMatchObject({ stage: 'sphere', kind: 'concave', coat: 0 });

  let st = await fig.call('set', { stage: 'virtual', r: 40, animate: false });
  expect(st).toMatchObject({ stage: 'virtual', r: 40, focusAt: -20, busy: false });
  await fig.frame.locator('.pvc').first().focus();
  await page.keyboard.press('ArrowRight');
  await fig.advance(1200);
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

test(`${ID}: a step is cut short without harm, and the bulb is dragged along the rail`, async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID, { params: { stage: 'coated', coach: '1' } });
  await fig.frame.locator('.pvc-act').first().click();
  await fig.advance(400);
  await fig.frame.locator('[data-example="sphere"]').click();
  await settled(fig);
  expect(await fig.call('get')).toMatchObject({ stage: 'sphere', coat: 0 });

  await fig.call('set', { stage: 'torch', animate: false });
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

test(`${ID}: every right answer scores, and a wrong one does not`, async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const play = async (wrongAt) => {
    for (let i = 0; i < 5; i++) {
      await fig.advance(1500);
      const { question } = await fig.call('get');
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
  };
  await fig.call('practice');
  await play(-1);
  await expect(fig.frame.locator('.pvc-q-result')).toContainText('৫টির মধ্যে ৫টি');
  await fig.frame.locator('[data-act="q-again"]').click();
  await play(2);
  await expect(fig.frame.locator('.pvc-q-result')).toContainText('৫টির মধ্যে ৪টি');
  expect(log.errors).toEqual([]);
});

test(`${ID}: the test leaves the learn state as it was`, async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  await fig.call('set', { stage: 'measure', r: 40, animate: false });
  await fig.call('practice');
  await fig.advance(1500);
  expect((await fig.call('get')).locked).toBe(true);
  for (let i = 0; i < 5; i++) {
    await expect(fig.frame.locator('.pvc-opt')).toHaveCount(4);
    await fig.frame.locator('.pvc-opt').first().click();
    await fig.advance(1600);
    await fig.frame.locator('[data-act="q-next"]').click();
    await fig.advance(1500);
  }
  await expect(fig.frame.locator('.pvc-q-result')).toBeVisible();
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(1200);
  expect(await fig.call('get')).toMatchObject({ locked: false, stage: 'measure', r: 40, kind: 'concave' });
  expect(log.errors).toEqual([]);
});
