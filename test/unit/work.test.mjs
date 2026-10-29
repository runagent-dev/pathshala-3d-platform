// The maths of the work figure (book p100, 4.1): W = Fs, the run (push s speeding up, slide d = s/2 slowing down),
// the work shown from the same rounded s, and the test's choices from real mistakes.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { choicesFrom, clampF, clampS, forceMistakes, motionAt, plan, work, workMistakes, workSoFar } from '../../assets/work/src/work.js';

test('work: W = Fs in joules', () => {
  assert.equal(work(50, 2), 100);
  assert.equal(work(30, 0.1), 3);
  assert.equal(work(100, 0), 0);
});

test('work: steppers stay in range and on their steps', () => {
  assert.equal(clampF(5), 10);
  assert.equal(clampF(104), 100);
  assert.equal(clampF(47), 50);
  assert.equal(clampS(0), 1);
  assert.equal(clampS(9), 4);
});

test('work: the run speeds up over s, slows over d = s/2, fastest at the release', () => {
  const p = plan(2);
  assert.equal(p.d, 1);
  assert.equal(p.T1, 3);
  assert.ok(Math.abs(p.T2 - 1.5) < 1e-9);
  assert.equal(motionAt(p, 0).x, 0);
  assert.ok(Math.abs(motionAt(p, 1.5).x - 0.5) < 1e-9); // half the time, a quarter of s
  assert.ok(Math.abs(motionAt(p, 3).x - 2) < 1e-9);
  assert.equal(motionAt(p, 3.001).phase, 'slide');
  assert.ok(Math.abs(motionAt(p, 3 + 1.5 - 1e-9).x - 3) < 1e-6);
  assert.deepEqual(motionAt(p, 10), { x: 3, v: 0, phase: 'done' });
  assert.ok(motionAt(p, 2.9).v < p.v && motionAt(p, 3.1).v < p.v);
});

test('work: the work shown comes from the same 0.1 m number, and stops growing over d', () => {
  assert.deepEqual(workSoFar(50, 2, 1.23), { sNow: 1.2, W: 60, dNow: 0 });
  assert.deepEqual(workSoFar(50, 2, 2.7), { sNow: 2, W: 100, dNow: 0.7 });
});

test('work: test choices are the answer and three distinct whole mistakes', () => {
  const c = choicesFrom(work(40, 3), workMistakes(40, 3, 1.5));
  assert.equal(c[0].value, 120);
  assert.equal(c.length, 4);
  assert.equal(new Set(c.map((x) => x.value)).size, 4);
  assert.ok(c.every((x) => Number.isInteger(x.value)));
  assert.deepEqual(
    c.slice(1).map((x) => x.why),
    ['w_sd', 'w_add', 'w_d'],
  );
  const f = choicesFrom(60, forceMistakes(240, 4, 2));
  assert.deepEqual(
    f.map((x) => x.value),
    [60, 40, 960, 120],
  );
});
