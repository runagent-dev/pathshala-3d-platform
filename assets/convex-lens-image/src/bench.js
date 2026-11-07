// The chapter's optical bench, in centimetres, in the calm setting of the owner's latest figures: a deep-blue backdrop (the scene's
// background, one small gradient) and a plain light-sand table top with the blue all round it. On the table: an anodised aluminium
// rail with a printed cm scale on its sloping front (0 at the lens, counting away on both sides), black sliding carriers, a glass
// biconvex lens in a black ring holder at 0, the book's pencil XY on the left (the light comes from it), and a paper screen on its own
// carrier on the right. The rail, the carriers and the pencil are those of the chapter 8 bench (concave-mirror-image), so the
// sister figures look alike.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { pencilParts, pencilPicture } from './pencil.js';
import { CARD, LENS, PENCIL, R_FACE, sag } from './reading.js';

/** The heights that matter, cm: the rail's top, the carriers' top, the principal axis; the rail's two ends. */
export const RAIL = { top: 3.2, carrier: 5.6, axis: 19, left: -68, right: 82 };
/** The scale strip on the sloping front of the rail: where it lies. */
const STRIP = { y0: 0.55, z0: 5.5, y1: 2.35, z1: 3.3 };
export const SCALE_POINT = { y: (STRIP.y0 + STRIP.y1) / 2, z: (STRIP.z0 + STRIP.z1) / 2 };
/** Where the drag handles run: along the front of the rail, at the carriers. */
export const TRACKS = { pencil: { y: RAIL.top + 0.1, z: 4.2 }, screen: { y: RAIL.top + 0.1, z: 4.2 } };
/** The colours of the backdrop, top and bottom (the same calm deep blue as equations-of-motion and newtons-second-law). */
export const BG = ['#0b2a5b', '#123d7a'];
/** The ring round the glass: inner and outer radius, half its width. */
export const RING = { in: LENS.half + 0.25, out: LENS.half + 0.8, w: 0.55 };

const box = (a, b, c, d, e, f) => new THREE.Box3(new THREE.Vector3(a, b, c), new THREE.Vector3(d, e, f));
const AXIS = RAIL.axis;
/** A real image farther than this is left out of the frame (a tab says where it is); a virtual one farther back than this too. */
export const SEE_V = 64;
export const SEE_BEHIND = 46;

/**
 * What the camera shows at each moment: a box to fill and the angle to see it from (az: degrees round from the front, negative = from
 * the pencil's side; el: up). aspect is the view's width ÷ height. Every frame reads as 3D: about 24° to the side, 10° from above.
 */
