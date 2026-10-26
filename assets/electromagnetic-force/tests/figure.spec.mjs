// Electromagnetic force through the bridge and the panel (book page 68, topic 3.2.2): the one action in two steps
// (comb the hair, then bring the comb to the paper: the bits jump up because its pull beats the Earth's), an
// uncharged comb lifts nothing; the coil is a magnet only with the current on, unlike poles attract and like poles
// repel. Runs with `npm run test:figures` (dev only, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('electromagnetic-force: comb and paper in two steps, coil and magnet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'electromagnetic-force');
  const frame = page.frames().find((f) => f.url().includes('/assets/electromagnetic-force/'));
  const act = frame.locator('.pvc-act');

  // at the start: the comb in the hair, no charge; the action is step 1, comb the hair
  let s = await fig.call('get');
  expect(s).toMatchObject({ scene: 'comb', comb: { charge: 0, place: 'hair', lifted: 0, wins: false }, next: { action: 'comb', step: 1 } });
  await expect(frame.locator('.pvc-outcome')).toContainText('নেই');

  // step 1: a few strokes charge the comb fully; the action becomes step 2, bring it to the paper
  await act.click();
  await fig.advance(200);
  expect((await fig.call('get')).next.busy).toBe(true);
  await fig.advance(2800);
  s = await fig.call('get');
  expect(s.comb).toMatchObject({ charge: 5, place: 'hair' });
  expect(s.next).toMatchObject({ action: 'bring', step: 2, busy: false });

  // step 2: it comes down over the paper; high up the Earth still wins, close enough the bits jump up and cling
  await act.click();
  await fig.advance(1300);
  s = await fig.call('get');
  expect(s.comb).toMatchObject({ place: 'paper', lifted: 0, wins: false });
  await expect(frame.locator('.pvc-outcome')).toContainText('<');
  await fig.advance(3000);
  s = await fig.call('get');
  expect(s.comb.lifted).toBeGreaterThan(6);
  expect(s.comb.wins).toBe(true);
  // then it lifts them up into the air ("কাগজকে আকর্ষণ করে তুলে নাও"); the result line says the comb's pull won
  await fig.advance(1500);
  s = await fig.call('get');
  expect(s.comb).toMatchObject({ height: 60, wins: true, lifted: 9 });
  expect(s.next).toMatchObject({ action: 'again', step: '' });
  await expect(frame.locator('.pvc-outcome')).toContainText('>');
  await expect(frame.locator('.pvc-rule')).toContainText('অনেক শক্তিশালী');

  // an uncharged comb over the paper lifts nothing, however low
  await fig.call('set', { again: true, animate: false });
  s = await fig.call('set', { place: 'paper', height: 10, animate: false });
  expect(s.comb).toMatchObject({ place: 'paper', charge: 0, lifted: 0, pull: 0, wins: false });

  // held high, nothing jumps; lowered to its reach, it does
  await fig.call('set', { again: true, animate: false });
  await fig.call('set', { charge: 5 });
  s = await fig.call('set', { place: 'paper', height: 60, animate: false });
  expect(s.comb).toMatchObject({ lifted: 0, wins: false, reach: 45 });
  s = await fig.call('set', { place: 'paper', height: 30, animate: false });
  expect(s.comb.lifted).toBeGreaterThan(6);

  // the magnets, from the row of words: step 1 switches on and the coil pulls the magnet in (unlike poles)
  await frame.locator('[data-example="magnet"]').click();
  await fig.advance(800);
  s = await fig.call('get');
  expect(s).toMatchObject({ scene: 'magnet', magnet: { on: false, facing: 'S', force: null }, next: { action: 'on', step: 1 } });
  await act.click();
  await fig.advance(2500);
  s = await fig.call('get');
  expect(s.magnet).toMatchObject({ on: true, force: 'attract', gap: 0, moving: false });
  expect(s.next).toMatchObject({ action: 'flip', step: 2 });
  // step 2 turns it round: like poles, it is pushed to the end of its track
  await act.click();
  await fig.advance(3000);
  s = await fig.call('get');
  expect(s.magnet).toMatchObject({ facing: 'N', force: 'repel', gap: 60, moving: false });
  await expect(frame.locator('.pvc-outcome')).toContainText('বিকর্ষণ');
  // turned back from the far end, the pull still brings it in: the range is infinite
  await act.click();
  await fig.advance(3500);
  expect((await fig.call('get')).magnet).toMatchObject({ force: 'attract', gap: 0 });
  await expect(frame.locator('.pvc-rule')).toContainText('পাল্লা অসীম');
  // switched off, it stays where it is put
  s = await fig.call('set', { on: false, gap: 25, animate: false });
  expect(s.magnet).toMatchObject({ on: false, gap: 25, force: null });

  // the test hides the marker; leaving it brings the comb back
  await frame.locator('[data-mode="quiz"]').click();
  await fig.advance(1500);
  await expect(frame.locator('.pvc-act-marker.in')).toHaveCount(0);
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(800);

  await fig.call('reset');
  await fig.advance(1000);
  expect(await fig.call('get')).toMatchObject({ scene: 'comb', view: 'front', comb: { charge: 0, place: 'hair' }, magnet: { on: false } });
  expect(log.errors).toEqual([]);
});
