// Scalar and vector behaviour through the bridge (book p38, topic 2.3, চিত্র ২.০৩): A and B are the same vector in
// two places, C has A's মান but another দিক, D has C's দিক but a smaller মান; turning C to A's দিক makes it A's
// equal and the panel says what changed; moving and turning the thermometer leaves the temperature as it is; the
// arrows stay on the paper; and the five-question test runs to the end. Runs with `npm run test:figures` (dev-only
// folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('scalar-vector: the book pairs, turning an arrow, the thermometer, the test', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'scalar-vector');
  const extra = fig.frame.locator('.sv-extra');

  const start = await fig.call('get');
  expect(start).toMatchObject({
    selected: 'A',
    compare: null,
    arrows: {
      A: { tail: [4, 3], length: 4, angle: 45 },
      B: { tail: [6, 1], length: 4, angle: 45 },
      C: { tail: [10, 6], length: 4, angle: 135 },
      D: { tail: [11, 8], length: 2, angle: 135 },
    },
    thermometer: { at: [2.3, 0.9], angle: 0, temperature: 37 },
  });
  await expect(fig.frame.locator('.pvc-t.dir b')).toHaveText('উত্তর-পূর্ব');

  // A and B: the same vector, although drawn in different places (named in the book's order)
  let s = await fig.call('set', { compare: ['A', 'B'], animate: false });
  expect(s.compare).toEqual({ a: 'A', b: 'B', sameMagnitude: true, sameDirection: true, equal: true });
  expect(s.arrows.B.tail).toEqual(s.arrows.A.tail);
  expect(s.selected).toBe('B');
  await fig.advance(300);
  await expect(extra).toContainText('A ও B ভেক্টর হুবহু এক');

  // C: equal মান, different দিক; D: same দিক as C, different মান
  s = await fig.call('set', { compare: ['A', 'C'], animate: false });
  expect(s.compare).toEqual({ a: 'A', b: 'C', sameMagnitude: true, sameDirection: false, equal: false });
  expect(s.arrows.B.tail).toEqual([6, 1]); // B went back to its place when C came
  await fig.advance(300);
  await expect(extra).toContainText('উত্তর-পশ্চিম আর উত্তর-পূর্ব');
  s = await fig.call('set', { compare: ['C', 'D'], animate: false });
  expect(s.compare).toEqual({ a: 'C', b: 'D', sameMagnitude: false, sameDirection: true, equal: false });
  await fig.advance(800);
  await expect(extra).toContainText('দিক একই');

  // turn C to A's দিক (it stays on the paper): the panel says the vector changed; lined up, it is A's equal
  await fig.call('set', { home: true, animate: false });
  s = await fig.call('set', { arrows: { C: { angle: 45 } }, animate: false });
  expect(s.arrows.C).toMatchObject({ length: 4, angle: 45 });
  expect(s.arrows.C.head[0]).toBeLessThanOrEqual(11.5);
  await fig.advance(300);
  await expect(extra).toContainText('দিক বদলেছে (উত্তর-পশ্চিম থেকে উত্তর-পূর্ব)');
  s = await fig.call('set', { compare: ['A', 'C'], animate: false });
  expect(s.compare).toMatchObject({ a: 'A', b: 'C', equal: true });

  // the thermometer: moved and turned, it still reads 37° C, and it has no দিক
  await fig.call('reset');
  s = await fig.call('set', { select: 'T', thermometer: { at: [6, 5], angle: 90 } });
  expect(s.thermometer).toEqual({ at: [6, 5], angle: 90, temperature: 37 });
  await fig.advance(300);
  await expect(fig.frame.locator('.pvc-t.mag b')).toHaveText('৩৭° C');
  await expect(fig.frame.locator('.pvc-t.dir b')).toHaveText('লাগে না');
  await expect(extra).toContainText('৩৭° C-ই থাকে');

  // the panel reads the chosen arrow
  await fig.call('reset');
  await fig.call('set', { select: 'D' });
  await fig.advance(300);
  await expect(fig.frame.locator('.pvc-t.mag b')).toContainText('২');
  await expect(fig.frame.locator('.pvc-t.dir b')).toHaveText('উত্তর-পশ্চিম');

  // the test: five questions by tap, then the result
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
    await fig.advance(300);
    await expect(fig.frame.locator('.pvc-q-feedback')).toHaveAttribute('data-tone', /ok|bad/);
    await fig.frame.locator('[data-act="q-next"]').click();
  }
  await fig.advance(500);
  await expect(fig.frame.locator('.pvc-q-result')).toContainText('৫টির মধ্যে');
  expect(results.map((r) => r.kind).sort()).toEqual(['equal', 'kind', 'need', 'read', 'why']);

  await fig.call('reset');
  await fig.advance(1500);
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', compare: null, arrows: { B: { tail: [6, 1] } }, thermometer: { at: [2.3, 0.9] } });
  expect(log.errors).toEqual([]);
});
