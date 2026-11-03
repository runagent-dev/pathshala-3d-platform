// The hand that holds the paper, in millimetres: the thumb pressed on the near half's outer face and the index finger
// on the far half's, near the open edges, the rest of the hand below the paper (mostly out of the picture). Real
// proportions (an adult's thumb about 20 mm wide, index finger 17 mm), medium-brown skin with a soft sheen, nails, the
// knuckles' creases. Procedural: each finger is a tube of oval section along a smooth curve, its radius varying along
// it, closed at the tip by a rounded cap.
import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

/**
 * A finger-like tube: `points` from the base to the tip, `radii` (lateral, interpolated along it), `flat` the
 * back-to-front radius as a share of the lateral one, `back(i)` the direction of the finger's back (nail side).
 */
const DORSAL = new THREE.Color('#8f5a3a');
const PALMAR = new THREE.Color('#c49478');
const BLUSH = new THREE.Color('#c48572');

function fleshTube(points, radii, { back, flat = 0.82, along = 40, radial = 20, capRings = 8, baseCap = false } = {}) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const pos = [];
  const col = [];
  const cc = new THREE.Color();
  let blush = 0;
  const rings = [];
  const T = new THREE.Vector3();
  const N = new THREE.Vector3();
  const B = new THREE.Vector3();
  const C = new THREE.Vector3();
  const radiusAt = (u) => {
    const x = u * (radii.length - 1);
    const i = Math.min(radii.length - 2, Math.floor(x));
    const f = x - i;
    return radii[i] + (radii[i + 1] - radii[i]) * (f * f * (3 - 2 * f));
  };
  const frameAt = (u) => {
    curve.getPointAt(u, C);
    curve.getTangentAt(u, T);
    N.copy(back(u)).addScaledVector(T, -back(u).dot(T)).normalize();
    B.crossVectors(T, N).normalize();
  };
  const ring = (centre, r, rb) => {
    const start = pos.length / 3;
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      // a finger's section: flatter on the pad side (s < 0) than on the back
      const rn = rb * (s >= 0 ? 1 : 0.92);
      pos.push(centre.x + B.x * r * c + N.x * rn * s, centre.y + B.y * r * c + N.y * rn * s, centre.z + B.z * r * c + N.z * rn * s);
      // brown on the back, lighter on the pad (as on real brown hands), a little pinker at the tip
      cc.copy(DORSAL).lerp(PALMAR, Math.max(0, Math.min(1, 0.5 - s * 0.75)));
      cc.lerp(BLUSH, blush * 0.35);
      col.push(cc.r, cc.g, cc.b);
    }
    rings.push(start);
  };
  for (let i = 0; i <= along; i++) {
    const u = i / along;
    blush = Math.max(0, (u - 0.75) / 0.25);
    frameAt(u);
    const r = radiusAt(u);
    ring(C, r, r * flat);
  }
  // the rounded tip
  frameAt(1);
  const rEnd = radiusAt(1);
  const end = C.clone();
  blush = 1;
  for (let i = 1; i <= capRings; i++) {
    const q = i / (capRings + 1);
    const k = Math.sqrt(1 - q * q);
    ring(end.clone().addScaledVector(T, rEnd * 0.95 * q), rEnd * k, rEnd * flat * k);
  }
  const apex = pos.length / 3;
  const tip = end.clone().addScaledVector(T, rEnd * 0.95);
  pos.push(tip.x, tip.y, tip.z);
  col.push(BLUSH.r, BLUSH.g, BLUSH.b);
  const idx = [];
  for (let i = 0; i < rings.length - 1; i++) {
    const a0 = rings[i];
    const b0 = rings[i + 1];
    for (let j = 0; j < radial; j++) {
      const j1 = (j + 1) % radial;
      idx.push(a0 + j, b0 + j, a0 + j1, a0 + j1, b0 + j, b0 + j1);
    }
  }
  const last = rings[rings.length - 1];
  for (let j = 0; j < radial; j++) idx.push(last + j, apex, last + ((j + 1) % radial));
  if (baseCap) {
    frameAt(0);
    const c0 = pos.length / 3;
    pos.push(C.x, C.y, C.z);
    col.push(DORSAL.r, DORSAL.g, DORSAL.b);
    for (let j = 0; j < radial; j++) idx.push(c0, j, (j + 1) % radial);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return { geo, curve, tip, radiusAt, rings, radial, along };
}

