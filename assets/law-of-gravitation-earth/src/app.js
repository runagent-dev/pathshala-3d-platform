// Law of gravitation: the Earth and a weight (book page 79, topic 3.7), student view. The Earth cut open like an
// orange to its centre, in a starry sky; the student puts a 1 kg weight on the ground (its weight, about 9.8 N: the
// Earth's pull on it, and the weight pulls the Earth just as hard; R is measured from the Earth's centre) and then a
// second one (twice the weight, the same 9.8 N for each kg: g = GM/R²). Then a short test. The panel is the kit's
// clean sheet (one action, one result, one rule): one big numbered action whose same badge rings the part to touch,
// one result line, one short rule. The two iron spheres on a bench are the lab law-of-gravitation.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { createEarth, LIFT, WEIGHT } from './earth.js';
import { fitPose } from './camera.js';
import { boldArrow } from './arrows.js';
import { createStars, gradientTexture } from './setting.js';
import { EARTH, STEPS, gravity, heightChoices, radiusChoices, roundTo, weight } from './physics.js';

export const DEFAULTS = {
  steps: 0, // 0 … 2: start with that many of the student's steps already done (for pictures)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring pulses (false: it stays still)
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const GRAVITY = '#7048e8'; // মহাকর্ষ বল: the same violet as gravitational-force and the weight in chapter 3
const GRAVITY_BEFORE = '#ab98f0'; // the faint arrows of the moment before
const DIST = 0x0b7285; // দূরত্ব: one colour for the distance, on the R line, in the sentences and in the formula
const MINUS = '−';
const LIFT_2R = 1 - WEIGHT.h / 2; // Earth radii above the ground that put the weight's centre two radii from the Earth's centre
const W_ARROW = 0.3; // Earth radii of arrow per kg of the weight
const DOUBLE_TAP = 450; // ms: a second action this soon after one is ignored
const EARTH_DIR = new THREE.Vector3(0, Math.sin(THREE.MathUtils.degToRad(20)), Math.cos(THREE.MathUtils.degToRad(20)));
const VIEW_3D = new THREE.Vector3(0.55, 0.42, 0.9).normalize();
const X_AXIS = new THREE.Vector3(1, 0, 0);

/** Integers with Bangladeshi commas: 1,000 · 63,70,000. */
function groupBD(n) {
  const s = String(Math.round(Math.abs(n)));
  if (s.length <= 3) return s;
  const head = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${head},${s.slice(-3)}`;
}

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const plain = (x, d = 2) => String(roundTo(x, d)); // numbers in sentences: no trailing zeros

  // symbols with subscripts and powers (the font has no ² ⁻): passed into strings as vars
  const SYM = {
    G: '<i>G</i>',
    M: '<i class="lg-qm">M</i>',
    R: '<i class="lg-qd">R</i>',
    r: '<i class="lg-qd">r</i>',
    g: '<i class="lg-qf">g</i>',
    R2: '<i class="lg-qd">R</i><sup class="lg-qd">2</sup>',
    ms2: `m s<sup>${MINUS}2</sup>`,
    four: '4',
    one: '1',
    two: '2',
  };
  /** One symbol of a formula with the word for it underneath, both in the colour of what it stands for. */
  const term = (cls, sym, cap = '') => `<span class="lg-term ${cls}"><span class="lg-sym">${N(sym)}</span><small>${cap}</small></span>`;
  const op = (c) => `<span class="lg-op">${c}</span>`;
  const grp = (c, termHtml) => `<span class="lg-grp">${c ? op(c) : ''}${termHtml}</span>`;
  /** The law for a body on the Earth, for each kg: g = G × M ÷ R². */
  const earthLawHtml = () =>
    `<span class="lg-formula">${[
      grp('', term('lg-qf', SYM.g)),
      grp('=', term('lg-qg', SYM.G, t('cap_G'))),
      grp('×', term('lg-qm', SYM.M, t('cap_earth_mass'))),
      grp('÷', term('lg-qd', SYM.R2, t('cap_centre_dist2'))),
    ].join('')}</span>`;
  /** a × 10ⁿ as HTML: only in the quiet "book values" line, never in a first view. */
  const pow10 = (m, e) => `${m} × 10<sup>${e < 0 ? MINUS : ''}${Math.abs(e)}</sup>`;
  const BOOK = {
    G: SYM.G,
    Gv: pow10('6.67', -11),
    Gu: `N m<sup>2</sup> kg<sup>${MINUS}2</sup>`,
    M: SYM.M,
    Mv: pow10('5.98', 24),
    R: SYM.R,
    Rv: pow10('6.37', 6),
  };
  const block = (html) => `<span class="lg-line">${html}</span>`;

  root.classList.add('pvc', 'lg');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learnAlign: 'start',
    learn: cleanSheet(t, {
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 2, outcome: 1, rule: 3 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 26, near: 0.05, far: 100, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableRotate = false;
  controls.enableZoom = false;
  controls.minDistance = 1.5;
  controls.maxDistance = 12;
  controls.minAzimuthAngle = -1.05;
  controls.maxAzimuthAngle = 1.05;
  controls.minPolarAngle = 0.3;
  controls.maxPolarAngle = 1.42;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  // the Earth, cut open to its centre, the weight, the two pulls, the R line (and the test's radius and height lines)
  const earth = createEarth({ renderer: stage.renderer, kg: `${N('1')} kg` });
  const earthScene = new THREE.Group();
  earthScene.name = 'EarthScene';
  earthScene.add(earth.root);
  // drawn over the weight and the cut faces (a drawing on the picture), white-outlined
  const wArrow = boldArrow('Weight', GRAVITY, 0.0115, { order: 22 });
  const eArrow = boldArrow('PullOnEarth', GRAVITY, 0.0115, { order: 22 });
  const wGhost = boldArrow('WeightBefore', GRAVITY_BEFORE, 0.0095, { order: 18 });
  const eGhost = boldArrow('PullOnEarthBefore', GRAVITY_BEFORE, 0.0095, { order: 18 });
  for (const a of [wArrow, eArrow, wGhost, eGhost]) earthScene.add(a.root);
  wGhost.root.userData.noExport = true;
  eGhost.root.userData.noExport = true;
  /** A dimension line: a bar from a to b with a short tick across each end, in a white rim (drawn over the cut face). */
  const rimMat = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, depthWrite: false, toneMapped: false });
  const barGeo = new THREE.CylinderGeometry(0.0065, 0.0065, 1, 8).translate(0, 0.5, 0);
  const barRimGeo = new THREE.CylinderGeometry(0.0115, 0.0115, 1, 8).translate(0, 0.5, 0);
  const tickGeo = new THREE.BoxGeometry(0.05, 0.009, 0.009);
  const tickRimGeo = new THREE.BoxGeometry(0.06, 0.019, 0.019);
  function dimLine(name, color = 0x1d2733) {
    const g = new THREE.Group();
    g.name = name;
    g.userData.noExport = true;
    const mat = new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false, toneMapped: false });
    const bar = new THREE.Mesh(barGeo, mat);
    bar.add(Object.assign(new THREE.Mesh(barRimGeo, rimMat), { renderOrder: 8 }));
    const ticks = [0, 1].map(() => {
      const tk = new THREE.Mesh(tickGeo, mat);
      tk.add(Object.assign(new THREE.Mesh(tickRimGeo, rimMat), { renderOrder: 8 }));
      return tk;
    });
    g.add(bar, ...ticks);
    for (const m of [bar, ...ticks]) m.renderOrder = 9;
    g.visible = false;
    earthScene.add(g);
    const up = new THREE.Vector3(0, 1, 0);
    const d = new THREE.Vector3();
    const tq = new THREE.Quaternion();
    return {
      group: g,
      /** From a to b (world), ticks across along `across`, k: how much of it is drawn (it grows from a). */
      set(a, b, across, k = 1) {
        d.subVectors(b, a);
        const len = d.length() * k;
        g.visible = len > 1e-4;
        bar.position.copy(a);
        bar.quaternion.setFromUnitVectors(up, d.normalize());
        bar.scale.set(1, Math.max(1e-4, len), 1);
        const q = tq.setFromUnitVectors(X_AXIS, across);
        ticks[0].position.copy(a);
        ticks[1].position.copy(a).addScaledVector(d, len);
        for (const tk of ticks) tk.quaternion.copy(q);
        ticks[1].visible = k > 0.999;
      },
      hide: () => (g.visible = false),
    };
  }
  const RLine = dimLine('RLine', DIST);
  const radiusLine = dimLine('RadiusLine', DIST);
  const liftLine = dimLine('HeightLine');
  // the R line runs on the left cut face, beside the edge from the weight to the centre; the radius on the right face
  const LEFT_U = new THREE.Vector3(-1, 0, 1).normalize();
  const LEFT_N = new THREE.Vector3(1, 0, 1).normalize();
  const RIGHT_U = new THREE.Vector3(1, 0, 1).normalize();
  const RIGHT_N = new THREE.Vector3(-1, 0, 1).normalize();
  const R_OFF = new THREE.Vector3().addScaledVector(LEFT_U, 0.11).addScaledVector(LEFT_N, 0.008);
  scene.add(earthScene);

  // a starry night sky (left out on a transparent background, and never exported)
  if (o.bg !== 'transparent') {
    scene.background = gradientTexture('#050a1f', '#18204b');
    earthScene.add(createStars());
  }
  const sun = new THREE.DirectionalLight(0xffffff, 0.45);
  sun.position.set(-1.2, 4, 3);
  scene.add(sun);
  // a little light from the front, so the cut faces read well
  const front = new THREE.DirectionalLight(0xffffff, 0.35);
  front.position.set(-1, 2, 5);
  scene.add(front);

  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const s = {
    placed: 0, // 0 … 1: the weight on its way down (1: on the ground)
    kg: 1, // weights on the Earth
    lift: 0, // the test: held above the ground, in Earth radii
    pullK: 1, // the pull on the weight as a part of its weight at the ground (a quarter two radii out), for the arrows
    rGrow: 0, // 0 … 1: the R line drawn so far
    ghostKg: null, // the weight before the last change, or null
    last: null, // the change just made: 'place' | 'add' | null
    busy: false,
    acting: null,
    dropping: false, // the second weight is on its way down
    found: { place: false, add: false },
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    quizScene: null, // what a test question shows: { arrows, R, R2, radius, lift, liftLine }
    userMovedCamera: false,
  };
  const now = () => performance.now();
  let token = 0; // bumped by anything that calls off what is pending
  let lastAct = Number.NEGATIVE_INFINITY;

  // ── the scene each frame ──────────────────────────────────────────────────
  const tB = new THREE.Vector3();
  const tC = new THREE.Vector3();
  const eC = new THREE.Vector3();
  const eTail = new THREE.Vector3();
  const XP = new THREE.Vector3(1, 0, 0);
  const UP = new THREE.Vector3(0, 1, 0);
  const DOWN = new THREE.Vector3(0, -1, 0);
  const E_OFF = new THREE.Vector3(0, 0, 0.035);
  const E_SIDE = new THREE.Vector3(0.05, 0, 0);
  function placeEarth() {
    earth.setPlaced(s.placed);
    earth.setLift(s.lift);
    earth.setCount(s.kg === 2 || s.dropping ? 2 : 1);
    const q = s.quizScene;
    const arrowsOn = s.placed > 0.001 && (!q || q.arrows);
    const c = earth.bodyCentre(eC);
    const L = W_ARROW * s.kg * s.pullK;
    // a weight held far above the ground: its arrow starts at its underside (a short one would hide inside it)
    const tail = eTail.copy(c).add(E_OFF);
    if (s.lift > 0.5) tail.y = c.y - (WEIGHT.h * s.kg) / 2;
    if (arrowsOn) {
      wArrow.set(tail, DOWN, L);
      eArrow.set(E_OFF, UP, L);
    } else {
      wArrow.hide();
      eArrow.hide();
    }
    if (arrowsOn && s.ghostKg != null && !s.busy) {
      wGhost.set(tC.copy(tail).add(E_SIDE), DOWN, W_ARROW * s.ghostKg);
      eGhost.set(tC.copy(E_OFF).add(E_SIDE), UP, W_ARROW * s.ghostKg);
    } else {
      wGhost.hide();
      eGhost.hide();
    }
    if (s.rGrow > 0.001) RLine.set(tC.copy(R_OFF), tB.copy(c).add(R_OFF), LEFT_U, s.rGrow);
    else RLine.hide();
    if (q?.radius) radiusLine.set(tC.set(0, 0, 0).addScaledVector(RIGHT_N, 0.008), tB.copy(RIGHT_U).addScaledVector(RIGHT_N, 0.008), UP);
    else radiusLine.hide();
    if (q?.liftLine) {
      const x = -(WEIGHT.r0 + 0.05); // left of the weight (the weight's label is on the right)
      liftLine.set(tC.set(x, 1, 0.01), tB.set(x, earth.bodyBottom().y, 0.01), XP);
    } else liftLine.hide();
  }

  // ── labels on the 3D view ───────────────────────────────────────────────────
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [
      ui.corner,
      () => (ui.hint.classList.contains('show') ? hintBox() : null),
      () => action?.ringBox(),
      () => action?.box(),
      () => arrowBoxes(),
    ],
  });
  /** The arrows shown now, as boxes on the view (canvas pixels): no label and no badge sits on them. */
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const arrowBox = new THREE.Box3();
  function arrowBoxes() {
    const out = [];
    for (const a of [wArrow, eArrow, wGhost, eGhost]) {
      if (!a.root.visible) continue;
      arrowBox.setFromObject(a.root);
      if (arrowBox.isEmpty()) continue;
      let i = 0;
      for (const x of [arrowBox.min.x, arrowBox.max.x])
        for (const y of [arrowBox.min.y, arrowBox.max.y]) for (const z of [arrowBox.min.z, arrowBox.max.z]) corners[i++].set(x, y, z).project(camera);
      const b = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
      for (const c of corners) {
        const x = (c.x * 0.5 + 0.5) * stage.width;
        const y = (-c.y * 0.5 + 0.5) * stage.height;
        b.left = Math.min(b.left, x);
        b.right = Math.max(b.right, x);
        b.top = Math.min(b.top, y);
        b.bottom = Math.max(b.bottom, y);
      }
      out.push(b);
    }
    return out;
  }
  function hintBox() {
    const r = ui.hint.getBoundingClientRect();
    const c = stage.canvas.getBoundingClientRect();
    return { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top };
  }
  const pts = {
    centre: new THREE.Vector3(0, 0, 0),
    w: new THREE.Vector3(),
    e: new THREE.Vector3(),
    mw: new THREE.Vector3(),
    R: new THREE.Vector3(),
    radius: new THREE.Vector3(),
    lift: new THREE.Vector3(),
  };
  const tLab = new THREE.Vector3();
  // a label is (re)made only when its words change: the kit fades a new label in
  const labelText = new Map();
  function label(id, opts) {
    if (labelText.get(id) === opts.text && anno.has(id)) return;
    if (anno.has(id) && labelText.has(id)) anno.update(id, { text: opts.text });
    else anno.add(id, opts);
    labelText.set(id, opts.text);
  }
  function unlabel(...ids) {
    for (const id of ids) {
      anno.remove(id);
      labelText.delete(id);
    }
  }
  const LABELS = ['centre', 'w', 'e', 'mw', 'R', 'radius', 'lift'];
  function labelsFor() {
    const q = s.quizScene;
    const small = stage.height < 250;
    label('centre', {
      text: t('l_centre'),
      point: () => pts.centre,
      kind: 'part',
      // on a short view the label goes to the right of the centre (the R label is on the left)
      spots: small
        ? q?.R2
          ? [
              { dx: -14, dy: 18 },
              { dx: 14, dy: 20 },
            ]
          : [
              { dx: 14, dy: 20 },
              { dx: -14, dy: 20 },
            ]
        : [
            { dx: -60, dy: 26 },
            { dx: 60, dy: 30 },
            { dx: -70, dy: -10 },
          ],
    });
    const arrowsOn = s.placed > 0.001 && (!q || q.arrows);
    if (arrowsOn) {
      const L = W_ARROW * s.kg * s.pullK;
      label('w', {
        text: t('l_weight'),
        point: () => pts.w.copy(earth.bodyCentre()).add(tLab.set(0, -L * 0.62, 0.035)),
        kind: 'flat',
        color: GRAVITY,
        spots: [
          { dx: 36, dy: 0 },
          { dx: 40, dy: 10 },
          { dx: -36, dy: 0 },
        ],
      });
      label('e', {
        text: t(small ? 'l_on_earth_short' : 'l_on_earth'),
        point: () => pts.e.set(0, L * 0.6, 0.035),
        kind: 'flat',
        color: GRAVITY,
        spots: [
          { dx: 22, dy: 0 },
          { dx: -22, dy: 0 },
          { dx: 24, dy: -16 },
          { dx: -24, dy: -16 },
        ],
      });
    } else unlabel('w', 'e');
    // the two weights together (each weight has its own "১ kg" plate)
    if (!q && s.placed > 0.999 && (s.kg === 2 || s.dropping))
      label('mw', {
        text: t('l_weight_total', { kg: '2' }),
        point: () => pts.mw.copy(earth.bodyCentre()).add(tLab.set(0, 0, 0.1)),
        kind: 'flat',
        spots: [
          { dx: -30, dy: 0 },
          { dx: -42, dy: -12 },
          { dx: 30, dy: 0 },
        ],
      });
    else unlabel('mw');
    if (s.rGrow > 0.999 && (!q || q.R))
      label('R', {
        text: q?.R2
          ? t('l_r2R', { r: SYM.r, R: SYM.R, two: '2' })
          : small
            ? t('l_R_short', { R: SYM.R })
            : t('l_R', { R: SYM.R, v: groupBD(EARTH.R / 1000) }),
        point: () => pts.R.copy(R_OFF).setY(earth.bodyCentre().y * (q?.R2 ? 0.74 : 0.42)),
        kind: 'part',
        spots: [
          { dx: -70, dy: 0 },
          { dx: -60, dy: -30 },
          { dx: -60, dy: 30 },
        ],
      });
    else unlabel('R');
    if (q?.radius)
      label('radius', {
        text: q.R2
          ? small
            ? t('l_R_short', { R: SYM.R })
            : t('l_R', { R: SYM.R, v: groupBD(EARTH.R / 1000) })
          : t('l_radius', { v: groupBD(EARTH.R / 1000) }),
        point: () => pts.radius.copy(RIGHT_U).multiplyScalar(0.62),
        kind: 'part',
        spots: small
          ? [
              { dx: 12, dy: 6 },
              { dx: 12, dy: -12 },
            ]
          : [
              { dx: 50, dy: 34 },
              { dx: 30, dy: 50 },
              { dx: 60, dy: -30 },
            ],
      });
    else unlabel('radius');
    if (q?.liftLine)
      label('lift', {
        text: t('l_lift', { h: '1' }),
        point: () => pts.lift.set(-(WEIGHT.r0 + 0.05), 1 + 0.04, 0.01),
        kind: 'flat',
        spots: [
          { dx: -14, dy: 0 },
          { dx: -16, dy: -16 },
        ],
      });
    else unlabel('lift');
  }

  // ── the panel: one action, one result, one rule ─────────────────────────────
  const ACT_KEY = { place: 'act_place', add: 'act_add', again: 'act_again' };
  /** What the big button (and a tap on the ringed part) does now: put the weight down, add one, or start again. */
  function plan() {
    if (s.placed < 0.5) return { act: 'place', step: 1 };
    if (s.kg < 2) return { act: 'add', step: 2 };
    return { act: 'again', step: '' };
  }
  function outcomeHtml() {
    if (s.placed < 0.999 || s.acting === 'place') return t('out_earth0');
    // g is rounded first (9.8), so that two weights read exactly twice one: 9.8 and 19.6 newtons
    const g1 = roundTo(gravity(), 1);
    const main =
      s.kg === 1 || s.acting === 'add'
        ? t('out_weight', { kg: '1', w: plain(g1, 1) })
        : t('out_weight2', { kg: '2', w: plain(g1 * 2, 1), one: '1', two: '2' });
    return `${main}<span class="lg-scale">${t('note_earth')}</span>`;
  }
  function ruleHtml() {
    const v = { ...SYM };
    if (s.placed < 0.999 || s.acting === 'place' || !s.found.place) return t('rule_earth0', v);
    if (s.kg === 1 || s.acting === 'add') return t('rule_earth1', { ...v, km: groupBD(EARTH.R / 1000) });
    return (
      t('rule_earth2', { ...v, gv: plain(roundTo(gravity(), 1), 1) }) +
      block(earthLawHtml()) +
      `<span class="lg-line lg-book">${t('book_earth', BOOK)}</span>`
    );
  }

  function refresh() {
    placeEarth();
    if (s.mode === 'explore') {
      sheet.outcome(outcomeHtml());
      sheet.rule(ruleHtml());
      if (action) {
        const p = plan();
        action.set({ step: p.step, label: () => t(ACT_KEY[p.act]), worldRadius: actionRing()?.radius ?? 0.3 });
        if (s.busy) action.hide('run');
        else action.show('run');
      }
    }
    root.dataset.short = stage.height < 250 ? '1' : ''; // a short view: the part labels get smaller
    labelsFor();
    stage.invalidate();
  }

  function snapshot() {
    const p = plan();
    return {
      placed: s.placed > 0.999,
      kg: s.kg,
      weight: roundTo(weight(s.kg), 2), // N
      g: roundTo(gravity(), 2), // m s⁻²
      found: { ...s.found },
      last: s.last,
      busy: s.busy,
      next: { act: p.act, step: p.step },
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.placed, snap.kg, snap.found, snap.mode, snap.busy]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── changes, animated ───────────────────────────────────────────────────────
  /** Tweens a state key to a value (resolves true when it got there). */
  function tweenTo(key, to, duration, e = ease.inOutCubic) {
    const from = s[key];
    if (!duration || from === to) {
      s[key] = to;
      refresh();
      return Promise.resolve(true);
    }
    return tweener
      .animate({
        key,
        duration,
        ease: e,
        onUpdate: (k) => {
          s[key] = from + (to - from) * k;
          refresh();
        },
      })
      .finished.then((done) => {
        if (done) {
          s[key] = to;
          refresh();
        }
        return done;
      });
  }
  /** A step still moving is finished where it was going, so nothing half-done is kept. */
  function settleStep() {
    const act = s.acting;
    if (!act) return;
    if (act === 'place') {
      s.kg = 1;
      s.placed = 1;
      s.rGrow = 1;
    } else if (act === 'add') s.kg = 2;
    s.found[act] = true;
    s.last = act;
  }
  function cancelTweens() {
    for (const k of ['placed', 'kg', 'lift', 'rGrow']) tweener.cancel(k);
    s.busy = false;
    s.acting = null;
    s.dropping = false;
    earth.weights.children[1].position.y = WEIGHT.h;
  }

  /** Back to the start: the Earth with no weight on it. */
  function home({ quiet = false } = {}) {
    if (s.locked && !quiet) return lockedNudge();
    ++token;
    cancelTweens();
    Object.assign(s, { placed: 0, kg: 1, rGrow: 0, lift: 0, pullK: 1, ghostKg: null, last: null, quizScene: null });
    refresh();
    emitChange();
    return true;
  }

  /** One change (the student's step): the faint arrows keep the moment before; the rule and the result follow it. */
  async function perform(act, { animate = true } = {}) {
    const my = ++token;
    const dur = (x) => (animate ? x : 0);
    s.ghostKg = act === 'add' ? s.kg : null;
    s.busy = animate;
    s.acting = act;
    refresh();
    emitChange();
    let done = true;
    if (act === 'place') {
      s.kg = 1;
      done = await tweenTo('placed', 1, dur(0.75), ease.inCubic);
      if (done && my === token && animate) audio.contact();
      if (done && my === token) done = await tweenTo('rGrow', 1, dur(0.6));
    } else if (act === 'add' && animate) {
      // the second weight comes down onto the first; the pulls count it once it has landed
      s.dropping = true;
      const w2 = earth.weights.children[1];
      done = await tweener.animate({
        key: 'kg',
        duration: 0.6,
        ease: ease.inCubic,
        onUpdate: (k) => {
          w2.position.y = WEIGHT.h + 0.9 * (1 - k);
          refresh();
        },
      }).finished;
      w2.position.y = WEIGHT.h;
      s.dropping = false;
      if (done && my === token) audio.contact();
    }
    if (my !== token) return false;
    if (done && act === 'add') s.kg = 2;
    s.busy = false;
    s.acting = null;
    if (done) {
      s.found[act] = true;
      s.last = act;
      emit('act', { act });
    }
    refresh();
    emitChange();
    return done;
  }

  /** The action: the big button, its badge on the view, a tap on the ringed part, Space/Enter/→. */
  async function doAction({ animate = true } = {}) {
    if (s.locked) return lockedNudge();
    if (s.busy) return;
    if (now() - lastAct < DOUBLE_TAP) return; // a double tap must not do two steps
    lastAct = now();
    hintOff();
    const p = plan();
    if (p.act === 'again') {
      for (const k of Object.keys(s.found)) s.found[k] = false;
      home({ quiet: true });
      return;
    }
    await perform(p.act, { animate });
  }

  /** Where the action's ring goes: the spot on the ground where the weight will stand, or the weight. */
  const ringAt = new THREE.Vector3();
  function actionRing() {
    if (s.mode === 'quiz' || s.busy) return null;
    const p = plan();
    if (p.act === 'place') return { at: ringAt.set(0, 1 + WEIGHT.h / 2, 0), radius: WEIGHT.h * 0.95 };
    if (p.act === 'add') return { at: ringAt.copy(earth.bodyCentre()), radius: WEIGHT.h * 0.95 };
    return null;
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: () => t('act_place'),
    target: () => actionRing()?.at ?? null,
    worldRadius: 0.2,
    avoid: [ui.corner, ui.hint, () => [...labelText.keys()].map((id) => anno.box(id)), () => arrowBoxes()],
    pulse: Boolean(o.coach),
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── camera ──────────────────────────────────────────────────────────────────
  const box = new THREE.Box3();
  function earthBox() {
    // the centre to the top of two stacked weights (or of the weight held two radii out in a test question)
    const top = s.quizScene?.R2 ? 2 + WEIGHT.h / 2 + 0.2 : 1 + WEIGHT.h * 2 + 0.2;
    box.min.set(-0.66, -0.1, -0.3);
    box.max.set(0.66, top, 0.7);
    return box;
  }
  const MARGIN = { top: 58, bottom: 10, side: 8 };
  function viewPose(view = s.view) {
    return fitPose({ box: earthBox(), dir: view === '3d' ? VIEW_3D : EARTH_DIR, camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  function flyTo({ position, target }, duration = 0.8) {
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
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
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    return flyTo(viewPose(), animate ? 0.8 : 0);
  }
  // the view starts from the front; dragging turns it, and then the "front" button appears to come back
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
    }
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    refresh();
  });

  // ── touching the scene: the ringed spot or the weight does the action ──────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitBall = new THREE.Sphere();
  function pick(e) {
    const r = stage.canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const ring = actionRing();
    if (!ring) return false;
    hitBall.set(ring.at, ring.radius + 0.06); // a little bigger than the weight, for a finger
    return raycaster.ray.intersectsSphere(hitBall);
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (s.mode === 'quiz') return;
      if (!pick(e)) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      doAction();
    },
    true,
  );
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    requestAnimationFrame(() => {
      hoverQueued = false;
      ui.canvasHost.style.cursor = s.mode !== 'quiz' && pick(e) ? 'pointer' : '';
    });
  });

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 2600 } = {}) {
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
    showHint(t('q_locked'));
    audio.error();
    return false;
  }

  // ── the test ────────────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  const qText = ui.$('.pvc-q-text');
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const KINDS = ['pair', 'radius', 'h'];

  /** A question's picture: the Earth with one weight, nothing left from before. */
  async function setQuizScene(sc) {
    ++token;
    cancelTweens();
    s.ghostKg = null;
    s.last = null;
    s.quizScene = sc;
    s.placed = 1;
    s.kg = 1;
    s.lift = sc.lift || 0;
    s.pullK = 1;
    s.rGrow = sc.R ? 1 : 0;
    if (s.view !== 'front') {
      s.view = 'front';
      syncUI();
    }
    unlabel(...LABELS);
    refresh();
    s.userMovedCamera = false;
    await flyTo(viewPose(), 0);
    refresh();
  }
  const optText = (html) => `<span class="lg-opt lg-opt-words">${html}</span>`;

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: KINDS.length,
    lines: { text: 2, feedback: 3 },
    action,
    hooks: {
      enter() {
        settleStep(); // a step still moving (the test tapped mid-run) is finished first, then saved whole
        learnSaved = { placed: s.placed, kg: s.kg, rGrow: s.rGrow, found: { ...s.found }, last: s.last, ghostKg: s.ghostKg };
        ++token;
        cancelTweens();
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        ++token;
        cancelTweens();
        s.mode = 'explore';
        s.locked = false;
        s.quizScene = null;
        unlabel(...LABELS);
        const saved = learnSaved || { placed: 0, kg: 1, rGrow: 0, found: { ...s.found }, last: null, ghostKg: null };
        Object.assign(s, saved, { found: { ...saved.found } });
        s.lift = 0;
        s.pullK = 1;
        earth.weights.children[1].position.y = WEIGHT.h;
        syncUI();
        setView(s.view, { animate: false });
        refresh();
        emitChange();
      },
      async prepare(i, alive) {
        const kind = KINDS[i % KINDS.length];
        picked = -1;
        const ask = (html) => {
          if (alive()) qText.innerHTML = html;
        };
        const order = shuffle([0, 1, 2, 3]);
        if (kind === 'pair') {
          // the weight on the ground, its weight's arrow only: does the weight pull the Earth too?
          await setQuizScene({ arrows: false, R: false });
          if (!alive()) return null;
          const keys = ['pair_same', 'pair_less', 'pair_none', 'pair_more'];
          question = { kind, keys, order };
          ask(t('q_pair'));
          return { choices: order, expected: 0, tolerance: 0.5, label: (j) => optText(t(keys[j])), meta: { kind, answer: 'same' } };
        }
        if (kind === 'radius') {
          await setQuizScene({ arrows: true, R: false, radius: true, lift: LIFT, liftLine: true });
          if (!alive()) return null;
          const list = radiusChoices();
          question = { kind, list, order };
          ask(t('q_radius', { h: '1', R: SYM.R }));
          // all four are written alike (a number and its unit), so none gives the answer away by its look
          const lab = [`${groupBD(list[0] / 1000)} km`, '1 m', `${groupBD(list[2] / 1000)} km`, `${groupBD(list[3])} m`];
          return { choices: order, expected: 0, tolerance: 0.5, label: (j) => optText(N(lab[j])), meta: { kind, answer: list[0] } };
        }
        // the weight two radii from the Earth's centre: needs r read off the picture and squared
        await setQuizScene({ arrows: false, R: true, R2: true, radius: true, lift: LIFT_2R });
        if (!alive()) return null;
        const list = heightChoices(2);
        question = { kind: 'h', list, order };
        ask(t('q_h', { kg: '1', two: '2', R: SYM.R, w0: plain(roundTo(gravity(), 1), 1) }));
        return {
          choices: order,
          expected: 0,
          tolerance: 0.5,
          label: (j) => optText(`${N(plain(list[j], 1))} ${t('newton')}`),
          meta: { kind: 'h', answer: list[0] },
        };
      },
      reveal(_q, correct) {
        const q = question;
        const wrong = correct ? null : q.order[picked];
        const mistake = (map, vars = {}) => (wrong != null && map[wrong] ? ` ${t(map[wrong], { ...SYM, ...vars })}` : '');
        if (q.kind === 'pair') {
          s.quizScene = { ...s.quizScene, arrows: true };
          refresh();
          return t('why_pair', SYM) + mistake({ 1: 'not_pair_less', 2: 'not_pair_none', 3: 'not_pair_more' });
        }
        if (q.kind === 'radius') {
          s.quizScene = { ...s.quizScene, R: true };
          tweenTo('rGrow', 1, 0.7);
          const km = groupBD(EARTH.R / 1000);
          return (
            t('why_radius', { ...SYM, km, h: '1' }) +
            mistake({ 1: 'not_rad_height', 2: 'not_rad_diam', 3: 'not_rad_km' }, { km, m: km, kmm: plain(EARTH.R / 1e6, 2) })
          );
        }
        // the pull two radii out: a quarter of the weight at the ground (the faint arrows keep the weight at the ground)
        s.quizScene = { ...s.quizScene, arrows: true };
        s.pullK = 0.25;
        s.ghostKg = 1;
        refresh();
        return (
          t('why_h', { ...SYM, ans: plain(q.list[0], 1), w0: plain(roundTo(gravity(), 1), 1) }) +
          mistake({ 1: 'not_h_nosq', 2: 'not_h_same', 3: 'not_h_more' })
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
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = s.view !== '3d';
    controls.enableRotate = controls.enableZoom = !s.locked;
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) {
      if (s.locked) lockedNudge();
      else setView(b.dataset.view);
    }
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
        home();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(target.closest('button'));
    const sceneKey = ['r', 'R', 'Home', 'ArrowRight', 'f', 'F', 'v', 'V'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (k === 'ArrowRight' || ((k === ' ' || k === 'Enter') && !onButton)) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') home();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  /** Jumps to the state after the first n of the student's steps (n = 0…2), with what they found. */
  function applySteps(n) {
    ++token;
    cancelTweens();
    s.placed = n >= 1 ? 1 : 0;
    s.rGrow = s.placed;
    s.kg = n >= 2 ? 2 : 1;
    for (const k of Object.keys(s.found)) s.found[k] = false;
    for (const act of STEPS.slice(0, n)) s.found[act] = true;
    s.last = n > 0 ? STEPS[n - 1] : null;
    s.ghostKg = n >= 2 ? 1 : null;
  }

  const clampSteps = (v) => Math.max(0, Math.min(STEPS.length, Math.round(Number(v) || 0)));
  applySteps(clampSteps(o.steps));
  syncUI();
  refresh();
  setView(s.view, { animate: false });
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
    /** Change any of: steps (0…2: the state after that many of the student's steps), act (true: the big button's next change), view; animate: false jumps. */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.steps != null) {
        applySteps(clampSteps(p.steps));
        refresh();
      }
      if (p.act) {
        lastAct = Number.NEGATIVE_INFINITY;
        const wasLocked = s.locked;
        s.locked = false;
        await doAction({ animate });
        s.locked = wasLocked;
      }
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      for (const k of Object.keys(s.found)) s.found[k] = false;
      s.view = 'front';
      syncUI();
      home({ quiet: true });
      await setView('front', { animate: false });
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The Earth cut open, the weight and the two pulls (Earth radii: the GLB is a drawing, not to scale). */
    exportRoot: () => earthScene,
  };
}
