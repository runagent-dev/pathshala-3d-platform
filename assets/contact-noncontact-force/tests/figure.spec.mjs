// Contact and non-contact forces through the bridge (book p67, topic 3.1.2): each example starts at rest (the crate
// already sliding); the one action plays it and it holds at its telling moment, where a contact force shows its lit
// patch and tag (the crane, the push, friction) and a non-contact force its measured gap (gravity, the magnet); the
// action then goes on to the next example not seen yet, its kind is written under its word, and the rule grows into
// the two kinds; the panel button and a tap on the 3D body work; the keyboard works; the test runs and its answer
// shows the patch or the gap. Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('contact-noncontact-force: play, hold at the telling moment, see the kind, go on, test', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'contact-noncontact-force');
  const frame = fig.frame;

  expect(await fig.call('get')).toMatchObject({
    example: 'crane',
    phase: 'rest',
    speed: 0,
    acting: false,
    kind: 'contact',
    marks: null,
    seen: {},
    next: { example: 'crane', step: 1 },
  });
  await expect(frame.locator('.pvc-act')).toContainText('ক্রেন দিয়ে তোলো');
  await expect(frame.locator('.pvc-act-marker.pvc-act-under')).toHaveClass(/\bin\b/); // the ring round the block, waiting

  // the crane: the big button plays it; it holds half a metre up, rising at 0.5 m/s, the hook touching the block
  await frame.locator('.pvc-act').click();
  await fig.advance(2500);
  let st = await fig.call('get');
  expect(st).toMatchObject({ phase: 'paused', acting: true, touching: true, speed: 0.5, marks: 'contact', seen: { crane: 'contact' } });
  await expect(frame.locator('.pvc-anno-tag-c')).toContainText('ছুঁয়ে আছে: স্পর্শ বল');
  await expect(frame.locator('.pvc-outcome')).toContainText('স্পর্শ বল');
  await expect(frame.locator('[data-example="crane"] .pvc-ex-res')).toHaveText('স্পর্শ');
  // the action now goes on to the next example, step 2 (the student's second step); the ring is gone
  expect(st.next).toEqual({ example: 'push', step: 2 });
  await expect(frame.locator('.pvc-act')).toContainText('ধাক্কা দাও');
  await expect(frame.locator('[data-example="push"]')).toHaveClass(/\bnext\b/);
  await expect(frame.locator('.pvc-act-marker.pvc-act-under')).not.toHaveClass(/\bin\b/);

  // the push: the same button switches and plays; the hands touch the carton while they push
  await fig.call('set', { act: true });
  await fig.advance(1600);
  st = await fig.call('get');
  expect(st).toMatchObject({ example: 'push', phase: 'paused', touching: true, marks: 'contact', seen: { crane: 'contact', push: 'contact' } });
  expect(st.speed).toBeCloseTo(0.5, 2);

  // friction: the crate is already sliding at 2 m/s before it is played, and slows (a moving body's velocity changes)
  await fig.call('set', { example: 'friction', animate: false });
  expect(await fig.call('get')).toMatchObject({ phase: 'rest', speed: 2, kind: 'contact', effect: 'change', marks: null });
  await fig.call('set', { at: 'key' });
  st = await fig.call('get');
  expect(st.speed).toBeCloseTo(1.12, 2);
  expect(st.marks).toBe('contact');
  await expect(frame.locator('.pvc-rule')).toContainText('গতিশীল বস্তুর বেগের পরিবর্তন');

  // the magnet: a tap on the nail plays it; at its telling moment there is still a gap and nothing touches the nail
  await fig.call('set', { example: 'magnet', animate: false });
  const ring = await frame.locator('.pvc-act-ringbox svg').boundingBox();
  expect(ring).not.toBeNull();
  await page.mouse.click(ring.x + ring.width / 2, ring.y + ring.height / 2);
  await fig.advance(2600);
  st = await fig.call('get');
  expect(st).toMatchObject({ example: 'magnet', phase: 'paused', kind: 'noncontact', touching: false, marks: 'gap' });
  expect(st.gap).toBeGreaterThan(0.015);
  expect(st.gap).toBeLessThan(0.03);
  await expect(frame.locator('.pvc-anno-tag-n')).toContainText('ছোঁয়নি, তবু টানে: অস্পর্শ বল');
  await expect(frame.locator('.pvc-anno-tag-n')).toContainText('ফাঁক ২.৩ cm');
  await expect(frame.locator('[data-example="magnet"] .pvc-ex-res')).toHaveText('অস্পর্শ');
  await expect(frame.locator('.pvc-rule')).toContainText('অস্পর্শ বল');

  // the football: the hands let go, it falls faster and faster with nothing touching it, a measured gap below it
  await fig.call('set', { example: 'fall', animate: false, at: 'key' });
  st = await fig.call('get');
  expect(st).toMatchObject({ kind: 'noncontact', touching: false, acting: true, marks: 'gap' });
  expect(st.speed).toBeCloseTo(2.94, 2);
  await expect(frame.locator('.pvc-anno-tag-n')).toContainText('ফাঁক ৬০ cm');

  // all five seen: three contact, two non-contact under their words; the action replays without a number
  st = await fig.call('get');
  expect(Object.values(st.seen).filter((k) => k === 'contact')).toHaveLength(3);
  expect(Object.values(st.seen).filter((k) => k === 'noncontact')).toHaveLength(2);
  expect(st.next).toEqual({ example: 'fall', step: '' });
  await expect(frame.locator('.pvc-rule')).toContainText('দুই ভাগ');

  // the keyboard: 2 chooses the push, space plays it
  await frame.locator('#app').focus();
  await page.keyboard.press('2');
  expect((await fig.call('get')).example).toBe('push');
  await page.keyboard.press(' ');
  await fig.advance(1600);
  expect((await fig.call('get')).phase).toBe('paused');

  // the test: five questions, each answered by a tap; a kind question's answer lights the patch or measures the gap
  await fig.call('practice');
  let marked = 0;
  for (let i = 0; i < 5; i++) {
    await fig.advance(2600);
    await expect(frame.locator('.pvc-anno-tag-c, .pvc-anno-tag-n')).toHaveCount(0); // no answer before the tap
    await frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(1200);
    if ((await fig.call('get')).marks) marked++;
    await frame.locator('[data-act="q-next"]').click();
  }
  expect(marked).toBe(4); // four "which kind?" questions show their marks; "what does the pull do?" plays on instead
  await fig.advance(800);
  await expect(frame.locator('.pvc-q-result')).toContainText('৫টির মধ্যে');

  await fig.call('reset');
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ example: 'crane', phase: 'rest', seen: {}, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});
