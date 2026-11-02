// চুম্বকের আকর্ষণ: a hand brings a bar magnet (6 cm, N red, S blue) to 3 cm from an iron nail (5 cm) lying on a
// table. The hand touches the magnet, nothing touches the nail, yet the nail starts to move and rushes, faster and
// faster, to the magnet's N pole. Real size, metres (shown 10 times slower than real). The arrow lies just behind
// the nail, pointing at the magnet, and grows as the gap closes (the pull is stronger nearer the magnet); gap() gives
// the gap still open, measured in front of the nail. The view is close on the nail, the gap and the N pole: the S
// end and the hand run off the right edge on a phone.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { textMesh } from '@shared/student/materials.js';
import { createArrow } from './arrow.js';
import { MAGNET } from './motion.js';
import { mergeStatic } from './merge.js';
import { V, box, castShadows, groundPatch, hitBox, mat, tube } from './parts.js';
import { tableSetting } from './setting.js';

const NAIL = { len: 0.05, r: 0.0019, head: 0.0042 };
const BAR = { len: 0.06, h: 0.01, d: 0.017 };
const TIP0 = -0.012; // the nail's tip at the start (x)

/**
 * The field lines of the bar magnet in the plane at half its height (the magnet's own frame: N face at x = 0, S face
 * at x = BAR.len), traced from two poles just inside its ends, outside the bar only: one merged mesh of thin tubes
 * and small cone heads (N to S), in a pale blue that reads on the teak and keeps clear of the two kinds' colours.
 */
function fieldLines() {
  const N = new THREE.Vector2(0.006, 0);
  const S = new THREE.Vector2(BAR.len - 0.006, 0);
  const inside = (p) => p.x > -0.0004 && p.x < BAR.len + 0.0004 && Math.abs(p.y) < BAR.d / 2 + 0.0004;
  const e = new THREE.Vector2();
  const a = new THREE.Vector2();
  const b = new THREE.Vector2();
  const geos = [];
  const Y = BAR.h / 2;
  const R = 0.00032;
  for (const side of [1, -1])
    for (const deg of [24, 46, 75, 115]) {
      const phi = THREE.MathUtils.degToRad(deg);
      const p = new THREE.Vector2(N.x - Math.cos(phi) * 0.004, side * Math.sin(phi) * 0.004);
      const pts = [];
      for (let k = 0; k < 900; k++) {
        a.subVectors(p, N);
        b.subVectors(p, S);
        const la = a.length();
        const lb = b.length();
        if (lb < 0.0045 || p.length() > 0.16) break;
        e.copy(a)
          .divideScalar(la ** 3)
          .addScaledVector(b, -1 / lb ** 3)
          .normalize();
        if (!inside(p)) pts.push(new THREE.Vector3(p.x, Y, p.y));
        p.addScaledVector(e, 0.0006);
      }
      if (pts.length < 4) continue;
      const curve = new THREE.CatmullRomCurve3(pts);
      geos.push(new THREE.TubeGeometry(curve, Math.min(120, pts.length), R, 5, false));
      // a head where the line is farthest from the bar, pointing along it (N to S outside the magnet)
      const u = 0.5;
      const at = curve.getPointAt(u);
      const dir = curve.getTangentAt(u);
      const head = new THREE.ConeGeometry(R * 3.4, R * 9, 8);
      head.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir));
      head.translate(at.x, at.y, at.z);
      geos.push(head);
    }
  const merged = mergeGeometries(
    geos.map((g) => (g.index ? g.toNonIndexed() : g)),
    false,
  );
  for (const g of geos) g.dispose();
  const mesh = new THREE.Mesh(
    merged,
    new THREE.MeshBasicMaterial({ name: 'FieldLines', color: '#e4f1ff', transparent: true, opacity: 0.62, depthWrite: false, toneMapped: false }),
  );
  mesh.name = 'FieldLines';
  mesh.renderOrder = 4;
  mesh.userData.noExport = true;
  return mesh;
}

