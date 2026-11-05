// The apple tree and its apples, in metres, procedural. A broad old standard apple tree: a flared trunk with bark, limbs
// as tapered tubes, foliage as one instanced mesh of leaf sprays whose shade is worked out once (lit at the top on the
// sun's side, dark inside and underneath), so it needs no lights or shadows of its own. Five boughs reach out to the
// right and end above a line of five apples, one at each whole metre from 1 m to 5 m, each further out than the one below
// so a falling apple clears everything under it. No leaf sits in front of those apples or in their way down.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** A small seeded generator: the tree is the same every time. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const TRUNK = { x: -1.45, z: -0.45 };
export const FALL_Z = 0.85; // every apple's fall lies in this upright plane, with the height pole
export const SPUR_UP = 0.26; // the twig's end is this far above the apple's lowest point
/** Where the apples hang: h metres up (their lowest point), each further out than the one below. */
export const SPOTS = [1, 2, 3, 4, 5].map((h) => ({ h, x: 0.72 + (h - 1) * 0.27, z: FALL_Z }));

const v = (x, y, z) => new THREE.Vector3(x, y, z);

/** A tapered tube along points; radius(s), s 0…1; flare(s, angle) is a factor on it (the trunk's roots and lobes). */
function tube(points, radius, { radial = 7, per = 4.5, flare = null, barkScale = 1.4 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const len = curve.getLength();
  const rows = Math.max(3, Math.ceil(len * per));
  const frames = curve.computeFrenetFrames(rows, false);
  const pos = [];
  const nor = [];
  const uv = [];
  const idx = [];
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const wraps = Math.max(1, Math.round(radius(0) * 2 * Math.PI * barkScale));
  for (let i = 0; i <= rows; i++) {
    const s = i / rows;
    curve.getPointAt(s, p);
    const r = radius(s);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const c = Math.cos(a);
      const q = Math.sin(a);
      const rr = flare ? r * flare(s, a) : r;
      n.copy(frames.normals[i]).multiplyScalar(c).addScaledVector(frames.binormals[i], q);
      pos.push(p.x + n.x * rr, p.y + n.y * rr, p.z + n.z * rr);
      nor.push(n.x, n.y, n.z);
      uv.push((j / radial) * wraps, s * len * barkScale);
    }
  }
  const w = radial + 1;
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < radial; j++) {
      const a = i * w + j;
      idx.push(a, a + w, a + 1, a + 1, a + w, a + w + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return { geometry: g, curve };
}

/** Grey-brown bark with long fissures, as colour and bump. */
function barkTextures() {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  const rand = rng(11);
  g.fillStyle = '#6f5f50';
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 1500; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const dark = rand() < 0.55;
    const l = 24 + rand() * 90;
    g.strokeStyle = dark ? `rgba(38,29,23,${0.25 + rand() * 0.45})` : `rgba(165,148,130,${0.12 + rand() * 0.3})`;
    g.lineWidth = 1 + rand() * (dark ? 4.5 : 3);
    g.beginPath();
    g.moveTo(x, y);
    g.bezierCurveTo(x + rand() * 12 - 6, y + l * 0.33, x + rand() * 12 - 6, y + l * 0.66, x + rand() * 16 - 8, y + l);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  const b = new THREE.CanvasTexture(c);
  b.wrapS = b.wrapT = THREE.RepeatWrapping;
  return { map: t, bump: b };
}

/** A spray of leaves on a twig, pale so each card's own colour tints it; the rest of the square is clear. */
function leafTexture() {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  const rand = rng(5);
  const leaf = (x, y, a, l, w) => {
    g.save();
    g.translate(x, y);
    g.rotate(a);
    const shade = 170 + Math.floor(rand() * 85);
    g.fillStyle = `rgb(${shade},${shade},${shade})`;
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(l * 0.25, -w, l * 0.72, -w * 0.8, l, 0);
    g.bezierCurveTo(l * 0.72, w * 0.8, l * 0.25, w, 0, 0);
    g.fill();
    g.strokeStyle = 'rgba(70,80,60,0.55)';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(l * 0.96, 0);
    g.stroke();
    g.restore();
  };
  const spots = [
    [128, 128, -0.5],
    [128, 128, 0.9],
    [128, 128, 2.2],
    [128, 128, 3.5],
    [128, 128, 4.8],
    [70, 90, 2.4],
    [186, 92, 0.2],
    [176, 182, 1.2],
    [78, 176, 3.2],
  ];
  for (const [x, y, a] of spots) leaf(x, y, a + (rand() - 0.5) * 0.5, 62 + rand() * 26, 15 + rand() * 7);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 2;
  return t;
}

/** The apple's skin: deep red with a yellow-green shoulder round the stem, streaks and pale lenticels. */
function appleSkin() {
  const w = 512;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const rand = rng(23);
  // the lathe's v runs from the bottom (0) to the top (1); the canvas top is v = 1
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#b9bb45');
  grad.addColorStop(0.09, '#c8782c');
  grad.addColorStop(0.2, '#be2a24');
  grad.addColorStop(0.62, '#a8141c');
  grad.addColorStop(0.92, '#8f1320');
  grad.addColorStop(1, '#b28a38');
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 360; i++) {
    const x = rand() * w;
    const y = rand() * h * 0.5;
    g.strokeStyle = rand() < 0.5 ? `rgba(226,170,70,${0.05 + rand() * 0.16})` : `rgba(90,6,16,${0.08 + rand() * 0.2})`;
    g.lineWidth = 1 + rand() * 3;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + rand() * 8 - 4, y + 34 + rand() * 90);
    g.stroke();
  }
  g.fillStyle = 'rgba(250,226,190,0.5)';
  for (let i = 0; i < 240; i++) g.fillRect(rand() * w, 20 + rand() * (h - 40), 1.5, 1.5);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/** A unit apple (widest radius about 1): shoulders fuller than the base, a deep stem well, a shallow eye; y = 0 at its middle. */
