// গ্যাসের প্রসারণ (book p173-175, topic 6.3.3) through the bridge: the big button heats the gas by 100 K at constant
// pressure, V follows T (V = nRT/P), the book's γ_P = 1/T₁ with the student's numbers, a colder start expands more in
// proportion, the test sets up its own scenes, reset brings everything back.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('gas-expansion: heating at constant pressure, V follows T, γ_P = 1/T₁', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'gas-expansion');
  const text = async (sel) => (await fig.frame.locator(sel).first().textContent()).replace(/ /g, ' ');

  // before: both cylinders at T₁ = 300 K, V₁ = 3.0 L, nothing heated
  const start = await fig.call('get');
  expect(start).toMatchObject({ T1: 300, T2: 300, V1: 3, V2: 3, dV: 0, heated: false, running: false, stage: 0 });
  expect(start.next).toEqual({ label: 'act_heat', step: 1 });
  expect(await text('.pvc-act')).toContain('গ্যাসকে তাপ দাও');
  expect(await text('.pvc-rule')).toContain('নির্দিষ্ট আকারও নেই');
  expect(await text('[data-gres]')).toContain('১/৩০০');

  // the big button: +100 K, the volume rises to 4.0 L, 33 % more
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(4500);
  const s1 = await fig.call('get');
  expect(s1).toMatchObject({ T1: 300, T2: 400, V1: 3, V2: 4, dV: 1, heated: true, running: false, stage: 1, results: { 300: 33 } });
  expect(s1.next).toEqual({ label: 'act_cool', step: 2 });
  expect(await text('[data-r="T2"]')).toContain('৪০০');
  expect(await text('[data-r="V2"]')).toContain('৪.০');
  expect(await text('[data-fnum]')).toBe('(৪.০ − ৩.০)/৩.০');
  expect(await text('[data-fden]')).toBe('৪০০ − ৩০০');
  expect(await text('[data-gres]')).toContain('১/৩০০');
  expect(await text('.pvc-rule')).toContain('PV = nRT');
  expect(await text('[data-example="300"] .pvc-ex-res')).toBe('+৩৩%');

  // a colder start: the same +100 K, the same rise in litres, a bigger share (50 %), and the rule of the book
  await fig.frame.locator('[data-example="200"]').click();
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ T1: 200, T2: 200, V1: 2, V2: 2, heated: false });
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(4500);
  const s2 = await fig.call('get');
  expect(s2).toMatchObject({ T1: 200, T2: 300, V1: 2, V2: 3, dV: 1, stage: 2, results: { 200: 50, 300: 33 } });
  expect(await text('[data-gres]')).toContain('১/২০০');
  expect(await text('.pvc-rule')).toContain('তাপমাত্রা যত কম, গ্যাসের প্রসারণ তত বেশি');

  // cooling it again takes the piston back down
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(2500);
  expect(await fig.call('get')).toMatchObject({ T1: 200, T2: 200, V2: 2, heated: false });

  // set(): any T₂ above T₁, and a start from the list
  const s3 = await fig.call('set', { t1: 400, t2: 500, animate: false });
  expect(s3).toMatchObject({ T1: 400, T2: 500, V1: 4, V2: 5, dV: 1, heated: true });

  // the test: five questions, each sets up its own scene
  await fig.frame.locator('[data-mode="quiz"]').click();
  await fig.advance(500);
  for (let i = 0; i < 5; i++) {
    await expect(fig.frame.locator('.pvc-q-text')).not.toHaveText(/^\s*$/);
    await fig.frame.locator('.pvc-opt').first().click();
    await fig.advance(300);
    if (i < 4) await fig.frame.locator('[data-act="q-next"]').click();
    await fig.advance(500);
  }
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  // leaving the test brings the student's own scene back
  expect(await fig.call('get')).toMatchObject({ T1: 400, T2: 500, mode: 'explore', locked: false });

  // reset: T₁ = 300 K, cold, the rule back to its start
  await fig.call('reset');
  await fig.advance(2000);
  expect(await fig.call('get')).toMatchObject({ T1: 300, T2: 300, heated: false, stage: 0, results: {} });
  expect(log.errors).toEqual([]);
});
