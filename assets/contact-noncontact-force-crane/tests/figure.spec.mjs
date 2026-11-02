// Force: a crane’s pull, a contact force through the bridge (book p67, topic 3.1.2): the example starts at rest; the one action
// plays it and it holds at its telling moment, where the picture shows the kind (the lit contact patch and its tag);
// the rule grows into the kind; the keyboard works; the test runs and its answers show the marks. Runs with
// `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('contact-noncontact-force-crane: play, hold at the telling moment, see the kind, test', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'contact-noncontact-force-crane');
  const frame = fig.frame;

  expect(await fig.call('get')).toMatchObject({ example: 'crane', phase: 'rest', kind: 'contact', marks: null, seen: false, step: 1 });
  await expect(frame.locator('.pvc-act')).toContainText('ক্রেন দিয়ে তোলো');
  await expect(frame.locator('.pvc-act-marker.pvc-act-under')).toHaveClass(/\bin\b/); // the ring round the body, waiting
  await expect(frame.locator('[data-example]')).toHaveCount(0); // one scene: no row of examples

  // the big button plays it; it holds at the telling moment
  await fig.call('reset');
  await frame.locator('.pvc-act').click();
  await fig.advance(2500);
  const st = await fig.call('get');
  expect(st).toMatchObject({ phase: 'paused', acting: true, touching: true, marks: 'contact', seen: true, step: '' });
  expect(st.speed).toBeCloseTo(0.5, 2);
  await expect(frame.locator('.pvc-anno-tag-c')).toContainText('ছুঁয়ে আছে: স্পর্শ বল');
  await expect(frame.locator('.pvc-outcome')).toContainText('স্পর্শ বল');
  await expect(frame.locator('.pvc-rule')).toContainText('স্পর্শ বল');
  await expect(frame.locator('.pvc-act')).toContainText('আবার তোলো');
  await expect(frame.locator('.pvc-act-marker.pvc-act-under')).not.toHaveClass(/\bin\b/);

  // the keyboard: space replays it from rest to the telling moment
  await frame.locator('#app').focus();
  await page.keyboard.press(' ');
  await fig.advance(2500);
  expect((await fig.call('get')).phase).toBe('paused');

  // the test: 3 questions, each answered by a tap; a "which kind?" answer lights the patch or measures the gap
  await fig.call('practice');
  let marked = 0;
  for (let i = 0; i < 3; i++) {
    await fig.advance(2600);
    await expect(frame.locator('.pvc-anno-tag-c, .pvc-anno-tag-n')).toHaveCount(0); // no answer before the tap
    await frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(1200);
    if ((await fig.call('get')).marks) marked++;
    await frame.locator('[data-act="q-next"]').click();
  }
  expect(marked).toBe(3);
  await fig.advance(800);
  await expect(frame.locator('.pvc-q-result')).toContainText('৩টির মধ্যে');

  await fig.call('reset');
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ phase: 'rest', seen: false, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});
