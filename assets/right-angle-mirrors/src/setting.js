// The scene, in metres: a calm slate backdrop, a plain floor, two real mirrors hinged on the vertical line through O, the boy
// and, for the book's plan (চিত্র ৮.১৫), a left fist.
//
// What is seen in the mirrors is exact and costs no render to texture. A plane mirror shows the world reflected in its plane,
// so each image is the same geometry under the mirror's own transform (a matrix with determinant −1), drawn only through the
// mirror's frame: four clipping planes from the camera through the frame's edges. An image of an image is the same under two
// transforms, cut by the first mirror's frame and by the picture of the second mirror in the first: eight planes. Between 90°
// and 180° no light can meet the mirrors more than twice, so a mirror each way and two double images are all there is, and
// at 90° the two double images are the same one, parted by the hinge. Depth does the rest.
//
// On the plan the fist's images are the chapter's translucent ghosts, standing in the book's quarters, drawn in two passes
// (depth, then colour) so that nothing shows through their own bodies.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { boyGeometry } from './boy.js';
import { fistGeometry } from './fist.js';
import { BOY_AT, FIST_AT, mirrors, PLAN, planPoint, WING } from './reading.js';

const GHOST = 0.45; // common.md: a virtual image is a translucent ghost of about 45 %
const CARD = { w: 0.36, h: 0.18, lift: 0.075, z: 0.05 };
const FLOOR_TONE = { far: new THREE.Color('#d9c8b4'), near: new THREE.Color('#b99e84') };
const PLAN_TONE = { far: new THREE.Color('#5f7387'), near: new THREE.Color('#4f6377') };
const BACKDROP = [
  [0, '#31475f'],
  [0.46, '#50697f'],
  [0.78, '#7f94a6'],
  [1, '#a3aeb6'],
];

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
/** The film on the glass: a pale silver, stronger near the edges, and one slanting sheen. */
function glassTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d');
  const r = g.createLinearGradient(0, 0, 0, 256);
  r.addColorStop(0, 'rgba(226,238,242,0.3)');
  r.addColorStop(0.6, 'rgba(208,224,230,0.2)');
  r.addColorStop(1, 'rgba(190,206,212,0.28)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 256);
  g.fillStyle = 'rgba(255,255,255,0.13)';
  for (const [y0, wide] of [
    [190, 62],
    [110, 20],
  ]) {
    g.beginPath();
    g.moveTo(0, y0);
    g.lineTo(128, y0 - 150);
    g.lineTo(128, y0 - 150 + wide);
    g.lineTo(0, y0 + wide);
    g.closePath();
    g.fill();
  }
  return texture(c);
}
/** The card he holds: the word on a white card with a blue edge, on both faces. */
function cardTexture(word) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#fbfaf5';
  g.fillRect(0, 0, 512, 256);
  g.strokeStyle = '#1c6fd9';
  g.lineWidth = 16;
  g.strokeRect(10, 10, 492, 236);
  g.fillStyle = '#14233a';
  g.font = '700 150px "Noto Sans Bengali", "Helvetica Neue", Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(word, 256, 134, 460);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
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
 * One wing of the mirror, running along s·x from the hinge, the silver in the plane z = 0, the front toward +z: bare polished
 * glass edges, faint green; the grey paint on its back; a steel rail along the floor.
 */
function wingParts(s) {
  const { w: W, y0, y1 } = WING;
  const h = y1 - y0;
  const mid = (y0 + y1) / 2;
  const T = 0.016; // the glass, drawn a little thick so that its green edge reads on a phone
  const rim = 0.016;
  const edge = mergeGeometries([
    box(W + rim, rim, T, (s * (W + rim)) / 2, y1 + rim / 2, T / 2),
    box(W + rim, rim, T, (s * (W + rim)) / 2, y0 - rim / 2, T / 2),
    box(rim, h, T, s * (W + rim / 2), mid, T / 2),
  ]);
  // one-sided: from the front the view goes through to what the mirror shows
  const back = new THREE.PlaneGeometry(W + rim, h + 2 * rim).rotateY(Math.PI).translate((s * (W + rim)) / 2, mid, -0.004);
  const steel = mergeGeometries([
    box(W + 0.02, 0.05, 0.13, (s * W) / 2, 0.025, 0),
    box(0.12, 0.09, 0.2, s * W * 0.82, 0.045, 0),
    box(0.12, 0.09, 0.2, s * W * 0.3, 0.045, 0),
  ]);
  const film = new THREE.PlaneGeometry(W, h).translate((s * W) / 2, mid, T + 0.0015);
  return { edge, back, steel, film };
}

