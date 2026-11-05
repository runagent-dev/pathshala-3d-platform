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
