// Circular motion (book page 36, topic 2.2), student view: three examples from the book (a ceiling fan, a clock's
// second hand, the Moon round the Earth) turn by themselves. Each shows the fixed point, a dashed line to a point
// that goes round, and the circular path that point traces. The student touches the moving point (or drags it
// round) to measure its distance from the fixed point; after four measurements at different places the panel
// shows the same number four times: the distance is always the same. Then a short test.
// Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createCoach } from '@shared/student/coach.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { createFan } from './fan.js';
import { createClock } from './clock.js';
import { createMoon } from './moon.js';
import { INK, MAX_MARKS, createOverlay } from './overlay.js';
import { createRoom, createStars, createWall, gradientTexture } from './setting.js';
import { FAN } from './fan.js';
import {
  EXAMPLES,
  EXAMPLE_IDS,
  angleBetween,
  angleOf,
  chord,
  coverageFraction,
  distanceMistakes,
  extendCoverage,
  fmt,
  realDistance,
  roundTo,
  turned,
  unwrap,
  wrap360,
} from './reading.js';

export const DEFAULTS = {
  example: 'fan', // 'fan' | 'clock' | 'moon'
  play: true, // turning at the start
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const START = { fan: 25, clock: 0, moon: 35 }; // where the moving point starts (degrees from "up")
const DEG = Math.PI / 180;
/** How far the view may be turned round each example (polar from straight up, azimuth from the front). */
const ORBIT = {
  fan: { polar: [95 * DEG, Math.PI], azimuth: [-Infinity, Infinity] },
  clock: { polar: [20 * DEG, 160 * DEG], azimuth: [-75 * DEG, 75 * DEG] },
  moon: { polar: [0, Math.PI], azimuth: [-Infinity, Infinity] },
};
const SAME_PLACE = 20; // degrees: a measurement nearer than this to an earlier one is "the same place"
const UNIT_CODE = { unit_cm: 'cm', unit_lakh_km: 'lakh km' };

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'cm');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const slot = '<b class="cm-slot">?</b>';
  const ui = buildStudentShell(root, t, {
    layout: 'side', // the panel beside the 3D on landscape frames (kit 1.5.0)
    learn: `
          <div class="pvc-seg cm-ex" role="group" aria-label="${t('ex_label')}">
            ${EXAMPLE_IDS.map((id) => `<button data-ex="${id}">${t(`ex_${id}`)}</button>`).join('')}
          </div>
          <div class="cm-acts">
            <button class="pvc-btn primary" data-act="measure">${ICONS.target}<span>${t('act_measure')}</span></button>
            <button class="pvc-btn" data-act="play"><span class="ic"></span><span class="lb"></span></button>
          </div>
          <div class="cm-meas">
            <div class="cm-meas-head"><span class="k"></span><span class="pvc-status"><i></i><span></span></span></div>
            <span class="cm-slots">${Array(MAX_MARKS).fill(slot).join('<i>=</i>')}</span>
          </div>
          <p class="cm-idea">${t('idea')}</p>
          <p class="cm-book"></p>`,
  });

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 1, far: 6000, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  // each example in its own place (setting.js): the fan under a room's ceiling, the clock on its wall, the Moon in
  // the night sky; what shows past the room when the camera is pulled far back is the room's dusk
  const opaque = o.bg !== 'transparent';
  const backgrounds = opaque
    ? { fan: gradientTexture('#4a5d78', '#2c3a50'), clock: gradientTexture('#4a5d78', '#2c3a50'), moon: gradientTexture('#060a1d', '#151c43') }
    : null;
  scene.background = null;
  const M = createMaterials(stage.renderer);
  const world = new THREE.Group();
  world.name = 'CircularMotionScene';
  scene.add(world);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const annotations = createAnnotations({ stage, layer: ui.annoLayer });

  // Soft shadows: the fan's on the ceiling, the clock's on its wall (the Moon is in space). Very soft shadows need
  // few texels, so a small map in a box fitted round the casters looks the same as a big loose one: 512 px, and
  // only the parts whose shadow shows cast one.
  const shadows = o.shadow && opaque;
  if (shadows) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
  }
  const ex = {
    fan: createFan({ materials: M }),
    clock: createClock({ t }),
    moon: createMoon({ renderer: stage.renderer }),
  };
  if (opaque) {
    ex.fan.setting = createRoom({ ceiling: FAN.ceiling });
    ex.clock.setting = createWall({ z: ex.clock.wallZ });
    ex.moon.setting = createStars();
  }
  // where the "circular path" label sits on each circle: lower right on the screen
  const PATH_LABEL_AT = { fan: 225, clock: 135, moon: 225 };
  for (const e of Object.values(ex)) {
    if (e.setting) e.root.add(e.setting);
    if (shadows && e.shadow) {
      for (const m of e.casters) m.castShadow = true;
      for (const light of e.lights) {
        const { size: R, near, far, blur } = e.shadow;
        light.castShadow = true;
        light.shadow.mapSize.set(512, 512);
        Object.assign(light.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near, far });
        light.shadow.camera.updateProjectionMatrix();
        light.shadow.radius = blur;
        light.shadow.blurSamples = 8;
        light.shadow.intensity = e.shadow.strength ?? 1;
      }
    }
    e.overlay = createOverlay({ r: e.r, lift: e.lift, pointSize: e.pointSize, guide: e.guide });
    e.plane.add(e.overlay.root);
    e.root.visible = false;
    world.add(e.root);
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    example: EXAMPLE_IDS.includes(o.example) ? o.example : 'fan',
    angle: 0, // degrees the moving point has turned from "up", continuous (it grows turn after turn)
    playing: o.play !== false,
    from: 0, // where the path began to be traced
    cov: { lo: 0, hi: 0 }, // the traced part of the path
    marks: [], // angles where the distance was measured (the newest last)
    grow: 1, // how far the newest measured line has grown
    sameShown: false, // the "always the same" moment has been shown for this example
    distKnown: false, // the distance has been measured once: until then the dashed line says "? cm"
    dragged: false, // the student has turned an example by hand
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    drag: null,
    hold: false, // the test is turning it (an answer being shown)
    userMovedCamera: false,
  };
  let intro = 0; // the first look at the fan: 1 waiting at the side view, 2 flying under the fan
  const cur = () => ex[s.example];
  const unitKey = () => EXAMPLES[s.example].unit;

  // ── the distance, measured on the model ─────────────────────────────────────
  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  /** The distance from the fixed point to the moving point when it was at `deg`, in the example's real units. */
  function measuredDistance(deg) {
    const e = cur();
    e.root.worldToLocal(e.overlay.worldAt(deg, vA));
    e.root.worldToLocal(e.overlay.centerWorld(vB));
    return realDistance(s.example, vA.distanceTo(vB));
  }

  function snapshot() {
    const marks = s.marks.map((a) => ({ angle: roundTo(wrap360(a), 0.1), distance: measuredDistance(a) }));
    return {
      example: s.example,
      angle: roundTo(wrap360(s.angle), 0.1),
      playing: s.playing,
      distance: measuredDistance(s.angle),
      unit: UNIT_CODE[unitKey()],
      marks,
      same: marks.length > 1 && marks.every((m) => m.distance === marks[0].distance),
      traced: roundTo(coverageFraction(s.cov), 0.01),
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.example, snap.playing, snap.marks.length, snap.marks.at(-1)?.angle, snap.view, s.drag ? 0 : snap.angle]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    slots: ui.$$('.cm-slot'),
    slotRow: $('.cm-slots'),
    distLabel: $('.cm-meas .k'),
    book: $('.cm-book'),
    chips: ui.$$('[data-ex]'),
    status: $('.pvc-status span'),
    statusDot: $('.pvc-status'),
    playIcon: $('[data-act="play"] .ic'),
    playLabel: $('[data-act="play"] .lb'),
  };

  /** The 3D: the example turned to the angle, the path traced so far, the measured lines. Every frame while it turns. */
  function drawScene() {
    const e = cur();
    e.setAngle(s.angle);
    e.overlay.setAngle(s.angle);
    e.overlay.setTrace(s.from, s.cov);
    e.overlay.setMarks(s.marks, s.grow);
    if (coverageFraction(s.cov) >= 0.5 && !annotations.has('path') && labelsOn) addPathLabel();
    stage.invalidate();
  }
  /** The scene and the panel (the measured numbers, the status, the play button): when something changes. */
  function refresh() {
    drawScene();
    el.slots.forEach((b, i) => {
      const a = s.marks[i];
      b.textContent = a == null ? '?' : N(fmt(s.example, measuredDistance(a)));
      b.classList.toggle('on', a != null);
    });
    const moon = s.example === 'moon'; // the real Moon's distance changes a little: "about" the same
    el.distLabel.textContent = t(moon ? 'dist_k_moon' : 'dist_k', { u: t(unitKey()) });
    el.playIcon.innerHTML = s.playing ? ICONS.pause : ICONS.play;
    el.playLabel.textContent = t(s.playing ? 'act_pause' : 'act_play');
    const n = s.marks.length;
    const status = s.locked
      ? ['status_locked', 'locked']
      : n >= MAX_MARKS
        ? [moon ? 'status_same_moon' : 'status_same', 'contact']
        : n
          ? ['status_more', 'idle']
          : ['status_start', 'idle'];
    el.status.textContent = t(status[0], { n: MAX_MARKS - n });
    el.statusDot.dataset.tone = status[1];
  }

  // ── labels on the 3D ────────────────────────────────────────────────────────
  // The fixed point's label sits just outside the hub (motor, pin, Earth). The distance rides beside the dashed
  // line, pushed sideways until it covers neither body nor the fixed point's label. In the test the Earth's and
  // the Moon's names sit on the far sides of the two bodies. All follow the turning example on the screen.
  const pts = { c: new THREE.Vector3(), d: new THREE.Vector3(), p: new THREE.Vector3(), e: new THREE.Vector3(), m: new THREE.Vector3() };
  const wC = new THREE.Vector3();
  const wP = new THREE.Vector3();
  const sC = { x: 0, y: 0 };
  const sP = { x: 0, y: 0 };
  const wPath = new THREE.Vector3();
  const sPath = { x: 0, y: 0 };
  const PATH_DX = 30; // the "circular path" label: right of and below its point on the circle
  const PATH_DY = 30;
  const ndcV = new THREE.Vector3();
  let labelsOn = true;
  const LABELS = ['center', 'dist', 'path'];
  const DIST_AT = { fan: 0.55, clock: 0.55, moon: 0.62 }; // where along the dashed line its number sits
  const boxes = {}; // label id → { el, w, h }: the size of its box, read once it is laid out
  let centerDy = 0;

  function addLabel(id, opts) {
    annotations.add(id, opts);
    boxes[id] = { el: ui.annoLayer.lastElementChild, w: 0, h: 0 };
  }
  function boxOf(id) {
    const b = boxes[id];
    if (b && !b.w && b.el.isConnected) {
      b.w = b.el.offsetWidth;
      b.h = b.el.offsetHeight;
    }
    return b?.w ? b : { w: 90, h: 24 };
  }
  function onScreen(p, out) {
    ndcV.copy(p).project(camera);
    out.x = (ndcV.x * 0.5 + 0.5) * stage.width;
    out.y = (-ndcV.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  /** The world point drawn (ox, oy) pixels away from world point p: where a label beside a part goes. */
  function besidePx(p, ox, oy, out) {
    ndcV.copy(p).project(camera);
    ndcV.x += (2 * ox) / stage.width;
    ndcV.y -= (2 * oy) / stage.height;
    return out.copy(ndcV).unproject(camera);
  }
  /** Does a label box (w×h) centred at (x, y) touch an obstacle: a circle { x, y, r } or a box { x, y, w, h }? */
  function touches(o, x, y, box) {
    if (o.r != null) {
      const dx = Math.max(Math.abs(o.x - x) - box.w / 2, 0);
      const dy = Math.max(Math.abs(o.y - y) - box.h / 2, 0);
      return dx * dx + dy * dy < (o.r + 3) ** 2;
    }
    return Math.abs(o.x - x) < (o.w + box.w) / 2 + 3 && Math.abs(o.y - y) < (o.h + box.h) / 2 + 3;
  }
  const ONE_SIDE = [1];
  const BOTH_SIDES = [1, -1];
  const placed = { x: 0, y: 0 }; // besideLine's answer (reused: labels are placed every frame while it turns)
  /**
   * The centre of a label box beside a line from (cx, cy) along (ux, uy), about `along` pixels out, clear of the
   * first `count` obstacles: the nearest free place a little further out along the line or a little further to the
   * side.
   */
  function besideLine(cx, cy, ux, uy, along, box, obstacles, count, alongMax = along, sides = ONE_SIDE, memo = { side: 1 }) {
    const base = (Math.abs(uy) * box.w + Math.abs(ux) * box.h) / 2 + 5;
    let bestCost = Infinity;
    let bestSide = 0;
    for (const side of sides) {
      const nx = -uy * side;
      const ny = ux * side;
      search: for (let off = base; off < base + 80; off += 2) {
        for (let a = along; a <= Math.max(along, alongMax); a += 4) {
          const x = cx + ux * a + nx * off;
          const y = cy + uy * a + ny * off;
          let blocked = false;
          for (let i = 0; i < count && !blocked; i++) blocked = touches(obstacles[i], x, y, box);
          if (blocked) continue;
          // the cost of moving away from the ideal place; changing sides costs extra, so the label does not flicker
          const cost = off - base + (a - along) / 2 + (side === memo.side ? 0 : 20);
          if (cost < bestCost) {
            bestCost = cost;
            bestSide = side;
            placed.x = x;
            placed.y = y;
          }
          break search;
        }
      }
    }
    if (!bestSide) {
      placed.x = cx + ux * along - uy * base;
      placed.y = cy + uy * along + ux * base;
    } else memo.side = bestSide;
    return placed;
  }
  const distSide = { side: 1 }; // the side of its line the distance is on (it changes sides only when it must)
  const line = { e: null, len: 1, ux: 0, uy: 1, hub: 0, end: 0 }; // lineOnScreen's answer (reused every frame)
  /** The fixed point and the moving point on the screen, the direction between them, and the bodies' sizes. */
  function lineOnScreen() {
    const e = cur();
    onScreen(e.overlay.centerWorld(wC), sC);
    onScreen(e.overlay.pointWorld(wP), sP);
    const len = Math.hypot(sP.x - sC.x, sP.y - sC.y) || 1;
    line.e = e;
    line.len = len;
    line.ux = (sP.x - sC.x) / len;
    line.uy = (sP.y - sC.y) / len;
    line.hub = sizeOnScreen(wC, sC, e.hub);
    line.end = sizeOnScreen(wP, sP, e.endSize ?? e.r * (e.pointSize ?? 0.047) * 1.4);
    return line;
  }
  /** How many pixels a ball of radius `size` round world point p (at screen point s) looks, from any view. */
  const camUp = new THREE.Vector3();
  const sizeW = new THREE.Vector3();
  const sizeS = { x: 0, y: 0 };
  function sizeOnScreen(p, sp, size) {
    camUp.setFromMatrixColumn(camera.matrixWorld, 1);
    onScreen(sizeW.copy(p).addScaledVector(camUp, size), sizeS);
    return Math.hypot(sizeS.x - sp.x, sizeS.y - sp.y);
  }
  // what the distance's label keeps clear of: the hub, the moving end, the other two labels (reused every frame)
  const obstacles = [
    { x: 0, y: 0, r: 0 },
    { x: 0, y: 0, r: 0 },
    { x: 0, y: 0, w: 0, h: 0 },
    { x: 0, y: 0, w: 0, h: 0 },
  ];
  const setCircle = (o, x, y, r) => {
    o.x = x;
    o.y = y;
    o.r = r;
  };
  const setBox = (o, x, y, w, h) => {
    o.x = x;
    o.y = y;
    o.w = w;
    o.h = h;
  };
  function distPoint(out) {
    const { e, len, ux, uy, hub, end } = lineOnScreen();
    setCircle(obstacles[0], sC.x, sC.y, hub);
    setCircle(obstacles[1], sP.x, sP.y, end);
    let n = 2;
    if (boxes.center) {
      const c = boxOf('center');
      setBox(obstacles[n++], sC.x, sC.y + centerDy, c.w, c.h);
    }
    if (annotations.has('path')) {
      // the kit puts a label with dx > 0 to the right of its point: its box starts dx to the right, centred on dy
      const b = boxOf('path');
      onScreen(e.overlay.worldAt(PATH_LABEL_AT[e.id], wPath), sPath);
      setBox(obstacles[n++], sPath.x + PATH_DX + b.w / 2, sPath.y + PATH_DY, b.w, b.h);
    }
    const at = besideLine(sC.x, sC.y, ux, uy, len * DIST_AT[e.id], boxOf('dist'), obstacles, n, len, BOTH_SIDES, distSide);
    return besidePx(wC, at.x - sC.x, at.y - sC.y, out);
  }
  /** The Moon's name beyond the Moon (or beside it at the edge of the view), the Earth's on the far side. */
  function moonNamePoint(out) {
    const { ux, uy, end } = lineOnScreen();
    const box = boxOf('moon');
    const reach = (Math.abs(ux) * box.w + Math.abs(uy) * box.h) / 2 + end + 6;
    let x = sP.x + ux * reach;
    let y = sP.y + uy * reach;
    if (x - box.w / 2 < 4 || x + box.w / 2 > stage.width - 4 || y - box.h / 2 < 4 || y + box.h / 2 > stage.height - 4) {
      setCircle(obstacles[0], sP.x, sP.y, end);
      const side = besideLine(sP.x, sP.y, ux, uy, 0, box, obstacles, 1);
      x = side.x;
      y = side.y;
    }
    return besidePx(wC, x - sC.x, y - sC.y, out);
  }
  function earthNamePoint(out) {
    const { ux, uy, hub } = lineOnScreen();
    const box = boxOf('earth');
    const reach = (Math.abs(ux) * box.w + Math.abs(uy) * box.h) / 2 + hub + 6;
    return besidePx(wC, -ux * reach, -uy * reach, out);
  }

  function radiusOnScreen() {
    const { distance } = viewPose();
    return (cur().r / (distance * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2))) * (stage.height / 2);
  }
  /** The distance on the dashed line: "? cm" until the student has measured it once. */
  function distText() {
    const id = s.example;
    if (!s.distKnown) return t('label_dist', { d: '?', u: t(unitKey()) });
    return t(id === 'moon' ? 'label_dist_about' : 'label_dist', { d: fmt(id, EXAMPLES[id].value), u: t(unitKey()) });
  }
  function setLabels() {
    for (const k of LABELS) annotations.remove(k);
    if (!labelsOn) return;
    const e = cur();
    // just below the hub, so its leader is short and never looks like another radius
    centerDy = (e.hub * radiusOnScreen()) / e.r + 18;
    addLabel('center', {
      text: t('label_center'),
      point: () => e.overlay.centerWorld(pts.c),
      dx: 0,
      dy: centerDy,
      kind: 'callout',
      color: INK.center,
    });
    addLabel('dist', { text: distText(), point: () => distPoint(pts.d), dx: 0, dy: 0, kind: 'callout', color: INK.dist });
    if (coverageFraction(s.cov) >= 0.5) addPathLabel();
  }
  function addPathLabel() {
    const e = cur();
    const at = PATH_LABEL_AT[s.example];
    addLabel('path', {
      text: t('label_path'),
      point: () => e.overlay.worldAt(at, pts.p),
      dx: PATH_DX,
      dy: PATH_DY,
      kind: 'callout',
      color: INK.path,
    });
  }

  // ── turning ─────────────────────────────────────────────────────────────────
  function turnTo(deg) {
    s.angle = deg;
    s.cov = extendCoverage(s.cov, deg);
    drawScene();
  }
  stage.addTicker((dt) => {
    if (!s.playing || s.drag || s.hold) return false;
    turnTo(s.angle + turned(dt, EXAMPLES[s.example].period));
    return true;
  });

  /** Start an example afresh: the point at its start, nothing traced or measured yet. */
  function restart(id, angle = START[id]) {
    s.angle = angle;
    s.from = angle;
    s.cov = { lo: angle, hi: angle };
    s.marks = [];
    s.grow = 1;
    s.sameShown = false;
    s.distKnown = false;
    tweener.cancel('mark');
    tweener.cancel('turn');
  }

  function setExample(id, { animate = true } = {}) {
    if (!ex[id]) return;
    s.example = id;
    for (const e of Object.values(ex)) e.root.visible = e === cur();
    if (backgrounds) scene.background = backgrounds[id];
    restart(id);
    cur().overlay.setGhost(null);
    // the book's line about the example, then how the picture is stylised (a quiet aside, not on the 3D view)
    el.book.innerHTML = `${t(id === 'moon' ? 'book_moon' : 'book_fan')} <span class="cm-style">${t(`note_${id}`)}</span>`;
    for (const b of el.chips) b.classList.remove('cm-nudge');
    setLabels();
    syncUI();
    const e = cur();
    if (animate) {
      tweener.animate({
        key: 'pop',
        duration: 0.45,
        ease: ease.outBack,
        onUpdate: (k) => {
          e.root.scale.setScalar(Math.max(0.001, k));
          stage.invalidate();
        },
      });
    } else {
      tweener.cancel('pop');
      e.root.scale.setScalar(1);
    }
    s.userMovedCamera = false;
    intro = 0;
    // turning the view keeps the camera in the example's place: under the ceiling, in front of the wall
    const lim = ORBIT[id];
    controls.minPolarAngle = lim.polar[0];
    controls.maxPolarAngle = lim.polar[1];
    controls.minAzimuthAngle = lim.azimuth[0];
    controls.maxAzimuthAngle = lim.azimuth[1];
    const fit = viewPose();
    controls.minDistance = fit.distance * 0.45;
    controls.maxDistance = fit.distance * 2.5;
    flyTo(fit, animate ? 0.6 : 0);
    hideHint();
    refresh();
    emit('example', { example: id });
    emitChange();
  }

  function setPlaying(on) {
    s.playing = Boolean(on);
    refresh();
    emitChange();
  }

  /** Measure the distance where the moving point is now: a line is left there and the panel gets the number. */
  function measure({ silent = false, animate = true } = {}) {
    if (s.locked) return lockedNudge();
    // four measurements at four different places: one close to an earlier one takes its place
    const near = s.marks.findIndex((a) => angleBetween(a, s.angle) < SAME_PLACE);
    if (near >= 0) {
      s.marks.splice(near, 1);
      if (!silent) showHint(t('hint_elsewhere'), { duration: 2600 });
    }
    s.marks.push(s.angle);
    if (s.marks.length > MAX_MARKS) s.marks.shift();
    coach?.objectUsed();
    if (!s.distKnown) {
      s.distKnown = true;
      setLabels();
    }
    const d = measuredDistance(s.angle);
    if (!silent) audio.pop();
    if (animate) {
      s.grow = 0;
      tweener.animate({
        key: 'mark',
        duration: 0.35,
        ease: ease.outCubic,
        onUpdate: (k) => {
          s.grow = k;
          drawScene();
        },
      });
    } else s.grow = 1;
    if (s.marks.length === MAX_MARKS && !s.sameShown) {
      // four times the same number: the panel says so (and the numbers light up once)
      s.sameShown = true;
      if (!silent) {
        audio.success();
        el.slotRow.classList.remove('flash');
        void el.slotRow.offsetWidth;
        el.slotRow.classList.add('flash');
        // and the next example's chip glows: there is more to see (the Moon above all)
        const next = EXAMPLE_IDS[(EXAMPLE_IDS.indexOf(s.example) + 1) % EXAMPLE_IDS.length];
        for (const b of el.chips) b.classList.toggle('cm-nudge', b.dataset.ex === next);
      }
    } else if (s.marks.length === 2 && !s.dragged && !silent) showHint(t('hint_drag'), { duration: 3600 });
    emit('measure', { example: s.example, angle: roundTo(wrap360(s.angle), 0.1), distance: d, unit: UNIT_CODE[unitKey()] });
    refresh();
    emitChange();
  }

  function turnBy(delta) {
    if (s.locked) return lockedNudge();
    s.playing = false;
    turnTo(s.angle + delta);
    refresh();
    emitChange();
  }

  function lockedNudge() {
    showHint(t('q_locked'), { duration: 3000 });
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const up = new THREE.Vector3();
  function viewPose(view = s.view) {
    const e = cur();
    const dir = e.views[view];
    const target = new THREE.Vector3();
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    // room for the buttons in the top right corner, unless the circle (as tall as the view) stays clear of them
    const clear = stage.width / 2 - stage.height / 2 > ui.corner.offsetWidth + 24;
    const top = clear ? 10 : Math.min(56, Math.max(36, stage.height * 0.16));
    const bottom = 6;
    const usable = Math.max(0.4, (stage.height - top - bottom) / Math.max(stage.height, 1));
    const sideUsable = Math.max(0.6, (stage.width - 16) / Math.max(stage.width, 1));
    const R = e.fit.radius;
    const distance = Math.max(R / Math.tan(vfov / 2) / usable, R / Math.tan(hfov / 2) / sideUsable) + e.fit.depth;
    // centre the circle in the room below the buttons: move the look-at point up the screen
    up.set(0, 1, 0).addScaledVector(dir, -dir.y).normalize();
    const perPixel = (2 * distance * Math.tan(vfov / 2)) / Math.max(stage.height, 1);
    target.addScaledVector(up, ((top - bottom) / 2) * perPixel);
    return { target, position: target.clone().addScaledVector(dir, distance), distance };
  }
  function flyTo({ position, target }, duration = 0.8) {
    tweener.cancel('camera');
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, target, k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    intro = 0;
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    return flyTo(viewPose(s.view), animate ? 0.8 : 0);
  }
  controls.enablePan = false;
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    if (intro === 1) flyTo(viewPose('3d'), 0);
    else if (!s.userMovedCamera && !intro) flyTo(viewPose(s.view), 0);
    root.classList.toggle('cm-compact', stage.height < 300 || stage.width < 340);
    setLabels(); // the fixed point's label keeps its place beside the circle
  });

  // ── touching the example: a tap measures, a drag turns it by hand ───────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const v = new THREE.Vector3();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const toScreen = (p) => {
    v.copy(p).project(camera);
    return { x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height };
  };
  /** Does a finger at canvas point p take the example? Near the moving point, or on its turning part. */
  function pick(p, reach = 30) {
    const e = cur();
    const q = toScreen(e.overlay.pointWorld(v));
    if (Math.hypot(q.x - p.x, q.y - p.y) < reach) return true;
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(e.grab, false).length > 0;
  }
  const turnPlane = new THREE.Plane();
  const normal = new THREE.Vector3();
  const onPlane = new THREE.Vector3();
  /** The angle (seen from the fixed point, in the example's plane) of the place under canvas point p. */
  function planeAngle(p) {
    const e = cur();
    e.plane.getWorldDirection(normal);
    turnPlane.setFromNormalAndCoplanarPoint(normal, e.overlay.centerWorld(onPlane));
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    if (!raycaster.ray.intersectPlane(turnPlane, onPlane)) return null;
    e.plane.worldToLocal(onPlane);
    return angleOf(onPlane.x, onPlane.y);
  }

  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      root.focus({ preventScroll: true });
      coach?.interrupt();
      if (s.drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const p = canvasPoint(e);
      if (!pick(p, e.pointerType === 'mouse' ? 22 : 34)) return; // the camera controls take it
      e.stopPropagation(); // a touch on the example is not a camera move
      e.preventDefault();
      if (s.locked) return lockedNudge();
      // it stops under the finger at once, so the distance is measured where it was touched
      s.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, last: planeAngle(p), moved: false };
      tweener.cancel('turn');
      try {
        ui.canvasHost.setPointerCapture(e.pointerId); // the drag goes on when the finger leaves the fan
      } catch {} // the pointer is already gone (lifted at once): nothing to follow
      ui.canvasHost.style.cursor = 'grabbing';
      emit('dragstart', snapshot());
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const d = s.drag;
    if (!d || e.pointerId !== d.id) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
    d.moved = true;
    const a = planeAngle(canvasPoint(e));
    if (a == null) return;
    if (d.last != null) turnTo(s.angle + (unwrap(d.last, a) - d.last));
    d.last = a;
  });
  function endDrag(e, cancelled = false) {
    const d = s.drag;
    if (!d || e.pointerId !== d.id) return;
    s.drag = null;
    ui.canvasHost.style.cursor = '';
    if (d.moved) {
      s.dragged = true;
      hideHint();
    }
    if (!cancelled) measure();
    emit('dragend', snapshot());
  }
  ui.canvasHost.addEventListener('pointerup', (e) => endDrag(e));
  ui.canvasHost.addEventListener('pointercancel', (e) => endDrag(e, true));
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (s.drag || e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
      ui.canvasHost.style.cursor = pick(p, 22) ? (s.locked ? 'not-allowed' : 'grab') : '';
    });
  });

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 4000 } = {}) {
    ui.hintText.textContent = text;
    ui.hintAct.hidden = true;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    if (duration) hintTimer = setTimeout(hideHint, duration);
  }
  function hideHint() {
    clearTimeout(hintTimer);
    ui.hint.classList.remove('show');
  }

  // ── the test ────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
  const LETTERS = t('letters').split(' ');
  const textLabel = (keys) => (j) => `<span class="cm-txt">${t(keys[j])}</span>`;
  // each letter on its own side of its point, so letters on parts that line up (two hands) never pile up
  const TAG_OFFSET = { center: [-26, 26], tip: [26, -26], mid: [-28, 18], other: [24, 28] };

  const QUIZ_LABELS = ['tag0', 'tag1', 'tag2', 'tag3', 'after', 'earth', 'moon'];
  /**
   * The scene for a question: an example (afresh, at `angle`), turning or not, with or without the drawing and
   * labels; known: the dashed line shows its number (otherwise "?" until the answer).
   */
  function setupQuestion({ id, playing = true, angle, overlay = true, labels = true, known = true }) {
    for (const k of QUIZ_LABELS) annotations.remove(k);
    if (id !== s.example) setExample(id);
    restart(id, angle ?? s.angle);
    s.distKnown = known;
    s.playing = playing;
    s.hold = false;
    labelsOn = labels;
    cur().overlay.setVisible({ path: overlay, radius: overlay, center: overlay, marks: overlay });
    cur().overlay.setGhost(null);
    setLabels();
    refresh();
  }
  function showDrawing() {
    labelsOn = true;
    s.distKnown = true;
    cur().overlay.setVisible();
    setLabels();
    refresh();
  }

  let kinds = [];
  let question = null;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    hooks: {
      enter() {
        s.mode = 'quiz';
        s.locked = true;
        s.drag = null;
        hideHint();
        kinds = shuffle(['center', 'turn', 'same', 'life', 'moon']);
        syncUI();
        refresh();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.hold = false;
        s.playing = o.play !== false;
        tweener.cancel('turn');
        cur().overlay.setGhost(null);
        for (const k of QUIZ_LABELS) annotations.remove(k);
        restart(s.example, s.angle);
        cur().overlay.setVisible();
        labelsOn = true;
        setLabels();
        syncUI();
        refresh();
      },
      prepare(i, _alive, say) {
        const kind = kinds[i % kinds.length];
        if (kind === 'center') {
          // which of four points is the fixed one? While it turns, three of them go round. The clock's second hand
          // starts well away from the minute hand.
          const id = pickOne(['fan', 'clock']);
          setupQuestion({ id, angle: id === 'clock' ? 200 : 30 * Math.floor(Math.random() * 12), overlay: false, labels: false });
          const keys = shuffle(['center', 'tip', 'mid', 'other']);
          const e = cur();
          const tagPts = keys.map(() => new THREE.Vector3());
          keys.forEach((k, j) =>
            annotations.add(`tag${j}`, {
              text: LETTERS[j],
              point: () => e.tags[k](tagPts[j]),
              dx: TAG_OFFSET[k][0],
              dy: TAG_OFFSET[k][1],
              kind: 'callout',
              color: '#1d2733',
            }),
          );
          const expected = keys.indexOf('center');
          say(t('q_center'));
          question = { kind, id, letter: LETTERS[expected] };
          return {
            choices: [0, 1, 2, 3],
            expected,
            tolerance: 0.5,
            label: (j) => `<span class="cm-letter">${LETTERS[j]}</span>`,
            meta: { kind, example: id },
          };
        }
        if (kind === 'turn') {
          // how far from the fixed point after half a turn (or one turn)? The distance from the start and the path
          // walked are the traps. Fan or clock only: the Moon's distance is only "about" the same.
          const id = pickOne(['fan', 'clock']);
          const angle = 30 + 30 * Math.floor(Math.random() * 10);
          const fraction = Math.random() < 0.65 ? 0.5 : 1;
          setupQuestion({ id, playing: false, angle });
          if (fraction === 0.5) {
            cur().overlay.setGhost(angle + 180);
            const g = new THREE.Vector3();
            annotations.add('after', {
              text: t('label_after_half'),
              point: () => cur().overlay.worldAt(angle + 180, g),
              dx: 0,
              dy: 30,
              kind: 'callout',
              color: INK.dist,
            });
          }
          const ex_ = EXAMPLES[id];
          const u = t(ex_.unit);
          say(t(fraction === 0.5 ? 'q_turn_half' : 'q_turn_full', { who: t(`who_${id}`), d: fmt(id, ex_.value), u }));
          question = { kind, id, angle, fraction };
          return {
            choices: shuffle([ex_.value, ...distanceMistakes(id, fraction)]),
            expected: ex_.value,
            tolerance: 0.5 * 10 ** -ex_.decimals,
            label: (val) => `${N(fmt(id, val))}<small>${u}</small>`,
            meta: { kind, example: id, fraction },
          };
        }
        if (kind === 'same') {
          // the dashed line says "?": the number comes with the answer
          const id = pickOne(['fan', 'clock']);
          setupQuestion({ id, known: false });
          const keys = shuffle(['same_dist', 'same_place', 'same_dir', 'same_start']);
          say(t('q_same', { who: t(`who_${id}`) }));
          question = { kind, id };
          return { choices: [0, 1, 2, 3], expected: keys.indexOf('same_dist'), tolerance: 0.5, label: textLabel(keys), meta: { kind, example: id } };
        }
        if (kind === 'life') {
          // about everyday things: the fan just turns, with nothing drawn on it
          const right = pickOne(['life_pinwheel', 'life_stone']);
          const keys = shuffle([right, 'life_ball', 'life_car', 'life_box']);
          setupQuestion({ id: 'fan', overlay: false, labels: false });
          say(t('q_everyday'));
          question = { kind, right };
          return { choices: [0, 1, 2, 3], expected: keys.indexOf(right), tolerance: 0.5, label: textLabel(keys), meta: { kind } };
        }
        // the Moon: what kind of motion (the page's own names)? Or: where is its fixed point?
        const variant = pickOne(['kind', 'center']);
        setupQuestion({ id: 'moon', overlay: variant === 'kind', labels: variant === 'kind' });
        if (variant === 'center') {
          addLabel('earth', { text: t('label_earth'), point: () => earthNamePoint(pts.e), dx: 0, dy: 0, kind: 'part' });
          addLabel('moon', { text: t('label_moon'), point: () => moonNamePoint(pts.m), dx: 0, dy: 0, kind: 'part' });
        }
        const keys =
          variant === 'kind'
            ? shuffle(['kind_rotation', 'kind_linear', 'kind_translation', 'kind_shm'])
            : shuffle(['moon_c_earth', 'moon_c_moon', 'moon_c_surface', 'moon_c_middle']);
        const right = variant === 'kind' ? 'kind_rotation' : 'moon_c_earth';
        say(t(variant === 'kind' ? 'q_moon_kind' : 'q_moon_center'));
        question = { kind, variant };
        return { choices: [0, 1, 2, 3], expected: keys.indexOf(right), tolerance: 0.5, label: textLabel(keys), meta: { kind, variant } };
      },
      reveal() {
        const q = question;
        const id = s.example;
        const d = fmt(id, EXAMPLES[id].value);
        const u = t(EXAMPLES[id].unit);
        if (q.kind === 'center') {
          // the letters stay; the drawing comes back, its purple dot on the fixed point
          cur().overlay.setVisible();
          refresh();
          return t('center_why', { c: q.letter });
        }
        if (q.kind === 'turn') {
          // the point goes the half (or whole) turn; the dashed line and its number stay the same
          annotations.remove('after');
          const a0 = q.angle;
          const a1 = a0 + q.fraction * 360;
          s.hold = true;
          tweener.animate({
            key: 'turn',
            duration: 1.4 * q.fraction + 0.4,
            ease: ease.inOutCubic,
            onUpdate: (k) => turnTo(a0 + (a1 - a0) * k),
            onComplete: () => {
              s.hold = false;
              cur().overlay.setGhost(null);
            },
          });
          if (q.fraction === 1) return t('turn_why_full', { d, u });
          return t('turn_why_half', { d, u, c: fmt(id, chord(EXAMPLES[id].value, 180)) });
        }
        if (q.kind === 'same') {
          showDrawing();
          return t('same_why', { d, u });
        }
        if (q.kind === 'life') return t(q.right === 'life_pinwheel' ? 'life_why_pinwheel' : 'life_why_stone');
        annotations.remove('earth');
        annotations.remove('moon');
        showDrawing();
        return q.variant === 'kind' ? t('moon_kind_why') : t('moon_center_why', { d, u });
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── first-use pointer: on the moving point ──────────────────────────────────
  let coach = null;
  if (o.coach) {
    const p = new THREE.Vector3();
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint],
      object: {
        label: 'coach_tap',
        // the moving point first; near the bottom edge (no room for the hand) a spot further in on the blade or hand
        candidates: () => {
          const e = cur();
          return [1, 0.82, 0.66].map((k) => toScreen(k === 1 ? e.overlay.pointWorld(p) : e.overlay.radius.localToWorld(p.set(0, e.r * k, e.lift))));
        },
        grabbable: (q) => pick(q),
        // the point swells twice, as if to say "here"
        async demo(alive) {
          const point = cur().overlay.point;
          for (let i = 0; i < 2 && alive(); i++) {
            await tweener.animate({
              key: 'coach-pulse',
              duration: 0.7,
              onUpdate: (k) => {
                point.scale.setScalar(1 + 0.6 * Math.sin(k * Math.PI));
                stage.invalidate();
              },
            }).finished;
          }
          point.scale.setScalar(1);
        },
        cancel: () => {
          tweener.cancel('coach-pulse');
          cur().overlay.point.scale.setScalar(1);
          stage.invalidate();
        },
      },
    });
  }

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    for (const b of ui.$$('[data-view]')) b.classList.toggle('on', b.dataset.view === s.view);
    for (const b of ui.$$('[data-ex]')) {
      const on = b.dataset.ex === s.example;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    }
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
    coach?.setMode(s.mode);
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.ex && b.dataset.ex !== s.example) setExample(b.dataset.ex);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'play':
        setPlaying(!s.playing);
        break;
      case 'measure':
        if (e.detail === 0) measure(); // the keyboard; a finger or the mouse acted on pointerdown
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  // the measure button acts as it goes down: the point is measured where it is at that moment
  root.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !(/** @type {Element} */ (e.target).closest('[data-act="measure"]'))) return;
    audio.unlock();
    measure();
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowright' || k === 'arrowup') turnBy(e.shiftKey ? 45 : 10);
    else if (k === 'arrowleft' || k === 'arrowdown') turnBy(e.shiftKey ? -45 : -10);
    else if (k === ' ' && !target.closest('button')) setPlaying(!s.playing);
    else if (k === 'm') measure();
    else if (k === 'p') setPlaying(!s.playing);
    else if (k === '1' || k === '2' || k === '3') {
      if (s.mode !== 'quiz') setExample(EXAMPLE_IDS[Number(k) - 1]);
    } else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  controls.enableRotate = s.view === '3d';
  root.classList.toggle('cm-compact', stage.height < 300 || stage.width < 340);
  setExample(s.example, { animate: false });
  syncUI();
  refresh();
  // the first time (with the pointers on) the camera starts beside the fan, so it reads as a ceiling fan with its
  // rod and canopy, then flies under it, where the circle is round
  if (o.coach && o.mode !== 'quiz' && s.example === 'fan' && s.view === 'front') {
    intro = 1;
    flyTo(viewPose('3d'), 0);
    setTimeout(() => {
      if (intro !== 1) return;
      intro = 2;
      flyTo(viewPose('front'), 1.6).then(() => {
        intro = 0;
        if (!s.userMovedCamera) flyTo(viewPose(s.view), 0);
      });
    }, 700);
  }
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    else coach?.start(intro ? 2600 : 900);
  })();

  // A moment after the start, the other two examples' shaders are compiled (in parallel where the browser can) and
  // their pictures (the clock's dial, the Earth and the Moon) sent to the GPU, so the first tap on ঘড়ির কাঁটা or চাঁদ
  // does not stall. Each is compiled alone in a scene with the same lighting, with only its own lamp, as it will be
  // drawn; it is back in place before the next frame.
  function warmUp() {
    const shown = cur();
    for (const e of Object.values(ex)) {
      if (e === shown) continue;
      const alone = new THREE.Scene();
      alone.environment = scene.environment;
      alone.environmentIntensity = scene.environmentIntensity;
      e.root.visible = true;
      alone.add(e.root);
      try {
        stage.renderer.compileAsync(alone, camera).catch(() => {});
        e.root.traverse((m) => {
          for (const mat of [m.material].flat()) for (const map of [mat?.map, mat?.emissiveMap]) if (map) stage.renderer.initTexture(map);
        });
      } finally {
        world.add(e.root);
        e.root.visible = e === cur();
      }
    }
  }
  setTimeout(warmUp, 1500);

  return {
    ready,
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: snapshot,
    /**
     * Change any of: example ('fan' | 'clock' | 'moon', starts it afresh), playing, angle (degrees from "up" in the
     * way it turns; the path starts again there), trail (0…1: that much of the path already traced, ending at the
     * point), marks (angles where the distance was measured), measure (true: measure now), view;
     * animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.example && (p.example !== s.example || !cur().root.visible)) setExample(p.example, { animate });
      if (p.view) await setView(p.view, { animate });
      if (p.playing != null) s.playing = Boolean(p.playing);
      if (p.angle != null && Number.isFinite(Number(p.angle))) {
        const a = Number(p.angle);
        s.angle = a;
        s.from = a;
        s.cov = { lo: a, hi: a };
      }
      if (p.trail != null) {
        const f = Math.min(1, Math.max(0, Number(p.trail) || 0));
        s.from = s.angle;
        s.cov = { lo: s.angle - 360 * f, hi: s.angle };
      }
      if (Array.isArray(p.marks)) {
        s.marks = p.marks.slice(-MAX_MARKS).map(Number);
        s.grow = 1;
        s.sameShown = s.marks.length >= MAX_MARKS;
        if (s.marks.length && !s.distKnown) {
          s.distKnown = true; // measured: the dashed line shows its number
          setLabels();
        }
      }
      if (p.measure) measure({ silent: true, animate });
      if (coverageFraction(s.cov) < 0.5) annotations.remove('path');
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      hideHint();
      s.playing = o.play !== false;
      s.dragged = false;
      setExample(EXAMPLE_IDS.includes(o.example) ? o.example : 'fan', { animate: false });
      await setView('front');
    },
    startPractice: () => quiz.start(),
    /** The view as a picture; with a background given (null: transparent) the example alone, without its setting. */
    capture(opts = {}) {
      const background = scene.background;
      const setting = cur().setting;
      if (opts.background !== undefined) {
        scene.background = null;
        if (setting) setting.visible = false;
      }
      try {
        return stage.capture(opts);
      } finally {
        scene.background = background;
        if (setting) setting.visible = true;
        stage.invalidate();
      }
    },
    exportRoot: () => cur().exportRoot, // the example's model: no drawing, labels, lights or shadow planes
  };
}
