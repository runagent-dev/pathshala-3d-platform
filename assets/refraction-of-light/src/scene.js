// The setting and the apparatus, in centimetres. A calm deep-blue backdrop and a plain sand-coloured table top that sits
// in it; on the table only what the idea needs: a thick block of clear glass (or the same block as diamond, or a tank of
// water, or for the last step a tank of water with a thinner glass slab under it), and a small torch that rides a
// graduated aluminium arc whose centre is the point of incidence O, so it always shines at O and the arc reads θ₁.
// The glass is not `transmission` (that draws the whole scene twice): two transparent passes of one rounded box whose
// edges thicken and turn faintly green as the surface turns away from the eye, as a real block's do.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { APERTURE, ARC_R, BLOCK, O, SLAB, TOP } from './reading.js';

export const BG = ['#0b2a5b', '#123d7a'];
const rad = (d) => (d * Math.PI) / 180;

/** The backdrop: a vertical gradient (a small power-of-two canvas, made once), used as scene.background. */
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

/** A soft round glow (white in the middle), tinted by the material. */
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 1, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.3, 'rgba(255,255,255,0.45)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The soft foot of a clear thing on the table: faint. Nested boxes, so that it is soft on every browser. */
function footTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(30,22,10,0.035)';
  for (let i = 0; i < 14; i++) g.fillRect(i, i, 128 - 2 * i, 64 - 2 * i);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Glass-like: a little tint, the room's reflection, and more of both where the surface turns away from the eye. */
function clearMaterial(name, side, { color, base, rim, rimColor = [0.36, 0.8, 0.64], env = 1.5 }) {
  const m = new THREE.MeshStandardMaterial({
    name,
    color: new THREE.Color(...color),
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity: base,
    side,
    depthWrite: false,
    envMapIntensity: env,
  });
  const rc = rimColor.map((x) => x.toFixed(2)).join(', ');
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `#include <opaque_fragment>
      float rl_f = pow(1.0 - saturate(abs(dot(normalize(normal), normalize(vViewPosition)))), 2.4);
      gl_FragColor.rgb += vec3(${rc}) * rl_f * ${rim.toFixed(2)};
      gl_FragColor.a = clamp(gl_FragColor.a + rl_f * ${rim.toFixed(2)}, 0.0, 1.0);`,
    );
  };
  m.customProgramCacheKey = () => `rl-${rc}-${rim}`;
  return m;
}

/** The looks of the block: ordinary glass (green edges), diamond (cool, bright edges), the example's other medium. */
const LOOKS = {
  glass: { color: [0.8, 0.95, 0.92], base: 0.12, rim: 0.6, rimColor: [0.36, 0.8, 0.64] },
  diamond: { color: [0.86, 0.94, 1], base: 0.2, rim: 1.05, rimColor: [0.72, 0.9, 1], env: 3 },
  other: { color: [0.95, 0.9, 1], base: 0.14, rim: 0.6, rimColor: [0.7, 0.6, 0.92] },
};

function clearBox(name, geo, look) {
  const root = new THREE.Group();
  root.name = name;
  const inside = new THREE.Mesh(geo, clearMaterial(`${name}-inside`, THREE.BackSide, { ...look, base: look.base * 0.75, rim: look.rim * 0.7 }));
  inside.renderOrder = 1;
  const outside = new THREE.Mesh(geo, clearMaterial(name, THREE.FrontSide, look));
  outside.renderOrder = 2;
  root.add(inside, outside);
  return { root, inside, outside };
}

