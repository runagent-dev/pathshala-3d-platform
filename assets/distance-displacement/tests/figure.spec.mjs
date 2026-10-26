// Distance and displacement through the bridge and the clean panel (book p39, topic 2.4): the story's one action
// rides from A to B (4 km of road, a displacement of only 2 km north-east), on to C (6 km, 1.31 km) and back to A
// (the distance 6 + 6 = 12 km, the displacement zero); the result line and the rule follow, in the book's words.
// Runs with `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('distance-displacement: the story A → B → C → A on the clean panel', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'distance-displacement');
  const f = fig.frame;
  const act = f.locator('.pvc-act');
  const outcome = f.locator('.pvc-outcome');
  const rule = f.locator('.pvc-rule');
  const ride = async () => {
    await act.click();
    await fig.advance(4000);
  };

  expect(await fig.call('get')).toMatchObject({
    km: 0,
    trip: 0,
    at: 'A',
    story: 0,
    next: { stop: 'B', step: 1 },
    displacement: { km: 0, bearing: null },
  });
  // the key names the two marks on the map; one action with its number; the result says nothing is ridden yet
  await expect(f.locator('.dd-key-item.d b')).toHaveText('নীল পথ: দূরত্ব');
  await expect(f.locator('.dd-key-item.s b')).toHaveText('কমলা তির: সরণ');
  await expect(act).toHaveText('১B পর্যন্ত চালাও');
  await expect(f.locator('.pvc-act')).toHaveCount(1); // one big button, no row of boxed buttons
  await expect(outcome).toContainText('এখনো দূরত্ব ০');
  await expect(rule).toContainText('খুঁটির সংখ্যা বলে A থেকে রাস্তা ধরে কত km');

  // ১ the book's example: 4 km of road to B, a displacement of only 2 km, north-east
  await ride();
  expect(await fig.call('get')).toMatchObject({
    km: 4,
    trip: 4,
    at: 'B',
    riding: false,
    story: 1,
    next: { stop: 'C', step: 2 },
    displacement: { km: 2, dir: 'NE' },
  });
  await expect(outcome).toContainText('B-তে: পথ ধরে দূরত্ব ৪ km');
  await expect(outcome).toContainText('সরণ ২ km, উত্তর-পূর্ব দিকে');
  await expect(outcome.locator('i.d b')).toHaveText('৪ km'); // the distance's number in the trail's blue
  await expect(outcome.locator('i.s b')).toHaveText('২ km'); // the displacement's in the arrow's orange
  await expect(rule).toContainText('দূরত্ব একটি স্কেলার রাশি');
  await expect(act).toHaveText('২C পর্যন্ত চালাও');
  // the values on the map name what they are
  await expect(f.locator('.dd-tag.in').first()).toContainText('দূরত্ব ৪ km');

  // ২ on to C: 6 km in all, but C is only 1.311 km from A; the rule grows
  await ride();
  expect(await fig.call('get')).toMatchObject({
    km: 6,
    trip: 6,
    at: 'C',
    story: 2,
    next: { stop: 'A', step: 3 },
    displacement: { km: 1.311, dir: 'N' },
  });
  await expect(outcome).toContainText('C-তে: পথ ধরে দূরত্ব ৬ km');
  await expect(outcome).toContainText('সরণ ১.৩১ km, উত্তর দিকে');
  await expect(rule).toContainText('কমতেও পারে');
  await expect(act).toHaveText('৩A-তে ফিরে চলো');

  // ৩ back to A along the road: the distance keeps growing, the displacement is zero; the law
  await ride();
  expect(await fig.call('get')).toMatchObject({ km: 0, trip: 12, legs: [6, 6], at: 'A', story: 3, rule: 3, displacement: { km: 0, bearing: null } });
  await expect(outcome).toContainText('A-তে ফিরে এলে সরণ ০');
  await expect(outcome).toContainText('দূরত্ব ৬ + ৬ = ১২ km');
  await expect(rule).toContainText('সরণের মান কখনো দূরত্বের চেয়ে বেশি হয় না');
  await expect(f.locator('.dd-tag.in', { hasText: 'সরণ ০' })).toHaveCount(1); // the key moment, on the map too
  await expect(act).toHaveText('আবার B পর্যন্ত চালাও'); // the story is done: no step number

  // after the story the action starts a new trip to B
  await ride();
  expect(await fig.call('get')).toMatchObject({ km: 4, trip: 4, story: 1 });

  // the quiet reset
  await f.locator('[data-act="new"]').click();
  expect(await fig.call('get')).toMatchObject({ km: 0, trip: 0, story: 0, rule: 0 });

  // the badge on the map does the same as the button
  await fig.advance(200);
  await f.locator('.pvc-act-marker.in .pvc-act-badge').click();
  await fig.advance(4000);
  expect(await fig.call('get')).toMatchObject({ km: 4, at: 'B', story: 1 });

  // a new trip through stops: out to km 5, back to km 3 → 7 km ridden (somewhere that is no stop)
  await fig.call('set', { route: [5, 3], animate: false });
  expect(await fig.call('get')).toMatchObject({ km: 3, trip: 7, at: null });
  await expect(outcome).toContainText('এখানে: পথ ধরে দূরত্ব ৭ km');
  await fig.call('set', { newTrip: true });
  expect(await fig.call('get')).toMatchObject({ km: 0, trip: 0 });

  // the arrow keys ride along the road a tenth of a kilometre at a time, and it counts
  await f.locator('.pvc').focus();
  for (let i = 0; i < 5; i++) await f.locator('.pvc').press('ArrowRight');
  await f.locator('.pvc').press('ArrowLeft');
  expect(await fig.call('get')).toMatchObject({ km: 0.4, trip: 0.6 });
  // the action by a key: Enter
  await f.locator('.pvc').press('Enter');
  await fig.advance(4000);
  expect(await fig.call('get')).toMatchObject({ km: 4, at: 'B' });

  // the test: five questions of five kinds, each answered, with a worked answer
  const results = [];
  await f.evaluate(() => {
    const w = /** @type {any} */ (window);
    w.figure.on('practice-result', (r) => (w.__results = [...(w.__results || []), r]));
  });
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(8000); // the scene rides first (up to about 6 s), then the choices appear
    await f.locator('.pvc-opt[data-q="0"]').click();
    await expect(f.locator('.pvc-q-feedback b').first()).not.toBeEmpty();
    await f.locator('[data-act="q-next"]').click();
  }
  results.push(...(await f.evaluate(() => /** @type {any} */ (window).__results)));
  expect(results).toHaveLength(5);
  expect(new Set(results.map((r) => r.kind)).size).toBe(5);
  await expect(f.locator('.pvc-q-result')).toContainText('৫');

  await fig.call('reset');
  expect(await fig.call('get')).toMatchObject({ km: 0, trip: 0, story: 0, view: 'front', mode: 'explore' });
  expect(log.errors).toEqual([]);
});
