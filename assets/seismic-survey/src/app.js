// 3D seismic survey (ত্রিমাত্রিক সিসমিক সার্ভে), book p203, topic 7.3.3: the student view. A block of ground cut
// open (five rock layers, gently folded, a dome under the middle), a grid of geophones on top with their cables to
// the recording truck, a shot hole on the front edge. (1) বিস্ফোরণ ঘটাও: the blast's wave goes down on the cut face,
// each boundary's echo comes back up (on the cut face and as circles on the surface), the geophones light as it
// passes, and the panel's seismogram records the front row's traces. The student taps an echo (a blip, a layer's
// name, or the layer on the cut face): depth = v t / 2. (2) ত্রিমাত্রিক ছবি বানাও: the rock above fades, every
// geophone's depths are dropped as probes, the mapped boundaries appear, and the dome holds gas over oil.
// The panel is the kit's clean sheet (one action, one result, one rule). A 5-question test.
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { fitPose } from './camera.js';
import { createEquipment, TRUCK } from './equipment.js';
import { createGround, ECHO_COLORS } from './ground.js';
import { createI18n } from './i18n.js';
import { createSeismogram } from './seismogram.js';
import {
  arrivals,
  boundaryY,
  DEPTHS,
  DOME,
  depthAt,
  FRONT,
  GEOPHONES,
  LINE,
  measure,
  RECORD,
  readTime,
  reflectionX,
  SOURCE,
  shuffle,
  V,
} from './reading.js';

export const DEFAULTS = {
  fire: false, // start with the blast's record already made (pictures)
  layer: 0, // 1, 2, 3: the echo chosen (implies fire)
  image: false, // the 3D picture made (implies fire)
  wave: -1, // ≥ 0: the waves frozen at this time after the blast (s; pictures)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  bg: 'light', // 'light' (the coloured setting) | 'transparent'
  shadow: true,
  sound: true,
};

