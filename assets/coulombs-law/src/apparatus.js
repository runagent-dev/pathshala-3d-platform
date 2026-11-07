// The apparatus: polished metal spheres on clear acrylic rods (insulating stands) on heavy round bases, each base with a
// dark index line reaching the metre rule, so where a charge stands is read off the scale. A sphere's charge is its
// colour (positive red #e03131, negative blue #1971c2, none: plain steel) and always its sign: a white "+" or "−" that
// faces the camera, so colour is never the only cue. All in metres; the bench top is y = 0, the spheres' centres at H.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RULE } from './setting.js';

/** The centres' height above the bench (m), and the spheres' radii (m): the pair (small, as the book's বিন্দু চার্জ, so the
 *  force arrows fit between them at 10 cm), the third (the book's +q in step ⑤). In step ⑤ the pair grows to END_K × R. */
export const H = 0.15;
export const R_BIG = 0.02;
export const R_SMALL = 0.04;
export const END_K = 3;
const BASE_R = 0.034;
const BASE_H = 0.02;
const ROD_R = 0.0055;

export const CHARGE_COLORS = { pos: '#e03131', neg: '#1971c2' };

/** The two signs, drawn once (not text: the font is not needed for "+" and "−"): white with a thin dark edge. */
function signTexture(plus) {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  const bar = (x, y, w, h) => {
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
  };
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

export function createApparatus() {
  const mats = {
    steel: new THREE.MeshStandardMaterial({ name: 'SphereSteel', color: '#d5dbe2', metalness: 1, roughness: 0.2 }),
    pos: new THREE.MeshStandardMaterial({ name: 'SpherePositive', color: CHARGE_COLORS.pos, metalness: 0.55, roughness: 0.26 }),
    neg: new THREE.MeshStandardMaterial({ name: 'SphereNegative', color: CHARGE_COLORS.neg, metalness: 0.55, roughness: 0.26 }),
    base: new THREE.MeshStandardMaterial({ name: 'BaseIron', color: '#2b3038', metalness: 0.45, roughness: 0.42 }),
    collar: new THREE.MeshStandardMaterial({ name: 'Collar', color: '#b9c0c8', metalness: 1, roughness: 0.3 }),
    rod: new THREE.MeshPhysicalMaterial({
      name: 'AcrylicRod',
      color: '#cfe9ff',
      metalness: 0,
      roughness: 0.05,
      transparent: true,
      opacity: 0.42,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    }),
    index: new THREE.MeshBasicMaterial({ name: 'IndexLine', color: '#1d2733' }),
    hit: new THREE.MeshBasicMaterial({ visible: false }),
  };
  const signMats = {
    plus: new THREE.MeshBasicMaterial({ name: 'SignPlus', map: signTexture(true), transparent: true, depthWrite: false, toneMapped: false }),
    minus: new THREE.MeshBasicMaterial({ name: 'SignMinus', map: signTexture(false), transparent: true, depthWrite: false, toneMapped: false }),
  };

  // shared geometry
  const baseGeo = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(BASE_R, 0),
      new THREE.Vector2(BASE_R + 0.0015, 0.003),
      new THREE.Vector2(BASE_R, 0.006),
      new THREE.Vector2(BASE_R * 0.86, BASE_H * 0.82),
      new THREE.Vector2(BASE_R * 0.66, BASE_H),
      new THREE.Vector2(ROD_R * 2.2, BASE_H + 0.002),
      new THREE.Vector2(0, BASE_H + 0.002),
    ],
    40,
  );
  // the ferrule at the foot of the rod and the collar under the sphere: one mesh (one draw) per stand
  const ferruleGeo = new THREE.CylinderGeometry(ROD_R * 1.7, ROD_R * 1.9, 0.012, 20);
  const collarFor = (R) => {
    const c = new THREE.CylinderGeometry(ROD_R * 1.25, ROD_R * 1.6, 0.008, 20).translate(0, H - R - 0.001, 0);
    return mergeGeometries([ferruleGeo.clone().translate(0, BASE_H + 0.006, 0), c]);
  };
  const bigGeo = new THREE.SphereGeometry(R_BIG, 40, 28);
  const smallGeo = new THREE.SphereGeometry(R_SMALL, 40, 28);
  const signGeo = new THREE.PlaneGeometry(1, 1);
  // the index line: from the base's front edge to just over the rule's back edge
  const ruleBack = RULE.z - RULE.width / 2;
  const indexLen = ruleBack + 0.006 - (BASE_R - 0.004);
  const indexGeo = new THREE.BoxGeometry(0.0026, 0.0016, indexLen);
  const hitGeo = new THREE.CylinderGeometry(0.05, 0.05, H + 0.06, 12);

  /** One charge on its stand. `big`: the pair's sphere (else the small third one). */
  function makeStand(name, big) {
    const R = big ? R_BIG : R_SMALL;
    const root = new THREE.Group();
    root.name = name;
    const base = new THREE.Mesh(baseGeo, mats.base);
    base.castShadow = true;
    base.receiveShadow = true;
    const rodLen = H - R - BASE_H + 0.002;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(ROD_R, ROD_R, rodLen, 20), mats.rod);
    rod.position.y = BASE_H + rodLen / 2;
    rod.castShadow = true;
    const collar = new THREE.Mesh(collarFor(R), mats.collar);
    const sphere = new THREE.Mesh(big ? bigGeo : smallGeo, mats.steel);
    sphere.name = `${name}Sphere`;
    sphere.position.y = H;
    sphere.castShadow = true;
    const index = new THREE.Mesh(indexGeo, mats.index);
    index.position.set(0, RULE.thick + 0.0012, BASE_R - 0.004 + indexLen / 2);
    index.userData.noExport = true;
    const sign = new THREE.Mesh(signGeo, signMats.plus);
    sign.name = `${name}Sign`;
    sign.scale.setScalar(R * 1.05);
    sign.visible = false;
    sign.renderOrder = 3;
    sign.userData.noExport = true;
    const hit = new THREE.Mesh(hitGeo, mats.hit);
    hit.position.y = (H + 0.06) / 2;
    hit.userData.noExport = true;
    root.add(base, rod, collar, sphere, index, sign, hit);
    let q = 0;
    let k = 1;
    const toCam = new THREE.Vector3();
    const centre = new THREE.Vector3();
    return {
      root,
      sphere,
      hit,
      R,
      /** The sphere's radius now (m). */
      get radius() {
        return R * k * root.scale.x;
      },
      /** Grows the sphere (not the stand): k = 1 is its own size. */
      setSize(size) {
        k = size;
        sphere.scale.setScalar(k);
        sign.scale.setScalar(R * k * 1.05);
      },
      get q() {
        return q;
      },
      /** The charge (C): its colour and its sign. */
      setCharge(value) {
        q = value;
        sphere.material = q > 0 ? mats.pos : q < 0 ? mats.neg : mats.steel;
        sign.visible = q !== 0;
        sign.material = q > 0 ? signMats.plus : signMats.minus;
      },
      /** Turns the sign to the camera, on the sphere's near face. */
      faceCamera(camera) {
        if (!sign.visible) return;
        sphere.getWorldPosition(centre);
        toCam.copy(camera.position).sub(centre).normalize();
        sign.position.set(0, H, 0).addScaledVector(toCam, R * k * 1.02);
        sign.quaternion.copy(camera.quaternion);
      },
      setX(x) {
        root.position.x = x;
      },
    };
  }

  const one = makeStand('ChargeOne', true);
  const two = makeStand('ChargeTwo', true);
  const third = makeStand('ChargeThird', false);
  return { one, two, third, mats };
}
