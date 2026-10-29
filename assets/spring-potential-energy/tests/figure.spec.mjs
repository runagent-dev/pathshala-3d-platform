// Potential energy of a spring (book p106–107, topic 4.3.2) through the bridge: the big button's three steps (pull
// 5 cm, twice as far, push in) give F = kx and the book's V = ½kx² with the comparison "twice x: twice the force, four
// times the energy"; the steppers change x and k; the test sets up its own scenes; reset brings everything back.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('spring-potential-energy: F = kx, V = ½kx², twice x gives four times V', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'spring-potential-energy');
  const text = async (sel) => (await fig.frame.locator(sel).first().textContent()).replace(/ /g, ' ');

  const start = await fig.call('get');
  expect(start).toMatchObject({ x: 0, k: 200, F: 0, V: 0, state: 'rest' });
  expect(start.next).toEqual({ label: 'act_pull5', step: 1, to: [5] });
  expect(await text('.pvc-act')).toContain('৫ cm টেনে ধরো');
  expect(await text('.pvc-rule')).toContain('স্থির অবস্থায়');

  // step 1: pulled out 5 cm, F = 200 × 0.05 = 10 N, V = ½ × 200 × 0.05² = 0.25 J
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(1500);
  const s1 = await fig.call('get');
  expect(s1).toMatchObject({ x: 5, F: 10, V: 0.25, state: 'stretched', moving: false, results: { stretched: 0.25 } });
  expect(await text('.pvc-outcome')).toContain('বল F = kx = ২০০ N/m × ০.০৫ m = ১০ N');
  expect(await text('.pvc-outcome')).toContain('= ০.২৫ J');
  expect(await text('.pvc-rule')).toContain('দুটো বল সমান, বিপরীত');
  expect(await text('[data-example="stretched"] .pvc-ex-res')).toBe('০.২৫ J');
  expect(s1.next).toEqual({ label: 'act_double', step: 2, to: [10] });

  // step 2: twice as far, twice the force, four times the energy
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(1500);
  const s2 = await fig.call('get');
  expect(s2).toMatchObject({ x: 10, F: 20, V: 1, compare: { times: 2, F: 2, V: 4 } });
  expect(await text('.pvc-rule')).toContain('বল ২ গুণ (১০ → ২০ N)');
  expect(await text('.pvc-rule')).toContain('বিভব শক্তি ৪ গুণ (০.২৫ → ১ J)');
  expect(s2.next.step).toBe(3);

  // step 3: pushed in 10 cm: the same energy, and the book's name for it
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(2000);
  const s3 = await fig.call('get');
  expect(s3).toMatchObject({ x: -10, F: 20, V: 1, state: 'compressed', compare: null });
  expect(await text('.pvc-rule')).toContain('এই সঞ্চিত শক্তিকে বলে বিভব শক্তি');
  expect(s3.next).toEqual({ label: 'act_release', step: '', to: [0] });

  // the steppers: x one cm back toward rest, then a stiffer spring; the rule now states the book's formula
  await fig.frame.locator('[data-act="x+"]').click();
  expect(await fig.call('get')).toMatchObject({ x: -9, F: 18, V: 0.81 });
  expect(await text('.pvc-rule')).toContain('V =');
  await fig.frame.locator('[data-act="k+"]').click();
  expect(await fig.call('get')).toMatchObject({ x: -9, k: 300, F: 27, V: 1.215 });
  expect(await text('.pvc-outcome')).toContain('= ১.২১৫ J');

  // let it back: at rest again, nothing stored
  await fig.call('set', { home: true });
  await fig.advance(1000);
  expect(await fig.call('get')).toMatchObject({ x: 0, F: 0, V: 0, state: 'rest' });
  expect(await text('.pvc-rule')).toContain('আবার');

  // the test: five questions, each sets up its own scene; the scene is locked
  await fig.call('practice');
  await fig.advance(800);
  const q1 = await fig.call('get');
  expect(q1.mode).toBe('quiz');
  expect(q1.x).toBeLessThan(0); // the first question shows the spring pushed in
  expect(await fig.frame.locator('.pvc-quiz .pvc-opt').count()).toBe(4);
  expect((await fig.call('set', { x: 5 })).x).toBe(q1.x); // locked
  await fig.frame.locator('.pvc-quiz .pvc-opt').first().click();
  await fig.advance(500);
  await fig.frame.locator('[data-act="q-next"]').click();
  await fig.advance(800);
  const q2 = await fig.call('get');
  expect(q2.x).toBeGreaterThan(0); // the force question: pulled out, x read on the ruler
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', x: 0, k: 300, locked: false });

  // reset
  const r = await fig.call('reset');
  expect(r).toMatchObject({ x: 0, k: 200, seen: { stretched: false, compressed: false, double: false } });
  expect(log.errors).toEqual([]);
});
