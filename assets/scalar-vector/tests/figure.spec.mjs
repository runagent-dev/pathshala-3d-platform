// Scalar and vector through the bridge and the clean panel (book p38, topic 2.3, "find your friend"): a clue with only
// a মান gives a ring of places (a scalar's worth of information), adding the দিক gives one place (a vector); then
// চিত্র ২.০৩: B equals A in another place, C differs from A in দিক, D from C in মান. The big numbered button follows
// the student's steps, waits while a step plays, and ignores a double tap; the rule grows to the caption's words; the
// five-question test runs to the end; reset brings everything back. Runs with `npm run test:figures` (dev-only
// folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('scalar-vector: find your friend, then the book’s equal and different vectors', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'scalar-vector');
  const text = (sel) => fig.frame.locator(sel).first().textContent();
  const button = fig.frame.locator('.pvc-act');

  expect(await fig.call('get')).toMatchObject({ stage: 0, clue: 'none', found: false, next: { action: 'call', step: 1 } });
  expect(await text('.pvc-act-text')).toBe('বন্ধুকে ডাকো');
  expect(await text('.pvc-act-num')).toBe('১');
  expect(await text('.pvc-outcome')).toContain('লুকিয়ে আছে');
  expect(await text('.pvc-rule')).toContain('তাপমাত্রা বোঝাতে একটি মান বললেই চলে, যেমন ৩৭° C');
  await fig.advance(300);
  expect(await fig.frame.locator('.pvc-act-marker.in:not(.pvc-act-under)').count()).toBe(1); // the ring is on you

  // 1. the distance only. While the line sweeps, the panel says only what the friend said; then the ring of places,
  // no way to find the friend, and the rule: 25 m is a মান, a scalar like temperature, but not enough for a place
  await button.click();
  await fig.advance(300);
  expect(await text('.pvc-outcome')).toBe('বন্ধু: “আমি ২৫ m দূরে!”');
  expect(await text('.pvc-rule')).toContain('তাপমাত্রা বোঝাতে একটি মান বললেই চলে');
  await fig.advance(2500);
  let s = await fig.call('get');
  expect(s).toMatchObject({ stage: 1, clue: 'distance', found: false, busy: false, next: { action: 'ask', step: 2 } });
  expect(s.vectors.A).toBeNull();
  expect(await text('.pvc-outcome')).toBe('বন্ধু: “আমি ২৫ m দূরে!” তাহলে সে এই বৃত্তের যেকোনো জায়গায় থাকতে পারে।');
  expect(await text('.pvc-rule')).toBe(
    '২৫ m একটি মান। তাপমাত্রার মতো যে রাশি শুধু একটি মান দিয়ে পুরোপুরি প্রকাশ করা যায়, সেটি স্কেলার রাশি। কিন্তু শুধু মান দিয়ে বন্ধুর জায়গা বোঝা গেল না।',
  );

  // 2. the direction too, by the big button: it waits (disabled, no ring) while the step plays; a double tap does
  // nothing more; then exactly one place, the friend found, the rule names the vector; B waits to be sent
  await fig.advance(500);
  await button.click();
  await fig.advance(100);
  await button.click({ force: true });
  expect(await fig.call('get')).toMatchObject({ busy: true });
  await expect(button).toBeDisabled();
  expect(await fig.frame.locator('.pvc-act-marker.in:not(.pvc-act-under)').count()).toBe(0);
  await fig.advance(1500);
  expect((await fig.call('get')).found).toBe(true); // the friend popped up before the walk ends
  await fig.advance(3500);
  s = await fig.call('get');
  expect(s).toMatchObject({ stage: 2, clue: 'direction', found: true, busy: false, next: { action: 'send', step: 3, name: 'B' } });
  expect(s.vectors.A).toEqual({ tail: [0, 0], length: 25, angle: 45, direction: 'ne' });
  expect(s.vectors.B).toBeNull();
  expect(await text('.pvc-outcome')).toBe('বন্ধু: “২৫ m, উত্তর-পূর্ব দিকে!” ঠিক এখানে: পেয়ে গেছ!');
  expect(await text('.pvc-rule')).toContain('অবস্থান বোঝাতে শুধু দূরত্ব দিয়ে কাজ হলো না, দিকটিও বলতে হলো');
  expect(await text('.pvc-rule')).toContain('সেটি ভেক্টর রাশি');
  expect(await text('.pvc-act-text')).toBe('B-কে পাঠাও');
  await expect(button).toBeEnabled();

  // 3–5. each child is told a clue, walks it, and its arrow slides onto its partner's tail: the caption's sentences
  await button.click();
  await fig.advance(900);
  expect(await text('.pvc-outcome')).toBe('B-কে বলা হলো: “২৫ m, উত্তর-পূর্ব দিকে”…');
  await fig.advance(5000);
  s = await fig.call('get');
  expect(s).toMatchObject({ stage: 3, compared: ['B'], busy: false, current: { name: 'B', with: 'A', verdict: 'equal' } });
  expect(s.vectors.B).toMatchObject({ length: 25, direction: 'ne' });
  expect(s.vectors.B.tail).not.toEqual(s.vectors.A.tail);
  expect(await text('.pvc-outcome')).toBe('B আর A হুবহু এক: মান সমান, দিক একই');
  expect(await text('.pvc-rule')).toContain('A ও B ভেক্টর হুবহু এক, যদিও ভিন্ন অবস্থানে রয়েছে।');
  expect(s.next).toEqual({ action: 'send', step: 4, name: 'C' });
  s = await fig.call('set', { act: true });
  expect(s.current).toEqual({ name: 'C', with: 'A', verdict: 'direction' });
  expect(s.vectors.C).toMatchObject({ length: 25, direction: 'nw' });
  expect(await text('.pvc-rule')).toBe('C ভেক্টর A ও B থেকে ভিন্ন, কারণ মান সমান হলেও দিক ভিন্ন।');
  s = await fig.call('set', { compare: 'D' });
  expect(s.current).toEqual({ name: 'D', with: 'C', verdict: 'magnitude' });
  expect(s.vectors.D).toMatchObject({ length: 12.5, direction: 'nw' });
  expect(await text('.pvc-outcome')).toBe('D আর C ভিন্ন: দিক একই, কিন্তু মান সমান নয়');
  expect(await text('.pvc-rule')).toContain('স্কেলার: তাপমাত্রা, সময়, দৈর্ঘ্য, ভর। ভেক্টর: অবস্থান, বেগ, বল।');
  expect(s).toMatchObject({ stage: 5, compared: ['B', 'C', 'D'], next: { action: 'again', step: '' } });
  // an arrow already compared slides again (the panel says that comparison again)
  s = await fig.call('set', { compare: 'B' });
  expect(s).toMatchObject({ stage: 5, current: { name: 'B', verdict: 'equal' } });

  // straight to a step, and back to the start
  s = await fig.call('set', { stage: 4, animate: false });
  expect(s).toMatchObject({ stage: 4, compared: ['B', 'C'], current: { name: 'C' }, next: { action: 'send', name: 'D' } });
  s = await fig.call('set', { home: true });
  expect(s).toMatchObject({ stage: 0, clue: 'none', compared: [], current: null });

  // the test: five questions by tap, then the result; every kind once
  const results = [];
  await page.exposeFunction('svResult', (r) => results.push(r));
  await fig.frame.evaluate(() => {
    const w = /** @type {any} */ (window);
    w.figure.on('practice-result', (r) => w.svResult(r));
  });
  await fig.call('practice');
  for (let i = 0; i < 5; i++) {
    await fig.advance(600);
    await fig.frame.locator('.pvc-opt[data-q="1"]').click();
    await fig.advance(1600);
    await expect(fig.frame.locator('.pvc-q-feedback')).toHaveAttribute('data-tone', /ok|bad/);
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  await expect(fig.frame.locator('.pvc-q-result')).toContainText('৫টির মধ্যে');
  expect(results.map((r) => r.kind).sort()).toEqual(['clue', 'equal', 'find', 'kind', 'why']);

  await fig.call('reset');
  await fig.advance(800);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', stage: 0, compared: [] });
  expect(log.errors).toEqual([]);
});
