// The physics of the rope wave (book pages 195–197, topic 7.2.3): v = fλ, one period moves a crest one λ, the marks
// and the test's choices. Pure code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as w from '../../assets/wave-quantities/src/reading.js';

const close = (a, b, eps = 1e-9, what = '') => assert.ok(Math.abs(a - b) < eps, `${what} ${a} ≈ ${b}`);

describe('the quantities', () => {
  it('the book’s 7.08: a = 0.1 m, f = 5 Hz, T = 0.2 s, λ = 1 m, v = 5 m/s', () => {
    const q = w.quantities('f5');
    close(q.a, 0.1);
    close(q.T, 0.2);
    close(q.lambda, 1);
    close(q.v, q.f * q.lambda);
    close(q.v, 5);
  });
  it('the same rope keeps v: twice f is half λ', () => {
    for (const id of ['f2', 'f5', 'f10']) close(w.quantities(id).v, 5, 1e-9, id);
    close(w.quantities('f10').lambda, w.quantities('f5').lambda / 2);
    close(w.quantities('f2').lambda, 2);
  });
  it('the heavy rope: the same f, a smaller v and λ', () => {
    const h = w.quantities('heavy');
    close(h.f, 5);
    close(h.v, 2.5);
    close(h.lambda, 0.5);
  });
  it('every example’s period divides the graph’s time window', () => {
    for (const e of w.EXAMPLES) {
      const n = w.WINDOW / w.quantities(e.id).T;
      close(n, Math.round(n), 1e-9, e.id);
    }
  });
});

describe('the wave', () => {
  it('a crest sits at the driver at t = 0 and every whole period', () => {
    const q = w.quantities('f5');
    for (const n of [0, 1, 3]) close(w.displacement(q, 0, n * q.T), q.a, 1e-12);
  });
  it('in one period the shape moves exactly one λ and looks the same again', () => {
    for (const e of w.EXAMPLES) {
      const q = w.quantities(e.id);
      close(w.travelled(q, q.T), q.lambda, 1e-12, e.id);
      for (const x of [0.1, 0.77, 1.9]) close(w.displacement(q, x, q.T), w.displacement(q, x, 0), 1e-12);
    }
  });
  it('the wave moves toward +x: y(x + vt, t) = y(x, 0)', () => {
    const q = w.quantities('f10');
    close(w.displacement(q, 0.3 + q.v * 0.037, 0.037), w.displacement(q, 0.3, 0), 1e-12);
  });
  it('the slope is the derivative', () => {
    const q = w.quantities('f5');
    const h = 1e-6;
    close(w.slope(q, 0.4, 0.03), (w.displacement(q, 0.4 + h, 0.03) - w.displacement(q, 0.4 - h, 0.03)) / (2 * h), 1e-5);
  });
  it('nextPeriod and atWholePeriod', () => {
    const q = w.quantities('f5');
    close(w.nextPeriod(q, 0.21), 0.4);
    close(w.nextPeriod(q, 0.4), 0.4);
    assert.ok(w.atWholePeriod(q, 0.6));
    assert.ok(!w.atWholePeriod(q, 0.61));
  });
});

describe('the marks', () => {
  it('λ is marked crest to crest on the board at t = 0, for every example', () => {
    for (const e of w.EXAMPLES) {
      const q = w.quantities(e.id);
      const m = w.markers(q, 0);
      assert.ok(m, e.id);
      close(m.end - m.start, q.lambda);
      assert.ok(m.end <= w.LENGTH + 1e-9);
      assert.equal(m.crest, true);
    }
  });
  it('at other times the λ mark starts at the first crest, or is left out when it cannot fit', () => {
    const m = w.markers(w.quantities('f5'), 0.25); // crests at 0.25 m, 1.25 m
    assert.equal(m.crest, true);
    close(m.start, 0.25);

    assert.equal(w.markers(w.quantities('f2'), 0.25), null); // 2 m fits on the 2 m board only from 0
  });
  it('the amplitude is marked at an extreme away from the λ mark’s ends', () => {
    for (const e of w.EXAMPLES) {
      const q = w.quantities(e.id);
      const am = w.ampMark(q, 0);
      const m = w.markers(q, 0);
      assert.ok(am, e.id);
      close(Math.abs(w.displacement(q, am.x, 0)), q.a, 1e-9);
      assert.equal(w.displacement(q, am.x, 0) > 0, am.up);
      assert.ok(Math.abs(am.x - m.start) > 0.05 && Math.abs(am.x - m.end) > 0.05);
    }
  });
});

describe('the test', () => {
  it('two periods move a crest two wavelengths, still on the board', () => {
    const q = w.quantities(w.TRAVEL_EXAMPLE);
    close(w.travelled(q, 2 * q.T), 2 * q.lambda);
    assert.ok(2 * q.lambda <= w.LENGTH);
    for (const c of w.travelChoices(q)) assert.ok(c.v <= w.LENGTH, `${c.key} on the board`);
  });
  it('the phase points: A and C in phase, A and B opposite, D and E equal but not in phase', () => {
    const q = w.quantities(w.PHASE_EXAMPLE);
    const P = Object.fromEntries(w.PHASE_POINTS.map((p) => [p.id, p.x]));
    close(w.phase(q, P.A, 0), w.phase(q, P.C, 0), 1e-9);
    close(Math.abs(w.phase(q, P.A, 0) - w.phase(q, P.B, 0)), Math.PI, 1e-9);
    close(w.displacement(q, P.D, 0), w.displacement(q, P.E, 0), 1e-9);
    assert.ok(Math.abs(w.phase(q, P.D, 0) - w.phase(q, P.E, 0)) > 0.5);
    for (const x of Object.values(P)) assert.ok(x <= w.LENGTH);
  });
  it('choices are four distinct values with the right one first', () => {
    for (const e of w.EXAMPLES) {
      const q = w.quantities(e.id);
      for (const [list, right] of [
        [w.lambdaChoices(q), q.lambda],
        [w.ampChoices(q), q.a],
        [w.speedChoices(q), q.v],
        [w.travelChoices(q), 2 * q.lambda],
      ]) {
        assert.equal(list[0].key, 'right');
        close(list[0].v, right);
        assert.ok(list.length >= 3, `${e.id} ${list.map((c) => c.v)}`);
      }
    }
  });
});
