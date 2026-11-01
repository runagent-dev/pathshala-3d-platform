// Pressure (book page 129, topic 5.1), student view. Two feet stand on soft red clay with the same force F on each:
// one in a high heel, which touches the clay with only 50 cm² (the front of the sole and the heel's tip), one in a flat
// sneaker, which touches it with 200 cm². The clay in front of them is dug away along the line through the middle of
// both soles, so its cut face shows the layers of clay bending down under each shoe. One tap stands them on the clay:
// the shoes sink in (the heel four times as deep as the sneaker), red arrows press down from each sole (the longer, the
// more pressure: P = F/A) and the camera goes close to the heel and then to the sneaker. A second tap lifts the feet and
// shows the prints, each with its area A. The student changes F with a stepper and the panel works out P = F/A for
// both shoes live (the book's units, N ÷ m² = Pa). Then a five-question test. Built on the shared student kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createArrow } from '@shared/arrow.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { createGround } from './ground.js';
import { fitPose } from './camera.js';
import {
  F_LIMITS,
  F_START,
  QUIZ_FORCES,
  QUIZ_PRESSURES,
  SHOES,
  SHOE_IDS,
  VIEWS,
  arrowLength,
  fixForce,
  forceChoices,
  groupBD,
  groupIntl,
  heelChoices,
  pressure,
  ratio,
  round,
  sinkDepth,
  toM2,
} from './reading.js';
import { createHeelShoe, createSneaker } from './shoes.js';

