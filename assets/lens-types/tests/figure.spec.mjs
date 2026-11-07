// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): what each step shows,
// the story played on the action, the thickness dragged by keys, and the test answered all right (the kit scores by index).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const ID = 'lens-types';
const settled = async (fig) => {
  for (let i = 0; i < 120; i++) {
    await fig.advance(300);
    if (!(await fig.call('get')).busy) return fig.advance(200);
  }
  throw new Error('the step never ended');
};

test(`${ID}: each step shows what the book says`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const at = async (stage) => {
    await fig.call('set', { stage, animate: false });
    await fig.advance(300);
    return fig.call('get');
  };
  let st = await at('kinds');
  expect(st.cut).toBe(true);
  // চিত্র ৯.১৪: convex thick in the middle, concave thin
  expect(st.lenses.convex.centre).toBeGreaterThan(10 * st.lenses.convex.edge);
  expect(st.lenses.concave.edge).toBeGreaterThan(5 * st.lenses.concave.centre);
  st = await at('converge');
  expect(st.rays.lens).toBe('convex');
  for (const x of st.rays.crossings) expect(x).toBeGreaterThan(10); // the rays meet past the lens
  expect(st.lenses.concave.onRail).toBe(false);
  st = await at('diverge');
  for (const x of st.rays.crossings) expect(x).toBeLessThan(0); // extended back: in front of the lens
  st = await at('sphere');
  expect(st.spheres).toBe('convex');
  expect(st.centres.c1).toBeLessThan(0);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('বক্রতার কেন্দ্র');
  st = await at('sphere2');
  expect(st.spheres).toBe('concave');
  await expect(fig.frame.locator('.pvc-rule')).toContainText('প্রধান অক্ষ');
  st = await at('plano');
  expect(st.plano).toBe(true);
  st = await at('slab');
  expect(st.laser.on).toBe('slab');
  const shift3 = st.laser.shift;
  // twice as thick, twice the shift
  st = await fig.call('set', { thick: 6 });
  expect(st.laser.shift / shift3).toBeCloseTo(2, 5);
  st = await at('centre');
  expect(st.laser.on).toBe('convex');
  expect(st.laser.shift).toBeLessThan(0.15); // a thin lens: nearly straight through
  st = await fig.call('set', { thick: 2 });
  expect(st.laser.shift).toBeGreaterThan(1); // a thick one moves it aside
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'আলোকীয় কেন্দ্র' })).toHaveCount(1);
  st = await at('centre2');
  expect(st.laser.on).toBe('concave');
  expect(st.laser.shift).toBeLessThan(0.15);
  // the arrow keys make it thicker
  await fig.frame.locator('.pvc').first().focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  st = await fig.call('get');
  expect(st.laser.w).toBeCloseTo(0.4, 5);
  expect(log.errors).toEqual([]);
});

test(`${ID}: the story plays on the action, one step a tap`, async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const act = async () => {
    await fig.frame.locator('.pvc-act').first().click();
    await fig.advance(400);
    // a tap while the step plays does nothing
    await fig.frame.locator('.pvc-act').first().click({ force: true });
    await settled(fig);
    return fig.call('get');
  };
  let st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'intro', next: 'kinds' });
  st = await act();
  expect(st).toMatchObject({ stage: 'kinds', cut: true, next: 'converge' });
  st = await act();
  expect(st).toMatchObject({ stage: 'converge', next: 'diverge' });
  expect(st.lenses.convex).toMatchObject({ x: 0, onRail: true });
  st = await act();
  expect(st).toMatchObject({ stage: 'diverge' });
  expect(st.lenses.convex.onRail).toBe(false);
  expect(st.lenses.concave).toMatchObject({ x: 0, onRail: true });
  // a word jumps to its step
  await fig.frame.locator('[data-example="centre"]').click();
  await settled(fig);
  st = await fig.call('get');
  expect(st).toMatchObject({ stage: 'centre' });
  expect(st.laser.shift).toBeLessThan(0.15);
  expect(log.errors).toEqual([]);
});

test(`${ID}: the test, answered all right, scores five`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  await fig.call('practice');
  const kinds = new Set();
  for (let i = 0; i < 5; i++) {
    await fig.advance(2600);
    const st = await fig.call('get');
    expect(st.question).not.toBeNull();
    kinds.add(st.question.kind);
    await fig.frame.locator(`[data-q="${st.question.right}"]`).first().click();
    await fig.advance(600);
    const next = fig.frame.locator('[data-act="q-next"]').first();
    if (await next.isVisible()) await next.click();
  }
  await fig.advance(800);
  expect(kinds.size).toBe(5);
  await expect(fig.frame.locator('.pvc-quiz')).toContainText('৫টির মধ্যে ৫টি');
  expect(log.errors).toEqual([]);
});
