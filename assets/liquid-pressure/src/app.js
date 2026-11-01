// Pressure in liquids (book page 134, topic 5.3), student view. A tall glass tank of water stands on a brick stand in
// a courtyard; three brass spouts at depths 0.2, 0.4 and 0.6 m are stopped with corks. Inside the water the book's
// figure 5.02 is drawn: an imagined column of water above a surface A (100 cm²) at a depth h, its weight F = (Ahρ)g
// pressing on A, so P = F/A = hρg. The student opens the holes one by one (the action, or a tap on a spout): the cork
// pops, a jet arcs out (the deeper the hole, the harder and further) and a red arrow at the hole shows the pressure
// there, longer for deeper holes; the first time the camera goes close to the hole. The surface A can be dragged up
// and down (or moved with the arrow keys) and P = hρg is worked out live with the book's units. The rule grows in the
// book's words: the column's weight, pressure grows with depth (the depth gauge fills red), about one atmosphere per
// ten metres of water. Then a five-question test. Built on the shared student kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createArrow } from '@shared/arrow.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { createCourtyard, skyTexture } from './courtyard.js';
import { COLUMN_R, GAUGE_X, GLASS_TOP, NOZZLE, R, SURFACE, createTank, holeY } from './tank.js';
import {
  AREA_CM2,
  ATM,
  DEPTH_LIMITS,
  G,
  H,
  HOLES,
  HOLE_IDS,
  RHO,
  STAND,
  arrowLength,
  column,
  fixDepth,
  groupBD,
  groupIntl,
  holeAt,
  holeChoices,
  jetReach,
  pressure,
  round,
  tenMetreChoices,
} from './reading.js';

export const DEFAULTS = {
  h: HOLES.top, // the depth of the surface A (m)
  open: 'none', // 'none' | a list of holes ('top,bot') | 'all': open at the start
  look: 'all', // 'all' | 'close': the whole tank and its jets, or close to the surface A
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { P: '#e03131', F: '#7048e8', A: '#0c8599', h: '#1c6fd9', ink: '#1d2733' };
const NBSP = ' ';
const DOUBLE_TAP = 400; // ms
const OPEN_S = 1.3; // s: the cork pops and the jet reaches the ground
const TOUR_HOLD = 2.8; // s close to the first hole opened
const F_ARROW = 0.75; // the force's arrow is this part of the column's height (so its length goes with F)
const DIM_X = -COLUMN_R - 0.045; // the h dimension's line
const MARGIN = { top: 50, bottom: 12, side: 6 };
const UPV = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);
const RIGHT = new THREE.Vector3(1, 0, 0);
const LOOK_DIR = new THREE.Vector3(0.1, 0.24, 1).normalize();
const CLOSE_DIR = new THREE.Vector3(0.18, 0.26, 1).normalize();

