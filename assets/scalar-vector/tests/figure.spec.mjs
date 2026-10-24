// Scalar and vector behaviour through the bridge (book p38, topic 2.3, চিত্র ২.০৩): A and B are the same vector in
// two places, C has A's মান but another দিক, D has C's দিক but a smaller মান; turning C to A's দিক makes it A's
// equal; the arrows stay on the paper; and the five-question test runs to the end. Runs with
// `npm run test:figures` (dev-only folder, never packaged).
import { expect, test } from '@playwright/test';
import { openFigure, preparePage } from '../../../scripts/lib/export/driver.mjs';

test('scalar-vector: the book pairs, turning an arrow, the test', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 });
  const log = await preparePage(page);
  const fig = await openFigure(page, 'scalar-vector');

  const start = await fig.call('get');
  expect(start).toMatchObject({
    selected: 'A',
    compare: null,
    arrows: {
      A: { tail: [3, 2], length: 5, angle: 60 },
      B: { tail: [5, 1], length: 5, angle: 60 },
      C: { tail: [11, 3], length: 5, angle: 120 },
      D: { tail: [11, 6], length: 3, angle: 120 },
    },
  });

  // A and B: the same vector, although drawn in different places
  let s = await fig.call('set', { compare: ['A', 'B'], animate: false });
  expect(s.compare).toEqual({ a: 'A', b: 'B', sameMagnitude: true, sameDirection: true, equal: true });
  expect(s.arrows.B.tail).toEqual(s.arrows.A.tail);
  expect(s.selected).toBe('B');

  // C: equal মান, different দিক; D: same দিক as C, different মান
  s = await fig.call('set', { compare: ['A', 'C'], animate: false });
  expect(s.compare).toEqual({ a: 'A', b: 'C', sameMagnitude: true, sameDirection: false, equal: false });
  expect(s.arrows.B.tail).toEqual([5, 1]); // B went back to its place when C came
  s = await fig.call('set', { compare: ['C', 'D'], animate: false });
  expect(s.compare).toEqual({ a: 'C', b: 'D', sameMagnitude: false, sameDirection: true, equal: false });
  await fig.advance(800);
  await expect(fig.frame.locator('.sv-extra')).toContainText('দিক একই');

  // turn C to A's দিক (it stays on the paper) and line it up: now it is A's equal
  await fig.call('set', { home: true, animate: false });
  s = await fig.call('set', { arrows: { C: { angle: 60 } }, animate: false });
  expect(s.arrows.C).toMatchObject({ length: 5, angle: 60 });
  expect(s.arrows.C.head[0]).toBeLessThanOrEqual(11.5);
  s = await fig.call('set', { compare: ['A', 'C'], animate: false });
  expect(s.compare).toMatchObject({ a: 'A', b: 'C', equal: true });

  // the panel reads the chosen arrow
  await fig.call('reset');
  await fig.call('set', { select: 'D' });
  await fig.advance(300);
  await expect(fig.frame.locator('.pvc-t.mag b')).toContainText('৩');
  await expect(fig.frame.locator('.pvc-t.dir b')).toHaveText('১২০°');

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
  expect(await fig.call('get')).toMatchObject({ mode: 'explore', compare: null, arrows: { B: { tail: [5, 1] } } });
  expect(log.errors).toEqual([]);
});
