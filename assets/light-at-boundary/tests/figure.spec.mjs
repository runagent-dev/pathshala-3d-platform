// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the book's
// three steps on one action, the words on the panel, the marks in the picture, leaving the test, and the test itself.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('light-at-boundary: three steps on one action, then all three', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-at-boundary');
  const act = () => fig.frame.locator('.pvc-act').first().click();
  const settled = async () => {
    for (let i = 0; i < 60; i++) {
      await fig.advance(300);
      if (!(await fig.call('get')).busy) return fig.advance(200);
    }
    throw new Error('the step never ended');
  };
  const outcome = fig.frame.locator('.pvc-outcome');
  let st = await fig.call('get');
  expect(st.show).toBe('none');
  expect(st.drawn).toEqual([]);
  await expect(outcome).toContainText('?');

  for (const [i, name] of ['reflection', 'refraction', 'absorption'].entries()) {
    await act();
    await settled();
    st = await fig.call('get');
    expect(st.show).toBe(name);
    expect(st.frame).toBe(name);
    expect(st.seen.length).toBe(i + 1);
    expect(st.drawn).toContain(name);
  }
  await expect(outcome).not.toContainText('?');
  await act();
  await settled();
  st = await fig.call('get');
  expect(st.show).toBe('all');
  expect(st.drawn.length).toBe(3);
  expect(st.refractedAngle).toBeCloseTo(30.71, 1);

  // the words choose one part, and what was not chosen stays seen
  await fig.frame.locator('[data-example="refraction"]').click();
  await settled();
  expect((await fig.call('get')).show).toBe('refraction');
  expect((await fig.call('get')).seen.length).toBe(3);

  // the last tap starts again
  await fig.frame.locator('[data-act="home"]').click();
  await fig.advance(1200);
  st = await fig.call('get');
  expect(st.show).toBe('none');
  expect(st.seen).toEqual([]);
  expect(log.errors).toEqual([]);
});

test('light-at-boundary: an interrupted step is not lost, and set works at once', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-at-boundary');
  await fig.call('set', { show: 'reflection' });
  await fig.advance(300);
  await fig.call('set', { show: 'absorption', animate: false });
  let st = await fig.call('get');
  expect(st.show).toBe('absorption');
  expect(st.busy).toBe(false);
  expect(st.drawn).toEqual(['absorption']);
  await fig.call('set', { show: 'all', angle: 35, animate: false });
  st = await fig.call('get');
  expect(st.angle).toBe(35);
  expect(st.refractedAngle).toBeCloseTo(22.48, 1);
  await fig.call('reset');
  await fig.advance(800);
  st = await fig.call('get');
  expect(st.show).toBe('none');
  expect(st.angle).toBe(50);
  expect(log.errors).toEqual([]);
});

test('light-at-boundary: every right answer scores, and a wrong one does not', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-at-boundary');
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

test('light-at-boundary: the first questions do not name the media, and a step cut short by the test is not kept', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-at-boundary');
  await fig.frame.locator('.pvc-act').first().click();
  await fig.advance(400);
  await fig.call('practice');
  await fig.advance(1500);
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'মাধ্যম' })).toHaveCount(0);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(1200);
  const st = await fig.call('get');
  expect(st.show).toBe('none');
  expect(st.seen).toEqual([]);
  expect(st.drawn).toEqual([]);
  expect(st.frame).toBe('start');
  await expect(fig.frame.locator('.pvc-act').first()).toContainText('প্রতিফলন দেখো');
  expect(log.errors).toEqual([]);
});

test('light-at-boundary: the test runs to the end and leaves the learn state as it was', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'light-at-boundary');
  await fig.call('set', { show: 'reflection', animate: false });
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
  const st = await fig.call('get');
  expect(st.locked).toBe(false);
  expect(st.show).toBe('reflection');
  expect(st.seen).toEqual(['reflection']);
  expect(st.angle).toBe(50);
  expect(log.errors).toEqual([]);
});
