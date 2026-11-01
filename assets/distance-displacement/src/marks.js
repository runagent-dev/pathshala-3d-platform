// The two quantities drawn on the map. The trail (দূরত্ব, blue): every bit of road the cyclist has ridden, going out
// on one side of the road and coming back on the other (Bangladesh keeps left); a piece ridden a second time the
// same way gets a second stripe further out, so riding there and back twice looks twice as long. The arrow (সরণ,
// orange): a straight arrow from A to where the cyclist is now.
import * as THREE from 'three';
import { FRAME, ROAD_Y } from './countryside.js';
import { COUNT, END, STEP } from './road.js';

/** One colour per quantity (the panel uses the same, in style.css). */
export const COLORS = { distance: '#1c6fd9', displacement: '#e8590c' };

const LAST = Math.round(END / STEP); // samples the cyclist can reach: 0 … LAST
// the stripes on each side of the road's middle, m: the first pass on the road, the second at its edge and verge
const STRIPES = [
  { pass: 1, from: 6, to: 36 },
  { pass: 2, from: 42, to: 64 },
];

/** The ridden road. mark(from, to) adds a piece ridden (km); clear() empties it. One mesh for all four stripes. */
export function createTrail() {
  const group = new THREE.Group();
  group.name = 'Trail (distance)';
  const material = new THREE.MeshBasicMaterial({ name: 'Distance', color: COLORS.distance, toneMapped: false, side: THREE.DoubleSide });
  // passes over each piece of road, going out (km growing) and coming back
  const passes = { out: new Uint8Array(LAST), back: new Uint8Array(LAST) };
  const stripes = []; // { way, pass, base: its first vertex }
  const pos = new Float32Array(4 * COUNT * 2 * 3);
  for (const way of ['out', 'back']) {
    // on the rider's left: −right going out, +right coming back
    const s = way === 'out' ? -1 : 1;
    for (const { pass, from, to } of STRIPES) {
      const base = stripes.length * COUNT * 2;
      for (let i = 0; i < COUNT; i++) {
        for (const [k, f] of [from, to].entries()) {
          const at = (base + 2 * i + k) * 3;
          pos[at] = FRAME.cx[i] + FRAME.rx[i] * s * f;
          pos[at + 1] = ROAD_Y + 1.5;
          pos[at + 2] = FRAME.cz[i] + FRAME.rz[i] * s * f;
        }
      }
      stripes.push({ way, pass, base });
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const index = new THREE.BufferAttribute(new Uint32Array(4 * LAST * 6), 1);
  index.setUsage(THREE.DynamicDrawUsage);
  geo.setIndex(index);
  geo.setDrawRange(0, 0);
  geo.computeBoundingSphere();
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = 'Trail';
  mesh.frustumCulled = false;
  mesh.visible = false;
  group.add(mesh);

  /** Write the index of every piece ridden, each stripe in turn. */
  function rebuild() {
    const a = index.array;
    let n = 0;
    for (const { way, pass, base } of stripes) {
      const count = passes[way];
      for (let i = 0; i < LAST; i++) {
        if (count[i] < pass) continue;
        const p = base + 2 * i;
        a[n++] = p;
        a[n++] = p + 1;
        a[n++] = p + 2;
        a[n++] = p + 1;
        a[n++] = p + 3;
        a[n++] = p + 2;
      }
    }
    a.fill(0, n); // nothing left over past the draw range (the GLB export reads the whole index)
    index.needsUpdate = true;
    geo.setDrawRange(0, n);
    mesh.visible = n > 0;
  }

  return {
    group,
    /**
     * The cyclist rode from km a to km b: each piece whose middle it passed (a < middle ≤ b going out, b ≤ middle
     * < a coming back, so moves that follow each other never count a piece twice) has one more pass that way.
     */
    mark(a, b) {
      if (a === b) return;
      const way = b > a ? 'out' : 'back';
      const count = passes[way];
      const lo = Math.min(a, b) / STEP - 0.5;
      const hi = Math.max(a, b) / STEP - 0.5;
      const first = Math.max(0, way === 'out' ? Math.floor(lo) + 1 : Math.ceil(lo));
      const last = Math.min(LAST - 1, way === 'out' ? Math.floor(hi) : Math.ceil(hi) - 1);
      let grew = false;
      for (let i = first; i <= last; i++) {
        if (count[i] < 255) count[i]++;
        if (count[i] <= 2) grew = true;
      }
      if (grew) rebuild();
    },
    clear() {
      passes.out.fill(0);
      passes.back.fill(0);
      rebuild();
    },
  };
}

/**
 * The displacement arrow from A to the cyclist, lying flat a little above the fields: orange inside a white rim and a
 * thin dark edge, so it stands out on the pale stubble, the road and the blue path alike; a dot at its tail (at A)
 * shows where it starts even when it is zero. One mesh (vertex colours): the layers are written in order, dark
 * edge, white rim, orange, and drawn after the scenery without writing depth, so each covers the one before.
 */
export function createArrow() {
  const group = new THREE.Group();
  group.name = 'Arrow (displacement)';
  const Y = ROAD_Y + 9;
  const DOT = 28; // segments round the tail dot
  const LAYERS = [
    { color: '#3b2312', pad: 15 }, // the dark edge
    { color: '#ffffff', pad: 9 }, // the white rim
    { color: COLORS.displacement, pad: 0 },
  ];
  const ARROW_V = 7; // a shaft (4) and a head (3)
  const DOT_V = DOT + 1;
  const count = LAYERS.length * (ARROW_V + DOT_V);
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const index = [];
  const c = new THREE.Color();
  const dotAt = (k) => k * DOT_V;
  const arrowAt = (k) => LAYERS.length * DOT_V + k * ARROW_V;
  for (const [k, layer] of LAYERS.entries()) {
    c.set(layer.color);
    for (let i = 0; i < DOT_V; i++) c.toArray(col, (dotAt(k) + i) * 3);
    for (let i = 0; i < ARROW_V; i++) c.toArray(col, (arrowAt(k) + i) * 3);
  }
  // layer by layer (the dot and the arrow together), so the dark edge and the white rim go round both as one shape
  for (const k of LAYERS.keys()) {
    const d = dotAt(k);
    for (let i = 0; i < DOT; i++) index.push(d, d + 1 + i, d + 1 + ((i + 1) % DOT));
    const o = arrowAt(k);
    index.push(o, o + 1, o + 2, o, o + 2, o + 3, o + 4, o + 5, o + 6);
  }
  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(pos, 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', posAttr);
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(index);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ name: 'Displacement', vertexColors: true, toneMapped: false, side: THREE.DoubleSide, depthWrite: false }),
  );
  mesh.name = 'Displacement';
  mesh.position.y = Y;
  mesh.renderOrder = 3; // after the road, the trail and the fields
  mesh.frustumCulled = false;
  group.add(mesh);

  let thick = 1;
  const to = { x: 0, z: 0 };
  const put = (i, x, z) => {
    pos[i * 3] = x;
    pos[i * 3 + 1] = 0;
    pos[i * 3 + 2] = z;
  };
  /** Write every layer: the dots round A, and the arrow of length L along the angle `turn` (or nothing if L < 1). */
  function write() {
    const L = Math.hypot(to.x, to.z);
    const f = thick;
    for (const [k, layer] of LAYERS.entries()) {
      const r = 34 * f + layer.pad * f;
      const o = dotAt(k);
      put(o, 0, 0);
      for (let i = 0; i < DOT; i++) put(o + 1 + i, r * Math.cos((i / DOT) * Math.PI * 2), r * Math.sin((i / DOT) * Math.PI * 2));
    }
    const cs = L >= 1 ? to.x / L : 1;
    const sn = L >= 1 ? to.z / L : 0;
    // the head at most 0.55 of a short arrow, less when the arrow is drawn thicker (else it becomes a wedge)
    const head = Math.min(150 * f, L * (0.55 - 0.1 * Math.min(1, (f - 1) / 1.4)));
    const halfHead = Math.max(head * 0.47, 10 * f);
    const half = 21 * f;
    const shaft = L - head;
    for (const [k, layer] of LAYERS.entries()) {
      const o = arrowAt(k);
      if (L < 1) {
        for (let i = 0; i < ARROW_V; i++) put(o + i, 0, 0);
        continue;
      }
      const pad = layer.pad * f;
      // along the arrow (u) and across it (v), turned to point at the cyclist
      const at = (i, u, v) => put(o + i, u * cs - v * sn, u * sn + v * cs);
      at(0, -pad, -half - pad);
      at(1, shaft + pad * 0.2, -half - pad);
      at(2, shaft + pad * 0.2, half + pad);
      at(3, -pad, half + pad);
      at(4, shaft - pad * 0.9, -halfHead - pad * 1.6);
      at(5, L + pad * 1.9, 0);
      at(6, shaft - pad * 0.9, halfHead + pad * 1.6);
    }
    posAttr.needsUpdate = true;
  }
  write();

  return {
    group,
    /** Point the arrow from A (the origin) to the scene point (x, z); none when it is shorter than 1 m. */
    set(x, z) {
      if (x === to.x && z === to.z) return;
      to.x = x;
      to.z = z;
      write();
    },
    /**
     * Thicker (not longer) by f ≥ 1, so the arrow stays a few px wide on a small map. Returns true if it changed.
     */
    thick(f) {
      if (Math.abs(f - thick) < 0.02) return false;
      thick = f;
      write();
      return true;
    },
  };
}
