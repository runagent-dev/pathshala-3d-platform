// The bow, the arrows, the straw bale and the range (procedural three.js, metres). The bow lies in the x–y plane
// of its group: the grip at the origin, +x towards the target. Its limbs bend back as the string is drawn; the
// string runs from the top tip to the nock and down to the bottom tip.
import * as THREE from 'three';

export const BRACE = 0.21; // m: string to grip at rest
export const ARROW_LEN = 0.76;
export const ARROW_RISE = 0.035; // the arrow rests this far above the grip's centre
export const BALE = { x: 3.3, depth: 0.45, h: 0.78, w: 0.9, y: 0.95 }; // front face x; bottom y

const mat = (name, color, roughness = 0.6, metalness = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ name, color, roughness, metalness, ...extra });

// ── the bow ──────────────────────────────────────────────────────────────────
// limb shapes (x, y) at rest and at full bend; in between they are mixed
const LIMB_REST = [
  [0, 0.3],
  [-0.07, 0.5],
  [-0.17, 0.68],
  [-0.245, 0.77],
  [-0.21, 0.83],
];
const LIMB_BENT = [
  [0, 0.3],
  [-0.1, 0.49],
  [-0.25, 0.65],
  [-0.33, 0.72],
  [-0.315, 0.77],
];
const SAMPLES = 28;

/** A flat limb (rectangular section) along a curve; rebuilt in place as it bends. */
function limbGeometry() {
  const g = new THREE.BufferGeometry();
  const ring = 8; // 4 sides × 2 vertices, so each side shades flat
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SAMPLES * ring * 3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(SAMPLES * ring * 3), 3));
  const index = [];
  for (let i = 0; i < SAMPLES - 1; i++)
    for (let side = 0; side < 4; side++) {
      const a = i * ring + side * 2;
      const b = a + 1;
      const c = a + ring;
      const d = b + ring;
      index.push(a, c, b, b, c, d);
    }
  g.setIndex(index);
  return g;
}
const curve = new THREE.CatmullRomCurve3(
  [0, 1, 2, 3, 4].map(() => new THREE.Vector3()),
  false,
  'centripetal',
);
const P = new THREE.Vector3();
const T = new THREE.Vector3();
function bendLimb(geometry, k, sign) {
  for (let i = 0; i < 5; i++) {
    const [x0, y0] = LIMB_REST[i];
    const [x1, y1] = LIMB_BENT[i];
    curve.points[i].set(x0 + (x1 - x0) * k, sign * (y0 + (y1 - y0) * k), 0);
  }
  const pos = geometry.attributes.position.array;
  const nor = geometry.attributes.normal.array;
  for (let i = 0; i < SAMPLES; i++) {
    const u = i / (SAMPLES - 1);
    curve.getPointAt(u, P);
    curve.getTangentAt(u, T);
    const nx = -T.y;
    const ny = T.x; // in-plane normal
    const w = 0.024 - 0.013 * u; // half width (z)
    const th = 0.0075 - 0.0035 * u; // half thickness
    const corners = [
      [nx * th, ny * th, w],
      [nx * th, ny * th, -w],
      [-nx * th, -ny * th, -w],
      [-nx * th, -ny * th, w],
    ];
    const normals = [
      [nx, ny, 0],
      [0, 0, -1],
      [-nx, -ny, 0],
      [0, 0, 1],
    ];
    for (let side = 0; side < 4; side++) {
      const c0 = corners[side];
      const c1 = corners[(side + 1) % 4];
      const o = (i * 8 + side * 2) * 3;
      pos.set([P.x + c0[0], P.y + c0[1], c0[2], P.x + c1[0], P.y + c1[1], c1[2]], o);
      const n = normals[side];
      nor.set([...n, ...n], o);
    }
  }
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.normal.needsUpdate = true;
  geometry.computeBoundingSphere();
  return curve.points[4];
}

