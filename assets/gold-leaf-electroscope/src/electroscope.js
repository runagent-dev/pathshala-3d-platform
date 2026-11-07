// The gold-leaf electroscope (book page 278, চিত্র ১০.০৮), in millimetres, the table top at y = 0: a clear squat glass
// bottle with a slight green-blue tint, a reddish insulating stopper (অপরিবাহী ছিপি) in its neck, a brass conducting
// rod (সুপরিবাহী দণ্ড) through the stopper, a thick copper disc (ধাতব চাকতি) on top, and at the rod's foot a flat brass
// plate with one gold leaf (সোনার পাত) on each face, as in a real instrument: each leaf turns about its top edge, away
// from the plate, fan-shaped as in the book. The plate is turned about 45° from the view, so the opening shows and both
// leaves' faces do, at every gap.
// Also the places where charges sit (slots): three in a row on the disc, three down each leaf, and room for extras.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Sizes (mm). */
export const JAR = { r: 58, body: 104, neckR: 23, neckY: 128, top: 142, wall: 2.6, base: 6 };
export const STOPPER = { bottom: 130, top: 155, rBottom: JAR.neckR - JAR.wall, rTop: 25 };
export const ROD = { r: 3.4, bottom: 104, top: 182 };
export const DISC = { r: 40, y: 182, h: 7 };
export const LEAF = { hinge: 100, len: 80, wTop: 14, wBot: 34 };
/** The leaves' plate, turned about y: its faces look along `SWING` (the way the right leaf opens), `ACROSS` lies along it. */
const TURN = Math.PI / 2 - 0.39;
export const SWING = new THREE.Vector3(Math.sin(TURN), 0, Math.cos(TURN));
export const ACROSS = new THREE.Vector3(Math.cos(TURN), 0, -Math.sin(TURN));
/** The disc's charges are laid out across the opening view (`ROW`, to the right) and toward it (`FWD`). */
const ROW = new THREE.Vector3(0.92, 0, -0.39).normalize();
const FWD = new THREE.Vector3(0.39, 0, 0.92).normalize();
/** The disc's top face (y) and the charges' height above it. */
export const DISC_TOP = DISC.y + DISC.h;

/** Glass that shows its edges: almost clear face-on, tinted and brighter where the surface turns away (a cheap
 * Fresnel term on the alpha; no transmission pass). */
export function edgeGlass(name, { color = '#e8f6f4', edge = '#9fd3c7', face = 0.08, rim = 0.62, side = THREE.FrontSide } = {}) {
  const mat = new THREE.MeshPhysicalMaterial({
    name,
    color,
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: face,
    depthWrite: false,
    envMapIntensity: 1.25,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    side,
  });
  const edgeColor = new THREE.Color(edge);
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uRim = { value: rim };
    sh.uniforms.uFace = { value: face };
    sh.uniforms.uEdge = { value: edgeColor };
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', 'uniform float uRim;\nuniform float uFace;\nuniform vec3 uEdge;\nvoid main() {')
      .replace(
        '#include <opaque_fragment>',
        `{
          float facing = abs(dot(normalize(normal), normalize(vViewPosition)));
          float fres = pow(1.0 - facing, 2.2);
          diffuseColor.a = mix(uFace, uRim, fres);
          outgoingLight = mix(outgoingLight, uEdge * (0.55 + 0.45 * outgoingLight), fres * 0.55);
        }
        #include <opaque_fragment>`,
      );
  };
  mat.customProgramCacheKey = () => `edgeGlass-${rim}-${face}`;
  return mat;
}

