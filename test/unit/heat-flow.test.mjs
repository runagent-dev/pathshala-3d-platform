import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AREA_RATIO, FLOW_SECONDS, SCENES, direction, levelsAt, progress, settle, volumes } from '../../assets/heat-flow/src/reading.js';

test('the settled height keeps the water: the same volume spread over both areas', () => {
  const { left, right } = SCENES.book;
  const h = settle(left, right);
  const before = volumes(left, right);
  const after = volumes(h, h);
  assert.ok(Math.abs(before.left + before.right - (after.left + after.right)) < 1e-9);
  assert.ok(h < left && h > right);
});

test('the tube is much narrower than the vessel, as in the book picture', () => {
  assert.ok(AREA_RATIO > 10);
  const { left, right } = SCENES.book;
  const v = volumes(left, right);
  assert.ok(v.right > 3 * v.left, 'the vessel holds more water although its surface is lower');
  assert.ok(left > right);
});

test('water goes from the higher surface to the lower one, whatever the amounts', () => {
  assert.equal(direction(22, 8), 'right');
  assert.equal(direction(8, 12), 'left');
  assert.equal(direction(10, 10), 'none');
});

test('progress starts at 0, ends at 1, never goes back, and is quickest at the start', () => {
  assert.equal(progress(0), 0);
  assert.equal(progress(FLOW_SECONDS), 1);
  assert.equal(progress(FLOW_SECONDS * 3), 1);
  let last = 0;
  for (let i = 1; i <= 20; i++) {
    const p = progress((FLOW_SECONDS * i) / 20);
    assert.ok(p >= last);
    last = p;
  }
  assert.ok(progress(0.5) - progress(0) > progress(FLOW_SECONDS) - progress(FLOW_SECONDS - 0.5));
});

test('the two heights meet at the end', () => {
  for (const { left, right } of Object.values(SCENES)) {
    const end = levelsAt(left, right, 1);
    assert.ok(Math.abs(end.left - end.right) < 1e-9);
    assert.ok(Math.abs(end.left - settle(left, right)) < 1e-9);
    const mid = levelsAt(left, right, 0.5);
    assert.ok(Math.abs(mid.left - mid.right) < Math.abs(left - right));
  }
});
