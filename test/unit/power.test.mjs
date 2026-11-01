// The maths of the power figure (book p120, 4.7): W = mgh, P = W/t, the two examples (same work, same time), the
// stopwatch readings and the work shown from the same whole second, the bulb, and the test's choices.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BULB,
  bulbAt,
  choicesFrom,
  energyMistakes,
  FULL,
  H,
  massLifted,
  PUMPS,
  plan,
  power,
  powerMistakes,
  readingAt,
  timeToLift,
  workToLift,
} from '../../assets/power/src/power.js';

test('power: W = mgh and P = W/t with the book’s g = 9.8', () => {
  assert.equal(H, 3);
  assert.equal(workToLift(500), 14700);
  assert.equal(workToLift(1, 1), 9.8);
  assert.equal(power(14700, 15), 980);
  assert.equal(power(14700, 30), 490);
  assert.equal(power(100, 0), 0);
  assert.equal(timeToLift(500, PUMPS.big), 15);
  assert.equal(massLifted(PUMPS.small, 15), 250);
});

test('power: same work, different times; same time, different work', () => {
  const w = plan('work');
  assert.deepEqual([w.small.t, w.big.t, w.total], [30, 15, 30]);
  assert.equal(w.small.W, w.big.W);
  assert.equal(power(w.small.W, w.small.t), PUMPS.small);
  assert.equal(power(w.big.W, w.big.t), PUMPS.big);
  assert.equal(PUMPS.big, 2 * PUMPS.small);
  const s = plan('time');
  assert.deepEqual([s.small.t, s.big.t], [15, 15]);
  assert.deepEqual([s.small.m, s.big.m], [250, 500]);
  assert.equal(s.big.W, 2 * s.small.W);
  // the test's other tanks: every time is a whole second
  for (const m of [300, 400, 500]) for (const P of Object.values(PUMPS)) assert.ok(Number.isInteger(timeToLift(m, P)), `${m} kg, ${P} W`);
  for (const T of [6, 9, 12]) {
    const p = plan('time', FULL, T);
    assert.ok(Number.isInteger(p.big.m) && Number.isInteger(p.small.m) && p.big.m <= FULL, `${T} s`);
  }
});

test('power: the stopwatch reads whole seconds and the work comes from that same second', () => {
  const big = plan('work').big;
  const r = readingAt(big, 7.6);
  assert.deepEqual([r.t, r.W, r.running, r.done], [7, 6860, true, false]);
  assert.equal(r.m, massLifted(PUMPS.big, 7));
  assert.ok(r.mSmooth > r.m);
  assert.equal(power(r.W, r.t), PUMPS.big); // P = W/t is the same at every moment
  const end = readingAt(big, 22);
  assert.deepEqual([end.t, end.W, end.m, end.done, end.running], [15, 14700, 500, true, false]);
  const start = readingAt(big, 0);
  assert.deepEqual([start.t, start.W, start.running], [0, 0, false]);
});

test('power: the bulb uses P × t joules', () => {
  assert.deepEqual(bulbAt(4.5), { t: 4, E: 400, on: true, done: false });
  assert.deepEqual(bulbAt(10), { t: 10, E: 1000, on: false, done: true });
  assert.equal(bulbAt(3, 60, 8).E, 180);
  assert.equal(BULB, 100);
});

test('power: the test’s choices are the right value and real mistakes', () => {
  const c = choicesFrom(PUMPS.big, powerMistakes(400, 12, 24));
  assert.equal(c.length, 4);
  assert.equal(c[0].value, 980);
  assert.deepEqual(
    c.slice(1).map((x) => x.why),
    ['p_other', 'p_noT', 'p_noG'],
  );
  assert.deepEqual(
    c.map((x) => x.value),
    [980, 490, 11760, 100],
  );
  const e = choicesFrom(60 * 8, energyMistakes(60, 8));
  assert.deepEqual(
    e.map((x) => x.value),
    [480, 60, 68, 28800],
  );
  // duplicates and the right value are never offered twice
  const d = choicesFrom(5, [
    { value: 5, why: 'a' },
    { value: 2.5, why: 'b' },
    { value: 7, why: 'c' },
    { value: 7, why: 'd' },
  ]);
  assert.deepEqual(
    d.map((x) => x.value),
    [5, 7],
  );
});
