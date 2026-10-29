// How we walk (book p86, topic 3.8, চিত্র ৩.১২) through the bridge: the student waits at rest on firm ground; the one action
// takes the slowed-down push-off and holds at the telling moment, where the foot's push on the ground (F) and the
// ground's push on the student (−F) are drawn, named, and equal; the action then goes on to the sand (the sand
// gives way: a smaller push, the foot slides back a little) and the slippery floor (the foot slides back a lot, the push
// is small); the rule grows to the page's last sentences; the panel button, a tap on the student and the keyboard
// work; the test shows each scene and names the arrows with the answer. Runs with `npm run test:figures` (dev-only
// folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('walking-third-law: push, hold, F and −F, three grounds, the rule grows, test', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'walking-third-law');
  const frame = fig.frame;

  expect(await fig.call('get')).toMatchObject({
    ground: 'hard',
    phase: 'rest',
    push: 100,
    moved: 0,
    speed: 0,
    arrows: false,
    tried: {},
    next: { ground: 'hard', step: 1 },
  });
  await expect(frame.locator('.pvc-act')).toContainText('শক্ত মাটিতে পা দিয়ে ধাক্কা দাও');
  await expect(frame.locator('.pvc-act-marker.pvc-act-under')).toHaveClass(/\bin\b/); // the ring round the pushing foot
  await expect(frame.locator('.pvc-outcome')).toContainText('স্থির দাঁড়িয়ে আছে');
  await expect(frame.locator('.pvc-rule')).toContainText('কেউ আমাদের ধাক্কা দেয় না');
  await expect(frame.locator('.wtl-note')).toBeHidden();

  // firm ground: the big button pushes; slowed down, then held at the telling moment
  await frame.locator('.pvc-act').click();
  await fig.advance(900);
  let st = await fig.call('get');
  expect(st.phase).toBe('push');
  expect(st.arrows).toBe(true);
  await expect(frame.locator('.wtl-note')).toContainText('সময় ৪ গুণ ধীর');
  await expect(frame.locator('.pvc-act')).toBeDisabled();
  await fig.advance(2200);
  st = await fig.call('get');
  expect(st).toMatchObject({
    phase: 'held',
    time: 0.6,
    push: 100,
    acceleration: 2,
    speed: 1.2,
    moved: 0.36,
    slipped: 0,
    arrows: true,
    tried: { hard: true },
  });
  await expect(frame.locator('.wtl-note')).toContainText('থামিয়ে দেখানো');
  // both pushes, in plain words where they act (the symbols F and −F come only when all three grounds are found)
  const labels = frame.locator('.pvc-anno-force');
  await expect(labels).toHaveCount(2);
  await expect(labels.nth(0)).toHaveText('পা মাটিকে ধাক্কা দিচ্ছে');
  await expect(labels.nth(1)).toHaveText('মাটি মানুষটিকে ধাক্কা দিচ্ছে');
  await expect(frame.locator('.pvc-outcome')).toContainText('পা মাটিকে ধাক্কা দিল, মাটি মানুষটিকে ধাক্কা দিল');
  await expect(frame.locator('.pvc-outcome b')).toHaveText('১০০ নিউটন');
  await expect(frame.locator('[data-example="hard"] .pvc-ex-res')).toHaveText('১০০ নিউটন');
  await expect(frame.locator('.pvc-rule')).toContainText('পা মাটিকে পেছনে, মাটি আমাদের সামনে ধাক্কা দেয়');
  // the action now goes on to the sand, step 2; the ring is gone
  expect(st.next).toEqual({ ground: 'sand', step: 2 });
  await expect(frame.locator('.pvc-act')).toContainText('বালুতে পা দিয়ে ধাক্কা দাও');
  await expect(frame.locator('[data-example="sand"]')).toHaveClass(/\bnext\b/);
  await expect(frame.locator('.pvc-act-marker.pvc-act-under')).not.toHaveClass(/\bin\b/);

  // loose sand: the same button; the sand gives way, a smaller push, the foot slides back a little
  await fig.call('set', { act: true });
  await fig.advance(3400);
  st = await fig.call('get');
  expect(st).toMatchObject({
    ground: 'sand',
    phase: 'held',
    push: 50,
    acceleration: 1,
    speed: 0.6,
    moved: 0.18,
    slipped: 0.18,
    tried: { hard: true, sand: true },
  });
  await expect(frame.locator('.pvc-outcome')).toContainText('বালু সরে গেল');
  await expect(frame.locator('.pvc-outcome b')).toHaveText('৫০ নিউটন');
  await expect(frame.locator('.pvc-rule')).toContainText('বালু সরে যায়');
  expect(st.next).toEqual({ ground: 'slip', step: 3 });

  // a floor made slippery: the foot slides back a lot, the push is small, the student hardly moves
  await fig.call('set', { act: true });
  await fig.advance(3400);
  st = await fig.call('get');
  expect(st).toMatchObject({
    ground: 'slip',
    phase: 'held',
    push: 20,
    acceleration: 0.4,
    moved: 0.072,
    slipped: 0.288,
    tried: { hard: true, sand: true, slip: true },
  });
  await expect(frame.locator('.pvc-outcome')).toContainText('পা পিছলে গেল');
  await expect(frame.locator('.pvc-outcome b')).toHaveText('২০ নিউটন');
  // all three found: the slippery floor's own line stays, the book's sentence comes under it, and the two pushes get the
  // book's names F and −F (same colours, same places)
  await expect(frame.locator('.pvc-rule')).toContainText('ঘর্ষণ খুব কম');
  await expect(frame.locator('.pvc-rule')).toContainText('বিপরীত এবং সমান বল পাওয়া যায়');
  await expect(labels.nth(0)).toHaveText('F পা মাটিকে ধাক্কা দিচ্ছে');
  await expect(labels.nth(1)).toHaveText('−F মাটি মানুষটিকে ধাক্কা দিচ্ছে');
  // the action replays, without a number
  expect(st.next).toEqual({ ground: 'slip', step: '' });
  await expect(frame.locator('.pvc-act')).toContainText('আবার ধাক্কা দাও');
  await frame.locator('[data-act="home"]').click();
  expect(await fig.call('get')).toMatchObject({ phase: 'rest', moved: 0, arrows: false });
  await expect(frame.locator('.pvc-rule')).toContainText('ঘর্ষণ খুব কম');
  await expect(frame.locator('.pvc-rule')).toContainText('বিপরীত এবং সমান বল পাওয়া যায়');
  await expect(frame.locator('.pvc-anno-force')).toHaveCount(0);
  // the slippery floor on its own (found first): its own sentence, no symbols yet
  await fig.call('set', { ground: 'slip', tried: [], at: 'hold', animate: false });
  await expect(frame.locator('.pvc-rule')).toContainText('ঘর্ষণ খুব কম');
  await expect(frame.locator('.pvc-anno-force').nth(0)).toHaveText('পা মাটিকে ধাক্কা দিচ্ছে');
  await expect(frame.locator('.pvc-rule')).not.toContainText('বিপরীত এবং সমান বল পাওয়া যায়');

  // a tap on the student pushes too (the ring lets the touch through)
  await fig.call('set', { ground: 'hard', tried: [], at: 'rest', animate: false });
  const ring = await frame.locator('.pvc-act-ringbox svg').boundingBox();
  expect(ring).not.toBeNull();
  await page.mouse.click(ring.x + ring.width / 2, ring.y + ring.height / 2);
  await fig.advance(3200);
  expect((await fig.call('get')).phase).toBe('held');

  // the keyboard: 2 chooses the sand, space pushes
  await frame.locator('#app').focus();
  await page.keyboard.press('2');
  expect(await fig.call('get')).toMatchObject({ ground: 'sand', phase: 'rest' });
  await page.keyboard.press(' ');
  await fig.advance(3200);
  expect((await fig.call('get')).phase).toBe('held');

  // the test: five questions, each scene set up; the arrows are named only with the answer
  await fig.call('practice');
  const seen = new Set();
  for (let i = 0; i < 5; i++) {
    await fig.advance(1200);
    const text = await frame.locator('.pvc-q-text').textContent();
    const kind = text.includes('কোন তীরটি')
      ? 'which'
      : text.includes('কত নিউটন')
        ? 'equal'
        : text.includes('উল্টো দিকে')
          ? 'cancel'
          : text.includes('প্রায় এগোল না')
            ? 'slip'
            : 'who';
    seen.add(kind);
    const before = await fig.call('get');
    if (kind === 'which' || kind === 'cancel') {
      await expect(frame.locator('.pvc-anno-letter')).toHaveCount(2); // two grey arrows with letters, not named
      await expect(frame.locator('.pvc-anno-force')).toHaveCount(0);
    } else if (kind === 'equal') {
      await expect(frame.locator('.pvc-anno-force').first()).toContainText('নিউটন'); // the foot's push is read off the picture
    } else if (kind === 'slip') {
      expect(before.arrows).toBe(false); // the scene shows the foot and the ground, not the arrows
      expect(before.slipped).toBeGreaterThan(0.15);
    } else {
      expect(before.arrows).toBe(false); // the student mid-push; the pushes are named with the answer
    }
    expect(before.phase).toBe('held');
    // a tap or a key in the test does nothing and puts no hint over the picture
    await page.keyboard.press('r');
    await expect(frame.locator('.pvc-hint.show')).toHaveCount(0);
    expect((await fig.call('get')).phase).toBe('held');
    await expect(frame.locator('.pvc-opt')).toHaveCount(4);
    await frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(600);
    await expect(frame.locator('.pvc-opt.right')).toHaveCount(1); // one right answer
    await expect(frame.locator('.pvc-anno-force')).toHaveCount(2); // the answer names F and −F
    expect((await fig.call('get')).arrows).toBe(true);
    await frame.locator('[data-act="q-next"]').click();
  }
  expect(seen.size).toBe(5); // each of the five questions comes once
  await fig.advance(800);
  await expect(frame.locator('.pvc-q-result')).toContainText('৫টির মধ্যে');

  await fig.call('reset');
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ ground: 'hard', phase: 'rest', tried: {}, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});

