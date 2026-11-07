// The atom model of চিত্র ১০.০১, in 3D: a nucleus of protons (red, a white "+") and neutrons (grey, no sign) packed
// into a small ball, three thin orbit rings in one plane (the book's flat circles, leaning back a little so they read
// as 3D), and the electrons (blue, a white "−") on them. Every ball turns to the viewer, so each proton shows its "+"
// and each electron its "−" (one sign texture per kind, drawn where the sphere faces +z). Instanced: one draw for the
// protons, one for the neutrons, one for the electrons, one for the empty places, one for the rings. Units: cm of a
// display model (the GLB is in metres). Not to scale: the real nucleus is thousands of times smaller than the atom.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ATOMS, shells } from './reading.js';

export const COLORS = { proton: '#e03131', neutron: '#9aa3ad', electron: '#1971c2', ring: '#d6e4f5', gap: '#ffffff' };
export const R_NUCLEON = 0.62;
export const R_ELECTRON = 0.72;
/** The three orbits (cm): the book's circles, inner to outer. */
export const SHELL_R = [4.4, 7.7, 11];
/** Where an electron taken away waits, outside the outer orbit (cm from the nucleus). */
export const PARK_R = 13.9;
/** The orbits' plane leans back by this much (radians), so the circles read as circles and the model as 3D. */
export const TILT = THREE.MathUtils.degToRad(12);
/** Electrons' places: angle (radians) on their shell; the book's figure has 2 at the top and bottom, then 8 and 8. */
const SHELL_ANGLES = [
  [90, 270],
  [90, 45, 0, 315, 270, 225, 180, 135],
  [90, 45, 0, 315, 270, 225, 180, 135],
];
/** Chlorine's free place in its outer shell (deg): upper left, where the stray electron comes in. */
export const GAP_DEG = 135;
/** The first electron taken from argon's outer shell (deg): upper right. */
export const FIRST_OUT_DEG = 45;

const rad = THREE.MathUtils.degToRad;

/** A small seeded random generator (the same nucleus on every load, so pictures compare). */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * `n` touching balls of radius r packed into a round nucleus (deterministic): start on a golden spiral, then push
 * overlapping balls apart and pull all of them gently to the centre until it settles. Returns Vector3s (cm).
 */
export function packNucleus(n, r = R_NUCLEON, seed = 7) {
  const rnd = seeded(seed);
  const R0 = r * 1.15 * Math.cbrt(n);
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const rr = Math.sqrt(1 - y * y);
    const k = Math.cbrt((i + 0.5) / n) * R0;
    pts.push(new THREE.Vector3(Math.cos(golden * i) * rr * k + (rnd() - 0.5) * 0.05, y * k, Math.sin(golden * i) * rr * k));
  }
  const d = new THREE.Vector3();
  const min = 2 * r * 0.97;
  for (let it = 0; it < 260; it++) {
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        d.subVectors(pts[j], pts[i]);
        const L = d.length();
        if (L < min && L > 1e-6) {
          d.multiplyScalar((min - L) / L / 2);
          pts[i].sub(d);
          pts[j].add(d);
        }
      }
    for (const p of pts) p.multiplyScalar(0.985);
  }
  // centre it
  const c = new THREE.Vector3();
  for (const p of pts) c.add(p);
  c.divideScalar(n);
  for (const p of pts) p.sub(c);
  return pts;
}

