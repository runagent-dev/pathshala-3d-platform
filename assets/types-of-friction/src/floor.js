// The floor (metres): a plain light slab, a lane 0.56 m wide and 18 m long, with faint lines every 0.1 m across it (so
// the sliding crate is seen to move when the view follows it), and a dashed outline on it where the crate started.
import * as THREE from 'three';

export const FLOOR = { x0: -4, x1: 14, width: 0.56, thick: 0.02, tile: 0.1 };

function gridTexture() {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#eef0f3';
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = '#d9dde3';
  ctx.fillRect(0, 0, 3, S);
  ctx.fillRect(0, 0, S, 3);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.repeat.set((FLOOR.x1 - FLOOR.x0) / FLOOR.tile, FLOOR.width / FLOOR.tile);
  tex.offset.set(-FLOOR.x0 / FLOOR.tile, 0);
  return tex;
}

export function createFloor() {
  const root = new THREE.Group();
  root.name = 'Floor';
  const len = FLOOR.x1 - FLOOR.x0;
  const top = new THREE.MeshStandardMaterial({ name: 'FloorTop', map: gridTexture(), roughness: 0.9, metalness: 0 });
  const side = new THREE.MeshStandardMaterial({ name: 'FloorEdge', color: '#c9ced6', roughness: 0.9, metalness: 0 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(len, FLOOR.thick, FLOOR.width), [side, side, top, side, side, side]);
  slab.position.set((FLOOR.x0 + FLOOR.x1) / 2, -FLOOR.thick / 2, 0);
  slab.name = 'FloorSlab';
  slab.receiveShadow = true;
  root.add(slab);

  // where the crate started: a thin dashed outline on the floor
  const start = new THREE.Group();
  start.name = 'StartOutline';
  start.userData.noExport = true;
  const dashMat = new THREE.MeshBasicMaterial({ color: '#7d8794', toneMapped: false });
  start.visible = false;
  root.add(start);

  return {
    root,
    slab,
    /** Draw the outline of a footprint L × D (metres) centred on x. */
    setStart(x, L, D) {
      start.clear();
      const w = 0.002;
      const dash = 0.012;
      const gap = 0.009;
      const line = (x0, z0, lenA, alongX) => {
        for (let d = 0; d < lenA; d += dash + gap) {
          const l = Math.min(dash, lenA - d);
          const m = new THREE.Mesh(new THREE.BoxGeometry(alongX ? l : w, 0.001, alongX ? w : l), dashMat);
          m.position.set(alongX ? x0 + d + l / 2 : x0, 0.0005, alongX ? z0 : z0 + d + l / 2);
          start.add(m);
        }
      };
      line(x - L / 2, D / 2, L, true);
      line(x - L / 2, -D / 2, L, true);
      line(x - L / 2, -D / 2, D, false);
      line(x + L / 2, -D / 2, D, false);
    },
    showStart(on) {
      start.visible = on;
    },
  };
}
