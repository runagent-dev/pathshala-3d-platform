// The chapter's optical bench, in centimetres, in the calm setting of the owner's latest figures: a deep-blue backdrop (the scene's
// background, one small gradient) and a plain light-sand table top with the blue all round it. On the table: an anodised aluminium
// rail with a printed cm scale on its sloping front (0 at the lens, counting away on both sides), black sliding carriers, a glass
// biconcave lens held by its rim in a thin black ring at 0 (thin in the middle, thick at the edge: the edge shows on both sides of the
// ring), and the book's pencil XY on the left. The rail, the carriers and the pencil are the sister figure convex-lens-image's.
//
// What is seen THROUGH the glass is the lens's own image of what stands behind it: copies of the pencil, its stand, the rail and the
// table whose every vertex is moved by the thin lens's map (reading.js `lensImage`), drawn only where the line of sight passes through
// the glass; there the real things behind it are not drawn. So from any side the glass shows the small upright pencil exactly where the
// rays put X′Y′ (a thin lens, ideal: no blur, no colour fringes).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { pencilParts } from './pencil.js';
import { EDGE, F0, LENS, PENCIL, R_FACE, sag } from './reading.js';

/** The heights that matter, cm: the rail's top, the carriers' top, the principal axis; the rail's two ends. */
export const RAIL = { top: 3.2, carrier: 5.6, axis: 19, left: -68, right: 40 };
/** The scale strip on the sloping front of the rail: where it lies. */
const STRIP = { y0: 0.55, z0: 5.5, y1: 2.35, z1: 3.3 };
export const SCALE_POINT = { y: (STRIP.y0 + STRIP.y1) / 2, z: (STRIP.z0 + STRIP.z1) / 2 };
/** The colours of the backdrop, top and bottom (the calm deep blue of equations-of-motion and newtons-second-law). */
export const BG = ['#0b2a5b', '#123d7a'];
/** The ring that holds the glass by the middle of its edge: inner and outer radius, half its width. */
export const RING = { in: LENS.half + 0.05, out: LENS.half + 0.75, w: 0.5 };
/** The table: its two ends along the rail, its depth. */
const TABLE = { left: -86, right: 58, back: -24, front: 30 };

const box = (a, b, c, d, e, f) => new THREE.Box3(new THREE.Vector3(a, b, c), new THREE.Vector3(d, e, f));
const AXIS = RAIL.axis;

/**
 * What the camera shows at each moment: a box to fill and the angle to see it from (az: degrees round from the front, negative = from
 * the pencil's side, 90 = from the eye's side along the rail; el: up). aspect is the view's width ÷ height. Every frame reads as 3D.
 */
export const FRAMES = {
  // from the eye's side, looking along the rail through the glass at the pencil behind it
  eye: ({ u, aspect }) => {
    const tall = aspect < 1.1;
    return { box: box(-u - 1, AXIS - (tall ? 11 : 9.5), -9, 2, AXIS + 9, 9), az: 62, el: 10 };
  },
  // the bundles of চিত্র ৯.১৮ and ৯.১৯: the lens and both foci, close
  lens: ({ aspect, high }) => {
    const tall = aspect < 1.25;
    return { box: box(tall ? -21 : -25, AXIS - 8, -2, tall ? 22 : 27, AXIS + (high ? 13.5 : 9.5), 2), az: -22, el: 10 };
  },
  // the pencil, F, the lens and the rays: the whole construction
  rays: ({ u, aspect }) => {
    const tall = aspect < 1.25;
    return { box: box(-u - (tall ? 1.5 : 3), AXIS - 8, -2, tall ? 14 : 20, AXIS + 9.5, 2), az: tall ? -34 : -24, el: 10 };
  },
  // the pencil wherever it is, F, the image and the lens: the frame follows the pencil (a small image gets the magnifier)
  cases: ({ u, aspect }) => {
    const tall = aspect < 1.25;
    return {
      box: box(-Math.max(u, F0) - (tall ? 1.5 : 3), AXIS - 8.5, -2, tall ? 9 : 12, AXIS + 9, 2).expandByPoint(new THREE.Vector3(0, AXIS, 8.5)),
      az: tall ? -32 : -22,
      el: 10,
    };
  },
  // close on the scale under the image: the test reads the image's distance there
  read: ({ u }) => ({ box: box(-Math.max(u, 16) - 3, 0.2, -3, 4, AXIS + 7.5, 6), az: -16, el: 18 }),
};

