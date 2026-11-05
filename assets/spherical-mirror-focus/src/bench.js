// The chapter's optical bench (shared look for spherical-mirror-focus, convex-mirror-image and concave-mirror-image), in
// centimetres: a calm slate wall and lab table, an anodised aluminium rail with a printed cm scale on its sloping front, black
// sliding carriers. x runs along the rail from the mirror's pole (0 on the scale) toward the light; the scale counts away from
// the mirror on both sides. Only what the idea needs stands on it: the mirror, a ray box or a bulb.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createDish, createHolder } from './mirror.js';
import { BOX_X, BUNDLE, heights, MIRROR, R0, sag } from './reading.js';

/** The heights that matter, cm: the rail's top, the carriers' top, the principal axis, the bench's two ends. */
export const RAIL = { top: 3.2, carrier: 5.6, axis: 19, left: -68, right: 82, front: 5.5 };
/** The scale strip on the sloping front of the rail: where it lies. */
const STRIP = { y0: 0.55, z0: 5.5, y1: 2.35, z1: 3.3 };
export const SCALE_POINT = { y: (STRIP.y0 + STRIP.y1) / 2, z: (STRIP.z0 + STRIP.z1) / 2 };
/** The hollow sphere of the first step floats above the rail, its cap just over the mirror's holder. */
export const SPHERE = { x: R0 + 7, y: 67, r: R0 };
const CAP_ANGLE = Math.asin(MIRROR.half / R0);
/** The piece comes down this far in front of the ring, for this share of its way, before it goes back into it. */
const FRONT = 7;
const DOWN = 0.76;

const box = (a, b, c, d, e, f) => new THREE.Box3(new THREE.Vector3(a, b, c), new THREE.Vector3(d, e, f));
const AXIS = RAIL.axis;

/** What the camera shows at each moment: a box to fill, the angle to see it from. r is the mirror's radius. All read as 3D. */
export const FRAMES = {
  sphere: () => ({ box: box(7, 36, -14, 67, 98, 14), az: 32, el: 8 }),
  cut: () => ({ box: box(-3, 36, -14, 67, 98, 14), az: 32, el: 8 }),
  bench: () => ({ box: box(-12, 0, -11, BOX_X + 6, AXIS + 13, 9), az: 34, el: 13 }),
  focus: (r) => ({ box: box(-3, 0.4, -6, r + 5, AXIS + 12.6, 6), az: 35, el: 12 }),
  measure: (r) => ({ box: box(-5, 0.2, -6, r + 6, AXIS + 12.6, 6), az: 33, el: 11 }),
  wide: (r) => ({ box: box(r * 0.04, AXIS - 7.6, -1, r * 0.64, AXIS + 7.6, 1), az: 30, el: 9 }),
  convex: () => ({ box: box(-12, 0.4, -6, 29, AXIS + 14, 6), az: 36, el: 12 }),
  virtual: (r) => ({ box: box(-r - 4, 0.2, -6, 25, AXIS + 14, 6), az: 33, el: 11 }),
  torch: () => ({ box: box(-3, 0.4, -6, 52, AXIS + 12.6, 6), az: 33, el: 12 }),
};

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
      g.lineWidth = major ? 3 : 2;
      g.beginPath();
      g.moveTo(x, y0 + 4);
      g.lineTo(x, y0 + (major ? 56 : mid ? 40 : 26));
      g.stroke();
      if (major) {
        // the strip has more pixels to a centimetre across than along: the digits are drawn narrow to come out true
        g.save();
        g.translate(x, y0 + 118);
        g.scale(0.5, 1);
        g.font = '600 62px "Noto Sans Bengali", sans-serif';
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

/** The ray box: a lamp in a dark steel case, its light made parallel and let out through a column of small holes in its front. Faces −x; its origin is at the plate, on the axis. */
function createRayBox({ black, steel, paint, glow }) {
  const root = new THREE.Group();
  root.name = 'ray-box';
  const W = 8.5;
  const H = 25;
  const D = 13;
  const body = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 3, 0.4), paint);
  body.position.x = W / 2 + 0.25;
  body.castShadow = true;
  root.add(body);
  const plate = new THREE.Mesh(new RoundedBoxGeometry(0.4, H - 3, D - 3, 2, 0.1), black);
  plate.position.x = 0.15;
  root.add(plate);
  // cooling slots on the top
  const slots = new THREE.InstancedMesh(new THREE.BoxGeometry(5.2, 0.1, 0.5), black, 7);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 7; i++) slots.setMatrixAt(i, m.makeTranslation(W / 2 + 0.25, H / 2 + 0.03, -3.9 + i * 1.3));
  root.add(slots);
  // the post
  const post = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 3, 20), steel);
  post.position.set(W / 2, -H / 2 - 0.2, 0);
  root.add(post);
  // the holes, lit
  const hole = new THREE.CircleGeometry(0.42, 16);
  hole.rotateY(-Math.PI / 2);
  const litMat = new THREE.MeshBasicMaterial({ name: 'RayBoxHole', color: 0x4a4436, toneMapped: false });
  const holes = new THREE.InstancedMesh(hole, litMat, BUNDLE.count);
  holes.position.x = -0.07;
  root.add(holes);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glow,
      color: 0xffc95e,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      opacity: 0,
    }),
  );
  halo.position.x = -0.5;
  halo.userData.noExport = true;
  root.add(halo);
  return {
    root,
    /** half: the half-height of the column of holes, cm; on: 0 … 1, the lamp. */
    set(half, on) {
      heights(half).forEach((y, i) => {
        holes.setMatrixAt(i, m.makeTranslation(0, y, 0));
      });
      holes.instanceMatrix.needsUpdate = true;
      litMat.color.set(0x4a4436).lerp(COLOR_LIT, on);
      halo.material.opacity = 0.75 * on;
      halo.visible = on > 0.01;
      halo.scale.set(11, half * 2 + 10, 1);
    },
  };
}
const COLOR_LIT = new THREE.Color(0xffe9a8);