export const SLOW = 6; // the waves are shown 6 times slower than they travel
const IMAGE_S = 4.2;
const dirFrom = (az, el) => {
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).normalize();
};
const VIEW_DIRS = { front: dirFrom(26, 30), image: dirFrom(50, 32) }; // the picture: turned toward the right face (the arch)
const INK = '#2b3138';
const DIM_X = 860; // the depth measure: on the right of the cut face, clear of the rays
const RAY_TO = [0, 2, 4]; // the geophones of the front row the rays are drawn to (as চিত্র ৭.১৩: three rays)
const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** A soft sky-to-earth backdrop (never white): pale blue above, warm sand toward the horizon. */
function backdrop() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#8fb3d6');
  gr.addColorStop(0.55, '#c7d6e2');
  gr.addColorStop(0.78, '#e2d3bb');
  gr.addColorStop(1, '#cdb48f');
  g.fillStyle = gr;
  g.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** The same picture as a JPEG texture for the GLB (a fifth of the PNG's weight, and no visible change). */
function jpegTexture(tex) {
  const c = document.createElement('canvas');
  c.width = tex.image.width;
  c.height = tex.image.height;
  c.getContext('2d').drawImage(tex.image, 0, 0);
  const out = new THREE.CanvasTexture(c);
  out.colorSpace = tex.colorSpace;
  out.wrapS = tex.wrapS;
  out.wrapT = tex.wrapT;
  out.userData.mimeType = 'image/jpeg';
  return out;
}

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const fix2 = (x) => N(x.toFixed(2));

  root.classList.add('pvc', 'ss');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the panel: the echoes as words, the seismogram, one action, one result, one rule ──────────────────────
  const sheetHtml = cleanSheet(t, {
    examples: { label: 'ex_label', results: true, items: DEPTHS.map((_, k) => ({ id: `e${k}`, label: t('ex', { n: k + 1 }) })) },
    quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
    lines: { action: 1, outcome: 2, rule: 3 },
  })
    .replace('<div class="pvc-act-row"', '<div class="ss-seis"></div><div class="pvc-act-row"')
    .concat(`<p class="ss-book">${t('book_line')}</p>`);
  const ui = buildStudentShell(root, t, { layout: 'side', learn: sheetHtml, learnAlign: 'start' });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  for (const [k, b] of ui.$$('[data-example]').entries()) b.style.setProperty('--c', ECHO_COLORS[k]);
  // the honest note in a corner of the view
  const note = document.createElement('div');
  note.className = 'ss-note';
  note.textContent = t('note', { k: SLOW });
  ui.stage.appendChild(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 20, far: 20000, environment: 'studio-light' });
  const { camera, controls, scene, renderer } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  const transparent = o.bg === 'transparent';
  if (!transparent) scene.background = backdrop();
  const hemi = new THREE.HemisphereLight('#eaf2ff', '#8a6a48', 1.0);
  const key = new THREE.DirectionalLight('#fff4e2', 2.4);
  key.position.set(-900, 2200, 1500);
  const fill = new THREE.DirectionalLight('#cfe3ff', 0.7);
  fill.position.set(1800, 600, 900);
  scene.add(hemi, key, key.target, fill);
  scene.environmentIntensity = 0.55;

  const ground = createGround({ anisotropy: Math.min(8, renderer.capabilities.getMaxAnisotropy()) });
  const gear = createEquipment();
  const model = new THREE.Group();
  model.name = 'seismic-survey';
  model.add(ground.root, gear.root);
  scene.add(model);
  // a floor under the block for its shadow (not exported)
  const floorMat = new THREE.MeshStandardMaterial({ color: '#b79f7d', roughness: 1 });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(4200, 48), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1402;
  floor.receiveShadow = true;
  floor.userData.noExport = true;
  floor.visible = !transparent;
  scene.add(floor);
  if (o.shadow && !transparent) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.radius = 2;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 1.5;
    // fitted round the block's top (where the geophones, the truck and the flag cast shadows)
    const cam = key.shadow.camera;
    key.updateMatrixWorld();
    cam.position.copy(key.position);
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();
    const inv = cam.matrixWorld.clone().invert();
    const b = new THREE.Box3();
    const p = new THREE.Vector3();
    for (const x of [-1000, 1000]) for (const y of [-40, 160]) for (const z of [-700, 700]) b.expandByPoint(p.set(x, y, z).applyMatrix4(inv));
    Object.assign(cam, { left: b.min.x, right: b.max.x, bottom: b.min.y, top: b.max.y, near: -b.max.z - 20, far: -b.min.z + 20 });
    cam.updateProjectionMatrix();
  }

  // the model for the GLB: the same, with the rock and soil pictures as JPEG (about 1.3 MB, not 3.4)
  const lightTextures = new Map();
  function lightModel() {
    const copy = model.clone(true);
    copy.traverse((o) => {
      const map = o.isMesh && !Array.isArray(o.material) ? o.material.map : null;
      if (!map || !(map.image instanceof HTMLCanvasElement) || map.image.width < 256) return;
      if (!lightTextures.has(map)) lightTextures.set(map, jpegTexture(map));
      o.material = o.material.clone();
      o.material.map = lightTextures.get(map);
    });
    return copy;
  }

  // ── lines: the rays (as চিত্র ৭.১৩), the depth's measure, the chosen boundary on the cut face ────────────
  const lineMats = [];
  function lineMat(color, width) {
    const m = new LineMaterial({ color, linewidth: width, worldUnits: true, transparent: true, depthTest: true });
    lineMats.push(m);
    return m;
  }
  function polyline(color, width, outline) {
    const g = new THREE.Group();
    const geo = new LineGeometry();
    geo.setPositions([0, 0, 0, 1, 0, 0]);
    const under = new Line2(geo, lineMat(outline, width * 2.1));
    const top = new Line2(geo, lineMat(color, width));
    under.renderOrder = 9;
    top.renderOrder = 10;
    under.material.depthTest = false;
    top.material.depthTest = false;
    g.add(under, top);
    g.visible = false;
    g.userData.noExport = true;
    return {
      root: g,
      set(points, col) {
        geo.setPositions(points.flatMap((v) => [v.x, v.y, v.z]));
        under.computeLineDistances();
        if (col) top.material.color.set(col);
        g.visible = true;
      },
      hide: () => {
        g.visible = false;
      },
    };
  }
  const overlay = new THREE.Group();
  overlay.name = 'overlay';
  overlay.userData.noExport = true;
  scene.add(overlay);
  const rays = RAY_TO.map(() => polyline('#ffffff', 9, '#ffffff'));
  for (const r of rays) overlay.add(r.root);
  const coneGeo = new THREE.ConeGeometry(15, 40, 14);
  const coneMats = ECHO_COLORS.map((c) => new THREE.MeshBasicMaterial({ color: c, depthTest: false }));
  const heads = RAY_TO.flatMap(() => [0, 1].map(() => new THREE.Mesh(coneGeo, coneMats[0])));
  for (const h of heads) {
    h.renderOrder = 11;
    h.visible = false;
    overlay.add(h);
  }
  const dim = polyline(INK, 7, '#ffffff');
  const edge = polyline('#ffffff', 8, '#ffffff');
  overlay.add(dim.root, edge.root);
  const up = new THREE.Vector3(0, 1, 0);
  const zf = FRONT + 4;
  const rayPts = [];
  function showRays(k, quizMode = false) {
    const d = DEPTHS[k];
    const S = new THREE.Vector3(SOURCE.x, SOURCE.y, zf);
    RAY_TO.forEach((gi, j) => {
      const gx = LINE[gi].x;
      const P = new THREE.Vector3(reflectionX(gx, d), boundaryY(k, reflectionX(gx, d), FRONT), zf);
      const G = new THREE.Vector3(gx, 0, zf);
      rays[j].set([S, P, G], ECHO_COLORS[k]);
      rayPts[j] = [S, P, G];
      // arrow heads half way down and half way up
      for (const [m, a, b] of [
        [heads[j * 2], S, P],
        [heads[j * 2 + 1], P, G],
      ]) {
        m.material = coneMats[k];
        m.position.lerpVectors(a, b, 0.55);
        m.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize());
        m.visible = true;
      }
    });
    const pts = [];
    const n = 60;
    for (let i = 0; i <= n; i++) {
      const x = -1000 + (2000 * i) / n;
      pts.push(new THREE.Vector3(x, boundaryY(k, x, FRONT), zf - 1));
    }
    edge.set(pts, ECHO_COLORS[k]);
    const yd = boundaryY(k, DIM_X, FRONT);
    dim.set([
      new THREE.Vector3(DIM_X - 24, 0, zf),
      new THREE.Vector3(DIM_X + 24, 0, zf),
      new THREE.Vector3(DIM_X, 0, zf),
      new THREE.Vector3(DIM_X, yd, zf),
      new THREE.Vector3(DIM_X - 24, yd, zf),
      new THREE.Vector3(DIM_X + 24, yd, zf),
    ]);
    if (quizMode) edge.hide();
  }
  /** Small boxes along the drawn rays (canvas pixels), for labels to keep off. */
  const pv = new THREE.Vector3();
  function rayBoxes() {
    const out = [];
    rays.forEach((r, j) => {
      if (!r.root.visible || !rayPts[j]) return;
      const [S, P, G] = rayPts[j];
      for (const [a, b] of [
        [S, P],
        [P, G],
      ])
        for (let i = 0; i <= 10; i++) {
          pv.lerpVectors(a, b, i / 10).project(camera);
          const x = ((pv.x + 1) / 2) * stage.width;
          const y = ((1 - pv.y) / 2) * stage.height;
          out.push({ left: x - 4, top: y - 4, right: x + 4, bottom: y + 4 });
        }
    });
    return out;
  }
  function hideRays() {
    for (const r of rays) r.hide();
    for (const h of heads) h.visible = false;
    dim.hide();
    edge.hide();
  }

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  const s = {
    running: false, // the waves are travelling
    done: false, // a record has been made
    wave: 0, // time since the blast, s (of the real survey; shown SLOW times slower)
    freeze: false, // the waves held still at s.wave (pictures, the test)
    sel: -1, // the chosen echo (0, 1, 2)
    visited: new Set(),
    image: 0, // the 3D picture, 0 … 1
    imageOn: false,
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    quiz: null, // the test's scene
    userMovedCamera: false,
    played: 0, // the student's steps done (1: blasted, 2: made the picture)
  };
  let token = 0;

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── what the 3D shows, from the state ──────────────────────────────────────────────────────────────────
  function applyWorld() {
    const waving = s.running || s.freeze;
    ground.setWave(V * s.wave, waving && s.image === 0);
    gear.blast(waving ? s.wave * SLOW : s.done ? 99 : -1);
    // the geophones light as each echo passes them
    for (const g of GEOPHONES) {
      let best = 0;
      let kb = 0;
      if (waving) {
        arrivals(g).forEach((a, k) => {
          const dtA = s.wave - a;
          if (dtA >= 0 && dtA < 0.25) {
            const v = Math.exp(-dtA / 0.05);
            if (v > best) {
              best = v;
              kb = k;
            }
          }
        });
      }
      const marked = s.quiz?.kind === 'role' && s.quiz.part === 'phone' && g.i === s.quiz.phone;
      gear.light(g.i, marked ? '#ffffff' : ECHO_COLORS[kb], marked ? 1 : best);
    }
    // the picture
    const p = s.image;
    ground.setReveal(clamp01(p / 0.25));
    gear.setProbes(clamp01((p - 0.15) / 0.45));
    ground.setMapped(clamp01((p - 0.5) / 0.25), clamp01((p - 0.72) / 0.28));
    // the rays of the chosen echo (once recorded, not over the picture)
    const qk = s.quiz?.kind;
    if (s.done && s.sel >= 0 && p === 0 && (!s.quiz || qk === 'depth')) showRays(s.sel, Boolean(s.quiz));
    else hideRays();
    if (qk === 'depth') dim.root.visible = true;
  }

  // ── camera ─────────────────────────────────────────────────────────────────────────────────────────────
  const frameBox = ground.box.clone();
  frameBox.max.y = 120;
  let camFrom = null;
  let camK = 1;
  const MARGINS = { top: 44, bottom: 26, side: 10 };
  const dirNow = () => (s.imageOn ? VIEW_DIRS.image : VIEW_DIRS.front);
  function poseNow() {
    return fitPose({ box: frameBox, dir: dirNow(), camera, width: stage.width, height: stage.height, margin: MARGINS });
  }
  function applyCamera() {
    if (s.userMovedCamera) return;
    const pz = poseNow();
    if (camK < 1 && camFrom) {
      const k = ease.inOutCubic(camK);
      camera.position.lerpVectors(camFrom.position, pz.position, k);
      controls.target.lerpVectors(camFrom.target, pz.target, k);
    } else {
      camera.position.copy(pz.position);
      controls.target.copy(pz.target);
    }
    controls.update();
  }
  function flyCamera(duration = 0.8) {
    if (s.userMovedCamera) {
      s.userMovedCamera = false;
      s.view = 'front';
      syncUI();
    }
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    camK = 0;
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        camK = k;
        stage.invalidate();
      },
      onComplete: () => {
        camK = 1;
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    if (animate) flyCamera(0.8);
    else camK = 1;
    stage.invalidate();
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    camK = 1;
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
    }
  });
  stage.onResize(() => {
    s.userMovedCamera = false;
    if (s.view === '3d') {
      s.view = 'front';
      syncUI();
    }
    seis.draw();
    draw();
  });
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    labels();
  });

  // ── the waves run ───────────────────────────────────────────────────────────────────────────────────────
  stage.addTicker((dt) => {
    if (!s.running) return false;
    s.wave = Math.min(RECORD, s.wave + dt / SLOW);
    if (s.wave >= RECORD) finishRun();
    draw();
    return true;
  });
  function finishRun() {
    s.running = false;
    s.done = true;
    s.wave = RECORD;
    if (s.sel < 0) choose(0, { quiet: true });
    audio.success();
    emitChange();
  }
  let lastAct = -1e9;
  function act() {
    if (s.locked) return lockedNudge();
    const now = performance.now();
    if (now - lastAct < 400) return;
    lastAct = now;
    audio.unlock();
    if (s.running) return;
    // while the picture is being made, the action (or a tap on the view) shows it at once; a quick second tap of a
    // double tap does nothing
    if (s.imageOn && s.image < 1) {
      if (now - imageStart > 700) skipImage();
      return;
    }
    if (s.done && !s.imageOn) return makeImage();
    fire();
  }
  let imageStart = -1e9;
  function skipImage() {
    ++token;
    tweener.cancel('image');
    s.image = 1;
    audio.success();
    draw();
    emitChange();
  }
  /** The blast: the waves start from the charge; an earlier picture is put away first. */
  function fire() {
    const my = ++token;
    tweener.cancel('image');
    const wasImage = s.image > 0;
    s.imageOn = false;
    s.sel = -1;
    s.freeze = false;
    s.done = false;
    s.visited.clear();
    for (let k = 0; k < DEPTHS.length; k++) sheet.result(`e${k}`, '');
    sheet.choose(null);
    sheet.next(null);
    const go = () => {
      if (my !== token) return;
      s.image = 0;
      s.wave = 0;
      s.running = true;
      s.played = Math.max(s.played, 1);
      audio.pop?.();
      draw();
      emitChange();
    };
    if (wasImage) {
      flyCamera(0.7);
      tweener
        .animate({
          key: 'image',
          duration: 0.7,
          onUpdate: (k) => {
            s.image = 1 - k;
            draw();
          },
        })
        .finished.then(go);
    } else go();
    draw();
  }
  /** The 3D picture: the rock above fades, every geophone's depths drop as probes, the boundaries appear, the dome. */
  function makeImage({ animate = true } = {}) {
    if (!s.done) return;
    const my = ++token;
    s.imageOn = true;
    s.played = 2;
    imageStart = performance.now();
    if (!animate) {
      s.image = 1;
      camK = 1;
      draw();
      emitChange();
      return;
    }
    flyCamera(1.2);
    audio.tick();
    tweener
      .animate({
        key: 'image',
        duration: IMAGE_S,
        ease: ease.linear,
        onUpdate: (k) => {
          if (my !== token) return;
          s.image = k;
          draw();
        },
      })
      .finished.then((ok) => {
        if (ok && my === token) {
          s.image = 1;
          audio.success();
          draw();
          emitChange();
        }
      });
    draw();
  }
  /** Choose echo k (0, 1, 2): its time on the first trace, its depth, its rays. */
  function choose(k, { quiet = false } = {}) {
    if (s.locked) return lockedNudge();
    if (k < 0) return;
    if (!s.done) {
      hint(t('q_first'));
      action.flash();
      return;
    }
    s.sel = k;
    s.visited.add(k);
    if (!quiet) audio.tick();
    draw();
    emitChange();
  }

  // ── labels on the picture ───────────────────────────────────────────────────────────────────────────────
  let action = null;
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, note, () => action?.ringBox()] });
  const shown = new Map();
  const pts = new Map();
  function label(id, on, text, point, color, spots, optional = false, avoid = []) {
    if (!on) {
      if (shown.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
      return;
    }
    if (!pts.has(id)) pts.set(id, new THREE.Vector3());
    pts.get(id).copy(point);
    if (!shown.has(id)) {
      anno.add(id, { text, point: () => pts.get(id), color, spots, kind: 'part', optional, avoid });
      shown.set(id, text);
    } else if (shown.get(id) !== text) {
      anno.setText(id, text);
      shown.set(id, text);
    }
  }
  function clearLabels() {
    for (const id of [...shown.keys()]) anno.remove(id);
    shown.clear();
  }
  const ABOVE = [
    { dx: 0, dy: -40 },
    { dx: 40, dy: -36 },
    { dx: -40, dy: -36 },
    { dx: 0, dy: 36 },
  ];
  const RIGHT = [
    { dx: 46, dy: 0 },
    { dx: 46, dy: -18 },
    { dx: 46, dy: 18 },
    { dx: -46, dy: 0 },
  ];
  const LEFT = [
    { dx: -70, dy: 0 },
    { dx: -70, dy: 26 },
    { dx: -70, dy: -26 },
    { dx: -70, dy: 52 },
    { dx: 70, dy: 30 },
  ];
  const tmp = new THREE.Vector3();
  const pSource = new THREE.Vector3(SOURCE.x + 30, 82, FRONT - 22);
  const LETTERS = t('letters').split(',');
  const pTruck = new THREE.Vector3(TRUCK.x, 225, TRUCK.z);
  // the boundaries' tags keep clear of the depth's label (it matters more; they hide if there is no room)
  const depthBox = [() => (shown.has('depth') ? anno.box('depth') : null)];
  const NUM_SPOTS = [
    { dx: 0, dy: -24 },
    { dx: -16, dy: -22 },
    { dx: 16, dy: -22 },
  ];
  function labels() {
    const q = s.quiz;
    const qk = q?.kind;
    const img = s.image > 0.6;
    const learn = !q;
    const heard = s.done || s.running;
    label('source', learn && !img && !heard, t('l_source'), pSource, INK, ABOVE, true);
    label('geophone', learn && !img && !heard, t('l_geophone'), gear.phoneTop(LINE[3].i, tmp), INK, ABOVE, true);
    label('truck', learn && !img && !heard, t('l_truck'), pTruck, INK, ABOVE, true);
    // the front row's geophones, numbered as the seismogram's traces
    for (let i = 0; i < LINE.length; i++)
      label(`g${i}`, learn && heard && !img, `<span class="ss-gnum">${N(i + 1)}</span>`, gear.phoneTop(LINE[i].i, tmp), INK, NUM_SPOTS, true);
    for (let k = 0; k < DEPTHS.length; k++) {
      const on = (learn && heard && !img) || qk === 'later';
      const text = qk === 'later' ? t('l_letter', { x: LETTERS[q.letters[k]] }) : t('l_layer', { n: k + 1 });
      label(`layer${k}`, on, text, ground.frontPoint(k, 985, tmp), ECHO_COLORS[k], RIGHT, learn, depthBox);
    }
    const dimOn = s.done && s.sel >= 0 && s.image === 0 && (learn || qk === 'depth');
    const yd = s.sel >= 0 ? boundaryY(s.sel, DIM_X, FRONT) : 0;
    label(
      'depth',
      dimOn,
      qk === 'depth' ? t('l_depth_q') : s.sel >= 0 ? t('l_depth', { d: measure(s.sel).d }) : '',
      tmp.set(DIM_X, yd * 0.75, FRONT),
      INK,
      LEFT,
      false,
      [rayBoxes],
    );
    label('time', qk === 'depth', q ? t('l_t', { t: fix2(readTime(q.k)) }) : '', gear.phoneTop(LINE[0].i, tmp), '#c2255c', ABOVE);
    const partAt = { phone: () => gear.phoneTop(q.phone, tmp), source: () => tmp.copy(pSource), truck: () => tmp.copy(pTruck) };
    label('this', qk === 'role', t('l_this'), qk === 'role' ? partAt[q.part]() : tmp, INK, ABOVE);
    label('gas', s.image > 0.85, t('l_gas'), ground.gasPoint, '#c92a2a', RIGHT);
    label('oil', s.image > 0.85, t('l_oil'), ground.oilPoint, '#5c3d12', RIGHT);
  }

  // ── the seismogram ──────────────────────────────────────────────────────────────────────────────────────
  const seisHost = $('.ss-seis');
  seisHost.innerHTML = `<div class="ss-seis-head">${t('seis_head')}</div>`;
  const seis = createSeismogram({ host: seisHost, t, colors: ECHO_COLORS, onPick: (k) => (k >= 0 ? choose(k) : null) });

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  function outcome() {
    if (s.running || s.freeze) return t('out_run', { t: fix2(s.wave) });
    if (!s.done) return t('out_ready');
    if (s.image > 0 && s.image < 1) return t('out_mapping', { n: GEOPHONES.length });
    if (s.imageOn) return t('out_image', { d: Math.round(depthAt(2, DOME.x, DOME.z) / 10) * 10 });
    if (s.sel < 0) return t('out_pick');
    const m = measure(s.sel);
    return t('out_depth', { n: s.sel + 1, t: fix2(m.t), v: V, two: 2, d: m.d });
  }
  function rule() {
    if (s.imageOn) return t('rule_image');
    if (s.done && s.sel >= 0) return t('rule_depth', { v: V, two: 2 });
    if (s.running || s.done || s.freeze) return t('rule_run');
    return t('rule_start');
  }
  function panel() {
    if (s.quiz) return;
    seis.set({ time: s.done ? RECORD : s.running || s.freeze ? s.wave : 0, sel: s.done ? s.sel : -1 });
    sheet.outcome(outcome());
    sheet.rule(rule());
    for (const k of s.visited) sheet.result(`e${k}`, t('ex_res', { d: measure(k).d }));
    sheet.choose(s.done && s.sel >= 0 ? `e${s.sel}` : null);
    const next = s.done ? [0, 1, 2].find((k) => !s.visited.has(k)) : undefined;
    sheet.next(next != null ? `e${next}` : null);
    // the action
    let lab = 'act_blast';
    let step = 1;
    let enabled = true;
    if (s.running) {
      lab = 'act_wait';
      step = '';
      enabled = false;
    } else if (s.done && !s.imageOn) {
      lab = 'act_image';
      step = s.played >= 2 ? '' : 2;
    } else if (s.imageOn && s.image < 1) {
      lab = 'act_skip';
      step = '';
    } else if (s.imageOn || s.played >= 1 || s.freeze) {
      lab = 'act_again';
      step = '';
    }
    const keyNow = `${lab}|${step}|${enabled}`;
    if (action && action.lastKey !== keyNow) {
      action.lastKey = keyNow;
      action.set({ label: lab, step, enabled, icon: lab === 'act_image' ? ICONS.expand : ICONS.hand });
    }
  }
  function draw() {
    applyWorld();
    panel();
    stage.invalidate();
  }

  // ── the action: one big button; its badge on the shot hole, then on the grid ───────────────────────────
  const ringPoint = new THREE.Vector3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_blast',
    target: () => {
      if (s.locked || camK < 1 || s.running || (s.imageOn && s.image < 1)) return null;
      if (s.done && !s.imageOn) return ringPoint.set(0, 10, 85);
      return ringPoint.set(SOURCE.x + 10, 12, FRONT - 10);
    },
    radius: 26,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // ── taps on the 3D: the shot hole fires, a layer on the cut face is chosen ─────────────────────────────
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const shotHit = new THREE.Mesh(new THREE.SphereGeometry(90, 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
  shotHit.position.set(SOURCE.x, 0, FRONT - 20);
  shotHit.userData.noExport = true;
  scene.add(shotHit);
  const frontPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -FRONT);
  let down = null;
  ui.canvasHost.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, at: performance.now() };
  });
  ui.canvasHost.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const quick = performance.now() - down.at < 500;
    down = null;
    if (moved > 8 || !quick || s.mode === 'quiz') return;
    const r = ui.canvasHost.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.intersectObject(shotHit, false).length) {
      if (!s.running && (!s.done || s.imageOn)) act();
      return;
    }
    // a tap on the view while the picture is being made shows it at once
    if (s.imageOn && s.image < 1) return act();
    const hit = ray.ray.intersectPlane(frontPlane, new THREE.Vector3());
    if (hit && Math.abs(hit.x) <= 1000 && hit.y < -5 && hit.y > -1300 && s.done && s.image === 0) {
      // the nearest boundary to the tap
      let best = 0;
      let bd = Number.POSITIVE_INFINITY;
      for (let k = 0; k < DEPTHS.length; k++) {
        const dd = Math.abs(hit.y - boundaryY(k, hit.x, FRONT));
        if (dd < bd) {
          bd = dd;
          best = k;
        }
      }
      if (bd < 150) choose(best);
    }
  });

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────
  let order = [];
  let qCurrent = null;
  const notesOf = (pairs) => new Map(pairs.map(([v, html]) => [String(v), html]));
  function quizScene(q) {
    ++token;
    tweener.cancel('image');
    s.quiz = q;
    s.running = false;
    s.freeze = q.wave != null;
    s.wave = q.wave ?? RECORD;
    s.done = q.wave == null;
    s.sel = q.k ?? -1;
    s.image = q.image ? 1 : 0;
    s.imageOn = Boolean(q.image);
    clearLabels();
    draw();
  }
  function prepare(i) {
    const kind = order[i];
    if (kind === 'role') {
      // one part of the survey is marked (the blast's hole, a geophone, or the truck): what does it do?
      const PARTS = ['source', 'phone', 'truck'];
      const which = Math.floor(Math.random() * 3);
      const phone = LINE[1 + Math.floor(Math.random() * 4)].i;
      quizScene({ kind, part: PARTS[which], phone });
      const words = [t('c_role_0'), t('c_role_1'), t('c_role_2'), t('c_role_3')];
      const wrong = [0, 1, 2, 3].filter((x) => x !== which);
      return {
        text: t('q_role'),
        answer: which,
        wrong,
        label: (x) => words[x],
        notes: notesOf(wrong.map((x) => [x, t(`n_role_${x}`)])),
        reveal: t(`a_role_${which}`),
      };
    }
    if (kind === 'why') {
      quizScene({ kind, wave: 0.43 });
      const words = [t('c_why_ok'), t('c_why_up'), t('c_why_absorb'), t('c_why_gas')];
      return {
        text: t('q_why'),
        answer: 0,
        wrong: [1, 2, 3],
        label: (x) => words[x],
        notes: notesOf([
          [1, t('n_why_up')],
          [2, t('n_why_absorb')],
          [3, t('n_why_gas')],
        ]),
        reveal: t('a_why'),
      };
    }
    if (kind === 'later') {
      // the boundaries get the letters ক, খ, গ in a shuffled order: the answer is the deepest one's letter
      const letters = shuffle([0, 1, 2]);
      quizScene({ kind, letters });
      const deepest = letters[2];
      const shallow = [letters[0], letters[1]];
      const L = (x) => (x === 3 ? t('c_later_same') : t('c_later', { x: LETTERS[x] }));
      return {
        text: t('q_later'),
        answer: deepest,
        wrong: [...shallow, 3],
        label: L,
        notes: notesOf([
          [shallow[0], t('n_later_shallow')],
          [shallow[1], t('n_later_shallow')],
          [3, t('n_later_same')],
        ]),
        reveal: t('a_later', { x: LETTERS[deepest] }),
      };
    }
    if (kind === 'depth') {
      const k = Math.floor(Math.random() * 3);
      quizScene({ kind, k });
      const m = measure(k);
      const d = m.d;
      const wrong = [2 * d, d / 2, Math.round(V / m.t)];
      const u = (x) => `${N(x)} m`;
      return {
        text: t('q_depth', { v: V, one: 1 }),
        answer: d,
        wrong,
        tolerance: 0.5,
        label: u,
        notes: notesOf([
          [wrong[0], t('n_depth_2')],
          [wrong[1], t('n_depth_4', { two: 2 })],
          [wrong[2], t('n_depth_div')],
        ]),
        reveal: t('a_depth', { d, v: V, t: fix2(m.t), two: 2 }),
      };
    }
    // why a grid
    quizScene({ kind, image: true });
    const words = [t('c_grid_ok'), t('c_grid_loud'), t('c_grid_fast'), t('c_grid_spare')];
    return {
      text: t('q_grid'),
      answer: 0,
      wrong: [1, 2, 3],
      label: (x) => words[x],
      notes: notesOf([
        [1, t('n_grid_loud')],
        [2, t('n_grid_fast')],
        [3, t('n_grid_spare')],
      ]),
      reveal: t('a_grid'),
    };
  }
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    lines: { text: 3, feedback: 3 },
    action,
    hooks: {
      enter() {
        s.mode = 'quiz';
        s.locked = true;
        // the scenes never show a later answer: the 3D picture (why a grid) comes last
        order = [...shuffle(['role', 'why']), ...shuffle(['later', 'depth']), 'grid'];
        clearLabels();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quiz = null;
        clearLabels();
        // back to a finished record with the first echo chosen
        s.freeze = false;
        s.running = false;
        s.done = true;
        s.wave = RECORD;
        s.image = 0;
        s.imageOn = false;
        if (s.sel < 0) s.sel = 0;
        s.visited.add(s.sel);
        s.played = Math.max(s.played, 1);
        syncUI();
        flyCamera(0.5);
        draw();
      },
      async prepare(i, alive, say) {
        const q = prepare(i);
        qCurrent = q;
        say(q.text);
        const done = await flyCamera(0.5);
        if (!alive()) return null;
        if (!done) camK = 1;
        const out = [q.answer];
        for (const w of q.wrong) if (out.length < 4 && !out.includes(w)) out.push(w);
        return {
          choices: shuffle(out),
          expected: q.answer,
          tolerance: q.tolerance ?? 1e-6,
          label: q.label,
          meta: { kind: order[i] },
        };
      },
      reveal(_q, correct, picked) {
        const q = qCurrent;
        const why = !correct && picked ? q.notes.get(String(picked.value)) : '';
        return `${q.reveal}${why ? ` <span class="ss-why">${why}</span>` : ''}`;
      },
      done() {},
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────────────────────────────────
  function syncUI() {
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = s.view !== '3d';
    controls.enableRotate = !s.locked;
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
  }
  let hintTimer = 0;
  function hint(text) {
    ui.hintText.innerHTML = text;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => ui.hint.classList.remove('show'), 3200);
  }
  function lockedNudge() {
    hint(t('q_locked'));
    audio.error();
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  let lastTap = { what: '', at: 0 };
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    const what = b.dataset.act || b.dataset.example || '';
    const now = performance.now();
    if (what && what === lastTap.what && now - lastTap.at < 120) return;
    lastTap = { what, at: now };
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.example) choose(Number(b.dataset.example.slice(1)));
    const a = b.dataset.act;
    if (a === 'q-next') quiz.next();
    if (a === 'q-again') quiz.start();
    if (a === 'home') home();
    if (a === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return;
    if (['1', '2', '3'].includes(e.key)) {
      e.preventDefault();
      return choose(Number(e.key) - 1);
    }
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (d) {
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (!s.done) return choose(0);
      return choose((s.sel + d + 3) % 3);
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (s.mode === 'quiz') return;
      act();
    }
  });
  function home() {
    if (s.locked) return lockedNudge();
    ++token;
    tweener.cancel('image');
    Object.assign(s, { running: false, done: false, wave: 0, freeze: false, sel: -1, image: 0, imageOn: false, userMovedCamera: false });
    s.visited.clear();
    for (let k = 0; k < DEPTHS.length; k++) sheet.result(`e${k}`, '');
    clearLabels();
    if (s.view === '3d') setView('front');
    else flyCamera(0.5);
    draw();
    emitChange();
  }

  // ── state for the book ──────────────────────────────────────────────────────────────────────────────────
  function snapshot() {
    const m = s.sel >= 0 ? measure(s.sel) : null;
    return {
      fired: s.running || s.done,
      running: s.running,
      done: s.done,
      wave: +s.wave.toFixed(3),
      layer: s.sel + 1,
      t: m ? m.t : null,
      depth: m ? m.d : null,
      measured: [...s.visited].sort().map((k) => ({ layer: k + 1, t: measure(k).t, depth: measure(k).d })),
      image: s.imageOn,
      mapped: s.imageOn && s.image >= 1,
      v: V,
      mode: s.mode,
      locked: s.locked,
      view: s.view,
    };
  }
  let lastEmit = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.done, snap.running, snap.layer, snap.image]);
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snap);
    }
  }
  /** The record made at once (no animation). */
  function recordNow() {
    ++token;
    s.running = false;
    s.freeze = false;
    s.done = true;
    s.wave = RECORD;
    s.played = Math.max(s.played, 1);
    if (s.sel < 0) {
      s.sel = 0;
      s.visited.add(0);
    }
  }

  // ── start ───────────────────────────────────────────────────────────────────────────────────────────────
  syncUI();
  setView(s.view, { animate: false });
  if (o.fire || o.layer || o.image) recordNow();
  if (o.layer >= 1 && o.layer <= 3) {
    s.sel = o.layer - 1;
    s.visited.add(s.sel);
  }
  if (o.image) {
    s.imageOn = true;
    s.image = 1;
    s.played = 2;
  }
  if (o.wave >= 0) {
    s.freeze = true;
    s.wave = Math.min(RECORD, o.wave);
    s.done = false;
    s.sel = -1;
  }
  draw();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
  })();

  return {
    ready,
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: () => snapshot(),
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) setView(p.view, { animate });
      if (p.fire === false) home();
      if (p.fire === true) {
        if (animate) fire();
        else recordNow();
      }
      if (p.wave != null && Number(p.wave) >= 0) {
        ++token;
        s.running = false;
        s.freeze = true;
        s.done = false;
        s.sel = -1;
        s.image = 0;
        s.imageOn = false;
        s.wave = Math.min(RECORD, Number(p.wave));
      }
      if (p.layer != null && Number(p.layer) >= 1 && Number(p.layer) <= 3) {
        if (!s.done && !s.running) recordNow();
        if (s.done) choose(Number(p.layer) - 1, { quiet: true });
      }
      if (p.image != null) {
        if (p.image) {
          if (!s.done) recordNow();
          makeImage({ animate });
        } else if (s.imageOn) {
          ++token;
          tweener.cancel('image');
          s.imageOn = false;
          s.image = 0;
          if (animate) flyCamera(0.6);
        }
      }
      draw();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.played = 0;
      setView('front', { animate: false });
      home();
      camK = 1;
    },
    startPractice: () => quiz.start(),
    capture(opts = {}) {
      const before = scene.background;
      if (opts.background !== undefined) scene.background = null;
      try {
        return stage.capture(opts);
      } finally {
        scene.background = before;
        stage.invalidate();
      }
    },
    exportRoot: lightModel,
  };
}
