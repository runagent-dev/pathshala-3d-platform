// Electromagnetic force through the bridge (book page 68, topic 3.2.2): combing charges the comb, the charged comb
// lifts the bits of paper (its pull beats the Earth's), an uncharged one does not; the coil is a magnet only with
// the current on, unlike poles attract and like poles repel. Runs with `npm run test:figures` (dev only, never
// packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('electromagnetic-force: comb and paper, coil and magnet', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'electromagnetic-force');

  // at the start: the comb in the hair, no charge, the Earth wins
  let s = await fig.call('get');
  expect(s).toMatchObject({ scene: 'comb', comb: { charge: 0, place: 'hair', lifted: 0, wins: false } });

  // an uncharged comb over the paper lifts nothing
  s = await fig.call('set', { place: 'paper', height: 10, animate: false });
  expect(s.comb).toMatchObject({ place: 'paper', charge: 0, lifted: 0, pull: 0, wins: false });

  // combing charges it (about one level a pass)
  await fig.call('set', { again: true, animate: false });
  await fig.call('set', { strokes: 3 });
  await fig.advance(3000);
  s = await fig.call('get');
  expect(s.comb.charge).toBe(3);
  expect(s.comb.place).toBe('hair');

  // brought to the paper it comes down and the bits jump up when its pull beats their weight
  await fig.call('set', { place: 'paper' });
  await fig.advance(1200);
  s = await fig.call('get');
  expect(s.comb.place).toBe('paper');
  expect(s.comb.lifted).toBe(0); // still high: the Earth wins
  expect(s.comb.wins).toBe(false);
  await fig.advance(3000);
  s = await fig.call('get');
  expect(s.comb.lifted).toBeGreaterThan(5);
  expect(s.comb.wins).toBe(true);
  // then it lifts them up into the air ("কাগজকে আকর্ষণ করে তুলে নাও")
  await fig.advance(1500);
  s = await fig.call('get');
  expect(s.comb).toMatchObject({ height: 50, wins: true });
  expect(s.comb.lifted).toBeGreaterThan(5);

  // held high, nothing jumps; lowered to its reach, it does
  await fig.call('set', { again: true, animate: false });
  await fig.call('set', { charge: 5 });
  s = await fig.call('set', { place: 'paper', height: 60, animate: false });
  expect(s.comb).toMatchObject({ lifted: 0, wins: false, reach: 45 });
  s = await fig.call('set', { place: 'paper', height: 30, animate: false });
  expect(s.comb.lifted).toBeGreaterThan(5);

  // the coil: no force with the switch off; on, unlike poles attract and like poles repel
  s = await fig.call('set', { scene: 'magnet', gap: 30, animate: false });
  expect(s.magnet).toMatchObject({ on: false, facing: 'S', gap: 30, force: null });
  s = await fig.call('set', { on: true });
  expect(s.magnet.force).toBe('attract');
  await fig.advance(2500);
  s = await fig.call('get');
  expect(s.magnet).toMatchObject({ gap: 0, moving: false });
  await fig.call('set', { facing: 'N' });
  await fig.advance(2500);
  s = await fig.call('get');
  expect(s.magnet).toMatchObject({ facing: 'N', force: 'repel', gap: 60, moving: false });
  // from the far end the pull still brings it back: the range is infinite
  s = await fig.call('set', { facing: 'S', animate: false });
  await fig.advance(3000);
  expect((await fig.call('get')).magnet).toMatchObject({ force: 'attract', gap: 0 });
  // switched off, it stays where it is put
  s = await fig.call('set', { on: false, gap: 25, animate: false });
  expect(s.magnet).toMatchObject({ on: false, gap: 25, force: null });

  await fig.call('reset');
  await fig.advance(1000);
  expect(await fig.call('get')).toMatchObject({ scene: 'comb', view: 'front', comb: { charge: 0, place: 'hair' }, magnet: { on: false } });
  expect(log.errors).toEqual([]);
});
