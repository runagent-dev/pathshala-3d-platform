// Law of gravitation through the bridge (book pages 78–79, topic 3.7): the student's five steps with the big button
// (the distance doubled: a quarter of the force; the left mass doubled: twice; the right mass too: four times and
// now, last, the formula; a 1 kg weight on the Earth: its weight GMm/R² ≈ 9.8 N; a second one: twice the weight, the
// same g), the example words, a tap on the ringed sphere doing the same as the button, the keys, the test, and the
// reset. The words come first and are plain: বাম/ডান গোলক, টান, ২ গুণ, ৪ ভাগের ১ ভাগ, never a power of ten. Runs
// with `npm run test:figures` (dev-only folder, never packaged).
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

  // step 3: the right mass too: four times the force at 2 m (the faint arrows are the mass example's start)
  st = await fig.call('set', { act: true });
  expect(st).toMatchObject({ example: 'mass', m1: 2000, m2: 2000, last: 'm2' });
  expect(st.force / st.before).toBeCloseTo(4, 6); // compared with where the mass example starts: four times
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
  // starting again is a real restart: nothing found, the numbering begins at 1 once more (never a step 6)
  expect(Object.values(st.found).some(Boolean)).toBe(false);
  expect(st.next).toEqual({ example: 'dist', act: 'r2', step: 1 });
  st = await fig.call('set', { act: true });
  expect(st.next).toEqual({ example: 'mass', act: 'm1', step: 2 });
  // a step done before keeps its own number when it is done again (the quiet reset on the Earth: step 4, not 6)
  await fig.call('set', { steps: 5, animate: false });
  st = await fig.call('set', { example: 'earth' });
  expect(st.next).toEqual({ example: 'earth', act: 'place', step: 4 });

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

  // the first view is in plain words: what they see, the name, and no symbol or power of ten to decode
  await expect(f.locator('.pvc-act')).toContainText('১');
  await expect(f.locator('.pvc-act')).toContainText('দূরত্ব ২ গুণ করো');
  await expect(f.locator('.pvc-outcome')).toContainText('দুটি ভারী গোলক একে অপরকে টানে');
  await expect(f.locator('.pvc-outcome')).toContainText('মহাকর্ষ বল');
  await expect(f.locator('.pvc-rule')).toContainText('সমান জোরে');
  await expect(f.locator('.lg-note')).toContainText('পিঁপড়া');
  const panelText = async () => (await f.locator('.pvc-outcome').innerText()) + (await f.locator('.pvc-rule').innerText());
  expect(await panelText()).not.toMatch(/১০|10|⁻/);
  await expect(f.locator('.pvc-rule .lg-formula')).toHaveCount(0);

  // the panel's button does the change; the result says how it compares with before, as a fraction in words
  await f.locator('.pvc-act').click();
  await fig.advance(2500);
  let st = await fig.call('get');
  expect(st).toMatchObject({ r: 2, last: 'r2' });
  await expect(f.locator('.pvc-outcome')).toContainText('টান শুরুর ১/৪');
  await expect(f.locator('.pvc-outcome')).toContainText('৪ ভাগের ১ ভাগ');
  await expect(f.locator('.pvc-rule')).toContainText('দূরত্ব ২ গুণ হলে টান ৪ ভাগের ১ ভাগ');
  await expect(f.locator('[data-example="dist"] .pvc-ex-res')).toContainText('৪ ভাগের ১');
  expect(await panelText()).not.toMatch(/১০|10|⁻/);
  await expect(f.locator('.pvc-rule .lg-formula')).toHaveCount(0); // the formula only comes last
  // each arrow is named at its own sphere
  await expect(f.locator('.pvc-anno', { hasText: 'টান' }).first()).toBeVisible();

  // a tap on the ringed sphere (the left one now) does the same as the button
  const box = await f.locator('.pvc-act-ringbox').boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await fig.advance(2500);
  st = await fig.call('get');
  expect(st).toMatchObject({ example: 'mass', m1: 2000, last: 'm1' });
  await expect(f.locator('.pvc-outcome')).toContainText('টান শুরুর ২ গুণ');
  await expect(f.locator('.pvc-rule')).toContainText('দুই গোলকেরই টান ২ গুণ');
  await expect(f.locator('.pvc-rule .lg-formula')).toHaveCount(0);

  // the right mass too: four times, and now, last, the formula with each symbol in the colour of what was changed
  await f.locator('.pvc-act').click();
  await fig.advance(2500);
  await expect(f.locator('.pvc-act')).toContainText('৪'); // the next step is the Earth: step ৪
  await expect(f.locator('.pvc-outcome')).toContainText('টান শুরুর ৪ গুণ');
  await expect(f.locator('.pvc-rule .lg-formula')).toHaveCount(1);
  await expect(f.locator('.pvc-rule .lg-formula')).toContainText('সব মিলিয়ে');
  await expect(f.locator('.pvc-rule .lg-term.lg-qm')).toHaveCount(2); // m₁, m₂: ভর, ভর
  await expect(f.locator('.pvc-rule .lg-term.lg-qd')).toHaveCount(1); // r²: দূরত্ব × দূরত্ব
  await expect(f.locator('.pvc-rule .lg-term.lg-qf')).toHaveCount(1); // F: টান
  expect(await panelText()).not.toMatch(/১০|10|⁻/);

  // keys: 3 chooses the Earth, Space puts the weight down
  await f.locator('.pvc').focus();
  await page.keyboard.press('3');
  await fig.advance(1500);
  expect((await fig.call('get')).example).toBe('earth');
  await expect(f.locator('.pvc-outcome')).toContainText('পৃথিবীও একটা বিশাল গোলক');
  await expect(f.locator('.pvc-rule')).toContainText('ওজন');
  await page.keyboard.press('Space');
  await fig.advance(3000);
  st = await fig.call('get');
  expect(st.earth).toMatchObject({ placed: true, kg: 1 });
  await expect(f.locator('.pvc-outcome')).toContainText('৯.৮ নিউটন');
  await expect(f.locator('.pvc-rule')).toContainText('পৃথিবীর কেন্দ্র থেকে'); // R: from the centre, about ৬,৩৭০ km
  await expect(f.locator('.pvc-rule')).toContainText('৬,৩৭০ km');
  await page.keyboard.press('Space');
  await fig.advance(3000);
  await expect(f.locator('.pvc-outcome')).toContainText('১৯.৬ নিউটন');
  await expect(f.locator('.pvc-rule')).toContainText('প্রতি ১ kg-এ টান একই');
  await expect(f.locator('.pvc-rule .lg-formula')).toHaveCount(1); // g = G × M ÷ R²
  await fig.call('set', { steps: 4, animate: false }); // back to one weight, for the test that follows

  // the test: five questions, each answered; the scene is locked meanwhile; leaving it restores the learn state
  await fig.call('practice');
  await fig.advance(1500);
  for (let i = 0; i < 5; i++) {
    await expect(f.locator('.pvc-opt[data-q]')).toHaveCount(4);
    // plain words in the question and the choices (২ গুণ, ৪ ভাগের ১ ভাগ, সমান জোরে, km): no power of ten
    const asked = (await f.locator('.pvc-q-text').innerText()) + (await f.locator('.pvc-opt[data-q]').allInnerTexts()).join(' ');
    expect(asked, `question ${i + 1}: ${asked}`).not.toMatch(/১০|10|⁻/);
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
