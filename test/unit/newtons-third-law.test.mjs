import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BOAT, G, APPLE_MASS, EARTH_MASS, boatAt, appleAt, earthAcceleration, sci } from '../../assets/newtons-third-law/src/physics.js';
const close = (a, b, tolerance = 1e-10) => assert.ok(Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(a), Math.abs(b)), `${a} vs ${b}`);
test('boat: the contact forces are equal and opposite while the feet push', () => {
  for (const time of [0.01, 0.1, 0.2, BOAT.pushTime]) {
    const p = boatAt(time);
    assert.equal(p.contact, true);
    close(BOAT.personMass * p.personA, BOAT.force);
    close(BOAT.boatMass * p.boatA, -BOAT.force);
  }
});
test('boat: horizontal momentum and centre of mass stay constant until landing', () => {
  const land = boatAt(0).landTime;
  for (let i = 0; i < 40; i++) {
    const p = boatAt((land * i) / 40);
    close(BOAT.personMass * p.personV + BOAT.boatMass * p.boatV, 0);
    close(BOAT.personMass * (p.personX - BOAT.startX) + BOAT.boatMass * p.boatX, 0);
  }
});
test('boat: the contact pair ends at takeoff, with continuous positions and velocities', () => {
  const before = boatAt(BOAT.pushTime),
    after = boatAt(BOAT.pushTime + 1e-8);
  assert.equal(after.contact, false);
  assert.equal(after.force, 0);
  assert.equal(after.personA, 0);
  assert.equal(after.boatA, 0);
  close(before.personX, after.personX, 1e-7);
  close(before.boatX, after.boatX, 1e-7);
  close(before.personV, after.personV);
  close(before.boatV, after.boatV);
});
test('boat: the person moves forward, the boat back, and the jump reaches the jetty', () => {
  const p = boatAt(0.6);
  assert.equal(p.phase, 'flight');
  assert.ok(p.personX > BOAT.startX);
  assert.ok(p.boatX < 0);
  assert.ok(p.personY > BOAT.footY);
  const end = boatAt(BOAT.duration);
  assert.equal(end.phase, 'landed');
  close(end.personY, BOAT.dockY);
  assert.ok(end.personX > 1.78);
  assert.ok(end.personX < 2.4);
});
test('boat: once on the jetty the person stops, while the boat keeps coasting', () => {
  const t = boatAt(0).landTime;
  const a = boatAt(t + 0.1),
    b = boatAt(t + 0.4);
  close(a.personX, b.personX);
  close(a.personV, 0);
  close(a.boatV, b.boatV);
  assert.ok(b.boatX < a.boatX);
});
test('apple: free-fall distance, speed and time to a specified surface', () => {
  const p = appleAt(0.2);
  close(p.fallen, 0.5 * G * 0.2 ** 2);
  close(p.v, G * 0.2);
  const end = appleAt(2, 1.4);
  close(end.fallen, 1.4);
  assert.equal(end.landed, true);
  close(end.tLand, Math.sqrt((2 * 1.4) / G));
});
test('apple and Earth: equal forces but accelerations differ by the mass ratio', () => {
  const a = earthAcceleration();
  close(a * EARTH_MASS, APPLE_MASS * G);
  close(a, (APPLE_MASS / EARTH_MASS) * G);
  assert.ok(a > 1.6e-24 && a < 1.7e-24);
  close(G / a, EARTH_MASS / APPLE_MASS);
});
test('Earth acceleration is expressed without losing the tiny exponent', () => {
  assert.deepEqual(sci(earthAcceleration()), { mantissa: 1.64, exponent: -24 });
  assert.deepEqual(sci(EARTH_MASS), { mantissa: 5.98, exponent: 24 });
});
