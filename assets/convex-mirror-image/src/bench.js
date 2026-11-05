// The chapter's optical bench (the look of spherical-mirror-focus, copied so that the sister figures match), in centimetres: a calm
// slate wall and lab table, an anodised aluminium rail with a printed cm scale on its sloping front, black sliding carriers. x runs
// along the rail from the mirror's pole (0 on the scale) toward the pencil; the scale counts away from the mirror on both sides. On
// it: the convex mirror in its ring, the book's pencil XY on a carrier, and for topic 8.8.2 a row of seven tall coloured posts.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createDish, createHolder } from './mirror.js';
import { pencilParts } from './pencil.js';
import { EYE_X, MIRROR, POST, ROW_X, ROW_Z, sag } from './reading.js';

/** The heights that matter, cm: the rail's top, the carriers' top, the principal axis, the bench's two ends. */
export const RAIL = { top: 3.2, carrier: 5.6, axis: 19, left: -68, right: 82, front: 5.5 };
/** The scale strip on the sloping front of the rail: where it lies. */
const STRIP = { y0: 0.55, z0: 5.5, y1: 2.35, z1: 3.3 };
export const SCALE_POINT = { y: (STRIP.y0 + STRIP.y1) / 2, z: (STRIP.z0 + STRIP.z1) / 2 };

const box = (a, b, c, d, e, f) => new THREE.Box3(new THREE.Vector3(a, b, c), new THREE.Vector3(d, e, f));
const AXIS = RAIL.axis;
/** Beyond these the frames let the pencil go, and a tab at the edge says where it is. */
export const CAP = { see: 14, near: 13, zoom: 13, rays: 30 };
/** The seven posts: red to violet, each one easy to name. */
export const POST_COLORS = [0xe03131, 0xf76707, 0xf2c200, 0x2f9e44, 0x0ca678, 0x1c7ed6, 0x7048e8];

/** The right end of the close frames: past the pencil while it is near; once it has gone, the farther it is the closer on P → F. */
const closeEnd = (u) => (u <= CAP.near ? u + 3 : Math.max(5, CAP.near + 3 - (u - CAP.near) * 0.5));

/**
 * What the camera shows at each moment: a box to fill, the angle to see it from. u: where the pencil stands; aspect: the view's
 * width ÷ height: on a tall view the bench frame gives up the margin round its ends, so that the mirror stays big. All read as 3D.
 */
export const FRAMES = {
  // nearly along the axis, beside the pencil: the real pencil and the small upright one stand side by side on the silver
  see: (u) => ({ box: box(-1, AXIS - 11.6, -10.6, Math.min(u, CAP.see), AXIS + 11.6, 10.6), az: 68, el: 5 }),
  // the plane of the rays, close: F to the pencil
  near: (u) => ({ box: box(-18, AXIS - 3.5, -1, closeEnd(u), AXIS + 10, 1), az: 20, el: 6 }),
  // out to O, for the ray that goes there
  rays: (u) => ({ box: box(-33, AXIS - 5, -1, Math.min(Math.max(u, 10), CAP.rays) + 4, AXIS + 13, 1), az: 20, el: 6 }),
  // the image alone, as near as the pencil lets it be
  zoom: (u) => ({ box: box(-17.5, AXIS - 2.6, -1, closeEnd(u), AXIS + 7.4, 1), az: 20, el: 6 }),
  // the bench and its scale
  bench: (u, aspect = 1.5) => {
    const end = Math.max(u, 22) + (aspect < 1.25 ? 3 : 5);
    return { box: box(aspect < 1.25 ? -17 : -19, 0.2, -5.5, end, AXIS + 14, 5.5), az: 27, el: 9 };
  },
  // over the bench, the eye and the row in view
  wide: () => ({ box: box(-10, AXIS - 6, -62, 76, AXIS + 7, 62), az: 10, el: 60 }),
};
/** The eye itself: this camera stands exactly where the eye of the cones stands. */
export const EYE = { position: new THREE.Vector3(EYE_X, AXIS, 0), target: new THREE.Vector3(0, AXIS, 0) };

