// Periodic motion (book page 37, topic 2.2), student view. Four examples from the book: a fan blade (circular
// path), Halley's comet (elliptical), a mass on a spring (straight line) and the heartbeat. A mark sits on the
// path; every time the particle comes back to it, the count goes up and the repetition is drawn as a bar on a
// time strip: all bars equal, the period. The panel works it out like a student with a stopwatch: পর্যায়কাল =
// মোট সময় ÷ পুনরাবৃত্তি. The particle carries its velocity arrow; at the mark a faint copy stays, and one period
// later the arrow lands on it again (the same velocity at the same point). The student moves the mark anywhere
// on the path, switches examples, pauses, and takes a short test. Built on the shared student kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { FONT, createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createCoach } from '@shared/student/coach.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { ICONS, svg } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { createFan } from './fan.js';
import { createComet } from './comet.js';
import { createSpring } from './spring.js';
import { createHeart } from './heart.js';
import { createLapStrip } from './lapstrip.js';
import { createArrow, createMark } from './parts.js';
import {
  EXAMPLE_IDS,
  EXAMPLES,
  createCounter,
  fmtNum,
  fmtTime,
  frac,
  heartMistakes,
  linearMotion,
  passTimes,
  periodMistakes,
  roundTo,
  slowingMotion,
} from './motion.js';

