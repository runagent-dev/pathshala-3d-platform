import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { Mesh } from 'three';
import { createHeartModel } from '../../assets/periodic-motion/src/heart-model.js';

function volume(g) {
  const p = g.attributes.position,
    ix = g.index;
  let sum = 0;
  for (let i = 0; i < ix.count; i += 3) {
    const a = ix.getX(i),
      b = ix.getX(i + 1),
      c = ix.getX(i + 2);
    sum +=
      p.getX(a) * (p.getY(b) * p.getZ(c) - p.getZ(b) * p.getY(c)) +
      p.getY(a) * (p.getZ(b) * p.getX(c) - p.getX(b) * p.getZ(c)) +
      p.getZ(a) * (p.getX(b) * p.getY(c) - p.getY(b) * p.getX(c));
  }
  return Math.abs(sum / 6);
}

describe('periodic heart: continuous tissue and a reversible beat', () => {
  let model, tissue;
  before(() => {
    model = createHeartModel();
    tissue = model.root.getObjectByName('SculptedMyocardium');
    assert.ok(tissue instanceof Mesh);
  });
  it('has a closed tissue surface with finite unit normals and shared vertices', () => {
    const g = tissue.geometry,
      p = g.attributes.position,
      n = g.attributes.normal,
      edges = new Map();
    assert.ok(p.count < 80000, 'shared vertices keep live deformation affordable');
    assert.ok(volume(g) > 0.0001);
    for (let i = 0; i < p.count; i++) {
      assert.ok(Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i)));
      const len = Math.hypot(n.getX(i), n.getY(i), n.getZ(i));
      assert.ok(len > 0.98 && len < 1.02);
    }
    const key = (i) => [p.getX(i), p.getY(i), p.getZ(i)].map((v) => Math.round(v * 1e7)).join(',');
    for (let i = 0; i < g.index.count; i += 3) {
      const v = [0, 1, 2].map((j) => key(g.index.getX(i + j)));
      for (let j = 0; j < 3; j++) {
        const edge = [v[j], v[(j + 1) % 3]].sort().join('|');
        edges.set(edge, (edges.get(edge) || 0) + 1);
      }
    }
    assert.ok(
      [...edges.values()].every((n) => n === 2),
      'no gaps between the atrial and ventricular tissue',
    );
  });
  it('contracts after excitation and returns exactly to its resting surface', () => {
    model.beat(0, 0);
    const g = tissue.geometry,
      rest = g.attributes.position.array.slice(),
      before = volume(g);
    model.beat(0, 1);
    const squeezed = volume(g);
    assert.ok(squeezed < before * 0.99 && squeezed > before * 0.6);
    model.beat(0, 0);
    assert.deepEqual(g.attributes.position.array, rest);
  });
  it('keeps the exposed vessel cuts stationary while their roots follow the beat', () => {
    const aorta = model.root.getObjectByName('Aorta');
    assert.ok(aorta instanceof Mesh);
    const p = aorta.geometry.attributes.position,
      rest = p.array.slice();
    model.beat(0, 1);
    let rootMoves = false;
    for (let i = 0; i < p.count; i++) {
      if (rest[i * 3 + 1] > 0.08)
        assert.ok(Math.abs(p.getX(i) - rest[i * 3]) + Math.abs(p.getY(i) - rest[i * 3 + 1]) + Math.abs(p.getZ(i) - rest[i * 3 + 2]) < 1e-8);
      if (rest[i * 3 + 1] < 0.025 && Math.abs(p.getX(i) - rest[i * 3]) > 1e-6) rootMoves = true;
    }
    assert.ok(rootMoves);
    model.beat(0, 0);
  });
});
