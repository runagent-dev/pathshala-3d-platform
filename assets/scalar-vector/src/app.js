// Scalar and vector quantities (book page 38, topic 2.3), student view: four arrow pieces A, B, C, D lie on graph
// paper as in চিত্র ২.০৩, beside a thermometer reading 37° C. Drag an arrow by its body to move it (its মান and দিক
// stay the same: the same vector), drag its head to turn it (দিক) or stretch it (মান), and drop it on another
// arrow's tail to compare the two: only when মান and দিক are both equal are they the same vector, wherever they were
// drawn. The thermometer can be moved and turned too, and nothing changes: a temperature is a scalar, a মান with no
// দিক. The panel reads the chosen piece; three buttons line up the book's pairs (A–B, A–C, C–D). Then a short test.
// Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials, textMesh } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createCoach } from '@shared/student/coach.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import {
  BOARD_SIZE,
  COLORS,
  PAPER_SIZE,
  PAPER_TOP,
  UNIT,
  createAngleMark,
  createArrow,
  createBoard,
  createDockMark,
  createGhost,
  createPlaces,
  createRing,
  createThermometer,
  toPaper,
  toWorld,
} from './board.js';
import {
  ANGLE_STEP,
  BOOK,
  LEN_MAX,
  LEN_MIN,
  NAMES,
  PAPER,
  ROSE,
  TEMPERATURE,
  THERMO,
  commonTail,
  compare,
  compass,
  fitOnPaper,
  fitThermo,
  headOf,
  landing,
  maxLengthFrom,
  norm360,
  placeApart,
  readingMistakes,
  sameDirection,
  segmentDistance,
  snapPolar,
  thermoEnds,
} from './reading.js';

