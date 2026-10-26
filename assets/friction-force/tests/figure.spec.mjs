// Friction through the bridge (book pages 88–89, topic 3.9): a block at rest is left alone; one push grows (a gentle 5 N
// held, then harder) with friction always exactly as big and the other way round, until the block starts to slide at
// 9.8 N; from the other side friction turns round; weights make it take 14.7 N and 19.6 N; the zoom-in opens; rubbing
// warms the surfaces. The clean panel: the plain words first, one result line, the rule growing, the big numbered button
// walking through the five steps, the number under each word of the row. The test sets up its own scene for every
// question. Reset brings everything back.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('friction-force: friction matches the push, turns round, grows with weight, locks in the teeth, makes heat', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'friction-force');
  const text = async (sel) => (await fig.frame.locator(sel).first().textContent()).replace(/ /g, ' ');
  const run = (ms) => fig.advance(ms, 100);

  // at rest nothing happens, however long we wait: no push, no friction
  const start = await fig.call('get');
  expect(start).toMatchObject({ load: 0, side: 'left', phase: 'rest', push: 0, friction: 0, limit: 9.8, block: 0, lens: false, next: 'push' });
  expect(start.moved).toEqual({ 0: null, 1: null, 2: null });
  await run(2000);
  expect(await fig.call('get')).toMatchObject({ phase: 'rest', push: 0, friction: 0 });
  expect(await text('.pvc-outcome')).toContain('ঘর্ষণও নেই');
  expect(await text('.pvc-rule')).toContain('ঘর্ষণ বল'); // the word is explained before the student pushes
  expect(await text('.pvc-act')).toContain('ব্লকটিকে ঠেলা দাও');
  expect(await text('.pvc-act-badge')).toBe('১');
  expect(await fig.frame.locator('.pvc-act-marker.in:not(.pvc-act-under)').count()).toBe(1); // the ring is on the block

  // step 1: a tap on the button; the gentle push is held: the block does not move, friction equals the push
  await fig.frame.locator('.pvc-act').click();
  await run(1600);
  const hold = await fig.call('get');
  expect(hold).toMatchObject({ phase: 'hold', push: 5, friction: 5, block: 0 });
  expect(await text('.pvc-outcome')).toBe('ব্লক নড়ছে না: ঘর্ষণ ঠেলার সমান, দুটোই ৫ নিউটন');
  expect(await fig.frame.locator('.pvc-anno').allTextContents()).toEqual(expect.arrayContaining(['ঠেলা', 'ঘর্ষণ'])); // plain words, no symbols yet
  expect(await fig.frame.locator('.pvc-act-marker.in:not(.pvc-act-under)').count()).toBe(0); // no ring while it runs
  // growing at 6 N/s: friction stays equal to the push at every moment, the block still does not move
  for (let i = 0; i < 3; i++) {
    await run(300);
    const s = await fig.call('get');
    if (s.phase !== 'climb') continue;
    expect(s.friction).toBe(s.push);
    expect(s.push).toBeLessThan(9.8);
    expect(s.block).toBe(0);
  }
  await run(400);
  const slip = await fig.call('get');
  expect(slip.phase).toBe('slip');
  expect(slip).toMatchObject({ push: 9.8, friction: 9.8 });
  expect(slip.block).toBeGreaterThan(0);
  expect(slip.moved[0]).toBe(9.8);
  expect(await text('.pvc-outcome')).toBe('ঠেলা ৯.৮ নিউটন হতেই ব্লক সরতে শুরু করল');
  expect(await text('.pvc-rule')).toContain('ঠেলা বাড়লে ঘর্ষণও ততটা বাড়ে');
  expect(await fig.frame.locator('.pvc-anno').allTextContents()).toEqual(expect.arrayContaining(['ঠেলা F', 'ঘর্ষণ f'])); // the symbols, now
  await run(1500);
  expect(await fig.call('get')).toMatchObject({ phase: 'done', push: 0, friction: 0, next: 'other' }); // the hand let go: friction went too
  expect(await text('[data-example="w0"] .pvc-ex-res')).toBe('৯.৮ নিউটন');
  expect(await text('.pvc-act-badge')).toBe('২');
  expect(await text('.pvc-act')).toContain('উল্টো দিক থেকে ঠেলা দাও');

  // step 2: from the other side: the block goes left, friction turned round (the arrows are opposite again)
  await fig.frame.locator('.pvc-act').click();
  await run(7000);
  const other = await fig.call('get');
  expect(other).toMatchObject({ side: 'right', phase: 'done', next: 'weight' });
  expect(other.block).toBeLessThan(0);
  expect(await text('.pvc-rule')).toContain('বিপরীত দিকে কাজ করে');

  // step 3: a weight: it takes a bigger push, 14.7 N
  await fig.frame.locator('.pvc-act').click();
  await run(9000);
  const heavy = await fig.call('get');
  expect(heavy).toMatchObject({ load: 1, limit: 14.7, phase: 'done', next: 'lens' });
  expect(heavy.moved[1]).toBe(14.7);
  expect(await text('.pvc-outcome')).toBe('আগের চেয়ে বেশি ঠেলা লাগল: ১৪.৭ নিউটনে ব্লক সরল');
  expect(await text('[data-example="w1"] .pvc-ex-res')).toBe('১৪.৭ নিউটন');
  expect(await text('.pvc-rule')).toContain('ওজন বসালে ঘর্ষণ আরও বাড়ে');

  // step 4: the zoom-in opens; the note says it is not to scale
  await fig.frame.locator('.pvc-act').click();
  await run(1500);
  expect((await fig.call('get')).lens).toBe(true);
  expect(await text('.pvc-rule')).toContain('এবড়োখেবড়ো');
  expect(await text('.ff-lens-cap')).toContain('আকার প্রকৃত অনুপাতে নয়');

  // the row of words: two weights, then none (the block goes back to the middle each time)
  await fig.call('set', { load: 2 });
  await run(900);
  expect(await fig.call('get')).toMatchObject({ load: 2, limit: 19.6, block: 0, phase: 'rest' });
  await fig.frame.locator('[data-example="w0"]').click();
  await run(300);
  expect(await fig.call('get')).toMatchObject({ load: 0, limit: 9.8 });

  // step 5: rubbing: friction against the motion, the surfaces warm up
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(2600, 50);
  const rub = await fig.call('get');
  expect(rub.phase).toBe('rub');
  expect(await text('.pvc-outcome')).toContain('ঘষ');
  await fig.advance(2200, 50);
  expect((await fig.call('get')).heat).toBeGreaterThan(0.5);
  await fig.advance(800, 50);
  expect(await fig.call('get')).toMatchObject({ phase: 'done', next: 'again' });
  expect(await text('.pvc-act')).toContain('আবার ঠেলা দাও');
  expect(await text('.pvc-act-badge')).toBe('');

  // reset brings everything back
  await fig.call('reset');
  await run(300);
  const back = await fig.call('get');
  expect(back).toMatchObject({ load: 0, side: 'left', phase: 'rest', lens: false, heat: 0, next: 'push' });
  expect(back.moved).toEqual({ 0: null, 1: null, 2: null });
  expect(await text('.pvc-act-badge')).toBe('১');
  expect(log.errors).toEqual([]);
});

