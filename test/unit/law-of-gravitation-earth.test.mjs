// The maths of the law-of-gravitation-earth figure (book page 79, topic 3.7): the Earth's g = GM/R² ≈ 9.8 m s⁻²
// from the book's M and R, the weight GMm/R² = mg, the test's right answers with their usual mistakes, and the
// strings: no power of ten in a sentence.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as lg from '../../assets/law-of-gravitation-earth/src/physics.js';
import { STRINGS } from '../../assets/law-of-gravitation-earth/src/i18n.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} ≈ ${b}`);

describe('the Earth', () => {
  it('g = GM/R² from the book’s numbers is about 9.8 m s⁻²', () => {
    assert.deepEqual(lg.EARTH, { M: 5.98e24, R: 6.37e6 });
    close(lg.gravity(), 9.83, 1e-3);
    assert.equal(lg.roundTo(lg.gravity(), 1), 9.8);
  });
  it('the weight of a body is GMm/R² = mg: twice the mass, twice the weight, the same g', () => {
    close(lg.weight(1), lg.gravity());
    close(lg.weight(2), 2 * lg.gravity());
    close(lg.weight(2) / 2, lg.weight(1));
  });
});

describe('the test’s choices (right answer first, then the usual mistakes)', () => {
  it('the weight two radii from the centre: a quarter; the distance not squared; unchanged; the wrong way squared', () => {
    // every choice starts from the 9.8 the question states, so the last one is 4 × 9.8 = 39.2 (not 4 × 9.83)
    const g0 = 9.8;
    const c = lg.heightChoices(2);
    close(c[0], g0 / 4);
    close(c[1], g0 / 2);
    close(c[2], g0);
    close(c[3], g0 * 4);
    assert.equal(lg.roundTo(c[0], 1), 2.5);
    assert.equal(lg.roundTo(c[1], 1), 4.9);
    assert.equal(lg.roundTo(c[3], 1), 39.2);
    assert.equal(new Set(c.map((x) => lg.roundTo(x, 1))).size, 4, 'four different choices on the screen');
    // and the true answer from M and R agrees with the shown one: GM/(2R)² = 2.46, shown as 2.5
    assert.equal(lg.roundTo(lg.gravity(lg.EARTH.M, 2 * lg.EARTH.R), 1), lg.roundTo(c[0], 1));
  });
  it('R for a weight 1 m up: about the Earth’s radius; the height; the diameter; km read as m', () => {
    const c = lg.radiusChoices();
    close(c[0], 6.37e6 + 1);
    assert.equal(c[1], 1);
    close(c[2], 1.274e7);
    close(c[3], 6370);
    // the figure writes them in km (6,370 km · 1 m · 12,740 km · 6,370 m): four different numbers with their units
    assert.equal(Math.round(c[0] / 1000), 6370);
    assert.equal(Math.round(c[2] / 1000), 12740);
  });
});

describe('the strings', () => {
  it('Bangla and English have the same strings', () => {
    assert.deepEqual(Object.keys(STRINGS.bn).sort(), Object.keys(STRINGS.en).sort());
  });
  it('no sentence has a power of ten or scientific notation', () => {
    for (const lang of ['bn', 'en'])
      for (const [key, text] of Object.entries(STRINGS[lang])) assert.ok(!/10<sup>|১০|× ?10|<sup>/.test(text), `${lang}.${key}: ${text}`);
  });
});
