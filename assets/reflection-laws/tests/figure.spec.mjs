// This figure's own behaviour, through the bridge (runs with `npm run test:figures`; dev only, never packaged): the laws
// built in the book's order, both laws read back from the vectors, the spread on wavy water, the test.
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('reflection-laws: the laws, step by step', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'reflection-laws');
  const act = () => fig.frame.locator('.pvc-act').first().click();
  let st = await fig.call('get');
  expect(st).toMatchObject({ step: 'laws', law: 0, theta: 50, thetaR: 50, inPlane: true });

  // the perpendicular, the plane, the reflected ray, in the book's order
  for (const law of [1, 2, 3]) {
    await act();
    await fig.advance(1100);
    expect((await fig.call('get')).law).toBe(law);
    await fig.advance(500);
  }
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('৫০');

  // the first law: swing the plane, the reflected ray never leaves it, θr stays θi
  await fig.frame.locator('.pvc-act').first().click();
  await fig.advance(1800);
  st = await fig.call('get');
  expect(st.law).toBe(4);
  expect(st.phi).not.toBe(0);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('প্রথম সূত্র');
  for (const phi of [34, -46, 10]) {
    st = await fig.call('set', { phi });
    expect(st).toMatchObject({ phi, inPlane: true });
    expect(st.thetaR).toBeCloseTo(st.theta, 6);
  }

  // the second law: θr follows θi at every angle
  await fig.advance(500);
  await act();
  await fig.advance(1600);
  expect((await fig.call('get')).law).toBe(5);
  await expect(fig.frame.locator('.pvc-rule')).toContainText('দ্বিতীয় সূত্র');
  for (const theta of [20, 35, 64, 75]) {
    st = await fig.call('set', { theta });
    expect(st.thetaR).toBeCloseTo(theta, 6);
  }
  await expect(fig.frame.locator('.pvc-outcome')).toContainText('৭৫');

  // 8.2.2: parallel on still water, spread on waves
  await fig.advance(500);
  await act();
  await fig.advance(1000);
  st = await fig.call('get');
  expect(st).toMatchObject({ step: 'surface', waves: false });
  expect(st.spread).toBeLessThan(0.01);
  await fig.advance(500);
  await act();
  await fig.advance(2000);
  st = await fig.call('get');
  expect(st.wind).toBe(1);
  expect(st.spread).toBeGreaterThan(8);
  await fig.advance(500);
  await act();
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ waves: false, wind: 0 });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ step: 'laws', law: 0, theta: 50, phi: 0, waves: false, mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('reflection-laws: the handle and X can be dragged, and the test gives back the learn view', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 844, height: 390 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'reflection-laws');
  await fig.call('set', { law: 3, theta: 40, phi: 12, animate: false });
  await fig.advance(300);
  // a quick look: keys work the same two moves
  await fig.frame.locator('.pvc').first().press('ArrowUp');
  expect((await fig.call('get')).law).toBe(4);
  await fig.frame.locator('.pvc').first().press('ArrowRight');
  expect(await fig.call('get')).toMatchObject({ law: 5, theta: 42 });
  await fig.call('practice');
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ mode: 'quiz', locked: true });
  for (let i = 0; i < 5; i++) {
    await fig.advance(900);
    await fig.frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(300);
    expect(['ok', 'bad']).toContain(await fig.frame.locator('.pvc-q-feedback').getAttribute('data-tone'));
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(900);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(900);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', step: 'laws', law: 5, theta: 42, waves: false });
  expect(log.errors).toEqual([]);
});