const parseOpen = (v) => {
  if (Array.isArray(v)) return HOLE_IDS.filter((id) => v.includes(id));
  const s = String(v ?? '');
  if (s === 'all') return [...HOLE_IDS];
  return HOLE_IDS.filter((id) => s.split(/[,\s]+/).includes(id));
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const fmt = (x) => N(t.lang === 'bn' ? groupBD(x) : groupIntl(x)); // Bangladeshi commas in Bangla (৯৮,০০০)

  root.classList.add('pvc', 'lp');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, {
      examples: { label: 'holes', results: true, items: HOLE_IDS.map((id) => ({ id, label: `chip_${id}` })) },
      quiet: [
        { act: 'zoom', label: 'act_zoom', icon: ICONS.magnifier },
        { act: 'home', label: 'act_home', icon: ICONS.reset },
      ],
      lines: { action: 1, outcome: 1, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  const zoomBtn = /** @type {HTMLElement} */ ($('[data-act="zoom"]'));
  ui.$('.pvc-outcome')?.setAttribute('aria-label', t('sum_label'));

  // the book's graph (figure 5.03, here for this tank): the pressure goes up in a straight line with the depth; a
  // dot for A and one for each hole that is open
  const graph = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  graph.setAttribute('class', 'lp-graph');
  graph.setAttribute('viewBox', '0 0 320 96');
  graph.setAttribute('role', 'img');
  graph.setAttribute('aria-label', t('graph_label'));
  $('.pvc-rule').after(graph);
  const GX = [52, 292];
  const GY = [70, 18];
  const gx = (h) => GX[0] + ((GX[1] - GX[0]) * h) / H;
  const gy = (P) => GY[0] + ((GY[1] - GY[0]) * P) / pressure(H);
  graph.innerHTML = `
    <g class="ax">
      <line x1="${GX[0]}" y1="${GY[0]}" x2="${GX[1] + 8}" y2="${GY[0]}"/><line x1="${GX[0]}" y1="${GY[0]}" x2="${GX[0]}" y2="${GY[1] - 8}"/>
      ${[0, 0.5, 1].map((h) => `<line x1="${gx(h)}" y1="${GY[0]}" x2="${gx(h)}" y2="${GY[0] + 4}"/><text x="${gx(h)}" y="${GY[0] + 15}" text-anchor="middle">${N(h)}</text>`).join('')}
      ${[0, 0.5, 1].map((h) => `<line x1="${GX[0] - 4}" y1="${gy(pressure(h))}" x2="${GX[0]}" y2="${gy(pressure(h))}"/><text x="${GX[0] - 7}" y="${gy(pressure(h)) + 4}" text-anchor="end">${fmt(pressure(h))}</text>`).join('')}
      <text class="name" x="${GX[1] + 10}" y="${GY[0] + 15}" text-anchor="end">${t('g_x')}</text>
      <text class="name" x="${GX[0] + 8}" y="${GY[1] - 6}">${t('g_y')}</text>
    </g>
    <line class="law" x1="${gx(0)}" y1="${gy(0)}" x2="${gx(H)}" y2="${gy(pressure(H))}"/>
    <g class="holes"></g>
    <line class="guide gv"/><line class="guide gh"/>
    <circle class="now" r="5.5"/>`;
  const gHoles = graph.querySelector('.holes');
  const gNow = graph.querySelector('.now');
  const gv = graph.querySelector('.gv');
  const gh = graph.querySelector('.gh');
  let lastGraph = '';
  function drawGraph() {
    const h = round(s.h, 2);
    const key = `${h}|${HOLE_IDS.map((id) => s.jet[id] > 0).join()}`;
    if (key === lastGraph) return;
    lastGraph = key;
    const x = gx(h);
    const y = gy(pressure(h));
    gNow.setAttribute('cx', String(x));
    gNow.setAttribute('cy', String(y));
    for (const [el, a] of [
      [gv, [x, y, x, GY[0]]],
      [gh, [x, y, GX[0], y]],
    ])
      ['x1', 'y1', 'x2', 'y2'].forEach((k, i) => el.setAttribute(k, String(a[i])));
    gHoles.innerHTML = HOLE_IDS.filter((id) => s.jet[id] > 0)
      .map((id) => `<circle r="3.6" cx="${gx(HOLES[id])}" cy="${gy(pressure(HOLES[id]))}"/>`)
      .join('');
  }

  // a note on the stage (bottom left): how to move A, then what the red arrows mean
  const note = document.createElement('div');
  note.className = 'lp-note';
  ui.stage.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.05, far: 60, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 0.5;
  controls.maxDistance = 9;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = false;
  controls.minPolarAngle = 0.5;
  controls.maxPolarAngle = Math.PI * 0.52;
  if (o.bg !== 'transparent') scene.background = skyTexture();
  scene.add(new THREE.HemisphereLight('#ffe6cc', '#a2522e', 0.95));
  const sun = new THREE.DirectionalLight('#ffdcae', 1.9);
  sun.position.set(-2.2, 3.6, 2.6);
  sun.target.position.set(0.6, 0.6, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#d6e6ff', 0.5);
  fill.position.set(2.5, 1.6, 3);
  scene.add(fill);
  const shadows = o.shadow && o.bg !== 'transparent';
  if (shadows) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -1.4, right: 1.6, top: 1.8, bottom: -1.2, near: 0.5, far: 9 });
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.01;
  }

  const yard = createCourtyard({ shadow: shadows });
  if (o.bg !== 'transparent') scene.add(yard.root);
  const tank = createTank();
  scene.add(tank.root);

  // the arrows are the point of the picture: thick, flat colour in a white outline, drawn over the water
  const flat = (color) =>
    new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false });
  const OUTLINE_FROM = new THREE.Vector3();
  let thick = 1;
  function boldArrow(name, color, r, padK = 0.7) {
    const core = createArrow({ name, radius: r, head: r * 4.6, headRadius: r * 2.6, material: flat(color) });
    const pad = r * padK;
    const outline = createArrow({
      name: `${name}Outline`,
      radius: r + pad,
      head: r * 4.6 + pad * 2.8,
      headRadius: r * 2.6 + pad * 2,
      material: flat('#ffffff'),
    });
    core.root.add(outline.root);
    core.root.renderOrder = 21;
    outline.root.renderOrder = 20;
    core.root.userData.noExport = true;
    return {
      ...core,
      scale(p = 1) {
        core.root.scale.set(thick * p, p, thick * p);
      },
      set(from, dir, length) {
        core.set(from, dir, length);
        OUTLINE_FROM.set(0, -pad, 0);
        if (length > 1e-9) outline.set(OUTLINE_FROM, UPV, length + pad * 2.2);
        else outline.hide();
      },
    };
  }
  const arrows = {
    F: boldArrow('ColumnWeight', COLORS.F, 0.0085),
    hUp: boldArrow('DepthUp', COLORS.h, 0.0055, 0.75),
    hDown: boldArrow('DepthDown', COLORS.h, 0.0055, 0.75),
    P: Object.fromEntries(HOLE_IDS.map((id) => [id, boldArrow(`Pressure_${id}`, COLORS.P, 0.0085)])),
  };
  for (const a of [arrows.F, arrows.hUp, arrows.hDown, ...Object.values(arrows.P)]) scene.add(a.root);
  // the h dimension's end bars, at the surface and at A
  const bar = () => {
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.0045, 0.001), flat(COLORS.h));
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.011, 0.001), flat('#ffffff'));
    core.renderOrder = 21;
    edge.renderOrder = 20;
    g.add(edge, core);
    g.userData.noExport = true;
    scene.add(g);
    return g;
  };
  const bars = [bar(), bar()];

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    h: fixDepth(o.h),
    open: Object.fromEntries(HOLE_IDS.map((id) => [id, false])),
    cork: Object.fromEntries(HOLE_IDS.map((id) => [id, 0])), // 0 in the spout … 1 gone
    jet: Object.fromEntries(HOLE_IDS.map((id) => [id, 0])), // how far the water has got along its path
    fill: 0, // the gauge's red fill
    look: o.look === 'close' ? 'close' : 'all',
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    dragging: false,
    found: { open: false, compare: false, all: false, drag: false },
    show: { column: true, h: true, F: true, A: true, P: true, numbers: true },
    mark: null, // the hole a test question points at
    userMovedCamera: false,
    run: 0, // a token: every new opening, tour, drag or reset bumps it
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  const openCount = () => HOLE_IDS.filter((id) => s.open[id]).length;

  // ── the scene from the state ────────────────────────────────────────────────
  function syncScene() {
    tank.setDepth(s.h);
    tank.column.visible = s.show.column;
    tank.plate.visible = s.show.column;
    for (const id of HOLE_IDS) {
      tank.setCork(id, s.cork[id]);
      tank.setJet(id, s.jet[id]);
    }
    tank.setGaugeFill(s.fill);
    layoutArrows();
    stage.invalidate();
  }

  const V = new THREE.Vector3();
  function layoutArrows() {
    const perPx = (2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
    thick = Math.min(2.4, Math.max(1, (3.2 * perPx) / 0.0085));
    const yA = SURFACE - s.h;
    const all = [arrows.F, arrows.hUp, arrows.hDown, ...Object.values(arrows.P)];
    for (const a of all) {
      a.hide();
      a.scale(1);
    }
    if (s.show.column && s.show.F) {
      const len = F_ARROW * s.h;
      arrows.F.set(V.set(0, yA + 0.008 + len, 0.002), DOWN, len);
    }
    const dim = s.show.column && s.show.h;
    for (const b of bars) b.visible = dim;
    if (dim) {
      const mid = SURFACE - s.h / 2;
      arrows.hUp.set(V.set(DIM_X, mid, 0.004), UPV, s.h / 2);
      arrows.hDown.set(V.set(DIM_X, mid, 0.004), DOWN, s.h / 2);
      bars[0].position.set(DIM_X, SURFACE, 0.004);
      bars[1].position.set(DIM_X, yA, 0.004);
      for (const b of bars) b.scale.set(thick, thick, 1);
    }
    if (s.show.P)
      for (const id of HOLE_IDS) {
        if (s.jet[id] <= 0) continue;
        const len = arrowLength(pressure(HOLES[id])) * Math.min(1, s.jet[id] * 2.5);
        arrows.P[id].set(V.set(R - 0.012 - len, holeY(id), 0.004), RIGHT, len);
      }
  }

  // ── holes ───────────────────────────────────────────────────────────────────
  /** Open a hole: the cork pops, the jet runs out to the ground. A moves to the hole's depth. */
  function openHole(id, { jump = false, quiet = false, tour: allowTour = true } = {}) {
    if (!HOLE_IDS.includes(id)) return Promise.resolve(false);
    if (s.open[id]) {
      setDepth(HOLES[id], { animate: !jump });
      return Promise.resolve(true);
    }
    const token = ++s.run;
    const first = !s.found.open;
    s.open[id] = true;
    setDepth(HOLES[id], { animate: !jump, keepRun: true });
    const done = () => {
      s.cork[id] = 1;
      s.jet[id] = 1;
      if (s.mode === 'explore') {
        s.found.open = true;
        if (openCount() >= 2) {
          if (!s.found.compare) fillGauge(jump);
          s.found.compare = true;
        }
        if (openCount() === 3) s.found.all = true;
      }
      syncScene();
      refresh();
      emit('open', { hole: id, h: HOLES[id], P: pressure(HOLES[id]) });
      emitChange();
      if (first && allowTour && !jump && s.mode === 'explore') tour(token);
      return true;
    };
    if (jump) return Promise.resolve(done());
    if (!quiet) audio.pop();
    refresh();
    let splashed = false;
    return tweener
      .animate({
        key: `hole-${id}`,
        duration: OPEN_S,
        ease: ease.linear,
        onUpdate: (k) => {
          s.cork[id] = Math.min(1, k / 0.42);
          s.jet[id] = k < 0.08 ? 0 : ease.outCubic(Math.min(1, (k - 0.08) / 0.8));
          if (!splashed && s.jet[id] >= 0.999) {
            splashed = true;
            if (!quiet) audio.contact();
          }
          syncScene();
        },
      })
      .finished.then((ok) => {
        if (!ok) return false;
        return done();
      });
  }

  /** Close every hole: the corks back in, no jets. */
  function closeAll() {
    s.run++;
    for (const id of HOLE_IDS) {
      tweener.cancel(`hole-${id}`);
      s.open[id] = false;
      s.cork[id] = 0;
      s.jet[id] = 0;
    }
    syncScene();
    refresh();
    emitChange();
  }

  function fillGauge(jump) {
    if (jump) {
      s.fill = 1;
      return;
    }
    tweener.animate({
      key: 'fill',
      duration: 1.2,
      delay: 0.3,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        s.fill = k;
        tank.setGaugeFill(k);
        stage.invalidate();
      },
    });
  }

  /** After the first hole is opened: close to it (the arrows, A, the spout), then the whole tank again. */
  async function tour(token) {
    await wait(0.5);
    if (token !== s.run || s.mode !== 'explore' || s.userMovedCamera || s.look === 'close') return;
    await setLook('close', { tour: true });
    await wait(TOUR_HOLD);
    if (token !== s.run || s.mode !== 'explore' || s.userMovedCamera) return;
    await setLook('all', { tour: true });
  }
  const wait = (sec) => tweener.animate({ key: 'wait', duration: sec, onUpdate: () => {} }).finished;

  // ── the surface A ──────────────────────────────────────────────────────────
  function setDepth(h, { animate = false, keepRun = false } = {}) {
    const v = fixDepth(h);
    if (!keepRun && animate) s.run++;
    if (Math.abs(v - s.h) < 1e-9) {
      refresh();
      return Promise.resolve(true);
    }
    const from = s.h;
    const settle = () => {
      s.h = v;
      syncScene();
      refresh();
      emitChange();
      if (s.look === 'close' && !s.userMovedCamera) flyTo(viewPose(), animate ? 0.4 : 0);
      return true;
    };
    if (!animate) return Promise.resolve(settle());
    if (s.look === 'close' && !s.userMovedCamera) flyTo(viewPoseAt(v), 0.5);
    return tweener
      .animate({
        key: 'depth',
        duration: 0.45,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          s.h = from + (v - from) * k;
          syncScene();
        },
      })
      .finished.then((ok) => (ok ? settle() : false));
  }
  function step(dir) {
    if (s.locked) return lockedNudge();
    tweener.cancel('depth');
    s.run++;
    if (s.mode === 'explore') s.found.drag = true;
    setDepth(s.h + dir * DEPTH_LIMITS[2]);
  }

  // ── the action ──────────────────────────────────────────────────────────────
  function nextClosed() {
    const cur = holeAt(s.h);
    const from = cur ? HOLE_IDS.indexOf(cur) : -1;
    for (let i = 1; i <= HOLE_IDS.length; i++) {
      const id = HOLE_IDS[(from + i + HOLE_IDS.length) % HOLE_IDS.length];
      if (!s.open[id]) return id;
    }
    return null;
  }
  function plan() {
    const n = openCount();
    const stepNo = s.found.all ? '' : n + 1;
    if (n === HOLE_IDS.length) return { label: 'act_close', step: '', target: null };
    const cur = holeAt(s.h);
    if (cur && !s.open[cur]) return { label: 'act_open', step: stepNo, target: cur };
    return { label: n ? 'act_next' : 'act_open', step: stepNo, target: nextClosed() };
  }
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return; // a double tap must not open two holes
    lastAct = now();
    hintOff();
    const p = plan();
    if (!p.target) return closeAll();
    return openHole(p.target);
  }
  function tapHole(id) {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    return openHole(id);
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  function ruleHtml() {
    const f = s.found;
    if (f.all) return t('rule_atm', { ten: 10, P10: fmt(pressure(10)), atm: N(ATM) });
    if (f.compare) return t('rule_depth');
    if (f.open) return t('rule_column', { F: N(column(s.h).F) });
    return t('rule_start');
  }
  let lastNote = '';
  function refresh() {
    const p = plan();
    sheet.choose(holeAt(s.h));
    for (const id of HOLE_IDS) sheet.result(id, s.open[id] && s.jet[id] > 0 ? `${fmt(pressure(HOLES[id]))}${NBSP}Pa` : '');
    sheet.next(p.label === 'act_next' ? p.target : null);
    sheet.outcome(t('sum', { h: N(round(s.h, 2)), rho: N(RHO), g: N(G), P: fmt(pressure(round(s.h, 2))) }));
    sheet.rule(ruleHtml());
    drawGraph();
    const close = s.look === 'close';
    const zl = t(close ? 'act_unzoom' : 'act_zoom');
    if (zoomBtn.title !== zl) {
      zoomBtn.title = zl;
      zoomBtn.setAttribute('aria-label', zl);
      const span = zoomBtn.querySelector('span');
      if (span) span.textContent = zl;
      zoomBtn.classList.toggle('on', close);
    }
    if (action) action.set({ step: p.step, label: p.label });
    const arrowsOn = s.show.P && HOLE_IDS.some((id) => s.jet[id] > 0);
    const text = s.mode !== 'explore' ? '' : !s.found.drag && s.show.column ? t('note_drag') : arrowsOn ? t('note_arrows') : '';
    if (text !== lastNote) {
      note.textContent = text;
      note.classList.toggle('red', text === t('note_arrows'));
      lastNote = text;
    }
    syncLabels();
    stage.invalidate();
  }

  // ── labels ──────────────────────────────────────────────────────────────────
  const tmp = new THREE.Vector3();
  const P0 = { x: 0, y: 0 };
  const P1 = { x: 0, y: 0 };
  function toScreen(p, out) {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  function arrowBoxes() {
    const list = [];
    for (const a of [arrows.F, ...Object.values(arrows.P)]) {
      if (!a.root.visible) continue;
      toScreen(a.root.position, P0);
      toScreen(a.tip, P1);
      list.push({ left: Math.min(P0.x, P1.x) - 8, top: Math.min(P0.y, P1.y) - 8, right: Math.max(P0.x, P1.x) + 8, bottom: Math.max(P0.y, P1.y) + 8 });
    }
    return list;
  }
  /** The jets near their spouts (labels keep off the water). */
  function jetBoxes() {
    const list = [];
    for (const id of HOLE_IDS) {
      if (s.jet[id] <= 0) continue;
      const y = holeY(id);
      toScreen(V.set(R + NOZZLE, y + 0.02, 0), P0);
      toScreen(V.set(R + NOZZLE + 0.3, y - (0.3 * 0.3) / (4 * HOLES[id]) - 0.02, 0), P1);
      list.push({ left: P0.x - 4, top: Math.min(P0.y, P1.y) - 4, right: P1.x, bottom: Math.max(P0.y, P1.y) + 4 });
    }
    return list;
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, note, arrowBoxes, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const pts = {
    gauge: new THREE.Vector3(),
    h: new THREE.Vector3(),
    P: new THREE.Vector3(),
    A: new THREE.Vector3(),
    F: new THREE.Vector3(),
    grow: new THREE.Vector3(),
    mark: new THREE.Vector3(),
  };
  const gaugePts = Array.from({ length: 6 }, (_, i) => new THREE.Vector3(GAUGE_X - 0.02, SURFACE - i * 0.2, 0.034));
  const labelState = new Map();
  const want = new Map();
  function syncLabels() {
    want.clear();
    const compact = stage.height < 260 || stage.width < 340;
    const close = s.look === 'close';
    const yA = () => SURFACE - s.h;
    if (s.show.column && s.show.h)
      want.set('h', {
        text: s.show.numbers ? t('lbl_h', { v: N(round(s.h, 2)) }) : t('lbl_h_q'),
        point: () => pts.h.set(DIM_X, SURFACE + 0.006, 0.004),
        spots: [spot(-4, -15), spot(4, -15), spot(-4, -30)],
        color: COLORS.h,
      });
    if (s.show.column && s.show.P && s.show.numbers && stage.height >= 300) {
      want.set('P', {
        text: t('lbl_P', { v: fmt(pressure(round(s.h, 2))) }),
        point: () => pts.P.set(0, yA() - 0.012, 0.004),
        spots: [spot(0, 22), spot(-12, 24), spot(12, 24), spot(0, 38)],
        color: COLORS.P,
        own: [jetBoxes],
      });
    }
    if (s.show.column && s.show.A && (close || stage.height >= 420))
      want.set('A', {
        text: t('lbl_A', { v: N(AREA_CM2) }),
        point: () => pts.A.set(-COLUMN_R * 0.4, yA() - 0.008, 0.02),
        spots: [spot(-6, 22), spot(-16, 24), spot(8, 26)],
        color: COLORS.A,
        optional: true,
      });
    if (s.show.column && s.show.F && s.show.numbers && (close || (!compact && s.h >= 0.3)))
      want.set('F', {
        text: t('lbl_F', { v: N(column(round(s.h, 2)).F) }),
        point: () => pts.F.set(COLUMN_R * 0.2, yA() + 0.008 + F_ARROW * s.h * 0.55, 0.004),
        spots: [spot(16, 0), spot(16, -18), spot(16, 18)],
        color: COLORS.F,
        optional: true,
        own: [jetBoxes],
      });
    if (s.fill >= 0.999 && s.show.numbers)
      want.set('grow', {
        text: t('lbl_grow'),
        point: () => pts.grow.set(GAUGE_X, STAND - 0.06, 0.035),
        spots: [spot(0, 18), spot(10, 22), spot(-10, 22)],
        color: COLORS.P,
        optional: true,
      });
    if (s.mark)
      want.set('mark', {
        text: t('lbl_this'),
        point: () => pts.mark.set(R + NOZZLE + 0.012, holeY(s.mark) + 0.01, 0),
        spots: [spot(14, -20), spot(18, -34), spot(14, 20)],
        color: COLORS.ink,
      });
    // the depth gauge's numbers (0 at the surface); the labels above find their places first
    for (let i = 0; i < gaugePts.length; i++)
      want.set(`g${i}`, { text: N(round(i * 0.2, 1)), point: () => gaugePts[i], dx: -5, dy: 0, kind: 'tick' });
    want.set('gauge', {
      text: t('lbl_gauge'),
      point: () => pts.gauge.set(GAUGE_X, GLASS_TOP + 0.02, 0.03),
      spots: [spot(0, -14), spot(-10, -14)],
      kind: 'tick',
      optional: true,
    });
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      const key = `${w.text}|${(w.spots || []).map((p) => `${p.dx},${p.dy}`).join(';')}|${w.dx ?? ''}`;
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, {
          text: w.text,
          point: w.point,
          kind: w.kind || 'force',
          color: w.color,
          spots: w.spots,
          dx: w.dx ?? 0,
          dy: w.dy ?? 0,
          avoid: w.own || [],
          optional: w.optional,
        });
        labelState.set(id, key);
      } else if (labelState.get(id) !== key) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots });
        labelState.set(id, key);
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const box = new THREE.Box3();
  function viewPoseAt(h, look = s.look) {
    if (look === 'close') {
      const y = SURFACE - h;
      box.min.set(GAUGE_X - 0.06, y - 0.13, -0.06);
      box.max.set(R + NOZZLE + 0.24, SURFACE + 0.05, 0.06);
      return fitPose({ box, dir: CLOSE_DIR, camera, width: stage.width, height: stage.height, margin: MARGIN });
    }
    box.min.set(GAUGE_X - 0.12, 0, -0.06);
    box.max.set(R + NOZZLE + jetReach(HOLES.bot) + 0.06, GLASS_TOP + 0.08, 0.06);
    return fitPose({ box, dir: LOOK_DIR, camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  const viewPose = () => viewPoseAt(s.h);
  function flyTo({ position, target: aim }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(aim);
      controls.update();
      layoutArrows();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener
      .animate({
        key: 'camera',
        duration,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          camera.position.lerpVectors(p0, position, k);
          controls.target.lerpVectors(t0, aim, k);
          controls.update();
          layoutArrows();
          stage.invalidate();
        },
      })
      .finished.then((done) => {
        if (done) refresh();
        return done;
      });
  }
  function setLook(look, { animate = true, tour: fromTour = false } = {}) {
    const v = look === 'close' ? 'close' : 'all';
    if (!fromTour) s.run++; // the student's own choice stops the tour
    s.look = v;
    s.userMovedCamera = false;
    refresh();
    emit('look', { look: v });
    emitChange();
    return flyTo(viewPose(), animate ? 0.9 : 0);
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    return flyTo(viewPose(), animate ? 0.7 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  controls.addEventListener('change', () => layoutArrows());
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    refresh();
  });

  // ── the badge on the next spout ─────────────────────────────────────────────
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_open',
    target: () => {
      const p = plan();
      return p.target ? tank.holes[p.target].mouth : null;
    },
    radius: 22,
    avoid: [ui.corner, ui.hint, note, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── touches: a spout opens its hole, A is dragged ──────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects([...tank.pickable, ...(s.show.column ? [tank.plateHit] : [])], false);
    if (!hits.length) return null;
    const hole = hits[0].object.userData.hole;
    return hole ? { hole } : { plate: true };
  }
  /** Pixels per metre of depth on the screen (downwards), at A. */
  function depthOnScreen() {
    toScreen(V.set(0, SURFACE - s.h, 0), P0);
    toScreen(V.set(0, SURFACE - s.h - 0.1, 0), P1);
    const dx = P1.x - P0.x;
    const dy = P1.y - P0.y;
    const len = Math.hypot(dx, dy) || 1;
    return { ux: dx / len, uy: dy / len, pxPerM: len / 0.1 };
  }
  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const hit = pick(canvasPoint(e));
      if (!hit || drag) return;
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (hit.hole) return tapHole(hit.hole);
      s.run++;
      tweener.cancel('depth');
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, h: s.h, axis: depthOnScreen() };
      s.dragging = true;
      action?.hide('drag');
      capturePointer(ui.canvasHost, e.pointerId);
      emit('dragstart', snapshot());
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (drag && e.pointerId === drag.id) {
      const { ux, uy, pxPerM } = drag.axis;
      const h = fixDepth(drag.h + ((e.clientX - drag.x) * ux + (e.clientY - drag.y) * uy) / pxPerM);
      if (Math.abs(h - s.h) > 1e-9) {
        if (s.mode === 'explore') s.found.drag = true;
        setDepth(h);
      }
      return;
    }
    if (e.pointerType !== 'mouse') return;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      const hit = pick(p);
      ui.canvasHost.style.cursor = !hit ? '' : s.locked ? 'not-allowed' : hit.plate ? 'ns-resize' : 'pointer';
    });
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    releasePointer(ui.canvasHost, drag.id);
    drag = null;
    s.dragging = false;
    action?.show('drag');
    refresh();
    emitChange();
    emit('dragend', snapshot());
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 4000 } = {}) {
    ui.hintText.textContent = text;
    ui.hintAct.hidden = true;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    if (duration) hintTimer = setTimeout(hintOff, duration);
  }
  function hintOff() {
    clearTimeout(hintTimer);
    ui.hint.classList.remove('show');
  }
  function lockedNudge() {
    showHint(t('q_locked'), { duration: 2400 });
    audio.error();
  }

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshot() {
    const h = round(s.h, 2);
    const p = plan();
    return {
      h,
      P: pressure(h),
      F: column(h).F,
      A: AREA_CM2,
      rho: RHO,
      g: G,
      open: HOLE_IDS.filter((id) => s.open[id]),
      holes: Object.fromEntries(
        HOLE_IDS.map((id) => [id, { h: HOLES[id], P: pressure(HOLES[id]), open: s.open[id], reach: round(jetReach(HOLES[id]), 3) }]),
      ),
      look: s.look,
      found: { ...s.found },
      next: p.label.replace('act_', ''),
      nextHole: p.target,
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange(force = false) {
    const snap = snapshot();
    const key = JSON.stringify([snap.h, snap.open, snap.look, snap.found, snap.mode, snap.view]);
    if (key === lastEmitted && !force) return;
    lastEmitted = key;
    emit('change', snap);
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
  function choicesOf(items, kind, label) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="lp-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  const SHOW_ALL = { column: true, h: true, F: true, A: true, P: true, numbers: true };
  /** A question's scene: these holes open, A at this depth, these labels; nothing moving. */
  function scene_({ open = [], h = HOLES.top, show = {}, mark = null, look = 'all' }) {
    s.run++;
    for (const id of HOLE_IDS) {
      tweener.cancel(`hole-${id}`);
      const on = open.includes(id);
      s.open[id] = on;
      s.cork[id] = on ? 1 : 0;
      s.jet[id] = on ? 1 : 0;
    }
    tweener.cancel('depth');
    s.h = fixDepth(h);
    s.show = { ...SHOW_ALL, ...show };
    s.mark = mark;
    s.look = look;
    syncScene();
    refresh();
    return flyTo(viewPose(), 0.6);
  }
  function revealAll() {
    s.show = { ...SHOW_ALL };
    syncScene();
    refresh();
  }
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const paText = (v) => `${fmt(v)}${NBSP}Pa`;

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
        learnSaved = { h: s.h, open: HOLE_IDS.filter((id) => s.open[id]), look: s.look, found: { ...s.found }, fill: s.fill };
        s.mode = 'quiz';
        s.locked = true;
        if (drag) endDrag({ pointerId: drag.id });
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.mark = null;
        s.show = { ...SHOW_ALL };
        const saved = learnSaved;
        if (saved) {
          s.found = { ...saved.found };
          s.fill = saved.fill;
        }
        syncUI();
        scene_({ open: saved?.open || [], h: saved?.h ?? HOLES.top, look: saved?.look || 'all' });
        s.mark = null;
        refresh();
        emitChange();
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = ['hole', 'far', 'double', 'column', 'ten'][i % 5];
        const keepFill = s.fill;
        s.fill = 0; // the red gauge would tell the answer
        if (kind === 'hole') {
          const id = pickOne(HOLE_IDS);
          await scene_({ open: [id], h: HOLES[id], mark: id, show: { numbers: false, F: false, A: false } });
          if (!alive()) return null;
          question = { kind, id };
          return { text: t('q_hole', { rho: N(RHO), g: N(G) }), ...choicesOf(holeChoices(id), kind, (x) => paText(x.v)) };
        }
        if (kind === 'far') {
          await scene_({ open: [...HOLE_IDS], h: HOLES.bot, show: { column: false, numbers: false } });
          if (!alive()) return null;
          question = { kind };
          const items = ['c_deep', 'c_denser', 'c_gravity', 'c_air'].map((key) => ({ key }));
          return { text: t('q_far'), ...choicesOf(items, kind, (x) => t(x.key)) };
        }
        if (kind === 'double') {
          const h1 = pickOne([0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45]);
          await scene_({ h: h1, show: { P: false, F: false } });
          if (!alive()) return null;
          question = { kind, h1, h2: round(h1 * 2, 2) };
          const items = ['c_twice', 'c_half', 'c_same', 'c_four'].map((key) => ({ key }));
          return { text: t('q_double', { h1: N(h1), h2: N(question.h2) }), ...choicesOf(items, kind, (x) => t(x.key)) };
        }
        if (kind === 'column') {
          await scene_({ h: pickOne([0.3, 0.5, 0.7]), show: { numbers: false } });
          if (!alive()) return null;
          question = { kind };
          const items = ['c_weight', 'c_wall', 'c_below', 'c_hole'].map((key) => ({ key }));
          return { text: t('q_column'), ...choicesOf(items, kind, (x) => t(x.key)) };
        }
        s.fill = keepFill;
        await scene_({ h: 0.95, show: { numbers: false, P: false, F: false } });
        if (!alive()) return null;
        question = { kind: 'ten' };
        return { text: t('q_ten', { d: N(10) }), ...choicesOf(tenMetreChoices(), 'ten', (x) => paText(x.v)) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const vars = { rho: N(RHO), g: N(G), one: N(1), hundred: N(100) };
        const note_ = (map, extra = {}) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey], { ...vars, ...extra })}` : '');
        revealAll();
        if (k === 'hole') {
          const h = HOLES[question.id];
          return (
            t('why_hole', { ...vars, h: N(h), P: fmt(pressure(h)) }) +
            note_({ no_g: 'mis_no_g', cm: 'mis_cm', other: 'mis_other' }, { cm: N(round(h * 100, 2)), h: N(h) })
          );
        }
        if (k === 'far') return t('why_far') + note_({ c_denser: 'mis_denser', c_gravity: 'mis_gravity', c_air: 'mis_air' });
        if (k === 'double')
          return (
            t('why_double', { P1: fmt(pressure(question.h1)), P2: fmt(pressure(question.h2)) }) +
            note_({ c_half: 'mis_half', c_same: 'mis_same', c_four: 'mis_four' })
          );
        if (k === 'column') return t('why_column') + note_({ c_wall: 'mis_wall', c_below: 'mis_below', c_hole: 'mis_hole' });
        return (
          t('why_ten', { ...vars, d: N(10), P: fmt(pressure(10)), atm: N(ATM) }) +
          note_({ one_m: 'mis_one_m', no_g: 'mis_no_g10', hundred: 'mis_hundred' })
        );
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    for (const b of ui.$$('[data-view]')) b.classList.toggle('on', b.dataset.view === s.view);
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
  }
  function chooseHole(id) {
    if (s.locked) return lockedNudge();
    setDepth(HOLES[id], { animate: true });
  }
  function goHome() {
    closeAll();
    s.found = { open: false, compare: false, all: false, drag: false };
    s.fill = 0;
    tweener.cancel('fill');
    setDepth(HOLES.top);
    syncScene();
    setLook('all');
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example) chooseHole(b.dataset.example);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'zoom':
        if (s.locked) lockedNudge();
        else setLook(s.look === 'close' ? 'all' : 'close');
        break;
      case 'home':
        if (s.locked) lockedNudge();
        else goHome();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  root.addEventListener('keydown', (e) => {
    const tgt = /** @type {Element} */ (e.target);
    if (tgt.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(tgt.closest('button'));
    const sceneKey = ['1', '2', '3', 'r', 'R', 'z', 'Z', 'Home', 'ArrowUp', 'ArrowDown'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3'].includes(k)) chooseHole(HOLE_IDS[Number(k) - 1]);
    else if (k === 'ArrowDown') step(1);
    else if (k === 'ArrowUp') step(-1);
    else if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'z' || k === 'Z') setLook(s.look === 'close' ? 'all' : 'close');
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  controls.enableRotate = s.view === '3d';
  for (const id of parseOpen(o.open)) {
    s.open[id] = true;
    s.cork[id] = 1;
    s.jet[id] = 1;
  }
  const n0 = openCount();
  if (n0) {
    s.found.open = true;
    s.found.compare = n0 >= 2;
    s.found.all = n0 === 3;
    s.fill = n0 >= 2 ? 1 : 0;
  }
  syncScene();
  flyTo(viewPose(), 0);
  refresh();
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
    getState: snapshot,
    /**
     * Change any of: h (the depth of A, m: 0.05 … 0.95), open ('none' | 'all' | a list such as 'top,bot' or
     * ['mid']: those holes open, the others closed; with animate: false they are open at once), look ('all' |
     * 'close'), view ('front' | '3d'), found ({ open, compare, all, drag }: what the rule has already told).
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.found) {
        Object.assign(s.found, p.found);
        if (s.found.compare) s.fill = 1;
        syncScene();
        refresh();
      }
      if (p.open != null) {
        const want = parseOpen(p.open);
        if (HOLE_IDS.some((id) => s.open[id] && !want.includes(id))) closeAll();
        for (const id of want) if (!s.open[id]) await openHole(id, { jump: !animate, quiet: !animate, tour: false });
      }
      if (p.h != null) await setDepth(Number(p.h), { animate });
      if (p.look) await setLook(p.look, { animate });
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.show = { ...SHOW_ALL };
      s.mark = null;
      goHome();
      await setView('front', { animate: false });
      await setLook('all', { animate: false });
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The tank with its water, spouts and jets as they are, on its brick stand, in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'LiquidPressure';
      g.add(tank.root.clone(true));
      for (const m of yard.near) g.add(m.clone());
      return g;
    },
  };
}
