// Electromagnet and a bar magnet through the bridge and the panel (book page 68, topic 3.2.2): the coil is a magnet
// only with the current on, unlike poles attract and like poles repel, and turned back from the far end the pull still
// brings the magnet in (the range is infinite). Runs with `npm run test:figures` (dev only, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('electromagnetic-force-magnet: switch on, turn the magnet round, turn it back', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'electromagnetic-force-magnet');
  const frame = page.frames().find((f) => f.url().includes('/assets/electromagnetic-force-magnet/'));
  const act = frame.locator('.pvc-act');

  // at the start: switch off, no force; step 1 switches on and the coil pulls the magnet in (unlike poles)
  let s = await fig.call('get');
  expect(s).toMatchObject({ magnet: { on: false, facing: 'S', force: null }, next: { action: 'on', step: 1 } });
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

  // the test hides the marker
  await frame.locator('[data-mode="quiz"]').click();
  await fig.advance(1500);
  await expect(frame.locator('.pvc-act-marker.in')).toHaveCount(0);
  await frame.locator('[data-mode="explore"]').click();
  await fig.advance(800);

  await fig.call('reset');
  await fig.advance(1000);
  expect(await fig.call('get')).toMatchObject({ view: 'front', magnet: { on: false } });
  expect(log.errors).toEqual([]);
});
