// Power (book p120, topic 4.7) through the bridge: "same work" fills both roof tanks with 500 kg, the big pump in 15 s
// and the small one in 30 s (scene time, shown 3 times faster), with P = W ÷ t from the stopwatches' whole seconds;
// "same time" runs both 15 s (250 kg against 500 kg); the 100 W bulb uses 100 J each second; the big button walks
// through the three; a word tapped during a run starts that example from rest; the test sets up its own scenes.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('power: same work in less time is more power; same time, more work; 1 W = 1 J each second', async ({ page }) => {
  test.setTimeout(480_000); // about 1 minute on a laptop, over 3 on a GitHub runner (software 3D)
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'power');
  const text = async (sel) => (await fig.frame.locator(sel).first().textContent()).replace(/ /g, ' ');

  const start = await fig.call('get');
  expect(start).toMatchObject({ example: 'work', phase: 'ready', mass: 500, h: 3, total: 30 });
  expect(start.pumps.small).toMatchObject({ P: 490, t: 0, W: 0 });
  expect(start.next).toEqual({ label: 'act_run', step: 1, example: 'work' });
  // the same work is known before the run, the times and powers are not
  expect(await text('.pvc-outcome')).toContain('১৪,৭০০ J');
  expect(await text('.pvc-outcome')).toContain('? W');
  expect(await text('.pvc-rule')).toContain('একই কাজ');
  await fig.advance(1500);
  expect((await fig.call('get')).phase).toBe('ready'); // nothing happens without the switch

  // the race: 2.5 s of real time is 7.5 s of scene time; both stopwatches read 7 s, P = W ÷ t already
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(2500);
  const mid = await fig.call('get');
  expect(mid.phase).toBe('run');
  expect(mid.pumps.small).toMatchObject({ t: 7, W: 3430, running: true });
  expect(mid.pumps.big).toMatchObject({ t: 7, W: 6860, running: true });
  expect(await text('.pvc-outcome')).toContain('৩,৪৩০ J÷৭ s=৪৯০ W');
  expect(await text('.pvc-outcome')).toContain('৬,৮৬০ J÷৭ s=৯৮০ W');

  // the big pump's tank is full at 15 s; its stopwatch stops there while the small one runs on
  await fig.advance(3000);
  const half = await fig.call('get');
  expect(half.pumps.big).toMatchObject({ t: 15, m: 500, W: 14700, done: true });
  expect(half.pumps.small.running).toBe(true);

  await fig.advance(5000);
  const done = await fig.call('get');
  expect(done).toMatchObject({ phase: 'done', runs: { work: 1, time: 0, bulb: 0 } });
  expect(done.pumps.small).toMatchObject({ t: 30, m: 500, W: 14700 });
  expect(await text('.pvc-outcome')).toContain('১৪,৭০০ J÷৩০ s=৪৯০ W');
  expect(await text('.pvc-outcome')).toContain('১৪,৭০০ J÷১৫ s=৯৮০ W');
  expect(await text('.pvc-rule')).toContain('ক্ষমতা হচ্ছে কাজ করার হার');
  expect(done.next).toEqual({ label: 'act_try_time', step: 2, example: 'time' });
  expect(await text('.pvc-act')).toContain('একই সময় চালিয়ে দেখো');

  // step ২: the same time, twice the work
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(300);
  expect(await fig.call('get')).toMatchObject({ example: 'time', phase: 'run' });
  await fig.advance(5500);
  const same = await fig.call('get');
  expect(same).toMatchObject({ example: 'time', phase: 'done' });
  expect(same.pumps.small).toMatchObject({ t: 15, m: 250, W: 7350 });
  expect(same.pumps.big).toMatchObject({ t: 15, m: 500, W: 14700 });
  expect(await text('.pvc-rule')).toContain('শক্তির রূপান্তরের হার');
  expect(same.next).toEqual({ label: 'act_try_bulb', step: 3, example: 'bulb' });

  // step ৩: the bulb, in real time: 100 J each second
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(4500);
  const lit = await fig.call('get');
  expect(lit).toMatchObject({ example: 'bulb', phase: 'run', bulb: { P: 100, t: 4, E: 400, on: true } });
  expect(await text('.pvc-outcome')).toContain('৪০০ J÷৪ s=১০০ W');
  expect(await text('.pvc-rule')).toContain('প্রতি সেকেন্ডে ১০০ J');
  await fig.advance(6500);
  const off = await fig.call('get');
  expect(off).toMatchObject({ phase: 'done', bulb: { t: 10, E: 1000, on: false }, runs: { work: 1, time: 1, bulb: 1 } });
  expect(await text('.pvc-outcome')).toContain('MW');
  expect(await text('.pvc-rule')).toContain('W (ওয়াট)');
  expect(off.next).toEqual({ label: 'act_again', step: '', example: 'bulb' });

  // a word tapped during a run starts that example from rest
  await fig.call('set', { example: 'work', run: true });
  await fig.advance(1000);
  expect((await fig.call('get')).phase).toBe('run');
  await fig.frame.locator('[data-example="time"]').click();
  expect(await fig.call('get')).toMatchObject({ example: 'time', phase: 'ready', t: 0 });

  // the test: five questions, each sets its own scene; the learn state comes back after
  await fig.call('practice');
  await fig.advance(300);
  const q1 = await fig.call('get');
  expect(q1).toMatchObject({ mode: 'quiz', locked: true, phase: 'done' });
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
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', locked: false, example: 'time', phase: 'ready', mass: 500, T: 15 });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ example: 'work', phase: 'ready', runs: { work: 0, time: 0, bulb: 0 } });
  expect(log.errors).toEqual([]);
});