export function createBow({ wood }) {
  const root = new THREE.Group();
  root.name = 'Bow';
  const M = {
    riser: mat('Riser', '#c62828', 0.32, 0.55), // red anodised aluminium
    grip: wood || mat('Grip', '#8a5a33', 0.7),
    limb: mat('Limbs', '#1d2127', 0.38, 0.1),
    tipColor: mat('LimbTips', '#f1f3f5', 0.5),
    string: mat('String', '#fbf7ec', 0.6),
    serving: mat('Serving', '#1d2127', 0.6),
    rest: mat('ArrowRest', '#1d2127', 0.5),
  };
  // the riser: a profile in the x–y plane, a little behind the arrow (z < 0)
  const shape = new THREE.Shape();
  shape.moveTo(-0.022, 0.3);
  shape.splineThru(
    [
      [0.024, 0.3],
      [0.03, 0.16],
      [0.014, 0.06],
      [0.03, 0.0],
      [0.036, -0.06],
      [0.03, -0.14],
      [0.026, -0.3],
      [-0.022, -0.3],
      [-0.026, -0.14],
      [-0.05, -0.08],
      [-0.058, -0.03],
      [-0.04, 0.02],
      [-0.024, 0.08],
      [-0.022, 0.3],
    ].map(([x, y]) => new THREE.Vector2(x, y)),
  );
  const riserGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 48,
  });
  riserGeo.translate(0, 0, -0.042);
  const riser = new THREE.Mesh(riserGeo, M.riser);
  riser.name = 'Riser';
  root.add(riser);
  const grip = new THREE.Mesh(new THREE.CapsuleGeometry(0.026, 0.09, 4, 12), M.grip);
  grip.position.set(-0.022, -0.035, -0.027);
  grip.scale.set(1.1, 1, 0.9);
  root.add(grip);
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.006, 0.03), M.rest);
  shelf.position.set(0.012, ARROW_RISE - 0.009, -0.008);
  root.add(shelf);

  const limbs = [1, -1].map((sign) => {
    const g = limbGeometry();
    const mesh = new THREE.Mesh(g, M.limb);
    mesh.name = sign > 0 ? 'UpperLimb' : 'LowerLimb';
    mesh.position.z = -0.027;
    mesh.frustumCulled = false;
    root.add(mesh);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 8), M.tipColor);
    root.add(tip);
    return { sign, g, mesh, tip, at: new THREE.Vector3() };
  });

  const strings = [0, 1].map(() => {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8), M.string);
    s.name = 'String';
    root.add(s);
    return s;
  });
  const serving = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.09, 8), M.serving);
  root.add(serving);

  const UP = new THREE.Vector3(0, 1, 0);
  const nock = new THREE.Vector3();
  const d = new THREE.Vector3();
  const stringRadius = 0.0032; // drawn a little thicker than a real string so it shows on a phone

  /**
   * Bend the bow: k = draw / full draw (0 … 1, with a little overshoot past 0 allowed as the limbs spring back),
   * nockX = where the string is pulled to (x, at the arrow's height).
   */
  function set(k, nockX) {
    for (const l of limbs) {
      const end = bendLimb(l.g, k, l.sign);
      l.at.set(end.x, end.y, 0);
      l.tip.position.set(end.x, end.y, -0.027);
    }
    nock.set(nockX, ARROW_RISE, 0);
    for (const [i, s] of strings.entries()) {
      const a = limbs[i].at;
      d.subVectors(nock, a);
      const len = d.length();
      s.position.addVectors(a, nock).multiplyScalar(0.5).setZ(-0.012);
      s.quaternion.setFromUnitVectors(UP, d.divideScalar(len || 1));
      s.scale.set(stringRadius, len, stringRadius);
    }
    // the serving: the centre of the string where the fingers and nock go
    d.subVectors(limbs[0].at, nock).normalize();
    serving.position.copy(nock).addScaledVector(d, 0.01).setZ(-0.012);
    serving.quaternion.setFromUnitVectors(UP, d);
  }
  set(0, -BRACE);

  root.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });
  return {
    root,
    set,
    limbs: limbs.map((l) => l.mesh),
    materials: M,
    /** The top limb's tip (bow space), for labels. */
    tip: (i = 0) => limbs[i].at,
  };
}

// ── arrows ───────────────────────────────────────────────────────────────────
/** Three arrows: a light carbon one, an aluminium one and a heavy wooden one with a brass point. */
export const ARROW_KINDS = {
  0.02: { shaft: '#2a2e35', metal: 0.2, rough: 0.35, r: 0.0055, point: '#b8c0c8', pointLen: 0.028, vane: '#ffffff', cock: '#e64980' },
  0.03: { shaft: '#8fa3ba', metal: 0.8, rough: 0.3, r: 0.0062, point: '#b8c0c8', pointLen: 0.034, vane: '#ffffff', cock: '#1c7ed6' },
  0.04: { shaft: '#b07a43', metal: 0, rough: 0.65, r: 0.007, point: '#c9a227', pointLen: 0.045, vane: '#ffffff', cock: '#2f9e44' },
};

