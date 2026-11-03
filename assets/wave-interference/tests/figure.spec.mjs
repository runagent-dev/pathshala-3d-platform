// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the
// one action walks the three cases (1st source, 2nd source, both) and then calms the water; cork ক bobs with 2a and
// খ is almost still only when both run; set, pause and reset; the five-question test.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const frameOf = (page) => page.frames().find((f) => f.url().includes('/assets/wave-interference/'));

test('wave-interference: one button walks 1st, 2nd and both, then calms the water', async ({ page }) => {
  // a smaller window: these long runs render many software frames and passed CI's 3-minute limit at 800×500; they only read state
  await page.setViewportSize({ width: 480, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'wave-interference');
  const frame = frameOf(page);
  expect(await fig.call('get')).toMatchObject({ example: 'calm', sources: [false, false], wavelength: 5, frequency: 5, next: 'one' });

  await frame.locator('.pvc-act').click();
  await fig.advance(8500); // the waves reach both balls (slowed 5×)
  let st = await fig.call('get');
  expect(st).toMatchObject({ example: 'one', sources: [true, false], settled: true, next: 'two' });
  expect(st.amplitudeA).toBeCloseTo(1, 1);
  expect(st.amplitudeB).toBeGreaterThan(0.8);

  await frame.locator('.pvc-act').click();
  await fig.advance(8500);
  st = await fig.call('get');
  expect(st).toMatchObject({ example: 'two', sources: [false, true], settled: true, next: 'both' });
  expect(st.amplitudeB).toBeGreaterThan(0.8);

  await frame.locator('.pvc-act').click();
  await fig.advance(8500);
  st = await fig.call('get');
  expect(st).toMatchObject({ example: 'both', sources: [true, true], settled: true, next: 'calm', found: ['one', 'two', 'both'] });
  expect(st.amplitudeA).toBeCloseTo(2, 1);
  expect(st.amplitudeB).toBeLessThan(0.15);

  await frame.locator('.pvc-act').click();
  await fig.advance(2000);
  expect(await fig.call('get')).toMatchObject({ example: 'calm', sources: [false, false] });
  expect(log.errors).toEqual([]);
});

test('wave-interference: set, pause, gap and reset', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'wave-interference');
  let st = await fig.call('set', { example: 'both', animate: false });
  // the action never offers a case that is already running (the poster's state): it calms the water next
  expect(st).toMatchObject({ example: 'both', sources: [true, true], settled: true, next: 'calm' });
  await expect(frameOf(page).locator('.pvc-act')).not.toContainText('১ম');
  expect(st.amplitudeA).toBeCloseTo(2, 1);
  st = await fig.call('set', { gap: 20 });
  expect(st).toMatchObject({ gap: 20, example: 'both', settled: true });
  expect(st.amplitudeB).toBeLessThan(0.15);
  expect(await fig.call('set', { paused: true })).toMatchObject({ paused: true });
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ example: 'calm', paused: false, found: [], mode: 'explore', gap: 20 });
  expect(log.errors).toEqual([]);
});

test('wave-interference: a second tap within a moment does not skip a case', async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'wave-interference');
  const frame = frameOf(page);
  await frame.locator('.pvc-act').click();
  await frame.locator('.pvc-act').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ example: 'one', found: ['one'] });
  expect(log.errors).toEqual([]);
});

test('wave-interference: the test runs five questions and leaves the learn state as it was', async ({ page }) => {
  // a smaller window: these long runs render many software frames and passed CI's 3-minute limit at 800×500; they only read state
  await page.setViewportSize({ width: 480, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'wave-interference');
  const frame = frameOf(page);
  await fig.call('set', { example: 'one', animate: false });
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(1500);
    await frame.locator('.pvc-opt[data-q]').first().click();
    await fig.advance(600);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(800);
  await expect(frame.locator('.pvc-q-result')).toBeVisible();
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  expect(await fig.call('get')).toMatchObject({ example: 'one', mode: 'explore' });
  expect(log.errors).toEqual([]);
});