export const DEFAULTS = {
  F: F_START, // the force on each shoe (N)
  look: 'both', // 'both' | 'heel' | 'sneaker': where the camera looks
  phase: 'ready', // 'ready' | 'stand' | 'lift': start in the air, standing in the clay, or lifted over the prints
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { F: '#7048e8', P: '#e03131', A: '#0c8599' };
const FEET_X = { heel: -0.165, sneaker: 0.168 };
const HOVER = { ready: 0.045, lift: 0.17 }; // m above the clay
const FORCE_LEN = 0.0002; // m of the force's arrow per newton (500 N → 10 cm)
const ZF = 0.075; // the force arrows are drawn this far in front of the legs
const ZP = 0.012; // the pressure arrows: just in front of the cut face
const NBSP = ' ';
const DOUBLE_TAP = 450; // ms
const PRESS_S = 1.7; // s: the feet come down and sink in
const LIFT_S = 1.0;
const TOUR_HOLD = 2.4; // s the camera stays close to each shoe after the first stand
// what the camera shows for each look (world boxes), and from where
// (the bottom of each box goes lower when the arrows under the soles are longer, the top of 'both' higher when the
// force's arrows are: see viewPose)
const LOOKS = {
  both: { box: [new THREE.Vector3(-0.3, -0.1, -0.05), new THREE.Vector3(0.31, 0.16, 0.05)], dir: new THREE.Vector3(0.1, 0.2, 1) },
  heel: { box: [new THREE.Vector3(-0.29, -0.09, -0.03), new THREE.Vector3(-0.035, 0.125, 0.03)], dir: new THREE.Vector3(0.25, 0.12, 1) },
  sneaker: { box: [new THREE.Vector3(0.03, -0.06, -0.03), new THREE.Vector3(0.315, 0.1, 0.03)], dir: new THREE.Vector3(-0.2, 0.12, 1) },
};
const LIFT_DIR = new THREE.Vector3(0.08, 0.42, 1); // over the prints: from a little higher up
const MARGIN = { top: 52, bottom: 14, side: 4 };
const UPV = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const G = (x) => N(t.lang === 'bn' ? groupBD(x) : groupIntl(x)); // Bangladeshi commas in Bangla (১,০০,০০০)

  root.classList.add('pvc', 'pr');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, {
      examples: { label: 'views', results: false, items: VIEWS.map((id) => ({ id, label: `chip_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 1, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;

  // the formula: the force's stepper, P = F/A with each symbol a button, the sum for each shoe with the numbers
  const eq = document.createElement('div');
  eq.className = 'pr-eq';
  eq.innerHTML = `
    <div class="pr-top">
      <div class="pr-step">
        <span class="pr-name"><b class="c-F">F</b> <span>${t('name_F')}</span></span>
        <span class="pr-ctl">
          <button type="button" class="pr-pm" data-step="F" data-dir="-1" aria-label="${t('less_F')}">${ICONS.minus}</button>
          <output class="pr-val" data-val="F" aria-live="polite"></output>
          <span class="pr-unit">N</span>
          <button type="button" class="pr-pm" data-step="F" data-dir="1" aria-label="${t('more_F')}">${ICONS.plus}</button>
        </span>
      </div>
      <div class="pr-law" role="group" aria-label="${t('law_label')}">
        <button type="button" class="pr-term c-P" data-term="P">P</button><span class="pr-op">=</span><span class="pr-frac"><button type="button" class="pr-term c-F" data-term="F">F</button><button type="button" class="pr-term c-A" data-term="A">A</button></span>
      </div>
    </div>
    <div class="pr-sums">
      ${SHOE_IDS.map((id) => `<div class="pr-sum k-${id}"><span class="pr-shoe">${t(`shoe_${id}`)}</span><span class="pr-calc" data-sum="${id}"></span></div>`).join('')}
    </div>`;
  $('.pvc-act-row').after(eq);

  // notes on the stage: the clay is cut open (top left), what the red arrows mean (bottom left, while they show)
  const notes = document.createElement('div');
  notes.className = 'pr-notes';
  const cutNote = document.createElement('div');
  cutNote.className = 'pr-note';
  const arrowNote = document.createElement('div');
  arrowNote.className = 'pr-note pr-note-p';
  notes.append(cutNote);
  ui.stage.append(notes, arrowNote);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 140, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 0.3;
  controls.maxDistance = 6;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = false;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = Math.PI * 0.5;
  if (o.bg !== 'transparent') {
    // a deep blue sky after the rain, paler at the horizon
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const ctx = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#173fbf');
    g.addColorStop(0.4, '#2f74e6');
    g.addColorStop(0.72, '#7fb6f2');
    g.addColorStop(0.9, '#bcdaf7');
    g.addColorStop(1, '#d9ebfb');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    const sky = new THREE.CanvasTexture(c);
    sky.colorSpace = THREE.SRGBColorSpace;
    scene.background = sky;
    scene.fog = new THREE.Fog('#d4e6f7', 4, 40);
  }
  function haze() {
    if (!(scene.fog instanceof THREE.Fog)) return;
    const d = camera.position.distanceTo(controls.target);
    scene.fog.near = d + 2;
    scene.fog.far = d + 16;
  }
  controls.addEventListener('change', haze);
  scene.add(new THREE.HemisphereLight('#cfe3ff', '#b8603a', 0.9));
  const sun = new THREE.DirectionalLight('#fff0d8', 1.9);
  sun.position.set(-1.6, 3.2, 2.4);
  sun.target.position.set(0, 0, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#d4e6ff', 0.45);
  fill.position.set(2, 1.2, 3);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -0.7, right: 0.7, top: 0.7, bottom: -0.7, near: 1, far: 8 });
    sun.shadow.radius = 4;
    sun.shadow.bias = -0.0004;
  }

  const shoes = { heel: createHeelShoe(), sneaker: createSneaker() };
  for (const id of SHOE_IDS) {
    shoes[id].root.position.x = FEET_X[id];
    scene.add(shoes[id].root);
  }
  const ground = createGround(SHOE_IDS.map((id) => ({ x: FEET_X[id], footprint: shoes[id].footprint })));
  scene.add(ground.root);

  // the area each shoe touches: a teal line under the sole on the cut face, and the print's floor once lifted
  const tealLine = new THREE.MeshBasicMaterial({
    color: COLORS.A,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    toneMapped: false,
    fog: false,
  });
  const tealFill = new THREE.MeshBasicMaterial({
    color: COLORS.A,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    toneMapped: false,
  });
  const areas = {};
  for (const id of SHOE_IDS) {
    const fp = shoes[id].footprint;
    // where the middle line is inside the footprint: the parts of the sole that touch, as seen on the cut face
    const strips = new THREE.Group();
    strips.name = `${id}AreaOnCut`;
    let from = null;
    for (let x = fp.box.x0; x <= fp.box.x1 + 1e-9; x += 0.001) {
      const inside = fp.sdf(x, 0) < 0;
      if (inside && from == null) from = x;
      if ((!inside || x + 0.001 > fp.box.x1) && from != null) {
        const len = x - from;
        const bar = new THREE.Mesh(new THREE.BoxGeometry(len, 0.005, 0.002), tealLine);
        bar.position.set(from + len / 2, -0.0025, ZP - 0.004);
        bar.renderOrder = 18;
        strips.add(bar);
        from = null;
      }
    }
    strips.userData.noExport = true;
    scene.add(strips);
    const print = new THREE.Mesh(new THREE.ShapeGeometry(fp.shapes(), 24), tealFill);
    print.rotation.x = -Math.PI / 2; // shape (x, z) → the ground, facing up
    print.name = `${id}AreaInPrint`;
    print.userData.noExport = true;
    scene.add(print);
    areas[id] = { strips, print };
  }

  // the arrows are the point of the picture: thick, flat colour in a white outline, drawn over the scenery
  const flat = (color) =>
    new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false });
  const OUTLINE_FROM = new THREE.Vector3();
  let thick = 1;
  function boldArrow(name, color, r, padK = 0.65) {
    const core = createArrow({ name, radius: r, head: r * 5, headRadius: r * 2.7, material: flat(color) });
    const pad = r * padK;
    const outline = createArrow({
      name: `${name}Outline`,
      radius: r + pad,
      head: r * 5 + pad * 2.8,
      headRadius: r * 2.7 + pad * 2,
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
  const arrows = {};
  for (const id of SHOE_IDS) {
    const F = boldArrow(`ForceOn_${id}`, COLORS.F, 0.0058);
    scene.add(F.root);
    const P = shoes[id].arrows.map((_, i) => {
      const a = boldArrow(`Pressure_${id}_${i}`, COLORS.P, 0.0034, 0.95); // a wider outline: red on red clay
      scene.add(a.root);
      return a;
    });
    arrows[id] = { F, P };
  }

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
    F: fixForce(o.F),
    phase: 'ready', // 'ready' | 'press' | 'stand' | 'lift'
    look: VIEWS.includes(o.look) ? o.look : 'both',
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    y: { heel: HOVER.ready, sneaker: HOVER.ready }, // the bottom of each sole (m; < 0: in the clay)
    found: { stand: false, lift: false, force: false },
    show: { F: true, A: true, P: true, numbers: true }, // the test hides some until the answer
    focus: null,
    focusAt: 0,
    userMovedCamera: false,
    run: 0, // a token: every new press, lift, tour or reset bumps it
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  const P = (id, F = s.F) => pressure(F, SHOES[id].area);
  const target = (id) => sinkDepth(P(id)); // how deep each shoe goes at this force
  const standing = () => s.phase === 'stand' || s.phase === 'press';
  const touching = (id) => s.y[id] <= 1e-4;

  // ── the feet and the clay ───────────────────────────────────────────────────
  function syncScene() {
    for (const id of SHOE_IDS) {
      shoes[id].root.position.y = s.y[id];
      const i = SHOE_IDS.indexOf(id);
      // the clay keeps its print: it only ever goes deeper (until the feet stand somewhere new)
      if (-s.y[id] > ground.depth(i)) ground.setDepth(i, -s.y[id]);
      const d = ground.depth(i);
      areas[id].strips.position.set(FEET_X[id], -d, 0);
      areas[id].strips.visible = s.show.A && (touching(id) || (s.phase === 'lift' && d > 0.0005));
      areas[id].print.position.set(FEET_X[id], -d + 0.0012, 0);
      areas[id].print.visible = s.show.A && s.phase === 'lift' && d > 0.0005;
    }
    layoutArrows();
    stage.invalidate();
  }

  function layoutArrows() {
    const perPx = (2 * camera.position.distanceTo(controls.target) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
    thick = Math.min(2.2, Math.max(1, (3.6 * perPx) / 0.0068));
    for (const id of SHOE_IDS) {
      const a = arrows[id];
      a.F.hide();
      for (const p of a.P) p.hide();
      a.F.scale(1);
      for (const p of a.P) p.scale(1);
      if (!touching(id) || s.phase === 'lift') continue;
      const x0 = FEET_X[id];
      const y0 = s.y[id];
      if (s.show.F) {
        const at = shoes[id].forceAt;
        const len = s.F * FORCE_LEN;
        a.F.set(new THREE.Vector3(x0 + at.x, y0 + at.y + len, ZF), DOWN, len);
      }
      if (s.show.P) {
        const len = arrowLength(P(id));
        shoes[id].arrows.forEach((ax, i) => a.P[i].set(new THREE.Vector3(x0 + ax, y0 - 0.001, ZP), DOWN, len));
      }
    }
  }

  /** Feet up, the clay smooth again (a new place to stand). */
  function freshClay() {
    ground.setDepths(SHOE_IDS.map(() => 0));
  }

  /** The feet come down and sink in; with `jump` they are there at once. Resolves when done (false if cancelled). */
  function press({ jump = false, quiet = false } = {}) {
    const token = ++s.run;
    // a print deeper than this force makes (a bigger force before) is somewhere else: smooth clay
    if (SHOE_IDS.some((id, i) => ground.depth(i) > target(id) + 1e-6)) freshClay();
    const from = { ...s.y };
    s.phase = 'press';
    if (!quiet) audio.pop();
    if (jump) {
      for (const id of SHOE_IDS) s.y[id] = -target(id);
      return Promise.resolve(arrive(token, quiet));
    }
    refresh();
    if (!s.userMovedCamera) flyTo(viewPose(), 1.0);
    let landed = false;
    return tweener
      .animate({
        key: 'feet',
        duration: PRESS_S,
        ease: ease.linear,
        onUpdate: (k) => {
          // down through the air (0 … 0.35), then into the clay, slowing as it holds
          for (const id of SHOE_IDS) {
            if (k < 0.35) s.y[id] = from[id] * (1 - ease.inOutCubic(k / 0.35));
            else s.y[id] = -target(id) * ease.outCubic((k - 0.35) / 0.65);
          }
          if (!landed && k >= 0.35) {
            landed = true;
            if (!quiet) audio.contact();
            refresh();
          }
          syncScene();
        },
      })
      .finished.then((done) => {
        if (!done || token !== s.run) return false;
        return arrive(token, quiet);
      });
  }
  function arrive(token, quiet) {
    for (const id of SHOE_IDS) s.y[id] = -target(id);
    s.phase = 'stand';
    const first = !s.found.stand;
    if (s.mode === 'explore') s.found.stand = true;
    syncScene();
    refresh();
    emit('stand', snapshotSetup());
    emitChange();
    if (first && s.mode === 'explore' && !quiet) tour(token);
    return true;
  }

  /** The feet lift off; the prints stay, each with its area. */
  function lift({ jump = false } = {}) {
    const token = ++s.run;
    tweener.cancel('feet');
    const from = { ...s.y };
    s.phase = 'lift';
    if (s.mode === 'explore') s.found.lift = true;
    const done = () => {
      for (const id of SHOE_IDS) s.y[id] = HOVER.lift;
      syncScene();
      refresh();
      emit('lift', snapshotSetup());
      emitChange();
      return true;
    };
    flyTo(viewPose(), jump ? 0 : 0.9);
    if (jump) return Promise.resolve(done());
    refresh();
    return tweener
      .animate({
        key: 'feet',
        duration: LIFT_S,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          for (const id of SHOE_IDS) s.y[id] = from[id] + (HOVER.lift - from[id]) * k;
          syncScene();
        },
      })
      .finished.then((ok) => (ok && token === s.run ? done() : false));
  }

  /** Back to the start: the feet in the air over smooth clay. */
  function goHome() {
    s.run++;
    tweener.cancel('feet');
    s.phase = 'ready';
    for (const id of SHOE_IDS) s.y[id] = HOVER.ready;
    freshClay();
    syncScene();
    refresh();
    emitChange();
  }

  /** After the first stand: close to the heel, then close to the sneaker, then both again. */
  async function tour(token) {
    const steps = ['heel', 'sneaker', 'both'];
    for (const look of steps) {
      await wait(look === 'heel' ? 0.5 : TOUR_HOLD);
      if (token !== s.run || s.mode !== 'explore' || s.userMovedCamera) return;
      await setLook(look, { tour: true });
      if (token !== s.run) return;
    }
  }
  const wait = (sec) => tweener.animate({ key: 'wait', duration: sec, onUpdate: () => {} }).finished;

  // ── the panel ───────────────────────────────────────────────────────────────
  function plan() {
    if (s.phase === 'stand' || s.phase === 'press') return { label: 'act_lift', step: s.found.lift ? '' : 2 };
    if (s.phase === 'lift') return { label: 'act_again', step: '' };
    return { label: 'act_stand', step: s.found.stand ? '' : 1 };
  }

  function sumHtml(id) {
    const A = toM2(SHOES[id].area);
    return t('sum', { F: N(s.F), A: N(A), P: G(P(id)) });
  }

  function outcomeHtml() {
    if (s.phase === 'ready') return t('out_ready', { F: N(s.F) });
    if (s.phase === 'press') return t('out_press');
    const k = ratio();
    if (s.phase === 'lift') return t('out_lift', { k: N(k) });
    if (s.look === 'heel') return t('out_heel', { A: N(SHOES.heel.area), P: G(P('heel')) });
    if (s.look === 'sneaker') return t('out_sneaker', { A: N(SHOES.sneaker.area), P: G(P('sneaker')) });
    return t('out_both', { k: N(k) });
  }

  function ruleHtml() {
    const f = s.found;
    if (f.stand && f.lift && f.force) return t('rule_law');
    if (f.force && f.stand) return t('rule_force');
    if (s.phase === 'lift' || (f.lift && f.stand)) return t('rule_lift', { k: N(ratio()) });
    if (f.stand) return t('rule_stand', { Ah: N(SHOES.heel.area), Am: N(toM2(SHOES.heel.area)) });
    return t('rule_start');
  }

  let lastNotes = '';
  function refresh() {
    sheet.choose(s.look);
    sheet.outcome(outcomeHtml());
    sheet.rule(ruleHtml());
    $('[data-val="F"]').textContent = N(s.F);
    const [lo, hi] = F_LIMITS;
    for (const b of eq.querySelectorAll('[data-step]')) {
      const dir = Number(/** @type {HTMLElement} */ (b).dataset.dir);
      b.classList.toggle('off', dir < 0 ? s.F <= lo : s.F >= hi);
    }
    for (const id of SHOE_IDS) {
      const el = /** @type {HTMLElement} */ (eq.querySelector(`[data-sum="${id}"]`));
      const html = sumHtml(id);
      if (el.dataset.html !== html) {
        el.innerHTML = html;
        el.dataset.html = html;
      }
      el.closest('.pr-sum')?.classList.toggle('on', s.look === id);
    }
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: p.label });
      // the ring round the shoes only before they stand: then the arrows and labels need the room
      if (s.phase === 'ready') action.show('scene');
      else action.hide('scene');
    }
    const pOn = s.show.P && standing() && SHOE_IDS.some(touching);
    const key = `${stage.width < 560}|${pOn}|${stage.height}`;
    if (key !== lastNotes) {
      cutNote.textContent = t('note_cut');
      arrowNote.textContent = pOn && stage.height >= 260 ? t('note_arrows') : '';
      lastNotes = key;
    }
    syncLabels();
    stage.invalidate();
  }

  // ── labels on the picture ───────────────────────────────────────────────────
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
    for (const id of SHOE_IDS)
      for (const a of [arrows[id].F, ...arrows[id].P]) {
        if (!a.root.visible) continue;
        toScreen(a.root.position, P0);
        toScreen(a.tip, P1);
        list.push({
          left: Math.min(P0.x, P1.x) - 7,
          top: Math.min(P0.y, P1.y) - 7,
          right: Math.max(P0.x, P1.x) + 7,
          bottom: Math.max(P0.y, P1.y) + 7,
        });
      }
    return list;
  }
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const bbox = new THREE.Box3();
  function screenBox(b3) {
    if (b3.isEmpty()) return null;
    let i = 0;
    for (const x of [b3.min.x, b3.max.x])
      for (const y of [b3.min.y, b3.max.y]) for (const z of [b3.min.z, b3.max.z]) corners[i++].set(x, y, z).project(camera);
    const xs = corners.map((c) => (c.x * 0.5 + 0.5) * stage.width);
    const ys = corners.map((c) => (-c.y * 0.5 + 0.5) * stage.height);
    return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
  }
  /** The shoes on the screen (labels keep off them): the shoe itself, not the leg above it. */
  function shoeBox(id) {
    const r = shoes[id].root.position;
    const fp = shoes[id].footprint.box;
    bbox.min.set(r.x + fp.x0, r.y - 0.005, -0.05);
    bbox.max.set(r.x + fp.x1, r.y + (id === 'heel' ? 0.13 : 0.11), 0.05);
    return screenBox(bbox);
  }
  const shoeBoxes = () => SHOE_IDS.map(shoeBox).filter(Boolean);
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, notes, arrowNote, arrowBoxes, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const RIGHT_OF = [spot(14, 0), spot(14, 16), spot(14, -16), spot(14, 32)];
  const LEFT_OF = [spot(-14, 0), spot(-14, 16), spot(-14, -16), spot(-14, 32)];
  const BELOW = [spot(0, 18), spot(16, 18), spot(-16, 18), spot(0, 34)];
  const pts = Object.fromEntries(
    SHOE_IDS.map((id) => [id, { F: new THREE.Vector3(), P: new THREE.Vector3(), A: new THREE.Vector3(), D: new THREE.Vector3() }]),
  );
  const labelState = new Map();
  const want = new Map();
  function syncLabels() {
    want.clear();
    const compact = stage.height < 250 || stage.width < 340;
    const order = { F: 0, P: 1, A: 2, D: 3 };
    for (const id of SHOE_IDS) {
      if (s.look !== 'both' && s.look !== id) continue;
      const x0 = FEET_X[id];
      const own = [shoeBoxes];
      const onClay = touching(id) && s.phase !== 'lift';
      const d = ground.depth(SHOE_IDS.indexOf(id));
      if (onClay && s.show.F)
        want.set(`F-${id}`, {
          text: s.show.numbers ? t('lbl_F', { v: N(s.F) }) : 'F',
          point: () => pts[id].F.copy(arrows[id].F.tip).addScaledVector(UPV, s.look === 'both' ? 0.05 : 0.022),
          spots: id === 'heel' ? [...LEFT_OF, ...RIGHT_OF] : [...RIGHT_OF, ...LEFT_OF],
          color: COLORS.F,
          own,
        });
      if (onClay && s.show.P) {
        const mid = arrows[id].P[Math.floor(arrows[id].P.length / 2)];
        want.set(`P-${id}`, {
          text: s.show.numbers ? t('lbl_P', { v: G(P(id)) }) : 'P',
          point: () => pts[id].P.copy(mid.tip),
          spots: [...BELOW, ...RIGHT_OF, ...LEFT_OF],
          color: COLORS.P,
          own,
        });
      }
      if (s.show.A && (onClay || s.phase === 'lift') && !(compact && s.look === 'both' && onClay)) {
        // at the end of the teal line on the cut face: the toe end for the heel, the heel end for the sneaker
        // standing: at the end of the teal line on the cut face (the toe end for the heel, the heel end for the
        // sneaker); lifted: over the middle of the print
        const box3 = shoes[id].footprint.box;
        const lifted = s.phase === 'lift';
        // (each shoe's label on its outer side, so the two never meet between the shoes)
        const ax = lifted ? (id === 'heel' ? 0.068 : 0) : id === 'heel' ? 0.032 : box3.x1 - 0.045;
        const side = id === 'heel' ? -1 : 1;
        want.set(`A-${id}`, {
          text: t('lbl_A', { v: N(SHOES[id].area) }),
          point: () => pts[id].A.set(x0 + ax, -d - (lifted ? 0 : 0.003), lifted ? -0.02 : ZP),
          spots: lifted
            ? [spot(0, -18), spot(side * 16, -18), spot(-side * 16, -18), spot(0, -34)]
            : [spot(side * 14, 12), spot(side * 14, 28), spot(0, 24), spot(side * 20, 24), ...(id === 'heel' ? LEFT_OF : RIGHT_OF), ...BELOW],
          color: COLORS.A,
          own,
          optional: !(s.mode === 'quiz' && s.look === id), // a question about one shoe needs its area on the picture
        });
      }
      if (s.phase === 'lift' && !compact && s.show.numbers)
        want.set(`D-${id}`, {
          text: t(id === 'heel' ? 'lbl_deep' : 'lbl_shallow'),
          point: () => pts[id].D.set(x0 + (id === 'heel' ? 0.068 : 0.0), -d - 0.004, ZP),
          spots: [spot(0, 22), spot(18, 22), spot(-18, 22), spot(0, 38)],
          color: '#5c3b1e',
          own: [],
          optional: true,
        });
    }
    const sorted = [...want.entries()].sort((a, b) => order[a[0][0]] - order[b[0][0]]);
    want.clear();
    for (const [k, v] of sorted) want.set(k, v);
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      const key = `${w.text}|${w.spots.map((p) => `${p.dx},${p.dy}`).join(';')}`;
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: 'force', color: w.color, spots: w.spots, avoid: w.own, optional: w.optional });
        labelState.set(id, key);
      } else if (labelState.get(id) !== key) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots });
        labelState.set(id, key);
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const box = new THREE.Box3();
  function viewPose() {
    const L = LOOKS[s.look];
    box.min.copy(L.box[0]);
    box.max.copy(L.box[1]);
    let dir = L.dir.clone();
    // room for the arrows at this force (the same whether they stand yet or not, so standing doesn't move the camera)
    const under = (id) => -(target(id) + arrowLength(P(id))) - 0.022;
    const lowest = s.look === 'both' ? Math.min(under('heel'), under('sneaker')) : under(s.look);
    box.min.y = Math.min(box.min.y, lowest);
    if (s.look === 'both')
      box.max.y = Math.max(box.max.y, Math.max(...SHOE_IDS.map((id) => shoes[id].forceAt.y - target(id))) + s.F * FORCE_LEN + 0.012);
    // still in the air: a little higher, so the shoes are whole
    if (s.phase === 'ready') box.max.y += HOVER.ready;
    if (s.phase === 'lift') {
      // over the prints: from higher up, a little less of the cut face
      dir = LIFT_DIR.clone().setX(L.dir.x);
      box.min.y = s.look === 'both' ? -0.09 : -0.08;
      box.max.y = Math.min(box.max.y, 0.2);
    }
    return fitPose({ box, dir: dir.normalize(), camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  function flyTo({ position, target: aim }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(aim);
      controls.update();
      haze();
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
          haze();
          layoutArrows();
          stage.invalidate();
        },
      })
      .finished.then((done) => {
        if (done) refresh();
        return done;
      });
  }
  /** Where the camera looks: both shoes, or close to one of them. */
  function setLook(look, { animate = true, tour: fromTour = false } = {}) {
    if (!VIEWS.includes(look)) return Promise.resolve(false);
    if (!fromTour) s.run++; // a word the student taps stops the tour
    s.look = look;
    s.userMovedCamera = false;
    refresh();
    emit('look', { look });
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
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    refresh();
  });

  // ── the action: the big button, the ring round the shoes, a tap on a shoe ─────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return; // a double tap must not stand and lift at once
    lastAct = now();
    hintOff();
    if (s.phase === 'press') return showHint(t('hint_wait'), { duration: 2200 });
    if (s.phase === 'stand') return lift();
    // stand (again): from over the prints the camera comes back down
    if (s.phase === 'lift') flyTo(viewPoseFor('stand'), 0.9);
    return press();
  }
  /** The pose for a phase other than the current one (standing again after the prints). */
  function viewPoseFor(phase) {
    const keep = s.phase;
    s.phase = phase;
    const pose = viewPose();
    s.phase = keep;
    return pose;
  }
  const feetBox = new THREE.Box3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_stand',
    target: () => {
      const a = shoes.heel.root.position;
      const b = shoes.sneaker.root.position;
      feetBox.min.set(a.x - 0.13, Math.min(a.y, b.y) - 0.005, -0.05);
      feetBox.max.set(b.x + 0.14, Math.max(a.y, b.y) + 0.1, 0.05);
      return feetBox;
    },
    pad: 6,
    avoid: [ui.corner, ui.hint, notes, arrowNote, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitList = [...shoes.heel.meshes, ...shoes.sneaker.meshes];
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(hitList, false).length > 0;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (!pick(canvasPoint(e))) return;
      e.stopPropagation();
      e.preventDefault();
      doAction();
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      ui.canvasHost.style.cursor = pick(p) ? (s.locked ? 'not-allowed' : 'pointer') : '';
    });
  });

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

  // ── the term buttons: the arrow (or the area) of the symbol pulses ──────────
  function tick() {
    if (!s.focus) return false;
    const on = now() - s.focusAt < 1600;
    const k = on ? 1 + 0.3 * Math.sin(((now() - s.focusAt) / 1000) * Math.PI * 4) : 1;
    for (const id of SHOE_IDS) {
      arrows[id].F.scale(s.focus === 'F' ? k : 1);
      for (const a of arrows[id].P) a.scale(s.focus === 'P' ? k : 1);
      const ka = s.focus === 'A' ? k : 1;
      areas[id].strips.scale.set(1, ka * ka, 1);
      tealFill.opacity = s.focus === 'A' ? 0.3 + 0.3 * (k - 0.7) : 0.42;
    }
    if (!on) {
      s.focus = null;
      for (const b of eq.querySelectorAll('[data-term]')) b.classList.remove('on');
    }
    stage.invalidate();
    return on;
  }
  stage.addTicker(() => tick());
  function focusTerm(k) {
    s.focus = k;
    s.focusAt = now();
    for (const b of eq.querySelectorAll('[data-term]')) b.classList.toggle('on', /** @type {HTMLElement} */ (b).dataset.term === k);
    if (!SHOE_IDS.some(touching) && s.phase !== 'lift' && s.mode === 'explore') showHint(t('hint_arrows'), { duration: 2400 });
    stage.invalidate();
  }

  // ── the force ───────────────────────────────────────────────────────────────
  function setForce(F, { animate = true } = {}) {
    const v = fixForce(F);
    if (v === s.F) return;
    s.F = v;
    if (s.mode === 'explore' && s.found.stand) s.found.force = true;
    emitChange();
    if (!s.userMovedCamera) flyTo(viewPose(), animate ? 0.6 : 0);
    if (s.phase === 'ready') {
      refresh();
      return;
    }
    // standing or lifted: they stand again on smooth clay with the new force
    s.run++;
    tweener.cancel('feet');
    freshClay();
    for (const id of SHOE_IDS) s.y[id] = HOVER.ready;
    s.phase = 'ready';
    if (!s.userMovedCamera) flyTo(viewPose(), animate ? 0.6 : 0);
    syncScene();
    press({ jump: !animate, quiet: true });
  }
  function step(dir) {
    if (s.locked) return lockedNudge();
    setForce(s.F + dir * F_LIMITS[2]);
  }

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshotSetup() {
    return {
      F: s.F,
      A: { heel: SHOES.heel.area, sneaker: SHOES.sneaker.area }, // cm²
      P: { heel: P('heel'), sneaker: P('sneaker') }, // Pa
    };
  }
  function snapshot() {
    const p = plan();
    return {
      ...snapshotSetup(),
      ratio: ratio(),
      phase: s.phase,
      look: s.look,
      depth: { heel: round(ground.depth(0) * 100, 2), sneaker: round(ground.depth(1) * 100, 2) }, // cm into the clay
      found: { ...s.found },
      next: p.label.replace('act_', ''),
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange(force = false) {
    const snap = snapshot();
    const key = JSON.stringify([snap.F, snap.phase, snap.look, snap.found, snap.mode, snap.view]);
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
      label: (j) => `<span class="pr-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  /** A question's scene: this force, the feet standing (or lifted), these labels; nothing moving. */
  async function scene_(F, { phase = 'stand', look = 'both', show = {} } = {}) {
    s.run++;
    tweener.cancel('feet');
    s.F = fixForce(F);
    s.show = { F: true, A: true, P: true, numbers: true, ...show };
    freshClay();
    for (const id of SHOE_IDS) s.y[id] = -target(id);
    s.phase = 'stand';
    syncScene();
    if (phase === 'lift') {
      s.phase = 'lift';
      for (const id of SHOE_IDS) s.y[id] = HOVER.lift;
      syncScene();
    }
    s.look = look;
    refresh();
    return flyTo(viewPose(), 0.6);
  }
  function revealAll() {
    s.show = { F: true, A: true, P: true, numbers: true };
    syncScene();
    refresh();
  }
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const paText = (v) => `${G(v)}${NBSP}Pa`;
  const nText = (v) => `${G(v)}${NBSP}N`;

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
        learnSaved = { F: s.F, phase: s.phase === 'press' ? 'stand' : s.phase, look: s.look, found: { ...s.found } };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        const saved = learnSaved;
        s.show = { F: true, A: true, P: true, numbers: true };
        s.found = { ...(saved?.found || s.found) };
        syncUI();
        s.run++;
        tweener.cancel('feet');
        s.F = saved?.F ?? s.F;
        s.look = saved?.look ?? 'both';
        freshClay();
        if (saved?.phase === 'stand' || saved?.phase === 'lift') {
          for (const id of SHOE_IDS) s.y[id] = -target(id);
          s.phase = 'stand';
          syncScene();
          if (saved.phase === 'lift') {
            s.phase = 'lift';
            for (const id of SHOE_IDS) s.y[id] = HOVER.lift;
          }
        } else {
          s.phase = 'ready';
          for (const id of SHOE_IDS) s.y[id] = HOVER.ready;
        }
        syncScene();
        refresh();
        emitChange();
        flyTo(viewPose(), 0);
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = ['heel', 'force', 'double', 'prints', 'unit'][i % 5];
        if (kind === 'heel') {
          const F = pickOne(QUIZ_FORCES);
          await scene_(F, { look: 'heel', show: { P: false } });
          if (!alive()) return null;
          question = { kind, F };
          return { text: t('q_heel'), ...choicesOf(heelChoices(F), kind, (x) => paText(x.v)) };
        }
        if (kind === 'force') {
          const Pq = pickOne(QUIZ_PRESSURES);
          const F = Math.round(Pq * toM2(SHOES.sneaker.area));
          await scene_(F, { look: 'sneaker', show: { F: false } });
          if (!alive()) return null;
          question = { kind, F, P: Pq };
          return { text: t('q_force'), ...choicesOf(forceChoices(Pq), kind, (x) => nText(x.v)) };
        }
        if (kind === 'double') {
          await scene_(pickOne(QUIZ_FORCES), { look: 'both' });
          if (!alive()) return null;
          question = { kind };
          const items = ['c_half', 'c_double', 'c_same', 'c_four'].map((key) => ({ key }));
          return { text: t('q_double'), ...choicesOf(items, kind, (x) => t(x.key)) };
        }
        if (kind === 'prints') {
          await scene_(pickOne(QUIZ_FORCES), { phase: 'lift', show: { A: false, numbers: false } });
          if (!alive()) return null;
          question = { kind };
          const items = ['c_less_area', 'c_more_force', 'c_sneaker_small', 'c_soft_ground'].map((key) => ({ key }));
          return { text: t('q_prints'), ...choicesOf(items, kind, (x) => t(x.key)) };
        }
        await scene_(pickOne(QUIZ_FORCES), { look: 'both', show: { numbers: false } });
        if (!alive()) return null;
        question = { kind: 'unit' };
        const items = ['c_pa', 'c_newton', 'c_nm', 'c_m2'].map((key) => ({ key }));
        return { text: t('q_unit'), ...choicesOf(items, 'unit', (x) => t(x.key)) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey], { one: N(1), many: G(10000) })}` : '');
        revealAll();
        if (k === 'heel') {
          const A = SHOES.heel.area;
          return (
            t('why_heel', { P: G(P('heel', question.F)), F: N(question.F), Am: N(toM2(A)), Ac: N(A) }) +
            note({ other: 'mis_heel_other', cm2: 'mis_heel_cm2', times: 'mis_heel_times' })
          );
        }
        if (k === 'force') {
          const A = SHOES.sneaker.area;
          return (
            t('why_force', { F: N(question.F), P: G(question.P), Am: N(toM2(A)), Ac: N(A) }) +
            note({ divide: 'mis_force_divide', cm2: 'mis_force_cm2', other: 'mis_force_other' })
          );
        }
        if (k === 'double') return t('why_double') + note({ c_double: 'mis_double', c_same: 'mis_same', c_four: 'mis_four' });
        if (k === 'prints')
          return t('why_prints') + note({ c_more_force: 'mis_more_force', c_sneaker_small: 'mis_sneaker_small', c_soft_ground: 'mis_soft_ground' });
        return t('why_unit') + note({ c_newton: 'mis_newton', c_nm: 'mis_nm', c_m2: 'mis_m2' });
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
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example) {
      if (s.locked) lockedNudge();
      else setLook(b.dataset.example);
    }
    if (b.dataset.step) step(Number(b.dataset.dir));
    if (b.dataset.term) focusTerm(b.dataset.term);
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
      case 'home':
        if (s.locked) lockedNudge();
        else {
          goHome();
          setLook('both');
        }
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
    const sceneKey =
      ['1', '2', '3', 'r', 'R', 'Home', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '-'].includes(k) ||
      ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3'].includes(k)) setLook(VIEWS[Number(k) - 1]);
    else if (k === 'ArrowUp' || k === 'ArrowRight' || k === '+') step(1);
    else if (k === 'ArrowDown' || k === 'ArrowLeft' || k === '-') step(-1);
    else if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') {
      goHome();
      setLook('both');
    } else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  controls.enableRotate = s.view === '3d';
  if (o.phase === 'stand' || o.phase === 'lift') {
    for (const id of SHOE_IDS) s.y[id] = -target(id);
    s.phase = 'stand';
    s.found.stand = true;
    syncScene();
    if (o.phase === 'lift') {
      s.phase = 'lift';
      s.found.lift = true;
      for (const id of SHOE_IDS) s.y[id] = HOVER.lift;
    }
  }
  flyTo(viewPose(), 0);
  syncScene();
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
     * Change any of: F (the force on each shoe, N: they stand again on smooth clay if they were standing), phase
     * ('ready' | 'stand' | 'lift'; with animate: false it lands there at once), look ('both' | 'heel' | 'sneaker'),
     * view ('front' | '3d'), found ({ stand, lift, force }: what the rule has already told).
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.found) {
        Object.assign(s.found, p.found);
        refresh();
      }
      if (p.F != null) setForce(p.F, { animate });
      if (p.phase === 'ready') goHome();
      else if (p.phase === 'stand' && s.phase !== 'stand') {
        if (s.phase === 'lift') flyTo(viewPoseFor('stand'), animate ? 0.9 : 0);
        await press({ jump: !animate, quiet: !animate });
      } else if (p.phase === 'lift' && s.phase !== 'lift') {
        if (s.phase !== 'stand') await press({ jump: true, quiet: true });
        await lift({ jump: !animate });
      }
      if (p.look) await setLook(p.look, { animate });
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.found = { stand: false, lift: false, force: false };
      s.show = { F: true, A: true, P: true, numbers: true };
      s.F = F_START;
      goHome();
      s.look = 'both';
      await setView('front', { animate: false });
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The two feet in their shoes and the clay near them (with the prints as they are), in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'Pressure';
      for (const id of SHOE_IDS) g.add(shoes[id].root.clone(true));
      for (const m of ground.near()) g.add(m);
      return g;
    },
  };
}
