// The chapter's optical bench (the look of spherical-mirror-focus, copied so that the sister figures match), in centimetres: a calm
// slate wall and lab table, an anodised aluminium rail with a printed cm scale on its sloping front, black sliding carriers. x runs
// along the rail from the mirror's pole (0 on the scale) toward the pencil; the scale counts away from the mirror on both sides. On
// it: the concave mirror in its ring and the book's pencil XY on a carrier. Beside it, on a foot of its own behind the rail (the pencil
// and the screen must be able to pass each other: at O the image stands exactly under the pencil): the paper screen.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createStudioEnvironment } from '@shared/stage.js';
import { createDish, createHolder } from './mirror.js';
import { pencilParts, pencilPicture } from './pencil.js';
import { CARD, MIRROR, sag } from './reading.js';

/** The heights that matter, cm: the rail's top, the carriers' top, the principal axis, the bench's two ends. */
export const RAIL = { top: 3.2, carrier: 5.6, axis: 19, left: -68, right: 82, front: 5.5 };
/** The scale strip on the sloping front of the rail: where it lies. */
const STRIP = { y0: 0.55, z0: 5.5, y1: 2.35, z1: 3.3 };
export const SCALE_POINT = { y: (STRIP.y0 + STRIP.y1) / 2, z: (STRIP.z0 + STRIP.z1) / 2 };
/** The pencil's rod stands at the front of its carrier, off the axis: under the pencil is where the image comes at O. */
export const ROD_Z = 5;
/** The foot of the screen, behind the rail. */
const FOOT_Z = -13;

const box = (a, b, c, d, e, f) => new THREE.Box3(new THREE.Vector3(a, b, c), new THREE.Vector3(d, e, f));
const AXIS = RAIL.axis;
/** An image this far from the mirror is left out of the frame: the bench would shrink to nothing, and a tab at the edge says where it is. */
export const SEE_V = 62;

/**
 * What the camera shows at each moment: a box to fill, the angle to see it from. aspect is the view's width ÷ height: on a tall
 * view the frame gives up the margin round its ends, as the sister figure's does, so that the mirror stays big. All read as 3D.
 */
export const FRAMES = {
  // the mirror, the image and the pencil: on a tall view P stays at the edge and the mirror's far half goes, so that the image is big
  story: ({ u, aspect }) => {
    const tall = aspect < 1.25;
    return { box: box(tall ? -0.5 : -5, 1, -1.5, u + (tall ? 1.5 : 3), AXIS + 11.5, 1.5), az: tall ? 40 : 30, el: 9 };
  },
  // the screen and the pencil, turned so that the paper can be seen
  screen: ({ u, s, v }) => ({ box: box(Math.min(s, v) - 9, 0.2, -7, Math.max(u, s) + 4, AXIS + 8, 7), az: 40, el: 10 }),
  // and with the image, wherever it is
  cases: ({ u, img, aspect }) => {
    const tall = aspect < 1.25;
    const near = Math.abs(img.v) <= SEE_V;
    const real = img.kind === 'real' && near;
    const behind = img.kind === 'virtual' && near;
    const x0 = behind ? Math.min(-13, -img.behind - 5) : tall ? -11 : -13;
    const x1 = Math.max(u, real ? img.v : 30) + (tall ? 6 : 10);
    const top = AXIS + (behind ? Math.max(13, Math.min(img.length, 30) + 3) : 13);
    return { box: box(x0, 0.2, -7, x1, top, 7), az: behind ? 24 : tall ? 36 : 30, el: 9 };
  },
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

/** The pencil's stand: a carrier, a rod at its front, a short arm in to the axis and a brass cup. Its origin is on the rail's top. */
function createStand(mats) {
  const root = new THREE.Group();
  root.name = 'pencil-stand';
  root.add(createCarrier(mats));
  const rise = RAIL.axis - RAIL.carrier;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, rise - 0.2, 14), mats.steel);
  rod.position.set(0, RAIL.carrier - RAIL.top + rise / 2 - 0.25, ROD_Z);
  rod.castShadow = true;
  root.add(rod);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, ROD_Z, 12), mats.steel);
  arm.rotation.x = Math.PI / 2;
  arm.position.set(0, RAIL.axis - RAIL.top - 0.34, ROD_Z / 2);
  root.add(arm);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.52, 0.32, 18), mats.brass);
  cup.position.y = RAIL.axis - RAIL.top - 0.14;
  root.add(cup);
  return root;
}

