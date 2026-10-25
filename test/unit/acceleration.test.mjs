// The physics of the acceleration figure (book pages 43–44, topic 2.6): the CNG on the straight road (গতি বাড়াও,
// ব্রেক, a = (v − u) / t for each stretch of the বেগ–সময় graph) and on the bend (same speed, turning). Pure code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as d from '../../assets/acceleration/src/drive.js';

const close = (a, b, eps = 1e-9, what = '') => assert.ok(Math.abs(a - b) < eps, `${what} ${a} ≈ ${b}`);

describe('the straight road: speeding up, steady, braking', () => {
  it('waits for the gas: brake or nothing pressed does not start the trip', () => {
    const trip = d.newTrip();
    assert.equal(d.tickTrip(trip, 'none'), false);
    assert.equal(d.tickTrip(trip, 'brake'), false);
    assert.equal(trip.n, 0);
    assert.equal(d.tickTrip(trip, 'gas'), true);
    assert.equal(trip.n, 1);
  });
  it('gains 2 m/s every second with the gas held (a = +2 ms⁻²)', () => {
    const trip = d.runTrip([['gas', 5]]);
    assert.equal(trip.n, 50);
    assert.equal(trip.vs[50], 100); // 10 m/s, in tenths
    const [a] = trip.stretches.map(d.stretchValues);
    assert.deepEqual({ kind: a.kind, u: a.u, v: a.v, t: a.t, a: a.a }, { kind: 'up', u: 0, v: 10, t: 5, a: 2 });
  });
  it('travels v t at a steady speed and ½ a t² from rest (distance from the ticks is exact)', () => {
    const trip = d.runTrip([['gas', 5]]);
    close(trip.xs[50], 0.5 * 2 * 5 ** 2, 1e-9, 'from rest');
    d.runTrip([['none', 3]], trip);
    close(trip.xs[80] - trip.xs[50], 10 * 3, 1e-9, 'steady');
  });
  it('loses 2 m/s every second with the brake held (a = −2 ms⁻², মন্দন)', () => {
    const trip = d.runTrip([
      ['gas', 6],
      ['brake', 2],
    ]);
    const b = d.stretchValues(trip.stretches[1]);
    assert.equal(b.kind, 'down');
    assert.equal(b.u, 12);
    assert.equal(b.v, 8);
    assert.equal(b.a, -2);
  });
  it('stops exactly on a tick, whatever the speed: braking to rest still gives a = −2 ms⁻² exactly', () => {
    for (const g of [0.3, 1.7, 3.1, 4.9]) {
      const trip = d.runTrip([
        ['gas', g],
        ['brake', 6],
      ]);
      const b = d.stretchValues(trip.stretches[1]);
      assert.equal(b.v, 0, `after ${g} s of gas`);
      assert.equal(b.a, -2, `after ${g} s of gas`);
    }
  });
  it('keeps the speed with nothing pressed (ত্বরণ নেই)', () => {
    const trip = d.runTrip([
      ['gas', 3],
      ['none', 4],
    ]);
    const s = d.stretchValues(trip.stretches[1]);
    assert.deepEqual({ kind: s.kind, u: s.u, v: s.v, t: s.t, a: s.a }, { kind: 'none', u: 6, v: 6, t: 4, a: 0 });
  });
  it('stops at the top speed (15 m/s) and at rest: then the acceleration is zero', () => {
    const trip = d.runTrip([['gas', 10]]);
    assert.equal(trip.vs[trip.n], 150);
    assert.deepEqual(
      trip.stretches.map((s) => [s.kind, s.t1 - s.t0]),
      [
        ['up', 75],
        ['none', 25],
      ],
    );
    d.runTrip([['brake', 8]], trip); // 15 m/s to rest in 7.5 s, then standing
    assert.equal(trip.vs[trip.n], 0);
    assert.deepEqual(trip.stretches.at(-1).kind, 'none'); // standing, the brake still held
    assert.equal(d.stretchValues(trip.stretches.at(-2)).a, -2);
  });
  it('gives a = (v − u) / t for every stretch, whatever its length (the rate does not depend on the time)', () => {
    for (const s of [1, 2.5, 4, 7.4]) {
      const trip = d.runTrip([
        ['gas', 0.5],
        ['none', 1],
        ['gas', s],
      ]);
      const v = d.stretchValues(trip.stretches[2]);
      close(d.accel(v.u, v.v, v.t), 2, 1e-9, `${s} s`);
    }
  });
  it("builds the book's graph (চিত্র ২.০৬): A up, B flat, C up, D down", () => {
    const { trip, kinds, unique } = d.graphTrip(0);
    assert.deepEqual(kinds, ['up', 'none', 'up', 'down']);
    assert.deepEqual(unique, ['none', 'down']);
    assert.deepEqual(d.lettersOf(trip.stretches), ['A', 'B', 'C', 'D']);
    assert.equal(trip.vs[trip.n], 0);
  });
  it('every test graph has four lettered stretches, stays on the graph, and a kind that appears only once', () => {
    for (let i = 0; i < d.GRAPHS.length; i++) {
      const { trip, kinds, unique } = d.graphTrip(i);
      assert.equal(kinds.length, 4, `graph ${i}`);
      assert.deepEqual(d.lettersOf(trip.stretches), ['A', 'B', 'C', 'D'], `graph ${i}`);
      assert.ok(unique.length >= 1, `graph ${i}`);
      assert.ok(trip.n * d.TICK <= 20, `graph ${i} fits on the test card's 20 s axis`);
      for (let k = 0; k <= trip.n; k++) assert.ok(trip.vs[k] >= 0 && trip.vs[k] <= 150);
    }
  });
  it('letters only stretches of a second or more', () => {
    const trip = d.runTrip([
      ['gas', 2],
      ['none', 0.4],
      ['gas', 1.5],
    ]);
    assert.deepEqual(d.lettersOf(trip.stretches), ['A', '', 'B']);
  });
  it('ends the trip after 30 s', () => {
    const trip = d.runTrip([
      ['gas', 5],
      ['none', 40],
    ]);
    assert.equal(trip.n, d.TICKS);
    assert.equal(d.tickTrip(trip, 'gas'), false);
  });
  it('interpolates speed and distance between ticks', () => {
    const trip = d.runTrip([['gas', 2]]);
    const p = d.tripAt(trip, 1.25);
    close(p.v, 2.5, 1e-9);
    close(p.x, 0.5 * 2 * 1.25 ** 2, 1e-9);
    close(d.tripAt(trip, 5).v, 4, 1e-9); // past the end: the last tick
  });
});