function jarProfile() {
  const { r, body, neckR, neckY, top, wall, base } = JAR;
  const pts = [[0.01, 0]];
  // the outside: a rounded foot, the straight side, a round shoulder, the neck and a rolled lip
  for (let i = 0; i <= 4; i++) {
    const a = (i / 4) * (Math.PI / 2);
    pts.push([r - 4 + 4 * Math.sin(a), 4 - 4 * Math.cos(a)]);
  }
  pts.push([r, body * 0.5], [r, body]);
  for (let i = 1; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    pts.push([neckR + (r - neckR) * Math.cos(a), body + (neckY - body) * Math.sin(a)]);
  }
  pts.push([neckR, top - 4]);
  for (let i = 0; i <= 6; i++) {
    const a = -Math.PI / 2 + (i / 6) * Math.PI;
    pts.push([neckR + 1.6 + 2 * Math.cos(a), top - 2 + 2 * Math.sin(a)]);
  }
  // down the inside
  const ri = neckR - wall;
  pts.push([ri, top - 1], [ri, neckY - 1]);
  for (let i = 1; i <= 8; i++) {
    const a = (1 - i / 8) * (Math.PI / 2);
    pts.push([ri + (r - wall - ri) * Math.cos(a), body - 1 + (neckY - 1 - (body - 1)) * Math.sin(a)]);
  }
  pts.push([r - wall, base + 3]);
  for (let i = 1; i <= 3; i++) {
    const a = (i / 3) * (Math.PI / 2);
    pts.push([r - wall - 3 + 3 * Math.cos(a), base + 3 - 3 * Math.sin(a)]);
  }
  pts.push([0.01, base]);
  return pts.map(([x, y]) => new THREE.Vector2(x, y));
}

function discProfile() {
  const { r, h } = DISC;
  const e = 1.6; // the rounded edge
  const pts = [
    [0.01, 0],
    [r - e, 0],
    [r, e],
    [r, h - e],
  ];
  for (let i = 1; i <= 4; i++) {
    const a = (i / 4) * (Math.PI / 2);
    pts.push([r - e + e * Math.cos(a), h - e + e * Math.sin(a)]);
  }
  // a shallow turned groove near the rim, then the flat top
  pts.push([r - 3.4, h], [r - 3.9, h - 0.5], [r - 4.6, h - 0.5], [r - 5.1, h], [0.01, h]);
  return pts.map(([x, y]) => new THREE.Vector2(x, y));
}

/** A cork texture: warm reddish brown with darker pores (made once, 256², power of two). */
function corkTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#b8683f';
  g.fillRect(0, 0, 256, 256);
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 900; i++) {
    const x = rnd() * 256;
    const y = rnd() * 256;
    const rr = 0.6 + rnd() * 2.2;
    g.fillStyle = rnd() < 0.7 ? `rgba(110, 52, 28, ${0.25 + rnd() * 0.4})` : `rgba(225, 150, 105, ${0.2 + rnd() * 0.3})`;
    g.beginPath();
    g.ellipse(x, y, rr * 1.4, rr, rnd() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** A leaf's skin: strong gold with a few fine creases and a thin dark-amber edge, so its shape reads on the table and
 * the pale glass (128 × 256, made once). */
function leafTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#ffc62e';
  g.fillRect(0, 0, 128, 256);
  g.strokeStyle = 'rgba(176, 112, 8, 0.4)';
  g.lineWidth = 1.5;
  for (const [x0, y0, x1, y1] of [
    [30, 40, 62, 150],
    [92, 30, 74, 190],
    [48, 120, 100, 236],
    [20, 150, 40, 240],
  ]) {
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
  }
  g.strokeStyle = '#7d4a00';
  g.lineWidth = 14;
  g.strokeRect(0, -10, 128, 263);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** The leaves' earlier gap: a clear dashed outline, white on a dark line so it reads on blue and on the table. */
function ghostTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(255, 255, 255, 0.16)';
  g.fillRect(0, 0, 128, 256);
  const edge = () => g.strokeRect(6, -10, 116, 260);
  g.strokeStyle = 'rgba(11, 42, 91, 0.75)';
  g.lineWidth = 15;
  edge();
  g.strokeStyle = '#ffffff';
  g.lineWidth = 8;
  g.setLineDash([26, 16]);
  edge();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Fine drops of water on the bottle's outside, for the damp day of the test (one draw; hidden unless asked). */
function droplets() {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(13, 12, 1, 16, 16, 15);
  r.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  r.addColorStop(0.55, 'rgba(205, 232, 245, 0.6)');
  r.addColorStop(1, 'rgba(120, 170, 200, 0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 32, 32);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const N = 110;
  const pos = new Float32Array(N * 3);
  let seed = 29;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < N; i++) {
    const a = rnd() * Math.PI * 2;
    pos[i * 3] = (JAR.r + 0.6) * Math.cos(a);
    pos[i * 3 + 1] = 8 + rnd() * (JAR.body - 8);
    pos[i * 3 + 2] = (JAR.r + 0.6) * Math.sin(a);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    name: 'Droplets',
    map: tex,
    size: 9,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const pts = new THREE.Points(geo, mat);
  pts.name = 'Droplets';
  pts.visible = false;
  pts.renderOrder = 11;
  pts.userData.noExport = true;
  return pts;
}

/** One leaf: a thin fan, narrow at its top edge (local origin, across = x), wide at the foot, finely crinkled. */
function leafGeometry(seedStart) {
  const { len, wTop, wBot } = LEAF;
  const g = new THREE.PlaneGeometry(1, 1, 4, 14);
  const pos = g.attributes.position;
  let seed = seedStart;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647 - 0.5;
  };
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i); // −0.5 … 0.5 across
    const v = 0.5 - pos.getY(i); // 0 at the top … 1 at the bottom
    const w = wTop + (wBot - wTop) * v;
    const crinkle = v > 0.04 ? rnd() * 0.7 + Math.sin(v * 23 + u * 4) * 0.3 : 0;
    pos.setXYZ(i, u * w + rnd() * 0.25 * v, -v * len, crinkle);
  }
  g.computeVertexNormals();
  return g;
}

