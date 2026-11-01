// The bow, the arrows, the straw bale and the range (procedural three.js, metres). The bow lies in the x–y plane
// of its group: the grip at the origin, +x towards the target. Its limbs bend back as the string is drawn; the
// string runs from the top tip to the nock and down to the bottom tip.
import * as THREE from 'three';
import { bake, colourGeometry, paint } from './bake.js';

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
curve.arcLengthDivisions = 64; // the limb is short: 64 steps measure it well, and are quick to redo as it bends
const P = new THREE.Vector3();
const T = new THREE.Vector3();
// the four corners of the section (across ±n in the plane, ±z) and each side's normal, in order round the limb
const CORNER = [
  [1, 1],
  [1, -1],
  [-1, -1],
  [-1, 1],
];
const SIDE_N = [
  [1, 0],
  [0, -1],
  [-1, 0],
  [0, 1],
];
/** Bend a limb in place (no new objects): k = 0 at rest … 1 at full draw; sign = +1 upper, −1 lower. */
function bendLimb(geometry, k, sign) {
  for (let i = 0; i < 5; i++) {
    const [x0, y0] = LIMB_REST[i];
    const [x1, y1] = LIMB_BENT[i];
    curve.points[i].set(x0 + (x1 - x0) * k, sign * (y0 + (y1 - y0) * k), 0);
  }
  curve.needsUpdate = true; // the shape changed: measure its length again, so the samples stay evenly spaced
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
    for (let side = 0; side < 4; side++) {
      const o = (i * 8 + side * 2) * 3;
      for (let e = 0; e < 2; e++) {
        const [a, b] = CORNER[(side + e) % 4];
        pos[o + e * 3] = P.x + a * nx * th;
        pos[o + e * 3 + 1] = P.y + a * ny * th;
        pos[o + e * 3 + 2] = b * w;
        const [na, nz] = SIDE_N[side];
        nor[o + e * 3] = na * nx;
        nor[o + e * 3 + 1] = na * ny;
        nor[o + e * 3 + 2] = nz;
      }
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
    curveSegments: 12, // per point of the spline: 180 points round the riser
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

  const stringGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
  const strings = [0, 1].map(() => {
    const s = new THREE.Mesh(stringGeo, M.string);
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
  let lastK = Number.NaN;
  let lastNock = Number.NaN;
  function set(k, nockX) {
    if (k === lastK && nockX === lastNock) return; // nothing moved: no work
    lastK = k;
    lastNock = nockX;
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

  // the riser, the grip and the arrow shelf never move in the bow: one mesh each; only the riser and the limbs cast a
  // shadow you can see (the string, the tips and the shelf are too thin)
  riser.castShadow = true;
  for (const l of limbs) l.mesh.castShadow = true;
  bake(root, { skip: [...limbs.map((l) => l.mesh), ...limbs.map((l) => l.tip), ...strings, serving] });
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

/** One finished arrow of each kind, built once; every arrow shot is a copy sharing its geometry and materials. */
const ARROW_TEMPLATES = new Map();
function arrowTemplate(m) {
  const kind = ARROW_KINDS[m] || ARROW_KINDS[0.02];
  if (ARROW_TEMPLATES.has(kind)) return ARROW_TEMPLATES.get(kind);
  const root = new THREE.Group();
  const shaftM = mat('Shaft', kind.shaft, kind.rough, kind.metal);
  const pointM = mat('Point', kind.point, 0.3, 0.9);
  // the nock and the three vanes: plain colours, one vertex-coloured material
  const fletchM = mat('Fletching', '#ffffff', 0.65, 0, { side: THREE.DoubleSide, vertexColors: true });
  const vaneC = new THREE.Color(kind.vane);
  const cockC = new THREE.Color(kind.cock);
  const len = ARROW_LEN - kind.pointLen;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(kind.r, kind.r, len - 0.012, 10), shaftM);
  shaft.rotation.z = -Math.PI / 2;
  shaft.position.x = 0.012 + (len - 0.012) / 2;
  root.add(shaft);
  const point = new THREE.Mesh(new THREE.ConeGeometry(kind.r * 1.15, kind.pointLen, 12), pointM);
  point.rotation.z = -Math.PI / 2;
  point.position.x = len + kind.pointLen / 2;
  root.add(point);
  const nockMesh = new THREE.Mesh(colourGeometry(new THREE.CylinderGeometry(kind.r * 1.05, kind.r * 0.9, 0.016, 10), cockC), fletchM);
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
    const v = new THREE.Mesh(colourGeometry(vaneGeo, i === 0 ? cockC : vaneC), fletchM);
    v.rotation.x = Math.PI / 2 + (i * 2 * Math.PI) / 3; // the first one points +z
    root.add(v);
  }
  for (const o of root.children) o.castShadow = true;
  bake(root);
  const t = { root, kind, materials: [shaftM, pointM, fletchM] };
  ARROW_TEMPLATES.set(kind, t);
  return t;
}

/** An arrow along +x, its nock (back end) at the origin: three meshes (shaft, point, fletching) shared by kind. */
export function createArrowMesh(m) {
  const t = arrowTemplate(m);
  const root = t.root.clone();
  root.name = `Arrow_${Math.round(m * 1000)}g`;
  return { root, kind: t.kind, materials: t.materials };
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
  // faces: +x, −x, +y, −y, +z (the cut, to the camera), −z; the index reordered so the five straw sides draw at once
  // and the cut face after them (two draws, not six)
  const baleGeo = new THREE.BoxGeometry(BALE.depth, BALE.h, half);
  const idx = Array.from(baleGeo.index.array);
  baleGeo.setIndex([...idx.slice(0, 24), ...idx.slice(30, 36), ...idx.slice(24, 30)]);
  baleGeo.clearGroups();
  baleGeo.addGroup(0, 30, 0);
  baleGeo.addGroup(30, 6, 1);
  const bale = new THREE.Mesh(baleGeo, [side, cut]);
  bale.position.set(BALE.x + BALE.depth / 2, BALE.y + BALE.h / 2, cutZ - half / 2);
  bale.castShadow = true;
  bale.receiveShadow = true;
  root.add(bale);
  // two baling twines round it; the twine and the wooden stand share one vertex-coloured material (one draw)
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
  paint(root, [twineM, woodM], mat('BaleStand', '#ffffff', 0.7, 0, { vertexColors: true }));
  bake(root, { skip: [bale, ghost] });
  return { root, body: bale };
}

// ── the hall: a plain floor and a soft wall behind the archer and the target ──────────────────────
function canvasTexture(w, h, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(...repeat);
  tex.anisotropy = 8;
  return tex;
}

/** A World Archery target face (60 cm): ten rings, gold, red, blue, black and white, 3 cm each. */
function faceTexture() {
  const tex = canvasTexture(512, 512, (ctx, w) => {
    const c = w / 2;
    const ring = c / 10;
    const colours = ['#ffffff', '#ffffff', '#1d1d1f', '#1d1d1f', '#00a2e8', '#00a2e8', '#e2231a', '#e2231a', '#ffe552', '#ffe552'];
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.arc(c, c, (10 - i) * ring, 0, Math.PI * 2);
      ctx.fillStyle = colours[i];
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = i === 2 || i === 3 ? '#ffffff' : '#1d1d1f'; // the dividing lines (white in the black rings)
      ctx.stroke();
    }
    ctx.beginPath(); // the inner 10 and the centre cross
    ctx.arc(c, c, ring / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillRect(c - 4, c - 0.75, 8, 1.5);
    ctx.fillRect(c - 0.75, c - 4, 1.5, 8);
  });
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/** The target face pinned on the front of the boss, gold centre at `y`, cut in half with the boss (z < cutZ). */
export function createFace({ cutZ, y }) {
  const face = new THREE.Mesh(
    new THREE.CircleGeometry(0.3, 64, Math.PI / 2, Math.PI), // only the half behind the cut (local x < 0 → z < cutZ)
    mat('TargetFace', '#ffffff', 0.85, 0, { map: faceTexture() }),
  );
  face.name = 'TargetFace';
  face.rotation.y = -Math.PI / 2; // facing the archer (−x)
  face.position.set(BALE.x - 0.002, y, cutZ);
  return face;
}

/**
 * The hall: a maple sports floor with court lines, the white shooting line, orange wall padding under a red brick
 * wall with high windows, lamps under the roof, and a black arrow-stop net behind the target. `backdrop` is
 * everything but the floor (hidden for a transparent background).
 */
export function createRange() {
  const root = new THREE.Group();
  root.name = 'Hall';
  const floor = new THREE.Group();
  floor.name = 'HallFloor';
  root.add(floor);
  // a plain warm floor and the shooting line where the archer stands (no court lines, no grain)
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(50, 16), mat('Floor', '#c9a67c', 0.6));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(2, 0, -4);
  ground.receiveShadow = true;
  floor.add(ground);
  const line = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 5), mat('ShootingLine', '#ffffff', 0.55));
  line.rotation.x = -Math.PI / 2;
  line.position.set(0, 0.002, -1.6);
  line.receiveShadow = true;
  floor.add(line);
  bake(floor);

  // a soft blue wall behind, lighter low down (vertex colours, no texture): one draw
  const backdrop = new THREE.Group();
  backdrop.name = 'HallWalls';
  root.add(backdrop);
  const WALL_Z = -4.6;
  const geo = new THREE.PlaneGeometry(50, 7, 1, 6);
  const low = new THREE.Color('#cfdbe4');
  const high = new THREE.Color('#87a6c3');
  const col = new THREE.Color();
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    col.lerpColors(low, high, pos.getY(i) / 7 + 0.5);
    colors.set([col.r, col.g, col.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const wall = new THREE.Mesh(geo, mat('Wall', '#ffffff', 0.95, 0, { vertexColors: true }));
  wall.position.set(2, 3.5, WALL_Z);
  backdrop.add(wall);
  root.traverse((o) => {
    o.userData.noExport = true;
  });
  return { root, ground: floor, backdrop };
}