export const FRAMES = {
  // the pencil, the lens, the image: the whole story at once
  story: ({ u, img, aspect }) => {
    const tall = aspect < 1.25;
    const right = img.kind === 'real' ? Math.min(img.v, SEE_V) + (tall ? 2 : 4) : 22;
    return { box: box(-u - (tall ? 1.5 : 4), AXIS - 9, -2, right, AXIS + 9.5, 2), az: tall ? -38 : -24, el: 10 };
  },
  // the bundles of চিত্র ৯.২১ and ৯.২২: the lens and both foci, close
  lens: ({ aspect }) => {
    const tall = aspect < 1.25;
    return { box: box(tall ? -22 : -28, 6, -2, tall ? 26 : 31, AXIS + 9.5, 2), az: -22, el: 10 };
  },
  // the paper and the image on it, with the lens: the pencil may leave the frame
  screen: ({ s, v }) => ({ box: box(-6, 4, -5, Math.max(s, v) + 4, AXIS + 8, 5), az: -30, el: 10 }),
  // the pencil, the lens and wherever the image is
  cases: ({ u, img, aspect }) => {
    const tall = aspect < 1.25;
    const real = img.kind === 'real' && img.v <= SEE_V;
    const virt = img.kind === 'virtual' && -img.v <= SEE_BEHIND;
    const left = Math.max(u, virt ? -img.v : 0) + (tall ? 3 : 6);
    const right = real ? img.v + (tall ? 4 : 7) : img.kind === 'virtual' ? 30 : 34;
    const top = AXIS + (virt ? Math.max(10, img.length + 2.5) : 10.5);
    return { box: box(-left, tall ? AXIS - 13 : 1, -3, right, top, 3), az: tall ? -36 : -24, el: 10 };
  },
  // the whole scale from a little way off: the test reads the pencil's place here
  wide: ({ u }) => ({ box: box(-Math.max(u, 20) - 6, 0.2, -6, 50, AXIS + 10, 6), az: -22, el: 10 }),
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

/** A soft round glow (white in the middle), tinted by the material. */
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 1, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.3, 'rgba(255,255,255,0.46)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * The printed scale: two strips in one 1024 × 256 texture, 14 px to the centimetre. Row 0 runs 0 → 80 cm to the right of the lens
 * (toward the screen), row 1 runs 70 → 0 to its left (toward the pencil). Black on satin silver: a tick each cm, longer each 5, a number each 10.
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
  const row = (y0, length, dir) => {
    const px = (W - 8) / length;
    const x0 = dir > 0 ? 4 : W - 4;
    for (let i = 0; i <= length; i++) {
      const x = x0 + dir * i * px;
      const major = i % 10 === 0;
      const mid = i % 5 === 0;
      g.lineWidth = major ? 3.5 : 2;
      g.beginPath();
      g.moveTo(x, y0 + 3);
      g.lineTo(x, y0 + (major ? 40 : mid ? 28 : 18));
      g.stroke();
      if (major) {
        // the strip has more pixels to a centimetre across than along: the digits are drawn narrow to come out true
        g.save();
        g.translate(x, y0 + 116);
        g.scale(0.6, 1);
        g.font = '700 84px "Noto Sans Bengali", sans-serif';
        g.textAlign = i === 0 ? (dir > 0 ? 'left' : 'right') : 'center';
        g.fillText(t.num(i), 0, 0);
        g.restore();
      }
    }
  };
  row(0, 80, 1);
  row(128, 70, -1);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** The rail: an extruded aluminium section with a groove on top and a sloping front for the scale. */
function createRail(t, { alu, black }) {
  const root = new THREE.Group();
  root.name = 'rail';
  const section = [
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
  const pos = [];
  const nor = [];
  const { left: x0, right: x1 } = RAIL;
  section.forEach(([z, y], i) => {
    const [zb, yb] = section[(i + 1) % section.length];
    if (i === section.length - 1) return; // the underside lies on the table
    const l = Math.hypot(zb - z, yb - y);
    const nz = -(yb - y) / l;
    const ny = (zb - z) / l;
    pos.push(x0, y, z, x1, yb, zb, x1, y, z, x0, y, z, x0, yb, zb, x1, yb, zb);
    for (let k = 0; k < 6; k++) nor.push(0, ny, nz);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  const rail = new THREE.Mesh(g, alu);
  rail.castShadow = true;
  rail.receiveShadow = true;
  root.add(rail);
  // the two printed strips on the slope, in one mesh
  const tex = scaleTexture(t);
  const scaleMat = new THREE.MeshStandardMaterial({ name: 'Scale', map: tex, roughness: 0.46, metalness: 0.15 });
  const inset = 0.08;
  const y0 = STRIP.y0 + inset * 0.6;
  const y1 = STRIP.y1 - inset * 0.6;
  const z0 = STRIP.z0 - inset * 0.8;
  const z1 = STRIP.z1 + inset * 0.8;
  const lift = 0.012;
  const pad = 0.0078 * 80; // the 4 px at the ends of a row, in cm
  const pos2 = [];
  const uv = [];
  const idx = [];
  const strip = (xa, xb, v0, v1) => {
    const b = pos2.length / 3;
    pos2.push(xa, y0 + lift, z0 + lift, xb, y0 + lift, z0 + lift, xb, y1 + lift, z1 + lift, xa, y1 + lift, z1 + lift);
    uv.push(0, v0, 1, v0, 1, v1, 0, v1);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  };
  strip(-pad * (70 / 80), 80 + pad, 0.5, 1); // 0 → 80, the top row of the canvas
  strip(-70 - pad * (70 / 80), pad * (70 / 80), 0, 0.5); // 70 → 0, its bottom row
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(pos2, 3));
  sg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  sg.setIndex(idx);
  sg.computeVertexNormals();
  root.add(new THREE.Mesh(sg, scaleMat));
  for (const x of [RAIL.left - 0.3, RAIL.right + 0.3]) {
    const cap = new THREE.Mesh(new RoundedBoxGeometry(0.6, RAIL.top + 0.2, 11.4, 2, 0.1), black);
    cap.position.set(x, RAIL.top / 2, 0);
    root.add(cap);
  }
  return root;
}

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
  const pointer = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 1.9), brass);
  pointer.position.set(0, -0.32, 6.0);
  pointer.rotation.x = 0.68;
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
 * The glass: a symmetric biconvex lens, each face part of a sphere of radius R_FACE (f = 15 cm with n = 1.52), a thin cylindrical
 * edge between them. Built round x (the principal axis), centre at the origin. The faces are a faint clear glass that shows the
 * studio's highlights; the edge, where one looks through the most glass, has the faint green of real glass.
 */
function createGlass() {
  const root = new THREE.Group();
  root.name = 'convex-lens';
  const e = LENS.edge / 2;
  const half = LENS.half;
  const top = e + sag(R_FACE, half);
  const N = 18;
  const face = [];
  for (let i = 0; i <= N; i++) {
    const r = (i / N) * half;
    face.push(v2(r, top - sag(R_FACE, r)));
  }
  // the lathe turns round y: the profile goes from the middle of one face out to the rim, and on the other face back to the middle
  const front = new THREE.LatheGeometry([v2(0.0001, top), ...face.slice(1)], 64);
  const back = front.clone();
  back.rotateX(Math.PI);
  const faces = [front, back];
  for (const g of faces) g.rotateZ(-Math.PI / 2); // the lathe's y goes along x
  const glass = new THREE.MeshPhysicalMaterial({
    name: 'LensGlass',
    color: 0xeafcf7,
    roughness: 0.03,
    metalness: 0,
    transparent: true,
    opacity: 0.26,
    envMapIntensity: 2.2,
    specularIntensity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  for (const g of faces) {
    const m = new THREE.Mesh(g, glass);
    m.renderOrder = 3;
    root.add(m);
  }
  const rim = new THREE.LatheGeometry([v2(half, -e), v2(half, e)], 64, 0, Math.PI * 2);
  rim.rotateZ(-Math.PI / 2);
  const edge = new THREE.MeshStandardMaterial({
    name: 'LensEdge',
    color: 0x8fcab4,
    roughness: 0.2,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  const rimMesh = new THREE.Mesh(rim, edge);
  rimMesh.renderOrder = 3;
  root.add(rimMesh);
  return { root, material: glass };
}

/** The black ring that holds the glass by its edge, with two brass screws, on a post. Its origin is at the lens's centre. */
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
  // a lip on each side keeps the glass: thin rings just inside the holder
  for (const s of [1, -1]) {
    const lip = new THREE.Mesh(new THREE.TorusGeometry(IN - 0.05, 0.12, 6, 72), black);
    lip.rotation.y = Math.PI / 2;
    lip.position.x = s * (W - 0.1);
    root.add(lip);
  }
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.4, 18), brass);
  cap.position.y = OUT + 0.2;
  root.add(cap);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 10), steel);
  pin.position.y = OUT + 0.55;
  root.add(pin);
  return root;
}

