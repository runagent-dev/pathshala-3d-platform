// The scene, in cm: a calm slate backdrop, a walnut table with no end, two real mirrors in the planes x = ±15, a lit candle
// between them, and its images.
//
// An image is the same candle under a group that puts it where the chain of mirrors puts it: moved along the row, and with
// scale.x = −1 for an odd number of reflections, so it is exact, handle and drips included. It is a ghost, drawn in two
// passes (depth, then colour) so that nothing shows through its own body, and it casts no light and no shadow: only the real
// flame lights the table.
//
// "Looking into the mirror" uses the same images, solid, at the same places. Through M₁ the viewer sees the world behind
// it as a row of slabs, each one reflection further, and the far end of each slab is a picture of a mirror: a window into
// the next slab. So each image is clipped to the windows in front of it (planes through the camera and the edges of what
// is left of the view; rectangles in parallel planes meet in a rectangle, so four planes do). A faint dark quad on each
// window takes 10 % of the light behind it, which is exactly what each reflection does.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { candleGeometry, candleMaterial, createFlame, FLAME_Y, flameClock, solidFlame } from './candle.js';
import { CANDLE, COUNT, GLASS, M, NAMED, REFLECTANCE, row } from './reading.js';

const GHOST = 0.56; // common.md: a virtual image is a translucent ghost of about 45 %; on the dark backdrop, a little more
const FADE = 0.86; // the ghosts fade a little faster than the true 90 %, so that a phone shows the step; see NOTES.md

function gradient(stops, w = 4, h = 256) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const r = g.createLinearGradient(0, 0, 0, h);
  for (const [at, colour] of stops) r.addColorStop(at, colour);
  g.fillStyle = r;
  g.fillRect(0, 0, w, h);
  return { c, g };
}
function texture(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}
const BACKDROP = [
  [0, '#2c4058'],
  [0.5, '#4a6480'],
  [0.8, '#7890a6'],
  [1, '#94a5b5'],
];
/** The wood of the table: long planks along the row, a slow grain, all from one small seeded generator. */
function woodTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d');
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  g.fillStyle = '#a97f5b';
  g.fillRect(0, 0, 512, 256);
  const planks = 4;
  for (let p = 0; p < planks; p++) {
    const y0 = (p * 256) / planks;
    const h = 256 / planks;
    g.fillStyle = ['#ad825d', '#a27855', '#b48a64', '#a87e59'][p];
    g.fillRect(0, y0, 512, h);
    for (let i = 0; i < 46; i++) {
      const y = y0 + rnd() * h;
      g.strokeStyle = `rgba(${rnd() < 0.5 ? '70,44,28' : '206,164,126'},${0.06 + rnd() * 0.12})`;
      g.lineWidth = 0.6 + rnd() * 1.6;
      g.beginPath();
      g.moveTo(-10, y);
      const bow = (rnd() - 0.5) * 7;
      g.bezierCurveTo(170, y + bow, 340, y - bow, 522, y);
      g.stroke();
    }
    g.fillStyle = 'rgba(30,18,12,0.42)';
    g.fillRect(0, y0, 512, 1.4);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2400 / 200, 2400 / 100); // one tile: 200 × 100 cm of table
  t.anisotropy = 4;
  return t;
}
/** The glass as it looks from the side: the room's dim light in it, one slanting sheen. */
function glassTexture() {
  const { c, g } = gradient(
    [
      [0, '#51697f'],
      [0.5, '#7f96a8'],
      [1, '#5d7082'],
    ],
    64,
    256,
  );
  g.fillStyle = 'rgba(255,255,255,0.16)';
  for (const [y0, wide] of [
    [190, 52],
    [118, 16],
  ]) {
    g.beginPath();
    g.moveTo(0, y0);
    g.lineTo(64, y0 - 96);
    g.lineTo(64, y0 - 96 + wide);
    g.lineTo(0, y0 + wide);
    g.closePath();
    g.fill();
  }
  return texture(c);
}

