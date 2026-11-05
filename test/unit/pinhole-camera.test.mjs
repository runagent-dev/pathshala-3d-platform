// The geometry of pinhole-camera: straight lines through the hole, the image's size, blur and brightness.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  blurDiameter,
  blurShare,
  brightness,
  clampU,
  clampV,
  FLAME,
  flicker,
  HOLE_Y,
  HOLES,
  imageGain,
  imageLength,
  magnification,
  points,
  project,
  round,
  shuffle,
  U,
  V,
} from '../../assets/pinhole-camera/src/reading.js';

const close = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≉ ${b}`);

test('the book: the farther the image forms, the bigger it is, in proportion', () => {
  assert.equal(imageLength(12, 18), 6);
  assert.equal(imageLength(12, 24), 8);
  assert.equal(imageLength(12, 24), 2 * imageLength(12, 12));
  assert.equal(imageLength(12, 12), FLAME.length); // equal distances, equal lengths
  assert.equal(magnification(9, 27), 3);
});

test('the image is upside down: every ray goes straight through the hole', () => {
  const { X, Y, X1, Y1, O } = points(10, 20);
  assert.equal(X1.y, HOLE_Y - 4);
  assert.equal(Y1.y, HOLE_Y + 4);
  assert.ok(X1.y < Y1.y && X.y > Y.y);
  // collinear: the slope before the hole equals the slope after it
  for (const [a, b] of [
    [X, X1],
    [Y, Y1],
  ])
    close((O.y - a.y) / (O.x - a.x), (b.y - O.y) / (b.x - O.x));
  assert.equal(X1.y - Y1.y, -imageLength(10, 20));
});

test('left and right turn over too', () => {
  const p = project({ x: -12, y: HOLE_Y + 1, z: 0.5 }, 12, 24);
  assert.equal(p.z, -1);
  assert.equal(p.y, HOLE_Y - 2);
  assert.equal(p.x, 24);
});

test('a point through a hole lands as a disc: the hole enlarged', () => {
  close(blurDiameter(HOLES.big, 12, 18), 2);
  close(blurDiameter(HOLES.tiny, 12, 12), 0.2);
  assert.equal(blurDiameter(0, 12, 18), 0);
});

test('a tiny hole is sharp at every distance: its blur stays a small share of the image', () => {
  for (let v = V.min; v <= V.max; v++) assert.ok(blurShare(HOLES.tiny, U.start, v) < 0.08, `at v = ${v}`);
  assert.ok(blurShare(HOLES.tiny, U.max, V.min) < 0.12); // the rail's extreme
  assert.ok(blurShare(HOLES.big, U.start, V.start) > 0.3);
  // farther away the share even falls a little
  assert.ok(blurShare(HOLES.tiny, 12, 27) < blurShare(HOLES.tiny, 12, 6));
});

test('brightness goes with (d/v)²: twice as far, a quarter as bright, and the candle’s place does not matter', () => {
  close(brightness(HOLES.tiny, V.start), 1);
  close(brightness(HOLES.tiny, 2 * V.start) * 4, 1);
  close(brightness(HOLES.big, V.start), 64);
  assert.equal(imageGain(0, 18), 0);
  assert.ok(imageGain(HOLES.tiny, V.max) > 0.5); // still seen at the far end
  assert.ok(imageGain(HOLES.tiny, 12) > 1.5 * imageGain(HOLES.tiny, 24)); // plainly fainter, twice as far
  assert.ok(imageGain(HOLES.big, V.start) <= 1.9);
});

test('the rail: steps of 1 cm, within its ends', () => {
  assert.equal(clampU(3), U.min);
  assert.equal(clampU(99), U.max);
  assert.equal(clampV(18.4), 18);
  assert.equal(clampV(18.6), 19);
  assert.equal(clampV(-1), V.min);
});

test('round leaves no binary leftovers; the flame stays near its size; shuffle loses nothing', () => {
  assert.equal(round(4 * (7 / 12), 1), 2.3);
  for (let t = 0; t < 20; t += 0.13) {
    const f = flicker(t);
    assert.ok(Math.abs(f.height - 1) < 0.05 && Math.abs(f.width - 1) < 0.05 && Math.abs(f.lean) < 0.13);
  }
  assert.deepEqual(shuffle([1, 2, 3, 4]).sort(), [1, 2, 3, 4]);
});