/**
 * The electroscope. Returns { root, setLeaves(angle), setGhost(angle), slot(id, out), metal (materials whose
 * glow shows the conducting path), hitMeshes, points: named world points for labels and paths }.
 */
export function createElectroscope(mats) {
  const root = new THREE.Group();
  root.name = 'Electroscope';

  // the jar: its back faces first, then the front, both see-through
  const jarGeo = new THREE.LatheGeometry(jarProfile(), 64);
  const jarBack = new THREE.Mesh(jarGeo, edgeGlass('JarGlassBack', { side: THREE.BackSide, face: 0.05, rim: 0.4 }));
  jarBack.name = 'JarBack';
  jarBack.renderOrder = 1;
  const jar = new THREE.Mesh(jarGeo, edgeGlass('JarGlass'));
  jar.name = 'GlassJar';
  jar.renderOrder = 9;
  // the thick base shows as a pale green disc
  const baseMat = new THREE.MeshStandardMaterial({
    name: 'JarBase',
    color: '#b9ddd2',
    roughness: 0.1,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });
  const jarBase = new THREE.Mesh(new THREE.CylinderGeometry(JAR.r - 1.2, JAR.r - 1.6, JAR.base - 0.6, 64), baseMat);
  jarBase.position.y = (JAR.base - 0.6) / 2 + 0.3;
  jarBase.renderOrder = 2;
  jarBase.name = 'JarBase';

  // the stopper (insulating)
  const corkMat = new THREE.MeshStandardMaterial({ name: 'Stopper', color: '#ffffff', map: corkTexture(), roughness: 0.92, metalness: 0 });
  const corkGeo = new THREE.CylinderGeometry(STOPPER.rTop, STOPPER.rBottom, STOPPER.top - STOPPER.bottom, 48, 1);
  corkGeo.translate(0, (STOPPER.top + STOPPER.bottom) / 2, 0);
  // a soft rounded top edge: a thin torus
  const corkEdge = new THREE.TorusGeometry(STOPPER.rTop - 0.9, 0.9, 6, 48);
  corkEdge.rotateX(Math.PI / 2);
  corkEdge.translate(0, STOPPER.top - 0.9, 0);
  const cork = new THREE.Mesh(mergeGeometries([corkGeo.toNonIndexed(), corkEdge.toNonIndexed()]), corkMat);
  cork.name = 'Stopper';
  cork.castShadow = true;
  cork.receiveShadow = true;

  // the metal: the rod, a nut under the disc, a collar on the stopper, the flat plate at the foot (leaves on its faces)
  const rodMat = mats.brass;
  const discMat = mats.copper;
  const rodGeo = new THREE.CylinderGeometry(ROD.r, ROD.r, ROD.top - ROD.bottom, 20);
  rodGeo.translate(0, (ROD.top + ROD.bottom) / 2, 0);
  const nut = new THREE.CylinderGeometry(7, 7, 6, 6);
  nut.translate(0, DISC.y - 3, 0);
  const collar = new THREE.CylinderGeometry(7.5, 8.5, 2.6, 24);
  collar.translate(0, STOPPER.top + 1.3, 0);
  const plate = new THREE.BoxGeometry(LEAF.wTop + 4, 14, 1.6);
  plate.rotateY(TURN);
  plate.translate(0, LEAF.hinge + 4, 0);
  const rod = new THREE.Mesh(mergeGeometries([rodGeo.toNonIndexed(), nut.toNonIndexed(), collar.toNonIndexed(), plate.toNonIndexed()]), rodMat);
  rod.name = 'ConductingRod';
  rod.castShadow = true;
  const disc = new THREE.Mesh(new THREE.LatheGeometry(discProfile(), 72), discMat);
  disc.position.y = DISC.y;
  disc.name = 'MetalDisc';
  disc.castShadow = true;
  disc.receiveShadow = true;

  // the leaves
  const leafSkin = leafTexture();
  const leafMat = new THREE.MeshStandardMaterial({
    name: 'GoldLeaf',
    color: '#ffffff',
    map: leafSkin,
    metalness: 0.7,
    roughness: 0.36,
    side: THREE.DoubleSide,
    envMapIntensity: 1.5,
    emissive: '#c98a12',
    emissiveMap: leafSkin,
    emissiveIntensity: 0.62,
  });
  leafMat.userData = { emissive: '#c98a12', intensity: 0.62 };
  const makeRig = (side, geometry, material, order) => {
    const rig = new THREE.Group(); // turned with the plate
    rig.position.set(side * SWING.x * 0.9, LEAF.hinge, side * SWING.z * 0.9);
    rig.rotation.y = TURN;
    const pivot = new THREE.Group();
    const m = new THREE.Mesh(geometry, material);
    if (order) m.renderOrder = order;
    pivot.add(m);
    rig.add(pivot);
    return { rig, pivot, mesh: m };
  };
  const leaves = [-1, 1].map((sideSign, i) => {
    const l = makeRig(sideSign, leafGeometry(11 + i * 97), leafMat, 0);
    l.mesh.name = sideSign < 0 ? 'LeafLeft' : 'LeafRight';
    l.mesh.castShadow = true;
    l.rig.name = `${l.mesh.name}Rig`;
    return l;
  });
  // a dashed copy of the leaves at an earlier gap (the test of the sign compares with it)
  const ghostMat = new THREE.MeshBasicMaterial({
    name: 'LeafBefore',
    map: ghostTexture(),
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const ghosts = [-1, 1].map((sideSign, i) => {
    const g = makeRig(sideSign, leaves[i].mesh.geometry, ghostMat, 3);
    g.rig.visible = false;
    g.rig.name = `LeafBefore${i}`;
    g.rig.userData.noExport = true;
    return g;
  });

  const drops = droplets();
  root.add(jarBack, jarBase, rod, disc, cork, ...leaves.map((l) => l.rig), ...ghosts.map((g) => g.rig), jar, drops);

  /** Each leaf's angle from the vertical (radians), away from the plate. */
  let angle = 0;
  function setLeaves(a) {
    angle = a;
    leaves[0].pivot.rotation.x = a;
    leaves[1].pivot.rotation.x = -a;
  }
  function setGhost(a) {
    const on = a != null;
    for (const g of ghosts) g.rig.visible = on;
    if (!on) return;
    ghosts[0].pivot.rotation.x = a;
    ghosts[1].pivot.rotation.x = -a;
  }
  /** A point on a leaf (side −1 or +1), `down` mm below its top edge, at leaf angle `a`, into `out`. */
  function onLeaf(side, down, a, out) {
    return out
      .set(side * SWING.x * 0.9, LEAF.hinge, side * SWING.z * 0.9)
      .addScaledVector(SWING, side * down * Math.sin(a))
      .setY(LEAF.hinge - down * Math.cos(a));
  }

  // ── the slots ───────────────────────────────────────────────────────────────
  /** The pairs stand in a row on the far side from the bodies, leaving the near side for the electrons a + body gathers. */
  const DISC_ROW = [-30, -17, -4];
  /** Extras: [along ROW, along FWD]; the two rows are one chip apart on the screen, seen at a slant. */
  const EXTRA = [
    [11, 12],
    [11, -12],
    [22, 12],
    [22, -12],
    [33, 8],
    [33, -8],
  ];
  const LEAF_DOWN = [22, 44, 66];
  const LEAF_DOWN_X = [33, 55, 75];
  /** World position of a slot ('D0', 'DX2', 'L2', 'RX1'…) into `out`. */
  function slot(id, out) {
    const extra = id[1] === 'X';
    const i = Number(id.slice(extra ? 2 : 1));
    if (id[0] === 'D') {
      const [along, fwd] = extra ? EXTRA[i] : [DISC_ROW[i], 0];
      return out
        .copy(ROW)
        .multiplyScalar(along)
        .addScaledVector(FWD, fwd)
        .setY(DISC_TOP + 0.6);
    }
    return onLeaf(id[0] === 'L' ? -1 : 1, extra ? LEAF_DOWN_X[i] : LEAF_DOWN[i], angle, out);
  }
  /** Points electrons pass through on their way: each leaf's top, the rod's foot and top, the disc's centre. */
  const points = {
    rodFoot: new THREE.Vector3(0, LEAF.hinge + 6, 0),
    rodTop: new THREE.Vector3(0, DISC.y - 4, 0),
    discCentre: new THREE.Vector3(0, DISC_TOP + 0.6, 0),
    leafTop: (i, out) => onLeaf(i ? 1 : -1, 2, angle, out),
    // for labels
    disc: new THREE.Vector3(-DISC.r * 0.74, DISC_TOP - 1, DISC.r * 0.66),
    rod: new THREE.Vector3(-ROD.r, 115, ROD.r * 0.4),
    stopper: new THREE.Vector3(-STOPPER.rTop * 0.75, STOPPER.top - 8, STOPPER.rTop * 0.65),
    leafHinge: new THREE.Vector3(0, LEAF.hinge, 0),
    leaf: (i, out) => onLeaf(i ? 1 : -1, LEAF.len * 0.8, angle, out),
    /** The foot of the right leaf at an earlier gap. */
    ghostTip: (a, out) => onLeaf(1, LEAF.len * 0.9, a, out),
    /** The foot of a leaf at angle `a` (now, if left out), to one side across its width (−1, 0, +1). */
    tip: (side, across, a, out) => onLeaf(side, LEAF.len, a ?? angle, out).addScaledVector(ACROSS, (across * LEAF.wBot) / 2),
  };
  return {
    root,
    setLeaves,
    setGhost,
    /** The damp day: the drops on the bottle, 0…1. */
    setDamp(k) {
      drops.visible = k > 0;
      drops.material.opacity = k;
    },
    drops,
    slot,
    points,
    metal: [rodMat, discMat, leafMat],
    hitMeshes: [jar, disc, cork, rod],
    parts: { jar, jarBack, jarBase, cork, rod, disc },
  };
}
