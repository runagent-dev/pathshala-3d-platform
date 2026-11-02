// Linear motion: the falling ball (book page 36, topic 2.2), student view: a cricket ball on a lab stand over a
// carrom board. Let the ball go (ছেড়ে দাও) or throw it sideways (ছুড়ে দাও). Each motion leaves faint pictures at
// equal time steps and a dotted path, then a dashed straight line is laid through its ends: the free fall lies on it
// (সরলরৈখিক গতি, even though the ball speeds up), the sideways throw curves away from it (not linear). Then a short
// test. Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createAudio } from '@shared/student/audio.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createCoach } from '@shared/student/coach.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { ICONS, svg } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { createCarrom } from './carrom.js';
import { createBall, createStand } from './stand.js';
import { COLORS, createArrow, createTrace } from './trace.js';
import { fitPose } from './camera.js';
import { BALL, BOARD, fallTime, farthestIndex, flightAt, isStraight, maxDeviation, round, strobeTimes } from './motion.js';

export const DEFAULTS = {
  example: 'drop', // 'drop' | 'throw'
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const EXAMPLES = ['drop', 'throw'];
// how the stand is looked at: the front view's elevation follows the stage's shape (degrees, portrait … wide: a
// wide, short stage looks lower, so the board fills more of its height); the rotate view starts from the side
const ELEVATION = [23, 15];
const VIEW_3D = new THREE.Vector3(0.62, 0.55, 0.9);
// what must be in the frame
const BOX = new THREE.Box3(new THREE.Vector3(-0.47, 0, -0.3), new THREE.Vector3(0.445, BOARD.surface + BALL.height + 0.08, 0.445));
const CHIP_ICONS = {
  drop: svg('<circle cx="12" cy="5.5" r="3"/><path d="M12 11v9.5M9 17.5l3 3 3-3"/>'),
  throw: svg('<circle cx="5.5" cy="6" r="3"/><path d="M10 6c5 0 8.6 4.6 9 13.5M16.6 17l2.4 3 2.2-3.1"/>'),
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'lm');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side', // the panel beside the 3D on landscape frames (kit 1.5.0)
    learn: `
          <div class="lm-chips" role="radiogroup" aria-label="${t('examples')}">${EXAMPLES.map(
            (ex) => `<button role="radio" data-ex="${ex}">${CHIP_ICONS[ex]}<span>${t(`ex_${ex}`)}</span></button>`,
          ).join('')}</div>
          <div class="lm-acts">
            <button class="pvc-btn primary" data-act="go">${ICONS.play}<span></span></button>
            <button class="pvc-btn" data-act="clear">${ICONS.reset}<span>${t('act_clear')}</span></button>
          </div>
          <div class="lm-verdict" data-state="rule" aria-live="polite">
            <span class="lm-path"><small>${t('path_label')}</small><b></b></span><span class="lm-res"><i class="lm-to">→</i><span class="lm-kind"><b></b><em aria-hidden="true"></em></span></span>
          </div>
          <p class="lm-extra"></p>`,
  });
  const slowBadge = document.createElement('div');
  slowBadge.className = 'lm-slow';
  slowBadge.textContent = t('slow', { k: BALL.slow });
  ui.stage.append(slowBadge);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 60, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  // A soft, slightly muted backdrop (the owner: vivid means calm and beautiful, never eye-popping).
  const backdropCanvas = document.createElement('canvas');
  backdropCanvas.width = 8;
  backdropCanvas.height = 256;
  const backdropContext = backdropCanvas.getContext('2d');
  const backdropGradient = backdropContext.createLinearGradient(0, 0, 0, 256);
  backdropGradient.addColorStop(0, '#c3d1df');
  backdropGradient.addColorStop(1, '#e8ddcc');
  backdropContext.fillStyle = backdropGradient;
  backdropContext.fillRect(0, 0, 8, 256);
  const backdrop = new THREE.CanvasTexture(backdropCanvas);
  backdrop.colorSpace = THREE.SRGBColorSpace;
  scene.background = o.bg === 'transparent' ? null : backdrop;
  controls.minDistance = 0.4;
  controls.maxDistance = 8;
  controls.enablePan = false;
  const M = createMaterials(stage.renderer);
  const world = new THREE.Group();
  world.name = 'LinearMotion';
  scene.add(world);
  const carrom = createCarrom({ materials: M });
  const stand = createStand({ materials: M });
  const ball = createBall();
  world.add(carrom.root, stand.root, ball.root);
  ball.root.position.copy(stand.ballHome);
  carrom.striker.visible = false; // the board is only the table the stand stands on

  const ballGhost = new THREE.SphereGeometry(BALL.r, 20, 14);
  const traces = {
    drop: createTrace({ name: 'DropTrace', ghostGeometry: ballGhost, maxGhosts: 12 }),
    throw: createTrace({ name: 'ThrowTrace', ghostGeometry: ballGhost, maxGhosts: 12 }),
  };
  for (const tr of Object.values(traces)) world.add(tr.group);
  const throwArrow = createArrow();
  throwArrow.group.userData.noExport = true;
  world.add(throwArrow.group);

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const anno = createAnnotations({ stage, layer: ui.annoLayer });

  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight(0xffffff, 0.35);
    sun.position.set(0.5, 4, 2.4);
    sun.target.position.set(-0.1, 0, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -1.1, right: 1.1, top: 1.1, bottom: -1.1, near: 2, far: 7 });
    sun.shadow.radius = 8;
    sun.shadow.bias = -0.0004;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.12 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.userData.noExport = true;
    scene.add(sun, sun.target, floor);
  }
  for (const obj of [carrom.root, stand.root, ball.root])
    obj.traverse((m) => {
      if (m instanceof THREE.Mesh && m.material && !m.material.transparent && m.material.visible !== false) m.castShadow = true;
    });

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    example: EXAMPLES.includes(o.example) ? o.example : 'drop',
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    runs: { drop: null, throw: null }, // the last motion of each example (see makeRun)
    ballFrom: null, // the example whose motion moved the ball off its holder (null: the ball is on the holder)
    userMovedCamera: false,
  };
  const now = () => performance.now();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ── the motions ─────────────────────────────────────────────────────────────

  /**
   * One motion, worked out in full when it starts (deterministic in time): where the object is at time t (real
   * seconds), the strobe pictures (centres every `step` s), the dotted path (about every centimetre), the line it is
   * checked against, and whether it is straight.
   */
  function makeRun(kind) {
    const vx = kind === 'throw' ? BALL.vx : 0;
    const home = stand.ballHome;
    const T = fallTime();
    const step = BALL.step;
    const slow = BALL.slow;
    const centre = (tt, out) => {
      const f = flightAt(tt, vx);
      return out.set(home.x + f.x, home.y + f.y, home.z);
    };
    const mark = centre;
    const place = (tt) => centre(tt, ball.root.position);
    const ghosts = strobeTimes(T, step).map((tt) => ({ t: tt, p: centre(tt, new THREE.Vector3()) }));
    // the dotted path: dense samples in time, kept about every centimetre along the path
    const dots = [];
    const q = new THREE.Vector3();
    let last = null;
    for (let i = 0; i <= 400; i++) {
      const tt = (T * i) / 400;
      mark(tt, q);
      if (!last || q.distanceTo(last) >= 0.0095 || i === 400) {
        dots.push({ t: tt, p: q.clone() });
        last = dots[dots.length - 1].p;
      }
    }
    const start = mark(0, new THREE.Vector3());
    const end = mark(T, new THREE.Vector3());
    const deviation = maxDeviation(
      dots.map((d) => d.p),
      start,
      end,
    );
    const linear = isStraight(dots.map((d) => d.p));
    // the widest gap from the line, for the bracket of a curved path
    let far = null;
    let foot = null;
    if (!linear) {
      far =
        dots[
          farthestIndex(
            dots.map((d) => d.p),
            start,
            end,
          )
        ].p.clone();
      const dir = new THREE.Vector3().subVectors(end, start).normalize();
      foot = start.clone().addScaledVector(dir, new THREE.Vector3().subVectors(far, start).dot(dir));
    }
    let landed;
    return {
      kind,
      T,
      slow,
      step,
      place,
      path: { ghosts, dots, start, end },
      start,
      end,
      deviation,
      linear,
      far,
      foot,
      t0: 0,
      state: 'ready', // 'ready' | 'moving' | 'landed' | 'judged'
      judge: true,
      shown: 0,
      landed: new Promise((r) => (landed = r)),
      resolveLanded: () => landed(true),
    };
  }

  function summary(run) {
    if (!run) return null;
    return {
      state: run.state,
      linear: run.state === 'judged' ? run.linear : null,
      deviation: round(run.deviation, 3), // m: largest distance of the path from the straight line
      duration: round(run.T, 3), // s of real time
      distance: round(run.start.distanceTo(run.end), 3), // m from start to end
      pictures: run.path.ghosts.length,
      step: run.step,
    };
  }

  function snapshot() {
    const run = s.runs[s.example];
    return {
      example: s.example,
      phase: !run ? 'ready' : run.state === 'judged' ? 'done' : run.state, // 'moving' | 'landed'
      path: run?.state === 'judged' ? (run.linear ? 'straight' : 'curved') : null,
      linear: run?.state === 'judged' ? run.linear : null,
      ball: { x: round(ball.root.position.x, 3), y: round(ball.root.position.y - BOARD.surface, 3), onHolder: s.ballFrom == null },
      runs: { drop: summary(s.runs.drop), throw: summary(s.runs.throw) },
      view: s.view,
      mode: s.mode,
    };
  }

  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.example, snap.phase, snap.runs]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  /** Puts the ball back on its holder (door closed, plunger in); animated, it pops up there. */
  function ballHome({ animate = false } = {}) {
    s.ballFrom = null;
    for (const key of ['door', 'plunger', 'plunger-back']) tweener.cancel(key);
    stand.setDoor(0);
    stand.setPlunger(0);
    ball.root.position.copy(stand.ballHome);
    if (!animate) {
      ball.root.scale.setScalar(1);
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'ball-home',
      duration: 0.3,
      ease: ease.outBack,
      onUpdate: (k) => {
        ball.root.scale.setScalar(Math.max(0.001, k));
        stage.invalidate();
      },
    }).finished;
  }

  /** Forgets an example's motion and its marks (the object stays where it is). */
  function forget(kind) {
    s.runs[kind]?.resolveLanded();
    s.runs[kind] = null;
    traces[kind].clear();
  }
  /** Forgets an example's motion: its marks go, its object goes back. */
  function clearRun(kind) {
    const moving = s.runs[kind]?.state === 'moving';
    forget(kind);
    if (s.ballFrom === kind || moving) ballHome();
  }

  /** Starts a motion (the object must already be where it starts). judge: lay the straight line when it lands. */
  function startRun(kind, opts = {}, { judge = true, animate = true } = {}) {
    const old = s.runs[kind];
    if (old) old.resolveLanded();
    // the ball has one holder: a drop and a throw cannot both be in the air
    const other = kind === 'drop' ? 'throw' : 'drop';
    if (s.runs[other]?.state === 'moving') land(s.runs[other], { animate: false });
    s.ballFrom = kind;
    const run = makeRun(kind, opts);
    run.judge = judge;
    s.runs[kind] = run;
    traces[kind].set(run.path);
    traces[kind].show(-1);
    removeLabels();
    if (!animate) {
      land(run, { animate: false });
      return run;
    }
    run.state = 'moving';
    run.t0 = now();
    // the door swings down at once, faster than the ball falls (the ball is let go); a throw also gets the plunger's push
    tweener.animate({ key: 'door', duration: 0.22, ease: ease.outCubic, onUpdate: (k) => stand.setDoor(k) });
    if (kind === 'throw') {
      // the plunger keeps pace with the slowed-down ball (in real time its push lasts about 0.07 s)
      tweener.animate({ key: 'plunger', duration: 0.07 * run.slow, ease: ease.outCubic, onUpdate: (k) => stand.setPlunger(k) });
      tweener.animate({ key: 'plunger-back', delay: 1, duration: 0.4, onUpdate: (k) => stand.setPlunger(1 - k) });
      showThrowArrow(0.7);
    }
    audio.pop();
    emit('start', { example: kind, ...summary(run) });
    refresh();
    emitChange();
    return run;
  }

  /** The motion is over: everything at its end; then (judge) the straight line is drawn. */
  function land(run, { animate = true } = {}) {
    run.place(run.T);
    traces[run.kind].show(Number.POSITIVE_INFINITY);
    stand.setDoor(1);
    if (run.kind === 'throw') stand.setPlunger(0);
    run.state = 'landed';
    run.resolveLanded();
    if (animate) audio.contact();
    if (run.judge) judgeRun(run, { animate });
    refresh();
    emitChange();
  }

  /** Lays the dashed straight line through the path's ends; a curved path also gets its widest gap marked. */
  function judgeRun(run, { animate = true } = {}) {
    if (run.state === 'judged') return Promise.resolve(true);
    const tr = traces[run.kind];
    const finish = () => {
      if (s.runs[run.kind] !== run) return;
      tr.line(1);
      if (!run.linear) tr.gap(run.far, run.foot);
      run.state = 'judged';
      if (run.kind === s.example) showLabels();
      if (animate) (run.linear ? audio.success : audio.tick)();
      emit('done', { example: run.kind, ...summary(run) });
      refresh();
      emitChange();
    };
    if (!animate) {
      finish();
      return Promise.resolve(true);
    }
    return tweener
      .animate({
        key: `line-${run.kind}`,
        duration: 0.6,
        ease: ease.inOutSine,
        onUpdate: (k) => {
          if (s.runs[run.kind] === run) tr.line(k);
          stage.invalidate();
        },
      })
      .finished.then(finish);
  }

  stage.addTicker(() => {
    let busy = false;
    for (const kind of EXAMPLES) {
      const run = s.runs[kind];
      if (run?.state !== 'moving') continue;
      const tt = (now() - run.t0) / 1000 / run.slow;
      if (tt >= run.T) {
        land(run);
        continue;
      }
      run.place(tt);
      const n = traces[kind].show(tt);
      if (n > run.shown) {
        run.shown = n;
        audio.tick();
      }
      busy = true;
    }
    return busy;
  });

  // ── what the student does ───────────────────────────────────────────────────
  /**
   * The main action of an example: let the ball go, or throw it. animate: false jumps to the end (line drawn).
   * quiet: the test does it (not the student). Returns the motion (null if overtaken).
   */
  let goToken = 0;
  async function go(kind = s.example, { animate = true, judge = true, quiet = false } = {}) {
    if (s.locked && !quiet) return lockedNudge();
    const my = ++goToken;
    // still wanted after a wait? (not overtaken, not cancelled, and the student's own action not now inside the test)
    const wanted = () => my === goToken && (quiet || !s.locked);
    if (!quiet) coach?.objectUsed();
    for (const k of EXAMPLES) if (s.runs[k]?.state === 'moving') land(s.runs[k], { animate: false });
    forget(kind);
    if (s.ballFrom != null) {
      await ballHome({ animate });
      if (animate) await wait(250);
      if (!wanted()) return null;
    }
    const run = startRun(kind, {}, { judge, animate });
    if (!quiet) coach?.objectReleased();
    return run;
  }
  /** Calls off a drop still winding up (the ball going back on its holder). */
  function cancelPending() {
    goToken++;
  }

  /** The plunger's push on the ball, as an arrow for a moment. */
  let throwArrowTimer = 0;
  const throwTail = new THREE.Vector3();
  function showThrowArrow(seconds) {
    // at the ball's height, just in front of the plunger, pointing at the ball
    const tip = stand.plungerTip;
    throwTail.set(tip.x - 0.085, tip.y, tip.z + BALL.r + 0.012);
    throwArrow.set(throwTail, new THREE.Vector3(1, 0, 0), 0.08);
    anno.add('throw-push', { text: t('label_push'), point: () => throwTail, dx: -6, dy: 24, kind: 'callout', color: COLORS.push });
    clearTimeout(throwArrowTimer);
    throwArrowTimer = setTimeout(() => {
      throwArrow.hide();
      anno.remove('throw-push');
      stage.invalidate();
    }, seconds * 1000);
  }

  // ── labels on the scene ─────────────────────────────────────────────────────
  const labelPoints = {
    line: new THREE.Vector3(),
    gap: new THREE.Vector3(),
  };
  function removeLabels() {
    for (const id of ['line', 'gap']) anno.remove(id);
  }
  /** The labels of the current example: the straight line (and gap) after the motion. */
  /** The gap's label, right of the bracket (dx > 0) or left of it. */
  function addGapLabel(dx) {
    const run = s.runs.throw;
    anno.add('gap', {
      text: `<span class="lm-gap">${t('label_gap', { cm: Math.round(run.deviation * 100) })}</span>`,
      point: () => labelPoints.gap,
      dx,
      dy: -10,
      kind: 'callout',
      color: COLORS.gap,
    });
  }
  // on small stages the gap's label can land under the slow-motion note: then it goes left of the bracket
  let gapLeft = false;
  stage.onAfterRender(() => {
    if (gapLeft || flying || slowBadge.hidden || !anno.has('gap')) return;
    const label = ui.annoLayer.querySelector('.lm-gap')?.parentElement?.getBoundingClientRect();
    const note = slowBadge.getBoundingClientRect();
    if (!label?.width) return;
    if (label.right > note.left && label.left < note.right && label.bottom > note.top && label.top < note.bottom) {
      gapLeft = true;
      addGapLabel(-54);
    }
  });
  function showLabels() {
    removeLabels();
    gapLeft = false;
    const run = s.runs[s.example];
    if (run?.state !== 'judged') return;
    if (run.kind === 'drop') {
      labelPoints.line.lerpVectors(run.start, run.end, 0.3);
      anno.add('line', { text: t('label_line'), point: () => labelPoints.line, dx: 64, dy: 0, kind: 'callout', color: COLORS.line });
    } else {
      // the chord's label right of where the ball lands (left of the chord is the drop's line)
      labelPoints.line.lerpVectors(run.start, run.end, 0.93);
      anno.add('line', { text: t('label_line'), point: () => labelPoints.line, dx: 50, dy: 14, kind: 'callout', color: COLORS.line });
      labelPoints.gap.lerpVectors(run.far, run.foot, 0.5);
      addGapLabel(54);
    }
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    chips: ui.$$('[data-ex]'),
    verdict: $('.lm-verdict'),
    path: $('.lm-path b'),
    kind: $('.lm-kind b'),
    mark: $('.lm-kind em'),
    extra: $('.lm-extra'),
    goLabel: $('[data-act="go"] span'),
  };

  function refresh() {
    const run = s.runs[s.example];
    const state = !run ? 'rule' : run.state !== 'judged' ? 'moving' : run.linear ? 'straight' : 'curved';
    el.verdict.dataset.state = state;
    el.path.textContent = t({ rule: 'rule_path', moving: 'path_moving', straight: 'path_straight', curved: 'path_curved' }[state]);
    el.kind.textContent = state === 'moving' ? '' : t({ rule: 'rule_kind', straight: 'kind_linear', curved: 'kind_not' }[state]);
    el.mark.textContent = state === 'straight' ? '✓' : state === 'curved' ? '✗' : '';
    const dt = BALL.step;
    el.extra.textContent =
      state === 'straight' || state === 'curved' ? t(`done_${s.example}`, { dt, cm: Math.round(run.deviation * 100) }) : t(`say_${s.example}`);
    el.goLabel.textContent = t(`act_${s.example}`);
    for (const c of el.chips) {
      const on = c.dataset.ex === s.example;
      c.classList.toggle('on', on);
      c.setAttribute('aria-checked', String(on));
    }
    stage.invalidate();
  }

  /** Switches the example: the camera goes to it; a motion still running jumps to its end. */
  async function setExample(ex, { animate = true } = {}) {
    if (!EXAMPLES.includes(ex)) return;
    cancelPending();
    for (const kind of EXAMPLES) if (s.runs[kind]?.state === 'moving') land(s.runs[kind], { animate: false });
    const changed = ex !== s.example;
    s.example = ex;
    // the throw keeps the drop's marks, greyed, for comparison (same ball, same height: straight vs curved)
    traces.throw.group.visible = ex === 'throw';
    traces.drop.faded(ex === 'throw');
    // the ball goes back on its holder unless it lies where this example's motion left it
    if (s.ballFrom !== null && s.ballFrom !== ex) ballHome({ animate });
    showLabels();
    refresh();
    if (changed) {
      emit('example', { example: ex });
      emitChange();
    }
    s.userMovedCamera = false;
    return flyTo(viewPose(), animate ? 0.8 : 0);
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  function viewDir(view) {
    if (view === '3d') return VIEW_3D;
    const wide = Math.min(1, Math.max(0, (stage.width / Math.max(1, stage.height) - 0.95) / 0.75)); // 0 portrait … 1 wide
    const [tall, flat] = ELEVATION;
    const e = THREE.MathUtils.degToRad(tall + (flat - tall) * wide);
    return new THREE.Vector3(0, Math.sin(e), Math.cos(e));
  }
  function viewPose(view = s.view) {
    const fit = (margin) => fitPose({ box: BOX, dir: viewDir(view), camera, width: stage.width, height: stage.height, margin });
    // the tall parts (the stand, the ball's path) are on the left: the corner buttons on the right leave them be
    if (view === 'front') return fit({ top: 22, bottom: 16, side: 12 });
    return fit({ top: 16, bottom: 16, side: 12 });
  }
  let flying = false; // the camera is on its way (labels are not where they will be)
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
    flying = true;
    const flight = tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, target, k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
    flight.then(() => {
      flying = false;
      stage.invalidate();
    });
    return flight;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(viewPose(), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => !s.userMovedCamera && flyTo(viewPose(), 0));

  // ── touching the scene: a tap on the ball (or its stand) lets it go ──────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  /** Does a finger at canvas point p take the ball? */
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(stand.hit, false).length > 0 || raycaster.intersectObject(ball.root, true).length > 0;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      coach?.interrupt();
      if (!pick(canvasPoint(e))) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      go(s.example); // it acts as the finger goes down
    },
    true,
  );
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
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
  // the right answer first; the others are the usual mistakes
  const WATCH = {
    drop: ['c_yes_straight', 'c_no_faster', 'c_no_down', 'c_yes_fast'],
    throw: ['c_no_curved', 'c_yes_thrown_straight', 'c_yes_lands', 'c_no_faster'],
  };
  const SPACING = ['sp_faster_linear', 'sp_faster_not', 'sp_slower_linear', 'sp_curved_not'];
  const LINEAR = ['mango', 'car', 'box', 'lift'];
  const NOT_LINEAR = ['fan', 'swing', 'clock', 'catch'];
  const DEFINE = ['df_line', 'df_speed', 'df_down', 'df_round'];

  /** Four tap choices from string keys (the right one first): shuffled, with the index of the right one. */
  function textChoices(keys, kind, extra = {}) {
    const list = shuffle([...keys]);
    return {
      choices: [0, 1, 2, 3],
      expected: list.indexOf(keys[0]),
      tolerance: 0.5,
      label: (j) => `<span class="lm-opt">${t(list[j])}</span>`,
      meta: { kind, answer: keys[0], ...extra },
    };
  }

  function clearAll() {
    cancelPending();
    for (const kind of EXAMPLES) clearRun(kind);
    ballHome();
    removeLabels();
  }

  let kinds = [];
  let question = null;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 4,
    hooks: {
      enter() {
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        clearAll();
        kinds = shuffle(['watch', 'spacing', 'everyday', 'define']);
        syncUI();
        refresh();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        clearAll();
        syncUI();
        setExample('drop');
        showLabels();
        refresh();
        emitChange();
      },
      async prepare(i, alive, say) {
        const kind = kinds[i % kinds.length];
        clearAll(); // no marks from an earlier question
        refresh();
        if (kind === 'watch') {
          const ex = pickOne(EXAMPLES);
          await setExample(ex);
          if (!alive()) return null;
          say(t('q_look'));
          await wait(300);
          if (!alive()) return null;
          const run = await go(ex, { judge: false, quiet: true });
          await run?.landed;
          if (!alive()) return null;
          question = { kind, ex, run };
          return { text: t('q_watch'), ...textChoices(WATCH[ex], kind, { example: ex }) };
        }
        if (kind === 'spacing') {
          await setExample('drop');
          if (!alive()) return null;
          say(t('q_look'));
          await wait(300);
          if (!alive()) return null;
          // it plays, so the student sees which way it goes
          const run = await go('drop', { judge: false, quiet: true });
          await run?.landed;
          if (!alive()) return null;
          question = { kind, run };
          return { text: t('q_spacing'), ...textChoices(SPACING, kind, { example: 'drop' }) };
        }
        if (kind === 'everyday') {
          const is = Math.random() < 0.5;
          const lin = shuffle([...LINEAR]);
          const non = shuffle([...NOT_LINEAR]);
          const items = (is ? [lin[0], ...non.slice(0, 3)] : [non[0], ...lin.slice(0, 3)]).map((k) => `ev_${k}`);
          question = { kind, right: items[0] };
          return { text: t(is ? 'q_everyday_is' : 'q_everyday_isnt'), ...textChoices(items, kind, { variant: is ? 'is' : 'isnt' }) };
        }
        question = { kind: 'define' };
        return { text: t('q_define'), ...textChoices(DEFINE, 'define') };
      },
      reveal() {
        const q = question;
        if (q.kind === 'watch') {
          judgeRun(q.run);
          return t(q.run.linear ? 'why_straight' : 'why_curved');
        }
        if (q.kind === 'spacing') {
          judgeRun(q.run);
          return t('why_spacing_drop');
        }
        if (q.kind === 'everyday') return t('why_everyday', { item: t(q.right), why: t(`${q.right}_why`) });
        return t('why_define');
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── first-use pointer: on the ball ──────────────────────────────────────────
  let coach = null;
  if (o.coach) {
    const v = new THREE.Vector3();
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint, slowBadge],
      object: {
        label: 'coach_ball',
        candidates: () => {
          v.copy(ball.root.position).project(camera);
          return [{ x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height }];
        },
        grabbable: (p) => pick(p),
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
    if (b.dataset.ex) setExample(b.dataset.ex);
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
      case 'go':
        go(s.example);
        break;
      case 'clear':
        cancelPending();
        clearRun(s.example);
        showLabels();
        refresh();
        emitChange();
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
    const arrows = { ArrowUp: 0, ArrowRight: 90, ArrowDown: 180, ArrowLeft: -90 };
    const sceneKey = ['1', '2', 'r', 'R'].includes(k) || k in arrows || ((k === ' ' || k === 'Enter') && !target.closest('button'));
    if (sceneKey && s.mode === 'quiz') {
      // in the test the scene runs by itself; only the view keys work
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (k === '1' || k === '2') setExample(EXAMPLES[Number(k) - 1]);
    else if (((k === ' ' || k === 'Enter') && !target.closest('button')) || k in arrows) go(s.example);
    else if (k === 'r' || k === 'R') {
      cancelPending();
      clearRun(s.example);
      showLabels();
      refresh();
      emitChange();
    } else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  setView(s.view, { animate: false });
  setExample(s.example, { animate: false });
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
     * Change any of: example ('drop' | 'throw'), run (true: do the example's motion), clear (true: forget the
     * example's motion), view; animate: false jumps (a motion straight to its end, line drawn).
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.example) await setExample(p.example, { animate });
      if (p.clear) {
        clearRun(s.example);
        showLabels();
        refresh();
      }
      if (p.run) await go(s.example, { animate });
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      clearAll();
      s.view = 'front';
      controls.enableRotate = false;
      syncUI();
      await setExample('drop');
      showLabels();
      refresh();
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
    /** The board, the stand, the ball and any marks the motions left. */
    exportRoot() {
      const copy = world.clone(true);
      for (const name of ['DropTrace', 'ThrowTrace']) {
        const ob = copy.getObjectByName(name);
        if (ob) ob.visible = true;
      }
      return copy;
    },
  };
}
