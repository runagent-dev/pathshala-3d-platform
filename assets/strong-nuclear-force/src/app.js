// Strong nuclear force (book page 69, topic 3.2.4), student view. A small nucleus of protons (+) and neutrons:
// the student pulls one proton out. Within about 10⁻¹⁵ m the strong nuclear force pulls it back very hard (an
// orange arrow, far bigger than the blue electric push of the other protons) and it snaps back when let go;
// a little farther the strong force is gone and the electric push sends it away. Two more scenes show where
// nuclear energy comes from: a big nucleus splitting (ভাঙা) and two small nuclei joining (জোড়া দেওয়া). The
// panel names the four fundamental forces in order and how two of them became one (ইলেকট্রো উইক). Then a
// short test. Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createCoach } from '@shared/student/coach.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { COLORS, createNucleonMaterials } from './models.js';
import { buildJoinScene, buildPullScene, buildSplitScene } from './scenes.js';
import { createTags } from './tags.js';
import { MAX_PULL, R_NUCLEON, STEP, clamp, electricArrowLength, flightStep, fmt, forcesAt, roundTo, strongArrowLength } from './reading.js';

export const DEFAULTS = {
  scene: 'pull', // 'pull' | 'split' | 'join'
  pull: 0, // fm: hold the proton this far out at the start (the poster shows 0.6)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const SCENES = ['pull', 'split', 'join'];
const VIEW_DIRS = {
  front: new THREE.Vector3(0, 0.13, 1).normalize(),
  '3d': new THREE.Vector3(0.55, 0.42, 0.72).normalize(),
};
const WORLD_UP = new THREE.Vector3(0, 1, 0);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  /** 10 to a power, as HTML with the power raised: pow('−15') → 10⁻¹⁵ in the language's digits. */
  const pow = (e) => `${N('10')}<sup>${N(e)}</sup>`;
  const RANGE_HTML = `${pow('−15')} ${t('unit_m')}`;
  /** A distance in a sentence: no trailing zero ("0.7 × 10⁻¹⁵ m", "1 × 10⁻¹⁵ m"). */
  const distHtml = (d) => `${N(String(roundTo(d, STEP)))} × ${RANGE_HTML}`;
  const ATOM_HTML = `${pow('−10')} ${t('unit_m')}`; // about the size of an atom

  root.classList.add('pvc', 'snf');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: `
          <div class="snf-scenes" role="radiogroup" aria-label="${t('scenes')}">${SCENES.map(
            (k) => `<button role="radio" data-scene="${k}">${t(`scene_${k}`)}</button>`,
          ).join('')}</div>
          <div class="snf-read">
            <div class="snf-dist"><span class="k">${t('distance')}</span><b class="v">0</b><span class="u">× ${RANGE_HTML}</span></div>
            <div class="snf-eq" hidden></div>
            <button class="pvc-btn snf-again" data-act="again" aria-label="${t('act_again_long')}">${ICONS.reset}<span>${t('act_again')}</span></button>
          </div>
          <p class="snf-say" aria-live="polite"></p>
          <div class="snf-forces" role="img" aria-label="${t('forces_aria')}">
            <span class="snf-ft">${t('forces_title')}</span>
            <span class="snf-fl">
              <span class="grp gr"><span class="f grav">${t('f_grav')}</span><em>${t('k_grav')}</em></span>
              <span class="grp ew"><i class="lt">‹</i><span class="f weak">${t('f_weak')}</span><i class="lt">‹</i><span class="f em">${t('f_em')}</span><em>${t('f_ew')}</em></span>
              <span class="grp st"><i class="lt">‹</i><span class="f strong on">${t('f_strong')}<small>${RANGE_HTML}</small></span><em>${t('f_nuclear')}</em></span>
            </span>
          </div>`,
  });
  // one line at the bottom left: what the balls are, what is symbolic (and, while things move on their own, that
  // time is slowed down); the top of the view stays free for the scene
  const note = document.createElement('div');
  note.className = 'snf-note';
  note.innerHTML = `<span class="snf-legend"><span><i class="dot p">+</i>${t('legend_proton')}</span><span><i class="dot n"></i>${t('legend_neutron')}</span></span><span class="txt"><span class="sym"></span><span class="slow"></span></span>`;
  ui.stage.append(note);
  const slowLine = note.querySelector('.slow');
  const symLine = note.querySelector('.sym');

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 26, near: 0.5, far: 400, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 6;
  controls.maxDistance = 160;
  controls.enablePan = false;
  const M = createNucleonMaterials();
  const pull = buildPullScene(M);
  const split = buildSplitScene(M);
  const join = buildJoinScene(M);
  const scenes = { pull, split, join };
  for (const sc of Object.values(scenes)) scene.add(sc.root);
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(-14, 22, 30);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(18, -6, 20);
  scene.add(key, fill, new THREE.AmbientLight(0xffffff, 0.25));
  if (o.shadow && o.bg !== 'transparent') {
    // the balls shade each other a little: the nucleus reads as a round cluster
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0015;
    key.shadow.normalBias = 0.02;
    Object.assign(key.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 5, far: 90 });
    for (const sc of [pull.nucleus, split.balls, join.balls]) {
      sc.protons.castShadow = sc.protons.receiveShadow = true;
      sc.neutrons.castShadow = sc.neutrons.receiveShadow = true;
    }
    pull.proton.castShadow = pull.proton.receiveShadow = true;
  }
  // the scale's numbers and unit: labels on the page (readable at every size), placed under the 3D ticks
  const scaleEl = document.createElement('div');
  scaleEl.className = 'snf-scale';
  scaleEl.setAttribute('aria-hidden', 'true');
  scaleEl.innerHTML = `${[0, 1, 2].map((n) => `<span class="n">${N(n)}</span>`).join('')}<span class="u">× ${RANGE_HTML}</span>`;
  ui.annoLayer.append(scaleEl);
  const numEls = [...scaleEl.querySelectorAll('.n')];
  const unitEl = scaleEl.querySelector('.u');
  const tmpS = new THREE.Vector3();
  stage.onAfterRender(() => {
    const show = s.scene === 'pull' && s.scaleShown;
    scaleEl.hidden = !show;
    if (!show) return;
    numEls.forEach((el, n) => {
      const q = toScreen(pull.tick(n, tmpS));
      el.style.transform = `translate(${Math.round(q.x - el.offsetWidth / 2)}px, ${Math.round(q.y + 2)}px)`;
    });
    const u = toScreen(pull.unitAt(tmpS));
    unitEl.style.transform = `translate(${Math.round(u.x - unitEl.offsetWidth)}px, ${Math.round(u.y + 20)}px)`;
  });
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  // every ball turns to the viewer (a proton shows its "+")
  stage.onBeforeRender(() => scenes[s.scene].face(camera.quaternion));

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    scene: SCENES.includes(o.scene) ? o.scene : 'pull',
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    run: 0, // bumped whenever a pending animation must stop
    // pull
    d: 0, // fm out of its place
    phase: 'seated', // 'seated' | 'held' | 'returning' | 'back' | 'flying' | 'gone'
    v: 0, // fm/s while flying
    dragging: false,
    demo: false, // the first-use pointer is moving it (the panel keeps its first line)
    forcesShown: true, // the arrows (hidden while a test question asks about them)
    scaleShown: true, // the distance scale (hidden in test questions it would answer)
    reachShown: true, // the orange shell of the strong force's reach
    // split / join
    t: 0,
    playing: false,
    still: false, // the test shows the start without the incoming neutron
    prevScene: 'pull',
  };

  // ── the state ───────────────────────────────────────────────────────────────
  function snapshot() {
    const f = forcesAt(s.d);
    const sc = scenes[s.scene];
    return {
      scene: s.scene,
      view: s.view,
      mode: s.mode,
      distance: f.d,
      phase: s.phase,
      inRange: f.inRange,
      verdict: f.verdict,
      forces: { strong: Math.round(f.strong), electric: Math.round(f.electric) },
      arrows: { strong: pull.strongArrow.root.visible, electric: pull.electricArrow.root.visible },
      energy: s.scene === 'pull' ? null : { t: roundTo(s.t, 0.01), duration: sc.end, playing: s.playing, phase: sc.state.phase },
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const k = `${snap.scene}|${snap.mode}|${snap.distance}|${snap.phase}|${snap.energy?.phase}|${snap.energy?.playing}`;
    if (k === lastEmitted) return;
    lastEmitted = k;
    emit('change', snap);
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    dist: $('.snf-dist'),
    value: $('.snf-dist .v'),
    eq: $('.snf-eq'),
    say: $('.snf-say'),
    again: $('[data-act="again"]'),
  };
  const plus = '<i>+</i>';
  const energyTerm = `<b class="c-energy">${t('eq_energy')}</b>`;
  const eqHtml = {
    split: `<span>${t('eq_big')} ${plus} ${t('eq_neutron')} <i>→</i></span> <span>${t('eq_two_small')}</span> <span>${plus} ${t('eq_neutrons', { n: 3 })} ${plus} ${energyTerm}</span>`,
    join: `<span>${t('eq_two_small')} <i>→</i></span> <span>${t('eq_new')}</span> <span>${plus} ${t('eq_neutron')} ${plus} ${energyTerm}</span>`,
  };
  const NOTES = { pull: ['note_pull', 'note_slow'], split: ['note_split', 'note_split'], join: ['note_slow', 'note_slow'] };
  let sayKey = '';
  function sayLine() {
    if (s.scene === 'split') return s.t >= split.end ? 'say_split_done' : 'say_split_go';
    if (s.scene === 'join') return s.t >= join.end ? 'say_join_done' : 'say_join_go';
    if (s.demo) return 'say_idle';
    if (s.phase === 'held') {
      const f = forcesAt(s.d);
      if (f.d <= 0) return 'say_idle';
      return f.inRange ? (f.d >= 0.8 ? 'say_edge' : 'say_in') : 'say_out';
    }
    if (s.phase === 'returning' || s.phase === 'back') return 'say_back';
    if (s.phase === 'flying' || s.phase === 'gone') return 'say_away';
    return 'say_idle';
  }
  function refresh() {
    for (const b of ui.$$('[data-scene]')) {
      const on = b.dataset.scene === s.scene;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', String(on));
    }
    const isPull = s.scene === 'pull';
    el.dist.hidden = !isPull;
    el.eq.hidden = isPull;
    if (isPull) el.value.textContent = s.phase === 'gone' ? '—' : N(fmt(Math.max(0, s.d)));
    else if (el.eq.dataset.scene !== s.scene) {
      el.eq.innerHTML = eqHtml[s.scene];
      el.eq.dataset.scene = s.scene;
    }
    const k = sayLine();
    if (k !== sayKey) {
      sayKey = k;
      el.say.innerHTML = t(k, { p: RANGE_HTML });
    }
    // splitting and joining are always shown slowed down; the pulled proton only while it moves by itself
    const moving = isPull ? s.phase === 'flying' || s.phase === 'returning' : !s.still;
    slowLine.style.visibility = moving ? 'visible' : 'hidden';
    symLine.style.visibility = moving ? 'hidden' : 'visible';
    stage.invalidate();
  }

  // ── the pull scene ──────────────────────────────────────────────────────────
  /** Put the proton d fm out and draw the forces on it (none while it sits in its place). */
  function showProton(d) {
    s.d = d;
    const f = forcesAt(d);
    // no arrows while it sits in its place, nor while the first-use pointer shows how to pull (they are found)
    const arrows = s.forcesShown && !s.demo && d > 0.04 && s.phase !== 'seated' && s.phase !== 'back' && s.phase !== 'gone';
    pull.proton.visible = s.phase !== 'gone';
    pull.setProton(d, {
      strong: arrows ? strongArrowLength(f.d) : 0,
      electric: arrows ? electricArrowLength(f.d) : 0,
    });
    pull.rail.root.visible = s.scaleShown;
    pull.reach.root.visible = s.reachShown;
    refresh();
  }

  function seat() {
    tweener.cancel('pull');
    s.phase = 'seated';
    s.v = 0;
    showProton(0);
    emitChange();
  }

  /** Hold the proton d fm out (a finger, the keys or the book page). */
  function hold(d) {
    tweener.cancel('pull');
    s.phase = 'held';
    const before = forcesAt(s.d).inRange;
    const dd = roundTo(clamp(d, 0, MAX_PULL), STEP);
    if (s.dragging && dd !== roundTo(s.d, STEP)) {
      if (before && !forcesAt(dd).inRange)
        audio.pop(); // the strong force lets go
      else audio.tick();
    }
    showProton(dd);
    emitChange();
  }

  /** Let go: within reach it snaps back, beyond it the electric push sends it away. */
  function release({ animate = true } = {}) {
    if (s.phase !== 'held') return;
    const f = forcesAt(s.d);
    const my = ++s.run;
    if (s.d <= 0) return seat();
    if (f.verdict === 'back') {
      s.phase = 'returning';
      emit('release', { distance: f.d, verdict: 'back' });
      const d0 = s.d;
      const done = () => {
        if (my !== s.run) return;
        s.phase = 'back';
        showProton(0);
        audio.contact();
        emitChange();
      };
      if (!animate) return done();
      emitChange();
      tweener
        .animate({
          key: 'pull',
          duration: 0.3 + 0.12 * d0,
          ease: (k) => 1 + 2.2 * (k - 1) ** 3 + 1.2 * (k - 1) ** 2, // a little overshoot: it presses into its place
          onUpdate: (k) => showProton(Math.max(-0.08, d0 * (1 - k))),
        })
        .finished.then((ok) => ok && done());
    } else {
      s.phase = 'flying';
      s.v = 0;
      emit('release', { distance: f.d, verdict: 'away' });
      if (!animate) {
        s.phase = 'gone';
        showProton(12);
      } else showProton(s.d);
      emitChange();
    }
  }

  // the flight: pushed off by the electric force alone, in slow motion
  const tmp = new THREE.Vector3();
  stage.addTicker((dt) => {
    if (s.scene !== 'pull' || s.phase !== 'flying') return false;
    const step = flightStep(s.d, s.v, dt);
    s.v = step.v;
    const sp = toScreen(pull.at(step.d, tmp));
    if (sp.x > stage.width + 80 || step.d > 16) {
      s.phase = 'gone';
      showProton(16);
      emitChange();
      return true;
    }
    showProton(step.d);
    emitChange();
    return true;
  });

  // ── split / join ────────────────────────────────────────────────────────────
  function seek(time) {
    const sc = scenes[s.scene];
    if (s.scene === 'pull' || !sc) return;
    s.t = clamp(time, 0, sc.end);
    sc.render(s.t, { incoming: !s.still });
    refresh();
  }
  function play(from = 0) {
    if (s.scene === 'pull') return;
    s.still = false;
    s.playing = true;
    seek(from);
    emitChange();
  }
  stage.addTicker((dt) => {
    if (!s.playing || s.scene === 'pull') return false;
    const sc = scenes[s.scene];
    const before = sc.state.phase;
    seek(s.t + dt);
    if (sc.state.phase !== before && sc.state.phase === 'apart') audio.pop();
    if (sc.state.phase !== before && sc.state.phase === 'joining') audio.pop();
    if (s.t >= sc.end) {
      s.playing = false;
      emit('done', { scene: s.scene });
      refresh();
    }
    emitChange();
    return true;
  });

  // ── scenes ──────────────────────────────────────────────────────────────────
  function setScene(name, { animate = true, start = true } = {}) {
    const next = SCENES.includes(name) ? name : 'pull';
    s.run++;
    tweener.cancel('pull');
    s.dragging = false;
    drag = null;
    s.playing = false;
    const changed = next !== s.scene;
    s.scene = next;
    for (const [k, sc] of Object.entries(scenes)) sc.root.visible = k === next;
    symLine.textContent = t(NOTES[next][0]);
    slowLine.textContent = t(NOTES[next][1]);
    s.phase = 'seated';
    s.d = 0;
    s.t = 0;
    if (next === 'pull') showProton(0);
    else {
      showProton(0);
      seek(0);
    }
    addTags();
    if (changed || !s.userMovedCamera) {
      s.userMovedCamera = false;
      flyTo(poseFor(next, s.view), animate && changed ? 0.7 : 0);
    }
    if (next !== 'pull' && start) play(0);
    refresh();
    emit('scene', { scene: next });
    emitChange();
  }

  function again() {
    if (s.locked) return lockedNudge();
    if (s.scene === 'pull') {
      s.run++;
      seat();
    } else play(0);
  }

  // ── labels on the scene ─────────────────────────────────────────────────────
  const tags = createTags({
    stage,
    layer: ui.annoLayer,
    avoid: () => [ui.corner, note, ui.hint.classList.contains('show') ? ui.hint : null],
    keep: keepBoxes,
    soft: softBoxes,
  });
  const reachPoint = new THREE.Vector3();
  const above = (dy = 8) => ({ x: 0, y: -dy, ax: 0.5, ay: 1 });
  const below = (dy = 8) => ({ x: 0, y: dy, ax: 0.5, ay: 0 });
  function addTags() {
    tags.clear();
    if (s.scene === 'pull') {
      const sa = pull.strongArrow;
      const ea = pull.electricArrow;
      // the strong force's name above the proton, off the nucleus, with a short leader to its arrow
      tags.add('strong', {
        html: t('label_strong'),
        color: COLORS.strong,
        kind: 'force',
        leader: true,
        priority: 3,
        point: () => (sa.root.visible ? pull.strongPoint() : null),
        spots: [
          ...[12, 34].flatMap((dy) => [
            { x: -6, y: -dy, ax: 1, ay: 1, pt: pull.top },
            { x: 0, y: -dy, ax: 0.62, ay: 1, pt: pull.top },
            { x: 6, y: -dy, ax: 0.3, ay: 1, pt: pull.top },
          ]),
          { ...above(14), pt: () => sa.tip, ax: 0.3 },
          { ...below(14), pt: () => sa.tip, ax: 0.3 },
        ],
      });
      tags.add('electric', {
        html: t('label_electric'),
        color: COLORS.electric,
        kind: 'force',
        priority: 2,
        point: () => (ea.root.visible ? ea.mid : null),
        // right of its tip, else above or below the tip, else above the proton
        spots: [
          { x: 10, y: 0, ax: 0, ay: 0.5, pt: () => ea.tip },
          ...[12, 28, 44].flatMap((dy) =>
            [0.25, 0, 0.55, 0.85].flatMap((ax) => [
              { ...above(dy), pt: () => ea.tip, ax },
              { ...below(dy), pt: () => ea.tip, ax },
            ]),
          ),
          ...[12, 34].map((dy) => ({ x: 6, y: -dy, ax: 0, ay: 1, pt: pull.top })),
          ...[12, 34].map((dy) => ({ x: -6, y: -dy, ax: 1, ay: 1, pt: pull.top })),
        ],
      });
      // the reach: its name on the dashed line, where there is room
      const rp = [28, 40, 18, 52, -30, -42].map((deg) => {
        const v = new THREE.Vector3();
        return { deg, at: () => pull.reach.pointAt(deg, v) };
      });
      tags.add('reach', {
        html: t('label_reach'),
        color: COLORS.strongInk,
        priority: 1,
        leadFrom: 'spot',
        point: () => (s.reachShown ? pull.reach.pointAt(28, reachPoint) : null),
        spots: rp.flatMap(({ deg, at }) =>
          deg > 0
            ? [
                { x: 10, y: -10, ax: 0, ay: 1, pt: at },
                { x: 0, y: -14, ax: 0.5, ay: 1, pt: at },
              ]
            : [
                { x: 10, y: 10, ax: 0, ay: 0, pt: at },
                { x: -10, y: 10, ax: 1, ay: 0, pt: at },
              ],
        ),
      });
      return;
    }
    const sc = scenes[s.scene];
    const P = sc.points;
    // a nucleus's name goes above it (its point is the top of the nucleus), never over it
    const nameSpots = [
      ...[18, 34].flatMap((dy) => [above(dy), { x: 16, y: -dy, ax: 0, ay: 1 }, { x: -16, y: -dy, ax: 1, ay: 1 }]),
      { x: -22, y: 6, ax: 1, ay: 0.5 }, // beside the top, where the ball curves away
      { x: 22, y: 6, ax: 0, ay: 0.5 },
    ];
    if (s.scene === 'split') {
      // the slow neutron before it arrives; after the split, one of the three freed neutrons
      const around = [26, 38].flatMap((r) => [above(r), below(r), { x: r, y: 0, ax: 0, ay: 0.5 }, { x: -r, y: 0, ax: 1, ay: 0.5 }]);
      tags.add('neutron', {
        html: t('label_neutron'),
        priority: 2,
        point: () => (s.t < 1.5 ? (s.still ? null : P.neutron) : s.t >= 3.6 ? P.freed[0] : null),
        spots: around,
      });
      tags.add('big', {
        html: t('label_big'),
        priority: 3,
        point: () => (sc.state.phase === 'before' || sc.state.phase === 'wobble' ? P.big : null),
        spots: nameSpots,
      });
      // each piece named above it, else below it
      const pieceSpots = (j) => [
        ...nameSpots,
        ...[18, 34].map((dy) => ({ ...below(dy), pt: () => P.piecesLow[j] })),
        { x: j ? -8 : 8, y: 0, ax: j ? 1 : 0, ay: 0.5, pt: () => P.piecesInner[j] }, // beside it, toward the middle
      ];
      tags.add('small0', {
        html: t('label_small'),
        priority: 3,
        leadFrom: 'spot',
        point: () => (s.t >= 3.3 ? P.pieces[0] : null),
        spots: pieceSpots(0),
      });
      tags.add('small1', {
        html: t('label_small'),
        priority: 3,
        leadFrom: 'spot',
        point: () => (s.t >= 3.3 ? P.pieces[1] : null),
        spots: pieceSpots(1),
      });
    } else {
      tags.add('small0', { html: t('label_small'), priority: 3, point: () => (s.t < 1.6 ? P.small[0] : null), spots: nameSpots });
      tags.add('small1', { html: t('label_small'), priority: 3, point: () => (s.t < 1.6 ? P.small[1] : null), spots: nameSpots });
      tags.add('new', {
        html: t('label_new'),
        priority: 3,
        point: () => (s.t >= 1.95 ? P.joined : null),
        spots: [below(16), { x: 18, y: 14, ax: 0, ay: 0 }, { x: -18, y: 14, ax: 1, ay: 0 }],
      });
      tags.add('neutron', {
        html: t('label_neutron'),
        priority: 1,
        point: () => (s.t >= 2.3 ? P.neutron : null),
        spots: [28, 42].flatMap((r) => [
          { x: r, y: 0, ax: 0, ay: 0.5 },
          below(r),
          { x: -r, y: 0, ax: 1, ay: 0.5 },
          above(r),
          { x: r * 0.75, y: r * 0.75, ax: 0, ay: 0 },
          { x: -r * 0.75, y: r * 0.75, ax: 1, ay: 0 },
        ]),
      });
    }
    tags.add('energy', {
      html: t('label_energy'),
      color: COLORS.energyInk,
      cls: 'snf-energy',
      priority: 4, // the payoff: placed first
      point: () => (sc.burst.root.visible ? P.energy() : null),
      spots: [
        { x: 8, y: -6, ax: 0, ay: 1 },
        { x: -8, y: -6, ax: 1, ay: 1 },
        above(10),
        { x: 10, y: 0, ax: 0, ay: 0.5 },
        { x: -10, y: 0, ax: 1, ay: 0.5 },
        below(10),
        { x: 8, y: 6, ax: 0, ay: 0 },
      ],
    });
  }
  const toScreen = (p, out = { x: 0, y: 0 }) => {
    const q = tmpP.copy(p).project(camera);
    out.x = (q.x * 0.5 + 0.5) * stage.width;
    out.y = (-q.y * 0.5 + 0.5) * stage.height;
    return out;
  };
  const tmpP = new THREE.Vector3();
  const offR = new THREE.Vector3();
  /** Pixels of a length (fm) at a point, in the picture. */
  function pxAt(p, len) {
    const a = toScreen(p);
    offR.copy(p).addScaledVector(camera.up, len);
    const b = toScreen(offR);
    return Math.hypot(b.x - a.x, b.y - a.y);
  }
  /** A box round a ball (a neutron on its way) that no label may cover. */
  function ballBox(p, k = 1) {
    const c = toScreen(p);
    const r = pxAt(p, R_NUCLEON) * k;
    return { l: c.x - r, t: c.y - r, r: c.x + r, b: c.y + r };
  }
  function keepBoxes() {
    if (s.scene === 'split') {
      const out = split.state.phase === 'before' && !s.still ? [ballBox(split.points.neutron)] : [];
      if (s.t >= 3.3) for (const p of split.points.freed) out.push(ballBox(p));
      return out;
    }
    if (s.scene === 'join') return s.t > 1.6 ? [ballBox(join.points.neutron)] : [];
    const out = [];
    if (pull.proton.visible) {
      const c = toScreen(pull.proton.position);
      const r = pxAt(pull.proton.position, R_NUCLEON) * 0.92; // a box inside the ball's corners
      out.push({ l: c.x - r, t: c.y - r, r: c.x + r, b: c.y + r });
    }
    for (const a of [pull.strongArrow, pull.electricArrow]) {
      if (!a.root.visible) continue;
      const p = toScreen(a.tail);
      const q = toScreen(a.tip);
      out.push({ l: Math.min(p.x, q.x) - 3, t: Math.min(p.y, q.y) - 9, r: Math.max(p.x, q.x) + 3, b: Math.max(p.y, q.y) + 9 });
    }
    if (s.scaleShown) {
      const s0 = toScreen(pull.tick(0, tmpA));
      const s1 = toScreen(pull.unitAt(tmpA));
      out.push({ l: s0.x - 10, t: s0.y - 14, r: s1.x + 10, b: s0.y + 40 });
    }
    return out;
  }
  const tmpA = new THREE.Vector3();
  function softBoxes() {
    if (s.scene !== 'pull') return [];
    const c = toScreen(tmpA.set(0, 0, 0));
    const r = pxAt(tmpA, pull.surface);
    return [{ l: c.x - r, t: c.y - r, r: c.x + r, b: c.y + r }];
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  /** Where a box on the stage is, on the canvas (px), a little bigger; null when it is not shown. */
  function boxOf(elm, pad = 6) {
    if (!elm || getComputedStyle(elm).visibility === 'hidden') return null;
    const c = stage.canvas.getBoundingClientRect();
    const r = elm.getBoundingClientRect();
    if (!r.width) return null;
    return { left: r.left - c.left - pad, right: r.right - c.left + pad, top: r.top - c.top - pad, bottom: r.bottom - c.top + pad };
  }
  /**
   * A camera pose that shows the whole scene (all of its animation, with room for its labels) as big as it can,
   * for this frame's shape: nothing under the buttons at the top right, the legend or the note.
   */
  function poseFor(name, view) {
    const pts = scenes[name].frame();
    const lo = new THREE.Vector3(Infinity, Infinity, Infinity);
    const hi = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    for (const { p } of pts) {
      lo.min(p);
      hi.max(p);
    }
    const target = lo.clone().add(hi).multiplyScalar(0.5);
    const back = VIEW_DIRS[view].clone();
    const right = new THREE.Vector3().crossVectors(WORLD_UP, back).normalize();
    const up = new THREE.Vector3().crossVectors(back, right);
    const local = pts.map(({ p, box }) => {
      const q = p.clone().sub(target);
      return { x: q.dot(right), y: q.dot(up), z: q.dot(back), box };
    });
    const W = stage.width;
    const H = Math.max(stage.height, 120);
    const boxes = [boxOf(ui.corner), boxOf(note, 4)].filter(Boolean);
    const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const th = tv * camera.aspect;
    const MX = 8;
    const clear = (px, py) => {
      if (px < MX || px > W - MX || py < MX || py > H - MX) return false;
      return !boxes.some((r) => px > r.left && px < r.right && py > r.top && py < r.bottom);
    };
    const fits = (d, sx, sy) =>
      local.every(({ x, y, z, box }) => {
        const depth = d - z;
        if (depth < 0.5) return false;
        const px = W / 2 + (x / (depth * th)) * (W / 2) + sx;
        const py = H / 2 - (y / (depth * tv)) * (H / 2) + sy;
        if (!box) return clear(px, py);
        return (
          clear(px + box[0], py + box[1]) && clear(px + box[2], py + box[1]) && clear(px + box[0], py + box[3]) && clear(px + box[2], py + box[3])
        );
      });
    // try the picture where it is, then moved a little (smallest moves first): a move is kept only if it lets
    // the scene be clearly bigger, so the picture stays centred when nothing is in the way
    const shifts = [];
    for (let sy = -40; sy <= 64; sy += 8) for (let sx = -32; sx <= 32; sx += 16) shifts.push([sx, sy]);
    shifts.sort((a, b) => Math.abs(a[0]) + Math.abs(a[1]) - Math.abs(b[0]) - Math.abs(b[1]));
    let best = null;
    for (const [sx, sy] of shifts) {
      let a = 1;
      let b = 400;
      if (!fits(b, sx, sy)) continue;
      for (let i = 0; i < 26; i++) {
        const mid = (a + b) / 2;
        if (fits(mid, sx, sy)) b = mid;
        else a = mid;
      }
      if (!best || b < best.d * 0.985) best = { d: b, sx, sy };
    }
    const d = (best?.d ?? 40) * 1.02;
    // the shift moves the picture: the camera moves the other way by as much, at the distance of the scene
    const t2 = target.addScaledVector(up, ((best?.sy ?? 0) / (H / 2)) * d * tv).addScaledVector(right, (-(best?.sx ?? 0) / (W / 2)) * d * th);
    return { target: t2, position: t2.clone().addScaledVector(back, d) };
  }
  function flyTo({ position, target }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
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
    return flyTo(poseFor(s.scene, s.view), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(poseFor(s.scene, s.view), 0);
  });

  // ── pulling the proton ──────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  /** Does a finger at this canvas point take the proton? */
  function onProton(p) {
    if (s.scene !== 'pull' || !pull.proton.visible || s.phase === 'flying') return false;
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.intersectObject(pull.hit, false).length) return true;
    const c = toScreen(pull.proton.position);
    return Math.hypot(c.x - p.x, c.y - p.y) < Math.max(40, pxAt(pull.proton.position, R_NUCLEON) * 1.6);
  }
  /** Pixels per fm along the pulling direction on the screen, and that direction. */
  function axisOnScreen() {
    const a = toScreen(pull.at(0, tmpA));
    const b = toScreen(pull.at(1, tmpA));
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return { ux: dx / len, uy: dy / len, px: len };
  }
  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      coach?.interrupt();
      const p = canvasPoint(e);
      if (drag || !onProton(p)) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      s.run++;
      s.demo = false;
      tweener.cancel('pull');
      const start = s.phase === 'held' || s.phase === 'returning' ? roundTo(Math.max(0, s.d), STEP) : 0;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, d: start, axis: axisOnScreen() };
      s.dragging = true;
      try {
        ui.canvasHost.setPointerCapture(e.pointerId);
      } catch {} // a pointer the browser no longer tracks: the drag still works inside the view
      coach?.objectUsed();
      hideHint();
      hold(start);
      emit('dragstart', snapshot());
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { ux, uy, px } = drag.axis;
    hold(drag.d + ((e.clientX - drag.x) * ux + (e.clientY - drag.y) * uy) / px);
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    s.dragging = false;
    emit('dragend', snapshot());
    if (s.locked) return;
    release();
    coach?.objectReleased();
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || hoverQueued || drag) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
      ui.canvasHost.style.cursor = onProton(p) ? (s.locked ? 'not-allowed' : 'grab') : '';
    });
  });

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 3500 } = {}) {
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
  function lockedNudge() {
    showHint(t('q_locked'), { duration: 3000 });
    audio.error();
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
  const word = (k) => `<span class="snf-opt">${t(k)}</span>`;
  /** Four answers in words: keys[0] is right; the choices are indexes into a shuffled list. */
  function wordChoices(keys) {
    const list = shuffle([...keys]);
    return { list, choices: [0, 1, 2, 3], expected: list.indexOf(keys[0]), tolerance: 0.5, label: (j) => word(list[j]) };
  }
  let kinds = [];
  let question = null;
  let picked = -1;
  const qText = $('.pvc-q-text');
  function sayHtml(say, alive, html) {
    say(' ');
    if (alive()) qText.innerHTML = html;
  }
  /** The pull scene, the proton in its place, nothing drawn on it. */
  function quietPull() {
    if (s.scene !== 'pull') setScene('pull', { animate: false, start: false });
    s.run++;
    s.forcesShown = false;
    s.scaleShown = false;
    s.reachShown = false;
    seat();
  }
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    hooks: {
      enter() {
        s.prevScene = s.scene;
        s.mode = 'quiz';
        s.locked = true;
        s.run++;
        drag = null;
        s.dragging = false;
        s.demo = false;
        hideHint();
        kinds = ['who', 'release', 'atom', 'energy', 'group'];
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.forcesShown = true;
        s.scaleShown = true;
        s.reachShown = true;
        s.still = false;
        syncUI();
        setScene(s.prevScene, { animate: false, start: true });
      },
      async prepare(i, alive, say) {
        const kind = kinds[i % kinds.length];
        s.locked = true;
        picked = -1;
        if (kind === 'who') {
          quietPull();
          say(t('q_who'));
          const c = wordChoices(['opt_who_all', 'opt_who_ep', 'opt_who_p', 'opt_who_n']);
          question = { kind, ...c };
          return { ...c, meta: { kind } };
        }
        if (kind === 'release') {
          // clearly inside the reach or clearly outside it (the edge is only "about" 10⁻¹⁵ m)
          quietPull();
          s.scaleShown = true;
          const inside = Math.random() < 0.5;
          const d = inside ? pickOne([0.2, 0.3, 0.4, 0.5, 0.6]) : pickOne([1.6, 1.8, 2, 2.2, 2.4]);
          hold(d);
          sayHtml(say, alive, t('q_release', { d: distHtml(d) }));
          const c = wordChoices(inside ? ['opt_back', 'opt_away', 'opt_stay', 'opt_break'] : ['opt_away', 'opt_back', 'opt_stay', 'opt_break']);
          question = { kind, d, inside, ...c };
          return { ...c, meta: { kind, distance: d } };
        }
        if (kind === 'atom') {
          quietPull();
          sayHtml(say, alive, t('q_atom', { d: ATOM_HTML }));
          const c = wordChoices(['opt_atom_em', 'opt_atom_strong', 'opt_atom_equal', 'opt_atom_none']);
          question = { kind, ...c };
          return { ...c, meta: { kind } };
        }
        if (kind === 'energy') {
          const big = Math.random() < 0.5;
          s.still = true;
          setScene(big ? 'split' : 'join', { animate: false, start: false });
          s.still = true;
          seek(0);
          say(t(big ? 'q_energy_big' : 'q_energy_small'));
          const c = wordChoices(
            big ? ['opt_split', 'opt_join_more', 'opt_burn', 'opt_none_energy'] : ['opt_join', 'opt_split_more', 'opt_burn', 'opt_none_energy'],
          );
          question = { kind, big, ...c };
          return { ...c, meta: { kind, nucleus: big ? 'big' : 'small' } };
        }
        // group
        quietPull();
        say(t('q_group'));
        const c = wordChoices(['opt_ew', 'opt_nuclear', 'opt_grav', 'opt_none']);
        question = { kind, ...c };
        return { ...c, meta: { kind } };
      },
      reveal(_q, correct) {
        const Q = question;
        const chose = picked >= 0 ? (Q.list ? Q.list[picked] : null) : null;
        const why = (k, vars) => t(k, { p: RANGE_HTML, ...vars });
        const extra = (text) => (correct || !text ? '' : ` ${text}`);
        if (Q.kind === 'who') {
          const m = { opt_who_ep: 'why_who_ep', opt_who_p: 'why_who_p', opt_who_n: 'why_who_n' }[chose];
          return why('why_who') + extra(m && why(m));
        }
        if (Q.kind === 'release') {
          // show what happens: the arrows, then let it go
          s.forcesShown = true;
          s.reachShown = true;
          showProton(s.d);
          const my = s.run;
          setTimeout(() => my === s.run && quiz.active && release(), 700);
          const m = { opt_stay: 'why_release_stay', opt_break: 'why_release_break' }[chose];
          return why(Q.inside ? 'why_release_in' : 'why_release_out', { d: distHtml(Q.d) }) + extra(m && why(m));
        }
        if (Q.kind === 'atom') {
          const m = { opt_atom_strong: 'why_atom_strong', opt_atom_equal: 'why_atom_equal', opt_atom_none: 'why_atom_none' }[chose];
          return why('why_atom', { d: ATOM_HTML }) + extra(m && why(m));
        }
        if (Q.kind === 'energy') {
          const my = s.run;
          setTimeout(() => my === s.run && quiz.active && play(0), 500);
          const m = {
            opt_join_more: 'why_energy_join_more',
            opt_split_more: 'why_energy_split_more',
            opt_burn: 'why_energy_burn',
            opt_none_energy: 'why_energy_none',
          }[chose];
          return why(Q.big ? 'why_energy_big' : 'why_energy_small') + extra(m && why(m));
        }
        const m = { opt_nuclear: 'why_group_nuclear', opt_grav: 'why_group_grav', opt_none: 'why_group_none' }[chose];
        return why('why_group') + extra(m && why(m));
      },
      done() {
        s.locked = false;
      },
    },
  });

  // ── first-use pointer: on the proton ────────────────────────────────────────
  let coach = null;
  if (o.coach) {
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint, note],
      object: {
        label: 'coach_pull',
        candidates: () => {
          if (s.scene !== 'pull' || !pull.proton.visible) return [];
          const c = toScreen(pull.proton.position);
          const r = pxAt(pull.proton.position, R_NUCLEON);
          return [
            { x: c.x, y: c.y },
            { x: c.x + r * 0.4, y: c.y + r * 0.3 },
          ];
        },
        grabbable: (p) => onProton(p),
        // the proton comes out a little and snaps back (well inside the reach: the panel keeps its first line)
        async demo(alive) {
          if (s.scene !== 'pull' || s.phase !== 'seated' || s.locked) return;
          s.demo = true;
          s.phase = 'held';
          const ok = await tweener.animate({ key: 'pull', duration: 0.7, onUpdate: (k) => showProton(0.35 * k) }).finished;
          if (ok && alive()) await tweener.animate({ key: 'pull', duration: 0.35, onUpdate: (k) => showProton(0.35 * (1 - k)) }).finished;
          if (s.demo) {
            s.demo = false;
            if (s.phase === 'held' && !s.dragging) seat();
          }
        },
        cancel: () => {
          if (!s.demo) return;
          tweener.cancel('pull');
          s.demo = false;
          if (!s.dragging) seat();
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
  function chooseScene(name) {
    if (s.locked) return lockedNudge();
    hideHint();
    if (name === s.scene) return again();
    setScene(name);
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.scene) chooseScene(b.dataset.scene);
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'again':
        again();
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
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[k];
    if (step) {
      if (s.locked) return lockedNudge();
      if (target.closest('[role="radiogroup"]')) return; // arrows move between the chips there
      if (s.scene !== 'pull') setScene('pull');
      if (s.phase === 'flying' || s.phase === 'gone') seat();
      coach?.objectUsed();
      s.run++;
      s.demo = false;
      const base = s.phase === 'held' ? s.d : 0;
      hold(base + step * (e.shiftKey ? 0.5 : STEP));
    } else if ((k === ' ' || k === 'Enter') && !target.closest('button')) {
      if (s.locked) return lockedNudge();
      if (s.scene === 'pull' && s.phase === 'held') release();
      else again();
    } else if (k === '1' || k === '2' || k === '3') chooseScene(SCENES[Number(k) - 1]);
    else if (k.toLowerCase() === 'r') again();
    else if (k.toLowerCase() === 'f') setView('front');
    else if (k.toLowerCase() === 'v') setView('3d');
    else if (k === 'Escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  controls.enableRotate = s.view === '3d';
  setScene(s.scene, { animate: false, start: true });
  if (s.scene === 'pull' && Number(o.pull) > 0) hold(Number(o.pull));
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
     * Change any of: scene ('pull' | 'split' | 'join'; split and join play from the start unless play: false),
     * pull (fm: hold the proton this far out), release (true: let it go), t (s: show split/join at this time),
     * play (true plays split/join from t, false stops), view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.scene && (p.scene !== s.scene || p.t == null)) setScene(p.scene, { animate, start: p.play !== false && p.t == null });
      if (p.pull != null) {
        if (s.scene !== 'pull') setScene('pull', { animate });
        s.run++;
        s.demo = false;
        hold(Number(p.pull) || 0);
      }
      if (p.release) release({ animate });
      if (p.t != null && s.scene !== 'pull') {
        s.playing = false;
        seek(Number(p.t) || 0);
        emitChange();
      }
      if (p.play === true && s.scene !== 'pull' && p.t != null) play(s.t);
      if (p.play === false) s.playing = false;
      if (!animate && s.scene !== 'pull' && s.playing) {
        s.playing = false;
        seek(scenes[s.scene].end);
      }
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.forcesShown = true;
      s.scaleShown = true;
      s.reachShown = true;
      setScene('pull', { animate: false, start: false });
      seat();
      await setView('front', { animate: false });
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => scenes[s.scene].root,
  };
}
