// The things on the table, procedural three.js in metres: the setting (a calm deep-blue backdrop and a plain sand
// table top, as the chapter's other figures), two polished metal spheres on insulating stands (a clear acrylic post
// on a turned wooden base, as চিত্র ১০.০৪ draws them on wooden stands), the glass rod rubbed with silk, and for চিত্র
// ১০.০৫ a red plastic comb over a few bits of paper.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { R } from './reading.js';

export const BG = ['#0b2a5b', '#123d7a'];
/** Where things stand (m). The spheres' centres are SPHERE_Y above the table. */
export const SPHERE_Y = 0.188;
export const A_X = 0;
export const B_X = { park: 0.36, touch: 2 * R + 0.0006, apart: 2 * R + 0.08 };
/** From sphere A's centre toward the rod's tip (the rod comes from the left), and along the rod from its tip back. */
export const TOWARD_ROD = new THREE.Vector3(-1, 0.07, 0).normalize();
export const ROD_AXIS = new THREE.Vector3(-0.86, 0.47, 0.16).normalize();
export const ROD = { r: 0.0075, length: 0.26 };
/** The comb and the paper, to the right of the spheres. */
export const COMB_AT = new THREE.Vector3(0.54, 0, 0.07);
export const COMB_Y = { up: 0.095, down: 0.026 }; // its teeth's tips above the table

/** The backdrop: a vertical gradient (a small power-of-two canvas, made once). */
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

function roundedRect(x0, x1, y0, y1, r) {
  const s = new THREE.Shape();
  s.moveTo(x0 + r, y0);
  s.lineTo(x1 - r, y0);
  s.quadraticCurveTo(x1, y0, x1, y0 + r);
  s.lineTo(x1, y1 - r);
  s.quadraticCurveTo(x1, y1, x1 - r, y1);
  s.lineTo(x0 + r, y1);
  s.quadraticCurveTo(x0, y1, x0, y1 - r);
  s.lineTo(x0, y0 + r);
  s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}

/** A plain table top in light sand with a darker band round its edge (vertex colours, one draw), top at y = 0. */
export function createTable() {
  const slab = new THREE.ExtrudeGeometry(roundedRect(-0.3, 0.74, -0.2, 0.25, 0.05), {
    depth: 0.022,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 8,
  })
    .rotateX(Math.PI / 2)
    .translate(0, -0.004, 0);
  slab.clearGroups();
  const sand = new THREE.Color(0xbca27a);
  const band = new THREE.Color(0x8a724f);
  const n = slab.attributes.normal;
  const tint = new Float32Array(n.count * 3);
  for (let i = 0; i < n.count; i++) (n.getY(i) > 0.9 ? sand : band).toArray(tint, i * 3);
  slab.setAttribute('color', new THREE.BufferAttribute(tint, 3));
  const mesh = new THREE.Mesh(slab, new THREE.MeshStandardMaterial({ name: 'TableTop', vertexColors: true, roughness: 0.85, metalness: 0 }));
  mesh.name = 'Table';
  mesh.receiveShadow = true;
  mesh.userData.noExport = true;
  return mesh;
}