test('walking: the enlarged contact, pause, timeline and explanation use the same forces and pose', async ({ page }) => {
  const log = await preparePage(page);
  await page.setViewportSize({ width: 800, height: 500 });
  const fig = await openFigure(page, 'walking-third-law');
  await fig.call('set', { ground: 'sand', at: 1.2, paused: true });
  const s = await fig.call('get');
  expect(s).toMatchObject({ paused: true, forces: { onGround: -50, onPerson: 50 }, acceleration: 1 });
  const geometry = await fig.frame.evaluate(async () => {
    const { Box3, Vector3 } = await import('three');
    const model = /** @type {any} */ (window).figure.exportRoot();
    model.updateMatrixWorld(true);
    const original = model.getObjectByName('RearShoe'),
      detail = model.getObjectByName('EnlargedRearShoe');
    const a = model.getObjectByName('ContactForceOnGround'),
      b = model.getObjectByName('ContactForceOnPerson');
    return {
      pose: Math.abs(original.quaternion.dot(detail.quaternion)),
      a: new Box3().setFromObject(a).getSize(new Vector3()).x,
      b: new Box3().setFromObject(b).getSize(new Vector3()).x,
      contact: model.getObjectByName('GripContactPoint').position.x,
    };
  });
  expect(geometry.pose).toBeCloseTo(1, 6);
  expect(geometry.a).toBeCloseTo(geometry.b, 6);
  expect(geometry.contact).toBeCloseTo(-s.slipped * 2.3, 2);
  await fig.advance(500);
  expect((await fig.call('get')).time).toBe(s.time);
  await fig.frame.locator('[data-act="pause"]').click();
  await fig.advance(300);
  expect((await fig.call('get')).time).toBeGreaterThan(s.time);
  await fig.frame.locator('[data-act="explain"]').click();
  const held = (await fig.call('get')).time;
  await fig.advance(300);
  expect((await fig.call('get')).time).toBe(held);
  await expect(fig.frame.locator('.wtl-dialog')).toContainText('ভিন্ন বস্তুর উপর');
  await fig.frame.locator('.wtl-dialog').press('Escape');
  await fig.advance(300);
  expect((await fig.call('get')).time).toBeGreaterThan(held);
  await fig.frame.locator('[data-moment="0.9"]').click();
  expect(await fig.call('get')).toMatchObject({ paused: true, time: 0.225 });
  await fig.call('practice');
  await fig.advance(300);
  const before = await fig.call('get');
  await fig.call('set', { at: 0, paused: false, view: '3d' });
  expect(await fig.call('get')).toMatchObject({ phase: before.phase, view: 'front', mode: 'quiz' });
  expect(log.errors).toEqual([]);
});

