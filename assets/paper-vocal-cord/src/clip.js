// A 15 mm binder clip gripping the foot of the folded paper, in millimetres, mouth up, its spine on the bench: black
// spring steel bent into a triangle with rolled lips, and two chrome wire handles folded down to the bench, one at the
// front and one at the back, like a little stand. The clip's width runs across the crease: the front jaw presses on the
// crease, the back jaw across the two halves near the clip's ends, so the bottom of the V is inside the jaws. Real
// proportions; procedural.
import * as THREE from 'three';

/** width: along z; bite: how far the paper goes into the mouth; height: mouth to spine; belly: half the spine's width. */
export const CLIP = { width: 15, bite: 2.6, height: 8.4, belly: 5.6, steel: 0.42, roll: 0.62, wire: 0.36, reach: 9.6 };

/** top: the jaws' tips (y); front, back: where the jaws' inner faces are (x, front > back). */
export function createClip({ top, front, back }) {
  const { width, height, belly, steel, roll, wire, reach } = CLIP;
  const root = new THREE.Group();
  root.name = 'BinderClip';
  const black = new THREE.MeshPhysicalMaterial({
    name: 'ClipSteel',
    color: '#2a2f37',
    roughness: 0.34,
    metalness: 0.4,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
  });
  const chrome = new THREE.MeshStandardMaterial({ name: 'ClipWire', color: '#d9dde2', roughness: 0.18, metalness: 1 });
  const bottom = top - height;
  const mid = (front + back) / 2;
  const R = 0.9; // the bend at the spine's corners

  // the steel's profile in (x, y), one strip of steel from the front lip round the spine to the back lip
  const s = new THREE.Shape();
  const out = { f: mid + belly, b: mid - belly };
  s.moveTo(front, top);
  s.lineTo(out.f - steel, bottom + steel + R);
  s.quadraticCurveTo(out.f - steel, bottom + steel, out.f - steel - R, bottom + steel);
  s.lineTo(out.b + steel + R, bottom + steel);
  s.quadraticCurveTo(out.b + steel, bottom + steel, out.b + steel, bottom + steel + R);
  s.lineTo(back, top);
  s.lineTo(back - steel, top);
  s.lineTo(out.b, bottom + R);
  s.quadraticCurveTo(out.b, bottom, out.b + R, bottom);
  s.lineTo(out.f - R, bottom);
  s.quadraticCurveTo(out.f, bottom, out.f, bottom + R);
  s.lineTo(front + steel, top);
  s.closePath();
  const bevel = 0.14;
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: width - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: 0.08,
    bevelSegments: 2,
    curveSegments: 4,
  });
  geo.translate(0, 0, -width / 2 + bevel);
  const body = new THREE.Mesh(geo, black);
  body.name = 'Jaws';
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  // the rolled lips, where the handles pivot
  const lip = new THREE.CylinderGeometry(roll, roll, width, 20);
  lip.rotateX(Math.PI / 2);
  const lips = [front + steel + roll * 0.55, back - steel - roll * 0.55];
  for (const x of lips) {
    const r = new THREE.Mesh(lip, black);
    r.position.set(x, top, 0);
    r.castShadow = true;
    root.add(r);
  }

  // the handles: a wire loop from each lip, folded down and outward to the bench (their round ends are the clip's feet)
  const P = (x, y, z) => new THREE.Vector3(x, y, z);
  const feet = [];
  const foot = bottom + wire;
  const run = Math.sqrt(Math.max(1, reach * reach - (top - foot) ** 2));
  lips.forEach((x0, i) => {
    const side = i === 0 ? 1 : -1;
    const at = (k, z) => P(x0 + side * run * k, top + (foot - top) * k, z);
    const z0 = width / 2 - 1;
    const z1 = width / 2 - 3.4;
    const path = new THREE.CurvePath();
    path.add(new THREE.LineCurve3(at(0, z0), at(0.84, z1 + 0.5)));
    path.add(new THREE.QuadraticBezierCurve3(at(0.84, z1 + 0.5), at(1, z1), at(1, 0)));
    path.add(new THREE.QuadraticBezierCurve3(at(1, 0), at(1, -z1), at(0.84, -z1 - 0.5)));
    path.add(new THREE.LineCurve3(at(0.84, -z1 - 0.5), at(0, -z0)));
    const h = new THREE.Mesh(new THREE.TubeGeometry(path, 56, wire, 8, false), chrome);
    h.name = 'Handle';
    h.castShadow = true;
    root.add(h);
    feet.push(at(1, 0).setY(bottom));
  });
  return { root, bottom, feet };
}