test('friction-force: the test sets up five scenes and marks the answers', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'friction-force', { params: { mode: 'quiz' } });
  const run = (ms) => fig.advance(ms, 100);
  const texts = new Set();
  let right = 0;
  await run(1500);
  for (let q = 0; q < 5; q++) {
    await run(1500);
    const ask = await fig.frame.locator('.pvc-q-text').textContent();
    texts.add(ask.slice(0, 20));
    expect(await fig.frame.locator('.pvc-opt').count()).toBe(4);
    // the learn controls are locked: a push request is ignored during the test
    const before = await fig.call('get');
    await fig.call('set', { load: 2 });
    expect((await fig.call('get')).load).toBe(before.load);
    // the right answer is marked after a tap (find it by trying each choice in turn across the questions)
    await fig.frame
      .locator('.pvc-opt')
      .nth(q % 4)
      .click();
    await run(300);
    const tone = await fig.frame.locator('.pvc-q-feedback').getAttribute('data-tone');
    expect(['ok', 'bad']).toContain(tone);
    if (tone === 'ok') right++;
    expect((await fig.frame.locator('.pvc-q-feedback').textContent()).length).toBeGreaterThan(20);
    expect(await fig.frame.locator('.pvc-opt.right').count()).toBe(1);
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  await run(300);
  expect(texts.size).toBe(5); // five different questions
  expect(await fig.frame.locator('.pvc-q-result').textContent()).toContain('টির মধ্যে');
  expect(right).toBeLessThanOrEqual(5);
  // leaving the test gives the learn view back
  await fig.frame.locator('[data-mode="explore"]').click();
  await run(500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', phase: 'rest', load: 0 });
  expect(log.errors).toEqual([]);
});
