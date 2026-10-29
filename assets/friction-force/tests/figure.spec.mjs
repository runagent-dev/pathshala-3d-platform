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
  const fig = await openFigure(page, 'friction-force', { params: { lens: '0' } });
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
  expect(await text('.pvc-act')).toContain('বাক্সটিকে টান দাও');
  expect(await text('.pvc-act-badge')).toBe('১');
  expect(await fig.frame.locator('.pvc-act-marker.in:not(.pvc-act-under)').count()).toBe(1); // the ring is on the block

  // step 1: a tap on the button; the gentle push is held: the block does not move, friction equals the push
  await fig.frame.locator('.pvc-act').click();
  await run(1600);
  const hold = await fig.call('get');
  expect(hold).toMatchObject({ phase: 'hold', push: 5, friction: 5, block: 0 });
  expect(await text('.pvc-outcome')).toBe('বাক্স নড়ছে না: ঘর্ষণ টানের সমান, দুটোই ৫ নিউটন');
  expect(await fig.frame.locator('.pvc-anno').allTextContents()).toEqual(expect.arrayContaining(['টান', 'ঘর্ষণ'])); // plain words, no symbols yet
  expect(await fig.frame.locator('.pvc-act-marker.in:not(.pvc-act-under)').count()).toBe(0); // no ring while it runs
  // the big button keeps its words and stays pressable while it runs: a tap says the push is on
  expect(await fig.frame.locator('.pvc-act').isEnabled()).toBe(true);
  expect(await text('.pvc-act')).toContain('বাক্সটিকে টান দাও');
  await fig.frame.locator('.pvc-act').click();
  await run(100);
  expect(await fig.frame.locator('.pvc-hint.show').count()).toBe(1);
  expect(await fig.call('get')).toMatchObject({ phase: 'hold' }); // the tap did not start another push
  // growing at 6 N/s: friction stays equal to the push at every moment, the block still does not move
  for (let i = 0; i < 3; i++) {
    await run(300);
    const s = await fig.call('get');
    if (s.phase !== 'climb') continue;
    expect(s.friction).toBe(s.push);
    expect(s.push).toBeLessThan(9.8);
    expect(s.block).toBe(0);
  }
  await run(500);
  // the block gave way: friction stays at the most (9.8 N), the push goes on past it, the block speeds up
  const slip = await fig.call('get');
  expect(slip.phase).toBe('slip');
  expect(slip.friction).toBe(9.8);
  expect(slip.push).toBeGreaterThan(9.8);
  expect(slip.push).toBeLessThanOrEqual(12.2);
  expect(slip.block).toBeGreaterThan(0);
  expect(slip.moved[0]).toBe(9.8);
  expect(await text('.pvc-outcome')).toBe('টান ৯.৮ নিউটনের বেশি, মানে ঘর্ষণের চেয়ে বেশি হতেই বাক্স গতি পেল');
  expect(await text('.pvc-act')).toContain('বাক্সটিকে টান দাও'); // not the next step yet

  expect(await text('.pvc-rule')).toContain('টান বাড়লে ঘর্ষণও ততটা বাড়ে');
  expect(await fig.frame.locator('.pvc-anno').allTextContents()).toEqual(expect.arrayContaining(['টান F', 'ঘর্ষণ f'])); // the symbols, now
  await run(1500);
  const done = await fig.call('get');
  expect(done).toMatchObject({ phase: 'done', push: 0, friction: 0, next: 'other' }); // the hand let go, friction stopped the block
  expect(done.block).toBeGreaterThan(0.15);
  expect(done.block).toBeLessThan(0.25);
  expect(await text('[data-example="w0"] .pvc-ex-res')).toBe('সরাতে ৯.৮ নিউটন');
  expect(await text('.pvc-act-badge')).toBe('২');
  expect(await text('.pvc-act')).toContain('উল্টো দিক থেকে টান');

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
  expect(await text('.pvc-outcome')).toBe('আগের চেয়ে বেশি টান লাগল: ১৪.৭ নিউটনের বেশি টানে বাক্স গতি পেল');
  expect(await text('[data-example="w1"] .pvc-ex-res')).toBe('সরাতে ১৪.৭ নিউটন');
  expect(await text('.pvc-rule')).toContain('ওজন বসালে ঘর্ষণ আরও বাড়ে');

  // step 4: the zoom-in opens; the note says it is not to scale
  await fig.frame.locator('.pvc-act').click();
  await run(1500);
  expect((await fig.call('get')).lens).toBe(true);
  expect(await text('.pvc-rule')).toContain('উঁচুনিচু');
  expect(await text('.ff-lens-cap')).toContain('আকার প্রকৃত অনুপাতে নয়');
  // the first look names what is there and asks for the comparison; the comparison comes once the weight is changed
  expect(await text('.pvc-outcome')).toContain('ওজন বদলে দেখো');
  expect(await text('.pvc-outcome')).not.toContain('আরও');

  // the row of words: two weights, then none (the block goes back to the middle each time)
  await fig.call('set', { load: 2 });
  await run(900);
  expect(await fig.call('get')).toMatchObject({ load: 2, limit: 19.6, block: 0, phase: 'rest' });
  expect(await text('.pvc-outcome')).toBe('ওজন বাড়াতেই খাঁজ আরও গভীরে ঢুকল');
  await fig.frame.locator('[data-example="w0"]').click();
  await run(300);
  expect(await text('.pvc-outcome')).toBe('ওজন কমাতেই খাঁজ আলগা হল');
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
  expect(await text('.pvc-act')).toContain('আবার টান দাও');
  expect(await text('.pvc-act-badge')).toBe('');

  // a held push (for pictures, and the poster): the block stays still, friction equals it, the button is normal
  await fig.call('reset');
  await fig.call('set', { load: 1, hold: 9, lens: true });
  await run(600);
  expect(await fig.call('get')).toMatchObject({ load: 1, phase: 'hold', push: 9, friction: 9, block: 0, lens: true });
  expect(await fig.frame.locator('.pvc-act').isEnabled()).toBe(true);

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
    const directionQuestion = ask.includes('কোন দিকে');
    const opposite = before.side === 'left' ? 'বাম দিকে' : 'ডান দিকে';
    if (directionQuestion) await fig.frame.locator('.pvc-opt').filter({ hasText: opposite }).click();
    else
      await fig.frame
        .locator('.pvc-opt')
        .nth(q % 4)
        .click();
    await run(300);
    const tone = await fig.frame.locator('.pvc-q-feedback').getAttribute('data-tone');
    expect(['ok', 'bad']).toContain(tone);
    if (directionQuestion) {
      expect(tone).toBe('ok');
      await expect(fig.frame.locator('.pvc-q-feedback')).toContainText(opposite);
    }
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