/** Which of the n balls are protons: z of them, spread evenly through the nucleus (not all on one side). */
function protonFlags(n, z, pts) {
  // order by a spiral round the nucleus, then take every (n/z)-th
  const order = pts.map((p, i) => ({ i, a: Math.atan2(p.z, p.x) + p.y * 2.3 })).sort((a, b) => a.a - b.a);
  const flags = new Array(n).fill(false);
  order.forEach((o, k) => {
    flags[o.i] = Math.floor(((k + 1) * z) / n) > Math.floor((k * z) / n);
  });
  return flags;
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** A ball's skin: its colour, with a white sign ('+', '−' or none) where the ball faces the viewer (u = 0.25). */
function signTexture(color, sign) {
  const W = sign ? 256 : 4;
  const H = sign ? 128 : 4;
  const c = canvas(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
  if (sign) {
    ctx.fillStyle = '#ffffff';
    const cx = W * 0.25;
    const cy = H / 2;
    const len = 50; // ≈ 70° of the ball, as big as the sign on coulombs-law's spheres
    const th = 13;
    const bar = (x, y, w, h) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, th / 2);
      ctx.fill();
    };
    bar(cx - len / 2, cy - th / 2, len, th);
    if (sign === '+') bar(cx - th / 2, cy - len / 2, th, len);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** A thin dashed ring (an empty place on an orbit): white dashes round a torus, cut by alphaTest. */
function dashTexture() {
  const c = canvas(64, 4);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 64, 4);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 8; i++) ctx.fillRect(i * 8, 0, 5, 4);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

export function createAtom() {
  const root = new THREE.Group();
  root.name = 'ArgonAtomModel';
  root.rotation.x = -TILT; // the orbits' plane leans back
  const ballGeo = new THREE.SphereGeometry(1, 24, 16);
  const exportBall = new THREE.SphereGeometry(1, 16, 12);
  const ball = (name, color, sign, extra = {}) =>
    new THREE.MeshStandardMaterial({ name, map: signTexture(color, sign), roughness: 0.32, metalness: 0, envMapIntensity: 1.1, ...extra });
  const mats = {
    proton: ball('Proton', COLORS.proton, '+'),
    neutron: ball('Neutron', COLORS.neutron, ''),
    electron: ball('Electron', COLORS.electron, '−', { transparent: true, emissive: new THREE.Color('#0b3d7a'), emissiveIntensity: 0.35 }),
  };
  const MAXP = Math.max(ATOMS.ar.protons, ATOMS.cl.protons);
  const MAXN = Math.max(ATOMS.ar.neutrons, ATOMS.cl.neutrons);
  const protons = new THREE.InstancedMesh(ballGeo, mats.proton, MAXP);
  const neutrons = new THREE.InstancedMesh(ballGeo, mats.neutron, MAXN);
  protons.name = 'Protons';
  neutrons.name = 'Neutrons';
  const nucleus = new THREE.Group();
  nucleus.name = 'Nucleus';
  nucleus.add(protons, neutrons);

  const electrons = new THREE.InstancedMesh(ballGeo, mats.electron, 18);
  electrons.name = 'Electrons';

  // the orbits: three thin rings, one mesh
  const ringGeo = mergeGeometries(SHELL_R.map((R) => new THREE.TorusGeometry(R, 0.075, 6, 160)));
  const ringMat = new THREE.MeshStandardMaterial({
    name: 'Orbit',
    color: COLORS.ring,
    emissive: new THREE.Color('#5d7fa8'),
    emissiveIntensity: 0.45,
    roughness: 0.35,
    metalness: 0.25,
    transparent: true,
  });
  const rings = new THREE.Mesh(ringGeo, ringMat);
  rings.name = 'Orbits';

  // empty places on an orbit (an electron taken away, chlorine's free place): dashed rings facing the viewer
  const gapTex = dashTexture();
  gapTex.repeat.set(3, 1);
  const gapMat = new THREE.MeshBasicMaterial({
    name: 'EmptyPlace',
    color: COLORS.gap,
    alphaMap: gapTex,
    alphaTest: 0.5,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const gaps = new THREE.InstancedMesh(new THREE.TorusGeometry(R_ELECTRON * 1.05, 0.07, 4, 40), gapMat, 3);
  gaps.name = 'EmptyPlaces';
  gaps.userData.noExport = true;
  gaps.count = 0;

  for (const m of [protons, neutrons, electrons]) {
    m.castShadow = true;
    m.frustumCulled = false;
  }
  rings.castShadow = true;
  gaps.frustumCulled = false;
  root.add(nucleus, rings, electrons, gaps);

  // ── layouts of the two atoms ─────────────────────────────────────────────────
  const LAYOUT = {};
  for (const id of ['ar', 'cl']) {
    const a = ATOMS[id];
    const n = a.protons + a.neutrons;
    const pts = packNucleus(n, R_NUCLEON, id === 'ar' ? 7 : 11);
    const flags = protonFlags(n, a.protons, pts);
    const radius = Math.max(...pts.map((p) => p.length())) + R_NUCLEON;
    LAYOUT[id] = { pts, flags, radius };
  }

  /** The electrons' places for a neutral atom with `count` electrons (argon 18): [{ shell, deg }]. */
  function slotsFor(count) {
    const out = [];
    shells(count).forEach((k, s) => {
      for (let j = 0; j < k; j++) out.push({ shell: s, deg: SHELL_ANGLES[s][j] });
    });
    return out;
  }
  /** Argon: 18 places. Chlorine: 17 electrons in 2-8-7 with the free place at GAP_DEG, and the stray one (index 17). */
  const SLOTS = {
    ar: slotsFor(18),
    cl: (() => {
      const s = slotsFor(18).filter((x) => !(x.shell === 2 && x.deg === GAP_DEG));
      s.push({ shell: 2, deg: GAP_DEG });
      return s;
    })(),
  };

  const q = new THREE.Quaternion();
  const qi = new THREE.Quaternion();
  const m = new THREE.Matrix4();
  const S = new THREE.Vector3();
  const P = new THREE.Vector3();

  let element = 'ar';
  let nucleusScale = 1;
  let electronCount = 18;
  const ePos = Array.from({ length: 18 }, () => new THREE.Vector3());
  const eScale = new Array(18).fill(1);
  const gapPos = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  let gapCount = 0;
  let gapScale = 1;

  /** The point on shell `s` at angle `deg` turned by `phase` (radians), in the atom's plane (cm). */
  function slotPoint(s, deg, phase, out) {
    const a = rad(deg) + phase;
    return out.set(Math.cos(a) * SHELL_R[s], Math.sin(a) * SHELL_R[s], 0);
  }
  /** Where an electron at angle `a` (radians) waits once taken away. */
  function parkPoint(a, out, r = PARK_R) {
    return out.set(Math.cos(a) * r, Math.sin(a) * r, 0);
  }

  function writeNucleus() {
    const L = LAYOUT[element];
    let ip = 0;
    let ine = 0;
    S.setScalar(R_NUCLEON * Math.max(1e-4, nucleusScale));
    L.pts.forEach((p, i) => {
      P.copy(p).multiplyScalar(nucleusScale);
      m.compose(P, qi, S);
      if (L.flags[i]) protons.setMatrixAt(ip++, m);
      else neutrons.setMatrixAt(ine++, m);
    });
    protons.count = ip;
    neutrons.count = ine;
    protons.instanceMatrix.needsUpdate = true;
    neutrons.instanceMatrix.needsUpdate = true;
  }
  function writeElectrons() {
    for (let i = 0; i < electronCount; i++) {
      S.setScalar(R_ELECTRON * Math.max(1e-4, eScale[i]));
      m.compose(ePos[i], qi, S);
      electrons.setMatrixAt(i, m);
    }
    electrons.count = electronCount;
    electrons.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < gapCount; i++) {
      S.setScalar(Math.max(1e-4, gapScale));
      m.compose(gapPos[i], qi, S);
      gaps.setMatrixAt(i, m);
    }
    gaps.count = gapCount;
    gaps.instanceMatrix.needsUpdate = true;
  }

  return {
    root,
    nucleus,
    protons,
    neutrons,
    electrons,
    rings,
    gaps,
    mats: { ...mats, ring: ringMat, gap: gapMat },
    LAYOUT,
    SLOTS,
    slotPoint,
    parkPoint,
    get element() {
      return element;
    },
    /** Which atom's nucleus is shown ('ar' | 'cl'). */
    setElement(id) {
      element = id;
    },
    /** The nucleus's radius now (cm). */
    nucleusRadius: () => LAYOUT[element].radius * nucleusScale,
    setNucleusScale(k) {
      nucleusScale = k;
    },
    /** Electron i at point p (the atom's plane, cm), drawn at scale k (0 hides it). */
    setElectron(i, p, k = 1) {
      ePos[i].copy(p);
      eScale[i] = k;
    },
    electronAt: (i) => ePos[i],
    electronScale: (i) => eScale[i],
    setElectronCount(n) {
      electronCount = n;
    },
    get electronCount() {
      return electronCount;
    },
    /** The empty places drawn (at most 3), at these points, at scale k. */
    setGaps(points, k = 1) {
      gapCount = Math.min(3, points.length);
      for (let i = 0; i < gapCount; i++) gapPos[i].copy(points[i]);
      gapScale = k;
    },
    /** Turn every ball (and empty place) to the viewer and write all instances: call before each frame. */
    commit(cameraQuaternion) {
      root.updateWorldMatrix(true, false);
      root.getWorldQuaternion(q);
      qi.copy(q).invert().multiply(cameraQuaternion);
      writeNucleus();
      writeElectrons();
    },
    /** A copy for the GLB: every ball in place, facing the front (+z). */
    exportCopy() {
      qi.identity();
      writeNucleus();
      writeElectrons();
      const g = root.clone(true);
      g.rotation.x = 0;
      // the GLB bakes every ball into the mesh: a lighter sphere keeps the file well under 1 MB
      g.traverse((ob) => {
        if (ob.isInstancedMesh && ob.geometry === ballGeo) ob.geometry = exportBall;
      });
      return g;
    },
  };
}