/**
 * A nail: a patch of the finger's own surface over the back of its last 1.3 radii and the top of the tip, lifted
 * 0.3 mm along the surface's normal, so it hugs the finger; pink on the bed, pale at the free edge.
 */
function nail(tube, material) {
  const pos = tube.geo.attributes.position;
  const nrm = tube.geo.attributes.normal;
  const len = tube.curve.getLength();
  const r = tube.radiusAt(1);
  const i0 = Math.max(0, Math.round(tube.along * (1 - (1.05 * r) / len)));
  const i1 = tube.along + 4; // into the rounded tip
  const q = tube.radial / 4; // the top of the back
  const half = Math.round(tube.radial * 0.11);
  const verts = [];
  const cols = [];
  const bed = new THREE.Color('#c48d7c');
  const edge = new THREE.Color('#e6d3c4');
  const rows = i1 - i0 + 1;
  const cols_n = 2 * half + 1;
  for (let i = i0; i <= i1; i++)
    for (let k = -half; k <= half; k++) {
      // a rounded cuticle: the sides start a little later than the middle
      const ii = Math.min(i1, i + Math.round(1.6 * (Math.abs(k) / half) ** 2 * (i === i0 ? 1 : 0)));
      const v = tube.rings[ii] + ((q + k + tube.radial) % tube.radial);
      const lift = 0.32 * (1 - 0.4 * (Math.abs(k) / half) ** 2);
      verts.push(pos.getX(v) + nrm.getX(v) * lift, pos.getY(v) + nrm.getY(v) * lift, pos.getZ(v) + nrm.getZ(v) * lift);
      const c = bed.clone().lerp(edge, i >= i1 - 1 ? 1 : 0);
      cols.push(c.r, c.g, c.b);
    }
  const idx = [];
  for (let a = 0; a < rows - 1; a++)
    for (let k = 0; k < cols_n - 1; k++) {
      const p = a * cols_n + k;
      idx.push(p, p + 1, p + cols_n, p + 1, p + cols_n + 1, p + cols_n);
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material);
  m.name = 'Nail';
  return m;
}

/** Thin dark creases across the back of a finger at its knuckles (u along the finger). */
function creases(tube, back, us, material) {
  const g = new THREE.Group();
  for (const u of us) {
    const r = tube.radiusAt(u);
    const T = tube.curve.getTangentAt(u, new THREE.Vector3());
    const N = back(u).clone().addScaledVector(T, -back(u).dot(T)).normalize();
    const B = new THREE.Vector3().crossVectors(T, N).normalize();
    const p = tube.curve.getPointAt(u, new THREE.Vector3());
    for (const k of [-0.06, 0.06]) {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(r * 0.83 * 1.005, 0.12, 4, 14, Math.PI * 0.75), material);
      arc.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(B, N, T));
      arc.rotateZ(Math.PI * 0.125);
      arc.scale.set(1.2, 1, 1);
      arc.position.copy(p).addScaledVector(T, k * r);
      g.add(arc);
    }
  }
  return g;
}

/**
 * The hand. `thumb` and `index`: { point, normal, along } where the pad presses (the paper's outer face and its
 * outward normal) and the direction toward the paper's open edge.
 */
