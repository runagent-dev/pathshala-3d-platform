// Contact and non-contact forces through the bridge (book p67, topic 3.1.2): each example starts at rest (the
// crate already sliding), its force acts when played, it stops at the telling moment until it is sorted, a wrong
// box is refused and a right one goes on to the end; the trays fill 3 + 2; the keyboard works; the test runs.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('contact-noncontact-force: play, stop at the telling moment, sort, test', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'contact-noncontact-force');

  expect(await fig.call('get')).toMatchObject({ example: 'crane', phase: 'rest', speed: 0, acting: false, kind: 'contact', sorted: {} });

  // the crane: it plays, stops half a metre up (rising at 0.5 m/s, touching), waits to be sorted
  await fig.call('set', { play: true });
  await fig.advance(2500);
  let st = await fig.call('get');
  expect(st).toMatchObject({ phase: 'paused', waiting: true, acting: true, touching: true, speed: 0.5 });
  // a wrong box is refused; the right one sorts it and it goes on to the end
  await fig.call('set', { sort: 'noncontact' });
  expect(await fig.call('get')).toMatchObject({ waiting: true, sorted: {} });
  await fig.call('set', { sort: 'contact' });
  await fig.advance(3000);
  st = await fig.call('get');
  expect(st).toMatchObject({ phase: 'done', sorted: { crane: 'contact' }, speed: 0, acting: true });

  // friction: the crate is already sliding at 2 m/s before it is played, and slows to a stop
  await fig.call('set', { example: 'friction', animate: false });
  expect(await fig.call('get')).toMatchObject({ phase: 'rest', speed: 2, kind: 'contact', effect: 'change' });
  await fig.call('set', { at: 'key' });
  expect((await fig.call('get')).speed).toBeCloseTo(1.12, 2);

  // the magnet: at its telling moment there is still a gap and nothing touches the nail
  await fig.call('set', { example: 'magnet', animate: false, at: 'key' });
  st = await fig.call('get');
  expect(st).toMatchObject({ kind: 'noncontact', touching: false, waiting: true });
  expect(st.gap).toBeGreaterThan(0.005);
  expect(st.gap).toBeLessThan(0.03);
  await fig.call('set', { sort: 'noncontact', animate: false });
  await fig.advance(2000);
  st = await fig.call('get');
  expect(st).toMatchObject({ phase: 'done', touching: true, gap: null });

  // the ball: the hands let go, it falls faster and faster with nothing touching it
  await fig.call('set', { example: 'fall', animate: false, at: 'key' });
  st = await fig.call('get');
  expect(st).toMatchObject({ kind: 'noncontact', touching: false, acting: true });
  expect(st.speed).toBeCloseTo(2.94, 2);

  // the keyboard: 2 chooses the push, space plays, C sorts it as a contact force
  await fig.frame.locator('#app').focus();
  await page.keyboard.press('2');
  expect((await fig.call('get')).example).toBe('push');
  await page.keyboard.press(' ');
  await fig.advance(1600);
  expect((await fig.call('get')).waiting).toBe(true);
  await page.keyboard.press('c');
  expect((await fig.call('get')).sorted.push).toBe('contact');

  // all five sorted: three contact, two non-contact; the trays show them
  await fig.call('set', { sorted: 'all' });
  st = await fig.call('get');
  expect(Object.values(st.sorted).filter((k) => k === 'contact')).toHaveLength(3);
  expect(Object.values(st.sorted).filter((k) => k === 'noncontact')).toHaveLength(2);
  await expect(fig.frame.locator('[data-sort="contact"] .cnf-items i')).toHaveCount(3);
  await expect(fig.frame.locator('[data-sort="noncontact"] .cnf-items i')).toHaveCount(2);

  // the test: five questions, each answered by a tap
  await fig.call('practice');
  const frame = fig.frame;
  for (let i = 0; i < 5; i++) {
    await fig.advance(1200);
    await frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(2200);
    await frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(800);
  await expect(frame.locator('.pvc-q-result')).toContainText('৫');

  await fig.call('reset');
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ example: 'crane', phase: 'rest', sorted: {}, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});