describe('the bend: same speed, turning', () => {
  it('turns at v / r and has an acceleration v² / r towards the middle of the circle', () => {
    close(d.OMEGA, 2.5 / 3);
    close(d.TURN_ACCEL, 6.25 / 3);
    const a = d.turnVectors(0, 1); // heading east, turning left: the middle is to the north
    close(a.ve, 2.5);
    close(a.vn, 0);
    close(a.ae, 0, 1e-12);
    close(a.an, 6.25 / 3);
    const b = d.turnVectors(0, -1); // turning right: to the south
    close(b.an, -6.25 / 3);
    // the middle of the turn is r to the left (or right) of the CNG, where the acceleration points
    const m = d.turnCentre(0, 0, 0, 1);
    close(m.e, 0, 1e-12);
    close(m.north, d.TURN.r);
    const m2 = d.turnCentre(2, 1, Math.PI / 2, -1); // heading north, turning right: the middle is to the east
    close(m2.e, 2 + d.TURN.r);
    close(m2.north, 1, 1e-12);
    const c = d.turnVectors(1.2, 0); // straight on: no acceleration
    assert.equal(c.ae, 0);
    assert.equal(c.an, 0);
  });
  it('keeps the speed while turning: a whole circle of 3 m in 2πr / v', () => {
    const st = d.newTurn();
    const ticks = Math.round((2 * Math.PI * d.TURN.r) / d.TURN.v / d.TICK);
    for (let i = 0; i < ticks; i++) d.tickTurn(st, 'left');
    close(Math.hypot(st.e, st.north), 0, 0.15, 'back where it started (75 ticks of 75.4)');
    // the distance from the middle of the circle stays r at every step
    const s2 = d.newTurn();
    for (let i = 0; i < 30; i++) {
      d.tickTurn(s2, 'left');
      close(Math.hypot(s2.e, s2.north - d.TURN.r), d.TURN.r, 1e-9);
    }
  });
  it('goes straight with no steering, 0.25 m per tick', () => {
    const st = d.newTurn();
    d.tickTurn(st, 'none');
    close(st.e, 0.25);
    close(st.north, 0);
  });
  it('names the eight directions', () => {
    assert.equal(d.dirOf(0), 'E');
    assert.equal(d.dirOf(Math.PI / 2), 'N');
    assert.equal(d.dirOf(Math.PI), 'W');
    assert.equal(d.dirOf(-Math.PI / 2), 'S');
    assert.equal(d.dirOf(Math.PI / 4), 'NE');
    assert.equal(d.dirOf(7.5 * Math.PI), 'S');
  });
});

describe('numbers', () => {
  it('formats without trailing zeros in sentences, fixed in readouts, with a real minus sign', () => {
    assert.equal(d.fmt(2), '2');
    assert.equal(d.fmt(2.5), '2.5');
    assert.equal(d.fixed(8, 1), '8.0');
    assert.equal(d.fixed(-0.01, 1), '0.0');
    assert.equal(d.signed(2), '+2.0');
    assert.equal(d.signed(-2), '−2.0');
    assert.equal(d.signed(0), '0.0');
  });
});
