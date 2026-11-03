// A small binder clip (19 mm) holding the folded paper at the bottom of its crease, in millimetres: black spring steel
// bent into a triangle (the spine in front of the crease, the two jaws pinching the paper just behind it, their edges
// rolled), and two chrome wire handles folded back along the jaws. Real proportions; procedural.
import * as THREE from 'three';

export const CLIP = { width: 19, spine: 8.5, half: 5.4, steel: 0.45, mouth: -2.4, lip: 1.3, wire: 0.55 };

export function createClip({ bottom }) {
  const { width, spine, half, steel, mouth, lip, wire } = CLIP;
  const root = new THREE.Group();
  root.name = 'BinderClip';
  const black = new THREE.MeshPhysicalMaterial({
    name: 'ClipSteel',
    color: '#2a2f37',
    roughness: 0.32,
    metalness: 0.35,
    clearcoat: 1,
    clearcoatRoughness: 0.15,
  });
  const chrome = new THREE.MeshStandardMaterial({ name: 'ClipWire', color: '#d9dde2', roughness: 0.18, metalness: 1 });

  // the steel's profile in (x, z), extruded along y: the spine at x = spine, the jaws meeting the paper at x = mouth
  const s = new THREE.Shape();
  s.moveTo(mouth, lip);
  s.lineTo(spine, half);
  s.lineTo(spine, -half);
  s.lineTo(mouth, -lip);
  s.lineTo(mouth + 0.35, -lip + steel);
  s.lineTo(spine - steel, -half + steel * 1.6);
  s.lineTo(spine - steel, half - steel * 1.6);
  s.lineTo(mouth + 0.35, lip - steel);
  s.closePath();
  const body = new THREE.Mesh(
    new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.25, bevelSegments: 3, curveSegments: 1 }),
    black,
  );
  // the profile is in the shape's x–y plane: turn it so its y is the world's z and the extrusion runs up (world y)
  body.geometry.rotateX(-Math.PI / 2);
  body.geometry.translate(0, 0, 0);
  body.position.y = bottom;
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);

  // the rolled edges of the jaws, where the handles pivot
  const roll = new THREE.CylinderGeometry(0.75, 0.75, width + 0.2, 20);
  for (const z of [lip + 0.35, -lip - 0.35]) {
    const r = new THREE.Mesh(roll, black);
    r.position.set(mouth + 0.2, bottom + width / 2, z);
    r.castShadow = true;
    root.add(r);
  }

  // the handles: a wire loop from each roll, folded back along its jaw and past the spine
  for (const side of [1, -1]) {
    const y0 = bottom + 1.2;
    const y1 = bottom + width - 1.2;
    const z0 = side * (lip + 0.35 + 1.1);
    const back = spine + 7;
    const zb = side * (half + 1.6);
    const path = new THREE.CurvePath();
    const P = (x, y, z) => new THREE.Vector3(x, y, z);
    path.add(new THREE.LineCurve3(P(mouth + 0.2, y0, z0), P(back - 2, y0 + 1.2, zb)));
    path.add(new THREE.QuadraticBezierCurve3(P(back - 2, y0 + 1.2, zb), P(back + 1, y0 + 2.5, zb), P(back + 1, (y0 + y1) / 2, zb)));
    path.add(new THREE.QuadraticBezierCurve3(P(back + 1, (y0 + y1) / 2, zb), P(back + 1, y1 - 2.5, zb), P(back - 2, y1 - 1.2, zb)));
    path.add(new THREE.LineCurve3(P(back - 2, y1 - 1.2, zb), P(mouth + 0.2, y1, z0)));
    const h = new THREE.Mesh(new THREE.TubeGeometry(path, 80, wire, 10, false), chrome);
    h.name = 'Handle';
    h.castShadow = true;
    root.add(h);
  }
  return { root };
}
