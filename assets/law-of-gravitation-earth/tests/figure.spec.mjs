// The Earth's pull and weight through the bridge and the panel (book page 79, topic 3.7): a 1 kg weight on the
// Earth weighs about 9.8 N, a second one twice that (the same g), then the button starts again; the test has three
// questions. Runs with `npm run test:figures` (dev only, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('law-of-gravitation-earth: one weight, two weights, start again', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'law-of-gravitation-earth');
  const f = page.frames().find((x) => x.url().includes('/assets/law-of-gravitation-earth/'));

  let st = await fig.call('get');
  expect(st).toMatchObject({ placed: false, kg: 1, next: { act: 'place', step: 1 } });
  await expect(f.locator('[data-example]')).toHaveCount(0);

  // step 1: the weight on the ground: about 9.8 N
  st = await fig.call('set', { act: true, animate: false });
  expect(st).toMatchObject({ placed: true, kg: 1, last: 'place', next: { act: 'add', step: 2 } });
  expect(st.weight).toBeCloseTo(9.83, 2);
  expect(st.g).toBeCloseTo(9.83, 2);
  await expect(f.locator('.pvc-outcome')).toContainText('৯.৮');

  // step 2: a second weight: twice the weight, the same pull for each kg
  st = await fig.call('set', { act: true, animate: false });
  expect(st).toMatchObject({ kg: 2, last: 'add', next: { act: 'again', step: '' } });
  expect(st.weight).toBeCloseTo(2 * 9.83, 1);
  await expect(f.locator('.pvc-rule')).toContainText('প্রতি ১ kg-এ টান একই');

  // again: back to the bare Earth
  st = await fig.call('set', { act: true, animate: false });
  expect(st).toMatchObject({ placed: false, kg: 1, found: { place: false, add: false } });

  // steps jumps to a picture; the test has three questions and leaves the learn state as it was
  st = await fig.call('set', { steps: 1, animate: false });
  expect(st).toMatchObject({ placed: true, kg: 1 });
  await f.locator('[data-mode="quiz"]').click();
  await fig.advance(800);
  await expect(f.locator('.pvc-q-count')).toContainText('৩');
  await f.locator('[data-mode="explore"]').click();
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', placed: true, kg: 1 });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ placed: false, view: 'front' });
  expect(log.errors).toEqual([]);
});
