// The physics of reflection-amount: Fresnel's numbers against what the book says, the geometry of the jack and the eye.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  angleFor,
  depthFor,
  exactAngle,
  EYE_Y,
  fresnel,
  GLASS,
  MAX_ANGLE,
  MIN_ANGLE,
  nextStop,
  percent,
  percentIn,
  planeFor,
  points,
  rad,
  refractedAngle,
  SPAN,
  STOPS,
} from '../../assets/reflection-amount/src/reading.js';

test("Fresnel: the book's 4–5 % at small angles and much more near 80° and 90°", () => {
  assert.ok(Math.abs(fresnel(0) - 0.04) < 1e-9, 'at 0° it is ((n − 1) / (n + 1))²');
  assert.equal(percent(0), 4);
  assert.equal(percent(30), 4);
  assert.equal(percent(45), 5);
  assert.equal(percent(60), 9);
  assert.equal(percent(80), 39);
  assert.equal(percent(87), 74);
  assert.equal(fresnel(90), 1);
});

test("Fresnel: more reflection at every larger angle (the book's rule)", () => {
  for (let a = 1; a <= 90; a++) assert.ok(fresnel(a) > fresnel(a - 1), `at ${a}°`);
});

test('Fresnel: the reflected and the refracted parts add up', () => {
  for (const a of STOPS) assert.equal(percent(a) + percentIn(a), 100);
});

test('Snell: into glass at 60° the ray bends to about 35.3°, and at 87° to no more than the critical angle', () => {
  assert.ok(Math.abs(refractedAngle(60) - 35.264) < 0.01);
  assert.ok(refractedAngle(87) < 41.82);
});

test('the jack: the depth under the line from the flower to the eye gives the angle back', () => {
  for (let a = MIN_ANGLE; a <= MAX_ANGLE; a++) {
    assert.ok(Math.abs(Math.tan(rad(a)) - SPAN / depthFor(a)) < 1e-9);
    assert.equal(angleFor(planeFor(a)), a);
    assert.ok(Math.abs(exactAngle(planeFor(a)) - a) < 1e-9);
  }
});

test('the drawing: θᵢ = θᵣ at the point of incidence, and the normal is vertical there', () => {
  for (const a of STOPS) {
    const g = points(a);
    const i = (Math.atan2(g.flower.x - g.hit.x, g.flower.y - g.hit.y) * 180) / Math.PI;
    const r = (Math.atan2(g.hit.x - g.eye.x, g.eye.y - g.hit.y) * 180) / Math.PI;
    assert.ok(Math.abs(i - a) < 1e-9);
    assert.ok(Math.abs(r - a) < 1e-9);
    assert.equal(g.top.x, g.hit.x);
  }
});

test('the drawing: the refracted ray bends toward the normal and ends at the bottom of the slab', () => {
  for (const a of STOPS) {
    const g = points(a);
    assert.ok(Math.abs(g.inside.y - (g.hit.y - GLASS.thick)) < 1e-9);
    const inside = (Math.atan2(g.hit.x - g.inside.x, g.hit.y - g.inside.y) * 180) / Math.PI;
    assert.ok(Math.abs(inside - refractedAngle(a)) < 1e-6);
    assert.ok(inside < a);
  }
});

test('the drawing: the pattern he sees lies on his sight line through the glass', () => {
  for (const a of STOPS) {
    const g = points(a);
    assert.equal(g.under.x, -g.inside.x);
    assert.equal(g.under.y, g.inside.y);
    const inside = (Math.atan2(g.under.x - g.hit.x, g.hit.y - g.under.y) * 180) / Math.PI;
    assert.ok(Math.abs(inside - refractedAngle(a)) < 1e-6, 'it leaves the glass toward his eye at the angle of incidence');
    assert.ok(Math.abs(g.under.x) < GLASS.card, 'on the printed card');
  }
});

test('the glass stays below the eye and within the bench', () => {
  assert.ok(planeFor(MAX_ANGLE) < EYE_Y);
  assert.ok(planeFor(MIN_ANGLE) - GLASS.thick > 3);
  assert.ok(GLASS.halfX < SPAN, 'the slab ends before the eye and the flower');
});

test('stops: the action goes up through them and ends at the last', () => {
  assert.equal(nextStop(30), 60);
  assert.equal(nextStop(45), 60);
  assert.equal(nextStop(60), 80);
  assert.equal(nextStop(80), 87);
  assert.equal(nextStop(87), null);
});