/** An arrow along +x, its nock (back end) at the origin. */
export function createArrowMesh(m) {
  const kind = ARROW_KINDS[m] || ARROW_KINDS[0.02];
  const root = new THREE.Group();
  root.name = `Arrow_${Math.round(m * 1000)}g`;
  const shaftM = mat('Shaft', kind.shaft, kind.rough, kind.metal);
  const pointM = mat('Point', kind.point, 0.3, 0.9);
  const vaneM = mat('Vanes', kind.vane, 0.7, 0, { side: THREE.DoubleSide });
  const cockM = mat('CockVane', kind.cock, 0.6, 0, { side: THREE.DoubleSide });
  const len = ARROW_LEN - kind.pointLen;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(kind.r, kind.r, len - 0.012, 10), shaftM);
  shaft.rotation.z = -Math.PI / 2;
  shaft.position.x = 0.012 + (len - 0.012) / 2;
  root.add(shaft);
  const point = new THREE.Mesh(new THREE.ConeGeometry(kind.r * 1.15, kind.pointLen, 12), pointM);
  point.rotation.z = -Math.PI / 2;
  point.position.x = len + kind.pointLen / 2;
  root.add(point);
  const nockMesh = new THREE.Mesh(new THREE.CylinderGeometry(kind.r * 1.05, kind.r * 0.9, 0.016, 10), cockM);
  nockMesh.rotation.z = -Math.PI / 2;
  nockMesh.position.x = 0.008;
  root.add(nockMesh);
  // three vanes, 120° apart; the odd-coloured cock vane points to the camera
  const vane = new THREE.Shape();
  vane.moveTo(0, 0);
  vane.quadraticCurveTo(0.03, 0.022, 0.085, 0.0);
  vane.lineTo(0, 0);
  const vaneGeo = new THREE.ShapeGeometry(vane, 6);
  vaneGeo.translate(0.03, kind.r, 0);
  for (let i = 0; i < 3; i++) {
    const v = new THREE.Mesh(vaneGeo, i === 0 ? cockM : vaneM);
    v.rotation.x = Math.PI / 2 + (i * 2 * Math.PI) / 3; // the first one points +z
    root.add(v);
  }
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });
  return { root, kind, materials: [shaftM, pointM, vaneM, cockM] };
}

// ── the straw bale, cut open along the arrows' plane to show how deep they go ──
function strawTexture(cut) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = cut ? '#d9a93f' : '#e2b552';
  ctx.fillRect(0, 0, 256, 256);
  let seed = cut ? 11 : 5;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const tones = ['#f3d27a', '#c99a32', '#b0822a', '#f7e09a', '#a87424'];
  for (let i = 0; i < (cut ? 2600 : 1400); i++) {
    ctx.strokeStyle = tones[Math.floor(r() * tones.length)];
    ctx.lineWidth = 0.8 + r() * 1.6;
    const x = r() * 256;
    const y = r() * 256;
    const a = cut ? r() * Math.PI : (r() - 0.5) * 0.5;
    const l = cut ? 3 + r() * 9 : 18 + r() * 40;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** The bale: the far half of a straw bale on a wooden stand, its cut face in the plane z = cutZ. */
export function createBale({ cutZ }) {
  const root = new THREE.Group();
  root.name = 'StrawBale';
  const half = BALE.w / 2;
  const side = mat('Straw', '#ffffff', 0.95, 0, { map: strawTexture(false) });
  const cut = mat('StrawCut', '#ffffff', 0.95, 0, { map: strawTexture(true) });
  side.map.repeat.set(2, 2);
  // faces: +x, −x, +y, −y, +z (the cut, to the camera), −z
  const bale = new THREE.Mesh(new THREE.BoxGeometry(BALE.depth, BALE.h, half), [side, side, side, side, cut, side]);
  bale.position.set(BALE.x + BALE.depth / 2, BALE.y + BALE.h / 2, cutZ - half / 2);
  bale.castShadow = true;
  bale.receiveShadow = true;
  root.add(bale);
  // two baling twines round it
  const twineM = mat('Twine', '#2f9e44', 0.7);
  for (const dy of [-0.2, 0.2]) {
    const tw = new THREE.Mesh(new THREE.BoxGeometry(BALE.depth + 0.008, 0.012, half + 0.004), twineM);
    tw.position.set(bale.position.x, bale.position.y + dy, bale.position.z);
    root.add(tw);
  }
  // the half that was cut away, as a faint outline (it is not there)
  const ghost = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(BALE.depth, BALE.h, half)),
    new THREE.LineDashedMaterial({ color: '#7a5a14', dashSize: 0.03, gapSize: 0.025, transparent: true, opacity: 0.55 }),
  );
  ghost.computeLineDistances();
  ghost.position.set(bale.position.x, bale.position.y, cutZ + half / 2);
  ghost.userData.noExport = true;
  root.add(ghost);
  // a wooden stand
  const woodM = mat('Stand', '#7a4a26', 0.7);
  for (const dx of [0.04, BALE.depth - 0.04])
    for (const dz of [-half + 0.05, -0.05]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, BALE.y, 0.05), woodM);
      leg.position.set(BALE.x + dx, BALE.y / 2, cutZ + dz);
      leg.castShadow = true;
      root.add(leg);
    }
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(BALE.depth + 0.04, 0.04, half), woodM);
  shelf.position.set(BALE.x + BALE.depth / 2, BALE.y - 0.02, cutZ - half / 2);
  shelf.castShadow = true;
  root.add(shelf);
  return { root, body: bale };
}

