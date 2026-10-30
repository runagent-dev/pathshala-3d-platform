// The efficiency figure through the bridge (book p121, topic 4.8): switched on, the book's motor lifts 100 kg 10 m in
// 15 s; the energy supplied (15,000 J) splits into the work (9,800 J) and the waste (5,200 J, always input − work), and
// the efficiency is the book's 65.3%. Worn gears take 20 s (49%), oiled ones 14 s (70%). The formula's terms light
// their parts; the worked example follows its steppers, refuses numbers that would need 100% or more, and runs its
// numbers on the machine; the test has five questions; reset brings everything back.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('efficiency: the book example, where the energy goes, the worked example', async ({ page }) => {
  test.setTimeout(600_000); // software 3D on a busy machine: minutes of real time for about a minute of virtual time
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'efficiency');
  const text = async (sel) => (await fig.frame.locator(sel).first().textContent()).replace(/ /g, ' ');

  const start = await fig.call('get');
  expect(start).toMatchObject({ cond: 'book', phase: 'idle', height: 0, energy: { input: 0, work: 0, waste: 0 } });
  expect(start.next).toEqual({ action: 'run', step: 1, enabled: true });
  expect(await text('.pvc-rule')).toContain('খানিকটা শক্তির অপচয় হয়');
  expect(await text('.pvc-act')).toContain('সুইচ চালু করো');

  // switch on: part way, the waste is exactly input − work
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(6000);
  const mid = await fig.call('get');
  expect(mid.phase).toBe('run');
  expect(mid.energy.input).toBeGreaterThan(5000);
  expect(Math.abs(mid.energy.waste - (mid.energy.input - mid.energy.work))).toBeLessThanOrEqual(1);
  expect(mid.next.enabled).toBe(false);
  await fig.advance(10000);
  const done = await fig.call('get');
  expect(done).toMatchObject({
    phase: 'done',
    height: 10,
    efficiency: 65.3,
    energy: { input: 15000, work: 9800, waste: 5200, motor: 2250, friction: 2850, sound: 100 },
  });
  expect(await text('.pvc-outcome')).toContain('৯,৮০০ J');
  expect(await text('.pvc-outcome')).toContain('১৫,০০০ J');
  expect(await text('.pvc-outcome')).toContain('৫,২০০ J');
  expect(await text('.pvc-rule')).toContain('৬৫.৩%');
  expect(await text('.pvc-rule')).toContain('বইয়ের উত্তর');
  expect(await text('[data-example="book"] .pvc-ex-res')).toBe('৬৫.৩%');

  // a term lights its part; the other form of the formula
  await fig.frame.locator('.pvc-rule [data-term="work"]').click();
  expect((await fig.call('get')).term).toBe('work');
  await fig.frame.locator('[data-act="form"]').click();
  expect((await fig.call('get')).form).toBe(2);
  expect(await text('.pvc-rule')).toContain('শক্তির অপচয়');

  // worn gears: 20 s, 49%; the power plant's 30% joins the rule once two motors are found
  await fig.frame.locator('[data-example="worn"]').click();
  await fig.call('set', { tap: true });
  await fig.advance(21000);
  expect(await fig.call('get')).toMatchObject({ cond: 'worn', phase: 'done', efficiency: 49, energy: { input: 20000, work: 9800, waste: 10200 } });
  expect(await text('.pvc-rule')).toContain('বিদ্যুৎকেন্দ্রে');
  await fig.call('set', { cond: 'oiled', phase: 'done' });
  expect(await fig.call('get')).toMatchObject({ efficiency: 70, energy: { input: 14000, waste: 4200 } });

  // the worked example: the book's numbers, then too little time, then a run of its own numbers
  await fig.frame.locator('[data-act="example"]').click();
  expect((await fig.call('get')).example).toMatchObject({ open: true, work: 9800, input: 15000, waste: 5200, eff: 65.3, book: true });
  expect(await text('.ef-ex-lines')).toContain('বইয়ের উত্তর');
  for (let i = 0; i < 6; i++) await fig.frame.locator('[data-ex-step="t"][data-dir="-1"]').click();
  expect((await fig.call('get')).example).toMatchObject({ t: 9, possible: false });
  expect(await fig.frame.locator('.ef-bad').isVisible()).toBe(true);
  expect(await fig.frame.locator('[data-ex="run"]').isDisabled()).toBe(true);
  await fig.frame.locator('[data-ex="book"]').click();
  for (let i = 0; i < 5; i++) await fig.frame.locator('[data-ex-step="t"][data-dir="1"]').click();
  expect((await fig.call('get')).example).toMatchObject({ t: 20, eff: 49, book: false });
  await fig.frame.locator('[data-ex="run"]').click();
  const own = await fig.call('get');
  expect(own).toMatchObject({ cond: 'custom', phase: 'run', run: { P: 1000, t: 20, m: 100, h: 10 }, example: { open: false } });
  await fig.advance(21000);
  expect(await fig.call('get')).toMatchObject({ phase: 'done', efficiency: 49 });

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
  expect(await fig.call('get')).toMatchObject({ cond: 'book', phase: 'idle', mode: 'explore', found: { book: false, oiled: false, worn: false } });
  expect(log.errors).toEqual([]);
});
