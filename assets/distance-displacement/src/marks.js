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

/** The ridden road. mark(from, to) adds a piece ridden (km); clear() empties it. */
export function createTrail() {
  const group = new THREE.Group();
  group.name = 'Trail (distance)';
  const material = new THREE.MeshBasicMaterial({ name: 'Distance', color: COLORS.distance, toneMapped: false, side: THREE.DoubleSide });
  // passes over each piece of road, going out (km growing) and coming back
  const passes = { out: new Uint8Array(LAST), back: new Uint8Array(LAST) };
  const stripes = [];
  for (const way of ['out', 'back']) {
    // on the rider's left: −right going out, +right coming back
    const s = way === 'out' ? -1 : 1;
    for (const { pass, from, to } of STRIPES) {
      const pos = new Float32Array(COUNT * 2 * 3);
      for (let i = 0; i < COUNT; i++) {
        for (const [k, f] of [from, to].entries()) {
          const at = (2 * i + k) * 3;
          pos[at] = FRAME.cx[i] + FRAME.rx[i] * s * f;
          pos[at + 1] = ROAD_Y + 1.5;
          pos[at + 2] = FRAME.cz[i] + FRAME.rz[i] * s * f;
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const index = new THREE.BufferAttribute(new Uint16Array(LAST * 6), 1);
      index.setUsage(THREE.DynamicDrawUsage);
      geo.setIndex(index);
      geo.setDrawRange(0, 0);
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, material);
      mesh.name = `Trail ${way} ${pass}`;
      mesh.frustumCulled = false;
      mesh.visible = false;
      group.add(mesh);
      stripes.push({ way, pass, mesh, geo, index });
    }
  }

  function rebuild(stripe) {
    const count = passes[stripe.way];
    const a = stripe.index.array;
    let n = 0;
    for (let i = 0; i < LAST; i++) {
      if (count[i] < stripe.pass) continue;
      const p = 2 * i;
      a[n++] = p;
      a[n++] = p + 1;
      a[n++] = p + 2;
      a[n++] = p + 1;
      a[n++] = p + 3;
      a[n++] = p + 2;
    }
    a.fill(0, n); // nothing left over past the draw range (the GLB export reads the whole index)
    stripe.index.needsUpdate = true;
    stripe.geo.setDrawRange(0, n);
    stripe.mesh.visible = n > 0;
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
      const grew = [false, false];
      for (let i = first; i <= last; i++) {
        if (count[i] < 255) count[i]++;
        if (count[i] <= 2) grew[count[i] - 1] = true;
      }
      for (const stripe of stripes) if (stripe.way === way && grew[stripe.pass - 1]) rebuild(stripe);
    },
    clear() {
      passes.out.fill(0);
      passes.back.fill(0);
      for (const stripe of stripes) rebuild(stripe);
    },
  };
}

/** The displacement arrow from A to the cyclist, lying flat a little above the fields, with a white rim. */
export function createArrow() {
  const group = new THREE.Group();
  group.name = 'Arrow (displacement)';
  const Y = ROAD_Y + 9;
  const make = (color, name, y, order) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(7 * 3), 3));
    geo.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6]);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ name, color, toneMapped: false, side: THREE.DoubleSide }));
    mesh.name = name;
    mesh.position.y = y;
    mesh.renderOrder = order;
    mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  };
  const rim = make('#ffffff', 'ArrowRim', Y - 0.5, 1);
  const body = make(COLORS.displacement, 'Displacement', Y, 2);
  // the tail at A: a dot, so a zero displacement still shows where it starts
  const dot = new THREE.Mesh(
    new THREE.CircleGeometry(34, 28),
    new THREE.MeshBasicMaterial({ name: 'DisplacementTail', color: COLORS.displacement, toneMapped: false }),
  );
  dot.name = 'Displacement tail';
  dot.rotation.x = -Math.PI / 2;
  dot.position.y = Y + 0.2;
  const dotRim = new THREE.Mesh(
    new THREE.CircleGeometry(44, 28),
    new THREE.MeshBasicMaterial({ name: 'DisplacementTailRim', color: '#ffffff', toneMapped: false }),
  );
  dotRim.name = 'Displacement tail rim';
  dotRim.rotation.x = -Math.PI / 2;
  dotRim.position.y = Y - 0.6;
  group.add(dotRim, dot);

  /** Write an arrow of length L (m) along +x into a mesh, grown by pad on every side. */
  function shape(mesh, L, pad) {
    const head = Math.min(150, L * 0.55);
    const halfHead = Math.max(head * 0.47, 10);
    const half = 21;
    const shaft = L - head;
    const p = mesh.geometry.attributes.position;
    const a = p.array;
    const tip = L + pad * 1.9;
    const set = (i, x, z) => {
      a[i * 3] = x;
      a[i * 3 + 1] = 0;
      a[i * 3 + 2] = z;
    };
    set(0, -pad, -half - pad);
    set(1, shaft + pad * 0.2, -half - pad);
    set(2, shaft + pad * 0.2, half + pad);
    set(3, -pad, half + pad);
    set(4, shaft - pad * 0.9, -halfHead - pad * 1.6);
    set(5, tip, 0);
    set(6, shaft - pad * 0.9, halfHead + pad * 1.6);
    p.needsUpdate = true;
  }

  return {
    group,
    /** Point the arrow from A (the origin) to the scene point (x, z); hidden when it is shorter than 1 m. */
    set(x, z) {
      const L = Math.hypot(x, z);
      body.visible = rim.visible = L >= 1;
      if (L < 1) return;
      shape(body, L, 0);
      shape(rim, L, 9);
      body.rotation.y = rim.rotation.y = Math.atan2(-z, x);
    },
  };
}