const v2 = (x, y) => new THREE.Vector2(x, y);

/** A small round bulb on a stalk: its filament at the origin, on the axis, the stalk going down to a carrier. */
function createBulb({ steel, brass, black, glow }) {
  const root = new THREE.Group();
  root.name = 'bulb';
  const glassMat = new THREE.MeshStandardMaterial({
    name: 'BulbGlass',
    color: 0xfff6dc,
    roughness: 0.08,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    emissive: 0xffc95e,
    emissiveIntensity: 0,
  });
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const a = -Math.PI / 2 + ((i / 14) * Math.PI * 7) / 6;
    pts.push(v2(Math.max(0.001, 1.25 * Math.cos(a)), 1.25 * Math.sin(a)));
  }
  pts.reverse();
  const shape = [v2(0.001, 1.25), ...pts.slice(1), v2(0.55, -1.6)];
  const glass = new THREE.Mesh(new THREE.LatheGeometry(shape, 28), glassMat);
  glass.renderOrder = 4;
  root.add(glass);
  const fil = new THREE.MeshBasicMaterial({ name: 'Filament', color: 0x6b5a3a, toneMapped: false });
  const filament = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.07, 8, 20), fil);
  root.add(filament);
  const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.1, 20), brass);
  socket.position.y = -2.05;
  root.add(socket);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.84, 0.5, 20), black);
  collar.position.y = -2.8;
  root.add(collar);
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, RAIL.axis - RAIL.carrier - 3, 14), steel);
  stalk.position.y = -(3 + (RAIL.axis - RAIL.carrier)) / 2;
  stalk.castShadow = true;
  root.add(stalk);
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glow,
      color: 0xffc95e,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      opacity: 0,
    }),
  );
  halo.scale.setScalar(13);
  halo.userData.noExport = true;
  root.add(halo);
  return {
    root,
    set(on) {
      glassMat.emissiveIntensity = 1.6 * on;
      fil.color.set(0x6b5a3a).lerp(COLOR_LIT, on);
      halo.material.opacity = 0.95 * on;
      halo.visible = on > 0.01;
    },
  };
}

