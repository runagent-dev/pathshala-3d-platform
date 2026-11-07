// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the story on
// one action (in two halves, so each stays short), the torch turned by a finger and by the keys, the media, and the test
// answered all right and all wrong.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

const ID = 'refraction-of-light';
const settled = async (fig) => {
  for (let i = 0; i < 120; i++) {
    await fig.advance(300);
    if (!(await fig.call('get')).busy) return fig.advance(200);
  }
  throw new Error('the step never ended');
};
const near = (a, b, tol = 0.05) => expect(Math.abs(a - b)).toBeLessThan(tol);

test(`${ID}: the first three steps on one action`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID);
  const act = async () => {
    await fig.frame.locator('.pvc-act').first().click();
    await settled(fig);
    return fig.call('get');
  };
  let st = await fig.call('get');
  expect(st).toMatchObject({ step: 'intro', medium: 'glass', angle: 50, busy: false });

  st = await act();
  expect(st).toMatchObject({ step: 'slow', speed: 1.97, inPlane: true });
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('১.৯৭');
  await expect(fig.frame.locator('.pvc-rule')).toContainText('প্রতিসরণাঙ্ক');

  st = await act();
  expect(st).toMatchObject({ step: 'bend', theta1: 50 });
  near(st.theta2, 30.29);
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'লম্ব' })).toHaveCount(1);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('লম্বের দিকে বেঁকে যায়');

  st = await act(); // the plane, and the camera's swing to look along it
  expect(st).toMatchObject({ step: 'plane', frame: 'plane', inPlane: true });
  await expect(fig.frame.locator('.pvc-rule')).toContainText('প্রতিসরণের প্রথম সূত্র');
  await expect(fig.frame.locator('.pvc-anno', { hasText: 'সমতল' })).toHaveCount(1);
  expect(log.errors).toEqual([]);
});

test(`${ID}: the second law, the media, and the relative index`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 600, height: 300 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID, { params: { step: 'plane' } });
  const act = async () => {
    await fig.frame.locator('.pvc-act').first().click();
    await settled(fig);
    return fig.call('get');
  };
  let st = await act();
  expect(st).toMatchObject({ step: 'law', measured: [] });
  for (let i = 0; i < 3; i++) st = await act(); // Measure ×3: the torch goes to 30°, 50°, 70°
  expect(st.measured.map((m) => m.t1)).toEqual([30, 50, 70]);
  expect(st.measured.every((m) => m.ratio === 1.52)).toBe(true);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('প্রতিসরণের দ্বিতীয় সূত্র');

  // another medium: its own dots; the glass line stays, faint
  await fig.frame.locator('[data-medium="diamond"]').click();
  st = await fig.call('set', { measure: [40] });
  expect(st).toMatchObject({ medium: 'diamond', n2: 2.42 });
  expect(st.measured).toHaveLength(1);
  expect(st.measured[0].ratio).toBe(2.42);
  await fig.frame.locator('[data-medium="glass"]').click();

  st = await fig.call('set', { measure: [30, 50, 70] });
  expect(st.measured).toHaveLength(3);
  st = await act(); // water poured over the glass
  expect(st).toMatchObject({ step: 'relative', look: 'relative', n1: 1.33, n2: 1.52 });
  expect(st.relative).toHaveLength(3);
  near(st.ratio, 1.1429, 0.001);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('১.১৪');
  await expect(fig.frame.locator('.pvc-rule')).toContainText('০.৮৮');
  expect(log.errors).toEqual([]);
});

test(`${ID}: a finger turns the torch along the arc; the keys do too`, async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID, { params: { step: 'bend' } });
  await fig.advance(600);
  const disc = fig.frame.locator('.pvc-dh').first();
  await expect(disc).toBeVisible();
  const box = await disc.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 30, y + 60, { steps: 6 }); // down the arc: a bigger angle
  await page.mouse.up();
  await fig.advance(300);
  let st = await fig.call('get');
  expect(st.angle).toBeGreaterThan(55);
  expect(st.view).toBe('front'); // a drag on the torch is not a turn of the view
  const a = st.angle;
  await fig.frame.locator('#app').focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  st = await fig.call('get');
  expect(st.angle).toBe(a - 2);
  near(st.theta2, (Math.asin(Math.sin((st.angle * Math.PI) / 180) / 1.52) * 180) / Math.PI, 0.01);
  expect(log.errors).toEqual([]);
});

test(`${ID}: the test, right and wrong, and what it leaves behind`, async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 640, height: 400 });
  const log = await preparePage(page);
  const fig = await openFigure(page, ID, { params: { step: 'bend' } });
  const answerAll = async (pick) => {
    for (let i = 0; i < 5; i++) {
      await fig.advance(900);
      const { question } = await fig.call('get');
      expect(question).not.toBeNull();
      await fig.frame.locator(`.pvc-opt[data-q="${pick(question.right)}"]`).click();
      await fig.advance(500);
      await expect(fig.frame.locator('.pvc-q-feedback')).not.toBeEmpty();
      await fig.frame.locator('[data-act="q-next"]').click();
    }
    await fig.advance(600);
  };
  await fig.frame.locator('[data-mode="quiz"]').first().click();
  await answerAll((right) => right);
  await expect(fig.frame.locator('.pvc-quiz')).toContainText('৫টির মধ্যে ৫টি সঠিক');

  await fig.frame.locator('[data-act="q-again"]').first().click();
  await answerAll((right) => (right + 1) % 4);
  await expect(fig.frame.locator('.pvc-quiz')).toContainText('৫টির মধ্যে ০টি সঠিক');

  await fig.frame.locator('[data-mode="explore"]').first().click();
  await fig.advance(600);
  const st = await fig.call('get');
  expect(st).toMatchObject({ step: 'bend', medium: 'glass', angle: 50, mode: 'explore', locked: false, question: null });
  expect(log.errors).toEqual([]);
});
