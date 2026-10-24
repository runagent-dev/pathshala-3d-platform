// The measuring maths of the figures, the shared tweens and the books registry: pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ease } from '@shared/tween.js';
import * as caliper from '../../assets/vernier-caliper/src/reading.js';
import * as gauge from '../../assets/screw-gauge/src/reading.js';
import { bookRef, chapterOf, findBook, loadBooks, validateBooks } from '../../scripts/lib/books.mjs';

describe('screw gauge reading (book p21: pitch 1 mm, 100 parts)', () => {
  it('has least count 0.01 mm', () => assert.equal(gauge.LC, 0.01));
  it('reads L + C × LC', () => {
    assert.deepEqual(gauge.read(3.47), { L: 3, C: 47, value: 3.47 });
    assert.deepEqual(gauge.read(0), { L: 0, C: 0, value: 0 });
    assert.deepEqual(gauge.read(12.5), { L: 12, C: 50, value: 12.5 });
  });
  it('carries when the circular scale rounds up to 100', () => {
    assert.deepEqual(gauge.read(4.9996), { L: 5, C: 0, value: 5 });
  });
  it('never reads below zero', () => assert.equal(gauge.read(-0.3).value, 0));
  it('formats with two decimals', () => assert.equal(gauge.format(7), '7.00'));
});

describe('vernier caliper reading', () => {
  it('least count is 1/n mm', () => {
    for (const lc of caliper.LEAST_COUNTS) assert.equal(caliper.divisionsFor(lc), Math.round(1 / lc));
  });
  it('reads main scale + coinciding division', () => {
    const r = caliper.readScales(24.6, 0.1);
    assert.equal(r.msr, 24);
    assert.equal(r.vsr, 6);
    assert.equal(r.value, 24.6);
  });
  it('corrects a zero error', () => {
    const m = caliper.measure(19.6, 0.02, -0.04);
    assert.equal(m.observed, 19.56);
    assert.equal(m.corrected, 19.6);
  });
});

describe('tween easing', () => {
  for (const [name, fn] of Object.entries(ease)) {
    it(`${name} goes from 0 to 1`, () => {
      assert.ok(Math.abs(fn(0)) < 1e-9);
      assert.ok(Math.abs(fn(1) - 1) < 1e-9);
    });
  }
});

describe('books registry', () => {
  it('books.json is valid', () => assert.deepEqual(validateBooks({ books: loadBooks() }), []));
  it('rejects duplicate ids and missing titles', () => {
    assert.equal(
      validateBooks({
        books: [
          { id: 'a', title: { bn: 'ক', en: 'A' } },
          { id: 'a', title: {} },
        ],
      }).length,
      2,
    );
  });
  it('finds the chapter of a topic', () => {
    assert.equal(chapterOf(findBook('physics-9-10'), '1.6.1')?.number, 1);
    assert.equal(chapterOf(findBook('physics-9-10'), '9.1'), null);
  });
  it('writes the short book reference', () => {
    assert.equal(bookRef({ book: 'physics-9-10', topic: '1.6.1', page: 21 }), 'physics-9-10 › 1.6.1 › p21');
    assert.equal(bookRef({ book: 'physics-9-10', topic: '', page: null }), 'physics-9-10');
  });
});