test('friction-force: pause freezes the rubbing and heat, reset restores the contact window, and GLB includes the puller', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'friction-force');
  expect((await fig.call('get')).lens).toBe(true);
  await fig.call('set', { rub: 1, paused: true });
  const frozen = await fig.call('get');
  await fig.advance(1200, 100);
  expect(await fig.call('get')).toMatchObject({ block: frozen.block, heat: frozen.heat, phase: 'rub', paused: true });
  await fig.frame.locator('[data-act="pause"]').click();
  await fig.advance(400, 50);
  const running = await fig.call('get');
  expect(running.paused).toBe(false);
  expect(running.heat).toBeGreaterThan(frozen.heat);
  expect(running.block).not.toBe(frozen.block);
  await fig.call('set', { lens: false });
  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ phase: 'rest', lens: true, paused: false, heat: 0 });
  for (const [side, person, other] of [
    ['left', 'RightPuller', 'LeftPuller'],
    ['right', 'LeftPuller', 'RightPuller'],
  ]) {
    await fig.call('set', { side, load: 1, hold: 9, animate: false });
    const glb = await fig.call('export-glb');
    const bytes = Buffer.from(glb.base64, 'base64');
    const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
    const names = json.nodes.map((n) => n.name);
    expect(names).toContain(person);
    expect(names).not.toContain(other);
    for (const name of ['AnatomicalHead', 'HandNear', 'HandFar', 'TensionRope', 'RopeGrip']) expect(names).toContain(name);
    expect(names.some((n) => /rod|pad/i.test(n || ''))).toBe(false);
  }
  expect(log.errors).toEqual([]);
});

test('friction-force: both languages keep the panel and contact caption visible across frames and lesson states', async ({ page }) => {
  test.setTimeout(240_000);
  const log = await preparePage(page);
  for (const lang of ['bn', 'en']) {
    await page.setViewportSize({ width: 800, height: 500 });
    const fig = await openFigure(page, 'friction-force', { params: { lang } });
    for (const [width, height] of [
      [390, 700],
      [390, 520],
      [844, 390],
      [640, 400],
      [800, 500],
      [1280, 800],
    ]) {
      await page.setViewportSize({ width, height });
      for (const state of [
        { load: 0, side: 'left', hold: 5, lens: true },
        { load: 2, side: 'right', hold: 19, lens: true },
        { rub: 3, lens: true },
        { hold: 9, lens: false },
      ]) {
        await fig.call('set', { ...state, animate: false, paused: true });
        await fig.advance(150);
        const report = await fig.frame.evaluate(() => {
          const panel = document.querySelector('.pvc-panel');
          const stage = document.querySelector('.pvc-stage').getBoundingClientRect();
          const visible = [...document.querySelectorAll('.pvc-panel button, .pvc-rule, .ff-live, .ff-lens-cap.on')].filter(
            (el) => el.getClientRects().length && !el.closest('[hidden]') && getComputedStyle(el).visibility !== 'hidden',
          );
          return {
            overflow: panel.scrollHeight - panel.clientHeight,
            height: stage.height,
            clipped: visible
              .filter((el) => {
                const r = el.getBoundingClientRect();
                return r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1;
              })
              .map((el) => el.className),
          };
        });
        expect(report.overflow, `${lang} ${width}×${height} panel`).toBeLessThanOrEqual(1);
        expect(report.height).toBeGreaterThan(150);
        expect(report.clipped, `${lang} ${width}×${height}`).toEqual([]);
      }
    }
  }
  expect(log.errors).toEqual([]);
  expect(log.external).toEqual([]);
});