test('walking: detailed lesson and explanations fit six frames in Bangla and English', async ({ page }) => {
  test.setTimeout(300000);
  const log = await preparePage(page);
  for (const lang of ['bn', 'en'])
    for (const [width, height] of [
      [390, 700],
      [390, 520],
      [844, 390],
      [640, 400],
      [800, 500],
      [1280, 800],
    ]) {
      await page.setViewportSize({ width, height });
      const fig = await openFigure(page, 'walking-third-law', { params: { lang } });
      for (const state of [
        { ground: 'hard', at: 'rest' },
        { ground: 'hard', at: 0.9 },
        { ground: 'hard', at: 'hold' },
        { ground: 'sand', at: 'hold' },
        { ground: 'slip', at: 'hold', tried: 'all' },
      ]) {
        await fig.call('set', { ...state, paused: true, animate: false });
        await fig.advance(100);
        const report = await fig.frame.evaluate(() => {
          const bad = [];
          const labels = [];
          for (const e of document.querySelectorAll('.pvc-learn button,.wtl-analysis,.wtl-timeline,.pvc-rule,.pvc-anno')) {
            const cs = getComputedStyle(e);
            if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
            const r = e.getBoundingClientRect();
            if (!r.width || !r.height) continue;
            if (r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1 || e.scrollWidth > e.clientWidth + 1)
              bad.push(e.textContent);
            if (e.matches('.pvc-anno-force')) labels.push(r.toJSON());
          }
          const corner = document.querySelector('.pvc-corner').getBoundingClientRect();
          const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
          return {
            bad,
            overlap: labels.some((r) => overlap(r, corner)) || (labels.length === 2 && overlap(labels[0], labels[1])),
            overflow: document.querySelector('.pvc-panel').scrollHeight - document.querySelector('.pvc-panel').clientHeight,
            stage: document.querySelector('.pvc-stage').getBoundingClientRect().height,
          };
        });
        expect(report, `${lang} ${width}x${height} ${JSON.stringify(state)}`).toMatchObject({ bad: [], overlap: false, overflow: 0 });
        expect(report.stage).toBeGreaterThan(145);
      }
      await fig.frame.locator('[data-act="explain"]').click();
      for (const tab of ['pair', 'grip']) {
        await fig.frame.locator(`[data-explanation="${tab}"]`).click();
        const dialog = await fig.frame.locator('.wtl-dialog').evaluate((e) => {
          const r = e.getBoundingClientRect();
          return { overflow: e.scrollHeight - e.clientHeight, inside: r.top >= 0 && r.bottom <= innerHeight + 1 };
        });
        expect(dialog, `${lang} ${width}x${height} ${tab}`).toEqual({ overflow: 0, inside: true });
      }
      await fig.frame.locator('[data-act="explain-close"]').click();
    }
  expect(log.errors).toEqual([]);
});