export const DEFAULTS = {
  example: 'fan', // 'fan' | 'comet' | 'spring' | 'heart'
  time: 0, // start this far into the example's motion (its unit), with the repetitions on the way counted
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const CLOCK_ICON = svg('<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M10 3h4M12 3v2.5M18.2 6.8l1.3-1.3"/>');
// what the 3D view shows: everything while learning; the test hides what would give the answer away, and the
// fan switched off shows its strip of turns on the view
const ALL_SHOWN = { tag: true, clock: true, note: true, mark: true, arrow: true, labels: true, strip3d: false };
const BPM = (period) => Math.round(60 / period);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'pm');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const term = (cls, label) => `<span class="pvc-t ${cls}"><b>0</b><small>${t(label)}</small></span>`;
  const ui = buildStudentShell(root, t, {
    layout: 'side', // the panel beside the 3D on landscape frames (kit 1.5.0)
    learn: `
          <div class="pm-examples" role="group" aria-label="${t('examples')}">
            ${EXAMPLE_IDS.map((id) => `<button class="pm-ex" data-ex="${id}" aria-pressed="false">${t(`ex_${id}`)}</button>`).join('')}
          </div>
          <div class="pm-acts">
            <span class="pvc-status"><i></i><span></span></span>
            <button class="pvc-btn" data-act="play"><span class="pm-ic"></span><span class="pm-lb"></span></button>
          </div>
          <div class="pvc-learn-main">
            <div class="pvc-result"><span class="k">${t('reading')}</span><span class="v">–</span><span class="u"></span></div>
            <div class="pvc-sum pm-sum"><i>=</i>${term('tot', 'total_long')}<i>÷</i>${term('cnt', 'count_long')}</div>
          </div>
          <div class="pm-strip-learn"></div>
          <p class="pvc-learn-extra pm-extra"></p>`,
  });
  // in the panel, nothing floating on the 3D view: the shape of the path and the clock (the first readings), the note
  // on time and scale (under the sentence); on the view only the strip of turns in the test about the fan switched off
  const cap = document.createElement('div');
  cap.className = 'pm-cap';
  cap.setAttribute('aria-live', 'off');
  cap.innerHTML = `<span class="pm-tag"></span><span class="pm-clock">${CLOCK_ICON}<span class="pm-clock-k">${t('clock')}</span><b>0</b><small></small></span>`;
  const note = document.createElement('div');
  note.className = 'pm-note';
  const strip3d = document.createElement('div');
  strip3d.className = 'pm-strip3d';
  strip3d.hidden = true;
  ui.$('.pm-acts').append(cap); // beside the pause button: the path's shape and the clock
  ui.$('.pm-extra').after(note);
  ui.stage.append(strip3d);
  const learnStrip = createLapStrip(ui.$('.pm-strip-learn'), '');
  const stageStrip = createLapStrip(strip3d, '');

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.01, far: 50, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  const backdropCanvas = document.createElement('canvas');
  backdropCanvas.width = 8;
  backdropCanvas.height = 256;
  const backdropContext = backdropCanvas.getContext('2d');
  const backdropGradient = backdropContext.createLinearGradient(0, 0, 0, 256);
  backdropGradient.addColorStop(0, '#c4d1de');
  backdropGradient.addColorStop(1, '#e7ded1');
  backdropContext.fillStyle = backdropGradient;
  backdropContext.fillRect(0, 0, 8, 256);
  const backdrop = new THREE.CanvasTexture(backdropCanvas);
  backdrop.colorSpace = THREE.SRGBColorSpace;
  scene.background = o.bg === 'transparent' ? null : backdrop;
  const M = createMaterials(stage.renderer);
  scene.add(camera);
  const headlight = new THREE.DirectionalLight(0xffffff, 0.75);
  headlight.position.set(0.35, 0.55, 1);
  headlight.target.position.set(0, 0, -1);
  camera.add(headlight, headlight.target);

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const annotations = createAnnotations({ stage, layer: ui.annoLayer });

  const examples = { fan: createFan(M), comet: createComet(), spring: createSpring(M), heart: createHeart() };
  for (const ex of Object.values(examples)) {
    ex.root.visible = false;
    scene.add(ex.root);
    if (!ex.ownMark) {
      ex.mark = createMark(ex.markLength);
      ex.arrow = createArrow(ex.arrowThickness); // rides with the particle
      ex.ghost = createArrow(ex.arrowThickness, { ghost: true }); // stays at the mark
      ex.root.add(ex.mark.root, ex.arrow.root, ex.ghost.root);
    } else ex.mark = ex.ownMark;
  }

  // a soft shadow on the table, for the example that stands on one (the spring)
  let shadowFloor = null;
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xffffff, 0.3);
    sun.position.set(0.25, 1.4, 0.8);
    sun.target.position.set(0, 0.2, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -0.4, right: 0.4, top: 0.5, bottom: -0.3, near: 0.5, far: 3 });
    sun.shadow.radius = 8;
    shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ opacity: 0.12 }));
    shadowFloor.rotation.x = -Math.PI / 2;
    shadowFloor.receiveShadow = true;
    shadowFloor.userData.noExport = true;
    scene.add(sun, sun.target, shadowFloor);
    examples.spring.root.traverse((m) => {
      if (m instanceof THREE.Mesh && !m.userData.noExport && !m.material.transparent) m.castShadow = true;
    });
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const counter = createCounter();
  let coach = null; // first-use pointer (made further down)
  const s = {
    example: EXAMPLES[o.example] ? o.example : 'fan',
    motion: null,
    period: 0, // of the current motion (the heart can beat at another rate in the test)
    t: 0, // time since the example started, in its unit
    mark: 0,
    playing: true,
    dragging: false,
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    show: { ...ALL_SHOWN },
    userMovedCamera: false,
  };
  const cur = () => examples[s.example];
  const spec = () => EXAMPLES[s.example];
  const unitWord = () => t(spec().unit === 'yr' ? 'unit_yr' : 'unit_s');
  const T = (v) => N(fmtTime(v, spec().unit));

  function snapshot() {
    return {
      example: s.example,
      unit: spec().unit,
      period: s.motion.periodic ? s.period : null,
      playing: s.playing,
      time: roundTo(s.t, 1e-6),
      mark: roundTo(s.mark, 1e-6),
      clock: roundTo(counter.clock(s.t), 1e-6),
      count: counter.count,
      total: roundTo(counter.total, 1e-6),
      measured: counter.period == null ? null : roundTo(counter.period, 1e-6),
      laps: counter.laps.map((v) => roundTo(v, 1e-6)),
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = `${snap.example}|${snap.mark}|${snap.count}|${counter.started}|${snap.playing}`;
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    value: $('.pvc-result .v'),
    unit: $('.pvc-result .u'),
    totTerm: $('.pvc-t.tot'),
    tot: $('.pvc-t.tot b'),
    totLabel: $('.pvc-t.tot small'),
    cnt: $('.pvc-t.cnt b'),
    extra: $('.pm-extra'),
    status: $('.pvc-status span'),
    statusDot: $('.pvc-status'),
    playIcon: $('[data-act="play"] .pm-ic'),
    playLabel: $('[data-act="play"] .pm-lb'),
    tag: cap.querySelector('.pm-tag'),
    clockBox: cap.querySelector('.pm-clock'),
    clock: cap.querySelector('.pm-clock b'),
    clockUnit: cap.querySelector('.pm-clock small'),
  };

  function extraLine() {
    const id = s.example;
    if (!counter.started) return t(`intro_${id}`);
    if (!counter.count) return t(id === 'spring' ? 'started_spring' : id === 'heart' ? 'started_heart' : 'started');
    if (id === 'comet') return t('laps_comet');
    if (id === 'heart') return t('laps_heart');
    return t('laps');
  }

  function refresh() {
    const p = counter.period;
    el.value.textContent = p == null ? '–' : T(p);
    el.unit.textContent = unitWord();
    el.tot.textContent = T(counter.total);
    el.totLabel.textContent = `${t('total_long')} (${unitWord()})`;
    el.cnt.textContent = N(counter.count);
    el.extra.textContent = extraLine();
    const status = s.locked
      ? ['status_locked', 'locked']
      : !s.playing
        ? ['status_paused', 'idle']
        : counter.started
          ? ['status_count', 'contact']
          : ['status_wait', 'idle'];
    el.status.textContent = t(status[0]);
    el.statusDot.dataset.tone = status[1];
    el.playIcon.innerHTML = s.playing ? ICONS.pause : ICONS.play;
    el.playLabel.textContent = t(s.playing ? 'act_pause' : 'act_play');
    for (const b of ui.$$('[data-ex]')) {
      const on = b.dataset.ex === s.example;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    }
    el.tag.textContent = t(`shape_${s.example}`);
    el.tag.hidden = !s.show.tag;
    el.clockBox.hidden = !s.show.clock;
    el.clockUnit.textContent = unitWord();
    note.textContent = t(`note_${s.example}`, { k: 10, one: 1, y: 10, bpm: BPM(s.period) });
    note.hidden = !s.show.note;
    strip3d.hidden = !s.show.strip3d;
    learnStrip.setLabel(t('strip_label', { unit: unitWord() }));
    stageStrip.setLabel(t('strip_turns', { unit: unitWord() }));
    refreshClock();
    stage.invalidate();
  }
  /** The time strips: one bar per repetition, the running one growing at the right end. */
  function updateStrips() {
    const passes = counter.passes;
    const text = (v) => T(v);
    learnStrip.update({ passes, now: s.t, span: 4.6 * s.period, text });
    if (s.show.strip3d) stageStrip.update({ passes, now: s.t, span: 7 * s.period, text });
  }
  /** মোট সময় takes the clock's reading at a pass: it lights up for a moment. */
  function flashTotal() {
    el.totTerm.classList.remove('flash');
    void el.totTerm.offsetWidth; // restart the animation
    el.totTerm.classList.add('flash');
  }
  let clockText = '';
  function refreshClock() {
    const text = T(counter.clock(s.t));
    if (text !== clockText) el.clock.textContent = clockText = text;
  }

  // ── the mark, the velocity arrow and their labels ───────────────────────────
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const basis = new THREE.Matrix4();
  function toScreen(world, out = { x: 0, y: 0 }) {
    v1.copy(world).project(camera);
    out.x = (v1.x * 0.5 + 0.5) * stage.width;
    out.y = (-v1.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  const markWorld = () => cur().root.localToWorld(cur().markPose(s.mark).pos);
  /** The tip of the ghost at the mark: the velocity the particle has there. */
  function ghostTipWorld() {
    const ex = cur();
    const { pos, vel } = ex.markPose(s.mark);
    return ex.root.localToWorld(pos.addScaledVector(vel, ex.velocityScale));
  }

  /** The mark across the path, and the ghost of the velocity there (once the particle has passed). */
  function placeMark() {
    const ex = cur();
    const { pos, across, vel } = ex.markPose(s.mark);
    if (ex.mark.root) {
      const z = ex.normal;
      const x = across.clone().normalize();
      const y = v2.crossVectors(z, x).normalize();
      basis.makeBasis(x, y, z);
      ex.mark.root.quaternion.setFromRotationMatrix(basis);
      ex.mark.root.position.copy(pos);
      ex.mark.root.visible = s.show.mark;
    }
    if (ex.ghost) {
      ex.ghost.set(pos, vel.multiplyScalar(ex.velocityScale));
      ex.ghost.root.visible = ex.ghost.root.visible && s.show.arrow && s.show.mark && counter.started;
    }
    stage.invalidate();
  }
  /** The particle's own velocity arrow, riding with it (for the fan switched off, shorter as it slows). */
  function placeArrow(phase) {
    const ex = cur();
    if (!ex.arrow) return;
    const { pos, vel } = ex.markPose(phase);
    const h = 1e-3 * s.period;
    const t0 = Math.max(0, s.t - h);
    const rate = ((s.motion.cycles(s.t + h) - s.motion.cycles(t0)) / (s.t + h - t0)) * s.period; // 1 when periodic
    ex.arrow.set(pos, vel.multiplyScalar(ex.velocityScale * rate));
    ex.arrow.root.visible = ex.arrow.root.visible && s.show.arrow;
  }

  /** Labels: the mark (with the count), the velocity at the mark, the Sun, the ECG strip, each where it fits. */
  const measure = document.createElement('canvas').getContext('2d');
  let markSpot = null; // where the mark's label went: { dx, dy }
  function markText() {
    if (!counter.started) return t('mark');
    if (!counter.count) return t('mark_start');
    return t(s.example === 'heart' ? 'beat_n' : 'mark_n', { n: counter.count });
  }
  /** Rectangles (stage pixels) a label must keep off: the corner buttons, the strip in the test. */
  function keepOff() {
    const sr = ui.stage.getBoundingClientRect();
    return [ui.corner, strip3d]
      .filter((node) => !node.hidden)
      .map((node) => {
        const r = node.getBoundingClientRect();
        return { l: r.left - sr.left - 4, t: r.top - sr.top - 4, r: r.right - sr.left + 4, b: r.bottom - sr.top + 4 };
      });
  }
  const overlap = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
  /**
   * Try the directions in turn: the label goes to the first spot on screen that is free (of the caption, the
   * buttons, the arrow and other labels), and clear of the path if one can be. `along`: a direction on screen the
   * leader line must not run along. An optional label that finds no free spot is left out (null), not squeezed in.
   */
  function fitLabel(point, text, kind, dirs, dist, taken, { along = null, optional = false, path = [] } = {}) {
    const a = toScreen(point(), {});
    measure.font = `${kind === 'callout' ? 600 : 500} ${kind === 'callout' ? 14.5 : 14}px ${FONT}`;
    const w = measure.measureText(text).width + 24;
    const h = 28;
    const al = along && Math.hypot(...along) > 1 ? along.map((v) => v / Math.hypot(...along)) : null;
    const spots = [];
    for (const [ux, uy, far = 1] of dirs) {
      const k = 1 / (Math.hypot(ux, uy) || 1);
      if (al && (ux * al[0] + uy * al[1]) * k > 0.5) continue;
      const dx = ux * k * dist * far;
      const dy = uy * k * dist * far * 0.8;
      const anchor = dx < -4 ? 1 : dx > 4 ? 0 : 0.5;
      const box = { l: a.x + dx - w * anchor, t: a.y + dy - h / 2 };
      box.r = box.l + w;
      box.b = box.t + h;
      if (box.l >= 4 && box.t >= 4 && box.r <= stage.width - 4 && box.b <= stage.height - 4) spots.push({ dx, dy, box });
    }
    const free = (b) => !taken.some((r) => overlap(r, b));
    const clear = (b) => !path.some((q) => q.x > b.l && q.x < b.r && q.y > b.t && q.y < b.b);
    let pick = spots.find((sp) => free(sp.box) && clear(sp.box)) || spots.find((sp) => free(sp.box));
    if (!pick && optional) return null;
    if (!pick) {
      const k = 1 / (Math.hypot(dirs[0][0], dirs[0][1]) || 1);
      pick = spots[0] || { dx: dirs[0][0] * k * dist, dy: dirs[0][1] * k * dist * 0.8 };
    }
    if (pick.box) taken.push(pick.box);
    return pick;
  }
  const around = (u) => [u, [-u[1], u[0]], [u[1], -u[0]], [u[0], u[1], 2.2], [-u[1], u[0], 2.2], [u[1], -u[0], 2.2], [-u[0], -u[1], 1.6]];
  function placeLabels() {
    annotations.clear();
    markSpot = null;
    if (!s.show.labels) return;
    const ex = cur();
    ex.root.updateMatrixWorld(true);
    camera.updateMatrixWorld(); // the camera may have moved since the last frame
    const taken = keepOff();
    const path = ex.samples.filter((_, i) => i % 3 === 0).map((smp) => toScreen(v2.copy(smp.p).applyMatrix4(ex.root.matrixWorld), {}));
    const ghostShown = Boolean(ex.ghost?.root.visible);
    let along = null;
    if (ghostShown) {
      // no label on the arrow (or the mark) itself
      const a = toScreen(markWorld(), {});
      const b = toScreen(ghostTipWorld(), {});
      taken.push({ l: Math.min(a.x, b.x) - 10, t: Math.min(a.y, b.y) - 10, r: Math.max(a.x, b.x) + 10, b: Math.max(a.y, b.y) + 10 });
      along = [b.x - a.x, b.y - a.y];
    }
    // the first-use hand and its words sit at the mark for a moment: its label waits
    if (s.show.mark && !s.dragging && coach?.step !== 'object') {
      // away from the middle of the picture first, then to either side, then inside the path
      const m = toScreen(markWorld(), {});
      const c = toScreen(ex.root.localToWorld(ex.bounds.getCenter(v2)), {});
      let o = [m.x - c.x, m.y - c.y];
      if (s.example === 'heart' || Math.hypot(...o) < 1) o = [0.3, 1];
      const [ox, oy] = o;
      // beside the spring's straight path: right or left of it, not over the mass
      const dirs =
        s.example === 'spring'
          ? [
              [1, 0],
              [1, -0.7],
              [-1, 0],
              [-1, -0.7],
              [0, 1],
              [0, -1],
            ]
          : [o, [ox - oy, oy + ox], [ox + oy, oy - ox], [-oy, ox], [oy, -ox], [-ox, -oy], [0, 1], [0, -1], [-1, 0], [1, 0]];
      markSpot = fitLabel(markWorld, markText(), 'callout', dirs, 58, taken, { along, path });
      markLabel();
    }
    // the less important labels only where they fit: the velocity at the mark, then the Sun
    if (ghostShown) {
      const a = toScreen(markWorld(), {});
      const b = toScreen(ghostTipWorld(), {});
      const spot = fitLabel(ghostTipWorld, t('velocity_mark'), 'part', around([b.x - a.x, b.y - a.y]), 26, taken, { optional: true, path });
      if (spot) annotations.add('vel', { text: t('velocity_mark'), point: ghostTipWorld, dx: spot.dx, dy: spot.dy, kind: 'part' });
    }
    if (s.example === 'comet') {
      const spot = fitLabel(
        ex.sun,
        t('sun'),
        'part',
        [
          [0.6, 0.8],
          [-0.6, 0.8],
          [0.6, -0.8],
          [-0.6, -0.8],
          [-1, 0],
        ],
        50,
        taken,
        { optional: true, path },
      );
      if (spot) annotations.add('sun', { text: t('sun'), point: ex.sun, dx: spot.dx, dy: spot.dy, kind: 'part' });
    }
    if (s.example === 'heart') {
      const spot = fitLabel(
        ex.strip,
        t('ecg'),
        'part',
        // Beside a stacked strip; above a side-by-side strip, clear of the heart's apex.
        camera.aspect <= 1.25
          ? [
              [-1, 0],
              [-0.8, 0.5],
              [-0.6, -0.8],
            ]
          : [
              [0.15, -1],
              [0.7, -0.7],
              [-0.15, -1],
              [-0.6, -0.8],
            ],
        44,
        taken,
        { optional: true },
      );
      if (spot) annotations.add('ecg', { text: t('ecg'), point: ex.strip, dx: spot.dx, dy: spot.dy, kind: 'part' });
    }
  }
  /** The mark's label, with the latest count (same spot as before). */
  function markLabel() {
    if (!markSpot) return;
    annotations.add('mark', { text: markText(), point: markWorld, dx: markSpot.dx, dy: markSpot.dy, kind: 'callout', color: '#d9480f' });
  }

  // ── the motion ──────────────────────────────────────────────────────────────
  function pose() {
    const phase = frac(s.motion.cycles(s.t));
    cur().setPhase(phase, s.t, s.period);
    placeArrow(phase);
  }
  function onPass(tp, { silent = false } = {}) {
    const wasStarted = counter.started;
    counter.pass(tp);
    cur().mark.flash();
    cur().ghost?.flash();
    if (wasStarted && !silent) flashTotal();
    if (!silent) {
      if (s.example === 'heart') audio.contact();
      else audio.pop();
      emit('pass', { example: s.example, count: counter.count, time: roundTo(tp, 1e-6) });
    }
    if (!wasStarted) placeMark(); // the ghost of the velocity appears with the first pass
    if (s.show.labels) {
      if (!wasStarted) placeLabels();
      else markLabel();
    }
  }
  function advance(dtReal) {
    const t1 = s.t + dtReal;
    if (!s.dragging) for (const tp of passTimes(s.motion, s.t, t1, s.mark)) onPass(tp, { silent: !s.show.mark });
    s.t = t1;
    pose();
  }
  const progress = () => counter.count + (counter.started ? 0.5 : 0);
  let coachStep = null;
  stage.addTicker((dt) => {
    if ((coach?.step ?? null) !== coachStep) {
      coachStep = coach?.step ?? null;
      placeLabels(); // the mark's label comes back once the hand has gone
    }
    const markBusy = Boolean(cur().mark.tick(dt));
    const flashing = Boolean(cur().ghost?.tick(dt)) || markBusy;
    if (!s.playing) return flashing;
    const before = progress();
    advance(dt / spec().scale);
    if (progress() !== before) {
      refresh();
      emitChange();
    } else refreshClock();
    updateStrips();
    return true;
  });

  /** Jump to a time (since the example started), counting every pass on the way, as if it had run. */
  function jumpTo(time) {
    counter.reset();
    s.t = 0;
    for (const tp of passTimes(s.motion, -1e-9, Math.max(0, time), s.mark)) onPass(tp, { silent: true });
    s.t = Math.max(0, time);
    pose();
    placeMark();
    placeLabels();
    refresh();
    updateStrips();
  }

  function setExample(id, { animate = true } = {}) {
    if (!EXAMPLES[id]) return;
    cancelDrag();
    s.example = id;
    for (const ex of Object.values(examples)) ex.root.visible = ex.id === id;
    if (shadowFloor) shadowFloor.visible = cur().ground != null;
    const e = EXAMPLES[id];
    s.period = e.period;
    s.motion = linearMotion(e.period, e.phase0);
    s.mark = e.mark;
    s.t = 0;
    counter.reset();
    pose();
    placeMark();
    refresh();
    updateStrips();
    s.userMovedCamera = false;
    jumpCamera();
    placeLabels();
    if (animate) {
      const r = cur().root;
      tweener.animate({
        key: 'pop',
        duration: 0.4,
        ease: ease.outBack,
        onUpdate: (k) => {
          r.scale.setScalar(0.9 + 0.1 * k);
          stage.invalidate();
        },
      });
    } else cur().root.scale.setScalar(1);
    emit('example', { example: id });
    emitChange();
  }

  function setMark(phase, { quiet = false } = {}) {
    s.mark = frac(phase);
    counter.reset();
    placeMark();
    if (!s.dragging) placeLabels();
    else annotations.clear();
    refresh();
    if (!quiet) emitChange();
  }

  function setPlaying(on) {
    s.playing = Boolean(on);
    refresh();
    emitChange();
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const worldUp = new THREE.Vector3(0, 1, 0);
  /** Points that must be in the picture: the example's own, or the corners of its box. */
  function framePoints(ex) {
    if (ex.framePoints) return ex.framePoints;
    const b = ex.bounds;
    return Array.from({ length: 8 }, (_, i) => new THREE.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z));
  }
  /** Camera for a view: the example fills the frame under the caption and the corner buttons. */
  function viewPose(view) {
    const ex = cur();
    const dir = ex.views[view] || ex.views.front;
    const right = new THREE.Vector3().crossVectors(worldUp, dir).normalize();
    const up = new THREE.Vector3().crossVectors(dir, right).normalize();
    const pts = framePoints(ex);
    // the middle of the picture: halfway between the extreme points across and up the screen
    let [x0, x1, y0, y1, zs] = [Infinity, -Infinity, Infinity, -Infinity, 0];
    for (const p of pts) {
      x0 = Math.min(x0, p.dot(right));
      x1 = Math.max(x1, p.dot(right));
      y0 = Math.min(y0, p.dot(up));
      y1 = Math.max(y1, p.dot(up));
      zs += p.dot(dir);
    }
    const [cx, cy, cz] = [(x0 + x1) / 2, (y0 + y1) / 2, zs / pts.length];
    const center = new THREE.Vector3().addScaledVector(right, cx).addScaledVector(up, cy).addScaledVector(dir, cz);
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const tanH = tanV * camera.aspect;
    const H = Math.max(stage.height, 120);
    // keep the picture off the buttons at the top, and the strip (in the test) at the bottom
    const sr = ui.stage.getBoundingClientRect();
    const edge = (node, side) => (node.hidden ? 0 : node.getBoundingClientRect()[side] - sr.top);
    const top = Math.min(H * 0.34, edge(ui.corner, 'bottom') + 6);
    const lowest = Math.min(...[strip3d].filter((n) => !n.hidden).map((n) => edge(n, 'top')), H);
    const bottom = Math.min(H * 0.25, H - lowest + 4);
    const usable = (H - top - bottom) / H;
    let d = 0;
    for (const p of pts) {
      const z = p.dot(dir) - cz;
      d = Math.max(d, Math.abs(p.dot(right) - cx) / (tanH * 0.94) + z, Math.abs(p.dot(up) - cy) / (tanV * usable) + z);
    }
    d *= 1.02;
    // move the picture into the space between the top and bottom bands
    const perPx = (2 * d * tanV) / H;
    const target = center.addScaledVector(up, ((top - bottom) / 2) * perPx);
    return { target, position: target.clone().addScaledVector(dir, d), d };
  }
  function jumpCamera() {
    cur().arrange?.(camera.aspect > 1.25); // the heart puts its ECG beside it on a wide view
    const p = viewPose(s.view);
    tweener.cancel('camera');
    camera.near = p.d * 0.02;
    camera.far = p.d * 12;
    camera.updateProjectionMatrix();
    controls.minDistance = p.d * 0.45;
    controls.maxDistance = p.d * 2.6;
    camera.position.copy(p.position);
    controls.target.copy(p.target);
    controls.update();
    stage.invalidate();
  }
  function flyTo({ position, target }, duration = 0.7) {
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
      onComplete: () => placeLabels(),
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    controls.enablePan = false;
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    if (!animate) {
      jumpCamera();
      placeLabels();
      return Promise.resolve(true);
    }
    return flyTo(viewPose(s.view));
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  controls.addEventListener('end', () => placeLabels());
  stage.onResize(() => {
    if (!s.userMovedCamera && !tweener.busy) jumpCamera();
    placeLabels();
  });

  // ── moving the mark: press on the path (or the mark) and drag along it ──────
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const sp = { x: 0, y: 0 };
  /** The path sample nearest a canvas point, and how far it is (px). */
  function nearestSample(p) {
    const ex = cur();
    if (!ex.samples.length) return null;
    ex.root.updateMatrixWorld();
    camera.updateMatrixWorld();
    let best = null;
    let bd = Number.POSITIVE_INFINITY;
    for (const smp of ex.samples) {
      toScreen(v2.copy(smp.p).applyMatrix4(ex.root.matrixWorld), sp);
      const d = Math.hypot(sp.x - p.x, sp.y - p.y);
      if (d < bd) {
        bd = d;
        best = smp;
      }
    }
    return { sample: best, dist: bd };
  }
  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      coach?.interrupt();
      const p = canvasPoint(e);
      const reach = e.pointerType === 'mouse' ? 24 : 40;
      const hit = nearestSample(p);
      if (!hit || hit.dist > reach) {
        if (s.example === 'heart' && s.mode === 'explore' && !s.locked) heartTap(p);
        return; // the camera controls take it
      }
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      drag = { id: e.pointerId };
      s.dragging = true;
      coach?.objectUsed();
      try {
        ui.canvasHost.setPointerCapture(e.pointerId); // the finger keeps the mark even off the path
      } catch {
        // a pointer that is already gone (synthetic or cancelled): the drag still works while it moves
      }
      setMark(cur().phaseOfSample(hit.sample));
      audio.tick();
      emit('dragstart', { mark: s.mark });
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return hover(e);
    if (s.locked) return cancelDrag();
    const hit = nearestSample(canvasPoint(e));
    if (!hit) return;
    const phase = cur().phaseOfSample(hit.sample);
    if (Math.abs(phase - s.mark) > 1e-9) {
      setMark(phase, { quiet: true });
      audio.tick();
    }
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    drag = null;
    s.dragging = false;
    coach?.objectReleased();
    placeLabels();
    showHint(t('hint_new_mark'), { duration: 2600 });
    emit('dragend', { mark: s.mark });
    emitChange();
  }
  /** Drop a drag at once (the test starts, the example changes): no hint, no new count. */
  function cancelDrag() {
    if (!drag) return;
    try {
      ui.canvasHost.releasePointerCapture(drag.id);
    } catch {
      // already released
    }
    drag = null;
    s.dragging = false;
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);
  let hoverQueued = false;
  function hover(e) {
    if (e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
      const hit = nearestSample(p);
      ui.canvasHost.style.cursor = hit && hit.dist <= 24 ? (s.locked ? 'not-allowed' : 'grab') : '';
    });
  }
  let heartHinted = 0;
  function heartTap(p) {
    const m = toScreen(examples.heart.particle(), {});
    if (Math.abs(p.x - m.x) < 60 && performance.now() - heartHinted > 4000) {
      heartHinted = performance.now();
      showHint(t('hint_heart'), { duration: 3200 });
    }
  }

  /** Arrow keys: the mark one step along the path. */
  function stepMark(dir) {
    const ex = cur();
    if (!ex.samples.length || s.locked) return;
    const n = ex.samples.length;
    let idx = 0;
    let bd = Number.POSITIVE_INFINITY;
    ex.samples.forEach((smp, i) => {
      const ph = ex.phaseOfSample(smp);
      const d = Math.min(Math.abs(ph - s.mark), 1 - Math.abs(ph - s.mark));
      if (d < bd) {
        bd = d;
        idx = i;
      }
    });
    const step = Math.max(1, Math.round(n / 40));
    const closed = s.example !== 'spring';
    let next = idx + dir * step;
    next = closed ? ((next % n) + n) % n : Math.min(n - 1, Math.max(0, next));
    coach?.objectUsed();
    setMark(ex.phaseOfSample(ex.samples[next]));
    audio.tick();
  }

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
  const numLabel = (unit) => (v) => `${N(fmtNum(v))}<small>${unit}</small>`;
  const textLabel = (list) => (i) => `<span class="pm-txt">${list[i]}</span>`;
  /** Four text choices, the right one among three wrong ones, shuffled. */
  function textChoices(right, wrong) {
    const list = shuffle([right, ...wrong]);
    return { choices: [0, 1, 2, 3], expected: list.indexOf(right), tolerance: 0.5, label: textLabel(list) };
  }

  /** Set the scene for a question: an example, what it shows, and how it moves; always seen from the front. */
  function scene3(id, { show = {}, mark, motion, period, time = 0 } = {}) {
    if (s.view !== 'front') setView('front', { animate: false }); // a circle seen at a slant looks like an ellipse
    s.show = { ...ALL_SHOWN, ...show };
    setExample(id, { animate: false });
    if (period) s.period = period;
    if (motion) s.motion = motion;
    if (mark != null) s.mark = mark;
    s.playing = true;
    jumpTo(time);
    jumpCamera();
  }

  const COMPUTE = [
    { ex: 'fan', key: 'q_compute_fan', unit: 's', T: [0.2, 0.25, 0.5], n: [10, 20, 40] },
    { ex: 'spring', key: 'q_compute_spring', unit: 's', T: [0.6, 0.8, 1.2, 1.5], n: [10, 20] },
    { ex: 'comet', key: 'q_compute_comet', unit: 'yr', T: [76], n: [2, 3, 4] },
  ];
  let kinds = [];
  let question = null;
  let saved = null;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    hooks: {
      enter() {
        cancelDrag();
        saved = { example: s.example, mark: s.mark, playing: s.playing, view: s.view };
        s.mode = 'quiz';
        s.locked = true;
        hideHint();
        kinds = shuffle(['compute', 'shape', 'velocity', 'slowing', pickOne(['heart', 'which'])]);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.show = { ...ALL_SHOWN };
        syncUI();
        if (saved) {
          setExample(saved.example, { animate: false });
          setMark(saved.mark);
          setPlaying(saved.playing);
          if (saved.view !== s.view) setView(saved.view, { animate: false });
        }
      },
      async prepare(i, _alive, say) {
        const kind = kinds[i % kinds.length];
        s.locked = true;
        if (kind === 'compute') {
          const v = pickOne(COMPUTE);
          const period = pickOne(v.T);
          const n = pickOne(v.n);
          const total = roundTo(period * n, 0.01);
          // it moves with the question's period, so the picture and the numbers agree
          scene3(v.ex, { period, motion: linearMotion(period, EXAMPLES[v.ex].phase0), show: { clock: false, labels: false, arrow: false } });
          const unit = t(v.unit === 'yr' ? 'unit_yr' : 'unit_s');
          question = { kind, total, n, period, unit };
          say(t(v.key, { t: fmtNum(total), n }));
          return {
            choices: shuffle([period, ...periodMistakes(total, n)]),
            expected: period,
            tolerance: period * 0.001,
            label: numLabel(unit),
            meta: { kind, example: v.ex, total, n },
          };
        }
        if (kind === 'shape') {
          const id = pickOne(['fan', 'comet', 'spring']);
          scene3(id, { show: { tag: false, clock: false, mark: false, arrow: false, labels: false } });
          question = { kind, id };
          say(t('q_shape'));
          const right = { fan: 'shape_circle', comet: 'shape_ellipse', spring: 'shape_line' }[id];
          const names = ['shape_circle', 'shape_ellipse', 'shape_line', 'shape_zigzag'].map((k) => t(k));
          const c = textChoices(
            t(right),
            names.filter((n) => n !== t(right)),
          );
          return { ...c, meta: { kind, example: id } };
        }
        if (kind === 'velocity') {
          const id = pickOne(['comet', 'comet', 'spring']);
          const mark = id === 'comet' ? pickOne([0.04, 0.96]) : 0.3; // the comet near the Sun, where the arrow is long
          const e = EXAMPLES[id];
          // start just after the particle passed the mark, so the arrow shows its velocity there
          const time = (frac(mark - e.phase0) + 0.02) * e.period;
          scene3(id, { mark, time, show: { clock: false } });
          question = { kind, id };
          say(t(`q_velocity_${id}`));
          const c = textChoices(t('v_same'), [t('v_more'), t('v_less'), t('v_zero')]);
          return { ...c, meta: { kind, example: id, mark } };
        }
        if (kind === 'slowing') {
          const e = EXAMPLES.fan;
          const motion = slowingMotion(e.period, e.phase0, 1.5);
          // after the fifth pass of the mark: four turns, each slower than the one before
          const time = motion.timeAt(Math.ceil(e.phase0 - e.mark) + e.mark + 4) + 0.01;
          scene3('fan', { motion, time, show: { clock: false, note: false, arrow: false, labels: false, strip3d: true } });
          question = { kind };
          say(t('q_slowing'));
          const c = textChoices(t('s_no'), [t('s_not_stopped'), t('s_circle'), t('s_same_path')]);
          return { ...c, meta: { kind } };
        }
        if (kind === 'heart') {
          const bpm = pickOne([72, 75, 80, 100]);
          const period = 60 / bpm;
          scene3('heart', { period, motion: linearMotion(period, EXAMPLES.heart.phase0), show: { clock: false, labels: false } });
          question = { kind, bpm, period };
          say(t('q_heart', { bpm, one: 1 }));
          return {
            choices: shuffle([period, ...heartMistakes(bpm)]),
            expected: period,
            tolerance: 0.0005,
            label: numLabel(t('unit_s')),
            meta: { kind, bpm },
          };
        }
        // which motion is periodic
        scene3('fan', { show: { labels: false, clock: false, arrow: false } });
        const right = t(pickOne(['p_second_hand', 'p_minute_hand', 'p_earth']));
        const wrong = shuffle(['n_stone', 'n_ball', 'n_car', 'n_mango', 'n_kite'].map((k) => t(k))).slice(0, 3);
        question = { kind, right };
        say(t('q_which'));
        return { ...textChoices(right, wrong), meta: { kind } };
      },
      reveal() {
        const q = question;
        s.show.tag = true; // the path's name, hidden while it was the question
        refresh();
        if (q.kind === 'compute') return t('w_compute', { t: fmtNum(q.total), n: q.n, T: fmtNum(q.period), unit: q.unit });
        if (q.kind === 'shape') return t(`w_shape_${q.id}`);
        if (q.kind === 'velocity') return t('w_velocity');
        if (q.kind === 'slowing') return t('w_slowing');
        if (q.kind === 'heart') {
          const exact = Math.abs(roundTo(q.period, 0.01) - q.period) < 1e-9;
          return t('w_heart', { bpm: q.bpm, T: fmtNum(q.period), one: 1, s60: 60, eq: exact ? '=' : '≈' });
        }
        return t('w_which', { p: q.right });
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── first-use pointer: on the mark ──────────────────────────────────────────
  if (o.coach) {
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint, cap],
      object: {
        label: 'coach_mark',
        candidates: () => (cur().samples.length && s.show.mark ? [toScreen(markWorld(), {})] : []),
        grabbable: (p) => {
          const hit = nearestSample(p);
          return Boolean(hit && hit.dist < 30);
        },
        // the mark lights up twice, as if it says "here"
        async demo(alive) {
          for (let i = 0; i < 2 && alive(); i++) {
            cur().mark.flash();
            stage.invalidate();
            await new Promise((r) => setTimeout(r, 650));
          }
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
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.ex && b.dataset.ex !== s.example) setExample(b.dataset.ex);
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
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const inQuiz = s.mode === 'quiz';
    if (k === ' ' && !target.closest('button') && !inQuiz) setPlaying(!s.playing);
    else if ((k === 'arrowright' || k === 'arrowdown') && !inQuiz) stepMark(1);
    else if ((k === 'arrowleft' || k === 'arrowup') && !inQuiz) stepMark(-1);
    else if (/^[1-4]$/.test(k) && !inQuiz) setExample(EXAMPLE_IDS[Number(k) - 1]);
    else if (k === 'p' && !inQuiz) setPlaying(!s.playing);
    else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  controls.enableRotate = s.view === '3d';
  controls.enablePan = false;
  setExample(s.example, { animate: false });
  if (Number(o.time) > 0) jumpTo(Number(o.time));
  syncUI();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    else coach?.start(1400);
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
     * Change any of: example ('fan' | 'comet' | 'spring' | 'heart', starts it from the beginning), mark (where the
     * mark is, as the fraction of a period after the start point: 0 = top of the circle / perihelion / top of the
     * swing / just before the P wave), time (jump to this time since the example started, in its unit, counting
     * the passes on the way), playing, view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.example && EXAMPLES[p.example]) setExample(p.example, { animate });
      if (p.mark != null && Number.isFinite(Number(p.mark))) setMark(Number(p.mark));
      if (p.time != null && Number.isFinite(Number(p.time))) jumpTo(Number(p.time));
      if (p.playing != null) setPlaying(p.playing);
      if (p.view) await setView(p.view, { animate });
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      hideHint();
      s.show = { ...ALL_SHOWN };
      s.playing = true;
      setExample('fan', { animate: false });
      await setView('front', { animate: false });
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture(opts = {}) {
      const background = scene.background;
      if (opts.background !== undefined) scene.background = null;
      try {
        return stage.capture(opts);
      } finally {
        scene.background = background;
        stage.invalidate();
      }
    },
    exportRoot: () => cur().model,
  };
}
