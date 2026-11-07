// The setting and the apparatus, as in the sister figure coulombs-law: a calm deep-blue backdrop, a plain bench top in a
// light sand colour sitting in the blue, polished metal spheres on clear acrylic rods (insulating stands) on heavy
// round bases. A sphere's charge is its colour (positive red #e03131, negative blue #1971c2, none: plain steel) AND its
// sign, a white "+" or "−" that faces the camera, so colour is never the only cue. The test charge q₀ is a small red
// bead with its own "+" on a thin acrylic stand. All in metres; the bench top is y = 0.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { H, R } from './field.js';

export const BG = ['#0b2a5b', '#123d7a'];
export const CHARGE_COLORS = { pos: '#e03131', neg: '#1971c2' };
export const BENCH = { x0: -0.42, x1: 0.42, z0: -0.2, z1: 0.2, thick: 0.035 };
export const R_TEST = 0.0085;
const BASE_R = 0.03;
const BASE_H = 0.018;
const ROD_R = 0.005;

/** The backdrop: a vertical gradient, light at the bottom (a power-of-two canvas, made once). */
export function backdrop() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, BG[0]);
  g.addColorStop(1, BG[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** "+" or "−", white with a thin dark edge, drawn once (no font needed). */
function signTexture(plus) {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const bar = (x, y, w, h) => ctx.fillRect(x - w / 2, y - h / 2, w, h);
  const draw = (pad) => {
    bar(S / 2, S / 2, S * 0.7 + pad, S * 0.18 + pad);
    if (plus) bar(S / 2, S / 2, S * 0.18 + pad, S * 0.7 + pad);
  };
  ctx.fillStyle = 'rgba(16, 24, 38, 0.55)';
  draw(10);
  ctx.fillStyle = '#ffffff';
  draw(0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSetting() {
  const root = new THREE.Group();
  root.name = 'Bench';
  root.userData.noExport = true;
  const w = BENCH.x1 - BENCH.x0;
  const d = BENCH.z1 - BENCH.z0;
  const top = new THREE.Mesh(
    new RoundedBoxGeometry(w, BENCH.thick, d, 2, 0.008),
    new THREE.MeshStandardMaterial({ name: 'BenchTop', color: '#c9b591', roughness: 0.82, metalness: 0 }),
  );
  top.position.set((BENCH.x0 + BENCH.x1) / 2, -BENCH.thick / 2, (BENCH.z0 + BENCH.z1) / 2);
  top.receiveShadow = true;
  root.add(top);
  return { root };
}

/** The book's flat picture: a faint sheet in the plane z = 0, with a thin edge (shown in the "সমতলে" view). */
export function createSheet() {
  const W = 0.62;
  const Ht = 0.32;
  const mat = new THREE.MeshBasicMaterial({
    name: 'Sheet',
    color: '#e9f1ff',
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(W, Ht), mat);
  sheet.position.set(0, 0.003 + Ht / 2, 0);
  sheet.renderOrder = 1;
  const edgeMat = new THREE.LineBasicMaterial({ name: 'SheetEdge', color: '#cfe0ff', transparent: true, opacity: 0.55 });
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(W, Ht)), edgeMat);
  sheet.add(edge);
  sheet.userData.noExport = true;
  sheet.visible = false;
  return {
    root: sheet,
    setOpacity(a) {
      mat.opacity = 0.1 * a;
      edgeMat.opacity = 0.55 * a;
      sheet.visible = a > 0.01;
    },
  };
}

export function createApparatus() {
  const mats = {
    steel: new THREE.MeshStandardMaterial({ name: 'SphereSteel', color: '#d5dbe2', metalness: 1, roughness: 0.2 }),
    pos: new THREE.MeshStandardMaterial({ name: 'SpherePositive', color: CHARGE_COLORS.pos, metalness: 0.55, roughness: 0.26 }),
    neg: new THREE.MeshStandardMaterial({ name: 'SphereNegative', color: CHARGE_COLORS.neg, metalness: 0.55, roughness: 0.26 }),
    base: new THREE.MeshStandardMaterial({ name: 'BaseIron', color: '#2b3038', metalness: 0.45, roughness: 0.42 }),
    collar: new THREE.MeshStandardMaterial({ name: 'Collar', color: '#b9c0c8', metalness: 1, roughness: 0.3 }),
    rod: new THREE.MeshStandardMaterial({ name: 'AcrylicRod', color: '#cfe9ff', metalness: 0, roughness: 0.08, transparent: true, opacity: 0.45 }),
    hit: new THREE.MeshBasicMaterial({ visible: false }),
  };
  const signMats = {
    plus: new THREE.MeshBasicMaterial({ name: 'SignPlus', map: signTexture(true), transparent: true, depthWrite: false, toneMapped: false }),
    minus: new THREE.MeshBasicMaterial({ name: 'SignMinus', map: signTexture(false), transparent: true, depthWrite: false, toneMapped: false }),
  };
  const baseProfile = (r, h, rod) => [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(r, 0),
    new THREE.Vector2(r + 0.0015, 0.003),
    new THREE.Vector2(r, 0.006),
    new THREE.Vector2(r * 0.86, h * 0.82),
    new THREE.Vector2(r * 0.66, h),
    new THREE.Vector2(rod * 2.2, h + 0.002),
    new THREE.Vector2(0, h + 0.002),
  ];
  const baseGeo = new THREE.LatheGeometry(baseProfile(BASE_R, BASE_H, ROD_R), 40);
  const smallBaseGeo = new THREE.LatheGeometry(baseProfile(0.014, 0.01, 0.0022), 28);
  const signGeo = new THREE.PlaneGeometry(1, 1);
  const sphereGeo = new THREE.SphereGeometry(R, 48, 32);
  const beadGeo = new THREE.SphereGeometry(R_TEST, 28, 18);

  /** One stand: base, rod, collar, sphere, sign; `r` the ball's radius. */
  function makeStand(name, { r, geo, base, baseH, rodR, hitR }) {
    const root = new THREE.Group();
    root.name = name;
    const b = new THREE.Mesh(base, mats.base);
    b.castShadow = true;
    b.receiveShadow = true;
    const rodLen = H - r - baseH + 0.002;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(rodR, rodR, rodLen, 16), mats.rod);
    rod.position.y = baseH + rodLen / 2;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(rodR * 1.25, rodR * 1.6, 0.007, 20), mats.collar);
    collar.position.y = H - r - 0.001;
    const ball = new THREE.Mesh(geo, mats.steel);
    ball.name = `${name}Ball`;
    ball.position.y = H;
    ball.castShadow = true;
    const sign = new THREE.Mesh(signGeo, signMats.plus);
    sign.name = `${name}Sign`;
    sign.scale.setScalar(r * 1.1);
    sign.visible = false;
    sign.renderOrder = 3;
    sign.userData.noExport = true;
    const hit = new THREE.Mesh(new THREE.SphereGeometry(hitR, 12, 8), mats.hit);
    hit.position.y = H;
    hit.userData.noExport = true;
    root.add(b, rod, collar, ball, sign, hit);
    let q = 0;
    const toCam = new THREE.Vector3();
    const centre = new THREE.Vector3();
    return {
      root,
      ball,
      hit,
      r,
      get q() {
        return q;
      },
      /** The charge: + (red, "+"), − (blue, "−") or 0 (steel, no sign). `hidden`: steel with no sign (a question). */
      setCharge(value, { hidden = false } = {}) {
        q = value;
        ball.material = hidden || !q ? mats.steel : q > 0 ? mats.pos : mats.neg;
        sign.visible = !hidden && q !== 0;
        sign.material = q > 0 ? signMats.plus : signMats.minus;
      },
      /** The sign turned to the camera, on the ball's near face. */
      faceCamera(camera) {
        if (!sign.visible) return;
        ball.getWorldPosition(centre);
        toCam.copy(camera.position).sub(centre).normalize();
        sign.position.set(0, H, 0).addScaledVector(toCam, r * 1.3); // proud of the ball: the lines' roots pass behind it
        sign.quaternion.copy(camera.quaternion);
      },
    };
  }

  const a = makeStand('ChargeA', { r: R, geo: sphereGeo, base: baseGeo, baseH: BASE_H, rodR: ROD_R, hitR: R * 1.6 });
  const b = makeStand('ChargeB', { r: R, geo: sphereGeo, base: baseGeo, baseH: BASE_H, rodR: ROD_R, hitR: R * 1.6 });
  const test = makeStand('TestCharge', { r: R_TEST, geo: beadGeo, base: smallBaseGeo, baseH: 0.01, rodR: 0.0022, hitR: 0.022 });
  test.setCharge(1);
  return { a, b, test, mats };
}