// ── the range: mown grass, a white shooting line ─────────────────────────────
export function createRange() {
  const root = new THREE.Group();
  root.name = 'Range';
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#5fae3c' : '#6dbb46'; // mown stripes
    ctx.fillRect(i * 64, 0, 64, 512);
  }
  let seed = 3;
  const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = ['#4f9a30', '#7ccb55', '#3f8a26', '#8fd463'][Math.floor(r() * 4)];
    ctx.fillRect(r() * 512, r() * 512, 1.5, 3 + r() * 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 4);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 24), mat('Grass', '#ffffff', 0.95, 0, { map: tex }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(2, 0, -6);
  ground.receiveShadow = true;
  root.add(ground);
  const line = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 3), mat('ShootingLine', '#ffffff', 0.8));
  line.rotation.x = -Math.PI / 2;
  line.position.set(0, 0.002, -0.2);
  line.receiveShadow = true;
  root.add(line);
  // a hedge and a tree line far behind: many small leafy clumps in several greens, low, so the archer and the
  // bale stand clear against the sky
  const leaf = new THREE.SphereGeometry(1, 10, 8);
  const leafM = mat('Foliage', '#ffffff', 0.92);
  const greens = ['#2e7d32', '#3a8c3c', '#256b2a', '#4a9a40', '#357a30'].map((c) => new THREE.Color(c));
  let s2 = 9;
  const r2 = () => (s2 = (s2 * 16807) % 2147483647) / 2147483647;
  const clumps = [];
  for (let i = 0; i < 90; i++) clumps.push([-9 + i * 0.22 + r2() * 0.1, 0.25 + r2() * 0.45, -12 - r2() * 0.5, 0.22 + r2() * 0.18]); // hedge
  for (const [x, z, h] of [
    [-6, -15, 3.4],
    [-3.2, -16, 2.8],
    [5.2, -15.5, 3.6],
    [9, -16, 3],
  ])
    for (let i = 0; i < 26; i++) {
      const a = r2() * Math.PI * 2;
      const rr = r2() * h * 0.32;
      clumps.push([x + Math.cos(a) * rr, h * (0.5 + r2() * 0.42), z + Math.sin(a) * rr * 0.6, h * (0.13 + r2() * 0.08)]);
    }
  const foliage = new THREE.InstancedMesh(leaf, leafM, clumps.length);
  const q = new THREE.Matrix4();
  const one = new THREE.Quaternion();
  for (const [i, [x, y, z, r]] of clumps.entries()) {
    q.compose(new THREE.Vector3(x, y, z), one, new THREE.Vector3(r, r * 0.85, r));
    foliage.setMatrixAt(i, q);
    foliage.setColorAt(i, greens[Math.floor(r2() * greens.length)]);
  }
  root.add(foliage);
  const trunkM = mat('Trunks', '#5d3f25', 0.9);
  for (const [x, z, h] of [
    [-6, -15, 3.4],
    [-3.2, -16, 2.8],
    [5.2, -15.5, 3.6],
    [9, -16, 3],
  ]) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, h * 0.55, 8), trunkM);
    trunk.position.set(x, h * 0.27, z);
    root.add(trunk);
  }
  for (const o of root.children) if (o !== ground && o !== line) o.userData.noExport = true;
  return { root, ground };
}
