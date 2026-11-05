// The polished spherical mirror of the chapter's optical bench, in centimetres: a thin dish of glass, cut from a hollow sphere
// and silvered on one face, swinging on two pins in a black ring on a post. Its pole P is at the origin of `dish`, its axis
// along +x, toward the light. The same dish is both mirrors: face A is the sphere's inner surface (concave toward +x) and face B
// its outer surface; a half turn on the pins brings B to the front, a convex mirror with its pole in the same place.
// While the piece is being shown, each surface wears its own colour and the rim is bright (setTint): teaching colours, gone by the
// time it is a mirror. Only the surface that faces the eye shows its colour, so the two sides can't be mistaken.
// The silver is a second drawing of a face: its triangles are stored from the middle out, so that drawing more of them lets
// the coat spread across the glass. The surface is the exact sphere of radius r, and it is rewritten in place when r changes.
import * as THREE from 'three';
import { MIRROR, sag } from './reading.js';

const RINGS = 14;
const SEGS = 56;
const PER_FACE = RINGS * SEGS + 1; // the middle point, then the rings

/** Indices of one face, starting at vertex `base`, the middle first. flip: wound the other way. */
function faceIndex(base, flip) {
  const out = [];
  const tri = (a, b, c) => (flip ? out.push(a, c, b) : out.push(a, b, c));
  const at = (ring, seg) => base + 1 + (ring - 1) * SEGS + ((seg + SEGS) % SEGS);
  for (let s = 0; s < SEGS; s++) tri(base, at(1, s), at(1, s + 1));
  for (let ring = 1; ring < RINGS; ring++)
    for (let s = 0; s < SEGS; s++) {
      tri(at(ring, s), at(ring + 1, s), at(ring + 1, s + 1));
      tri(at(ring, s), at(ring + 1, s + 1), at(ring, s + 1));
    }
  return out;
}

