// Newton's second law through the bridge (book pp75–76, topic 3.6): the handcart pushed for 2 s gains velocity
// evenly (a = F / m: 1 ms⁻² empty, 2 with two people, 0.5 with two sacks), rolls on at that velocity once let go,
// and the sacks at the end of the floor stop it; pushed back from the front it slows from 2 m/s to rest (a = −1).
// The clean panel: the acceleration under each word, the result line a = (v − u) ÷ t, the rule growing up to the
// book's law, the big numbered button offering the next example (and its ring on the cart, hidden while it moves and
// in the test). Every test question sets up its own scene; reset brings everything back.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('newtons-second-law: F = ma for the handcart, and the direction of the change', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'newtons-second-law');
  const text = async (sel) => (await fig.frame.locator(sel).first().textContent()).replace(/ /g, ' ');

  const start = await fig.call('get');
  expect(start).toMatchObject({ example: 'base', phase: 'rest', speed: 0, distance: 0, mass: 100, next: { example: 'base', step: 1 } });
  // at rest, with no push, nothing happens however long we wait
  await fig.advance(3000);
  expect(await fig.call('get')).toMatchObject({ phase: 'rest', speed: 0, distance: 0 });
  expect(await text('.pvc-rule')).toContain('একজন ১০০ নিউটন বলে ২ সেকেন্ড ঠেলবে');
  expect(await text('.pvc-act')).toContain('গাড়িটি ২ সেকেন্ড ঠেলো');
  expect(await fig.frame.locator('.pvc-act-marker.in:not(.pvc-act-under)').count()).toBe(1);

  // the push: the velocity grows by 1 m/s every second while 100 N acts on 100 kg
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(1000);
  const mid = await fig.call('get');
  expect(mid.phase).toBe('push');
  expect(mid.force).toBe(100);
  expect(mid.acceleration).toBe(1);
  expect(mid.speed).toBeGreaterThan(0.9);
  expect(mid.speed).toBeLessThan(1.2);
  expect(await text('.pvc-rule')).toContain('বল যতক্ষণ কাজ করছে, বেগ ততক্ষণ বাড়ছে');
  expect(await fig.frame.locator('.pvc-act-marker.in:not(.pvc-act-under)').count()).toBe(0); // no ring while it moves
  // the action keeps its words and its number while the push is on (no "again" in the middle of it)
  expect(await text('.pvc-act')).toContain('গাড়িটি ২ সেকেন্ড ঠেলো');
  expect(await text('.pvc-act')).not.toContain('আবার');
  // the arrows are labelled with their numbers (a is on the picture before the result line has it)
  expect(await text('.pvc-anno-layer')).toContain('a = ১ ms');
  expect(await text('.pvc-anno-layer')).toContain('F = ১০০ নিউটন');
  // the result line: the time to 0.1 s, the velocity from that time
  expect(await text('.pvc-outcome')).toMatch(/^t = ১\.[০-৯] s, বেগ v = ১\.[০-৯]০ m\/s$/);
  await fig.advance(1300);
  const after = await fig.call('get');
  expect(after).toMatchObject({ phase: 'coast', speed: 2, force: 0, acceleration: 0, measured: { u: 0, v: 2, t: 2, a: 1 }, results: { base: 1 } });
  expect(await text('.pvc-outcome')).toBe('a = (v − u) ÷ t = (২ − ০) ÷ ২ = ১ ms−2');
  expect(await text('[data-example="base"] .pvc-ex-res')).toBe('১ ms−2');
  expect(await text('.pvc-rule')).toContain('F = ma');
  expect(await text('.pvc-rule')).toContain('১০০ নিউটন = ১০০ kg × ১ ms−2');
  expect(await text('.pvc-rule')).toContain('ভরবেগ প্রতি সেকেন্ডে ১০০ kg m/s করে বাড়ছে');
  // the push is over: the words on the view say why the velocity stays
  expect(await text('.pvc-anno-layer')).toContain('ঠেলা শেষ: বল নেই, তাই বেগ বদলায় না');
  // rolling on at 2 m/s (no force): 0.5 s later still 2 m/s
  await fig.advance(500);
  expect(await fig.call('get')).toMatchObject({ phase: 'coast', speed: 2 });
  // the big button offers the next word, ২ দ্বিগুণ বল
  expect((await fig.call('get')).next).toEqual({ example: 'force', step: 2 });
  expect(await text('.pvc-act')).toContain('এবার দুজনে মিলে ঠেলো');
  expect(await fig.frame.locator('[data-example="force"].next').count()).toBe(1);
  // the sacks stop it
  await fig.advance(2000);
  const stopped = await fig.call('get');
  expect(stopped.phase).toBe('stopped');
  expect(stopped.distance).toBeCloseTo(5.52, 2);
  expect(await text('.pvc-anno-layer')).toContain('বস্তা থামাল');

  // double the force: two people, 2 ms⁻²
  await fig.frame.locator('.pvc-act').click();
  await fig.advance(900); // the second person steps up, then the push
  expect(await fig.call('get')).toMatchObject({ example: 'force', phase: 'push', force: 200, acceleration: 2 });
  await fig.advance(2200);
  expect((await fig.call('get')).results).toMatchObject({ base: 1, force: 2 });
  expect(await text('.pvc-rule')).toContain('বল দ্বিগুণ, ত্বরণও দ্বিগুণ');

  // double the mass, jumping to the end: 0.5 ms⁻²
  await fig.call('set', { example: 'mass', push: true, animate: false });
  const mass = await fig.call('get');
  expect(mass).toMatchObject({ example: 'mass', phase: 'stopped', mass: 200, results: { mass: 0.5 } });
  expect(await text('.pvc-rule')).toContain('ভর দ্বিগুণ, ত্বরণ অর্ধেক');

  // the force backward: from 2 m/s to rest in 2 s, a = −1; the momentum changes in the direction of the force
  await fig.call('set', { example: 'back', animate: false });
  await fig.call('set', { at: 3.3 });
  const brake = await fig.call('get');
  expect(brake.phase).toBe('brake');
  expect(brake.force).toBe(-100);
  expect(brake.acceleration).toBe(-1);
  expect(await text('.pvc-rule')).toContain('বল বাম দিকে, গাড়ি চলছে ডান দিকে');
  expect(await text('.pvc-anno-layer')).toContain('ভরবেগের পরিবর্তন'); // the green arrow, the way of the force
  await fig.advance(1800);
  const back = await fig.call('get');
  expect(back).toMatchObject({ phase: 'stopped', speed: 0, measured: { u: 2, v: 0, a: -1 } });
  expect(back.distance).toBeCloseTo(4.6, 2);
  // all four found: the book's law, word for word
  expect(await text('.pvc-rule')).toContain(
    'নিউটনের দ্বিতীয় সূত্র: বস্তুর ভরবেগের পরিবর্তনের হার তার উপর প্রযুক্ত বলের সমানুপাতিক এবং যেদিকে বল প্রয়োগ করা হয় ভরবেগের পরিবর্তনও সেদিকে ঘটে।',
  );
  expect(await text('[data-example="back"] .pvc-ex-res')).toBe('−১ ms−2');

  // the test: five questions, each on its own scene; the ring hides; tapping the cart is locked
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(6000);
    const opts = fig.frame.locator('.pvc-opt:not([disabled])');
    expect(await opts.count()).toBe(4);
    expect(await fig.frame.locator('.pvc-act-marker.in:not(.pvc-act-under)').count()).toBe(0);
    await opts.first().click();
    await fig.advance(400);
    expect(((await text('.pvc-q-feedback')) || '').length).toBeGreaterThan(10);
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  expect(await fig.frame.locator('.pvc-q-done .pvc-q-result').textContent()).toContain('৫টির মধ্যে');
  // leaving the test brings back what the student had found
  await fig.frame.locator('[data-mode="explore"]').click();
  await fig.advance(300);
  expect((await fig.call('get')).results).toEqual({ base: 1, force: 2, mass: 0.5, back: -1 });

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ example: 'base', phase: 'rest', results: { base: null, force: null, mass: null, back: null } });
  // the direction example found first: the rule works the force out from the change of momentum
  await fig.call('set', { example: 'back', push: true, animate: false });
  expect(await text('.pvc-rule')).toContain('(০ − ২০০) ÷ ২ = −১০০ নিউটন');
  expect(await text('.pvc-outcome')).toBe('a = (v − u) ÷ t = (০ − ২) ÷ ২ = −১ ms−2');
  expect(log.errors).toEqual([]);
});
