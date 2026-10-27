// The smooth floor the two skaters stand on: a pale slab with a line every half metre (so the distance each one goes
// can be read off against the floor) and a heavier line where they started. Metres, the top of the floor at y = 0.
import * as THREE from 'three';

export const RINK = { half: 7, depth: 1.3 };

export function createRink(half = RINK.half) {
  const root = new THREE.Group();
  root.name = 'Rink';
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(half * 2, 0.06, RINK.depth),
    new THREE.MeshStandardMaterial({ name: 'Floor', color: '#e1eaf3', roughness: 0.55, metalness: 0 }),
  );
  slab.position.y = -0.03;
  slab.receiveShadow = true;
  root.add(slab);
  const line = new THREE.MeshStandardMaterial({ name: 'FloorLine', color: '#b6c4d3', roughness: 0.7, metalness: 0 });
  const start = new THREE.MeshStandardMaterial({ name: 'StartLine', color: '#6d8099', roughness: 0.7, metalness: 0 });
  const tick = new THREE.BoxGeometry(0.012, 0.004, RINK.depth - 0.04);
  for (let k = -Math.floor(half / 0.5) + 1; k < half / 0.5; k++) {
    const m = new THREE.Mesh(tick, k === 0 ? start : line);
    m.position.set(k * 0.5, 0.001, 0);
    if (k === 0) m.scale.x = 2.2;
    root.add(m);
  }
  return { root };
}

/**
 * Where each skater started and how far each has gone: a small mark at each start and a bar from it to where the skater
 * is now, on the floor in front (so "the lighter one went twice as far" can be seen, not only read). A drawing, not exported.
 */
export function createMarks() {
  const root = new THREE.Group();
  root.name = 'DistanceBars';
  root.userData.noExport = true;
  const mat = new THREE.MeshStandardMaterial({ name: 'DistanceBar', color: '#3b4a5e', roughness: 0.6, metalness: 0 });
  const mk = (w, h, d) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.visible = false;
    root.add(m);
    return m;
  };
  const Z = 0.5;
  const bars = [mk(1, 0.018, 0.06), mk(1, 0.018, 0.06)];
  const starts = [mk(0.03, 0.018, 0.22), mk(0.03, 0.018, 0.22)];
  return {
    root,
    /** Start and present places (x, metres) of the two skaters. Nothing shows until a skater has moved. */
    set(startA, nowA, startB, nowB) {
      for (const [i, [x0, x1]] of [
        [startA, nowA],
        [startB, nowB],
      ].entries()) {
        const len = Math.abs(x1 - x0);
        const on = len > 0.006;
        bars[i].visible = on;
        starts[i].visible = on;
        if (!on) continue;
        bars[i].scale.x = len;
        bars[i].position.set((x0 + x1) / 2, 0.008, Z);
        starts[i].position.set(x0, 0.008, Z);
      }
    },
  };
}
