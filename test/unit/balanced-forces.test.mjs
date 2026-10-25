// The physics of the balanced-forces figure (book pages 69–70, topic 3.3): a ball on a string at rest, pulled aside,
// swinging and cut; a book hung from a rope pulled at both ends; the forces added tip to tail. Pure code, no browser.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as p from '../../assets/balanced-forces/src/physics.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);
const rad = p.rad;

describe('balanced forces: the ball on its string', () => {
  it('hangs at rest: T = W = mg, opposite, the resultant zero', () => {
    close(p.weight(1), 9.8);
    close(p.weight(0.5), 4.9);
    const f = p.pendulumForces(0, 0);
    close(f.tension, 9.8);
    close(f.T.x, 0);
    close(f.T.y, 9.8);
    close(f.W.y, -9.8);
    close(f.resultant, 0);
  });

  it('pulled aside and let go: T = mg cos θ along the string, the resultant mg sin θ at right angles to it', () => {
    for (const deg of [-35, -10, 15, 30]) {
      const th = rad(deg);
      const f = p.pendulumForces(th, 0);
      close(f.tension, 9.8 * Math.cos(th));
      close(f.resultant, 9.8 * Math.abs(Math.sin(th)), 1e-12);
      close(f.resultant, p.releaseResultant(th), 1e-12);
      // at right angles to the string (the string points from the ball to the hook: (−sin θ, cos θ))
      close(f.R.x * -Math.sin(th) + f.R.y * Math.cos(th), 0, 1e-12);
      // towards the lowest point, and downward
      assert.ok(Math.sign(f.R.x) === -Math.sign(th));
      assert.ok(f.R.y < 0);
    }
    // the book's picture at 30°: T = 8.5 N, R = 4.9 N
    const f30 = p.pendulumForces(rad(30), 0);
    assert.equal(p.round(f30.tension, 1), 8.5);
    assert.equal(p.round(f30.resultant, 1), 4.9);
  });

  it('while swinging: T = mg cos θ + mLω², the resultant never zero; at the bottom it points up (2mg(1 − cos θ₀))', () => {
    const th0 = rad(30);
    // the energy says ω² at the bottom: 2g(1 − cos θ₀)/L
    const w2 = (2 * p.G * (1 - Math.cos(th0))) / p.LENGTH;
    const f = p.pendulumForces(0, Math.sqrt(w2));
    close(f.tension, 9.8 * (3 - 2 * Math.cos(th0)), 1e-12);
    close(f.R.x, 0, 1e-12);
    close(f.R.y, 2 * 9.8 * (1 - Math.cos(th0)), 1e-12);
    // through a whole swing (no damping) the resultant stays above zero
    let st = { theta: th0, omega: 0 };
    let least = Infinity;
    for (let i = 0; i < 800; i++) {
      st = p.swingStep(st, 1 / 400, { damping: 0 });
      least = Math.min(least, p.pendulumForces(st.theta, st.omega).resultant);
    }
    assert.ok(least > 2.5, `least resultant ${least}`);
  });

  it('swings with the real period for 30 cm, and the same whatever the frame rate', () => {
    close(p.period(), 2 * Math.PI * Math.sqrt(0.3 / 9.8));
    assert.ok(p.period() > 1.09 && p.period() < 1.11);
    // a small swing: back at the same side after one period
    const T = p.period();
    const end = p.swingAt(rad(3), T, { damping: 0 });
    close(end.theta, rad(3), rad(0.02));
    // 60 fps or 23 fps: the same state
    const a = [...Array(60)].reduce((st) => p.swingAdvance(st, 1 / 60), { theta: rad(30), omega: 0 });
    const b = [...Array(23)].reduce((st) => p.swingAdvance(st, 1 / 23), { theta: rad(30), omega: 0 });
    close(a.theta, b.theta, 1e-9);
    // the air slows it a little: after 20 s the swing is smaller, but not gone
    const later = p.swingAt(rad(30), 20);
    const amp = p.amplitude(later);
    assert.ok(amp < rad(30) * 0.5 && amp > rad(3), `amplitude ${p.deg(amp)}°`);
  });

  it('cut: only W is left, the ball falls with g (0.15 m in about 0.17 s)', () => {
    close(p.fallDistance(0.1), 0.049);
    close(p.fallTime(0.15), Math.sqrt(0.3 / 9.8));
    assert.equal(p.round(p.fallTime(), 2), 0.17);
  });

  it('held aside by a hand: the hand pulls with mg sin θ at right angles to the string, and the three forces cancel', () => {
    for (const deg of [-35, -12, 20, 30]) {
      const th = rad(deg);
      const h = p.heldForces(th);
      close(h.resultant, 0, 1e-12);
      close(h.tension, 9.8 * Math.cos(th), 1e-12);
      close(h.hand, 9.8 * Math.abs(Math.sin(th)), 1e-12);
      // at right angles to the string, away from the lowest point (and upward)
      close(h.H.x * -Math.sin(th) + h.H.y * Math.cos(th), 0, 1e-12);
      assert.ok(Math.sign(h.H.x) === Math.sign(th) && h.H.y > 0);
      // let go: the hand's pull goes, and what is left is the release resultant, exactly opposite
      const f = p.pendulumForces(th, 0);
      close(f.R.x, -h.H.x, 1e-12);
      close(f.R.y, -h.H.y, 1e-12);
    }
  });
});

