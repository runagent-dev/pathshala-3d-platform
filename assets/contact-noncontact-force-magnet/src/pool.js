// The test's new cases (not on the page), each a small scene that keeps moving: update(t) draws it at time t (s),
// looping. Real size, metres. Each has the same marks as the book's examples, shown with the answer: the contact
// patch (marks: true in update) or gap() for the measured gap.
//  - comb: a comb rubbed on dry hair, brought near bits of paper, lifts them without touching them.
import * as THREE from 'three';
import { createArrow } from './arrow.js';

import { mergeStatic } from './merge.js';
import { V, box, castShadows, groundPatch, mat, tube } from './parts.js';
import { tableSetting } from './setting.js';

const frac = (x) => x - Math.floor(x);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};

// ── a comb lifts bits of paper ───────────────────────────────────────────────────────────────────────────────
export function createCombScene({ color, setting = true }) {
  const root = new THREE.Group();
  root.name = 'CombScene';
  const model = new THREE.Group();
  model.name = 'CombAndPaper';
  root.add(model);
  const LOOP = 4.4;
  const COMB = { len: 0.13, h: 0.026, d: 0.005 };

  const plastic = mat('#2f4f8f', { roughness: 0.35, name: 'CombPlastic' });
  const comb = new THREE.Group();
  comb.name = 'Comb';
  model.add(comb);
  box(COMB.len, 0.008, COMB.d, plastic, 0, COMB.h / 2 - 0.004, 0, comb);
  const teeth = 26;
  const toothGeo = new THREE.BoxGeometry(0.0022, COMB.h - 0.008, COMB.d * 0.8);
  const toothMesh = new THREE.InstancedMesh(toothGeo, plastic, teeth);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < teeth; i++) {
    m4.makeTranslation(-COMB.len / 2 + 0.004 + (i * (COMB.len - 0.008)) / (teeth - 1), -0.004, 0);
    toothMesh.setMatrixAt(i, m4);
  }
  comb.add(toothMesh);
  // the hand holding the comb's end, coming in from the right
  const skin = mat('#b98057', { roughness: 0.7, name: 'Skin' });
  const sleeve = mat('#f4f6f8', { roughness: 0.85, name: 'Shirt' });
  // a hand holding the comb's end: a rounded fist round the spine, the thumb along its near side, the wrist going
  // up and back out of the picture
  const end = COMB.len / 2;
  const fist = new THREE.Mesh(new THREE.SphereGeometry(0.017, 20, 14), skin);
  fist.scale.set(1.15, 0.95, 1.05);
  fist.position.set(end + 0.006, COMB.h * 0.42, -0.003);
  comb.add(fist);
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.0055, 0.016, 4, 12), skin);
  thumb.rotation.z = Math.PI / 2;
  thumb.position.set(end - 0.011, COMB.h * 0.5, 0.0075);
  comb.add(thumb);
  tube(V(end + 0.012, COMB.h * 0.5 + 0.008, -0.006), V(end + 0.07, COMB.h * 0.5 + 0.075, -0.035), 0.012, skin, comb);
  tube(V(end + 0.066, COMB.h * 0.5 + 0.07, -0.033), V(end + 0.14, COMB.h * 0.5 + 0.15, -0.07), 0.019, sleeve, comb);

  // bits of paper on the table
  const paper = new THREE.MeshStandardMaterial({ color: '#fbfbf8', roughness: 0.9, side: THREE.DoubleSide, name: 'Paper' });
  const bits = [
    [-0.035, -0.006, 0.4],
    [-0.012, 0.012, -0.6],
    [0.008, -0.01, 1.1],
    [0.03, 0.008, 0.2],
    [-0.024, 0.02, 2.0],
    [0.02, -0.022, -1.2],
    [0.046, -0.004, 0.9],
  ].map(([x, z, r], i) => {
    const s = 0.012 + (i % 3) * 0.0025;
    const geo = new THREE.PlaneGeometry(s, s * 0.8);
    const mesh = new THREE.Mesh(geo, paper);
    mesh.userData = { x, z, r, order: [2, 0, 4, 1, 6, 3, 5][i] };
    model.add(mesh);
    return mesh;
  });

  // a teak table top with a book and a pencil (or, on a transparent page, a patch of table that fades out)
  const desk = setting ? tableSetting() : null;
  if (desk) root.add(desk.root);
  else {
    const table = groundPatch(0.3, 0.2, {
      color: '#d6b994', // a plain table top, dark enough for the white bits of paper to show
      draw: (ctx, w, h) => {
        for (let i = 0; i < 12; i++) {
          ctx.strokeStyle = `rgba(150,110,70,${0.04 + Math.random() * 0.04})`;
          ctx.lineWidth = 2 + Math.random() * 3;
          ctx.beginPath();
          const y = Math.random() * h;
          ctx.moveTo(0, y);
          ctx.bezierCurveTo(w * 0.33, y + 6, w * 0.66, y - 6, w, y + 3);
          ctx.stroke();
        }
      },
    });
    root.add(table);
  }
  castShadows(model);
  mergeStatic(comb); // the spine and the hand (the teeth are one instanced mesh)

  const arrow = createArrow({ color, radius: 0.0011, head: 0.0062, headRadius: 0.0028 });
  root.add(arrow.root);
  const v = new THREE.Vector3();
  const gapA = new THREE.Vector3();
  const gapB = new THREE.Vector3();
  let combY = 0.1;
  let watched = bits[0]; // the bit the arrow is on

  /** Height of a bit (its order in the jumping) at loop time u. */
  function bitY(order, u, teethY) {
    const jump = 0.95 + order * 0.24; // when it jumps up
    if (u < jump) return 0.0006;
    if (u < 3.4) return 0.0006 + (teethY - 0.0006) * smooth((u - jump) / 0.22);
    // the comb goes up again: the bits fall back
    return Math.max(0.0006, teethY - 4.9 * (u - 3.4) ** 2);
  }

  function update(t, { arrowOn = false } = {}) {
    const u = frac(t / LOOP) * LOOP;
    const lower = smooth(u / 0.8);
    const raise = smooth((u - 3.4) / 0.6);
    combY = 0.105 - 0.07 * lower + 0.07 * raise; // the comb's middle above the table: its teeth come to about 2 cm
    comb.position.set(0, combY, 0);
    const teethY = combY - COMB.h / 2 - 0.0012;
    let next = null;
    for (const b of bits) {
      const { x, z, r, order } = b.userData;
      const y = bitY(order, u, teethY);
      b.position.set(x * (y > 0.002 ? 0.7 : 1), y, z * (y > 0.002 ? 0.3 : 1));
      b.rotation.set(y > 0.002 ? -Math.PI / 2 + 0.6 : -Math.PI / 2, 0, r);
      if (y < 0.002 && (!next || order < next.userData.order)) next = b;
    }
    watched = next || bits.find((b) => b.userData.order === 6);
    arrow.setOpacity(arrowOn && next ? 1 : 0);
    if (arrowOn && next) arrow.set(v.set(next.position.x, next.position.y + 0.002, next.position.z), V(0, 1, 0), 0.012);
  }

  return {
    id: 'comb',
    root,
    background: desk?.background ?? null,
    model,
    hits: [],
    arrow,
    fit: { min: V(-0.072, -0.002, -0.026), max: V(0.1, 0.12, 0.026) },
    views: { front: V(0.3, 0.3, 1).normalize(), '3d': V(0.7, 0.5, 0.8).normalize() },
    shadow: { center: V(0, 0, 0), r: 0.2 },
    update,
    contact: () => null,
    /** The empty space between a bit still on the table and the comb's teeth, measured beside the bit. */
    gap: () => ({
      a: gapA.set(watched.position.x - 0.012, watched.position.y, watched.position.z + 0.006),
      b: gapB.set(watched.position.x - 0.012, combY - COMB.h / 2, watched.position.z + 0.006),
    }),
    bodies: () => [{ min: V(-COMB.len / 2, combY - COMB.h / 2, -0.01), max: V(COMB.len / 2 + 0.05, combY + COMB.h / 2, 0.01) }],
  };
}