/** The screen: white paper in a thin black frame, on a carrier. Its origin is on the rail's top, under the paper. */
function createScreen({ black, steel, brass }, picture) {
  const root = new THREE.Group();
  root.name = 'screen';
  root.add(createCarrier({ black, steel, brass }));
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, CARD.bottom - RAIL.carrier + 0.8, 14), steel);
  post.position.y = (CARD.bottom + RAIL.carrier) / 2 - RAIL.top;
  root.add(post);
  const h = CARD.top - CARD.bottom;
  const w = CARD.half * 2;
  const paperMat = new THREE.MeshStandardMaterial({ name: 'ScreenPaper', color: 0xf6f6f1, roughness: 0.9, emissive: 0x3c3d40 });
  const paper = new THREE.Mesh(new THREE.BoxGeometry(0.12, h, w), paperMat);
  paper.position.y = (CARD.top + CARD.bottom) / 2 - RAIL.top;
  paper.castShadow = true;
  root.add(paper);
  // the frame: four thin bars round the paper
  const bars = [
    [0.5, 0.5, w + 1, 0, h / 2 + 0.25],
    [0.5, 0.5, w + 1, 0, -h / 2 - 0.25],
    [0.5, h, 0.5, w / 2 + 0.25, 0],
    [0.5, h, 0.5, -w / 2 - 0.25, 0],
  ];
  for (const [a, b, c, z, y] of bars) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), black);
    bar.position.set(0.12, paper.position.y + y, z);
    root.add(bar);
  }
  // what falls on the paper: the pencil's picture, blurred by reading a smaller copy of it (the sister figure's way)
  const uniforms = { labBias: { value: 0 }, labZoom: { value: 1 }, labBoost: { value: 1 }, labBox: { value: new THREE.Vector4() } };
  const patchMat = new THREE.MeshBasicMaterial({ name: 'ScreenPicture', map: picture, transparent: true, depthWrite: false, toneMapped: false });
  patchMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLabP;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvLabP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vLabP;\nuniform float labBias;\nuniform float labZoom;\nuniform float labBoost;\nuniform vec4 labBox;',
      )
      .replace(
        '#include <map_fragment>',
        `if (vLabP.y < labBox.x || vLabP.y > labBox.y || abs(vLabP.z) > labBox.z) discard;
        vec4 labTex = texture2D(map, 0.5 + (vMapUv - 0.5) * labZoom, labBias);
        diffuseColor.rgb *= labTex.rgb / max(labTex.a, 0.02);
        vec2 labE = min(vMapUv, 1.0 - vMapUv);
        diffuseColor.a *= clamp(labTex.a * labBoost, 0.0, 1.0) * smoothstep(0.0, 0.11, min(labE.x, labE.y));`,
      );
  };
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), patchMat);
  patch.rotation.y = -Math.PI / 2; // it faces −x, toward the lens (and the camera)
  patch.position.x = -0.08;
  patch.renderOrder = 2;
  patch.userData.noExport = true;
  root.add(patch);
  return { root, paper, patch, patchMat, uniforms };
}

