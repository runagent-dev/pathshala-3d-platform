// Newton's first law through the bridge (book p64, topic 3.1): a book at rest stays at rest; the same push sends it
// 1.31 m on the mat, 2.55 m on wood, 9.18 m on ice, each slowing evenly (then the view looks down the lane); with no
// friction its velocity stays 3 m/s for as long as we watch. The clean panel: the distance under each floor's word,
// the result line, the rule growing up to the book's first law, the big numbered button offering the next floor (and
// its ring on the book, hidden while it moves and in the test). Every test question sets up its own scene; reset
// brings everything back.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('newtons-first-law: friction stops the book, without friction it keeps its velocity', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'newtons-first-law');
  const text = async (sel) => (await fig.frame.locator(sel).first().textContent()).replace(/\u00a0/g, ' ');

  const start = await fig.call('get');
  expect(start).toMatchObject({ surface: 'mat', phase: 'rest', speed: 0, distance: 0, results: { mat: null, wood: null, ice: null, none: null } });
  // at rest, with no push, nothing happens however long we wait
  await fig.advance(3000);
  expect(await fig.call('get')).toMatchObject({ phase: 'rest', speed: 0, distance: 0 });

  // the mat: pushed (0.2 s), then slowing evenly: half-way through the slide it goes at half the speed
  // at rest: step ১, the rule says the push is the same every time
  expect((await fig.call('get')).next).toEqual({ surface: 'mat', step: 1 });
  expect(await text('.pvc-rule')).toContain('প্রতিবার একই ধাক্কা: বইটি ৩ মি/সে বেগে ছাড়া পায়');
  await fig.call('set', { push: true });
  await fig.advance(100);
  expect((await fig.call('get')).phase).toBe('push');
  // while the paddle pushes, the rule says so (never "the velocity does not change" yet)
  expect(await text('.pvc-rule')).toContain('ধাক্কার বল বইটির বেগ বাড়াচ্ছে');
  expect((await fig.call('get')).next.step).toBe(''); // "আবার ধাক্কা দাও", no number
  await fig.advance(100 + 437);
  const mid = await fig.call('get');
  expect(mid.phase).toBe('slide');
  expect(mid.speed).toBeGreaterThan(1.4);
  expect(mid.speed).toBeLessThan(1.6);
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ phase: 'stopped', speed: 0, distance: 1.31, results: { mat: 1.31 } });
  // a moment later the view pulls back down the lane, every stop in sight
  await fig.advance(1500);
  expect((await fig.call('get')).camera).toBe('overview');
  // the panel: the distance under মাদুর, the result line, the rule about the mat's friction; the big button (and the
  // numbered ring on the book) now offer the next floor, ২ কাঠের মেঝেতে
  expect(await text('[data-example="mat"] .pvc-ex-res')).toBe('১.৩১ মি');
  expect(await text('.pvc-outcome')).toBe('মাদুরে বইটি ১.৩১ মি গিয়ে থামল');
  expect(await text('.pvc-rule')).toContain('মাদুরের ঘর্ষণ বইটিকে তাড়াতাড়ি থামাল');
  expect((await fig.call('get')).next).toEqual({ surface: 'wood', step: 2 });
  expect(await text('.pvc-act-badge')).toBe('২');
  expect(await text('.pvc-act')).toContain('কাঠের মেঝেতে চালাও');
  expect(await fig.frame.locator('[data-example="wood"].next').count()).toBe(1); // the word it will choose is marked
  expect(await fig.frame.locator('.pvc-act-marker.in:not(.pvc-act-under)').count()).toBe(1);
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(1500); // the view flies back to the start (0.9 s), then the push
  expect(await fig.call('get')).toMatchObject({ surface: 'wood', phase: 'slide' });
  expect(await fig.frame.locator('.pvc-act-marker.in:not(.pvc-act-under)').count()).toBe(0); // no ring while it moves
  await fig.advance(3000);
  expect(await fig.call('get')).toMatchObject({ phase: 'stopped', results: { wood: 2.55 } });
  expect(await text('.pvc-rule')).toContain('কাঠের মেঝেতে ঘর্ষণ মাদুরের চেয়ে কম');

  // wood and ice go farther (jumping to the end)
  await fig.call('set', { surface: 'wood', push: true, animate: false });
  expect(await fig.call('get')).toMatchObject({ surface: 'wood', phase: 'stopped', distance: 2.55 });
  await fig.call('set', { surface: 'ice', animate: false });
  await fig.call('set', { at: 2 });
  const ice = await fig.call('get');
  expect(ice).toMatchObject({ surface: 'ice', phase: 'slide', time: 2 });
  expect(ice.speed).toBeCloseTo(3 - 0.05 * 9.8 * 2, 2);
  await fig.call('set', { at: 7 });
  expect(await fig.call('get')).toMatchObject({ phase: 'stopped', distance: 9.18, results: { mat: 1.31, wood: 2.55, ice: 9.18 } });

  // no friction: the same velocity, 3 m/s, on and on (3 m every second)
  await fig.call('set', { surface: 'none', push: true });
  await fig.advance(1200);
  const a = await fig.call('get');
  await fig.advance(4000);
  const b = await fig.call('get');
  expect(a).toMatchObject({ surface: 'none', phase: 'slide', speed: 3 });
  expect(b).toMatchObject({ phase: 'slide', speed: 3, results: { none: 'never' } });
  expect(b.distance - a.distance).toBeCloseTo(12, 1);
  // having seen it never stop, the rule is the book's first law, word for word
  expect(await text('.pvc-rule')).toBe('নিউটনের প্রথম সূত্র: বল প্রয়োগ না করলে স্থির বস্তু স্থির থাকবে এবং সমবেগে চলতে থাকা বস্তু সমবেগে চলতে থাকবে।');
  expect(await text('[data-example="none"] .pvc-ex-res')).toBe('থামে না');

  // back to the start: at rest again
  await fig.call('set', { home: true, animate: false });
  expect(await fig.call('get')).toMatchObject({ phase: 'rest', speed: 0, distance: 0 });

  // the test: the ring on the book hides; every question sets up its own scene
  await fig.call('practice');
  const scenes = [];
  for (let q = 0; q < 5; q++) {
    for (let k = 0; k < 80 && !(await fig.frame.locator('.pvc-opt[data-q="0"]').count()); k++) await fig.advance(250);
    const ask = await text('.pvc-q-text');
    const st = await fig.call('get');
    expect(st.mode).toBe('quiz');
    expect(await fig.frame.locator('.pvc-act-marker').evaluateAll((els) => els.map((el) => getComputedStyle(el).visibility))).toEqual([
      'hidden',
      'hidden',
    ]);
    if (ask.includes('বাতাসের বাধা নেই এমন')) {
      scenes.push('predict');
      expect(st).toMatchObject({ surface: 'none', phase: 'rest' });
    } else if (ask.includes('থেমে গেল')) {
      scenes.push('whystop');
      expect(st.phase).toBe('stopped');
      expect(['mat', 'wood']).toContain(st.surface);
    } else if (ask.includes('একই ধাক্কায়')) {
      scenes.push('farther');
      expect(Object.values(st.results).filter((r) => r != null)).toHaveLength(2);
    } else if (ask.includes('বাঁকা দেয়াল')) {
      scenes.push('curve');
      expect(st.surface).toBe('none');
    } else if (ask.includes('সমবেগে চলছে')) {
      scenes.push('stopit');
      expect(st).toMatchObject({ surface: 'none', phase: 'slide', speed: 3 });
    } else {
      scenes.push('rest');
      expect(ask).toContain('স্থির পড়ে আছে');
      expect(st).toMatchObject({ surface: 'none', phase: 'rest' });
    }
    await fig.frame.locator('.pvc-opt[data-q="0"]').click();
    await fig.advance(300);
    expect(['ok', 'bad']).toContain(await fig.frame.locator('.pvc-q-feedback').getAttribute('data-tone'));
    await fig.frame.locator('[data-act="q-next"]').click();
    await fig.advance(300);
  }
  expect(new Set(scenes).size).toBe(5); // five kinds, one each

  await fig.call('reset');
  await fig.advance(1200);
  expect(await fig.call('get')).toMatchObject({
    surface: 'mat',
    phase: 'rest',
    mode: 'explore',
    view: 'front',
    camera: 'side',
    results: { mat: null, wood: null, ice: null, none: null },
  });
  expect(log.errors).toEqual([]);
});