/** The backdrop: a vertical gradient on a 4 × 256 canvas, made once. As the scene's background it fills the view from any angle. */
export function backdropTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, BG[0]);
  grad.addColorStop(1, BG[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

/** Where each printed row runs along the rail, cm: one 0 only, at the lens, in the middle of the right-hand row. */
const ROWS = [
  { from: -1.5, to: 80.5 },
  { from: -70.5, to: -1.5 },
];

/**
 * The printed scale: two rows in one 1024 × 256 texture, about 12 px to the centimetre along the rail and 49 px across it. Row 0
 * runs from just left of the lens to 80 cm on the screen's side, row 1 from 70 cm on the pencil's side to just left of the lens: each
 * mark is the distance from the lens. Black on satin silver: a tick each cm, longer each 5, a number each 10, one 0 at the lens.
 */
function scaleTexture(t) {
  const W = 1024;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#c4cbd3';
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#14181d';
  g.fillStyle = '#14181d';
  g.textBaseline = 'alphabetic';
  g.textAlign = 'center';
  ROWS.forEach(({ from, to }, r) => {
    const y0 = r * 128;
    const px = (W - 8) / (to - from);
    for (let x = Math.ceil(from); x <= to; x++) {
      const cx = 4 + (x - from) * px;
      const i = Math.abs(x);
      const major = i % 10 === 0;
      const mid = i % 5 === 0;
      g.lineWidth = major ? 3.5 : 2;
      g.beginPath();
      g.moveTo(cx, y0 + 3);
      g.lineTo(cx, y0 + (major ? 38 : mid ? 27 : 17));
      g.stroke();
      if (major && cx > 24 && cx < W - 24) {
        // across the strip there are four times as many pixels to a centimetre as along it: the digits are drawn narrow
        g.save();
        g.translate(cx, y0 + 121);
        g.scale(0.42, 1);
        g.font = '600 94px "Noto Sans Bengali", sans-serif';
        g.fillText(t.num(i), 0, 0);
        g.restore();
      }
    }
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** The rail's section, from the back of its foot round to the front: a groove on top, a sloping front for the scale. */
const SECTION = [
  [-5.5, 0],
  [-5.5, RAIL.top],
  [-1.5, RAIL.top],
  [-1.5, 2.3],
  [1.5, 2.3],
  [1.5, RAIL.top],
  [3.3, RAIL.top],
  [STRIP.z1, STRIP.y1],
  [STRIP.z0, STRIP.y0],
  [5.5, 0],
];
/** The extruded rail from x0 to x1 (its underside lies on the table). */
function railGeometry(x0, x1) {
  const pos = [];
  const nor = [];
  SECTION.forEach(([z, y], i) => {
    if (i === SECTION.length - 1) return;
    const [zb, yb] = SECTION[i + 1];
    const l = Math.hypot(zb - z, yb - y);
    const nz = -(yb - y) / l;
    const ny = (zb - z) / l;
    pos.push(x0, y, z, x1, yb, zb, x1, y, z, x0, y, z, x0, yb, zb, x1, yb, zb);
    for (let k = 0; k < 6; k++) nor.push(0, ny, nz);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}
/** One printed strip on the slope, from xa to xb, showing the rows of the texture between v0 and v1 and u0 to u1 across. */
function stripGeometry(xa, xb, u0, u1, v0, v1) {
  const inset = 0.08;
  const y0 = STRIP.y0 + inset * 0.6;
  const y1 = STRIP.y1 - inset * 0.6;
  const z0 = STRIP.z0 - inset * 0.8;
  const z1 = STRIP.z1 + inset * 0.8;
  const lift = 0.012;
  const g = new THREE.BufferGeometry();
  g.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([xa, y0 + lift, z0 + lift, xb, y0 + lift, z0 + lift, xb, y1 + lift, z1 + lift, xa, y1 + lift, z1 + lift], 3),
  );
  g.setAttribute('uv', new THREE.Float32BufferAttribute([u0, v0, u1, v0, u1, v1, u0, v1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeVertexNormals();
  return g;
}
/** The two strips: row 0 from just left of the lens to RAIL.right (part of the texture's row, which runs to 80.5), row 1 on the pencil's side. */
const margin = ({ from, to }) => (4 / 1016) * (to - from);
const STRIP_RIGHT = () => {
  const { from, to } = ROWS[0];
  const m = margin(ROWS[0]);
  return stripGeometry(from - m, RAIL.right, 0, (RAIL.right - from + m) / (to - from + 2 * m), 0.5, 1);
};
const STRIP_LEFT = () => {
  const m = margin(ROWS[1]);
  return stripGeometry(ROWS[1].from - m, ROWS[1].to + m, 0, 1, 0, 0.5);
};

/** A black sliding carrier with a thumb screw and a brass pointer that reads the scale. Its origin is on the rail's top, at the pointer. */
function createCarrier({ black, brass, steel }) {
  const root = new THREE.Group();
  root.name = 'carrier';
  const H = RAIL.carrier - RAIL.top;
  const body = new THREE.Mesh(new RoundedBoxGeometry(6, H + 0.35, 11.6, 3, 0.26), black);
  body.position.y = H / 2 - 0.17;
  body.castShadow = true;
  root.add(body);
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1, 16), steel);
  screw.rotation.x = Math.PI / 2;
  screw.position.set(2.1, H / 2, 6.2);
  root.add(screw);
  // the brass pointer lies on the printed strip, its tip at the ticks (on the slope, 1 cm down from its top edge)
  const SLOPE = Math.atan2(STRIP.y1 - STRIP.y0, STRIP.z0 - STRIP.z1);
  const pointer = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 1.1), brass);
  const along = 0.5;
  pointer.position.set(
    0,
    STRIP.y1 - along * Math.sin(SLOPE) + 0.04 * Math.cos(SLOPE) - RAIL.top,
    STRIP.z1 + along * Math.cos(SLOPE) + 0.04 * Math.sin(SLOPE),
  );
  pointer.rotation.x = SLOPE;
  root.add(pointer);
  return root;
}

/** The pencil's stand: a carrier, a steel rod up to the axis and a brass cup. Its origin is on the rail's top. */
function createStand(mats) {
  const root = new THREE.Group();
  root.name = 'pencil-stand';
  root.add(createCarrier(mats));
  const rise = RAIL.axis - RAIL.carrier;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, rise - 0.2, 14), mats.steel);
  rod.position.y = RAIL.carrier - RAIL.top + rise / 2 - 0.25;
  rod.castShadow = true;
  root.add(rod);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.52, 0.32, 18), mats.brass);
  cup.position.y = RAIL.axis - RAIL.top - 0.14;
  root.add(cup);
  return root;
}

const v2 = (x, y) => new THREE.Vector2(x, y);

/**
 * The glass: a symmetric biconcave lens, each face part of a sphere of radius R_FACE (f = −15 cm with n = 1.52), 0.4 cm thick in the
 * middle and EDGE (about 4.2 cm) at the rim, a cylindrical edge between the faces. Built round x (the principal axis), centre at the
 * origin. The faces are a faint clear glass that shows the studio's highlights; the edge, where one looks through the most glass, has
 * the faint green of real glass.
 */
function createGlass() {
  const root = new THREE.Group();
  root.name = 'concave-lens';
  const c = LENS.middle / 2;
  const half = LENS.half;
  const N = 20;
  const face = [];
  for (let i = 0; i <= N; i++) {
    const r = (i / N) * half;
    face.push(v2(Math.max(0.0001, r), c + sag(R_FACE, r)));
  }
  // the lathe turns round y: from the middle of a face (at height c) out to the rim (at EDGE / 2); then the lathe's y goes along x
  const front = new THREE.LatheGeometry(face, 64);
  const back = front.clone();
  back.rotateX(Math.PI);
  const faces = [front, back];
  for (const g of faces) g.rotateZ(-Math.PI / 2);
  const glass = new THREE.MeshPhysicalMaterial({
    name: 'LensGlass',
    color: 0xeafcf7,
    roughness: 0.03,
    metalness: 0,
    transparent: true,
    opacity: 0.2,
    envMapIntensity: 1.6,
    specularIntensity: 0.8,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  for (const g of faces) {
    const m = new THREE.Mesh(g, glass);
    m.renderOrder = 3;
    root.add(m);
  }
  const e = EDGE / 2;
  const rim = new THREE.LatheGeometry([v2(half, -e), v2(half, e)], 64, 0, Math.PI * 2);
  rim.rotateZ(-Math.PI / 2);
  const edge = new THREE.MeshStandardMaterial({
    name: 'LensEdge',
    color: 0x8fcab4,
    roughness: 0.22,
    transparent: true,
    opacity: 0.32,
    side: THREE.DoubleSide,
  });
  const rimMesh = new THREE.Mesh(rim, edge);
  rimMesh.renderOrder = 3;
  root.add(rimMesh);
  return { root, material: glass };
}

/** The black ring that holds the glass round the middle of its edge, with a brass cap and pin on top. Its origin is the lens's centre. */
function createHolder({ black, steel, brass }) {
  const root = new THREE.Group();
  root.name = 'ring-holder';
  const { in: IN, out: OUT, w: W } = RING;
  const ring = new THREE.LatheGeometry(
    [
      v2(IN, -W),
      v2(IN + 0.1, -W - 0.1),
      v2(OUT - 0.1, -W - 0.1),
      v2(OUT, -W),
      v2(OUT, W),
      v2(OUT - 0.1, W + 0.1),
      v2(IN + 0.1, W + 0.1),
      v2(IN, W),
      v2(IN, -W),
    ],
    72,
  );
  ring.rotateZ(Math.PI / 2);
  const mesh = new THREE.Mesh(ring, black);
  mesh.castShadow = true;
  root.add(mesh);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.4, 18), brass);
  cap.position.y = OUT + 0.2;
  root.add(cap);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 10), steel);
  pin.position.y = OUT + 0.55;
  root.add(pin);
  return root;
}