const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
/** Paints a merged part. */
function tinted(g, colour) {
  const n = g.attributes.position.count;
  const col = new Float32Array(n * 3);
  const c = new THREE.Color(colour);
  for (let i = 0; i < n; i++) {
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
/**
 * One mirror, the silver in the plane x = 0, the front toward −x: a slab of glass with bare polished edges, faint green; the
 * grey paint on its back; a steel base with a slot and two small clips. `edge` and `steel` are parts of one mesh each.
 */
function mirrorParts() {
  const { y0, y1, halfW: w } = GLASS;
  const h = y1 - y0;
  const mid = (y0 + y1) / 2;
  const T = 0.6; // the glass, drawn a little thick so that its green edge reads on a phone
  const rim = 0.26;
  const edge = mergeGeometries([
    box(T, rim, 2 * w + 2 * rim, -T / 2, y1 + rim / 2, 0),
    box(T, rim, 2 * w + 2 * rim, -T / 2, y0 - rim / 2, 0),
    box(T, h, rim, -T / 2, mid, w + rim / 2),
    box(T, h, rim, -T / 2, mid, -w - rim / 2),
  ]);
  const back = box(0.14, h + 2 * rim, 2 * w + 2 * rim, 0.07, mid, 0);
  const steel = mergeGeometries([
    box(4.6, 1.1, 2 * w + 4, -0.1, 0.55, 0),
    box(3.0, 0.5, 2 * w + 3, -0.1, 1.35, 0),
    box(1.3, 3.2, 0.9, -0.2, 2.6, w * 0.62),
    box(1.3, 3.2, 0.9, -0.2, 2.6, -w * 0.62),
  ]);
  return { edge, back, steel, T };
}

export function createSetting({ stage, shadow }) {
  const { scene } = stage;
  stage.renderer.localClippingEnabled = true;
  scene.background = texture(gradient(BACKDROP).c);

  // ── light ───────────────────────────────────────────────────────────────────────────────────────────────
  const key = new THREE.DirectionalLight('#e6eef8', 1.5);
  key.position.set(-60, 120, 110);
  scene.add(key, key.target);
  scene.add(new THREE.HemisphereLight('#d3e0ee', '#6b5244', 1.15));
  const fill = new THREE.DirectionalLight('#ffe7d2', 0.3);
  fill.position.set(90, 40, 80);
  scene.add(fill);
  // the only light that comes from a flame: the real one
  const flameLight = new THREE.PointLight('#ffb878', 900, 0, 2);
  scene.add(flameLight);
  if (shadow) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.2;
    key.shadow.radius = 4;
    Object.assign(key.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 20, far: 340 });
  }

  // ── the table ───────────────────────────────────────────────────────────────────────────────────────────
  // no front or back edge: it fades out behind the scene along the view's own depth, so that the line where it meets the
  // backdrop is level at any camera angle (as in plane-mirror-image)
  const TABLE = {
    pmFar: { value: new THREE.Color('#c9c2bd') },
    pmNear: { value: new THREE.Color('#ffffff') },
    pmView: { value: new THREE.Vector3(0, 0, -1) },
    pmFrom: { value: new THREE.Vector3() },
    pmSpan: { value: new THREE.Vector4(0, 1, 0, 1) },
  };
  const wood = woodTexture();
  const tableMat = new THREE.MeshStandardMaterial({ name: 'Table', map: wood, roughness: 0.62, metalness: 0, transparent: true });
  tableMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, TABLE);
    sh.vertexShader = `varying vec3 pmF;\n${sh.vertexShader}`.replace(
      '#include <project_vertex>',
      '#include <project_vertex>\n  pmF = (modelMatrix * vec4(transformed, 1.0)).xyz;',
    );
    sh.fragmentShader = `varying vec3 pmF;
uniform vec3 pmFar; uniform vec3 pmNear; uniform vec3 pmView; uniform vec3 pmFrom; uniform vec4 pmSpan;
${sh.fragmentShader}`.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
  {
    float along = dot(pmF.xz - pmFrom.xz, pmView.xz);
    diffuseColor.rgb *= mix(pmNear, pmFar, smoothstep(pmSpan.x, pmSpan.y, along));
    diffuseColor.a = 1.0 - smoothstep(pmSpan.z, pmSpan.w, along);
  }`,
    );
  };
  tableMat.customProgramCacheKey = () => 'pm2-table-1';
  const table = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400).rotateX(-Math.PI / 2), tableMat);
  table.name = 'Table';
  table.receiveShadow = true;
  table.renderOrder = -1;
  table.userData.noExport = true;
  scene.add(table);
  const hx = new THREE.Vector3();
  /** Sets the table's fade for a camera: it starts just behind the farthest thing shown. */
  function setFloorFade(cam, xmin, xmax) {
    cam.getWorldDirection(hx);
    hx.y = 0;
    hx.normalize();
    const from = cam.position;
    const along = (x, z) => (x - from.x) * hx.x + (z - from.z) * hx.z;
    const far = Math.max(along(xmin, -30), along(xmax, -30));
    const near = Math.min(along(xmin, 30), along(xmax, 30));
    TABLE.pmView.value.copy(hx);
    TABLE.pmFrom.value.set(from.x, 0, from.z);
    TABLE.pmSpan.value.set(near, far, far, far + 170);
  }

  // ── the mirrors ─────────────────────────────────────────────────────────────────────────────────────────
  const parts = mirrorParts();
  const edgeMat = new THREE.MeshStandardMaterial({ name: 'GlassEdge', color: '#58c4a0', roughness: 0.16, metalness: 0, emissive: '#10382c' });
  const backMat = new THREE.MeshStandardMaterial({ name: 'MirrorBack', color: '#8d97a3', roughness: 0.6, metalness: 0.3 });
  const steelMat = new THREE.MeshStandardMaterial({ name: 'Steel', color: '#46505c', roughness: 0.42, metalness: 0.7 });
  const glassMap = glassTexture();
  const glassFront = new THREE.PlaneGeometry(2 * GLASS.halfW, GLASS.y1 - GLASS.y0)
    .rotateY(-Math.PI / 2)
    .translate(-parts.T, (GLASS.y0 + GLASS.y1) / 2, 0);
  const glassM2 = new THREE.MeshBasicMaterial({ name: 'Glass', map: glassMap, toneMapped: false });
  // M₁'s glass can fade away, to the view through it; it paints over what stands behind it, so it comes after the images
  const glassM1 = new THREE.MeshBasicMaterial({ name: 'GlassM1', map: glassMap, toneMapped: false, transparent: true, depthWrite: false });
  function mirror(name, plane, facing, glassMaterial) {
    const g = new THREE.Group();
    g.name = name;
    g.position.x = plane;
    g.rotation.y = facing;
    for (const [part, geometry, material] of [
      ['Edge', parts.edge, edgeMat],
      ['Back', parts.back, backMat],
      ['Base', parts.steel, steelMat],
    ]) {
      const m = new THREE.Mesh(geometry, material);
      m.name = `${name}-${part}`;
      m.castShadow = true;
      m.receiveShadow = part === 'Base';
      g.add(m);
    }
    const glass = new THREE.Mesh(glassFront, glassMaterial);
    glass.name = `${name}-Glass`;
    g.add(glass);
    scene.add(g);
    return { group: g, glass, back: g.children[1] };
  }
  const m1 = mirror('MirrorM1', M.m1, 0, glassM1);
  const m2 = mirror('MirrorM2', M.m2, Math.PI, glassM2);
  m1.glass.renderOrder = 60;

  // ── the candle and its images ───────────────────────────────────────────────────────────────────────────
  const geometry = candleGeometry();
  const real = new THREE.Group();
  real.name = 'Candle';
  const body = new THREE.Mesh(geometry, candleMaterial());
  body.name = 'CandleBody';
  body.castShadow = true;
  body.receiveShadow = true;
  const realFlame = createFlame();
  realFlame.position.y = FLAME_Y;
  realFlame.renderOrder = 61;
  real.add(body, realFlame);
  scene.add(real);

  const planes = Array.from({ length: COUNT + 1 }, () => [new THREE.Plane(), new THREE.Plane(), new THREE.Plane(), new THREE.Plane()]);
  const passAll = (list) => {
    for (const p of list) p.set(new THREE.Vector3(1, 0, 0), 1e7);
  };
  for (const list of planes) passAll(list);
  const images = new Map();
  for (const im of row(0)) {
    const g = new THREE.Group();
    g.name = `Image-${im.id}`;
    g.visible = false;
    const clip = im.side === 'r' ? planes[im.k] : null;
    const pre = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ colorWrite: false, transparent: true, clippingPlanes: clip }));
    pre.userData.noExport = true;
    const mat = candleMaterial({ glow: 0.75, name: `Image-${im.id}`, transparent: true });
    mat.depthWrite = false;
    mat.clippingPlanes = clip;
    const col = new THREE.Mesh(geometry, mat);
    const flame = createFlame();
    flame.material.clippingPlanes = clip;
    flame.position.y = FLAME_Y;
    const order = 30 - 3 * im.k;
    pre.renderOrder = order;
    col.renderOrder = order + 1;
    flame.renderOrder = order + 2;
    g.add(pre, col, flame);
    scene.add(g);
    images.set(im.id, { ...im, group: g, mat, flame, alpha: 0 });
  }

  // ── what the view into M₁ needs: the pictures of the two mirrors, and what each reflection takes ───────────
  const windows = new THREE.Group();
  windows.name = 'Windows';
  windows.userData.noExport = true;
  windows.visible = false;
  const frameGeo = mergeGeometries([tinted(parts.edge.clone(), '#58c4a0'), tinted(parts.steel.clone(), '#46505c')]);
  const quad = new THREE.PlaneGeometry(2 * GLASS.halfW, GLASS.y1 - GLASS.y0).rotateY(Math.PI / 2).translate(0, (GLASS.y0 + GLASS.y1) / 2, 0);
  const tints = [];
  for (let k = 0; k <= COUNT; k++) {
    const plane = M.m1 + k * M.gap;
    if (k > 0) {
      const frame = new THREE.Mesh(
        frameGeo,
        new THREE.MeshStandardMaterial({ name: 'Frame', vertexColors: true, roughness: 0.4, clippingPlanes: planes[k] }),
      );
      frame.position.x = plane;
      frame.scale.x = k % 2 ? -1 : 1;
      windows.add(frame);
    }
    // the last window is not a mirror to look through: it stands for the rest of the endless row, faded out
    const tint = new THREE.Mesh(
      quad,
      new THREE.MeshBasicMaterial({
        name: 'Tint',
        color: k === COUNT ? '#27384c' : '#1c2f2a',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        clippingPlanes: k > 0 ? planes[k] : null,
      }),
    );
    tint.position.x = plane - 0.02;
    tint.renderOrder = 30 - 3 * (k + 1) + 2.5;
    tint.userData.keep = k === COUNT ? 0.88 : 1 - REFLECTANCE;
    tints.push(tint);
    windows.add(tint);
  }
  scene.add(windows);

  // ── changes ─────────────────────────────────────────────────────────────────────────────────────────────
  let inside = 0;
  function paintImages() {
    const a = Math.max(0, 1 - inside * 2); // the ghosts go…
    const b = Math.max(0, inside * 2 - 1); // …and then the real view comes through the glass
    for (const im of images.values()) {
      const ghost = im.alpha * a * GHOST * FADE ** (im.k - 1);
      const solid = im.side === 'r' ? b : 0;
      const on = inside > 0.5 ? solid : ghost;
      im.group.visible = on > 0.004;
      im.mat.opacity = on;
      im.flame.material.uniforms.uLight.value = inside > 0.5 ? solid : Math.min(1, im.alpha * a * (0.88 * FADE ** (im.k - 1)));
    }
  }
  function setCandle(x) {
    real.position.x = x;
    flameLight.position.set(x, 21, 0);
    for (const q of row(x)) images.get(q.id).group.position.x = q.x;
    for (const im of images.values()) im.group.scale.x = im.flipped ? -1 : 1;
  }
  /** How far each image has come, 0 … 1, by id. */
  function setImage(id, a) {
    images.get(id).alpha = a;
    paintImages();
  }
  /** 0 the row of ghosts, 1 the real view into M₁. */
  function setInside(k) {
    inside = k;
    const b = Math.max(0, k * 2 - 1);
    glassM1.opacity = 1 - b;
    windows.visible = k > 0.5;
    m1.back.visible = k <= 0.5; // the way through the glass is the view into the mirror
    for (const q of tints) q.material.opacity = q.userData.keep * b;
    if (k <= 0.5) for (const list of planes) passAll(list);
    paintImages();
  }
  const na = new THREE.Vector3();
  const nb = new THREE.Vector3();
  const nc = new THREE.Vector3();
  const mid = new THREE.Vector3();
  function edgePlane(p, C, ax, ay, az, bx, by, bz) {
    na.set(ax, ay, az).sub(C);
    nb.set(bx, by, bz).sub(C);
    nc.crossVectors(na, nb).normalize();
    p.normal.copy(nc);
    p.constant = -nc.dot(C);
    if (p.distanceToPoint(mid) < 0) p.negate();
  }
  /** Cuts each slab behind M₁ to what can be seen of it through the windows in front of it, from this camera. */
  function updateClip(cam) {
    if (inside <= 0.5) return;
    const C = cam.position;
    const X = M.m1;
    let y0 = GLASS.y0;
    let y1 = GLASS.y1;
    let z0 = -GLASS.halfW;
    let z1 = GLASS.halfW;
    for (let k = 1; k <= COUNT; k++) {
      const list = planes[k];
      if (y1 <= y0 || z1 <= z0 || C.x >= X - 0.1) {
        for (const p of list) p.set(nc.set(1, 0, 0), -1e7);
      } else {
        mid.set(X, (y0 + y1) / 2, (z0 + z1) / 2);
        edgePlane(list[0], C, X, y0, z0, X, y0, z1);
        edgePlane(list[1], C, X, y1, z0, X, y1, z1);
        edgePlane(list[2], C, X, y0, z0, X, y1, z0);
        edgePlane(list[3], C, X, y0, z1, X, y1, z1);
      }
      const P = X + k * M.gap;
      const t = (X - C.x) / (P - C.x);
      y0 = Math.max(y0, C.y + (GLASS.y0 - C.y) * t);
      y1 = Math.min(y1, C.y + (GLASS.y1 - C.y) * t);
      z0 = Math.max(z0, C.z + (-GLASS.halfW - C.z) * t);
      z1 = Math.min(z1, C.z + (GLASS.halfW - C.z) * t);
    }
  }
  /** The flames all flicker on one clock. */
  function tickFlames(time) {
    flameClock.value = time;
    flameLight.intensity = 900 + 60 * Math.sin(time * 7.3) + 40 * Math.sin(time * 4.1 + 0.7);
  }

  /** For the book's GLB: the candle, the two mirrors, and the images the book names, faded. */
  function exportModel() {
    const out = new THREE.Group();
    out.name = 'parallel-mirrors';
    const plain = geometry.clone();
    plain.deleteAttribute('aPbr');
    const wax = new THREE.MeshStandardMaterial({ name: 'Candle', vertexColors: true, roughness: 0.55, metalness: 0 });
    const candle = (name, x, flip, opacity) => {
      const g = new THREE.Group();
      g.name = name;
      g.position.x = x;
      g.scale.x = flip ? -1 : 1;
      let material = wax;
      if (opacity < 1) {
        material = wax.clone();
        material.name = `${name}-faded`;
        material.transparent = true;
        material.opacity = opacity;
      }
      const m = new THREE.Mesh(plain, material);
      m.name = `${name}-Body`;
      const f = solidFlame();
      f.position.y = 17.3;
      f.scale.setScalar(1.22);
      if (opacity < 1) {
        f.material = f.material.clone();
        f.material.transparent = true;
        f.material.opacity = opacity;
      }
      g.add(m, f);
      out.add(g);
    };
    candle('Candle', real.position.x, false, 1);
    for (const im of images.values())
      if (im.k <= NAMED && (im.side === 'r' || im.k < NAMED)) candle(im.id, im.group.position.x, im.flipped, GHOST * FADE ** (im.k - 1));
    for (const [m, plane, facing] of [
      [m1, M.m1, 0],
      [m2, M.m2, Math.PI],
    ]) {
      const c = m.group.clone(true);
      c.traverse((n) => {
        if (n.isMesh) n.castShadow = n.receiveShadow = false;
        if (n.isMesh && n.material === glassM1) n.material = glassM2;
      });
      c.position.x = plane;
      c.rotation.y = facing;
      out.add(c);
    }
    return out;
  }

  setCandle(CANDLE.start);
  setInside(0);
  return { setCandle, setImage, setInside, updateClip, tickFlames, setFloorFade, exportModel, real, m1, m2 };
}