/** env: a bright studio reflection for the silver alone (a slate room would make a polished mirror look dark). */
export function createDish({ env }) {
  const root = new THREE.Group(); // the pivot: on the pins, half a glass thickness behind P
  root.name = 'spherical-mirror';
  const count = PER_FACE * 2 + SEGS * 2;
  const position = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
  const normal = new THREE.BufferAttribute(new Float32Array(count * 3), 3);
  position.setUsage(THREE.DynamicDrawUsage);
  normal.setUsage(THREE.DynamicDrawUsage);

  const of = (index) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', position);
    g.setAttribute('normal', normal);
    g.setIndex(index);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 14);
    return g;
  };
  const a = faceIndex(0, true);
  const b = faceIndex(PER_FACE, false);
  const rim = [];
  const r0 = PER_FACE * 2;
  for (let s = 0; s < SEGS; s++) {
    const n = (s + 1) % SEGS;
    rim.push(r0 + s, r0 + n, r0 + SEGS + s, r0 + n, r0 + SEGS + n, r0 + SEGS + s);
  }

  // clear glass: mostly see-through, a pale tint, its green only at the ground edge
  const glassMat = new THREE.MeshStandardMaterial({
    name: 'MirrorGlass',
    color: 0xdff3ee,
    roughness: 0.08,
    metalness: 0,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
    depthWrite: false,
    envMapIntensity: 1.8,
  });
  const edgeMat = new THREE.MeshStandardMaterial({ name: 'MirrorEdge', color: 0x58c4a0, roughness: 0.16, emissive: 0x10382c });
  // bright polished silver. It draws after the glass (transparent queue, opacity 1), so nothing tints the coated face
  const silverMat = new THREE.MeshStandardMaterial({
    name: 'Silver',
    color: 0xffffff,
    roughness: 0.06,
    metalness: 1,
    side: THREE.DoubleSide,
    envMap: env,
    envMapIntensity: 1.1,
    transparent: true,
  });
  // the teaching colours: the same surfaces wound to face out, so that each is seen from its own side only
  const tintMat = (name, color) =>
    new THREE.MeshStandardMaterial({
      name,
      color,
      roughness: 0.38,
      metalness: 0.05,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      envMapIntensity: 1.2,
    });
  const tintA = new THREE.Mesh(of(faceIndex(0, false)), tintMat('InnerTint', 0x4dabf7));
  const tintB = new THREE.Mesh(of(faceIndex(PER_FACE, true)), tintMat('OuterTint', 0xf7b733));
  tintA.renderOrder = tintB.renderOrder = 3;
  tintA.userData.noExport = tintB.userData.noExport = true;
  const rimLight = new THREE.Mesh(
    new THREE.TorusGeometry(MIRROR.half, 0.3, 8, 64),
    new THREE.MeshBasicMaterial({ name: 'PieceRim', color: 0xffe36e, toneMapped: false, transparent: true, opacity: 0 }),
  );
  rimLight.rotation.y = Math.PI / 2;
  rimLight.userData.noExport = true;
  const faces = new THREE.Mesh(of([...a, ...b]), glassMat);
  faces.renderOrder = 3;
  const edge = new THREE.Mesh(of(rim), edgeMat);
  const coatA = new THREE.Mesh(of(a), silverMat);
  const coatB = new THREE.Mesh(of(b), silverMat);
  for (const m of [edge, coatA, coatB]) m.castShadow = true;
  coatA.renderOrder = coatB.renderOrder = 4;
  // everything in one holder, whose origin is the pivot
  const body = new THREE.Group();
  body.position.x = MIRROR.thick / 2;
  body.add(faces, edge, coatA, coatB, tintA, tintB, rimLight);
  root.add(body);

  let radius = 0;
  function setRadius(r) {
    if (r === radius) return;
    radius = r;
    const p = position.array;
    const n = normal.array;
    const t = MIRROR.thick;
    const put = (i, x, y, z, nx, ny, nz) => {
      p[i * 3] = x;
      p[i * 3 + 1] = y;
      p[i * 3 + 2] = z;
      n[i * 3] = nx;
      n[i * 3 + 1] = ny;
      n[i * 3 + 2] = nz;
    };
    // face A (x = +sag, toward +x) and face B (t behind it, toward −x); the normal is along the radius
    for (let face = 0; face < 2; face++) {
      const base = face * PER_FACE;
      const sign = face === 0 ? 1 : -1;
      const off = face === 0 ? 0 : -t;
      put(base, off, 0, 0, sign, 0, 0);
      for (let ring = 1; ring <= RINGS; ring++) {
        const rho = (MIRROR.half * ring) / RINGS;
        const s = sag(r, rho);
        const c = (r - s) / r;
        const q = rho / r;
        for (let k = 0; k < SEGS; k++) {
          const th = (k / SEGS) * Math.PI * 2;
          const y = rho * Math.cos(th);
          const z = rho * Math.sin(th);
          put(base + 1 + (ring - 1) * SEGS + k, s + off, y, z, sign * c, -sign * q * Math.cos(th), -sign * q * Math.sin(th));
        }
      }
    }
    // the ground edge of the glass, straight across
    const s = sag(r, MIRROR.half);
    rimLight.position.x = s - t / 2;
    for (let k = 0; k < SEGS; k++) {
      const th = (k / SEGS) * Math.PI * 2;
      const y = MIRROR.half * Math.cos(th);
      const z = MIRROR.half * Math.sin(th);
      put(r0 + k, s, y, z, 0, Math.cos(th), Math.sin(th));
      put(r0 + SEGS + k, s - t, y, z, 0, Math.cos(th), Math.sin(th));
    }
    position.needsUpdate = true;
    normal.needsUpdate = true;
  }

  const FACE_INDICES = a.length;
  return {
    root,
    setRadius,
    get radius() {
      return radius;
    },
    /** How far the silver has spread on the face that is at the front: 0 … 1 (whole rings of triangles). flip: B is at the front. */
    setCoat(k, flip) {
      const on = flip ? coatB : coatA;
      const off = flip ? coatA : coatB;
      off.visible = false;
      on.visible = k > 0.001;
      const tris = FACE_INDICES / 3;
      on.geometry.setDrawRange(0, k >= 1 ? FACE_INDICES : Math.round(k ** 1.5 * tris) * 3);
    },
    /** The teaching colours of the two surfaces and the bright rim: 0 none … 1 full. */
    setTint(k) {
      const on = k > 0.005;
      tintA.visible = tintB.visible = rimLight.visible = on;
      tintA.material.opacity = tintB.material.opacity = 0.78 * k;
      rimLight.material.opacity = k;
    },
    /** The half turn on the pins (0 shows face A, concave; 1 shows face B, convex), and a further turn `spin` in radians. */
    setTurn(k, spin = 0) {
      root.rotation.y = Math.PI * k + spin;
    },
  };
}

const v2 = (x, y) => new THREE.Vector2(x, y);

/**
 * The holder: a black ring on a post, standing on the rail at x = 0. The dish hangs in it on two pins, top and bottom.
 * Its origin is on the principal axis.
 */
export function createHolder({ black, steel, brass }) {
  const root = new THREE.Group();
  root.name = 'ring-holder';
  const IN = MIRROR.half + 0.45;
  const OUT = MIRROR.half + 1.15;
  const W = 1.05;
  const ring = new THREE.LatheGeometry(
    [
      v2(IN, -W),
      v2(IN + 0.1, -W - 0.1),
      v2(OUT - 0.1, -W - 0.1),
      v2(OUT, -W),
      v2(OUT, W),
      v2(OUT - 0.1, W + 0.1),
      v2(IN + 0.1, W + 0.1),
      v2(IN, W),
      v2(IN, -W),
    ],
    72,
  );
  ring.rotateZ(Math.PI / 2); // the lathe turns round y: the ring's axis goes along x
  const mesh = new THREE.Mesh(ring, black);
  mesh.castShadow = true;
  root.add(mesh);
  // the two pins, and their little brass caps outside the ring
  for (const s of [1, -1]) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, OUT - MIRROR.half + 0.3, 10), steel);
    pin.position.y = s * ((OUT + MIRROR.half) / 2 + 0.1);
    root.add(pin);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.34, 18), brass);
    cap.position.y = s * (OUT + 0.17);
    root.add(cap);
  }
  return root;
}