/** The tank: a clear box open at the top, walls and floor of thin glass (one mesh, two passes), water in it. */
function createTank() {
  const root = new THREE.Group();
  root.name = 'tank';
  const W = BLOCK.halfLength + 0.45;
  const D = BLOCK.halfDepth + 0.45;
  const H = TOP + 1.25;
  const w = 0.32;
  const parts = [
    [W * 2, 0.4, D * 2, 0, 0.2, 0], // floor
    [w, H, D * 2, -W + w / 2, H / 2, 0],
    [w, H, D * 2, W - w / 2, H / 2, 0],
    [W * 2 - 2 * w, H, w, 0, H / 2, -D + w / 2],
    [W * 2 - 2 * w, H, w, 0, H / 2, D - w / 2],
  ].map(([a, b, c, x, y, z]) => new RoundedBoxGeometry(a, b, c, 2, 0.08).translate(x, y, z));
  const glass = clearBox('tank-glass', mergeGeometries(parts), { ...LOOKS.glass, base: 0.1, rim: 0.5 });
  root.add(glass.root);
  // the water: a box from the floor to its level (scaled in y as it fills), its surface a little brighter
  const waterMat = new THREE.MeshStandardMaterial({
    name: 'water',
    color: 0x3f93d8,
    roughness: 0.1,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    envMapIntensity: 0.8,
  });
  const water = new THREE.Mesh(new THREE.BoxGeometry((W - w) * 2, 1, (D - w) * 2).translate(0, 0.5, 0), waterMat);
  water.position.y = 0.4;
  water.renderOrder = 3;
  const surfMat = new THREE.MeshStandardMaterial({
    name: 'water-surface',
    color: 0xbfe3ff,
    roughness: 0.05,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    envMapIntensity: 1.6,
  });
  const surface = new THREE.Mesh(new THREE.PlaneGeometry((W - w) * 2, (D - w) * 2).rotateX(-Math.PI / 2), surfMat);
  surface.renderOrder = 4;
  root.add(water, surface);
  return {
    root,
    water,
    surface,
    /** The water's level (cm above the table); 0.4 or less: empty. */
    level(y) {
      const h = Math.max(0, y - 0.4);
      water.visible = h > 0.02;
      surface.visible = water.visible;
      water.scale.y = Math.max(0.001, h);
      surface.position.y = 0.4 + h;
    },
  };
}