export const DEFAULTS = {
  compare: '', // "A,B": B starts on A's tail
  select: 'A',
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const dirFrom = (azimuth, elevation) => {
  const a = THREE.MathUtils.degToRad(azimuth);
  const e = THREE.MathUtils.degToRad(elevation);
  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
};
// front: nearly from above at every aspect, so a দিক on the paper looks like the দিক it is (at most 18° of slant)
const viewDir = (view, aspect) =>
  view === '3d' ? dirFrom(28, 36) : dirFrom(0, THREE.MathUtils.lerp(78, 72, THREE.MathUtils.clamp((aspect - 0.9) / 1.2, 0, 1)));
const BOOK_NAMES = ['A', 'B', 'C', 'D'];
const T = 'T'; // the thermometer, chosen like an arrow
const LIFT = 5; // mm a piece is raised while it is carried
const PAIRS = [
  ['A', 'B'],
  ['A', 'C'],
  ['C', 'D'],
];
// where an arrow's name may go: along it (k), on its left or right (side), how far out (off); first ones first
const LABEL_SPOTS = [0.5, 0.32, 0.68]
  .flatMap((k) => [1, -1].map((side) => ({ k, side, off: 1.05 })))
  .concat([
    { k: 0.5, side: 1, off: 1.65 },
    { k: 0.5, side: -1, off: 1.65 },
  ]);
const OK = ICONS.check.replace('<svg ', '<svg class="sv-ok" ');
const NO = ICONS.close.replace('<svg ', '<svg class="sv-no" ');

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const V = (name) => `<b class="sv-v">${name}</b>`; // a vector's name, bold as the book prints it
  const marks = (html) => html.replaceAll('{ok}', OK).replaceAll('{no}', NO);
  /** A দিক in words (the eight compass directions), or in degrees from পূর্ব in between. */
  const dirText = (angle) => {
    const c = compass(angle);
    return c ? t(`dir_${c}`) : t('deg', { d: angle });
  };

  root.classList.add('pvc', 'sv');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const pairButton = ([a, b]) => `<button class="pvc-btn" data-pair="${a},${b}">${t('pair', { a: V(a), b: V(b) })}</button>`;
  const ui = buildStudentShell(root, t, {
    learn: `
          <div class="pvc-learn-main sv-main">
            <span class="sv-name"><b class="sv-v">A</b><small>${t('vector')}</small></span>
            <div class="pvc-sum sv-sum">
              <span class="pvc-t mag"><b>0</b><small>${t('mag')}</small></span>
              <span class="pvc-t dir"><b>0</b><small>${t('dir')}</small></span>
            </div>
          </div>
          <div class="sv-kinds"><span>${t('kind_scalar', { temp: TEMPERATURE })}</span><span>${t('kind_vector')}</span></div>
          <p class="pvc-learn-extra sv-extra" aria-live="polite"></p>
          <div class="pvc-learn-foot sv-foot">
            <span class="sv-foot-k">${t('compare_k')}</span>
            <div class="sv-acts">
              ${PAIRS.map(pairButton).join('')}
              <button class="pvc-btn sv-home" data-act="home" title="${t('act_home')}" aria-label="${t('act_home')}">${ICONS.reset}</button>
            </div>
          </div>`,
  });

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 5, far: 5000, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.minDistance = 120;
  controls.maxDistance = 1200;
  controls.maxPolarAngle = THREE.MathUtils.degToRad(80);
  const M = createMaterials(stage.renderer);
  const world = new THREE.Group();
  world.name = 'ScalarVectorScene';
  scene.add(world);
  const board = createBoard({ materials: M, t });
  world.add(board.root);
  const arrows = {};
  for (const name of NAMES) {
    const a = createArrow(name);
    arrows[name] = a;
    world.add(a.root);
  }
  const thermo = createThermometer({ num: N, label: t('temp_value', { v: TEMPERATURE }) });
  world.add(thermo.root);
  const angleMark = createAngleMark();
  const angleMark2 = createAngleMark({ radius: 19, faint: true }); // the other arrow of a lined-up pair, outside the first arc
  angleMark2.setVisible(false);
  const ring = createRing();
  const dockMark = createDockMark();
  const ghost = createGhost();
  const places = createPlaces();
  places.setHouse(null);
  places.setFlag(null);
  ring.setVisible(false);
  world.add(angleMark.root, angleMark2.root, ring.root, dockMark.root, ghost.root, places.root);
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    // low enough from the side that a flat arrow piece throws a shadow (a carried one, a clearly lifted one)
    const sun = new THREE.DirectionalLight(0xffffff, 0.45);
    sun.position.set(-220, 330, 260);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 110, bottom: -110, near: 250, far: 750 });
    sun.shadow.radius = 5;
    sun.shadow.bias = -0.0004;
    const table = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.ShadowMaterial({ opacity: 0.1 }));
    table.rotation.x = -Math.PI / 2;
    table.position.y = -BOARD_SIZE.h;
    table.receiveShadow = true;
    scene.add(sun, sun.target, table);
    board.root.traverse((m) => m instanceof THREE.Mesh && m.name === 'DrawingBoard' && (m.castShadow = true));
    places.root.traverse((m) => m instanceof THREE.Mesh && (m.castShadow = true));
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const clone = (v) => ({ tail: [v.tail[0], v.tail[1]], length: v.length, angle: v.angle });
  const s = {
    vec: Object.fromEntries(BOOK_NAMES.map((n) => [n, clone(BOOK[n])])), // name → { tail, length, angle }
    shown: [...BOOK_NAMES],
    thermo: { at: [...THERMO.at], angle: THERMO.angle },
    thermoShown: true,
    selected: 'A', // an arrow's name, or T for the thermometer
    pair: null, // { a, b }: b lies on a's tail, the two are compared
    from: null, // where b was before it was lined up (drawn faintly, with the path it slid along)
    base: null, // { name, v }: an arrow as it was before the student began to turn or stretch it
    note: null, // { key, vars }: what the last action showed
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    drag: null,
    headHinted: false,
    userMovedCamera: false,
  };

  /** Draw an arrow where its vector says (or as given while it is animated or carried). */
  function draw(name, v = s.vec[name], lift = 0) {
    arrows[name].set(v);
    arrows[name].setLift(lift);
  }
  function showOnly(names, { thermometer = false } = {}) {
    s.shown = [...names];
    for (const n of NAMES) arrows[n].setVisible(names.includes(n));
    s.thermoShown = thermometer;
    thermo.setVisible(thermometer);
  }

  /** Free room (squares) round a paper point: away from the edge, the pieces as they are drawn and the faint copy. */
  function room(p, { skip = null } = {}) {
    let r = Math.min(p[0], p[1], PAPER.w - p[0], PAPER.h - p[1]) + 0.4;
    for (const m of s.shown) {
      if (m === skip) continue;
      const st = arrows[m].state;
      r = Math.min(r, segmentDistance(p, p, st.tail, headOf(st)));
    }
    if (s.thermoShown && skip !== T) {
      const [e1, e2] = thermoEnds(thermo.state);
      r = Math.min(r, segmentDistance(p, p, e1, e2) - 0.15);
    }
    const pair = livePair();
    if (pair && s.from) {
      const to = s.vec[pair.b].tail;
      const len = Math.hypot(to[0] - s.from.tail[0], to[1] - s.from.tail[1]) || 1;
      const stop = Math.max(0, len - 2.2) / len; // the dotted path stops short of the new tail
      const end = [s.from.tail[0] + (to[0] - s.from.tail[0]) * stop, s.from.tail[1] + (to[1] - s.from.tail[1]) * stop];
      r = Math.min(r, segmentDistance(p, p, s.from.tail, headOf(s.from)), segmentDistance(p, p, s.from.tail, end) - 0.1);
    }
    return Math.min(r, Math.hypot(p[0] - ROSE.x, p[1] - ROSE.y) - ROSE.r + 0.2);
  }
  /** Each name where it has most room: off the arrows, the thermometer, the angles, the rose and the edge. */
  function placeLabels() {
    const order = [...s.shown].sort((x, y) => (x === s.pair?.b) - (y === s.pair?.b));
    const placed = [angleMark.textAt(), angleMark2.textAt()].filter(Boolean);
    const score = (p, skip, pref) => {
      let r = room(p, { skip });
      for (const q of placed) r = Math.min(r, Math.hypot(p[0] - q[0], p[1] - q[1]) - 0.6);
      return r - pref;
    };
    for (const n of order) {
      let best = null;
      LABEL_SPOTS.forEach((sp, i) => {
        const p = arrows[n].labelAt(sp);
        const sc = score(p, null, i * 0.04);
        if (!best || sc > best.sc + 0.02) best = { sc, sp, p };
      });
      arrows[n].setLabelSpot(best.sp);
      placed.push(best.p);
    }
    if (s.thermoShown) {
      const [p1, p2] = [thermo.labelAt(1), thermo.labelAt(-1)];
      thermo.setLabelSide(score(p1, T, 0) >= score(p2, T, 0.05) ? 1 : -1);
    }
  }
  /** How far a point is from the dashed line to পূর্ব drawn at a tail (an angle written on it would be misread). */
  const offEast = (p, tail) => segmentDistance(p, p, tail, [tail[0] + 2, tail[1]]) - 0.05;
  /** The দিক of an arrow drawn at its tail: the arc from পূর্ব and the angle, where it can be read. */
  function markAngle(name, v = s.vec[name]) {
    angleMark.set(v.tail, v.angle, N(t('deg', { d: v.angle })), (p) => Math.min(room(p), offEast(p, v.tail)));
  }

  /** The pair, if b still lies on a's tail. */
  function livePair() {
    const p = s.pair;
    if (!p || !s.shown.includes(p.a) || !s.shown.includes(p.b)) return null;
    const ta = s.vec[p.a].tail;
    const tb = s.vec[p.b].tail;
    return Math.hypot(ta[0] - tb[0], ta[1] - tb[1]) < 1e-6 ? p : null;
  }

  function snapshot() {
    const arrowsState = {};
    for (const n of s.shown) {
      const v = s.vec[n];
      arrowsState[n] = { tail: [...v.tail], length: v.length, angle: v.angle, head: headOf(v) };
    }
    const p = livePair();
    const c = p ? compare(s.vec[p.a], s.vec[p.b]) : null;
    return {
      arrows: arrowsState,
      thermometer: s.thermoShown ? { at: [...s.thermo.at], angle: s.thermo.angle, temperature: TEMPERATURE } : null,
      selected: s.selected,
      compare: p ? { a: p.a, b: p.b, sameMagnitude: c.sameMagnitude, sameDirection: c.sameDirection, equal: c.equal } : null,
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.arrows, snap.thermometer, snap.selected, snap.compare]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    chip: $('.sv-name'),
    name: $('.sv-name .sv-v'),
    kind: $('.sv-name small'),
    mag: $('.pvc-t.mag b'),
    dirTerm: $('.pvc-t.dir'),
    dir: $('.pvc-t.dir b'),
    dirLabel: $('.pvc-t.dir small'),
    extra: $('.sv-extra'),
  };

  function verdict(p) {
    const a = s.vec[p.a];
    const b = s.vec[p.b];
    const c = compare(a, b);
    if (c.equal) {
      const [x, y] = [p.a, p.b].sort(); // the book: "A ও B ভেক্টর হুবহু এক"
      return marks(t('cmp_equal', { a: V(x), b: V(y) }));
    }
    const vars = { a: V(p.a), b: V(p.b), ma: a.length, mb: b.length, da: dirText(a.angle), db: dirText(b.angle) };
    return marks(t(c.sameMagnitude ? 'cmp_dir' : c.sameDirection ? 'cmp_mag' : 'cmp_both', vars));
  }

  function refresh() {
    const name = s.selected;
    const quiz = s.mode === 'quiz';
    const scalar = name === T;
    el.chip.classList.toggle('is-scalar', scalar);
    el.dirTerm.classList.toggle('none', scalar);
    if (scalar) {
      // a temperature: a মান, and no দিক at all
      el.name.textContent = t('temperature');
      el.kind.textContent = t('scalar');
      el.mag.textContent = t('temp_value', { v: TEMPERATURE });
      el.dir.textContent = t('dir_none');
      el.dirLabel.textContent = t('dir');
    } else {
      const v = s.vec[name];
      const named = compass(v.angle);
      el.name.textContent = name;
      el.kind.textContent = t('vector');
      el.mag.innerHTML = `${N(v.length)} <span class="u">${t('unit')}</span>`;
      el.dir.textContent = dirText(v.angle);
      el.dirLabel.textContent = named ? t('dir_sub_named', { d: v.angle }) : t('dir_sub');
    }
    const p = livePair();
    let extra = t('idea');
    if (s.drag?.part === 'head' && s.drag.moved) extra = t('turning');
    else if (s.note) extra = t(s.note.key, s.note.vars);
    else if (p) extra = verdict(p);
    el.extra.innerHTML = extra;
    for (const b of ui.$$('[data-pair]')) {
      const [a, c] = b.dataset.pair.split(',');
      b.classList.toggle('on', Boolean(p && p.a === a && p.b === c));
    }
    // on the paper: the chosen piece is highlighted; an arrow's দিক is drawn from পূর্ব (both, for a pair)
    for (const n of NAMES) arrows[n].setSelected(!quiz && n === name && s.shown.includes(n));
    thermo.setSelected(!quiz && scalar && s.thermoShown);
    if (!quiz) {
      angleMark.setVisible(!scalar && s.shown.includes(name));
      if (!scalar) markAngle(name);
      const other = p && !scalar && p.b === name ? p.a : null;
      const show2 = Boolean(other) && !sameDirection(s.vec[other], s.vec[name]);
      angleMark2.setVisible(show2);
      if (show2) {
        const first = angleMark.textAt();
        const room2 = (q) => Math.min(room(q), offEast(q, s.vec[other].tail), first ? Math.hypot(q[0] - first[0], q[1] - first[1]) - 0.75 : 9);
        angleMark2.set(s.vec[other].tail, s.vec[other].angle, N(t('deg', { d: s.vec[other].angle })), room2);
      }
    }
    placeLabels();
    ghost.show(p && s.from ? s.from : null, p ? s.vec[p.b].tail : null);
    stage.invalidate();
  }

  function select(name, { silent = false } = {}) {
    if (name === T ? !s.thermoShown : !s.shown.includes(name)) return;
    if (s.selected === name) return;
    s.selected = name;
    if (!silent) emit('select', { name });
    refresh();
  }

  // ── moving, turning, comparing ──────────────────────────────────────────────
  /** Animate an arrow from where it is drawn to the vector v (carried a little above the paper). */
  function animateTo(name, v, { duration = 0.6, lift = 10 } = {}) {
    const from = clone(arrows[name].state);
    const lift0 = arrows[name].state.lift;
    const turn = ((((v.angle - from.angle) % 360) + 540) % 360) - 180; // the shorter way round
    const far = Math.hypot(v.tail[0] - from.tail[0], v.tail[1] - from.tail[1]) > 0.01;
    return tweener.animate({
      key: `arrow:${name}`,
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        draw(
          name,
          {
            tail: [from.tail[0] + (v.tail[0] - from.tail[0]) * k, from.tail[1] + (v.tail[1] - from.tail[1]) * k],
            length: from.length + (v.length - from.length) * k,
            angle: norm360(from.angle + turn * k),
          },
          lift0 * (1 - k) + (far ? Math.sin(Math.PI * k) * lift : 0),
        );
        if (name === s.selected && s.mode !== 'quiz') markAngle(name, { ...arrows[name].state, angle: v.angle });
        stage.invalidate();
      },
      onComplete: () => {
        draw(name, v);
        refresh();
      },
    }).finished;
  }
  function put(name, v, { animate = true } = {}) {
    s.vec[name] = clone(v);
    if (animate) return animateTo(name, s.vec[name]);
    tweener.cancel(`arrow:${name}`);
    draw(name);
    return Promise.resolve(true);
  }
  /** The other things on the paper as segments, for keeping a lined-up pair clear of them. */
  function obstacles(except) {
    const list = s.shown.filter((n) => !except.includes(n)).map((n) => [s.vec[n].tail, headOf(s.vec[n])]);
    if (s.thermoShown) list.push(thermoEnds(s.thermo));
    return list;
  }

  /** Line b up on a's tail (a moves too if b would not fit on the paper there) and compare them. */
  async function lineUp(a, b, { animate = true } = {}) {
    if (a === b || !s.shown.includes(a) || !s.shown.includes(b)) return;
    const tail = commonTail(s.vec[a], s.vec[b], { avoid: obstacles([a, b]) });
    const from = clone(s.vec[b]);
    s.from = Math.hypot(from.tail[0] - tail[0], from.tail[1] - tail[1]) > 1e-6 ? from : null;
    const moves = [];
    // any other arrow lying on that tail goes back to its place in the book
    for (const n of s.shown)
      if (n !== a && n !== b && BOOK[n] && Math.hypot(s.vec[n].tail[0] - tail[0], s.vec[n].tail[1] - tail[1]) < 1e-6)
        moves.push(put(n, BOOK[n], { animate }));
    if (Math.hypot(s.vec[a].tail[0] - tail[0], s.vec[a].tail[1] - tail[1]) > 1e-6) moves.push(put(a, { ...s.vec[a], tail }, { animate }));
    moves.push(put(b, { ...s.vec[b], tail }, { animate }));
    s.pair = { a, b };
    s.note = null;
    s.base = null;
    s.selected = b;
    refresh();
    if (animate) await Promise.all(moves);
    announcePair();
  }
  let matchTimer = 0;
  function announcePair() {
    const p = livePair();
    refresh();
    emitChange();
    if (!p) return;
    const c = compare(s.vec[p.a], s.vec[p.b]);
    emit('compare', { a: p.a, b: p.b, ...c });
    if (s.mode !== 'explore') return; // the test makes its own sounds
    if (c.equal) {
      // a short green moment as the two match exactly
      audio.success();
      clearTimeout(matchTimer);
      arrows[p.b].setMatch(true);
      stage.invalidate();
      matchTimer = setTimeout(() => {
        arrows[p.b].setMatch(false);
        stage.invalidate();
      }, 1400);
    } else audio.pop();
  }

  async function home({ animate = true } = {}) {
    s.pair = null;
    s.from = null;
    s.note = null;
    s.base = null;
    s.thermo = { at: [...THERMO.at], angle: THERMO.angle };
    thermo.set({ ...s.thermo, lift: 0 });
    await Promise.all(BOOK_NAMES.map((n) => put(n, BOOK[n], { animate })));
    refresh();
    emitChange();
  }

  /** What changed about an arrow since the student began to turn or stretch it, for the panel. */
  function changeNote(name) {
    const b = s.base?.name === name ? s.base.v : null;
    if (!b) return null;
    const v = s.vec[name];
    const dm = b.length !== v.length;
    const dd = !sameDirection(b, v);
    const n = V(name);
    if (dm && dd) return { key: 'note_both', vars: { n, ma: b.length, mb: v.length, da: dirText(b.angle), db: dirText(v.angle) } };
    if (dm) return { key: 'note_mag', vars: { n, a: b.length, b: v.length } };
    if (dd) return { key: 'note_dir', vars: { n, a: dirText(b.angle), b: dirText(v.angle) } };
    return { key: 'note_back', vars: { n } };
  }

  /** A new মান or দিক for an arrow, from the head being dragged or the keys; the arrow stays on the paper. */
  function reshape(name, { length, angle }) {
    const v = s.vec[name];
    const a = angle == null ? v.angle : norm360(angle);
    let len = Math.min(LEN_MAX, Math.max(LEN_MIN, Math.round(length ?? v.length)));
    len = Math.min(len, maxLengthFrom(v.tail, a));
    if (len === v.length && a === v.angle) return false;
    if (s.base?.name !== name) s.base = { name, v: clone(v) };
    s.vec[name] = { tail: fitOnPaper(v.tail, len, a), length: len, angle: a };
    // in a lined-up pair the verdict says it (live); otherwise say what changed
    s.note = livePair()?.b === name || livePair()?.a === name ? null : changeNote(name);
    draw(name, s.vec[name], s.drag?.name === name ? 2 : 0);
    audio.tick();
    refresh();
    emitChange();
    return true;
  }

  /** Move an arrow by whole squares (the keys); it sits on another arrow's tail if it lands there. */
  function nudge(name, dx, dy) {
    const v = s.vec[name];
    const raw = fitOnPaper([v.tail[0] + dx, v.tail[1] + dy], v.length, v.angle);
    const others = s.shown.filter((n) => n !== name).map((n) => ({ name: n, tail: s.vec[n].tail }));
    const land = landing(raw, v, others, { dock: 0.01 });
    s.vec[name] = { ...v, tail: land.tail };
    draw(name);
    settled(name, land.dockedOn);
  }
  /** After a move: a pair if it sits on another tail, otherwise "the vector did not change". */
  function settled(name, dockedOn) {
    s.base = null;
    if (dockedOn) {
      s.pair = { a: dockedOn, b: name };
      s.from = null;
      s.note = null;
      announcePair();
    } else {
      if (s.pair && (s.pair.a === name || s.pair.b === name)) s.pair = null;
      s.note = { key: 'moved' };
      audio.tick();
      refresh();
      emitChange();
    }
  }

  // ── the thermometer: move it, turn it; the temperature stays the same ───────
  function thermoNote() {
    s.note = { key: 'thermo_note', vars: { temp: TEMPERATURE } };
  }
  function turnThermo(by = ANGLE_STEP, { animate = true } = {}) {
    const from = { ...s.thermo };
    const angle = norm360(from.angle + by);
    s.thermo = { at: fitThermo(from.at, angle), angle };
    thermoNote();
    audio.tick();
    if (!animate) {
      thermo.set({ ...s.thermo, lift: 0 });
      refresh();
      emitChange();
      return;
    }
    tweener.animate({
      key: 'thermo',
      duration: 0.35,
      onUpdate: (k) => {
        thermo.set({
          at: [from.at[0] + (s.thermo.at[0] - from.at[0]) * k, from.at[1] + (s.thermo.at[1] - from.at[1]) * k],
          angle: from.angle + by * k,
          lift: Math.sin(Math.PI * k) * 3,
        });
        stage.invalidate();
      },
      onComplete: () => {
        thermo.set({ ...s.thermo, lift: 0 });
        refresh();
      },
    });
    refresh();
    emitChange();
  }
  function moveThermo(at) {
    s.thermo = { at: fitThermo(at, s.thermo.angle), angle: s.thermo.angle };
    thermo.set({ ...s.thermo, lift: 0 });
    thermoNote();
    audio.tick();
    refresh();
    emitChange();
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const fitCam = new THREE.PerspectiveCamera();
  const CORNERS = [];
  for (const x of [-1, 1])
    for (const z of [-1, 1]) for (const y of [0, 8]) CORNERS.push(new THREE.Vector3((x * (PAPER_SIZE.w + 4)) / 2, y, (z * (PAPER_SIZE.d + 4)) / 2));
  // the corners of the grid itself: only these must stay clear of the buttons (paper margin and wood may go under)
  const GRID = [];
  for (const x of [-1, 1]) for (const z of [-1, 1]) GRID.push(new THREE.Vector3((x * PAPER.w * UNIT) / 2, 0, (z * PAPER.h * UNIT) / 2));
  const pv = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  /** Fit the paper into the box (NDC) for a view: the camera's target and distance. */
  function fit(dir, box) {
    const target = new THREE.Vector3(0, 0, 0);
    let d = 450;
    for (let i = 0; i < 8; i++) {
      fitCam.position.copy(target).addScaledVector(dir, d);
      fitCam.lookAt(target);
      fitCam.updateMatrixWorld();
      let x0 = Infinity;
      let x1 = -Infinity;
      let y0 = Infinity;
      let y1 = -Infinity;
      for (const c of CORNERS) {
        pv.copy(c).project(fitCam);
        x0 = Math.min(x0, pv.x);
        x1 = Math.max(x1, pv.x);
        y0 = Math.min(y0, pv.y);
        y1 = Math.max(y1, pv.y);
      }
      const halfH = Math.tan(THREE.MathUtils.degToRad(fitCam.fov / 2)) * d;
      right.setFromMatrixColumn(fitCam.matrixWorld, 0);
      up.setFromMatrixColumn(fitCam.matrixWorld, 1);
      target
        .addScaledVector(right, ((x0 + x1) / 2 - (box.left + box.right) / 2) * halfH * fitCam.aspect)
        .addScaledVector(up, ((y0 + y1) / 2 - (box.bottom + box.top) / 2) * halfH);
      d *= Math.max((x1 - x0) / (box.right - box.left), (y1 - y0) / (box.top - box.bottom));
    }
    return { target, d };
  }
  /** The camera for a view: the whole paper in the frame at any aspect, its grid clear of the corner buttons. */
  function viewPose(view) {
    fitCam.fov = camera.fov;
    fitCam.aspect = camera.aspect;
    fitCam.updateProjectionMatrix();
    const dir = viewDir(view, camera.aspect);
    const box = { left: -0.97, right: 0.97, bottom: -0.96, top: 0.96 };
    let pose = fit(dir, box);
    const btnLeft = 1 - (2 * (ui.corner.offsetWidth + 12)) / stage.width;
    const btnBottom = 1 - (2 * (ui.corner.offsetHeight + 12)) / stage.height;
    for (let k = 0; k < 6; k++) {
      fitCam.position.copy(pose.target).addScaledVector(dir, pose.d);
      fitCam.lookAt(pose.target);
      fitCam.updateMatrixWorld();
      const under = GRID.some((c) => {
        pv.copy(c).project(fitCam);
        return pv.x > btnLeft && pv.y > btnBottom;
      });
      if (!under) break;
      box.top -= (box.top - btnBottom) / 2 + 0.01; // lower the top a little at a time, only as far as needed
      pose = fit(dir, box);
    }
    return { target: pose.target, position: pose.target.clone().addScaledVector(dir, pose.d) };
  }
  function flyTo({ position, target }, duration = 0.8) {
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
    controls.enableRotate = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(viewPose(s.view), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    if (s.userMovedCamera) return;
    tweener.cancel('camera');
    flyTo(viewPose(s.view), 0);
  });

  // ── dragging: an arrow's body moves it, its head turns and stretches it; the thermometer moves and turns ─
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const paperPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -PAPER_TOP);
  const hitPoint = new THREE.Vector3();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function ray(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  }
  /** The piece under a canvas point: { name, part: 'body' | 'head' | 'thermo' }, a head first, or null. */
  function pick(p) {
    ray(p);
    const targets = s.shown.flatMap((n) => arrows[n].hits);
    if (s.thermoShown) targets.push(...thermo.hits);
    const hits = raycaster.intersectObjects(targets, false);
    if (!hits.length) return null;
    // a head wins over a body it overlaps; of two arrows on the same tail, the one carried last is on top
    const head = hits.find((h) => h.object.userData.part === 'head');
    const best = head || hits.find((h) => h.object.userData.arrow === s.pair?.b) || hits[0];
    if (best.object.userData.thermo) return { name: T, part: 'thermo' };
    return { name: best.object.userData.arrow, part: best.object.userData.part };
  }
  // fingers are wide: a touch just beside an arrow still takes it
  function pickNear(p, touch) {
    const direct = pick(p);
    if (direct || !touch) return direct;
    for (const r of [9, 18]) {
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const found = pick({ x: p.x + r * Math.cos(a), y: p.y + r * Math.sin(a) });
        if (found) return found;
      }
    }
    return null;
  }
  /** Where a canvas point falls on the paper, in squares. */
  function paperAt(p) {
    ray(p);
    return raycaster.ray.intersectPlane(paperPlane, hitPoint) ? toPaper(hitPoint) : null;
  }

  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      root.focus({ preventScroll: true });
      coach?.interrupt();
      if (s.drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const p = canvasPoint(e);
      const hit = pickNear(p, e.pointerType !== 'mouse');
      if (!hit) return; // the camera controls take it
      e.stopPropagation(); // a drag on a piece is not a camera move
      e.preventDefault();
      if (s.locked) return lockedNudge();
      const at = paperAt(p);
      if (!at) return;
      const drag = { id: e.pointerId, name: hit.name, part: hit.part, from: at, raw: null, x: e.clientX, y: e.clientY, moved: false };
      if (hit.name === T) {
        tweener.cancel('thermo');
        drag.start = [...s.thermo.at];
      } else {
        tweener.cancel(`arrow:${hit.name}`);
        draw(hit.name);
        const v = s.vec[hit.name];
        const tip = headOf(v);
        drag.tail = [...v.tail];
        drag.grab = [tip[0] - at[0], tip[1] - at[1]]; // a head follows the finger from where it was taken: nothing jumps
      }
      select(hit.name);
      s.drag = drag;
      try {
        ui.canvasHost.setPointerCapture(e.pointerId); // the drag goes on when the finger leaves the view
      } catch {}
      ui.canvasHost.style.cursor = 'grabbing';
      hideHint();
      emit('dragstart', { name: hit.name, part: hit.part });
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    const d = s.drag;
    if (!d || e.pointerId !== d.id) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 4) return;
    const at = paperAt(canvasPoint(e));
    if (!at) return;
    if (!d.moved) {
      d.moved = true;
      if (d.name !== T) coach?.objectUsed();
      if (d.part === 'head') {
        ring.setVisible(true);
        refresh();
      }
    }
    if (d.part === 'thermo') {
      d.raw = fitThermo([d.start[0] + at[0] - d.from[0], d.start[1] + at[1] - d.from[1]], s.thermo.angle);
      thermo.set({ at: d.raw, angle: s.thermo.angle, lift: LIFT });
      placeLabels();
      stage.invalidate();
      return;
    }
    const v = s.vec[d.name];
    if (d.part === 'head') {
      reshape(d.name, snapPolar(at[0] + d.grab[0] - v.tail[0], at[1] + d.grab[1] - v.tail[1]));
      ring.set(s.vec[d.name].tail, s.vec[d.name].length);
      stage.invalidate();
      return;
    }
    // the body: the arrow follows the finger, lifted, and stays on the paper
    const raw = fitOnPaper([d.tail[0] + at[0] - d.from[0], d.tail[1] + at[1] - d.from[1]], v.length, v.angle);
    d.raw = raw;
    draw(d.name, { ...v, tail: raw }, LIFT);
    markAngle(d.name, { ...v, tail: raw });
    placeLabels();
    const others = s.shown.filter((n) => n !== d.name).map((n) => ({ name: n, tail: s.vec[n].tail }));
    const land = landing(raw, v, others);
    dockMark.show(land.dockedOn ? land.tail : null);
    if (land.dockedOn) showHint(t('hint_dock', { a: land.dockedOn, b: d.name }), { duration: 0 });
    else hideHint();
    stage.invalidate();
  });
  function endDrag(e) {
    const d = s.drag;
    if (!d || e.pointerId !== d.id) return;
    s.drag = null;
    ui.canvasHost.style.cursor = '';
    dockMark.show(null);
    ring.setVisible(false);
    hideHint();
    if (d.part === 'thermo') {
      // a tap turns it, a drag moves it: either way the temperature is the same
      if (d.moved && d.raw) moveThermo([Math.round(d.raw[0] * 2) / 2, Math.round(d.raw[1] * 2) / 2]);
      else turnThermo();
    } else if (d.part === 'body' && d.moved && d.raw) {
      const v = s.vec[d.name];
      const others = s.shown.filter((n) => n !== d.name).map((n) => ({ name: n, tail: s.vec[n].tail }));
      const land = landing(d.raw, v, others);
      if (land.dockedOn) lineUp(land.dockedOn, d.name);
      else {
        put(d.name, { ...v, tail: land.tail }, { animate: false });
        // settle onto the grid from where it was let go
        arrows[d.name].set({ tail: d.raw });
        animateTo(d.name, s.vec[d.name], { duration: 0.18, lift: 0 });
        settled(d.name, null);
      }
      if (!s.headHinted) {
        s.headHinted = true;
        setTimeout(() => s.mode === 'explore' && !s.drag && showHint(t('hint_head'), { duration: 4200 }), 900);
      }
    } else if (d.name !== T) {
      draw(d.name);
      if (d.part === 'head' && d.moved) {
        s.headHinted = true;
        announcePair(); // the note of what changed (or the pair's verdict) stays in the panel
      }
    }
    if (d.name !== T) coach?.objectReleased();
    refresh();
    emit('dragend', { name: d.name, part: d.part });
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (s.drag || e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
      const hit = pick(p);
      ui.canvasHost.style.cursor = hit ? (s.locked ? 'not-allowed' : hit.part === 'head' ? 'crosshair' : 'grab') : '';
    });
  });

  function lockedNudge() {
    showHint(t('q_locked'), { duration: 3000 });
    audio.error();
  }

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
  const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  /** Tails for the arrows of a question, laid well apart on the paper (room for their names between them). */
  function spread(vectors) {
    for (const gap of [1.7, 1.5, 1.3])
      for (let k = 0; k < 20; k++) {
        const tails = placeApart(vectors, Math.random, { gap });
        if (tails) return vectors.map((v, i) => ({ ...v, tail: tails[i] }));
      }
    return vectors.map((v) => ({ ...v, tail: fitOnPaper([PAPER.w / 2, PAPER.h / 2], v.length, v.angle) }));
  }
  const txt = (html) => `<span class="sv-o">${html}</span>`;
  const SCALARS = ['qn_temp', 'qn_time', 'qn_length', 'qn_mass'];
  const VECTORS = ['qn_pos', 'qn_vel', 'qn_force'];
  let kinds = [];
  let question = null;
  let saved = null; // the student's arrows and thermometer, put back after the test
  let schoolLabel = null;
  let houseLabel = null;
  let scaleLabel = null;

  function clearScene() {
    for (const n of NAMES) {
      tweener.cancel(`arrow:${n}`);
      arrows[n].setLabelVisible(true);
    }
    s.pair = null;
    s.from = null;
    s.note = null;
    ring.setVisible(false);
    angleMark.setVisible(false);
    angleMark2.setVisible(false);
    places.setHouse(null);
    places.setFlag(null);
    for (const l of [schoolLabel, houseLabel, scaleLabel]) if (l) l.visible = false;
  }
  /** Show these vectors (name → vector), and the thermometer if asked, and nothing else. */
  function stageVectors(map, { thermometer = false } = {}) {
    clearScene();
    for (const [n, v] of Object.entries(map)) put(n, v, { animate: false });
    if (thermometer) {
      s.thermo = { at: [...THERMO.at], angle: THERMO.angle };
      thermo.set({ ...s.thermo, lift: 0 });
    }
    showOnly(Object.keys(map), { thermometer });
    refresh();
  }
  function flatLabel(text, color, size) {
    const m = textMesh(text, size, { color, weight: 700 });
    m.rotation.x = -Math.PI / 2;
    m.userData.noExport = true;
    world.add(m);
    return m;
  }
  /** Of some candidate spots (paper coordinates), the one with most room, given a room function. */
  const roomiest = (spots, roomAt) =>
    spots.reduce((best, p, i) => (roomAt(p) - i * 0.05 > roomAt(best.p) - best.i * 0.05 ? { p, i } : best), { p: spots[0], i: 0 }).p;

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    hooks: {
      enter() {
        s.mode = 'quiz';
        saved = {
          vec: Object.fromEntries(BOOK_NAMES.map((n) => [n, clone(s.vec[n])])),
          thermo: { at: [...s.thermo.at], angle: s.thermo.angle },
          selected: s.selected,
          pair: s.pair,
        };
        s.base = null;
        hideHint();
        kinds = shuffle(['equal', 'why', 'kind', 'need', 'read']);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        clearScene();
        if (saved) {
          for (const n of BOOK_NAMES) put(n, saved.vec[n], { animate: false });
          s.thermo = saved.thermo;
          thermo.set({ ...s.thermo, lift: 0 });
          s.selected = saved.selected;
          s.pair = saved.pair;
        }
        showOnly(BOOK_NAMES, { thermometer: true });
        syncUI();
        refresh();
        emitChange();
      },
      prepare(i, _alive, say) {
        const kind = kinds[i % kinds.length];
        s.locked = true;
        if (kind === 'equal') {
          // A, and one arrow equal to it among three that are not: turned, longer or shorter, reversed
          const len = randInt(3, 5);
          const ang = randInt(0, 7) * 45;
          const others = shuffle([
            { role: 'same', length: len, angle: ang },
            { role: 'turned', length: len, angle: norm360(ang + pickOne([45, -45, 90, -90])) },
            { role: 'size', length: len + pickOne([-2, -1, 1, 2]), angle: ang },
            { role: 'reversed', length: len, angle: norm360(ang + 180) },
          ]);
          const placed = spread([{ length: len, angle: ang }, ...others]);
          const map = { A: placed[0] };
          const names = ['B', 'C', 'D', 'E'];
          names.forEach((n, k) => (map[n] = placed[k + 1]));
          stageVectors(map);
          const right = others.findIndex((x) => x.role === 'same');
          question = { kind, x: names[right] };
          say(t('q_equal', { a: 'A' }));
          return { choices: [0, 1, 2, 3], expected: right, tolerance: 0.5, label: (j) => V(names[j]), meta: { kind, vectors: snapshot().arrows } };
        }
        if (kind === 'why') {
          const len = randInt(3, 5);
          const ang = randInt(0, 7) * 45;
          const why = pickOne(['dir', 'mag', 'both']);
          const other =
            why === 'dir'
              ? { length: len, angle: norm360(ang + pickOne([45, 90, 135, 180, -45, -90])) }
              : why === 'mag'
                ? { length: len + pickOne([-2, -1, 1, 2]), angle: ang }
                : { length: len + pickOne([-2, -1, 1, 2]), angle: norm360(ang + pickOne([90, -90, 135])) };
          const [A, C] = spread([{ length: len, angle: ang }, other]);
          stageVectors({ A, C });
          const opts = shuffle(['why_dir', 'why_mag', 'why_both', 'why_place']);
          question = { kind, why, A, C };
          say(t('q_why', { a: 'A', c: 'C' }));
          return {
            choices: [0, 1, 2, 3],
            expected: opts.indexOf(`why_${why}`),
            tolerance: 0.5,
            label: (j) => txt(t(opts[j])),
            meta: { kind, why },
          };
        }
        if (kind === 'kind') {
          // the scene: the thermometer (a scalar) beside an arrow (a vector); for the notation, the arrow alone
          const variant = pickOne(['vec', 'sca', 'notq', 'notation']);
          stageVectors({ A: BOOK.A }, { thermometer: variant !== 'notation' });
          let right;
          let wrong;
          if (variant === 'vec') {
            right = pickOne(VECTORS);
            wrong = shuffle([...SCALARS]).slice(0, 3);
          } else if (variant === 'sca') {
            right = pickOne(SCALARS);
            wrong = [...VECTORS];
          } else if (variant === 'notq') {
            right = pickOne(['qn_joy', 'qn_sorrow']);
            wrong = shuffle([...SCALARS, ...VECTORS]).slice(0, 3);
          } else {
            right = 'nt_arrow';
            wrong = ['nt_bold', 'nt_capital', 'nt_bracket'];
          }
          const opts = shuffle([right, ...wrong]);
          question = { kind, variant, right };
          say(t(`q_${variant}`));
          return { choices: [0, 1, 2, 3], expected: opts.indexOf(right), tolerance: 0.5, label: (j) => txt(t(opts[j])), meta: { kind, variant } };
        }
        if (kind === 'need') {
          // "the school is r km from home": the house in the middle, every place r km away is a ring
          const r = pickOne([3, 4]);
          const at = [6, 5];
          stageVectors({});
          places.setHouse(at);
          ring.set(at, r);
          ring.setVisible(true);
          // the school's direction: one whose place and name keep clear of the compass rose
          const angle = pickOne(
            [0, 45, 90, 135, 180, 225, 270, 315].filter((a) => {
              const h = headOf({ tail: at, length: r, angle: a });
              return Math.hypot(h[0] - ROSE.x, h[1] - ROSE.y) > ROSE.r + 2.2;
            }),
          );
          houseLabel ??= flatLabel(t('house'), COLORS.ink, 4.2);
          houseLabel.visible = true;
          // the name on the far side of the house from where the answer's arrow will go
          const away = headOf({ tail: at, length: 1.2, angle: norm360(angle + 180) });
          toWorld(away[0], away[1], 0.3, houseLabel.position);
          scaleLabel ??= flatLabel(t('scale_km', { one: 1 }), '#4b5766', 3.6);
          scaleLabel.visible = true;
          toWorld(PAPER.w - 1.9, 0.45, 0.3, scaleLabel.position);
          const opts = shuffle(['need_dir', 'need_time', 'need_exact', 'need_unit']);
          question = { kind, r, at, angle, away };
          stage.invalidate();
          say(t('q_need', { r }));
          const vars = { dir: t(`dir_${compass(angle)}`), h: 1, r: r.toFixed(2), m: r * 1000 };
          return {
            choices: [0, 1, 2, 3],
            expected: opts.indexOf('need_dir'),
            tolerance: 0.5,
            label: (j) => txt(t(opts[j], vars)),
            meta: { kind, km: r },
          };
        }
        // read the arrow: its মান (count the parts) and its দিক (by the compass rose)
        const v = { length: randInt(2, 6), angle: randInt(0, 7) * 45 };
        const [A] = spread([v]);
        stageVectors({ A });
        const list = shuffle([v, ...readingMistakes(v)]);
        question = { kind, A };
        say(t('q_read'));
        return {
          choices: [0, 1, 2, 3],
          expected: list.findIndex((c) => c.length === v.length && c.angle === v.angle),
          tolerance: 0.5,
          label: (j) => txt(t('read_opt', { n: list[j].length, dir: t(`dir_${compass(list[j].angle)}`) })),
          meta: { kind, length: v.length, angle: v.angle },
        };
      },
      reveal() {
        const q = question;
        if (q.kind === 'equal') {
          lineUp('A', q.x);
          return t('equal_work', { x: V(q.x), a: V('A') });
        }
        if (q.kind === 'why') {
          const { A, C } = q;
          lineUp('A', 'C');
          const vars = { l: A.length, d: dirText(A.angle), la: A.length, lc: C.length, da: dirText(A.angle), dc: dirText(C.angle) };
          return t(`why_work_${q.why}`, vars);
        }
        if (q.kind === 'kind') {
          const key = { vec: 'vec_work', sca: 'sca_work', notq: 'notq_work', notation: 'notation_work' }[q.variant];
          return t(key, { q: t(q.right), va: '<span class="sv-arrowed">A</span>', vb: V('A') });
        }
        if (q.kind === 'need') {
          const head = headOf({ tail: q.at, length: q.r, angle: q.angle });
          const v = { tail: q.at, length: q.r, angle: q.angle };
          put('A', { tail: q.at, length: 1, angle: q.angle }, { animate: false });
          showOnly(['A']);
          arrows.A.setLabelVisible(false);
          s.vec.A = v;
          animateTo('A', v, { duration: 0.7, lift: 0 });
          places.setFlag(head);
          schoolLabel ??= flatLabel(t('school'), COLORS.ink, 4.2);
          schoolLabel.visible = true;
          // the school's name next to the flag where there is room: off the arrow, the rose, the edge
          const out = (k, side) => {
            const a = ((q.angle + side * 90) * Math.PI) / 180;
            const b = headOf({ tail: q.at, length: q.r + k, angle: q.angle });
            return side ? [b[0] + Math.cos(a) * 1.1, b[1] + Math.sin(a) * 1.1] : b;
          };
          const at = roomiest([out(1.1, 0), out(0, 1), out(0, -1), out(0.6, 1), out(0.6, -1)], (p) =>
            Math.min(
              p[0] - 0.6,
              p[1] - 0.4,
              PAPER.w - 0.6 - p[0],
              PAPER.h - 0.4 - p[1],
              Math.hypot(p[0] - ROSE.x, p[1] - ROSE.y) - ROSE.r - 0.5,
              segmentDistance(p, p, q.at, head),
              Math.hypot(p[0] - q.away[0], p[1] - q.away[1]) - 1,
            ),
          );
          toWorld(at[0], at[1], 0.3, schoolLabel.position);
          stage.invalidate();
          return t('need_work', { r: q.r, dir: t(`dir_${compass(q.angle)}`) });
        }
        const v = q.A;
        markAngle('A', v);
        angleMark.setVisible(true);
        stage.invalidate();
        return t('read_work', { n: v.length, dir: t(`dir_${compass(v.angle)}`) });
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── first-use pointer: on arrow B, which the student can carry onto A ───────
  let coach = null;
  if (o.coach) {
    const v = new THREE.Vector3();
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint],
      object: {
        label: 'coach_drag',
        candidates: () =>
          [0.4, 0.3, 0.55].map((k) => {
            arrows.B.pointAt(k, v).project(camera);
            return { x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height };
          }),
        grabbable: (p) => {
          const hit = pick(p);
          return hit?.name === 'B' && hit.part === 'body';
        },
        // B slides a little towards A's tail and back, as if it wants to be compared
        async demo(alive) {
          const b = s.vec.B;
          const a = s.vec.A;
          const len = Math.hypot(a.tail[0] - b.tail[0], a.tail[1] - b.tail[1]) || 1;
          const to = { ...b, tail: [b.tail[0] + ((a.tail[0] - b.tail[0]) / len) * 0.9, b.tail[1] + ((a.tail[1] - b.tail[1]) / len) * 0.9] };
          for (let i = 0; i < 2 && alive() && !s.drag; i++) {
            if (!(await animateTo('B', to, { duration: 0.55, lift: 3 }))) return;
            if (!alive()) return;
            if (!(await animateTo('B', s.vec.B, { duration: 0.55, lift: 3 }))) return;
          }
        },
        cancel: () => {
          tweener.cancel('arrow:B');
          draw('B');
          stage.invalidate();
        },
      },
    });
  }

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
    coach?.setMode(s.mode);
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.pair && s.mode === 'explore') {
      const [a, c] = b.dataset.pair.split(',');
      coach?.objectUsed();
      lineUp(a, c);
    }
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'home':
        if (s.mode === 'explore') home();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const n = s.selected;
    const explore = s.mode === 'explore' && !s.locked;
    const step = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, 1], arrowdown: [0, -1] }[k];
    if (explore && 'abcd'.includes(k) && k.length === 1) select(k.toUpperCase());
    else if (explore && '1234'.includes(k) && k.length === 1) select(BOOK_NAMES[Number(k) - 1]);
    else if (explore && k === 't') {
      if (s.selected === T) turnThermo();
      else select(T);
    } else if (explore && n === T && step) {
      if (e.shiftKey && step[0]) turnThermo(-step[0] * ANGLE_STEP);
      else moveThermo([s.thermo.at[0] + step[0], s.thermo.at[1] + step[1]]);
    } else if (explore && step && e.shiftKey) {
      if (step[0])
        reshape(n, { angle: s.vec[n].angle - step[0] * ANGLE_STEP }); // ← turns anticlockwise
      else reshape(n, { length: s.vec[n].length + step[1] });
    } else if (explore && step) nudge(n, step[0], step[1]);
    else if (explore && n !== T && (k === '[' || k === ']')) reshape(n, { angle: s.vec[n].angle + (k === '[' ? ANGLE_STEP : -ANGLE_STEP) });
    else if (explore && n !== T && (k === '+' || k === '=' || k === '-')) reshape(n, { length: s.vec[n].length + (k === '-' ? -1 : 1) });
    else if (explore && k === 'h') home();
    else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  for (const n of NAMES) draw(n, s.vec[n] || BOOK.A);
  thermo.set({ ...s.thermo, lift: 0 });
  showOnly(BOOK_NAMES, { thermometer: true });
  if (BOOK_NAMES.includes(String(o.select).toUpperCase())) s.selected = String(o.select).toUpperCase();
  const startPair = String(o.compare || '')
    .toUpperCase()
    .split(',')
    .map((x) => x.trim());
  if (startPair.length === 2 && startPair.every((x) => BOOK_NAMES.includes(x))) lineUp(startPair[0], startPair[1], { animate: false });
  setView(s.view, { animate: false });
  syncUI();
  refresh();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    else coach?.start();
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
     * Change any of: home (true: every piece back to its place), arrows ({ C: { tail: [x, y], length, angle } }:
     * squares, whole units 1–7, degrees from পূর্ব), compare (["A", "B"]: B is lined up on A's tail; false: none),
     * thermometer ({ at: [x, y], angle }), select ("C", or "T" for the thermometer), view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.home) await home({ animate });
      if (p.arrows && s.mode === 'explore') {
        const moves = [];
        for (const [name, q] of Object.entries(p.arrows)) {
          if (!BOOK_NAMES.includes(name) || !q) continue;
          const v = clone(s.vec[name]);
          const length = Math.min(LEN_MAX, Math.max(LEN_MIN, Math.round(Number(q.length ?? v.length))));
          const angle = norm360(Math.round(Number(q.angle ?? v.angle)));
          const tail = fitOnPaper(Array.isArray(q.tail) ? q.tail.map(Number) : v.tail, length, angle);
          moves.push(put(name, { tail, length, angle }, { animate }));
          // the panel says what this did to the vector (moved only, or a new মান or দিক)
          s.base = { name, v };
          s.note = length === v.length && angle === v.angle ? { key: 'moved' } : changeNote(name);
        }
        if (!livePair()) s.pair = null;
        refresh();
        if (animate) await Promise.all(moves);
        emitChange();
      }
      if (p.thermometer && s.thermoShown) {
        const angle = norm360(Number(p.thermometer.angle ?? s.thermo.angle));
        const at = Array.isArray(p.thermometer.at) ? p.thermometer.at.map(Number) : s.thermo.at;
        s.thermo = { at: fitThermo(at, angle), angle };
        thermo.set({ ...s.thermo, lift: 0 });
        thermoNote();
        refresh();
        emitChange();
      }
      if (Array.isArray(p.compare) && p.compare.length === 2) await lineUp(String(p.compare[0]), String(p.compare[1]), { animate });
      if (p.compare === false) {
        s.pair = null;
        refresh();
        emitChange();
      }
      if (p.select) select(String(p.select).toUpperCase());
      return snapshot();
    },
    async reset() {
      quiz.stop();
      hideHint();
      await home({ animate: false });
      s.selected = 'A';
      refresh();
      emitChange();
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => world, // the board, the paper, the arrows and the thermometer; helpers on the paper are left out
  };
}