export function createSetting({ stage, shadow, t, transparent = false }) {
  const { scene, renderer } = stage;
  if (!transparent) scene.background = backdropTexture();

  // the table: a plain light-sand top, finite, the blue all round it
  const table = new THREE.Mesh(
    new RoundedBoxGeometry(190, 3, 56, 2, 0.9),
    new THREE.MeshStandardMaterial({ name: 'Table', color: 0xcdbb98, roughness: 0.86, metalness: 0, envMapIntensity: 0.4 }),
  );
  table.position.set(7, -1.5, 4);
  table.receiveShadow = true;
  table.userData.noExport = true;
  scene.add(table);

  const glow = glowTexture();
  const mats = {
    alu: new THREE.MeshStandardMaterial({ name: 'Aluminium', color: 0xb4bcc6, roughness: 0.42, metalness: 0.85 }),
    black: new THREE.MeshStandardMaterial({ name: 'BlackAnodised', color: 0x1b1f24, roughness: 0.46, metalness: 0.55 }),
    steel: new THREE.MeshStandardMaterial({ name: 'Steel', color: 0xb9c0c9, roughness: 0.3, metalness: 0.92 }),
    brass: new THREE.MeshStandardMaterial({ name: 'Brass', color: 0xc9a227, roughness: 0.34, metalness: 0.95 }),
  };

  const apparatus = new THREE.Group();
  apparatus.name = 'optical-bench';
  scene.add(apparatus);
  apparatus.add(createRail(t, mats));

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

  const screen = createScreen(mats, pencilPicture());
  screen.root.position.y = RAIL.top;
  apparatus.add(screen.root);

  // The image X′Y′: a solid pencil hanging upside down (real) or a ghost at 45 % standing upright (virtual). Both draw last, each from
  // a fresh depth: an image is not stopped by the rail or the glass.
  const whole = parts.wholeGeo();
  const solid = new THREE.Mesh(
    whole,
    new THREE.MeshStandardMaterial({ name: 'ImageReal', vertexColors: true, roughness: 0.46, transparent: true, side: THREE.DoubleSide }),
  );
  const ghost = new THREE.Mesh(
    whole,
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
  for (const m of [solid, ghost]) {
    m.renderOrder = 6;
    m.visible = false;
    m.userData.noExport = true;
    m.onBeforeRender = (r) => r.clearDepth();
    scene.add(m);
  }
  solid.rotation.x = Math.PI; // upside down, its Y′ on the axis

  // the bright spot where the light gathers, and the point of light of চিত্র ৯.২২
  const sprite = (color) => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glow,
        color,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
        opacity: 0,
      }),
    );
    s.renderOrder = 7;
    s.visible = false;
    s.userData.noExport = true;
    scene.add(s);
    return s;
  };
  const star = sprite(0xffd76e);
  const source = sprite(0xfff1b8);

  // big invisible targets for a finger: the pencil and its stand, the screen, and the numbered ring
  const hidden = new THREE.MeshBasicMaterial({ visible: false });
  const hit = new THREE.Mesh(new THREE.BoxGeometry(10, 30, 12), hidden);
  hit.position.y = RAIL.axis - 5;
  hit.userData.noExport = true;
  pencil.add(hit);
  const screenHit = new THREE.Mesh(new THREE.BoxGeometry(10, 24, 12), hidden);
  screenHit.position.y = 11;
  screenHit.userData.noExport = true;
  screen.root.add(screenHit);
  const tapTarget = new THREE.Mesh(new THREE.SphereGeometry(6, 10, 8), hidden);
  tapTarget.userData.noExport = true;
  scene.add(tapTarget);

  // the lights: a warm key from the front left (soft shadows on the table) and a cool sky fill
  const key = new THREE.DirectionalLight(0xfff3e4, transparent || !shadow ? 2.2 : 2);
  key.position.set(-30, 95, 60);
  key.target.position.set(4, 0, 0);
  scene.add(key, key.target);
  if (shadow) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0008;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = 4;
    Object.assign(key.shadow.camera, { left: -80, right: 92, top: 26, bottom: -26, near: 40, far: 190 });
  }
  scene.add(new THREE.HemisphereLight(0xdfeaff, 0x5a5040, 1.15));

  return {
    apparatus,
    hit,
    screenHit,
    tapTarget,
    glass,
    /** Parts of later steps, hidden at the start: the stage compiles their shaders ahead. */
    later: [screen.root, solid, ghost, star, source],
    placePencil(u) {
      pencil.position.x = -u;
    },
    /** The image at x = v, of size m, grown to the share k from Y′: real ones hang under the axis, virtual ones stand on it. */
    placeImage(kind, v, sizeM, k) {
      const show = kind === 'real' ? solid : ghost;
      const hide = kind === 'real' ? ghost : solid;
      hide.visible = false;
      show.visible = kind !== 'none' && k > 0.01 && Number.isFinite(v);
      if (!show.visible) return;
      show.position.set(v, RAIL.axis, 0);
      show.scale.set(Math.max(0.6, sizeM), Math.max(0.001, sizeM * k), Math.max(0.6, sizeM));
    },
    /** The screen at s, in by k (0: away past the end of the rail); a picture of height `length` from the axis at `tip`, spread by `blur`. */
    placeScreen(k, s, { length, tip, blur, gain }) {
      screen.root.visible = k > 0.01;
      screen.root.position.x = s + (1 - k) * 70;
      const un = screen.uniforms;
      const on = gain > 0.004 && length > 0.01;
      screen.patch.visible = on;
      if (!on) return;
      const H = Math.max(length / 0.75, (length + blur) * 1.4);
      screen.patch.scale.set(H, H, 1);
      screen.patch.position.y = RAIL.axis - RAIL.top + tip / 2;
      un.labZoom.value = (H * 0.75) / length;
      un.labBias.value = Math.max(0, Math.log2((blur / length) * 384 + 1) - 0.4);
      un.labBox.value.set(CARD.bottom, CARD.top, CARD.half, 0);
      un.labBoost.value = 1 + Math.min(5, (blur / length) * 2.5);
      screen.patchMat.opacity = Math.min(1, 0.3 + gain * 1.1) * k;
    },
    /** The bright spot at (x, y above the axis) of strength k. */
    placeStar(x, y, k, size = 6) {
      star.visible = k > 0.01;
      star.position.set(x, RAIL.axis + y, 0);
      star.scale.setScalar(size);
      star.material.opacity = k;
    },
    /** The point of light at F (চিত্র ৯.২২), of strength k. */
    placeSource(x, k) {
      source.visible = k > 0.01;
      source.position.set(x, RAIL.axis, 0);
      source.scale.setScalar(5);
      source.material.opacity = k;
    },
    PENCIL_TOP: RAIL.axis + PENCIL,
  };
}