/** The arc's printed scale: ticks every 5°, numbers every 10° (0 at the top), on the band's face. Planar UVs. */
function scaleTexture(num, box) {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const px = (x) => ((x - box.x0) / (box.x1 - box.x0)) * S;
  const py = (y) => (1 - (y - box.y0) / (box.y1 - box.y0)) * S;
  const k = S / (box.x1 - box.x0); // px per cm
  g.clearRect(0, 0, S, S);
  g.strokeStyle = '#1d2733';
  g.fillStyle = '#1d2733';
  g.lineCap = 'butt';
  for (let a = 0; a <= 85; a += 1) {
    const long = a % 10 === 0;
    const mid = a % 5 === 0;
    const r1 = ARC_R + 0.58;
    const r0 = r1 - (long ? 0.42 : mid ? 0.3 : 0.18);
    const s = Math.sin(rad(a));
    const co = Math.cos(rad(a));
    g.lineWidth = (long ? 0.09 : 0.055) * k;
    g.beginPath();
    g.moveTo(px(O.x - r0 * s), py(O.y + r0 * co));
    g.lineTo(px(O.x - r1 * s), py(O.y + r1 * co));
    g.stroke();
    if (long) {
      const r = ARC_R - 0.26;
      g.save();
      g.translate(px(O.x - r * s), py(O.y + r * co));
      g.rotate(-rad(a));
      g.font = `700 ${0.6 * k}px "Noto Sans Bengali", sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(num(a), 0, 0);
      g.restore();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const v2 = (x, y) => new THREE.Vector2(x, y);

/** The torch: it shines along its local +Z from the slit in its cap, at the origin. */
function createTorch(glow) {
  const root = new THREE.Group();
  root.name = 'torch';
  const body = new THREE.MeshStandardMaterial({ name: 'torch-body', color: 0x2f4a6e, roughness: 0.34, metalness: 0.75 });
  const steel = new THREE.MeshStandardMaterial({ name: 'torch-steel', color: 0xc3c9d1, roughness: 0.28, metalness: 0.92 });
  const rubber = new THREE.MeshStandardMaterial({ name: 'torch-rubber', color: 0x16191d, roughness: 0.74 });
  const L = ARC_R - APERTURE + 3.6; // from the window back past the arc
  const shell = new THREE.LatheGeometry(
    [
      v2(0, -L),
      v2(0.55, -L),
      v2(0.62, -L + 0.12),
      v2(0.62, -L + 0.5),
      v2(0.56, -L + 0.56),
      v2(0.56, -2.6),
      v2(0.74, -1.7),
      v2(0.82, -0.9),
      v2(0.82, -0.25),
    ],
    28,
  );
  shell.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(shell, body);
  m.castShadow = true;
  root.add(m);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.09, 8, 28), steel);
  bezel.position.z = -0.2;
  root.add(bezel);
  const cap = new THREE.Mesh(new THREE.CircleGeometry(0.8, 28), rubber);
  cap.position.z = -0.14;
  root.add(cap);
  const slit = new THREE.Mesh(
    new THREE.CircleGeometry(0.17, 16),
    new THREE.MeshBasicMaterial({ name: 'torch-window', color: 0xffe9a8, toneMapped: false }),
  );
  slit.position.z = -0.12;
  root.add(slit);
  // the grip: fine rings, one object
  const rings = [];
  for (let z = -L + 1.1; z < -3.2; z += 0.3) rings.push(new THREE.TorusGeometry(0.57, 0.035, 5, 20).translate(0, 0, z));
  root.add(new THREE.Mesh(mergeGeometries(rings), steel));
  const button = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.2, 0.14, 14),
    new THREE.MeshStandardMaterial({ name: 'torch-button', color: 0xc92a2a, roughness: 0.5 }),
  );
  button.position.set(0, 0.6, -2.3);
  root.add(button);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glow,
      color: 0xffc95e,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  halo.scale.setScalar(2.4);
  halo.position.z = 0.05;
  halo.userData.noExport = true;
  root.add(halo);
  return { root, halo, slit };
}

/**
 * The rig: a heavy foot and a post at the far left, the graduated arc (centre O, radius 15 cm, 0° straight above O),
 * and the carriage that slides on it holding the torch, aimed at O.
 */
function createRig(num, glow) {
  const root = new THREE.Group();
  root.name = 'arc-stand';
  const alu = new THREE.MeshStandardMaterial({ name: 'anodised', color: 0xd9dee5, roughness: 0.42, metalness: 0.8 });
  const dark = new THREE.MeshStandardMaterial({ name: 'stand-dark', color: 0x2a2f36, roughness: 0.55, metalness: 0.4 });
  const ZB = -1.75; // the band's back face; its front is ZB + 0.5
  const R0 = ARC_R - 0.62;
  const R1 = ARC_R + 0.62;
  const A0 = -3;
  const A1 = 86;
  // the band: an annular sector, extruded
  const shape = new THREE.Shape();
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const a = rad(A0 + ((A1 - A0) * i) / N);
    const p = [O.x - R1 * Math.sin(a), O.y + R1 * Math.cos(a)];
    if (i === 0) shape.moveTo(...p);
    else shape.lineTo(...p);
  }
  for (let i = N; i >= 0; i--) {
    const a = rad(A0 + ((A1 - A0) * i) / N);
    shape.lineTo(O.x - R0 * Math.sin(a), O.y + R0 * Math.cos(a));
  }
  const band = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1, curveSegments: 4 }),
    alu,
  );
  band.position.z = ZB;
  band.castShadow = true;
  root.add(band);
  // the printed scale on its face
  const box = { x0: O.x - R1 - 0.2, x1: O.x + 1.2, y0: O.y - 1.6, y1: O.y + R1 + 0.2 };
  const ring = new THREE.RingGeometry(R0 + 0.02, R1 - 0.02, 64, 1, Math.PI / 2 + rad(A0 + 1), rad(A1 - A0 - 2));
  const uv = ring.attributes.uv;
  const pos = ring.attributes.position;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + O.x - box.x0) / (box.x1 - box.x0), (pos.getY(i) + O.y - box.y0) / (box.y1 - box.y0));
  const face = new THREE.Mesh(
    ring,
    new THREE.MeshStandardMaterial({
      name: 'arc-scale',
      map: scaleTexture(num, box),
      transparent: true,
      roughness: 0.6,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  );
  face.position.set(O.x, O.y, ZB + 0.56);
  face.userData.noExport = true;
  root.add(face);
  // the post and the foot, at the low end of the arc
  const endA = rad(A1);
  const ex = O.x - ARC_R * Math.sin(endA);
  const ey = O.y + ARC_R * Math.cos(endA);
  const px = ex - 1.6;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, ey + 0.8, 20).translate(0, (ey + 0.8) / 2, 0), alu);
  post.position.set(px, 0, ZB + 0.25);
  post.castShadow = true;
  const clamp = new THREE.Mesh(new RoundedBoxGeometry(2.6, 1.6, 1.4, 2, 0.2), dark);
  clamp.position.set(px + 0.7, ey + 0.1, ZB + 0.25);
  clamp.castShadow = true;
  const foot = new THREE.Mesh(new RoundedBoxGeometry(6, 1, 6.5, 2, 0.3), dark);
  foot.position.set(px, 0.5, ZB + 0.25);
  foot.castShadow = true;
  foot.receiveShadow = true;
  root.add(post, clamp, foot);
  // the carriage: slides along the band, holds the torch in the plane of the rays (z = 0)
  const carriage = new THREE.Group();
  carriage.name = 'carriage';
  const shoe = new THREE.Mesh(new RoundedBoxGeometry(2.4, 2.2, 1.3, 2, 0.22), dark);
  shoe.position.set(0, 0, ZB + 0.25 - 0.1);
  shoe.castShadow = true;
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.6, 18).rotateX(Math.PI / 2), alu);
  knob.position.set(0, 0, ZB - 0.75);
  carriage.add(shoe, knob);
  root.add(carriage);
  const torch = createTorch(glow);
  root.add(torch.root);
  const q = new THREE.Vector3();
  const target = new THREE.Vector3(O.x, O.y, O.z);
  return {
    root,
    torch,
    /** The torch at angle a (degrees from the vertical through O), aimed at O. */
    place(a) {
      const s = Math.sin(rad(a));
      const c = Math.cos(rad(a));
      carriage.position.set(O.x - ARC_R * s, O.y + ARC_R * c, 0);
      carriage.rotation.z = rad(a);
      torch.root.position.set(O.x - APERTURE * s, O.y + APERTURE * c, 0);
      torch.root.lookAt(q.copy(target));
    },
  };
}

/** The upright plane of চিত্র ৯.০১ through the ray and the normal: a soft sheet in z = 0, faint lines at its edge. */
function sheetTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(235,245,255,0.18)');
  grad.addColorStop(0.62, 'rgba(235,245,255,0.34)');
  grad.addColorStop(1, 'rgba(235,245,255,0.12)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(255,255,255,0.85)';
  g.lineWidth = 4;
  g.strokeRect(2, 2, 252, 252);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export const SHEET = { x0: -12.5, x1: 11.5, y0: 1.2, y1: 19.5 };

export function createSetting({ stage, shadow, num }) {
  const { scene, renderer } = stage;
  const glow = glowTexture();

  // the table: a plain rounded slab, light sand, a darker edge
  const tableRoot = new THREE.Group();
  tableRoot.name = 'table';
  tableRoot.userData.noExport = true;
  const slab = new THREE.Mesh(
    new RoundedBoxGeometry(56, 2, 34, 3, 0.6),
    new THREE.MeshStandardMaterial({ name: 'TableTop', color: 0xbca27a, roughness: 0.85, metalness: 0 }),
  );
  slab.position.set(-4, -1, 0);
  slab.receiveShadow = true;
  tableRoot.add(slab);
  scene.add(tableRoot);

  const footMat = new THREE.MeshBasicMaterial({ map: footTexture(), transparent: true, depthWrite: false, toneMapped: false });
  const foot = new THREE.Mesh(new THREE.PlaneGeometry(BLOCK.halfLength * 2.5, BLOCK.halfDepth * 3), footMat);
  foot.rotation.x = -Math.PI / 2;
  foot.position.y = 0.01;
  foot.userData.noExport = true;
  scene.add(foot);

  const apparatus = new THREE.Group();
  apparatus.name = 'refraction-apparatus';
  scene.add(apparatus);

  // the media: the block (three looks), the tank of water, the slab for the last step
  const geo = new RoundedBoxGeometry(BLOCK.halfLength * 2, BLOCK.height, BLOCK.halfDepth * 2, 3, 0.22);
  const blocks = {};
  for (const [id, look] of Object.entries(LOOKS)) {
    const b = clearBox(`block-${id}`, geo, look);
    b.root.position.y = BLOCK.height / 2 + 0.03;
    b.root.visible = false;
    blocks[id] = b;
    apparatus.add(b.root);
  }
  const slabGeo = new RoundedBoxGeometry(BLOCK.halfLength * 2 - 1, SLAB - 0.42, BLOCK.halfDepth * 2 - 0.8, 3, 0.2);
  // the slab under the water: a clearer green than the water's blue, with strong edges, so the two read apart
  const slabBox = clearBox('slab', slabGeo, { color: [0.62, 0.95, 0.78], base: 0.3, rim: 1.25, rimColor: [0.3, 0.85, 0.55] });
  slabBox.root.position.y = 0.41 + (SLAB - 0.42) / 2;
  slabBox.root.visible = false;
  const tank = createTank();
  tank.root.visible = false;
  apparatus.add(tank.root, slabBox.root);

  const rig = createRig(num, glow);
  apparatus.add(rig.root);

  // the plane of চিত্র ৯.০১ (not exported)
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(SHEET.x1 - SHEET.x0, SHEET.y1 - SHEET.y0).translate((SHEET.x0 + SHEET.x1) / 2, (SHEET.y0 + SHEET.y1) / 2, 0),
    new THREE.MeshBasicMaterial({
      name: 'plane-sheet',
      map: sheetTexture(),
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  sheet.renderOrder = 6;
  sheet.visible = false;
  sheet.userData.noExport = true;
  scene.add(sheet);

  // where the light comes to the bottom: a small warm glow
  const landing = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 1.8).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      map: glow,
      color: 0xffc95e,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  landing.renderOrder = 7;
  landing.visible = false;
  landing.userData.noExport = true;
  scene.add(landing);

  // a big invisible target for a finger: the torch
  const hit = new THREE.Mesh(new THREE.SphereGeometry(2.6, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.noExport = true;
  scene.add(hit);

  // the lights
  const key = new THREE.DirectionalLight(0xfff3e4, 2.2);
  key.position.set(14, 46, 30);
  key.target.position.set(-4, 0, 0);
  scene.add(key, key.target);
  if (shadow) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0008;
    key.shadow.normalBias = 0.04;
    key.shadow.radius = 4;
    Object.assign(key.shadow.camera, { left: -24, right: 16, top: 16, bottom: -16, near: 30, far: 80 });
  }
  scene.add(new THREE.HemisphereLight(0xdde8f8, 0x5a4a36, 1.15));
  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.55);
  fill.position.set(-30, 20, 24);
  scene.add(fill);

  const hp = new THREE.Vector3();
  return {
    apparatus,
    rig,
    blocks,
    slab: slabBox,
    tank,
    sheet,
    hit,
    foot,
    /** Which media show: look ('glass' | 'diamond' | 'other' | 'water' | 'relative'), with the water's level. */
    show(look, level = TOP) {
      for (const [id, b] of Object.entries(blocks)) b.root.visible = id === look;
      tank.root.visible = look === 'water' || look === 'relative';
      slabBox.root.visible = look === 'relative';
      tank.level(look === 'water' ? TOP : look === 'relative' ? level : 0);
    },
    place(a) {
      rig.place(a);
      rig.torch.root.getWorldPosition(hp);
      hit.position.copy(hp);
    },
    /** The glow where the light ends; k its strength. */
    landing(p, k) {
      landing.visible = k > 0.01 && p != null;
      if (!landing.visible) return;
      landing.position.set(p.x, p.y + 0.04, p.z);
      landing.material.opacity = 0.85 * k;
    },
    /** The torch's light on or off (the halo). */
    lamp(on) {
      rig.torch.halo.visible = on;
      rig.torch.slit.material.color.set(on ? 0xffe9a8 : 0x6b6455);
    },
    sheetOpacity(k) {
      sheet.visible = k > 0.01;
      sheet.material.opacity = k;
    },
    later: [sheet, landing, tank.root, slabBox.root, blocks.diamond.root, blocks.other.root],
  };
}