function backdropGeometry() {
  const g = new THREE.SphereGeometry(520, 40, 20);
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  const d = new THREE.Vector3();
  const back = new THREE.Vector3(-0.42, 0.14, -1).normalize();
  for (let i = 0; i < p.count; i++) {
    d.fromBufferAttribute(p, i).normalize();
    // slate: lighter behind the mirror, so that its rim stands out and the rays glow
    const k = Math.max(0, d.dot(back));
    const v = 0.034 + 0.1 * k ** 5 + 0.05 * k ** 24;
    c[i * 3] = v * 0.84;
    c[i * 3 + 1] = v;
    c[i * 3 + 2] = v * 1.26;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}

/** The table top: painted slate with a fine grain. */
function tableTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const y = Math.random() * 512;
    g.strokeStyle = `rgba(0,0,0,${0.006 + Math.random() * 0.016})`;
    g.lineWidth = 0.5 + Math.random() * 1.2;
    g.beginPath();
    g.moveTo(Math.random() * 512, y);
    g.lineTo(Math.random() * 512, y + (Math.random() - 0.5) * 5);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 3);
  t.anisotropy = 4;
  return t;
}

/**
 * The printed scale: two strips in one 1024 × 256 texture, so that each centimetre gets 14 px. Row 0 runs 0 → 80 cm toward the
 * light, row 1 runs 0 → 70 cm behind the mirror. Black on the rail's satin silver, a tick each cm, a longer one each 5, a number
 * each 10.
 */
function scaleTexture(t) {
  const W = 1024;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#b7bfc9';
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
      g.lineWidth = major ? 4 : 2.4;
      g.beginPath();
      g.moveTo(x, y0 + 4);
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
  // the section, in (z, y), round the rail from the back foot; each flat gets its own two triangles and a flat normal
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
  // the two printed strips on the slope
  const tex = scaleTexture(t);
  const scaleMat = new THREE.MeshStandardMaterial({ name: 'Scale', map: tex, roughness: 0.46, metalness: 0.15 });
  const strip = (xa, xb, v0, v1) => {
    const geo = new THREE.BufferGeometry();
    const inset = 0.08;
    const y0 = STRIP.y0 + inset * 0.6;
    const y1 = STRIP.y1 - inset * 0.6;
    const z0 = STRIP.z0 - inset * 0.8;
    const z1 = STRIP.z1 + inset * 0.8;
    const lift = 0.012;
    const corners = [xa, y0 + lift, z0 + lift, xb, y0 + lift, z0 + lift, xb, y1 + lift, z1 + lift, xa, y1 + lift, z1 + lift];
    const uv = [0, v0, 1, v0, 1, v1, 0, v1];
    geo.setAttribute('position', new THREE.Float32BufferAttribute(corners, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, scaleMat);
    root.add(m);
    return m;
  };
  const pad = 0.0078 * 80; // the 4 px at the ends of a row, in cm
  strip(-pad * (70 / 80), 80 + pad, 0.5, 1); // 0 → 80, the top row of the canvas
  strip(-70 - pad * (70 / 80), pad * (70 / 80), 0, 0.5); // 70 → 0, its bottom row
  // the end caps and two feet
  for (const x of [RAIL.left - 0.3, RAIL.right + 0.3]) {
    const cap = new THREE.Mesh(new RoundedBoxGeometry(0.6, RAIL.top + 0.2, 11.4, 2, 0.1), black);
    cap.position.set(x, RAIL.top / 2, 0);
    root.add(cap);
  }
  return root;
}

/** A black sliding carrier on the rail, with a thumb screw and a brass pointer that reads the scale. Its origin is on the rail's top, at the pointer. */
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

/** A short rod on a carrier: the pencil stands on its top, Y on the axis. Its origin is on the rail's top. */
function createStand({ black, brass, steel }) {
  const root = new THREE.Group();
  root.name = 'pencil-stand';
  root.add(createCarrier({ black, brass, steel }));
  const rise = RAIL.axis - RAIL.carrier;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, rise, 14), steel);
  rod.position.y = RAIL.carrier - RAIL.top + rise / 2 - 0.15;
  rod.castShadow = true;
  root.add(rod);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.52, 0.32, 18), brass);
  cup.position.y = RAIL.axis - RAIL.top - 0.1;
  root.add(cup);
  return root;
}

