// The wooden crate (metres): 0.8 m long (x, the way it is pushed), 0.9 m high, 0.7 m deep. Planks with a grain drawn on
// a canvas (no image files), a darker frame on every edge and a cross brace on the two long sides, the way a real
// shipping crate is nailed together. Drawn as three meshes (planks, frame, nails). Origin: on the floor under the middle of the crate, +x forward, +y up.
import * as THREE from 'three';
import { mergeStatic } from './merge.js';

export const CRATE = { L: 0.8, H: 0.9, D: 0.7 };
const FRAME = 0.075; // the frame boards' width
const BOARD = 0.022; // and thickness

/** Planks across the face with seams between them and a long grain (deterministic: a seeded generator). */
function plankTexture(seed0, light) {
  const W = 256;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  let seed = seed0;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const planks = 5;
  for (let i = 0; i < planks; i++) {
    const y0 = (i * H) / planks;
    const tone = light ? 196 + rnd() * 22 : 168 + rnd() * 22;
    ctx.fillStyle = `rgb(${tone}, ${tone * 0.7}, ${tone * 0.4})`;
    ctx.fillRect(0, y0, W, H / planks);
    for (let k = 0; k < 14; k++) {
      const y = y0 + rnd() * (H / planks);
      ctx.strokeStyle = `rgba(110, 62, 22, ${0.07 + rnd() * 0.16})`;
      ctx.lineWidth = 0.6 + rnd() * 1.3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(W * 0.3, y + (rnd() - 0.5) * 5, W * 0.7, y + (rnd() - 0.5) * 5, W, y + (rnd() - 0.5) * 3);
      ctx.stroke();
    }
    // a knot now and then
    if (rnd() < 0.5) {
      ctx.fillStyle = 'rgba(96, 52, 18, 0.35)';
      ctx.beginPath();
      ctx.ellipse(rnd() * W, y0 + (0.3 + rnd() * 0.4) * (H / planks), 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(70, 38, 12, 0.55)'; // the seam
    ctx.fillRect(0, y0, W, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function createCrate() {
  const root = new THREE.Group();
  root.name = 'WoodenCrate';
  const body = new THREE.Group();
  body.name = 'CrateBody';
  root.add(body);
  const { L, H, D } = CRATE;
  const planks = new THREE.MeshStandardMaterial({ name: 'CratePlanks', map: plankTexture(7, true), roughness: 0.82, metalness: 0 });
  const boards = new THREE.MeshStandardMaterial({
    name: 'CrateFrame',
    map: plankTexture(31, false),
    color: '#d9b48a',
    roughness: 0.78,
    metalness: 0,
  });
  const nails = new THREE.MeshStandardMaterial({ name: 'Nails', color: '#5d5a55', roughness: 0.4, metalness: 0.7 });

  const box = new THREE.Mesh(new THREE.BoxGeometry(L - 0.01, H - 0.01, D - 0.01), planks);
  box.position.y = H / 2;
  box.name = 'Crate';
  body.add(box);

  // the frame: a board along every edge, standing a little proud of the planks
  const edge = (sx, sy, sz, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), boards);
    m.position.set(x, y, z);
    body.add(m);
    return m;
  };
  for (const z of [-1, 1]) for (const y of [FRAME / 2, H - FRAME / 2]) edge(L + BOARD, FRAME, BOARD, 0, y, z * (D / 2 + BOARD / 2 - 0.004));
  for (const z of [-1, 1])
    for (const x of [-1, 1]) edge(FRAME, H, BOARD, x * (L / 2 - FRAME / 2 + BOARD / 2), H / 2, z * (D / 2 + BOARD / 2 - 0.004));
  for (const x of [-1, 1]) for (const y of [FRAME / 2, H - FRAME / 2]) edge(BOARD, FRAME, D - 0.02, x * (L / 2 + BOARD / 2 - 0.004), y, 0);
  for (const x of [-1, 1])
    for (const z of [-1, 1]) edge(BOARD, H - 2 * FRAME, FRAME, x * (L / 2 + BOARD / 2 - 0.004), H / 2, z * (D / 2 - FRAME / 2));
  // a cross brace on each long side (the faces the camera sees), corner to corner inside the frame
  const span = Math.hypot(L - 2 * FRAME, H - 2 * FRAME);
  const angle = Math.atan2(H - 2 * FRAME, L - 2 * FRAME);
  for (const z of [-1, 1]) {
    for (const sign of [-1, 1]) {
      // just behind the frame (its ends tuck under it), one brace over the other
      const brace = edge(span, FRAME * 0.9, BOARD, 0, H / 2, z * (D / 2 + BOARD / 2 - 0.01 + (sign > 0 ? 0.004 : 0)));
      brace.rotation.z = sign * angle;
    }
  }
  // nail heads at the corners of the long sides
  const nailGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.004, 8);
  nailGeo.rotateX(Math.PI / 2);
  for (const z of [-1, 1])
    for (const x of [-1, 1])
      for (const y of [FRAME / 2, H - FRAME / 2]) {
        const n = new THREE.Mesh(nailGeo, nails);
        n.position.set(x * (L / 2 - FRAME / 2), y, z * (D / 2 + BOARD + 0.0005));
        body.add(n);
      }

  // a big invisible box round it: a tap anywhere on the crate pushes
  const hit = new THREE.Mesh(new THREE.BoxGeometry(L + 0.12, H + 0.12, D + 0.1), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = H / 2;
  hit.userData.noExport = true;
  root.add(hit);

  root.traverse((m) => {
    if (m instanceof THREE.Mesh && m !== hit) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });
  // the crate never comes apart: its planks, frame and nails are drawn as three meshes (one per material)
  mergeStatic(body);

  const bounds = new THREE.Box3();
  return {
    root,
    body,
    hit,
    /** The crate as a box in the world (the action's ring), without its hit box. */
    box: () => bounds.setFromObject(body),
  };
}
