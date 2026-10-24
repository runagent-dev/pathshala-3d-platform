// The two quantities drawn on the map. The trail (দূরত্ব, blue): every bit of road the cyclist has ridden, going out
// on one side of the road and coming back on the other (Bangladesh keeps left), so a round trip shows twice. The
// arrow (সরণ, orange): a straight arrow from A to where the cyclist is now.
import * as THREE from 'three';
import { FRAME, ROAD_Y } from './countryside.js';
import { COUNT, END, STEP } from './road.js';

/** One colour per quantity (the panel uses the same, in style.css). */
export const COLORS = { distance: '#1c6fd9', displacement: '#e8590c' };

const LAST = Math.round(END / STEP); // samples the cyclist can reach: 0 … LAST

/** The ridden road: two lanes; mark(from, to) adds a piece (km), clear() empties both. */
export function createTrail() {
  const group = new THREE.Group();
  group.name = 'Trail (distance)';
  const material = new THREE.MeshBasicMaterial({ name: 'Distance', color: COLORS.distance, toneMapped: false, side: THREE.DoubleSide });
  const OFF = 21; // m from the road's middle to the lane's middle
  const HALF = 15; // half a lane's width, m
  const lanes = [1, -1].map((dir) => {
    // the rider's left: −right going out (dir 1), +right coming back (dir −1)
    const pos = new Float32Array(COUNT * 2 * 3);
    for (let i = 0; i < COUNT; i++) {
      const s = -dir;
      for (const [k, f] of [OFF - HALF, OFF + HALF].entries()) {
        pos.set([FRAME.cx[i] + FRAME.rx[i] * s * f, ROAD_Y + 1.5, FRAME.cz[i] + FRAME.rz[i] * s * f], (2 * i + k) * 3);
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
    mesh.name = dir > 0 ? 'Trail out' : 'Trail back';
    mesh.frustumCulled = false;
    mesh.visible = false;
    group.add(mesh);
    return { mesh, geo, index, covered: new Uint8Array(LAST) };
  });

  function rebuild(lane) {
    const a = lane.index.array;
    let n = 0;
    for (let i = 0; i < LAST; i++) {
      if (!lane.covered[i]) continue;
      const p = 2 * i;
      a[n++] = p;
      a[n++] = p + 1;
      a[n++] = p + 2;
      a[n++] = p + 1;
      a[n++] = p + 3;
      a[n++] = p + 2;
    }
    a.fill(0, n); // nothing left over past the draw range (the GLB export reads the whole index)
    lane.index.needsUpdate = true;
    lane.geo.setDrawRange(0, n);
    lane.mesh.visible = n > 0;
  }

  return {
    group,
    /** The cyclist rode from km a to km b: the pieces whose middle it passed are now on the trail. */
    mark(a, b) {
      const lane = lanes[b >= a ? 0 : 1];
      const lo = Math.min(a, b) / STEP - 0.5;
      const hi = Math.max(a, b) / STEP - 0.5;
      let changed = false;
      for (let i = Math.max(0, Math.ceil(lo)); i <= Math.min(LAST - 1, Math.floor(hi)); i++) {
        if (lane.covered[i]) continue;
        lane.covered[i] = 1;
        changed = true;
      }
      if (changed) rebuild(lane);
    },
    clear() {
      for (const lane of lanes) {
        lane.covered.fill(0);
        rebuild(lane);
      }
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
  dot.rotation.x = -Math.PI / 2;
  dot.position.y = Y + 0.2;
  const dotRim = new THREE.Mesh(
    new THREE.CircleGeometry(44, 28),
    new THREE.MeshBasicMaterial({ name: 'DisplacementTailRim', color: '#ffffff', toneMapped: false }),
  );
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