/** The screen: thin white paper in a clip, on an arm from an iron foot behind the rail. Its origin is on the table, under the paper. */
function createScreen({ black, steel }, picture) {
  const root = new THREE.Group();
  root.name = 'screen';
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.9, 28), black);
  foot.position.set(0, 0.45, FOOT_Z);
  foot.castShadow = true;
  root.add(foot);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 5.6, 14), steel);
  post.position.set(0, 3.2, FOOT_Z);
  root.add(post);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, -FOOT_Z, 12), steel);
  arm.rotation.x = Math.PI / 2;
  arm.position.set(0, 5.95, FOOT_Z / 2);
  arm.castShadow = true;
  root.add(arm);
  const clip = new THREE.Mesh(new RoundedBoxGeometry(1, 0.7, CARD.half * 2 + 0.8, 2, 0.1), black);
  clip.position.y = 6.25;
  root.add(clip);
  const paperMat = new THREE.MeshStandardMaterial({ name: 'ScreenPaper', color: 0xf4f5f1, roughness: 0.88, emissive: 0x4a4c50 });
  const h = CARD.top - CARD.bottom;
  const paper = new THREE.Mesh(new THREE.BoxGeometry(0.1, h, CARD.half * 2), paperMat);
  paper.position.y = (CARD.top + CARD.bottom) / 2;
  paper.castShadow = true;
  root.add(paper);

  // what falls on the paper: the pencil's picture, blurred by reading a smaller copy of it. The paper is thin: it shows from both sides
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
        // a smaller copy is mostly empty: its colour is the pencil's, its strength what the spread leaves of it
        diffuseColor.rgb *= labTex.rgb / max(labTex.a, 0.02);
        vec2 labE = min(vMapUv, 1.0 - vMapUv);
        diffuseColor.a *= clamp(labTex.a * labBoost, 0.0, 1.0) * smoothstep(0.0, 0.11, min(labE.x, labE.y));`,
      );
  };
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), patchMat);
  patch.rotation.y = Math.PI / 2; // it faces +x, the eye's side of the paper
  patch.position.x = 0.07;
  patch.renderOrder = 2;
  patch.userData.noExport = true;
  root.add(patch);
  return { root, paper, patch, patchMat, uniforms };
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
  const POST = RAIL.axis - RAIL.carrier - MIRROR.half - 1.9;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, POST + 0.4, 20), mats.steel);
  post.position.y = RAIL.carrier + POST / 2;
  post.castShadow = true;
  standM.add(post);
  const yoke = new THREE.Mesh(new RoundedBoxGeometry(9, 0.8, 3.4, 2, 0.12), mats.black);
  yoke.position.y = RAIL.axis - MIRROR.half - 1.55;
  yoke.castShadow = true;
  standM.add(yoke);
  const holder = createHolder(mats);
  holder.position.set(sag(30, MIRROR.half) - MIRROR.thick / 2, RAIL.axis, 0); // the ring keeps round the edge of the glass, in front of P
  standM.add(holder);
  apparatus.add(standM);

  // the silver reflects a bright studio of its own: in the slate room a polished mirror would look dark
  const pmrem = new THREE.PMREMGenerator(renderer);
  const bright = pmrem.fromScene(createStudioEnvironment({ light: true, key: 1.3, front: 1.5 }), 0.02).texture;
  pmrem.dispose();
  const dish = createDish({ env: bright });
  dish.root.position.set(-MIRROR.thick / 2, RAIL.axis, 0);
  dish.uniforms.labAxis.value = RAIL.axis;
  dish.uniforms.labRodZ.value = ROD_Z;
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

  const screen = createScreen(mats, pencilPicture());
  apparatus.add(screen.root);

  // The image X′Y′. Both draw last, over everything, each from a fresh depth: an image is not stopped by the rail or the glass.
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
      opacity: 0.55,
      emissive: 0x7a6a4a,
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
  star.renderOrder = 7;
  star.visible = false;
  star.userData.noExport = true;
  scene.add(star);

  // big invisible targets for a finger: the pencil and its stand, the screen, and the numbered ring
  const hit = new THREE.Mesh(new THREE.BoxGeometry(10, 30, 12), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = RAIL.axis - 5;
  hit.userData.noExport = true;
  pencil.add(hit);
  const screenHit = new THREE.Mesh(new THREE.BoxGeometry(10, 18, 12), new THREE.MeshBasicMaterial({ visible: false }));
  screenHit.position.y = 12;
  screenHit.userData.noExport = true;
  screen.root.add(screenHit);
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
    Object.assign(key.shadow.camera, { left: -96, right: 96, top: 44, bottom: -30, near: 20, far: 190 });
  }
  scene.add(new THREE.HemisphereLight(0xcfe0f4, 0x20262e, 1.1));

  return {
    apparatus,
    hit,
    screenHit,
    tapTarget,
    dish,
    placePencil(u) {
      pencil.position.x = u;
      dish.uniforms.labPenX.value = u;
    },
    /** The image: at v, of size m, grown to the share k from Y′. Real ones hang under the axis, virtual ones stand on it behind the mirror. */
    placeImage(kind, v, sizeM, k) {
      const show = kind === 'real' ? solid : ghost;
      const hide = kind === 'real' ? ghost : solid;
      hide.visible = false;
      show.visible = kind !== 'none' && k > 0.01 && Number.isFinite(v);
      if (!show.visible) return;
      show.position.set(v, RAIL.axis, 0);
      show.scale.set(sizeM, Math.max(0.001, sizeM * k), sizeM);
    },
    /** The screen at s, in by k (0: away past the end of the rail); a picture of height `length` from the axis at `tip`, spread by `blur`. */
    placeScreen(k, s, { length, tip, blur, gain }) {
      screen.root.visible = k > 0.01;
      screen.root.position.x = s + (1 - k) * 60;
      const u = screen.uniforms;
      const on = gain > 0.004 && length > 0.01;
      screen.patch.visible = on;
      if (!on) return;
      // the picture fills 0.75 of the patch's height: the patch grows with the blur, the pencil stays its size
      const H = Math.max(length / 0.75, (length + blur) * 1.4);
      screen.patch.scale.set(H, H, 1);
      screen.patch.position.y = RAIL.axis + tip / 2;
      u.labZoom.value = (H * 0.75) / length;
      u.labBias.value = Math.max(0, Math.log2((blur / length) * 384 + 1) - 0.4);
      u.labBox.value.set(CARD.bottom, CARD.top, CARD.half, 0);
      u.labBoost.value = 1 + Math.min(5, (blur / length) * 2.5);
      screen.patchMat.opacity = Math.min(1, 0.3 + gain * 1.1) * k;
    },
    /** The bright spot at (x, y above the axis) of strength k. */
    placeStar(x, y, k, size = 8) {
      star.visible = k > 0.01;
      star.position.set(x, RAIL.axis + y, 0);
      star.scale.setScalar(size);
      star.material.opacity = k;
    },
  };
}
