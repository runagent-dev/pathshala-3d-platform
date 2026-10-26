// Newton's third law through the bridge (book pages 84–86, topic 3.8): two skaters push each other with the same 10 N
// (an arrow on each body while the hands touch, none before and after), both move off, and with unequal masses the
// lighter one goes twice as far; the apple and the Earth feel the same 9.8 N while it falls, the Earth's acceleration
// is 1.64 × 10⁻²⁴ ms⁻². The clean panel: the small result under each word, the result line, the rule growing to the
// book's boxed law (word for word, the last step), the big numbered button offering the next pair (its ring only while
// they stand ready, never in the test). Every test question sets up its own scene; reset brings everything back.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('newtons-third-law: equal and opposite forces on two bodies, the lighter one moves more', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'newtons-third-law');
  const text = async (sel) => (await fig.frame.locator(sel).first().textContent()).replace(/ /g, ' ');

  // at the start: equal masses, standing ready, no force
  const start = await fig.call('get');
  expect(start).toMatchObject({ example: 'equal', scene: 'skaters', phase: 'rest', force: 0, masses: { A: 50, B: 50 } });
  expect(start.arrows).toEqual({ onA: false, onB: false });
  expect(start.next).toEqual({ example: 'equal', step: 1 });
  expect(await text('.pvc-rule')).toContain('একজন আরেকজনকে ধাক্কা দিলে কী হবে');
  expect(await text('.pvc-act-badge')).toBe('১');
  expect(await text('.pvc-act')).toContain('ধাক্কা দাও');
  expect(await fig.frame.locator('.pvc-act-marker.in:not(.pvc-act-under)').count()).toBe(1); // the ring on the hands
  await fig.advance(3000); // nobody pushed: nothing happens however long we wait
  expect(await fig.call('get')).toMatchObject({ phase: 'rest', moved: { A: 0, B: 0 } });

  // the push: 10 N on each, an arrow on each body, 0.2 ms⁻², they move apart equally
  await fig.call('set', { push: true });
  await fig.advance(1450); // 0.45 s standing ready, then 1 s of pushing
  const push = await fig.call('get');
  expect(push).toMatchObject({ phase: 'push', force: 10, arrows: { onA: true, onB: true }, acceleration: { A: 0.2, B: 0.2 } });
  expect(push.moved.A).toBeGreaterThan(0.05);
  expect(push.moved.A).toBeCloseTo(push.moved.B, 3); // equal masses, equal motion
  expect(push.position.A).toBeLessThan(0);
  expect(push.position.B).toBeGreaterThan(0);
  expect(await text('.pvc-outcome')).toBe('A ধাক্কা দিচ্ছে B-কে, B-ও ধাক্কা দিচ্ছে A-কে: সমান জোরে, ১০ নিউটন করে');
  expect(await text('.pvc-rule')).toContain('A ধাক্কা দেয় B-কে, B-ও ধাক্কা দেয় A-কে, সমান জোরে');
  expect(await fig.frame.locator('.pvc-act-marker.in:not(.pvc-act-under)').count()).toBe(0); // no ring while it moves
  await fig.advance(100); // the labels fade in on the next frame
  const labels = await fig.frame.locator('.pvc-anno.in').allTextContents();
  expect(labels.join('|')).toContain('A-এর ওপর বল');
  expect(labels.join('|')).toContain('B-এর ওপর বল');
  // after the push there is no force; each goes on at the speed it reached
  await fig.advance(1500);
  const glide = await fig.call('get');
  expect(glide).toMatchObject({ phase: 'glide', force: 0, arrows: { onA: false, onB: false } });
  expect(glide.speed.A).toBeCloseTo(0.283, 2);
  expect(glide.speed.A).toBeCloseTo(glide.speed.B, 3);
  await fig.advance(1500);
  expect((await fig.call('get')).tried.equal).toBe(true);
  expect(await text('.pvc-outcome')).toContain('সমান সরে গেল');
  expect(await text('[data-example="equal"] .pvc-ex-res')).toBe('সমান সরে');
  expect((await fig.call('get')).next).toEqual({ example: 'unequal', step: 2 }); // the button offers the next pair
  expect(await text('.pvc-act-badge')).toBe('২');
  expect(await text('.pvc-act')).toContain('হালকা ও ভারীকে ধাক্কা দাও');
  // they leave the picture and stand ready again
  await fig.advance(4000);
  expect(await fig.call('get')).toMatchObject({ phase: 'rest', moved: { A: 0, B: 0 } });

  // light and heavy: the same 10 N, the lighter goes twice as far (jumping into the glide)
  await fig.call('set', { example: 'unequal', at: 1.2 });
  const mid = await fig.call('get');
  expect(mid).toMatchObject({ example: 'unequal', phase: 'push', force: 10, masses: { A: 50, B: 100 }, acceleration: { A: 0.2, B: 0.1 } });
  expect(mid.moved.A / mid.moved.B).toBeCloseTo(2, 2);
  await fig.call('set', { example: 'unequal', at: 3 });
  const after = await fig.call('get');
  expect(after).toMatchObject({ phase: 'glide', force: 0 });
  expect(after.moved.A / after.moved.B).toBeCloseTo(2, 1);
  await fig.advance(3000);
  expect(await text('.pvc-outcome')).toContain('২ গুণ বেশি');
  expect(await text('.pvc-rule')).toContain('বল সমান, তবু হালকা জন বেশি সরে');

  // the apple: the same 9.8 N on the apple and on the Earth while it falls; the Earth's acceleration is tiny
  await fig.call('set', { example: 'apple' });
  expect((await fig.call('get')).phase).toBe('rest');
  await fig.call('set', { push: true, at: 0.5 });
  const fall = await fig.call('get');
  expect(fall).toMatchObject({ scene: 'apple', phase: 'fall', force: 9.8, arrows: { onApple: true, onEarth: true } });
  expect(fall.acceleration.apple).toBe(9.8);
  expect(fall.acceleration.earth).toBeCloseTo(1.64e-24, 26);
  expect(await text('.pvc-outcome')).toContain('সমান জোরে');
  await fig.advance(4000);
  const landed = await fig.call('get');
  expect(landed).toMatchObject({ phase: 'landed', force: 0, arrows: { onApple: false, onEarth: false } });
  expect(landed.fallen).toBeCloseTo(1.4, 2);
  expect(await text('.pvc-outcome')).toContain('নড়ল না');
  expect(await text('.pvc-outcome')).not.toMatch(/×|১০/); // no powers of ten in the result line
  // all three tried: the rule is the book's boxed law, word for word, and F is named
  expect(await text('.pvc-rule')).toBe(
    'নিউটনের তৃতীয় সূত্র: যখন একটি বস্তু অন্য একটি বস্তুর ওপর বল প্রয়োগ করে তখন সেই বস্তুটিও প্রথম বস্তুটির ওপর বিপরীত দিকে সমান বল প্রয়োগ করে।',
  );
  expect(await text('[data-example="apple"] .pvc-ex-res')).toBe('পৃথিবী নড়ে না');
  // at that last step the pair of skaters' forces take the book's names F and −F (right is positive)
  await fig.call('set', { example: 'equal', at: 1 });
  await fig.advance(150);
  const named = (await fig.frame.locator('.pvc-anno.in').allTextContents()).join('|');
  expect(named).toContain('−F');
  expect(named).toMatch(/F = /);
  expect(await text('.pvc-outcome')).toContain('F আর −F');
  // the two arrows of a pair are told apart by more than colour: a solid and a dashed swatch in their labels
  expect(await fig.frame.locator('.nt-key').count()).toBe(2);
  expect(await fig.frame.locator('.nt-key.dash').count()).toBe(1);

  // back to the start
  await fig.call('set', { example: 'equal', home: true });
  expect(await fig.call('get')).toMatchObject({ example: 'equal', phase: 'rest' });

  // the test: the ring hides; every question sets up its own scene
  await fig.call('practice');
  const scenes = new Set();
  for (let q = 0; q < 5; q++) {
    for (let k = 0; k < 80 && !(await fig.frame.locator('.pvc-opt[data-q="0"]').count()); k++) await fig.advance(250);
    const ask = await text('.pvc-q-text');
    const st = await fig.call('get');
    expect(st.mode).toBe('quiz');
    expect(await fig.frame.locator('.pvc-act-marker').evaluateAll((els) => els.map((el) => getComputedStyle(el).visibility))).toEqual([
      'hidden',
      'hidden',
    ]);
    if (ask.includes('আপেল কী করছে')) {
      scenes.add('react');
      expect(st).toMatchObject({ scene: 'apple', phase: 'fall', arrows: { onApple: true, onEarth: false } }); // one arrow only
    } else if (ask.includes('কাটাকাটি হচ্ছে না কেন')) {
      scenes.add('cancel');
      expect(st).toMatchObject({ scene: 'skaters', phase: 'push', arrows: { onA: true, onB: true } });
    } else if (ask.includes('কে বেশি সরবে')) {
      scenes.add('who');
      expect(st).toMatchObject({ scene: 'skaters', phase: 'rest', arrows: { onA: false, onB: false } });
      expect(st.masses.A).not.toBe(st.masses.B);
    } else if (ask.includes('কার ওপর জোর বেশি')) {
      scenes.add('size');
      expect(st).toMatchObject({ scene: 'skaters', phase: 'rest', arrows: { onA: false, onB: false } });
    } else {
      scenes.add('earth');
      expect(ask).toContain('তবু পৃথিবীকে নড়তে দেখি না কেন');
      expect(st).toMatchObject({ scene: 'apple', phase: 'rest' });
    }
    await fig.frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(300);
    expect(['ok', 'bad']).toContain(await fig.frame.locator('.pvc-q-feedback').getAttribute('data-tone'));
    await fig.frame.locator('[data-act="q-next"]').click();
    await fig.advance(300);
  }
  expect(scenes.size).toBe(5); // five kinds, one each

  await fig.call('reset');
  await fig.advance(800);
  expect(await fig.call('get')).toMatchObject({
    example: 'equal',
    phase: 'rest',
    mode: 'explore',
    view: 'front',
    tried: { equal: false, unequal: false, apple: false },
  });
  expect(log.errors).toEqual([]);
});
