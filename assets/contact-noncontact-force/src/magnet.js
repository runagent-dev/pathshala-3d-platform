// চুম্বকের আকর্ষণ: a bar magnet (6 cm, N red, S blue) is brought to 3 cm from an iron nail (5 cm) lying on a
// table. Nothing touches the nail, yet it starts to move and rushes, faster and faster, to the magnet's N pole.
// Real size, metres (shown 10 times slower than real). The arrow lies just behind the nail, pointing at the magnet;
// a dashed line in front of it shows the gap still open between the nail's tip and the magnet.
import * as THREE from 'three';
import { textMesh } from '@shared/student/materials.js';
import { createArrow } from './arrow.js';
import { MAGNET } from './motion.js';
import { V, box, castShadows, groundPatch, hitBox, mat } from './parts.js';

const NAIL = { len: 0.05, r: 0.0019, head: 0.0042 };
const BAR = { len: 0.06, h: 0.01, d: 0.017 };
const TIP0 = -0.012; // the nail's tip at the start (x)

export function createMagnetScene({ colors }) {
  const root = new THREE.Group();
  root.name = 'MagnetScene';
  const model = new THREE.Group();
  model.name = 'MagnetAndNail';
  root.add(model);

  // the nail: shank, point and head, lying along +x with its point toward the magnet
  const iron = mat('#8d939b', { roughness: 0.38, metalness: 0.85, name: 'Iron' });
  const nail = new THREE.Group();
  nail.name = 'IronNail';
  model.add(nail);
  const shankLen = NAIL.len - 0.007;
  const shank = new THREE.Mesh(new THREE.CylinderGeometry(NAIL.r, NAIL.r, shankLen, 12), iron);
  shank.rotation.z = Math.PI / 2;
  shank.position.x = -0.007 - shankLen / 2;
  const point = new THREE.Mesh(new THREE.ConeGeometry(NAIL.r, 0.007, 12), iron);
  point.rotation.z = -Math.PI / 2;
  point.position.x = -0.0035;
  const head = new THREE.Mesh(new THREE.CylinderGeometry(NAIL.head, NAIL.head, 0.0016, 18), iron);
  head.rotation.z = Math.PI / 2;
  head.position.x = -NAIL.len + 0.0008;
  nail.add(shank, point, head);
  nail.position.y = NAIL.head * 0.98; // resting on its head and shank

  // the magnet: two painted halves with their letters
  const magnet = new THREE.Group();
  magnet.name = 'BarMagnet';
  model.add(magnet);
  box(BAR.len / 2, BAR.h, BAR.d, mat('#d9302f', { roughness: 0.42, name: 'NorthRed' }), BAR.len / 4, BAR.h / 2, 0, magnet);
  box(BAR.len / 2, BAR.h, BAR.d, mat('#2b63b8', { roughness: 0.42, name: 'SouthBlue' }), (3 * BAR.len) / 4, BAR.h / 2, 0, magnet);
  for (const [txt, x] of [
    ['N', BAR.len * 0.17],
    ['S', BAR.len * 0.83],
  ]) {
    const letter = textMesh(txt, 0.0085, { color: '#ffffff', weight: 700 });
    letter.rotation.x = -Math.PI / 2;
    letter.position.set(x, BAR.h + 0.0002, 0);
    magnet.add(letter);
  }

  // the table top
  const table = groundPatch(0.4, 0.26, {
    color: '#d7b48a',
    px: 512,
    draw: (ctx, w, h) => {
      for (let i = 0; i < 70; i++) {
        ctx.strokeStyle = `rgba(120,78,40,${0.06 + Math.random() * 0.1})`;
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.beginPath();
        const y = Math.random() * h;
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.33, y + 6, w * 0.66, y - 6, w, y + 3);
        ctx.stroke();
      }
    },
    fade: 0.16,
  });
  table.position.set(0.02, 0, 0);
  root.add(table);
  castShadows(model);

  const hits = [hitBox(0.1, 0.04, 0.05, BAR.len / 2, 0.01, 0, magnet), hitBox(0.085, 0.03, 0.04, -NAIL.len / 2, 0.005, 0, nail)];
  const arrow = createArrow({ color: colors.force, radius: 0.0011, head: 0.0062, headRadius: 0.0028 });
  root.add(arrow.root);

  const v = new THREE.Vector3();
  let tip = TIP0;
  let face = TIP0 + MAGNET.far;
  let wobble = 0;

  function update(m, { arrowOn = false } = {}) {
    tip = TIP0 + m.pos;
    face = TIP0 + (m.magnet ?? MAGNET.far);
    nail.position.x = tip;
    magnet.position.set(face + wobble * 0.0015, 0, 0);
    arrow.setOpacity(arrowOn ? 1 : 0);
    // just behind the nail (farther from the viewer), along it, pointing at the magnet
    if (arrowOn) arrow.set(v.set(tip - 0.036, 0.003, -0.0085), V(1, 0, 0), 0.03);
  }

  return {
    id: 'magnet',
    root,
    model,
    hits,
    arrow,
    // the nail's whole way and the magnet where it stops; brought in, the magnet comes from the right edge
    fit: { min: V(-0.066, -0.003, -0.02), max: V(0.085, 0.012, 0.02) },
    views: { front: V(0.08, 0.62, 1).normalize(), '3d': V(0.7, 0.75, 0.75).normalize() },
    shadow: { center: V(0.02, 0, 0), r: 0.14 },
    update,
    /** The gap between the nail's tip and the magnet's N face (in front of the nail, on the table). */
    marker: (m) => (m.gap != null ? { kind: 'gap', a: V(tip, 0.001, 0.007), b: V(face, 0.001, 0.007) } : null),
    bodies: () => [
      { min: V(tip - NAIL.len, 0, -NAIL.head), max: V(tip, 2 * NAIL.head, NAIL.head) },
      { min: V(face, 0, -BAR.d / 2), max: V(face + BAR.len, BAR.h, BAR.d / 2) },
    ],
    actor: (out, k = 0) => (k < 2 ? out.set(face + BAR.len * [0.3, 0.6][k], BAR.h, BAR.d / 2) : out.set(tip - NAIL.len / 2, 0.004, 0)),
    wiggle(k) {
      wobble = Math.sin(k * Math.PI * 4) * (1 - k);
    },
  };
}