/** Glass: a little of the tint, and more of everything where the surface turns away from the eye. */
function shellMaterial(name, side, base, rim) {
  const m = new THREE.MeshStandardMaterial({
    name,
    color: new THREE.Color(0.8, 0.95, 0.92),
    roughness: 0.08,
    transparent: true,
    opacity: base,
    side,
    depthWrite: false,
    envMapIntensity: 1.5,
  });
  const u = { value: 1 };
  m.userData.fade = u;
  m.onBeforeCompile = (shader) => {
    shader.uniforms.labFade = u;
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform float labFade;').replace(
      '#include <opaque_fragment>',
      `#include <opaque_fragment>
        float lab_f = pow(1.0 - saturate(abs(dot(normalize(normal), normalize(vViewPosition)))), 2.4);
        gl_FragColor.rgb += vec3(0.42, 0.78, 0.74) * lab_f * ${rim.toFixed(2)};
        gl_FragColor.a = clamp(gl_FragColor.a + lab_f * ${rim.toFixed(2)}, 0.0, 1.0) * labFade;`,
    );
  };
  return m;
}

/** The hollow glass sphere with the cap taken out: the piece the mirror is cut from. Its cut edge is a thin bright ring. */
function createSphere() {
  const root = new THREE.Group();
  root.name = 'hollow-sphere';
  root.userData.noExport = true;
  const g = new THREE.SphereGeometry(SPHERE.r, 64, 40, 0, Math.PI * 2, CAP_ANGLE, Math.PI - CAP_ANGLE);
  g.rotateZ(Math.PI / 2); // the missing cap goes from the top to −x
  const back = new THREE.Mesh(g, shellMaterial('sphere-inside', THREE.BackSide, 0.06, 0.34));
  back.renderOrder = 1;
  const front = new THREE.Mesh(g, shellMaterial('sphere', THREE.FrontSide, 0.08, 0.56));
  front.renderOrder = 2;
  root.add(back, front);
  const edgeMat = new THREE.MeshBasicMaterial({ name: 'CutEdge', color: 0x7fe3d0, transparent: true, opacity: 0.9, toneMapped: false });
  const edge = new THREE.Mesh(new THREE.TorusGeometry(MIRROR.half, 0.13, 8, 72), edgeMat);
  edge.rotation.y = Math.PI / 2;
  edge.position.x = -SPHERE.r * Math.cos(CAP_ANGLE);
  root.add(edge);
  return {
    root,
    set(k) {
      root.visible = k > 0.01;
      back.material.userData.fade.value = k;
      front.material.userData.fade.value = k;
      edgeMat.opacity = 0.9 * k;
    },
  };
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
    new THREE.BoxGeometry(640, 4, 150),
    new THREE.MeshStandardMaterial({ name: 'Table', color: 0x47566a, map: tableTexture(), roughness: 0.58, metalness: 0.05, envMapIntensity: 0.5 }),
  );
  table.position.set(0, -2, 26);
  table.receiveShadow = true;
  table.userData.noExport = true;
  scene.add(table);

  const glow = glowTexture();
  const mats = {
    alu: new THREE.MeshStandardMaterial({ name: 'Aluminium', color: 0xb4bcc6, roughness: 0.42, metalness: 0.85 }),
    black: new THREE.MeshStandardMaterial({ name: 'BlackAnodised', color: 0x16191d, roughness: 0.46, metalness: 0.55 }),
    steel: new THREE.MeshStandardMaterial({ name: 'Steel', color: 0xb9c0c9, roughness: 0.3, metalness: 0.92 }),
    brass: new THREE.MeshStandardMaterial({ name: 'Brass', color: 0xc9a227, roughness: 0.34, metalness: 0.95 }),
    paint: new THREE.MeshStandardMaterial({ name: 'RayBoxPaint', color: 0x2f3e52, roughness: 0.56, metalness: 0.4 }),
    glow,
  };

  const apparatus = new THREE.Group();
  apparatus.name = 'optical-bench';
  scene.add(apparatus);
  apparatus.add(createRail(t, mats));

  // the mirror: a carrier at 0, a post, a ring, and the dish that hangs in it
  const stand = new THREE.Group();
  stand.name = 'mirror-stand';
  const carrier = createCarrier(mats);
  carrier.position.y = RAIL.top;
  stand.add(carrier);
  const POST = RAIL.axis - RAIL.carrier - MIRROR.half - 1.9;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, POST + 0.4, 20), mats.steel);
  post.position.y = RAIL.carrier + POST / 2;
  post.castShadow = true;
  stand.add(post);
  const yoke = new THREE.Mesh(new RoundedBoxGeometry(9, 0.8, 3.4, 2, 0.12), mats.black); // the ring slides on it
  yoke.position.y = RAIL.axis - MIRROR.half - 1.55;
  yoke.castShadow = true;
  stand.add(yoke);
  const holder = createHolder(mats);
  holder.position.y = RAIL.axis;
  stand.add(holder);
  apparatus.add(stand);

  const dish = createDish();
  apparatus.add(dish.root);

  const sphere = createSphere();
  sphere.root.position.set(SPHERE.x, SPHERE.y, 0);
  scene.add(sphere.root);

  const boxRoot = new THREE.Group();
  const rayBox = createRayBox(mats);
  const boxCarrier = createCarrier(mats);
  rayBox.root.position.set(0, RAIL.axis, 0);
  boxCarrier.position.set(4.25, RAIL.top, 0);
  boxRoot.add(rayBox.root, boxCarrier);
  boxRoot.position.x = BOX_X;
  apparatus.add(boxRoot);

  const bulbRoot = new THREE.Group();
  bulbRoot.name = 'bulb-on-carrier';
  const bulb = createBulb(mats);
  const bulbCarrier = createCarrier(mats);
  bulb.root.position.y = RAIL.axis;
  bulbCarrier.position.y = RAIL.top;
  bulbRoot.add(bulb.root, bulbCarrier);
  bulbRoot.visible = false;
  apparatus.add(bulbRoot);

  // the bright spot where the light gathers
  const star = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glow,
      color: 0xffd76e,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
      opacity: 0,
    }),
  );
  star.renderOrder = 6;
  star.visible = false;
  star.userData.noExport = true;
  scene.add(star);

  // big invisible targets for a finger
  const hit = new THREE.Mesh(new THREE.SphereGeometry(6, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.userData.noExport = true;
  scene.add(hit);
  const bulbHit = new THREE.Mesh(new THREE.SphereGeometry(5.5, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
  bulbHit.position.y = RAIL.axis - 1;
  bulbHit.userData.noExport = true;
  bulbRoot.add(bulbHit);

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
    Object.assign(key.shadow.camera, { left: -96, right: 96, top: 44, bottom: -30, near: 20, far: 190 });
  }
  scene.add(new THREE.HemisphereLight(0xcfe0f4, 0x20262e, 1.1));

  const from = new THREE.Vector3();
  const at = new THREE.Vector3();
  return {
    apparatus,
    hit,
    bulbHit,
    sphere,
    dish,
    /** capOut, mount (0 … 1): from the sphere to the holder; turn: the half turn; coat: the silver; r: the sphere it belongs to. */
    placeMirror({ capOut, mount, turn, coat, r }) {
      dish.setRadius(r);
      dish.setTurn(turn);
      dish.setCoat(coat, turn > 0.5);
      from.set(SPHERE.x - SPHERE.r - capOut * 8, SPHERE.y, 0);
      // down in front of the ring, then back into it
      at.set(FRONT, RAIL.axis, 0);
      from.lerp(at, Math.min(1, mount / DOWN));
      if (mount > DOWN) from.x = FRONT * (1 - (mount - DOWN) / (1 - DOWN));
      from.x -= MIRROR.thick / 2;
      dish.root.position.copy(from);
      // the ring keeps round the edge of the glass, which stands in front of P or behind it
      holder.position.x = sag(r, MIRROR.half) * (1 - 2 * turn) - MIRROR.thick / 2;
    },
    /** box: 1 on the rail, 0 slid away; half: its bundle; on: its lamp. */
    placeBox(boxK, half, on) {
      boxRoot.visible = boxK > 0.01;
      boxRoot.position.x = BOX_X + (1 - boxK) * 70;
      rayBox.set(half, on);
    },
    /** k: 0 away to the right, 1 at x; on: lit. */
    placeBulb(k, x, on) {
      bulbRoot.visible = k > 0.01;
      bulbRoot.position.x = x + (1 - k) * 70;
      bulb.set(on);
    },
    /** The bright spot at (x, axis) of strength k. */
    placeStar(x, k, size = 9) {
      star.visible = k > 0.01;
      star.position.set(x, RAIL.axis, 0);
      star.scale.setScalar(size);
      star.material.opacity = k;
    },
  };
}
