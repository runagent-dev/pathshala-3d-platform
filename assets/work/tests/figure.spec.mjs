// Work (book p100, topic 4.1) through the bridge: the push counts W = Fs up only while the hands are on the crate;
// after the release the crate slides d = s / 2 more and W stays put (the book's example); the wall gives s = 0, W = 0;
// the steppers work W out at once after a push; the test sets up its own scenes; reset brings everything back.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('work: W = Fs while pushed, nothing more over d, nothing against the wall', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'work');
  const bn = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
  const text = async (sel) => (await fig.frame.locator(sel).first().textContent()).replace(/ /g, ' ');

  const start = await fig.call('get');
  expect(start).toMatchObject({ example: 'push', F: 50, s: 2, d: 1, phase: 'ready', x: 0, W: 0 });
  expect(start.next).toEqual({ label: 'act_push', step: 1, example: 'push' });
  expect(await text('.pvc-outcome')).toBe('কাজ W = Fs = ৫০ N × ২ m = ?');
  // nothing happens without a push
  await fig.advance(2000);
  expect((await fig.call('get')).phase).toBe('ready');

  // the push: T1 = 1.4 + 0.8 × 2 = 3 s, speeding up evenly; half-way in time it has gone a quarter of s
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(1500);
  const mid = await fig.call('get');
  expect(mid.phase).toBe('push');
  expect(mid.x).toBeGreaterThan(0.45);
  expect(mid.x).toBeLessThan(0.55);
  expect(mid.W).toBe(50 * mid.sNow); // from the same 0.1 m number the panel shows
  expect(await text('.pvc-outcome')).toContain(`= ${bn(mid.W)} J`);
  expect(await text('.pvc-rule')).toContain('বাক্সটি বলের দিকে সরছে');

  // the slide: the hands are off, the crate goes on, W stays at 100 J
  await fig.advance(2000);
  const slide = await fig.call('get');
  expect(slide.phase).toBe('slide');
  expect(slide.x).toBeGreaterThan(2);
  expect(slide.W).toBe(100);
  expect(await text('.pvc-rule')).toContain('এখন F বল প্রয়োগ করা হচ্ছে না');

  await fig.advance(1500);
  const done = await fig.call('get');
  expect(done).toMatchObject({ phase: 'done', x: 3, sNow: 2, dNow: 1, W: 100, results: { push: 100, wall: null } });
  expect(await text('.pvc-outcome')).toBe('কাজ W = Fs = ৫০ N × ২ m = ১০০ J');
  expect(await text('.pvc-rule')).toContain('পরের d = ১ m দূরত্ব অতিক্রম করার সময় F বল প্রয়োগ করা হয়নি বলে F বল দ্বারা কোনো কাজ হয়নি');
  expect(await text('[data-example="push"] .pvc-ex-res')).toBe('১০০ J');
  // the button now offers the wall, step ২
  expect(done.next).toEqual({ label: 'act_try_wall', step: 2, example: 'wall' });
  expect(await text('.pvc-act')).toContain('দেয়ালে ঠেলে দেখো');

  // the calculator after a push: F + 10 → 120 J at once, the rule turns to W = Fs
  await fig.frame.locator('[data-act="F+"]').click();
  expect(await fig.call('get')).toMatchObject({ F: 60, phase: 'done', W: 120 });
  expect(await text('.pvc-outcome')).toBe('কাজ W = Fs = ৬০ N × ২ m = ১২০ J');
  await fig.frame.locator('[data-act="s+"]').click();
  expect(await fig.call('get')).toMatchObject({ s: 3, d: 1.5, x: 4.5, W: 180 });
  expect(await text('.pvc-rule')).toContain('F দ্বিগুণ হলে কাজও দ্বিগুণ');

  // a stepper during a run goes back to the start of the new plan
  await fig.call('set', { push: true });
  await fig.advance(500);
  expect((await fig.call('get')).phase).toBe('push');
  await fig.frame.locator('[data-act="F-"]').click();
  expect(await fig.call('get')).toMatchObject({ F: 50, phase: 'ready', x: 0 });

  // the wall: however hard, s = 0, W = 0
  await fig.frame.locator('.pvc-act').click(); // pushes (step ১ is gone, the button says push)
  await fig.advance(6000);
  await fig.frame.locator('[data-example="wall"]').click();
  expect(await fig.call('get')).toMatchObject({ example: 'wall', s: 0, phase: 'ready' });
  await expect(fig.frame.locator('[data-act="s+"]')).toBeDisabled();
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(3000);
  expect(await fig.call('get')).toMatchObject({ example: 'wall', phase: 'done', x: 0, W: 0, results: { wall: 0 } });
  expect(await text('.pvc-outcome')).toBe('কাজ W = Fs = ৫০ N × ০ m = ০ J');
  expect(await text('.pvc-rule')).toContain('দারোয়ানের');

  // the test: five questions, each sets its own scene; the learn state comes back after
  await fig.call('practice');
  await fig.advance(300);
  const q1 = await fig.call('get');
  expect(q1).toMatchObject({ mode: 'quiz', locked: true, example: 'push', phase: 'done' });
  expect(await fig.frame.locator('.pvc-opt').count()).toBe(4);
  for (let i = 0; i < 5; i++) {
    await fig.frame.locator('.pvc-opt').first().click();
    await fig.advance(200);
    await fig.frame.locator('[data-act="q-next"]').click();
    await fig.advance(300);
  }
  await expect(fig.frame.locator('.pvc-quiz.is-done')).toHaveCount(1);
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(800);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', locked: false, example: 'wall', phase: 'done' });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ example: 'push', F: 50, s: 2, phase: 'ready', results: { push: null, wall: null } });
  expect(log.errors).toEqual([]);
});