// ── seen through the glass ───────────────────────────────────────────────────────────────────────────────────────────────────────
/** One set of uniforms for every patched material: on/off, the lens's f (negative), the axis's height, the glass's radius. */
const LENS_U = { lensOn: { value: 0 }, lensF: { value: -F0 }, lensAxis: { value: AXIS }, lensR: { value: LENS.half - 0.05 } };
const VERTEX_REAL = '#include <project_vertex>\nvLensW = (modelMatrix * vec4(transformed, 1.0)).xyz;';
// the thin lens's map: a point at x < 0 moves to m·(its place from the lens's centre), m = f / (f − x) with f = −lensF … (reading.js)
const VERTEX_IMAGE = `vec4 lensW = modelMatrix * vec4(transformed, 1.0);
vec3 lensD = lensW.xyz - vec3(0.0, lensAxis, 0.0);
lensW.xyz = vec3(0.0, lensAxis, 0.0) + lensD / (1.0 + lensD.x / lensF);
vLensW = lensW.xyz;
vec4 mvPosition = viewMatrix * lensW;
gl_Position = projectionMatrix * mvPosition;`;
// is this point seen through the glass? The line from the eye to it crosses the lens's middle plane inside the glass
const FRAGMENT_TEST = `float lensSeen = 0.0;
if (lensOn > 0.5 && cameraPosition.x > 0.0 && vLensW.x < 0.0) {
  float lensT = cameraPosition.x / (cameraPosition.x - vLensW.x);
  vec3 lensHit = cameraPosition + (vLensW - cameraPosition) * lensT;
  lensSeen = step(length(vec2(lensHit.y - lensAxis, lensHit.z)), lensR);
}`;
/** Patches a material: 'real' (not drawn where it is seen through the glass) or 'image' (moved by the lens, drawn only there). */
function throughLens(material, kind) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, LENS_U);
    const decl = 'uniform float lensOn;\nuniform float lensF;\nuniform float lensAxis;\nuniform float lensR;\nvarying vec3 vLensW;\n';
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${decl}`)
      .replace('#include <project_vertex>', kind === 'image' ? VERTEX_IMAGE : VERTEX_REAL);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${decl}`)
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>\n${FRAGMENT_TEST}\nif (lensSeen ${kind === 'image' ? '<' : '>'} 0.5) discard;`,
      );
  };
  material.customProgramCacheKey = () => `lens-${kind}`;
  return material;
}
/** The same material, to draw a part as it is seen through the glass. */
function imageOfMaterial(material) {
  const m = material.clone();
  m.name = `${material.name}Seen`;
  return throughLens(m, 'image');
}

export function createSetting({ stage, shadow, t, transparent = false }) {
  const { scene, renderer } = stage;
  if (!transparent) scene.background = backdropTexture();

  // the table: a plain light-sand top, finite, the blue all round it
  const tableMat = throughLens(
    new THREE.MeshStandardMaterial({ name: 'Table', color: 0xcdbb98, roughness: 0.86, metalness: 0, envMapIntensity: 0.4 }),
    'real',
  );
  const tableW = TABLE.right - TABLE.left;
  const tableD = TABLE.front - TABLE.back;
  const table = new THREE.Mesh(new RoundedBoxGeometry(tableW, 3, tableD, 2, 0.9), tableMat);
  table.position.set((TABLE.left + TABLE.right) / 2, -1.5, (TABLE.back + TABLE.front) / 2);
  table.receiveShadow = true;
  table.userData.noExport = true;
  scene.add(table);

  const mats = {
    alu: throughLens(new THREE.MeshStandardMaterial({ name: 'Aluminium', color: 0xb4bcc6, roughness: 0.42, metalness: 0.85 }), 'real'),
    black: throughLens(new THREE.MeshStandardMaterial({ name: 'BlackAnodised', color: 0x1b1f24, roughness: 0.46, metalness: 0.55 }), 'real'),
    steel: throughLens(new THREE.MeshStandardMaterial({ name: 'Steel', color: 0xb9c0c9, roughness: 0.3, metalness: 0.92 }), 'real'),
    brass: throughLens(new THREE.MeshStandardMaterial({ name: 'Brass', color: 0xc9a227, roughness: 0.34, metalness: 0.95 }), 'real'),
  };
  const scaleMat = throughLens(new THREE.MeshStandardMaterial({ name: 'Scale', map: scaleTexture(t), roughness: 0.46, metalness: 0.15 }), 'real');

  const apparatus = new THREE.Group();
  apparatus.name = 'optical-bench';
  scene.add(apparatus);

  // the rail, its two printed strips and its end caps
  const rail = new THREE.Group();
  rail.name = 'rail';
  const railMesh = new THREE.Mesh(railGeometry(RAIL.left, RAIL.right), mats.alu);
  railMesh.castShadow = true;
  railMesh.receiveShadow = true;
  rail.add(railMesh, new THREE.Mesh(STRIP_RIGHT(), scaleMat), new THREE.Mesh(STRIP_LEFT(), scaleMat));
  const capGeo = new RoundedBoxGeometry(0.6, RAIL.top + 0.2, 11.4, 2, 0.1);
  for (const x of [RAIL.left - 0.3, RAIL.right + 0.3]) {
    const cap = new THREE.Mesh(capGeo, mats.black);
    cap.position.set(x, RAIL.top / 2, 0);
    rail.add(cap);
  }
  apparatus.add(rail);

  // the lens: a carrier at 0, a post, the ring and the glass in it
  const standL = new THREE.Group();
  standL.name = 'lens-stand';
  const carrier = createCarrier(mats);
  carrier.position.y = RAIL.top;
  standL.add(carrier);
  const POST = RAIL.axis - RING.out - RAIL.carrier;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, POST + 0.4, 20), mats.steel);
  post.position.y = RAIL.carrier + POST / 2;
  post.castShadow = true;
  standL.add(post);
  const holder = createHolder(mats);
  holder.position.y = RAIL.axis;
  standL.add(holder);
  const glass = createGlass();
  glass.root.position.y = RAIL.axis;
  standL.add(glass.root);
  apparatus.add(standL);

  // the pencil XY on its carrier
  const parts = pencilParts();
  throughLens(parts.paint, 'real');
  throughLens(parts.metal, 'real');
  const pencil = new THREE.Group();
  pencil.name = 'pencil-XY';
  const stand = createStand(mats);
  stand.position.y = RAIL.top;
  const paint = new THREE.Mesh(parts.paintGeo, parts.paint);
  const metal = new THREE.Mesh(parts.metalGeo, parts.metal);
  paint.castShadow = true;
  metal.castShadow = true;
  const body = new THREE.Group();
  body.position.y = RAIL.axis;
  body.add(paint, metal);
  pencil.add(stand, body);
  apparatus.add(pencil);

  // ── what the glass shows: the same things, moved by the lens (no shadows of their own; never exported) ──
  const seen = new THREE.Group();
  seen.name = 'seen-through-the-lens';
  seen.userData.noExport = true;
  const seenMats = {
    alu: imageOfMaterial(mats.alu),
    black: imageOfMaterial(mats.black),
    steel: imageOfMaterial(mats.steel),
    brass: imageOfMaterial(mats.brass),
  };
  const seenPencil = new THREE.Group();
  const seenStand = createStand(seenMats);
  seenStand.position.y = RAIL.top;
  const seenBody = new THREE.Group();
  seenBody.position.y = RAIL.axis;
  seenBody.add(new THREE.Mesh(parts.paintGeo, imageOfMaterial(parts.paint)), new THREE.Mesh(parts.metalGeo, imageOfMaterial(parts.metal)));
  seenPencil.add(seenStand, seenBody);
  // the rail and the table on the pencil's side only: the map is for what stands behind the glass
  const seenRail = new THREE.Mesh(railGeometry(RAIL.left, 0), seenMats.alu);
  const seenStrip = new THREE.Mesh(STRIP_LEFT(), imageOfMaterial(scaleMat));
  const seenCap = new THREE.Mesh(capGeo, seenMats.black);
  seenCap.position.set(RAIL.left - 0.3, RAIL.top / 2, 0);
  const seenTable = new THREE.Mesh(new THREE.BoxGeometry(-TABLE.left, 3, tableD), imageOfMaterial(tableMat));
  seenTable.position.set(TABLE.left / 2, -1.5, (TABLE.back + TABLE.front) / 2);
  seen.add(seenPencil, seenRail, seenStrip, seenCap, seenTable);
  seen.visible = false;
  scene.add(seen);

  // The image X′Y′ of the ray diagram: a ghost of the pencil at 45 %, standing upright on the axis, drawn over the glass.
  const ghost = new THREE.Mesh(
    parts.wholeGeo(),
    new THREE.MeshStandardMaterial({
      name: 'ImageGhost',
      vertexColors: true,
      roughness: 0.5,
      transparent: true,
      opacity: 0.45,
      emissive: 0x6a5a3a,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  ghost.renderOrder = 6;
  ghost.visible = false;
  ghost.userData.noExport = true;
  scene.add(ghost);

  // big invisible targets for a finger: the pencil and its stand, and the numbered ring
  const hidden = new THREE.MeshBasicMaterial({ visible: false });
  const hit = new THREE.Mesh(new THREE.BoxGeometry(10, 30, 12), hidden);
  hit.position.y = RAIL.axis - 5;
  hit.userData.noExport = true;
  pencil.add(hit);
  const tapTarget = new THREE.Mesh(new THREE.SphereGeometry(6, 10, 8), hidden);
  tapTarget.userData.noExport = true;
  scene.add(tapTarget);

  // the lights: a warm key from the front left (soft shadows on the table) and a cool sky fill
  const key = new THREE.DirectionalLight(0xfff3e4, transparent || !shadow ? 2.2 : 2);
  key.position.set(-30, 95, 60);
  key.target.position.set(-14, 0, 0);
  scene.add(key, key.target);
  if (shadow) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0008;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = 4;
    Object.assign(key.shadow.camera, { left: -62, right: 52, top: 22, bottom: -22, near: 40, far: 190 });
  }
  scene.add(new THREE.HemisphereLight(0xdfeaff, 0x5a5040, 1.15));

  let u = 30;
  return {
    apparatus,
    hit,
    tapTarget,
    glass,
    /** Parts of later steps, hidden at the start: the stage compiles their shaders ahead. */
    later: [ghost, seen],
    placePencil(x) {
      u = x;
      pencil.position.x = -x;
      seenPencil.position.x = -x;
    },
    /** The image X′Y′ of the diagram at x, of size m, grown to the share k from Y′ (a ghost; 0 hides it). */
    placeImage(x, m, k) {
      ghost.visible = k > 0.01;
      if (!ghost.visible) return;
      ghost.position.set(x, RAIL.axis, 0);
      ghost.scale.set(Math.max(0.6, m), Math.max(0.001, m * k), Math.max(0.6, m));
    },
    /** What the glass shows behind it: on whenever the eye is on the far side of the lens (`on` false switches it off). */
    lookThrough(camera, on = true) {
      const look = on && camera.position.x > 0.5;
      LENS_U.lensOn.value = look ? 1 : 0;
      seen.visible = look;
    },
    get u() {
      return u;
    },
    PENCIL_TOP: RAIL.axis + PENCIL,
  };
}