export function createSetting({ stage, shadow, t }) {
  const { scene, renderer } = stage;
  const back = new THREE.Mesh(
    backdropGeometry(),
    new THREE.MeshBasicMaterial({ name: 'backdrop', vertexColors: true, side: THREE.BackSide, dithering: true, toneMapped: false, fog: false }),
  );
  back.userData.noExport = true;
  scene.add(back);

  const table = new THREE.Mesh(
    new THREE.BoxGeometry(640, 4, 200),
    new THREE.MeshStandardMaterial({ name: 'Table', color: 0x47566a, map: tableTexture(), roughness: 0.58, metalness: 0.05, envMapIntensity: 0.5 }),
  );
  table.position.set(0, -2, 16);
  table.receiveShadow = true;
  table.userData.noExport = true;
  scene.add(table);

  const mats = {
    alu: new THREE.MeshStandardMaterial({ name: 'Aluminium', color: 0xb4bcc6, roughness: 0.42, metalness: 0.85 }),
    black: new THREE.MeshStandardMaterial({ name: 'BlackAnodised', color: 0x16191d, roughness: 0.46, metalness: 0.55 }),
    steel: new THREE.MeshStandardMaterial({ name: 'Steel', color: 0xb9c0c9, roughness: 0.3, metalness: 0.92 }),
    brass: new THREE.MeshStandardMaterial({ name: 'Brass', color: 0xc9a227, roughness: 0.34, metalness: 0.95 }),
  };

  const apparatus = new THREE.Group();
  apparatus.name = 'optical-bench';
  scene.add(apparatus);
  apparatus.add(createRail(t, mats));

  // the mirror: a carrier at 0, a post, a ring, and the dish in it
  const standM = new THREE.Group();
  standM.name = 'mirror-stand';
  const carrier = createCarrier(mats);
  carrier.position.y = RAIL.top;
  standM.add(carrier);
  const STEM = RAIL.axis - RAIL.carrier - MIRROR.half - 1.9;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, STEM + 0.4, 20), mats.steel);
  stem.position.y = RAIL.carrier + STEM / 2;
  stem.castShadow = true;
  standM.add(stem);
  const yoke = new THREE.Mesh(new RoundedBoxGeometry(9, 0.8, 3.4, 2, 0.12), mats.black);
  yoke.position.y = RAIL.axis - MIRROR.half - 1.55;
  yoke.castShadow = true;
  standM.add(yoke);
  const holder = createHolder(mats);
  holder.position.y = RAIL.axis;
  standM.add(holder);
  apparatus.add(standM);

  const dish = createDish();
  dish.root.position.set(-MIRROR.thick / 2, RAIL.axis, 0);
  dish.uniforms.labAxis.value = RAIL.axis;
  dish.uniforms.labRail.value.set(RAIL.top, RAIL.front);
  POST_COLORS.forEach((c, i) => dish.uniforms.labPostColor.value[i].set(c));
  apparatus.add(dish.root);

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

  // the row of seven tall coloured posts, for topic 8.8.2: one geometry, seven colours
  const row = new THREE.Group();
  row.name = 'post-row';
  row.visible = false;
  const shaft = new THREE.CylinderGeometry(POST.radius, POST.radius, POST.shoulder, 24, 1, true);
  shaft.translate(0, POST.shoulder / 2, 0);
  const cap = new THREE.ConeGeometry(POST.radius, POST.top - POST.shoulder, 24, 1, true);
  cap.translate(0, POST.shoulder + (POST.top - POST.shoulder) / 2, 0);
  const posts = new THREE.InstancedMesh(
    mergeGeometries([shaft, cap]),
    new THREE.MeshStandardMaterial({ name: 'Post', roughness: 0.42, metalness: 0.05 }),
    ROW_Z.length,
  );
  posts.castShadow = true;
  posts.frustumCulled = false;
  const feet = new THREE.InstancedMesh(new THREE.CylinderGeometry(3, 3.2, 0.8, 24), mats.black, ROW_Z.length);
  feet.frustumCulled = false;
  POST_COLORS.forEach((c, i) => posts.setColorAt(i, new THREE.Color(c)));
  row.add(posts, feet);
  apparatus.add(row);

  // the image X′Y′: a translucent ghost behind the mirror, drawn through it
  const ghostMat = new THREE.MeshStandardMaterial({
    name: 'ImageGhost',
    vertexColors: true,
    roughness: 0.5,
    transparent: true,
    opacity: 0.5,
    depthTest: false,
    depthWrite: false,
    emissive: 0x7a6a4a,
    side: THREE.DoubleSide,
  });
  const ghost = new THREE.Mesh(parts.wholeGeo(), ghostMat);
  ghost.renderOrder = 6;
  ghost.visible = false;
  ghost.userData.noExport = true;
  scene.add(ghost);

  // a big invisible target for a finger: the pencil and its stand
  const hit = new THREE.Mesh(new THREE.BoxGeometry(11, 30, 12), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = RAIL.axis - 5;
  hit.userData.noExport = true;
  pencil.add(hit);
  const tapTarget = new THREE.Mesh(new THREE.SphereGeometry(6, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
  tapTarget.userData.noExport = true;
  scene.add(tapTarget);

  // the lights
  const key = new THREE.DirectionalLight(0xfff3e4, 2.1);
  key.position.set(30, 90, 50);
  key.target.position.set(10, 0, 0);
  scene.add(key, key.target);
  if (shadow) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0008;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = 5;
    Object.assign(key.shadow.camera, { left: -100, right: 100, top: 80, bottom: -70, near: 20, far: 220 });
  }
  scene.add(new THREE.HemisphereLight(0xcfe0f4, 0x20262e, 1.1));

  const uPencil = dish.uniforms.labPencil.value;
  const uPost = dish.uniforms.labPost.value;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const at = new THREE.Vector3();
  const size = new THREE.Vector3();
  let lastRow = -1;
  return {
    apparatus,
    hit,
    tapTarget,
    dish,
    /** The mirror: its radius, cm (the same dish goes flat for the plane mirror). The ring keeps round the edge of the glass. */
    placeMirror(r) {
      dish.setRadius(r);
      holder.position.x = -sag(r, MIRROR.half) - MIRROR.thick / 2;
    },
    /** The pencil at u. inMirror: drawn in the silver. */
    placePencil(u, inMirror = true, shown = true) {
      pencil.position.x = u;
      pencil.visible = shown;
      uPencil.set(u, 0, inMirror ? 1 : 0);
    },
    /** The row grows up from the table as k goes to 1. Where it stands on the rail it stands on the rail. */
    placeRow(k) {
      if (k === lastRow) return;
      lastRow = k;
      row.visible = k > 0.001;
      ROW_Z.forEach((z, i) => {
        const y = Math.abs(z) < RAIL.front + 3 ? RAIL.top : 0;
        at.set(ROW_X, y, z);
        size.set(1, Math.max(0.001, k * ((POST.top - y) / POST.top)), 1);
        posts.setMatrixAt(i, m.compose(at, q, size));
        at.y = y + 0.4;
        size.set(1, 1, 1);
        feet.setMatrixAt(i, m.compose(at, q, size));
        uPost[i].set(ROW_X, z, k > 0.001 ? 1 : 0);
      });
      posts.instanceMatrix.needsUpdate = true;
      feet.instanceMatrix.needsUpdate = true;
    },
    /** The image: at v (< 0), of size m, grown to the share k from Y′ up. */
    placeImage(v, sizeM, k) {
      ghost.visible = k > 0.01;
      ghost.position.set(v, RAIL.axis, 0);
      ghost.scale.set(sizeM, Math.max(0.001, sizeM * k), sizeM);
    },
  };
}