export function createSetting({ stage, shadow, word }) {
  const { scene } = stage;
  stage.renderer.localClippingEnabled = true;
  scene.background = texture(gradient(BACKDROP).c);

  // ── light: from the viewer's side and above, so that what faces the viewer in each image is lit too ──────────
  const key = new THREE.DirectionalLight('#fff4e6', 1.7);
  key.position.set(1.4, 4.6, 4.2);
  scene.add(key);
  scene.add(new THREE.HemisphereLight('#e2ecf6', '#a89080', 1.15));
  const fill = new THREE.DirectionalLight('#dfe9f6', 0.5);
  fill.position.set(-3.5, 1.6, 2.4);
  scene.add(fill);

  // ── the floor ───────────────────────────────────────────────────────────────────────────────────────────
  // warm and plain, deeper near the viewer; it fades out along the view's own depth (as in plane-mirror-image). Being plain,
  // the same floor serves in front of the mirrors and in them.
  const FLOOR = {
    pmFar: { value: FLOOR_TONE.far.clone() },
    pmNear: { value: FLOOR_TONE.near.clone() },
    pmView: { value: new THREE.Vector3(0, 0, -1) },
    pmFrom: { value: new THREE.Vector3() },
    pmSpan: { value: new THREE.Vector4(0, 1, 0, 1) },
  };
  const floorMat = new THREE.MeshStandardMaterial({ name: 'Floor', color: '#ffffff', roughness: 0.9, metalness: 0, transparent: true });
  floorMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, FLOOR);
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
    diffuseColor.rgb = mix(pmNear, pmFar, smoothstep(pmSpan.x, pmSpan.y, along));
    diffuseColor.a = 1.0 - smoothstep(pmSpan.z, pmSpan.w, along);
  }`,
    );
  };
  floorMat.customProgramCacheKey = () => 'ra-floor-1';
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), floorMat);
  floor.name = 'Floor';
  floor.renderOrder = -1;
  floor.userData.noExport = true;
  scene.add(floor);
  const hx = new THREE.Vector3();
  /** The floor's tones and fade for a camera: the fade starts `behind` metres past O along the view. */
  function setFloorFade(cam, behind) {
    cam.getWorldDirection(hx);
    hx.y = 0;
    hx.normalize();
    const from = cam.position;
    const at = -(from.x * hx.x + from.z * hx.z);
    FLOOR.pmView.value.copy(hx);
    FLOOR.pmFrom.value.set(from.x, 0, from.z);
    FLOOR.pmSpan.value.set(at - 1.6, at + behind, at + behind, at + behind + 1.6);
  }

  // ── the mirrors ─────────────────────────────────────────────────────────────────────────────────────────
  const edgeMat = new THREE.MeshStandardMaterial({ name: 'GlassEdge', color: '#7fd6b6', roughness: 0.16, metalness: 0, emissive: '#143c30' });
  const backMat = new THREE.MeshStandardMaterial({ name: 'MirrorBack', color: '#c3ccd4', roughness: 0.6, metalness: 0.1 });
  const steelMat = new THREE.MeshStandardMaterial({ name: 'Steel', color: '#46505c', roughness: 0.42, metalness: 0.7 });
  const filmMat = new THREE.MeshBasicMaterial({ name: 'Glass', map: glassTexture(), transparent: true, depthWrite: false, toneMapped: false });
  const wings = {};
  const frames = {}; // one mesh per wing: its glass edges and rail, for the picture of it in the other mirror
  for (const [name, s] of [
    ['a', 1],
    ['b', -1],
  ]) {
    const g = new THREE.Group();
    g.name = `Mirror${name.toUpperCase()}O`;
    const p = wingParts(s);
    for (const [part, geometry, material] of [
      ['Edge', p.edge, edgeMat],
      ['Back', p.back, backMat],
      ['Rail', p.steel, steelMat],
    ]) {
      const m = new THREE.Mesh(geometry, material);
      m.name = `${g.name}-${part}`;
      g.add(m);
    }
    const film = new THREE.Mesh(p.film, filmMat);
    film.name = `${g.name}-Glass`;
    film.renderOrder = 40;
    g.add(film);
    scene.add(g);
    wings[name] = g;
    frames[name] = mergeGeometries([tinted(p.edge.clone(), '#7fd6b6'), tinted(p.steel.clone(), '#46505c')]);
  }
  // the hinge: two steel barrels, top and bottom, and between them only the thin dark line where the glasses meet
  const hinge = new THREE.Mesh(
    mergeGeometries([
      new THREE.CylinderGeometry(0.018, 0.018, 0.1, 10).translate(0, 0.11, 0),
      new THREE.CylinderGeometry(0.018, 0.018, 0.1, 10).translate(0, WING.y1 - 0.03, 0),
      new THREE.BoxGeometry(0.004, WING.y1 - WING.y0, 0.004).translate(0, (WING.y1 + WING.y0) / 2, 0.016),
    ]),
    steelMat,
  );
  hinge.name = 'Hinge';
  scene.add(hinge);

  // ── the boy and what the mirrors show of him ────────────────────────────────────────────────────────────
  const made = boyGeometry();
  function boyMaterial(clip, name) {
    const m = new THREE.MeshStandardMaterial({ name, vertexColors: true, roughness: 0.74, metalness: 0, clippingPlanes: clip });
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = `attribute float aGloss;\nvarying float vGloss;\n${sh.vertexShader}`.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n  vGloss = aGloss;',
      );
      sh.fragmentShader = `varying float vGloss;\n${sh.fragmentShader}`.replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 0.42, vGloss);',
      );
    };
    m.customProgramCacheKey = () => 'ra-boy-1';
    return m;
  }
  const cardMap = cardTexture(word);
  const cardGeo = mergeGeometries([
    new THREE.PlaneGeometry(CARD.w, CARD.h).translate(0, 0, 0.002),
    new THREE.PlaneGeometry(CARD.w, CARD.h).rotateY(Math.PI).translate(0, 0, -0.002),
  ]);
  const cardMaterial = (clip) => new THREE.MeshStandardMaterial({ name: 'Card', map: cardMap, roughness: 0.6, metalness: 0, clippingPlanes: clip });
  const blobMap = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    r.addColorStop(0, 'rgba(34,24,18,0.5)');
    r.addColorStop(0.5, 'rgba(34,24,18,0.24)');
    r.addColorStop(1, 'rgba(34,24,18,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
    return texture(c);
  })();
  const blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const blobMaterial = (clip) => new THREE.MeshBasicMaterial({ map: blobMap, transparent: true, depthWrite: false, clippingPlanes: clip });

  const facing = Math.atan2(-BOY_AT.x, -BOY_AT.z); // he faces the hinge
  /** One figure of the boy, with his card and the soft shadow at his feet, under an identity or a mirror's transform. */
  function boyFigure(name, clip) {
    const g = new THREE.Group();
    g.name = name;
    g.matrixAutoUpdate = false;
    const inner = new THREE.Group();
    inner.position.set(BOY_AT.x, 0, BOY_AT.z);
    inner.rotation.y = facing;
    const body = new THREE.Mesh(made.geometry, boyMaterial(clip, `${name}-Body`));
    body.name = `${name}-Body`;
    body.frustumCulled = false;
    const card = new THREE.Mesh(cardGeo, cardMaterial(clip));
    card.name = `${name}-Card`;
    card.frustumCulled = false;
    const blob = new THREE.Mesh(blobGeo, blobMaterial(clip));
    blob.name = `${name}-Shadow`;
    blob.position.y = 0.002;
    blob.scale.set(0.95, 1, 0.72);
    blob.userData.noExport = true;
    blob.visible = shadow;
    inner.add(body, card, blob);
    g.add(inner);
    scene.add(g);
    return { group: g, card };
  }
  const real = boyFigure('Boy', null);
  // keyed by the mirrors in the order the light meets them, so the eye looks through the last one first
  const planes = {
    a: Array.from({ length: 4 }, () => new THREE.Plane()),
    b: Array.from({ length: 4 }, () => new THREE.Plane()),
    ab: Array.from({ length: 8 }, () => new THREE.Plane()),
    ba: Array.from({ length: 8 }, () => new THREE.Plane()),
  };
  const copies = {};
  for (const key of Object.keys(planes)) copies[key] = boyFigure(`Image-${key}`, planes[key]);
  // the picture of one mirror in the other: its edge and its rail
  const frameCopies = {};
  for (const [key, other] of [
    ['a', 'b'],
    ['b', 'a'],
  ]) {
    const material = new THREE.MeshStandardMaterial({ name: `Frame-${key}`, vertexColors: true, roughness: 0.4, clippingPlanes: planes[key] });
    const m = new THREE.Mesh(frames[other], material);
    m.name = `Frame-${key}`;
    m.matrixAutoUpdate = false;
    m.frustumCulled = false;
    m.userData.noExport = true;
    scene.add(m);
    frameCopies[key] = m;
  }

  // ── the fist of চিত্র ৮.১৫ and its ghosts ────────────────────────────────────────────────────────────────
  const fistGeo = fistGeometry(0.5);
  const fistMat = new THREE.MeshStandardMaterial({ name: 'Fist', vertexColors: true, roughness: 0.62, metalness: 0 });
  const fist = new THREE.Group();
  fist.name = 'Fist';
  fist.visible = false;
  const fistBody = new THREE.Mesh(fistGeo, fistMat);
  fistBody.name = 'FistBody';
  const fistShadow = new THREE.Mesh(blobGeo, blobMaterial(null));
  fistShadow.scale.set(1.5, 1, 1.25);
  fistShadow.position.set(-0.12, -0.215, -0.05);
  fistShadow.userData.noExport = true;
  fistShadow.visible = shadow;
  fist.add(fistBody, fistShadow);
  scene.add(fist);
  const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false, transparent: true });
  const ghosts = {};
  for (const key of ['a', 'b', 'ab']) {
    const g = new THREE.Group();
    g.name = `Ghost-${key}`;
    g.matrixAutoUpdate = false;
    g.visible = false;
    const pre = new THREE.Mesh(fistGeo, depthOnly);
    pre.renderOrder = 10;
    pre.userData.noExport = true;
    const mat = new THREE.MeshStandardMaterial({
      name: `Ghost-${key}`,
      vertexColors: true,
      roughness: 0.62,
      metalness: 0,
      transparent: true,
      depthWrite: false,
      opacity: GHOST,
    });
    const col = new THREE.Mesh(fistGeo, mat);
    col.name = `GhostBody-${key}`;
    col.renderOrder = 11;
    const inner = new THREE.Group();
    inner.add(pre, col);
    g.add(inner);
    scene.add(g);
    ghosts[key] = { group: g, inner, mat };
  }

  // ── changes ─────────────────────────────────────────────────────────────────────────────────────────────
  const M = {
    a: new THREE.Matrix4(),
    b: new THREE.Matrix4(),
    ab: new THREE.Matrix4(),
    ba: new THREE.Matrix4(),
  };
  const reflection = (m, n) => {
    const { x, z } = n;
    return m.set(1 - 2 * x * x, 0, -2 * x * z, 0, 0, 1, 0, 0, -2 * x * z, 0, 1 - 2 * z * z, 0, 0, 0, 0, 1);
  };
  let alpha = 180;
  let spread = { a: null, b: null };
  let lenK = 1;
  let highK = 1;
  let world = 'boy';
  /** Sets the angle between the mirrors; every image follows from the mirrors' own transforms. */
  function setAngle(a) {
    alpha = a;
    spread = mirrors(a);
    const turn = (a / 2 - 90) * (Math.PI / 180);
    wings.a.rotation.y = turn;
    wings.b.rotation.y = -turn;
    reflection(M.a, spread.a.n);
    reflection(M.b, spread.b.n);
    // the light meets the first mirror first, so its transform acts first
    M.ab.multiplyMatrices(M.b, M.a);
    M.ba.multiplyMatrices(M.a, M.b);
    for (const key of Object.keys(M)) copies[key].group.matrix.copy(M[key]);
    for (const [key, other] of [
      ['a', 'b'],
      ['b', 'a'],
    ]) {
      wings[other].updateMatrix();
      frameCopies[key].matrix.multiplyMatrices(M[key], wings[other].matrix);
    }
    ghosts.a.group.matrix.copy(M.a);
    ghosts.b.group.matrix.copy(M.b);
    ghosts.ab.group.matrix.copy(M.ab);
    for (const key of Object.keys(M)) copies[key].group.matrixWorldNeedsUpdate = true;
    for (const f of Object.values(frameCopies)) f.matrixWorldNeedsUpdate = true;
    for (const g of Object.values(ghosts)) g.group.matrixWorldNeedsUpdate = true;
    showCopies();
  }
  function showCopies() {
    const boy = world === 'boy';
    real.group.visible = boy;
    fist.visible = !boy;
    const flat = alpha > 179.5;
    copies.a.group.visible = boy;
    copies.b.group.visible = boy;
    copies.ab.group.visible = boy && !flat;
    copies.ba.group.visible = boy && !flat;
    frameCopies.a.visible = boy && !flat;
    frameCopies.b.visible = boy && !flat;
  }
  function setWorld(w) {
    world = w;
    showCopies();
  }
  /** 0 the tall mirrors, 1 the low ones of the book's plan. */
  function setPlan(k) {
    lenK = 1 + (PLAN.w / WING.w - 1) * k;
    highK = 1 + (PLAN.y1 / WING.y1 - 1) * k;
    for (const g of Object.values(wings)) g.scale.set(lenK, highK, 1);
    // the plan lies on a calm slate mat: the fist and its ghosts stand out, and the rays glow
    FLOOR.pmFar.value.lerpColors(FLOOR_TONE.far, PLAN_TONE.far, k);
    FLOOR.pmNear.value.lerpColors(FLOOR_TONE.near, PLAN_TONE.near, k);
    hinge.scale.y = highK;
    setAngle(alpha);
  }
  const gripNow = new THREE.Vector3();
  function placeCards() {
    gripNow.copy(made.grip);
    gripNow.y += CARD.h / 2 + CARD.lift - 0.075;
    gripNow.z += CARD.z;
    real.card.position.copy(gripNow);
    for (const c of Object.values(copies)) c.card.position.copy(gripNow);
  }
  /** The arm: 0 down, 1 raised. The geometry is shared, so every image moves with him. */
  function setArm(k) {
    made.setArm(k);
    placeCards();
  }
  const mapped = new THREE.Vector3();
  const local = new THREE.Vector3();
  /** Where a point of the boy (his own frame) stands in the world, or in a chain's image. */
  function boyPoint(x, y, z, key, out = mapped) {
    local.set(x, y, z).applyAxisAngle(hx.set(0, 1, 0), facing);
    out.set(local.x + BOY_AT.x, local.y, local.z + BOY_AT.z);
    if (key) out.applyMatrix4(M[key]);
    return out;
  }
  /** The middle of his card, in the world or in an image. */
  const cardAt = (key, out = mapped) => boyPoint(gripNow.x, gripNow.y, gripNow.z, key, out);
  /** The top edge of his card: labels stand on it and leave the writing clear. */
  const cardTop = (key, out = mapped) => boyPoint(gripNow.x, gripNow.y + CARD.h / 2 + 0.01, gripNow.z, key, out);
  /** His raised hand. */
  const handAt = (key, out = mapped) => boyPoint(made.grip.x, made.grip.y, made.grip.z, key, out);

  /** The fist at a place on the plan (m along OA and OB). */
  function setFist({ p, q } = FIST_AT) {
    const at = planPoint(p, q);
    // +x of the hand runs from the A end toward the mirror BO, its thumb along OB: the hand as the book draws it
    const m = mirrors(90);
    const rot = new THREE.Matrix4().makeBasis(
      new THREE.Vector3(-m.a.dir.x, 0, -m.a.dir.z),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(-m.b.dir.x, 0, -m.b.dir.z),
    );
    fist.quaternion.setFromRotationMatrix(rot);
    fist.position.set(at.x, 0.215, at.z);
    fist.updateMatrix();
    for (const g of Object.values(ghosts)) {
      g.inner.matrixAutoUpdate = false;
      g.inner.matrix.copy(fist.matrix);
      g.inner.matrixWorldNeedsUpdate = true;
    }
  }
  /** How far each ghost has come, 0 … 1. */
  function setGhost(key, k) {
    const g = ghosts[key];
    g.group.visible = k > 0.003;
    g.mat.opacity = GHOST * k;
  }

  const na = new THREE.Vector3();
  const nb = new THREE.Vector3();
  const nc = new THREE.Vector3();
  const mid = new THREE.Vector3();
  const c = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  /** Sets the four planes through the camera and a window's edges, starting at `at` in a list. */
  function cone(list, at, C) {
    mid.copy(c[0]).add(c[1]).add(c[2]).add(c[3]).multiplyScalar(0.25);
    for (let i = 0; i < 4; i++) {
      const p = list[at + i];
      na.copy(c[i]).sub(C);
      nb.copy(c[(i + 1) % 4]).sub(C);
      nc.crossVectors(na, nb).normalize();
      p.normal.copy(nc);
      p.constant = -nc.dot(C);
      if (p.distanceToPoint(mid) < 0) p.negate();
    }
  }
  /** The corners of a mirror's glass into c[], under a transform or none. */
  function windowOf(name, m) {
    const d = spread[name].dir;
    const w = WING.w * lenK;
    const y0 = WING.y0 * highK;
    const y1 = WING.y1 * highK;
    c[0].set(0, y0, 0);
    c[1].set(d.x * w, y0, d.z * w);
    c[2].set(d.x * w, y1, d.z * w);
    c[3].set(0, y1, 0);
    if (m) for (const q of c) q.applyMatrix4(m);
  }
  /** Cuts each image to what can be seen of it through the frames in front of it, from this camera. */
  function updateClip(cam) {
    if (world !== 'boy') return;
    const C = cam.position;
    windowOf('a');
    cone(planes.a, 0, C);
    windowOf('b');
    cone(planes.b, 0, C);
    if (alpha > 179.5) return;
    // the light meets a, then b: the eye looks into b, and in it finds the picture of a
    windowOf('b');
    cone(planes.ab, 0, C);
    windowOf('a', M.b);
    cone(planes.ab, 4, C);
    windowOf('a');
    cone(planes.ba, 0, C);
    windowOf('b', M.a);
    cone(planes.ba, 4, C);
  }

  /** For the book's GLB: the boy, his three images at 90°, the two mirrors. */
  function exportModel() {
    const out = new THREE.Group();
    out.name = 'right-angle-mirrors';
    const plain = made.geometry.clone();
    plain.deleteAttribute('aGloss');
    const cloth = new THREE.MeshStandardMaterial({ name: 'Boy', vertexColors: true, roughness: 0.7, metalness: 0 });
    const paper = new THREE.MeshStandardMaterial({ name: 'Card', map: cardMap, roughness: 0.6, metalness: 0 });
    const figure = (name, m) => {
      const g = new THREE.Group();
      g.name = name;
      if (m) m.decompose(g.position, g.quaternion, g.scale);
      const inner = new THREE.Group();
      inner.position.set(BOY_AT.x, 0, BOY_AT.z);
      inner.rotation.y = facing;
      const body = new THREE.Mesh(plain, cloth);
      body.name = `${name}-Body`;
      const card = new THREE.Mesh(cardGeo, paper);
      card.name = `${name}-Card`;
      card.position.copy(gripNow);
      inner.add(body, card);
      g.add(inner);
      out.add(g);
    };
    figure('Boy', null);
    const keep = alpha;
    setAngle(90);
    // a mirror is not a rotation: a group keeps it as a scale of −1 along the mirror's normal, on a turned frame
    for (const [key, name] of [
      ['a', 'Image-AOB′'],
      ['b', 'Image-A′OB'],
    ]) {
      const n = spread[key].n;
      const ang = Math.atan2(n.x, n.z);
      const turn = new THREE.Group();
      turn.name = name;
      turn.rotation.y = ang;
      const flip = new THREE.Group();
      flip.scale.z = -1;
      const unturn = new THREE.Group();
      unturn.rotation.y = -ang;
      const inner = new THREE.Group();
      inner.position.set(BOY_AT.x, 0, BOY_AT.z);
      inner.rotation.y = facing;
      const body = new THREE.Mesh(plain, cloth);
      body.name = `${name}-Body`;
      const card = new THREE.Mesh(cardGeo, paper);
      card.name = `${name}-Card`;
      card.position.copy(gripNow);
      inner.add(body, card);
      unturn.add(inner);
      flip.add(unturn);
      turn.add(flip);
      out.add(turn);
    }
    figure('Image-A′OB′', M.ab);
    for (const [name, g] of Object.entries(wings)) {
      const copy = g.clone(true);
      copy.name = name === 'a' ? 'Mirror AO' : 'Mirror BO';
      copy.traverse((n) => {
        if (n.isMesh && n.material === filmMat) n.visible = false;
      });
      out.add(copy);
    }
    out.add(hinge.clone());
    setAngle(keep);
    return out;
  }

  setFist();
  setArm(1);
  setAngle(180);
  return { setAngle, setArm, setWorld, setPlan, setFist, setGhost, updateClip, setFloorFade, exportModel, cardAt, cardTop, handAt, boyPoint };
}