export function createMagnetScene({ color, setting = true }) {
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
    ['S', BAR.len * 0.68],
  ]) {
    const letter = textMesh(txt, 0.0085, { color: '#ffffff', weight: 700 });
    letter.rotation.x = -Math.PI / 2;
    letter.position.set(x, BAR.h + 0.0002, 0);
    magnet.add(letter);
  }

  // the hand that brings it: the forefinger on top of the S end, the thumb on its near side, the rest of the hand
  // just behind the end, the wrist going up and away (out of the picture on a phone)
  const skin = mat('#b98057', { roughness: 0.65, name: 'Skin' });
  const sleeve = mat('#f4f6f8', { roughness: 0.85, name: 'Shirt' });
  const hand = new THREE.Group();
  hand.name = 'Hand';
  magnet.add(hand);
  const finger = (r, len, a, b) => {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 12), skin);
    placeAlong(m, a, b);
    hand.add(m);
  };
  const UPV = new THREE.Vector3(0, 1, 0);
  const dirV = new THREE.Vector3();
  function placeAlong(m, a, b) {
    dirV.subVectors(b, a);
    m.position.addVectors(a, b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UPV, dirV.normalize());
  }
  const E = BAR.len; // the S end
  finger(0.0043, 0.012, V(E - 0.011, BAR.h + 0.0043, -0.001), V(E + 0.005, BAR.h + 0.007, -0.002)); // forefinger on the end, the S left clear
  finger(0.0047, 0.01, V(E - 0.009, BAR.h * 0.5, BAR.d / 2 + 0.0047), V(E + 0.004, BAR.h * 0.8, BAR.d / 2 + 0.004)); // thumb
  finger(0.0044, 0.012, V(E + 0.004, BAR.h + 0.002, -0.008), V(E + 0.012, BAR.h + 0.008, -0.014)); // curled fingers
  finger(0.0042, 0.011, V(E + 0.006, BAR.h + 0.001, -0.016), V(E + 0.013, BAR.h + 0.007, -0.021));
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.016, 20, 14), skin);
  palm.scale.set(1.05, 0.75, 1.15);
  palm.position.set(E + 0.015, BAR.h + 0.013, -0.006);
  hand.add(palm);
  tube(V(E + 0.026, BAR.h + 0.022, -0.008), V(E + 0.08, BAR.h + 0.07, -0.04), 0.012, skin, hand);
  tube(V(E + 0.076, BAR.h + 0.067, -0.038), V(E + 0.15, BAR.h + 0.13, -0.08), 0.019, sleeve, hand);

  // a teak table top with a book and a pencil (or, on a transparent page, a patch of table that fades out)
  const desk = setting ? tableSetting() : null;
  if (desk) root.add(desk.root);
  else {
    // the table top: plain and light, like the page
    const table = groundPatch(0.4, 0.26, {
      color: '#efe5d3',
      px: 512,
      draw: (ctx, w, h) => {
        for (let i = 0; i < 14; i++) {
          ctx.strokeStyle = `rgba(150,110,70,${0.04 + Math.random() * 0.04})`;
          ctx.lineWidth = 2 + Math.random() * 3;
          ctx.beginPath();
          const y = Math.random() * h;
          ctx.moveTo(0, y);
          ctx.bezierCurveTo(w * 0.33, y + 5, w * 0.66, y - 5, w, y + 2);
          ctx.stroke();
        }
      },
      fade: 0.16,
    });
    table.position.set(0.02, 0, 0);
    root.add(table);
  }
  castShadows(model);
  mergeStatic(nail); // shank, point and head: one mesh
  mergeStatic(magnet); // the two halves, the letters and the hand: one mesh per material

  // the magnet's field (the review asked for a sign of the magnetism): its lines round the bar at half its height,
  // from the N end round to the S end, with small heads pointing the way; they go with the magnet. Not exported.
  const field = fieldLines();
  magnet.add(field);

  const hits = [hitBox(0.1, 0.04, 0.05, BAR.len / 2, 0.01, 0, magnet), hitBox(0.085, 0.03, 0.04, -NAIL.len / 2, 0.005, 0, nail)];
  const arrow = createArrow({ color, radius: 0.0011, head: 0.0062, headRadius: 0.0028 });
  root.add(arrow.root);

  const v = new THREE.Vector3();
  const body = new THREE.Box3();
  const gapA = new THREE.Vector3();
  const gapB = new THREE.Vector3();
  let tip = TIP0;
  let face = TIP0 + MAGNET.far;

  function update(m, { arrowOn = false } = {}) {
    tip = TIP0 + m.pos;
    face = TIP0 + (m.magnet ?? MAGNET.far);
    nail.position.x = tip;
    magnet.position.set(face, 0, 0);
    arrow.setOpacity(arrowOn ? 1 : 0);
    // just behind the nail (farther from the viewer), along it, pointing at the magnet; longer as the gap closes
    const len = 0.017 + 0.015 * (m.strength ?? 1);
    if (arrowOn) arrow.set(v.set(tip - 0.006 - len, 0.003, -0.0085), V(1, 0, 0), len);
  }

  return {
    id: 'magnet',
    root,
    background: desk?.background ?? null,
    model,
    hits,
    arrow,
    // close on the nail's whole way, the gap and the N pole; brought in, the magnet comes from the right edge
    fit: { min: V(-0.066, -0.003, -0.02), max: V(0.055, 0.012, 0.02) },
    // a wide view has room for the whole magnet and the hand that holds it
    fitWide: { min: V(-0.07, -0.003, -0.02), max: V(0.13, 0.03, 0.02) },
    views: { front: V(0.08, 0.62, 1).normalize(), '3d': V(0.7, 0.75, 0.75).normalize() },
    shadow: { center: V(0.02, 0, 0), r: 0.14 },
    update,
    /** The body the force acts on (the action's ring goes round it): the nail. */
    subject: () => body.set(V(tip - NAIL.len, 0, -NAIL.head), V(tip, 2 * NAIL.head, NAIL.head)),
    contact: () => null,
    /** The gap between the nail's tip and the magnet's N face, measured in front of the nail on the table. */
    gap: (m) => (m.gap != null ? { a: gapA.set(tip, 0.001, 0.007), b: gapB.set(face, 0.001, 0.007) } : null),
    bodies: () => [
      { min: V(tip - NAIL.len, 0, -NAIL.head), max: V(tip, 2 * NAIL.head, NAIL.head) },
      { min: V(face, 0, -BAR.d / 2), max: V(face + BAR.len, BAR.h, BAR.d / 2) },
      { min: V(face + BAR.len - 0.02, 0, -0.04), max: V(face + BAR.len + 0.2, 0.15, 0.01) }, // the hand
    ],
  };
}