function appleProfile(rows = 20) {
  const pts = [];
  for (let i = 0; i <= rows; i++) {
    const a = (i / rows) * Math.PI; // 0: the eye at the bottom, π: the stem well at the top
    const well = 0.34 * Math.exp(-(((Math.PI - a) / 0.5) ** 2));
    const eye = 0.14 * Math.exp(-((a / 0.34) ** 2));
    const r = Math.sin(a) * (1 - 0.1 * Math.cos(a));
    pts.push(new THREE.Vector2(Math.max(1e-4, r), -Math.cos(a) * 0.92 - well + eye + 0.04));
  }
  return pts;
}
const PROFILE = appleProfile();
export const APPLE_BOTTOM = -Math.min(...PROFILE.map((p) => p.y)); // from the unit apple's middle down to its lowest point
export const APPLE_TOP = Math.max(...PROFILE.map((p) => p.y)); // and up to the rim of its shoulders

export function createAppleKit() {
  const body = new THREE.LatheGeometry(PROFILE, 28);
  body.computeBoundingSphere();
  const skin = new THREE.MeshStandardMaterial({ name: 'AppleSkin', map: appleSkin(), roughness: 0.34, metalness: 0 });
  const stemGeo = new THREE.CylinderGeometry(0.035, 0.05, 1, 6).translate(0, 0.5, 0);
  const stemMat = new THREE.MeshStandardMaterial({ name: 'AppleStem', color: '#4a3524', roughness: 0.85 });
  /** One apple: `.body` scaled by radius; the stem runs from its well up to the twig (setStem). */
  function apple(name) {
    const root = new THREE.Group();
    root.name = name;
    const mesh = new THREE.Mesh(body, skin);
    mesh.name = `${name}Body`;
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.name = `${name}Stem`;
    root.add(mesh, stem);
    return {
      root,
      mesh,
      stem,
      /** r: the drawn radius (m); stemLen: from the well to the twig (m). */
      set(r, stemLen = 0.05) {
        mesh.scale.setScalar(r);
        stem.position.y = r * APPLE_TOP * 0.75;
        stem.scale.set(r * 0.9, stemLen + r * 0.2, r * 0.9);
      },
    };
  }
  return { body, skin, apple };
}

