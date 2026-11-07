// The maths of electrostatic-induction: how many drawn electrons the rod moves, where the charges can sit on a
// sphere, the fewest-moves pairing of electrons and places, and the comb's timeline.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  angle,
  assign,
  COMB,
  combPhase,
  evenSites,
  farSites,
  fibonacci,
  G_FAR,
  G_NEAR,
  gapCm,
  induced,
  layout,
  netCharge,
  NMAX,
  seg,
  SITES,
  spreadPoints,
} from '../../assets/electrostatic-induction/src/reading.js';

test('no drawn electron moves at the far end of the drag, all of them at the nearest gap', () => {
  assert.equal(induced(G_FAR), 0);
  assert.equal(induced(G_NEAR), NMAX);
  assert.equal(induced(0), NMAX);
  assert.equal(induced(1), 0);
});

test('the nearer the rod, the more electrons move, never fewer', () => {
  let last = induced(G_FAR);
  for (let g = G_FAR; g >= G_NEAR; g -= 0.001) {
    const n = induced(g);
    assert.ok(n >= last, `gap ${g}`);
    assert.ok(Number.isInteger(n));
    last = n;
  }
});

test('the gap reads in whole centimetres', () => {
  assert.equal(gapCm(0.012), 1);
  assert.equal(gapCm(0.11), 11);
});

test('Fibonacci points are unit vectors spread over the whole sphere', () => {
  const pts = fibonacci(SITES);
  assert.equal(pts.length, SITES);
  for (const p of pts) assert.ok(Math.abs(Math.hypot(...p) - 1) < 1e-9);
  const sum = pts.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]);
  assert.ok(Math.hypot(...sum) < 1.2);
});

test('the near cap lies toward the rod, clear of the fixed charges, nearest place first', () => {
  const toward = [-1, 0, 0];
  const L = layout(toward);
  assert.equal(L.sites.length, SITES);
  assert.equal(L.cap.length, NMAX * 2);
  assert.equal(L.spread.length, NMAX);
  for (const p of L.cap) {
    assert.ok(angle(p, toward) < (62 * Math.PI) / 180 + 1e-9);
    for (const q of L.sites) assert.ok(angle(p, q) > 0.05);
  }
  for (let i = 1; i < L.cap.length; i++) assert.ok(angle(L.cap[i], toward) >= angle(L.cap[i - 1], toward) - 1e-9);
});

test('electrons leave the sites farthest from the rod', () => {
  const toward = [-1, 0, 0];
  const { sites } = layout(toward);
  const far = farSites(sites, toward, 4);
  assert.equal(new Set(far).size, 4);
  for (const i of far) assert.ok(sites[i][0] > 0, 'on the far side');
});

test('the left-bare sites of a charged sphere spread over all of it', () => {
  const { sites } = layout([-1, 0, 0]);
  const even = evenSites(sites, 8);
  assert.equal(new Set(even).size, 8);
  assert.ok(even.some((i) => sites[i][0] > 0.3));
  assert.ok(even.some((i) => sites[i][0] < -0.3));
});

test('spreadPoints keeps away from what it must avoid', () => {
  const pts = fibonacci(100);
  const avoid = [[1, 0, 0]];
  const [first] = spreadPoints(pts, 1, avoid);
  assert.ok(angle(first, avoid[0]) > 2.7);
});

test('pairing: electrons already in place stay, the rest take the shortest trips, impossible trips are refused', () => {
  const els = [0, 5, 9];
  const same = (e, t) => e === t;
  const cost = (e, t) => (t > 100 ? Number.POSITIVE_INFINITY : Math.abs(e - t));
  assert.deepEqual(
    assign(els, [5, 1, 8], cost, same),
    [1, 1, 1].map((_, i) => [1, 0, 2][i]),
  );
  assert.deepEqual(assign([1], [200], cost, same), [-1]);
});

test('net charge counts extra and missing electrons', () => {
  assert.equal(netCharge(SITES), 0);
  assert.equal(netCharge(SITES + 8), -8);
  assert.equal(netCharge(SITES - 8), 8);
});

test('the comb: down, the paper polarised, the jump, stuck, charged, the fall, in that order', () => {
  assert.equal(seg(-1, [0, 1]), 0);
  assert.equal(seg(2, [0, 1]), 1);
  assert.deepEqual(combPhase(0), { lower: 0, polar: 0, jump: 0, stuck: false, charged: 0, fall: 0 });
  const mid = combPhase(COMB.stick[0] + 0.2);
  assert.equal(mid.lower, 1);
  assert.equal(mid.polar, 1);
  assert.equal(mid.jump, 1);
  assert.equal(mid.stuck, true);
  assert.equal(mid.charged, 0);
  const end = combPhase(COMB.end);
  assert.equal(end.charged, 1);
  assert.equal(end.fall, 1);
  assert.equal(end.stuck, false);
});