/** A turned wooden base: end grain rings and a few long streaks (a small canvas, made once). */
function woodTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#a8743f';
  ctx.fillRect(0, 0, 256, 256);
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 70; i++) {
    ctx.strokeStyle = `rgba(${90 + rnd() * 40}, ${52 + rnd() * 20}, 22, ${0.18 + rnd() * 0.22})`;
    ctx.lineWidth = 1 + rnd() * 2.5;
    ctx.beginPath();
    const y = rnd() * 256;
    ctx.moveTo(0, y);
    for (let x = 0; x <= 256; x += 32) ctx.lineTo(x, y + Math.sin(x * 0.03 + i) * 3 + (rnd() - 0.5) * 2);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** The materials the spheres, stands and rod share. */
export function createMaterials() {
  return {
    metal: new THREE.MeshStandardMaterial({ name: 'PolishedMetal', color: 0xdfe3e8, metalness: 1, roughness: 0.16 }),
    wood: new THREE.MeshStandardMaterial({ name: 'Wood', map: woodTexture(), roughness: 0.62, metalness: 0 }),
    acrylic: new THREE.MeshPhysicalMaterial({
      name: 'AcrylicPost',
      color: 0xe4f3ff,
      roughness: 0.08,
      metalness: 0,
      transparent: true,
      opacity: 0.55,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    }),
    collar: new THREE.MeshStandardMaterial({ name: 'Collar', color: 0x30353c, metalness: 0.3, roughness: 0.45 }),
    glass: new THREE.MeshPhysicalMaterial({
      name: 'GlassRod',
      color: 0xbfe4ff,
      roughness: 0.04,
      metalness: 0,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      side: THREE.DoubleSide,
    }),
    glassEdge: new THREE.MeshBasicMaterial({ name: 'GlassRodCore', color: 0x9fd2f5, transparent: true, opacity: 0.35, depthWrite: false }),
    comb: new THREE.MeshPhysicalMaterial({
      name: 'CombPlastic',
      color: 0xd3302a,
      roughness: 0.32,
      metalness: 0,
      clearcoat: 0.6,
      clearcoatRoughness: 0.3,
    }),
    paper: new THREE.MeshStandardMaterial({ name: 'Paper', color: 0xf7f5ee, roughness: 0.92, metalness: 0, side: THREE.DoubleSide }),
    hit: new THREE.MeshBasicMaterial({ visible: false }),
  };
}

/** A metal sphere on an insulating stand; `root` at the table under the sphere's centre. */
export function createSphere(name, mats, geo) {
  const root = new THREE.Group();
  root.name = name;
  const ball = new THREE.Mesh(geo.ball, mats.metal);
  ball.name = `${name}Ball`;
  ball.position.y = SPHERE_Y;
  ball.castShadow = true;
  const base = new THREE.Mesh(geo.base, mats.wood);
  base.name = `${name}Base`;
  base.castShadow = true;
  base.receiveShadow = true;
  const post = new THREE.Mesh(geo.post, mats.acrylic);
  post.name = `${name}Post`;
  post.castShadow = true;
  const collar = new THREE.Mesh(geo.collar, mats.collar);
  collar.name = `${name}Collar`;
  root.add(ball, base, post, collar);
  // an invisible, bigger target for a finger
  const hit = new THREE.Mesh(geo.hit, mats.hit);
  hit.position.y = SPHERE_Y;
  hit.userData.noExport = true;
  root.add(hit);
  return { root, ball, hit, centre: (out) => out.set(root.position.x, SPHERE_Y, root.position.z) };
}

/** Geometry the two spheres share. */
export function sphereGeometry() {
  const postTop = SPHERE_Y - R * 0.94;
  const baseProfile = [
    [0, 0],
    [0.046, 0],
    [0.049, 0.003],
    [0.049, 0.011],
    [0.044, 0.016],
    [0.016, 0.019],
    [0.011, 0.024],
    [0, 0.024],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  return {
    ball: new THREE.SphereGeometry(R, 64, 40),
    base: new THREE.LatheGeometry(baseProfile, 48),
    post: new THREE.CylinderGeometry(0.0062, 0.0068, postTop - 0.02, 24).translate(0, 0.02 + (postTop - 0.02) / 2, 0),
    collar: new THREE.CylinderGeometry(0.0105, 0.0085, 0.008, 24).translate(0, postTop - 0.002, 0),
    hit: new THREE.SphereGeometry(R * 1.18, 16, 12),
  };
}

/** The glass rod: a long rounded cylinder from its tip (root's origin) back along ROD_AXIS. */
export function createRod(mats) {
  const root = new THREE.Group();
  root.name = 'GlassRod';
  const up = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(up, ROD_AXIS);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(ROD.r, ROD.length - 2 * ROD.r, 6, 28), mats.glass);
  body.name = 'GlassRodBody';
  body.quaternion.copy(q);
  body.position.copy(ROD_AXIS).multiplyScalar(ROD.length / 2);
  body.castShadow = true;
  body.renderOrder = 4;
  // a faint core so the glass reads as a solid rod on the blue
  const core = new THREE.Mesh(new THREE.CylinderGeometry(ROD.r * 0.45, ROD.r * 0.45, ROD.length - 2 * ROD.r, 12), mats.glassEdge);
  core.quaternion.copy(q);
  core.position.copy(body.position);
  core.renderOrder = 3;
  core.userData.noExport = true;
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, ROD.length, 10), mats.hit);
  hit.quaternion.copy(q);
  hit.position.copy(body.position);
  hit.userData.noExport = true;
  root.add(body, core, hit);
  return { root, body, hit };
}

/** A red plastic comb: a rounded spine and teeth (one merged mesh); root at the middle of the teeth's tips. */
export function createComb(mats) {
  const L = 0.14;
  const spine = new THREE.ExtrudeGeometry(roundedRect(-L / 2, L / 2, 0.019, 0.034, 0.005), {
    depth: 0.0045,
    bevelEnabled: true,
    bevelThickness: 0.0008,
    bevelSize: 0.0008,
    bevelSegments: 2,
    curveSegments: 4,
  }).translate(0, 0, -0.00225);
  const parts = [spine];
  const n = 42;
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + 0.006 + (i * (L - 0.012)) / (n - 1);
    const fine = i > n * 0.45; // a coarse half and a fine half, as a real comb
    const tooth = new THREE.BoxGeometry(fine ? 0.0011 : 0.0016, 0.0205, 0.0034).translate(x, 0.0103, 0);
    parts.push(tooth.toNonIndexed());
  }
  const geo = mergeGeometries(
    parts
      .map((g) => (g.index ? g.toNonIndexed() : g))
      .map((g) => {
        for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
        return g;
      }),
  );
  const mesh = new THREE.Mesh(geo, mats.comb);
  mesh.name = 'Comb';
  mesh.castShadow = true;
  const root = new THREE.Group();
  root.name = 'CombRoot';
  root.add(mesh);
  root.rotation.set(0, -0.22, 0.07);
  return { root, mesh, length: L };
}

/** Bits of paper: one irregular shape, instanced, lying on the table. */
export function createPaper(mats, count) {
  const s = new THREE.Shape();
  const pts = [
    [-0.5, -0.38],
    [0.18, -0.5],
    [0.5, -0.1],
    [0.36, 0.42],
    [-0.12, 0.5],
    [-0.48, 0.12],
  ];
  s.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) s.lineTo(x, y);
  s.closePath();
  const geo = new THREE.ShapeGeometry(s).rotateX(-Math.PI / 2);
  const mesh = new THREE.InstancedMesh(geo, mats.paper, count);
  mesh.name = 'PaperBits';
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  return mesh;
}