describe('balanced forces: the book on the rope', () => {
  it('a heavier or lighter book: the pulls scale with its weight, the two together equal W upward', () => {
    for (const m of [0.6, 0.8, 1.2]) {
      const f = p.bookForces(35, m);
      close(f.weight, 9.8 * m, 1e-12);
      close(f.T1.y + f.T2.y, f.weight, 1e-12);
      close(f.T1.x + f.T2.x, 0, 1e-12);
      close(f.resultant, 0, 1e-12);
    }
  });

  it('T = W / (2 sin α); T₁, T₂ and W add up to zero at every angle', () => {
    for (const a of [20, 30, 45, 60, 70]) {
      const f = p.bookForces(a);
      close(f.tension, 9.8 / (2 * Math.sin(rad(a))), 1e-12);
      close(f.resultant, 0, 1e-12);
      close(f.T1.x, -f.T2.x);
      close(f.T1.y + f.T2.y, 9.8, 1e-12);
    }
    // at 30° each pull equals the weight
    close(p.bookForces(30).tension, 9.8, 1e-12);
    // flatter rope, bigger pulls
    assert.ok(p.bookForces(20).tension > p.bookForces(45).tension);
    assert.equal(p.round(p.bookForces(20).tension, 1), 14.3);
  });
});

describe('balanced forces: tip to tail', () => {
  it('closes for balanced forces, and leaves the resultant otherwise', () => {
    const b = p.bookForces(40);
    assert.equal(p.chain([b.W, b.T2, b.T1]).closed, true);
    const f = p.pendulumForces(rad(30), 0);
    const c = p.chain([f.W, f.T]);
    assert.equal(c.closed, false);
    close(c.resultant.x, f.R.x, 1e-12);
    close(c.resultant.y, f.R.y, 1e-12);
    assert.equal(
      p.chain([
        { x: 0, y: -9.8 },
        { x: 0, y: 9.8 },
      ]).closed,
      true,
    );
  });

  it('offers four different directions in the test, the right one at right angles to the string', () => {
    for (const deg of [25, -30, 35]) {
      const th = rad(deg);
      const d = p.releaseDirections(th);
      const f = p.pendulumForces(th, 0);
      close(p.angleBetween(d.along, f.R), 0, 1e-6);
      close(p.angleBetween(d.string, f.T), 0, 1e-6);
      const list = Object.values(d);
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(p.angleBetween(list[i], list[j]) > 20);
    }
  });

  it('rounds without binary leftovers', () => {
    assert.equal(p.round(0.1 + 0.2, 1), 0.3);
    assert.equal(p.round(-0.04, 1), 0);
    assert.equal(p.round(8.487, 1), 8.5);
  });
});
