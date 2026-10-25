// The maths of the gravitational-force figure (book p68, topic 3.2.1): Newton's law of gravitation for the apples
// (a quarter of the pull at twice the distance, never zero), the numbers written as a × 10ⁿ, the places on the
// Earth's edge (you in Bangladesh, the person exactly opposite in a boat on the Pacific), the four directions of
// the "which way is down?" question, and the straight path of a body whose pull is taken away.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as gf from '../../assets/gravitational-force/src/physics.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} ≈ ${b}`);

describe('gravitational force: Newton’s law for the apples', () => {
  it('two 1 kg masses 1 m apart pull with G newtons', () => {
    close(gf.gravity(1, 1, 1), gf.G);
  });
  it('two 200 g apples 20 cm apart pull with about 6.7 × 10⁻¹¹ N', () => {
    close(gf.applePull(20), (6.674e-11 * 0.2 * 0.2) / 0.2 ** 2);
    assert.deepEqual(gf.scientific(gf.applePull(20)), { a: '6.7', n: -11 });
  });
  it('at twice the distance the pull is a quarter, and it never reaches zero', () => {
    for (const d of [15, 20, 25, 30]) close(gf.applePull(2 * d) / gf.applePull(d), 0.25);
    let last = Infinity;
    for (let d = gf.GAP.min; d <= gf.GAP.max; d += 0.5) {
      const f = gf.applePull(d);
      assert.ok(f > 0 && f < last);
      last = f;
    }
  });
  it('the starting distance is inside the range the apple can be dragged', () => {
    assert.ok(gf.GAP.min <= gf.GAP.start && gf.GAP.start <= gf.GAP.max);
    assert.ok(gf.GAP.min > 2 * gf.FACTS.apple.radius, 'the apples never overlap');
  });
});

describe('gravitational force: numbers as a × 10ⁿ', () => {
  it('keeps one decimal and the right power of ten', () => {
    assert.deepEqual(gf.scientific(6.674e-11), { a: '6.7', n: -11 });
    assert.deepEqual(gf.scientific(1.5e8), { a: '1.5', n: 8 });
    assert.deepEqual(gf.scientific(2), { a: '2.0', n: 0 });
  });
  it('moves to the next power when the decimal rounds up to 10', () => {
    assert.deepEqual(gf.scientific(9.97e-11), { a: '1.0', n: -10 });
  });
});

describe('gravitational force: places on the Earth’s edge', () => {
  it('turns latitudes into rim angles and back', () => {
    for (const lat of [-80, -23.5, 0, 23.5, 60]) {
      close(gf.rimLatLon(gf.rimAngle(lat, true)).lat, lat);
      assert.equal(gf.rimLatLon(gf.rimAngle(lat, true)).lon, 90);
      close(gf.rimLatLon(gf.rimAngle(lat, false)).lat, lat);
      assert.equal(gf.rimLatLon(gf.rimAngle(lat, false)).lon, -90);
    }
  });
  it('starts you in Bangladesh, on land', () => {
    assert.deepEqual(gf.placeAt(gf.PEOPLE.you), { from: 64.5, key: 'bangladesh', sea: false });
  });
  it('puts the far person exactly opposite you, in a boat on the Pacific', () => {
    assert.equal(gf.angleBetween(gf.PEOPLE.you, gf.PEOPLE.far), 180);
    assert.equal(gf.placeAt(gf.PEOPLE.far).key, 'pacific');
    assert.equal(gf.placeAt(gf.PEOPLE.far).sea, true);
  });
  it('names the poles, the oceans and the lands on the way round', () => {
    assert.equal(gf.placeAt(0).key, 'north_pole');
    assert.equal(gf.placeAt(359.9).key, 'north_pole');
    assert.equal(gf.placeAt(180).key, 'south_pole');
    assert.equal(gf.placeAt(100).key, 'indian_ocean');
    assert.equal(gf.placeAt(310).key, 'usa');
    assert.equal(gf.placeAt(-50).key, 'usa'); // the same place, the angle wrapped
    for (const p of gf.PLACES) assert.equal(gf.placeAt(p.from).key, p.key);
  });
  it('rimAngleOf undoes rimPoint', () => {
    for (const a of [0, 30, 66.5, 120, 180, 246.5, 300]) {
      const p = gf.rimPoint(a, 20);
      close(gf.rimAngleOf(p.x, p.y), a);
      close(Math.hypot(p.x, p.y), 20);
    }
  });
});

describe('gravitational force: which way is down?', () => {
  it('towards the centre is straight opposite "away", and along the ground is square to it', () => {
    for (const a of [10, 66.5, 120, 200, 246.5, 330]) {
      const d = gf.directionChoices(a);
      assert.equal(gf.angleBetween(d.inward, d.outward), 180);
      assert.equal(gf.angleBetween(d.inward, d.tangent), 90);
    }
  });
  it('at the North Pole down is down the screen; at the South Pole it is up the screen', () => {
    assert.equal(gf.directionChoices(0).inward, 270);
    assert.equal(gf.directionChoices(180).inward, 90);
  });
  it('the question only uses places where the four arrows are clearly apart', () => {
    const fair = gf.fairQuestionAngles(45);
    assert.ok(fair.length > 40);
    for (const a of fair) assert.ok(gf.choiceSpread(a) >= 45);
    assert.ok(!fair.includes(0) && !fair.includes(180), 'not at the poles, where "down the screen" is a right answer or "away"');
  });
});

describe('gravitational force: without the pull, a straight line', () => {
  it('goes round anticlockwise seen from above', () => {
    const p = gf.orbitPoint(30, 90);
    close(p.x, 0, 1e-12);
    close(p.z, -30);
  });
  it('leaves the circle along its tangent, in a straight line, at the speed it had', () => {
    const r = 30;
    const period = 10;
    const phi = 35;
    const p0 = gf.straightPath(r, phi, period, 0);
    const q = gf.orbitPoint(r, phi);
    close(p0.x, q.x);
    close(p0.z, q.z);
    const p1 = gf.straightPath(r, phi, period, 1);
    const p2 = gf.straightPath(r, phi, period, 2);
    // collinear, evenly spaced: a straight line at a steady speed
    close(p2.x - p1.x, p1.x - p0.x);
    close(p2.z - p1.z, p1.z - p0.z);
    const speed = Math.hypot(p1.x - p0.x, p1.z - p0.z);
    close(speed, (2 * Math.PI * r) / period);
    // at first it moves square to the radius (the tangent), the way the circle goes
    close((p1.x - p0.x) * q.x + (p1.z - p0.z) * q.z, 0, 1e-9);
    const ahead = gf.orbitPoint(r, phi + 1);
    assert.ok((p1.x - p0.x) * (ahead.x - q.x) + (p1.z - p0.z) * (ahead.z - q.z) > 0);
    // and it never comes back: its distance from the centre only grows
    for (let t = 0.5; t < 5; t += 0.5) assert.ok(Math.hypot(gf.straightPath(r, phi, period, t).x, gf.straightPath(r, phi, period, t).z) > r);
  });
  it('turns a quarter in a quarter of the period', () => {
    assert.equal(gf.turned(2.5, 10), 90);
  });
});