export function createHand({ thumb, index }) {
  const root = new THREE.Group();
  root.name = 'Hand';
  const skin = new THREE.MeshPhysicalMaterial({
    name: 'Skin',
    color: '#ffffff',
    vertexColors: true,
    roughness: 0.58,
    sheen: 0.35,
    sheenColor: new THREE.Color('#e8a888'),
    sheenRoughness: 0.5,
    clearcoat: 0.06,
    clearcoatRoughness: 0.6,
  });
  const nailMat = new THREE.MeshPhysicalMaterial({
    name: 'Nail',
    color: '#ffffff',
    vertexColors: true,
    roughness: 0.3,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
    side: THREE.DoubleSide,
  });
  const creaseMat = new THREE.MeshStandardMaterial({ name: 'Crease', color: '#7a4a2e', roughness: 0.8 });

  /** A finger whose pad presses at `at`: tip direction `dir`, coming from `from` (base, inside the palm). */
  function finger(name, at, { dir, r, len, curl = 0.12, flat = 0.8, knuckles = [0.42, 0.7] }) {
    const n = at.normal;
    const tipDir = dir.clone().normalize();
    const rb = r * flat;
    // the pad touches the paper: the tube's axis sits one back-radius off the face
    const tipC = at.point
      .clone()
      .addScaledVector(n, rb * 0.92)
      .addScaledVector(tipDir, -r * 0.55);
    // bending away from the paper toward the base: the knuckles stand off the face
    const pts = [];
    const steps = 5;
    for (let i = steps; i >= 0; i--) {
      const q = i / steps; // 1 at the base … 0 at the tip
      const p = tipC
        .clone()
        .addScaledVector(tipDir, -len * q)
        .addScaledVector(n, len * curl * Math.sin(q * Math.PI * 0.9) + len * 0.05 * q);
      pts.push(p);
    }
    const back = () => n;
    const radii = [r * 1.1, r * 1.06, r * 1.03, r * 0.96, r * 0.99, r * 1.0];
    const tube = fleshTube(pts, radii, { back, flat });
    const m = new THREE.Mesh(tube.geo, skin);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    const g = new THREE.Group();
    g.name = name;
    g.add(m, nail(tube, nailMat), creases(tube, back, knuckles, creaseMat));
    return { group: g, base: pts[0], tube };
  }

  const th = finger('Thumb', thumb, { dir: thumb.dir, r: 10, len: 70, curl: 0.06, flat: 0.78, knuckles: [0.62] });
  const ix = finger('Index', index, { dir: index.dir, r: 8.6, len: 85, curl: 0.08, flat: 0.84, knuckles: [0.5, 0.76] });
  root.add(th.group, ix.group);

  // the palm and the curled fingers below the paper (mostly out of the picture)
  const palmC = th.base
    .clone()
    .lerp(ix.base, 0.5)
    .add(new THREE.Vector3(-8, -26, 0));
  const palm = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), skin);
  palm.name = 'Palm';
  palm.scale.set(24, 40, 17);
  palm.position.copy(palmC);
  palm.castShadow = true;
  const toThumb = new THREE.Mesh(
    fleshTube([palmC.clone().add(new THREE.Vector3(0, 10, 4)), th.base.clone().lerp(palmC, 0.15), th.base], [13, 12, 11], {
      back: () => thumb.normal,
      flat: 0.85,
      capRings: 3,
    }).geo,
    skin,
  );
  const toIndex = new THREE.Mesh(
    fleshTube([palmC.clone().add(new THREE.Vector3(0, 14, -4)), ix.base.clone().lerp(palmC, 0.15), ix.base], [12, 10.5, 9.7], {
      back: () => index.normal,
      flat: 0.85,
      capRings: 3,
    }).geo,
    skin,
  );
  root.add(palm, toThumb, toIndex);
  // three fingers curled into the palm, and the wrist going down out of the picture
  for (let i = 0; i < 3; i++) {
    const z = -index.normal.z * 0 + (i - 1) * 2;
    const p0 = palmC.clone().add(new THREE.Vector3(6, 22 - i * 15, z));
    const pts = [
      p0,
      p0.clone().add(new THREE.Vector3(18, 2, 0)),
      p0.clone().add(new THREE.Vector3(26, -10, 0)),
      p0.clone().add(new THREE.Vector3(16, -18, 0)),
    ];
    const f = new THREE.Mesh(fleshTube(pts, [8.5, 8, 7.6, 7.2], { back: () => UP, flat: 0.85, along: 16, radial: 14 }).geo, skin);
    f.name = 'CurledFinger';
    root.add(f);
  }
  const wrist = new THREE.Mesh(
    fleshTube(
      [
        palmC.clone().add(new THREE.Vector3(0, -20, 0)),
        palmC.clone().add(new THREE.Vector3(-8, -70, 0)),
        palmC.clone().add(new THREE.Vector3(-20, -170, 0)),
      ],
      [20, 22, 25],
      {
        back: () => new THREE.Vector3(-1, 0, 0),
        flat: 0.75,
        along: 10,
        radial: 18,
        capRings: 2,
      },
    ).geo,
    skin,
  );
  wrist.name = 'Wrist';
  root.add(wrist);
  for (const m of [toThumb, toIndex, wrist]) m.castShadow = true;
  return { root, thumbTip: th.tube.tip, indexTip: ix.tube.tip };
}