/**
 * The tree. Returns { root, spurs (where each of the five twigs ends), twinSpur, leaves, wood, decor }.
 * @param {{ apples: ReturnType<typeof createAppleKit>, leafCount?: number }} options
 */
export function createTree({ apples }) {
  const root = new THREE.Group();
  root.name = 'AppleTree';
  const rand = rng(7);
  const tx = TRUNK.x;
  const tz = TRUNK.z;

  const parts = [];
  const limbs = [];
  // the trunk: leaning a little, its foot flared into lobes that run into the ground
  const trunkPts = [v(tx, -0.06, tz), v(tx + 0.03, 0.5, tz), v(tx + 0.1, 1.3, tz + 0.02), v(tx + 0.16, 2.1, tz + 0.05), v(tx + 0.2, 2.65, tz + 0.06)];
  const trunk = tube(trunkPts, (s) => 0.27 - 0.1 * s, {
    radial: 16,
    per: 6,
    flare: (s, a) => 1 + Math.max(0, 1 - s * 4.2) ** 2 * (0.5 + 0.34 * Math.sin(a * 5 + 1)) + 0.05 * Math.sin(a * 3 + s * 7),
  });
  parts.push(trunk.geometry);

  const taper =
    (r0, r1, k = 0.85) =>
    (s) =>
      r1 + (r0 - r1) * (1 - s) ** k;
  /** A limb, kept for the foliage. */
  function limb(points, r0, r1 = 0.012, opts = {}) {
    const t = tube(points, taper(r0, r1), { radial: r0 > 0.05 ? 8 : 6, ...opts });
    parts.push(t.geometry);
    limbs.push({ curve: t.curve, r0 });
    return t.curve;
  }

  // the five boughs to the apples, from the trunk outward to the right and toward the viewer
  const end = (i) => {
    const q = SPOTS[i];
    return [v(q.x - 0.05, q.h + SPUR_UP + 0.05, q.z - 0.02), v(q.x, q.h + SPUR_UP, q.z)];
  };
  const bough = [
    limb([v(tx + 0.12, 1.78, tz + 0.1), v(-0.75, 1.92, 0.05), v(-0.05, 1.72, 0.5), v(0.42, 1.42, 0.76), ...end(0)], 0.085),
    limb([v(tx + 0.14, 2.12, tz + 0.1), v(-0.7, 2.42, 0.02), v(0.1, 2.48, 0.46), v(0.62, 2.44, 0.76), ...end(1)], 0.095),
    limb([v(tx + 0.18, 2.42, tz + 0.08), v(-0.62, 3.0, -0.02), v(0.2, 3.32, 0.42), v(0.82, 3.4, 0.74), ...end(2)], 0.11),
    limb([v(tx + 0.2, 2.6, tz + 0.06), v(-0.7, 3.42, -0.15), v(0.15, 4.0, 0.22), v(0.98, 4.34, 0.68), ...end(3)], 0.12),
    limb([v(tx + 0.2, 2.62, tz + 0.04), v(-0.85, 3.7, -0.28), v(-0.05, 4.62, 0.05), v(1.0, 5.12, 0.5), ...end(4)], 0.12),
  ];
  // a side twig on the third bough, for the test's second apple
  const twinAt = bough[2].getPointAt(0.8);
  const twinSpur = { x: twinAt.x, z: twinAt.z, y: twinAt.y };

  // the rest of the crown, spreading to the left, the back and the top
  const fork = v(tx + 0.2, 2.62, tz + 0.05);
  const crown = [
    [v(-2.5, 3.2, -0.65), v(-3.3, 3.9, -0.85), v(-3.95, 4.3, -1.0)],
    [v(-2.2, 3.7, 0.05), v(-2.65, 4.7, 0.5), v(-2.8, 5.4, 0.75)],
    [v(-1.45, 3.9, -1.2), v(-1.3, 5.0, -1.9), v(-1.15, 5.9, -2.2)],
    [v(-0.72, 3.55, -1.25), v(0.1, 4.3, -2.0), v(0.95, 4.9, -2.6)],
    [v(-2.15, 3.05, -1.4), v(-2.85, 3.5, -2.3), v(-3.2, 3.95, -2.9)],
    [v(-1.3, 3.9, -0.3), v(-1.1, 5.1, -0.35), v(-0.9, 6.25, -0.3)],
    [v(-0.75, 3.1, -0.95), v(0.45, 3.45, -1.5), v(1.55, 3.85, -1.9)],
  ];
  for (const pts of crown) {
    const c = limb([fork.clone(), ...pts], 0.13);
    // side branches
    for (let i = 0; i < 3; i++) {
      const a = c.getPointAt(0.4 + i * 0.2);
      const d = v(rand() - 0.5, rand() * 0.7 + 0.1, rand() - 0.5).normalize();
      const b = a.clone().addScaledVector(d, 0.6 + rand() * 0.5);
      const e = b.clone().add(v((rand() - 0.5) * 0.5, 0.2 + rand() * 0.4, (rand() - 0.5) * 0.5));
      limb([a, b, e], 0.035);
    }
  }
  const woodGeo = mergeGeometries(parts, false);
  for (const g of parts) g.dispose();
  const { map, bump } = barkTextures();
  const bark = new THREE.MeshStandardMaterial({ name: 'Bark', map, bumpMap: bump, bumpScale: 1.6, roughness: 0.96, metalness: 0 });
  const wood = new THREE.Mesh(woodGeo, bark);
  wood.name = 'Wood';
  wood.castShadow = true;
  wood.receiveShadow = true;
  root.add(wood);

  // ── the foliage ─────────────────────────────────────────────────────────────
  const C = v(-1.0, 4.6, -0.75); // the crown's middle
  const REACH = v(3.1, 2.3, 2.7); // its half-size
  const SUN = v(-0.5, 0.8, 0.42).normalize();
  /** Nothing in front of the five apples or in their way down, and nothing low over the reader. */
  const keepOut = (p) => {
    if (p.y < 1.55) return true;
    for (const q of SPOTS) if (Math.abs(p.x - q.x) < 0.17 && p.z > q.z - 0.26 && p.y < q.h + SPUR_UP - 0.02) return true;
    return p.z > FALL_Z + 0.02 && p.x > 0.4 && p.y < 5.6; // the side of the viewer
  };
  const cards = [];
  const n = new THREE.Vector3();
  const local = new THREE.Vector3();
  function spray(x, y, z, size) {
    const p = v(x, y, z);
    if (keepOut(p)) return;
    n.copy(p).sub(C);
    local.set(n.x / REACH.x, n.y / REACH.y, n.z / REACH.z);
    const out = Math.min(1, local.length()); // 0 at the crown's heart, 1 on its skin
    const lit = n.normalize().dot(SUN) * 0.5 + 0.5;
    const under = THREE.MathUtils.clamp((p.y - 2.1) / 2.4, 0, 1);
    cards.push({ p, size, shade: THREE.MathUtils.clamp(0.12 + 0.62 * lit * lit + 0.3 * out * under + (rand() - 0.5) * 0.2, 0, 1) });
  }
  function clump(c, count, radius, size) {
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const z = rand() * 2 - 1;
      const r = radius * Math.cbrt(rand());
      const q = Math.sqrt(1 - z * z);
      spray(c.x + r * q * Math.cos(a), c.y + r * z * 0.75, c.z + r * q * Math.sin(a), size * (0.8 + rand() * 0.5));
    }
  }
  const at = new THREE.Vector3();
  for (const l of limbs) {
    const big = l.r0 > 0.06;
    for (let s = big ? 0.42 : 0.3; s <= 1.001; s += big ? 0.11 : 0.3) {
      l.curve.getPointAt(s, at);
      clump(at, big ? 44 : 22, big ? 0.52 + s * 0.35 : 0.42, 0.42);
    }
  }
  // the five boughs carry their own leaves behind and above the apples
  for (const b of bough)
    for (let s = 0.3; s <= 1.001; s += 0.08) {
      b.getPointAt(s, at);
      clump(at.clone().add(n.set(-0.05, 0.14, -0.22)), 16, 0.3, 0.32);
    }
  // and the crown's body, so it reads as one mass with air only at its edges
  for (let i = 0; i < 1500; i++) {
    const a = rand() * Math.PI * 2;
    const z = rand() * 2 - 1;
    const r = Math.cbrt(rand());
    const q = Math.sqrt(1 - z * z);
    spray(C.x + REACH.x * r * q * Math.cos(a), C.y + REACH.y * r * z, C.z + REACH.z * r * q * Math.sin(a), 0.46);
  }
  const card = new THREE.PlaneGeometry(1, 1);
  const leafMat = new THREE.MeshBasicMaterial({ name: 'Leaves', map: leafTexture(), alphaTest: 0.42, side: THREE.DoubleSide });
  const leaves = new THREE.InstancedMesh(card, leafMat, cards.length);
  leaves.name = 'Leaves';
  const dark = new THREE.Color('#284a1c');
  const mid = new THREE.Color('#517f30');
  const light = new THREE.Color('#a9c654');
  const col = new THREE.Color();
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const sc = new THREE.Vector3();
  cards.forEach((k, i) => {
    q.setFromEuler(e.set(rand() * Math.PI, rand() * Math.PI * 2, rand() * Math.PI));
    m.compose(k.p, q, sc.setScalar(k.size));
    leaves.setMatrixAt(i, m);
    if (k.shade < 0.5) col.lerpColors(dark, mid, k.shade * 2);
    else col.lerpColors(mid, light, (k.shade - 0.5) * 2);
    col.offsetHSL((rand() - 0.5) * 0.025, 0, (rand() - 0.5) * 0.03);
    leaves.setColorAt(i, col);
  });
  leaves.instanceMatrix.needsUpdate = true;
  leaves.frustumCulled = false;
  leaves.userData.noExport = true;
  root.add(leaves);
  // the GLB's leaves: every tenth spray, 2.6 times the size, on a layer the camera never draws (so the file stays small)
  const every = 10;
  const thin = new THREE.InstancedMesh(card, leafMat, Math.floor(cards.length / every));
  thin.name = 'LeavesLight';
  thin.layers.set(1);
  thin.frustumCulled = false;
  for (let i = 0; i < thin.count; i++) {
    leaves.getMatrixAt(i * every, m);
    thin.setMatrixAt(i, m.scale(sc.setScalar(2.6)));
    leaves.getColorAt(i * every, col);
    thin.setColorAt(i, col);
  }
  root.add(thin);

  // a few more apples high in the crown (the student's five are the ones low on the right)
  const extra = [
    v(-2.3, 3.0, 0.9),
    v(-1.6, 3.35, 1.4),
    v(-0.75, 2.85, 1.2),
    v(-2.95, 3.5, 0.25),
    v(-3.25, 2.95, -0.2),
    v(-0.1, 2.75, -0.1),
    v(-1.9, 2.5, 0.55),
  ];
  const decor = new THREE.InstancedMesh(apples.body, apples.skin, extra.length);
  decor.name = 'MoreApples';
  extra.forEach((p, i) => {
    q.setFromEuler(e.set(0.2 * (rand() - 0.5), rand() * 6, 0.3 * (rand() - 0.5)));
    decor.setMatrixAt(i, m.compose(p, q, sc.setScalar(0.075)));
  });
  decor.instanceMatrix.needsUpdate = true;
  root.add(decor);

  const spurs = SPOTS.map((q) => v(q.x, q.h + SPUR_UP, q.z));
  return { root, spurs, twinSpur, leaves, wood, decor, triangles: (woodGeo.index.count / 3 + cards.length * 2) | 0 };
}
