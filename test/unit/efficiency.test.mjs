// The efficiency figure's maths (assets/efficiency/src/reading.js): the book's worked example on page 121, the three
// motors, waste always exactly input − work, the illustrated split adding up, the worked example's steppers, and the
// gear train's ratios.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BOOK,
  CONDITIONS,
  CONDITION_IDS,
  EX_LIMITS,
  TRAIN,
  energyAt,
  fixExample,
  groupJ,
  isBook,
  pct,
  runOf,
  solve,
  turnsFor,
  wasteShares,
} from '../../assets/efficiency/src/reading.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

test("efficiency: the book's example gives 9,800 J, 15,000 J, 5,200 J and 65.3%", () => {
  const r = solve(BOOK);
  close(r.work, 9800, 1e-6);
  close(r.input, 15000);
  close(r.waste, 5200, 1e-6);
  assert.equal(pct(r.eff), '65.3');
  assert.equal(r.possible, true);
  assert.equal(isBook(BOOK), true);
});

test('efficiency: the three motors take 15, 14 and 20 s (65.3%, 70%, 49%), and their waste splits add up', () => {
  const want = { book: '65.3', oiled: '70', worn: '49' };
  for (const id of CONDITION_IDS) {
    const run = runOf(id);
    const r = solve(run);
    assert.equal(pct(r.eff), want[id]);
    const w = CONDITIONS[id].waste;
    close(w.motor + w.friction + w.sound, BOOK.P - r.work / run.t, 1e-9);
    const sh = wasteShares(id);
    close(sh.motor + sh.friction + sh.sound, 1);
    assert.ok(r.eff < 100);
  }
  const e = energyAt(runOf('book'), 15, wasteShares('book'));
  close(e.motor, 2250, 1e-6);
  close(e.friction, 2850, 1e-6);
  close(e.sound, 100, 1e-6);
});

test('efficiency: at every moment the waste is exactly input − work, and the parts add up to it', () => {
  for (const id of CONDITION_IDS) {
    const run = runOf(id);
    for (let time = 0; time <= run.t; time += 0.37) {
      const e = energyAt(run, time, wasteShares(id));
      close(e.waste, e.input - e.work, 1e-9);
      close(e.motor + e.friction + e.sound, e.waste, 1e-9);
      if (time > 0) close(e.work / e.input, solve(run).work / solve(run).input, 1e-12);
      close(e.height, (run.h * time) / run.t, 1e-12);
    }
    assert.equal(energyAt(run, run.t + 5).height, run.h);
  }
});

test('efficiency: the worked example refuses numbers that would need 100% or more', () => {
  assert.equal(solve({ ...BOOK, t: 10 }).possible, true);
  assert.equal(solve({ ...BOOK, t: 9 }).possible, false); // 9,800 J of work from 9,000 J
  assert.equal(solve({ P: 980, t: 10, m: 100, h: 10 }).possible, false); // exactly 100%
  assert.equal(fixExample('t', 3), EX_LIMITS.t.min);
  assert.equal(fixExample('P', 1049), 1000);
  assert.equal(fixExample('m', 999), EX_LIMITS.m.max);
});

test('efficiency: joules are grouped the Bangladeshi way', () => {
  assert.equal(groupJ(9800), '9,800');
  assert.equal(groupJ(15000), '15,000');
  assert.equal(groupJ(120000), '1,20,000');
  assert.equal(groupJ(100), '100');
});

test('efficiency: the gear train winds 10 m with the motor at about 3,200 rpm', () => {
  const turns = turnsFor(10);
  close(turns.drum, 10 / TRAIN.drum);
  close(turns.motor, turns.drum * (TRAIN.gear / TRAIN.pinion) * TRAIN.wheel);
  const rpm = (turns.motor / (2 * Math.PI) / 15) * 60;
  assert.ok(rpm > 3000 && rpm < 3400, `${rpm}`);
});
