// The energy figure through the bridge (book p102, topic 4.2): at rest it has no energy; pedalling up gives it energy
// (positive work), 3430 J at the top; rolling down turns potential energy into kinetic energy with the total kept;
// braking takes it away as heat (negative work). The clean panel follows: the bar's numbers, the rule in the book's
// words, the big numbered button; the test has five questions on frozen scenes; reset brings everything back.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('energy: work in, the total kept on the way down, work out', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'energy');
  const text = async (sel) => (await fig.frame.locator(sel).first().textContent()).replace(/ /g, ' ');

  const start = await fig.call('get');
  expect(start).toMatchObject({ phase: 'start', height: 0, speed: 0, energy: { potential: 0, kinetic: 0, total: 0 } });
  expect(start.next).toEqual({ action: 'climb', step: 1, enabled: true });
  expect(await text('.pvc-rule')).toContain('শক্তি হচ্ছে কাজ করার সামর্থ্য।');
  expect(await text('.pvc-act')).toContain('প্যাডেল করে পাহাড়ে ওঠো');

  // pedal up: the energy grows with the work done
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(4000);
  const up = await fig.call('get');
  expect(up.phase).toBe('climb');
  expect(up.energy.total).toBeGreaterThan(500);
  expect(up.energy.work).toBe(up.energy.total);
  expect(await text('.pvc-rule')).toContain('ধনাত্মক কাজ করা → বস্তুটিকে শক্তি দেওয়া।');
  await fig.advance(10000);
  const top = await fig.call('get');
  expect(top).toMatchObject({ phase: 'top', height: 5, speed: 0, energy: { potential: 3430, kinetic: 0, total: 3430 } });
  expect(top.next).toEqual({ action: 'roll', step: 2, enabled: true });
  expect(await text('.pvc-outcome')).toContain('৩,৪৩০ J');
  expect(await text('[data-example="up"] .pvc-ex-res')).toBe('+৩,৪৩০ J');

  // roll down: the total stays 3430 J; braking is offered only on the flat road
  await fig.call('set', { tap: true });
  await fig.advance(3000);
  const down = await fig.call('get');
  expect(down.phase).toBe('roll');
  expect(down.energy.total).toBe(3430);
  expect(down.energy.kinetic).toBeGreaterThan(0);
  expect(down.next.enabled).toBe(false);
  await fig.advance(5000);
  const flat = await fig.call('get');
  expect(flat).toMatchObject({ phase: 'flat', height: 0, speed: 9.9, energy: { potential: 0, kinetic: 3430 } });
  expect(flat.next).toEqual({ action: 'brake', step: 3, enabled: true });

  // brake: negative work, the energy goes to heat
  await fig.call('set', { tap: true });
  await fig.advance(1000);
  expect(await text('.pvc-rule')).toContain('ঋণাত্মক কাজ করা → বস্তুটি থেকে শক্তি সরিয়ে নেওয়া।');
  await fig.advance(3000);
  const end = await fig.call('get');
  expect(end).toMatchObject({ phase: 'stopped', speed: 0, energy: { kinetic: 0, total: 0, heat: 3430 } });
  expect(end.next.action).toBe('again');
  expect(await text('.pvc-rule')).toContain('শক্তির একক J (জুল)');

  // the words jump to a part; set() puts the bicycle anywhere
  await fig.frame.locator('[data-example="down"]').click();
  expect(await fig.call('get')).toMatchObject({ phase: 'top', next: { step: 1 } });
  expect(await fig.call('set', { phase: 'roll', height: 2, hold: true })).toMatchObject({
    height: 2,
    energy: { potential: 1370, kinetic: 2060, total: 3430 },
  });
  await fig.advance(2000);
  expect((await fig.call('get')).height).toBe(2); // held still for a picture

  // the test: five questions, each with four choices and a worked answer
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(300);
    expect(await fig.frame.locator('.pvc-opt').count()).toBe(4);
    await fig.frame.locator('.pvc-opt').first().click();
    await fig.advance(200);
    expect((await text('.pvc-q-feedback')).length).toBeGreaterThan(10);
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(300);
  expect(await fig.frame.locator('.pvc-q-done').isVisible()).toBe(true);

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ phase: 'start', mode: 'explore', found: { up: false, down: false, brake: false } });
  expect(log.errors).toEqual([]);
});
