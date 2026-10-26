// Law of gravitation through the bridge (book pages 78–79, topic 3.7): the student's five steps with the big button
// (the distance doubled: a quarter of the force; the left mass doubled: twice; the right mass too: four times; a 1 kg
// weight on the Earth: its weight GMm/R² ≈ 9.8 N; a second one: twice the weight, the same g), the example words, a
// tap on the ringed sphere doing the same as the button, the keys, the test, and the reset. Runs with
// `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const G = 6.67e-11;
const F = (m1, m2, r) => (G * m1 * m2) / (r * r);

test('law-of-gravitation: double the distance, a quarter; double a mass, twice; the weight on the Earth', async ({ page }) => {
  test.setTimeout(240000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'law-of-gravitation');

  // two 1,000 kg spheres 1 m apart: 6.67 × 10⁻⁵ N; the button offers to double the distance (step 1)
  let st = await fig.call('get');
  expect(st).toMatchObject({ example: 'dist', m1: 1000, m2: 1000, r: 1, before: null, mode: 'explore' });
  expect(st.force).toBeCloseTo(6.67e-5, 12);
  expect(st.next).toEqual({ example: 'dist', act: 'r2', step: 1 });

  // step 1: the distance doubled, the force a quarter of what it was (the faint arrows keep the old one)
  st = await fig.call('set', { act: true });
  expect(st).toMatchObject({ example: 'dist', r: 2, last: 'r2', busy: false });
  expect(st.force / st.before).toBeCloseTo(0.25, 6);
  expect(st.found.r2).toBe(true);
  expect(st.next).toEqual({ example: 'mass', act: 'm1', step: 2 });

  // step 2 goes on to the mass example from the same picture: the left mass doubled, the force twice
  st = await fig.call('set', { act: true });
  expect(st).toMatchObject({ example: 'mass', m1: 2000, m2: 1000, r: 2, last: 'm1' });
  expect(st.force / st.before).toBeCloseTo(2, 6);
  expect(st.force).toBeCloseTo(F(2000, 1000, 2), 14);

  // step 3: the right mass too: four times the force at 2 m, as much as at the start
  st = await fig.call('set', { act: true });
  expect(st).toMatchObject({ example: 'mass', m1: 2000, m2: 2000, last: 'm2' });
  expect(st.force / st.before).toBeCloseTo(2, 6);
  expect(st.force).toBeCloseTo(F(1000, 1000, 1), 14);
  expect(st.next).toEqual({ example: 'earth', act: 'place', step: 4 });

  // step 4: the Earth, a 1 kg weight on the ground: its weight about 9.8 N
  st = await fig.call('set', { act: true });
  expect(st).toMatchObject({ example: 'earth', scene: 'earth', last: 'place', earth: { placed: true, kg: 1 } });
  expect(st.earth.weight).toBeCloseTo(9.83, 2);
  expect(st.earth.g).toBeCloseTo(9.83, 2);

  // step 5: a second weight: twice the weight, the same g; then the button starts again (no number)
  st = await fig.call('set', { act: true });
  expect(st).toMatchObject({ last: 'add', earth: { placed: true, kg: 2 } });
  expect(st.earth.weight).toBeCloseTo(2 * 9.83, 1);
  expect(Object.values(st.found).every(Boolean)).toBe(true);
  expect(st.next).toEqual({ example: 'dist', act: 'again', step: '' });
  st = await fig.call('set', { act: true });
  expect(st).toMatchObject({ example: 'dist', scene: 'spheres', r: 1, m1: 1000, m2: 1000, before: null });

  // the example words: the mass example starts with both 1,000 kg 2 m apart
  st = await fig.call('set', { example: 'mass' });
  expect(st).toMatchObject({ example: 'mass', m1: 1000, m2: 1000, r: 2, before: null, last: null });

  // a jump to a later state (for the book's pictures)
  st = await fig.call('set', { steps: 1, animate: false });
  expect(st).toMatchObject({ example: 'dist', r: 2, last: 'r2' });
  expect(st.before).toBeCloseTo(F(1000, 1000, 1), 14);

  // reset: back to the start, nothing found
  await fig.call('reset');
  st = await fig.call('get');
  expect(st).toMatchObject({ example: 'dist', r: 1, m1: 1000, m2: 1000, view: 'front' });
  expect(Object.values(st.found).some(Boolean)).toBe(false);
  expect(log.errors).toEqual([]);
});

test('law-of-gravitation: the panel, a tap on the ringed sphere, the keys and the test', async ({ page }) => {
  test.setTimeout(300000);
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'law-of-gravitation');
  const f = fig.frame;

  // the big button shows step ১ and the words; the result line has the force in নিউটন with Bangla digits
  await expect(f.locator('.pvc-act')).toContainText('১');
  await expect(f.locator('.pvc-act')).toContainText('দূরত্ব দ্বিগুণ করো');
  await expect(f.locator('.pvc-outcome')).toContainText('৬.৬৭');
  await expect(f.locator('.pvc-outcome')).toContainText('নিউটন');

  // the panel's button does the change; the result says how it compares with before
  await f.locator('.pvc-act').click();
  await fig.advance(2500);
  let st = await fig.call('get');
  expect(st).toMatchObject({ r: 2, last: 'r2' });
  await expect(f.locator('.pvc-outcome')).toContainText('আগের ৪ ভাগের ১');
  await expect(f.locator('[data-example="dist"] .pvc-ex-res')).toContainText('৪ ভাগের ১');

  // a tap on the ringed sphere (the left one now) does the same as the button
  const box = await f.locator('.pvc-act-ringbox').boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await fig.advance(2500);
  st = await fig.call('get');
  expect(st).toMatchObject({ example: 'mass', m1: 2000, last: 'm1' });

  // keys: 3 chooses the Earth, Space puts the weight down
  await f.locator('.pvc').focus();
  await page.keyboard.press('3');
  await fig.advance(1500);
  expect((await fig.call('get')).example).toBe('earth');
  await page.keyboard.press('Space');
  await fig.advance(3000);
  st = await fig.call('get');
  expect(st.earth).toMatchObject({ placed: true, kg: 1 });

  // the test: five questions, each answered; the scene is locked meanwhile; leaving it restores the learn state
  await fig.call('practice');
  await fig.advance(1500);
  for (let i = 0; i < 5; i++) {
    await expect(f.locator('.pvc-opt[data-q]')).toHaveCount(4);
    await f.locator('.pvc-opt[data-q]').first().click();
    await fig.advance(1500);
    await expect(f.locator('.pvc-q-feedback .lead')).toBeVisible();
    await f.locator('[data-act="q-next"]').click();
    await fig.advance(1500);
  }
  await expect(f.locator('.pvc-q-result')).toContainText('৫টির মধ্যে');
  await f.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  st = await fig.call('get');
  expect(st).toMatchObject({ mode: 'explore', example: 'earth', earth: { placed: true, kg: 1 } });
  expect(log.errors).toEqual([]);
});
