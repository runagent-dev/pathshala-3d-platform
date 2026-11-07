// The bodies brought to the disc (mm): a glass rod (কাচ দণ্ড) and the silk it is rubbed with, a plastic comb (চিরুনি)
// and its flannel, and, for the test, a grey rod of unknown charge. Each is built in its own frame: the tip at the
// origin, the body along +x, "up" along +y; the figure places it on the line it comes in along. A cloth is a crumpled
// sleeve round the body that slides along it while rubbing.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { edgeGlass } from './electroscope.js';

export const GLASS_ROD = { r: 6.5, len: 230 };
export const COMB = { len: 132, spine: 11, teeth: 17, thick: 3.4, n: 30 };
/** Where the charges sit on each body (mm from the tip along it): seven, close to the tip. */
export const CHARGE_AT = [10, 23, 36, 49, 62, 75, 88];

function capsule(r, len) {
  const g = new THREE.CapsuleGeometry(r, len - 2 * r, 6, 24);
  g.rotateZ(-Math.PI / 2); // along +x
  g.translate(len / 2, 0, 0);
  return g;
}

function combGeometry() {
  const { len, spine, teeth, thick, n } = COMB;
  const parts = [];
  const body = new THREE.BoxGeometry(len, spine, thick, 1, 1, 1);
  body.translate(len / 2, spine / 2 - 1, 0);
  parts.push(body.toNonIndexed());
  // a rounded back edge
  const back = new THREE.CylinderGeometry(thick / 2, thick / 2, len, 8, 1);
  back.rotateZ(Math.PI / 2);
  back.translate(len / 2, spine - 1, 0);
  parts.push(back.toNonIndexed());
  // teeth, a little thinner than the spine, the first few finer
  const pitch = (len - 8) / n;
  for (let i = 0; i < n; i++) {
    const w = pitch * 0.55;
    const h = teeth * (i < 3 ? 0.86 : 1);
    const t = new THREE.BoxGeometry(w, h, thick * 0.82);
    t.translate(4 + pitch * (i + 0.5), -1 - h / 2, 0);
    parts.push(t.toNonIndexed());
  }
  return mergeGeometries(parts);
}

/** A crumpled cloth sleeve, about `len` long, round a body of half-size (ry, rz) in its cross-section. */
function sleeveGeometry(len, ry, rz, seed0) {
  const g = new THREE.CylinderGeometry(1, 1, len, 28, 8, true, 0.35, Math.PI * 2 - 0.7);
  g.rotateZ(-Math.PI / 2);
  const pos = g.attributes.position;
  let seed = seed0;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647 - 0.5;
  };
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const a = Math.atan2(z, y);
    const fold = 1 + 0.16 * Math.sin(a * 5 + x * 0.25) + 0.1 * Math.sin(x * 0.5 + a * 2) + rnd() * 0.08;
    const flare = 1 + 0.25 * (Math.abs(x) / (len / 2)) ** 3;
    pos.setXYZ(i, x + rnd() * 0.8, y * ry * fold * flare, z * rz * fold * flare);
  }
  g.computeVertexNormals();
  return g;
}

function flannelTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#9c2f2f';
  g.fillRect(0, 0, 128, 128);
  g.globalAlpha = 0.45;
  g.fillStyle = '#4a1414';
  for (let i = 0; i < 128; i += 32) {
    g.fillRect(i, 0, 10, 128);
    g.fillRect(0, i, 128, 10);
  }
  g.globalAlpha = 0.3;
  g.fillStyle = '#e8b4a0';
  for (let i = 16; i < 128; i += 32) {
    g.fillRect(i, 0, 3, 128);
    g.fillRect(0, i, 128, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.5, 1);
  return tex;
}

/**
 * The three bodies and two cloths. Each body: { root (placed by the figure), charges: local points of its seven
 * charges, cloth: { mesh, along } | null, hit: the mesh to pick }.
 */
export function createBodies() {
  // glass: clear with a faint blue-green edge; its ends a little greener
  const glassMat = edgeGlass('GlassRod', { color: '#dff1fb', edge: '#a9dcea', face: 0.3, rim: 0.86 });
  const rodGeo = capsule(GLASS_ROD.r, GLASS_ROD.len);
  const glassRod = new THREE.Mesh(rodGeo, glassMat);
  glassRod.name = 'GlassRod';
  glassRod.renderOrder = 10;

  const combMat = new THREE.MeshPhysicalMaterial({
    name: 'CombPlastic',
    color: '#30343c',
    roughness: 0.32,
    metalness: 0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.3,
  });
  const comb = new THREE.Mesh(combGeometry(), combMat);
  comb.name = 'Comb';
  comb.castShadow = true;

  const unknownMat = new THREE.MeshPhysicalMaterial({ name: 'UnknownRod', color: '#7b8591', roughness: 0.45, metalness: 0, clearcoat: 0.3 });
  const unknown = new THREE.Mesh(capsule(GLASS_ROD.r, GLASS_ROD.len * 0.9), unknownMat);
  unknown.name = 'UnknownRod';
  unknown.castShadow = true;

  const silkMat = new THREE.MeshPhysicalMaterial({
    name: 'Silk',
    color: '#f3e7c9',
    roughness: 0.42,
    sheen: 1,
    sheenColor: new THREE.Color('#fff6e0'),
    sheenRoughness: 0.35,
    side: THREE.DoubleSide,
  });
  const silk = new THREE.Mesh(sleeveGeometry(44, GLASS_ROD.r + 2.2, GLASS_ROD.r + 2.2, 3), silkMat);
  silk.name = 'Silk';
  silk.castShadow = true;
  const flannelMat = new THREE.MeshStandardMaterial({ name: 'Flannel', map: flannelTexture(), roughness: 0.95, side: THREE.DoubleSide });
  const flannel = new THREE.Mesh(sleeveGeometry(44, (COMB.spine + COMB.teeth) / 2 + 2.5, COMB.thick / 2 + 2.6, 5), flannelMat);
  flannel.position.y = (COMB.spine - COMB.teeth) / 2 - 1;
  flannel.name = 'Flannel';
  flannel.castShadow = true;

  const make = (name, mesh, cloth, chargeY) => {
    const root = new THREE.Group();
    root.name = name;
    root.add(mesh);
    if (cloth) {
      cloth.visible = false;
      root.add(cloth);
    }
    root.visible = false;
    const charges = CHARGE_AT.map((x) => new THREE.Vector3(x, chargeY, 0));
    return { root, mesh, cloth, charges };
  };
  return {
    glass: make('GlassRodBody', glassRod, silk, 0),
    comb: make('CombBody', comb, flannel, COMB.spine / 2 - 1),
    unknown: make('UnknownBody', unknown, null, 0),
    materials: { glassMat, combMat, unknownMat, silkMat, flannelMat },
  };
}
