// Speed and velocity (book page 40, topic 2.5), student view. Two boys on a plain field run for the same 20 s:
//  - ১ম জন runs a zig-zag path, 100 m: দ্রুতি = দূরত্ব ÷ সময় = 100 m ÷ 20 s = 5 m/s, a number with no direction;
//  - ২য় জন runs 50 m straight, along an outlined বেগ arrow whose angle from east is shown:
//    বেগ = সরণ ÷ সময় = 50 m ÷ 20 s = 2.5 m/s, in that direction (a vector).
// The student taps দৌড়াও, and turns boy 2's direction (◀ ▶, the arrow keys, or by dragging the arrow). The panel
// writes both as fractions, as the book does. Then a short test (tap answers). Physics in motion.js.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener } from '@shared/tween.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createQuiz } from '@shared/student/quiz.js';
import { capturePointer } from '@shared/student/pointer.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { ICONS } from '@shared/student/icons.js';
import { createArrow } from './arrow.js';
import { createField, skyTexture } from './field.js';
import { createI18n } from './i18n.js';
import { DIRS, PATH, RUN, SCALE, START, VELOCITY, dirOf, fixed, fmt, lineAt, pathAt, runAt, wrap } from './motion.js';
import { createPerson } from './person.js';

export const DEFAULTS = {
  angle: 40, // boy 2's direction, degrees from east towards north
  time: 0, // s of the run shown when the figure opens (20: both at the end, for the poster)
  view: 'front', // 'front' (from above, tilted) | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

// one colour per quantity: দূরত্ব and দ্রুতি blue, সরণ and বেগ orange, সময় purple (style.css has the same)
const COLORS = { distance: '#1c6fd9', displacement: '#e8590c', ink: '#3a3f47' };
const RUN_SCREEN = 6; // s on screen for the 20 s run
const STEP = 15; // degrees per press of ◀ ▶
const BOY = 2; // the boys drawn twice as big (see NOTES), so they show on a phone
const ARROW_LEN = 3.2;
const VIEWS = { front: new THREE.Vector3(0, 1, 0.62).normalize(), '3d': new THREE.Vector3(-0.55, 0.62, 0.9).normalize() };
const at = (e, n, h = 0) => new THREE.Vector3(e, h, -n);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const U = (key) => `<span class="sv-u">${t(key)}</span>`;

  root.classList.add('pvc', 'sv');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    // one structure in every lab: choices, the action (+ reset), the readings, the formula, the rule
    learn: `
          <div class="fig-choices sv-turn" role="group" aria-label="${t('turn')}">
            <span>${t('turn')}</span>
            <button class="pvc-btn" data-act="left" aria-label="${t('turn_left')}">◀</button>
            <b class="sv-angle"></b>
            <button class="pvc-btn" data-act="right" aria-label="${t('turn_right')}">▶</button>
          </div>
          <div class="pvc-act-row">
            <div class="pvc-act-slot"></div>
            <button type="button" class="pvc-quiet" data-act="reset" aria-label="${t('reset')}" title="${t('reset')}">${ICONS.reset}</button>
          </div>
          <dl class="fig-readings">
            <div class="dist"><dt>${t('boy1')}: ${t('speed')}</dt><dd data-v="sp"></dd></div>
            <div class="disp"><dt>${t('boy2')}: ${t('velocity')}</dt><dd data-v="ve"></dd></div>
          </dl>
          <p class="fig-formula">
            <span class="dist">${t('speed')} = ${t('cap_speed')} = <b data-v="fs"></b></span>
            <span class="disp">${t('velocity')} = ${t('cap_velocity')} = <b data-v="fv"></b></span>
          </p>
          <p class="pvc-rule sv-rule"></p>`,
  });

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.5, far: 300, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 6;
  controls.maxDistance = 70;
  controls.maxPolarAngle = Math.PI * 0.46;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const annotations = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint] });
  const solid = o.bg !== 'transparent';
  if (solid) scene.background = skyTexture();

  const world = new THREE.Group(); // what a GLB export holds
  world.name = 'SpeedVelocity';
  scene.add(world);
  const field = createField({ colors: COLORS, background: solid });
  world.add(field.root);
  const boys = [createPerson({ shirt: '#3d7fe0', trousers: '#2f3d55' }), createPerson({ shirt: '#f08a3c', trousers: '#2f3d55' })];
  for (const b of boys) {
    b.root.scale.setScalar(BOY);
    world.add(b.root);
  }
  const velArrow = createArrow({ color: COLORS.displacement, radius: 0.2, head: 1, headRadius: 0.5, name: 'Velocity' });
  world.add(velArrow.root);

  // one sun; only the boys cast shadows, onto the ground; the shadow box follows the framing
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(0xdfeeff, 0xc9a77a, 0.5));
  if (o.shadow && solid) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
  } else for (const b of boys) b.root.traverse((m) => (m.castShadow = false));

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    time: Math.min(Math.max(Number(o.time) || 0, 0), RUN.time),
    angle: wrap(Math.round(Number.isFinite(Number(o.angle)) ? Number(o.angle) : DEFAULTS.angle)),
    running: false,
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    showAngle: true,
  };
  const snapshot = () => {
    const r = runAt(s.time);
    return {
      time: r.time,
      angle: s.angle,
      direction: dirOf(s.angle),
      running: s.running,
      distance: r.distance,
      displacement: r.displacement,
      speed: r.speed,
      velocity: r.velocity,
      view: s.view,
      mode: s.mode,
    };
  };

  // ── the boys and the marks ──────────────────────────────────────────────────
  const tmp = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const hands = boys.map(() => [new THREE.Vector3(), new THREE.Vector3()]);
  function place() {
    const r = runAt(s.time);
    const p1 = pathAt(r.distance);
    const p2 = lineAt(r.displacement, s.angle);
    const moving = s.running && s.time < RUN.time;
    for (const [i, p, d] of [
      [0, p1, r.distance],
      [1, p2, r.displacement],
    ]) {
      const b = boys[i];
      b.root.position.copy(at(p.e, p.n));
      b.root.rotation.y = (p.heading * Math.PI) / 180;
      const walk = ((d / SCALE / 2.3) * Math.PI * 2) % (Math.PI * 2);
      const sw = moving ? Math.sin(walk) : 0;
      b.pose(
        moving
          ? {
              lean: 0.2,
              walk,
              stride: 0.4,
              lift: 0.2,
              spread: 0.09,
              hands: [hands[i][0].set(0.14 - 0.26 * sw, 1.0, 0.24), hands[i][1].set(0.14 + 0.26 * sw, 1.0, -0.24)],
            }
          : { lean: 0, walk: 0, stride: 0, lift: 0 },
      );
    }
    field.setAngle(s.angle);
    field.setRun(r.distance / SCALE, r.displacement / SCALE, RUN.displacement / SCALE);
    dir.set(Math.cos((s.angle * Math.PI) / 180), 0, -Math.sin((s.angle * Math.PI) / 180));
    tmp.copy(at(p2.e, p2.n, 0.32)).addScaledVector(dir, 0.55);
    velArrow.set(tmp, dir, ARROW_LEN);
    stage.invalidate();
  }
  const points = {
    one: () => boys[0].root.position.clone().setY(3.6),
    two: () => boys[1].root.position.clone().setY(3.6),
    tip: () => velArrow.root.position.clone().addScaledVector(dir, ARROW_LEN + 0.1),
  };

  // labels: short, on the view; sentences go in the panel
  annotations.add('one', { text: t('lbl_one'), point: points.one, dx: 0, dy: -14, kind: 'part' });
  annotations.add('two', { text: t('lbl_two'), point: points.two, dx: 0, dy: -14, kind: 'part' });
  annotations.add('vel', {
    text: t('lbl_velocity', { v: fmt(VELOCITY) }),
    point: points.tip,
    spots: [
      { dx: 14, dy: -16 },
      { dx: -14, dy: -16 },
      { dx: 14, dy: 18 },
      { dx: -14, dy: 18 },
    ],
    kind: 'callout',
    color: COLORS.displacement,
  });
  annotations.add('east', { text: t('lbl_east'), point: field.points.east, dx: 12, dy: 0, kind: 'callout', color: COLORS.ink });
  function angleLabel() {
    const want = s.showAngle;
    if (!want) return annotations.has('ang') && annotations.remove('ang');
    const text = t('lbl_angle', { a: s.angle });
    if (annotations.has('ang')) annotations.update('ang', { text, point: () => field.points.arc(s.angle) });
    else annotations.add('ang', { text, point: () => field.points.arc(s.angle), dx: 0, dy: 0, kind: 'callout', color: COLORS.ink });
  }

  // ── the panel: the readings, the book's two formulas, the rule ─────────────
  const $ = ui.$;
  const cells = {};
  for (const node of ui.learn.querySelectorAll('[data-v]')) cells[node.dataset.v] = node;
  const ruleEl = $('.sv-rule');
  const angleEl = $('.sv-angle');
  const shown = {};
  let action = null;
  function put(k, html, node = cells[k]) {
    if (!node || shown[k] === html) return;
    shown[k] = html;
    node.innerHTML = html;
  }

  function refresh() {
    const r = runAt(s.time);
    const end = r.time >= RUN.time - 1e-6;
    const dirText = t('dir_angle', { a: s.angle, d: t(`dir_${dirOf(s.angle)}`) });
    put('sp', r.speed == null ? '–' : `${N(fmt(r.speed, 2))}${U('u_ms')} <small>${t('no_direction')}</small>`);
    put('ve', r.velocity == null ? '–' : `${N(fmt(r.velocity, 2))}${U('u_ms')} <small>${dirText}</small>`);
    const sum = (top, v) =>
      r.time > 0 ? `${N(fixed(top, 1).replace(/\.0$/, ''))} m ÷ ${N(fixed(r.time, 1).replace(/\.0$/, ''))} s = ${N(fmt(v, 2))} ${t('u_ms')}` : '–';
    put('fs', sum(r.distance, r.speed));
    put('fv', sum(r.displacement, r.velocity));
    put('angle', dirText, angleEl);
    const idea = end ? t('idea_done') : s.running ? t('idea_running') : t('idea_start', { t: RUN.time, s: RUN_SCREEN });
    put('rule', idea, ruleEl);
    const label = end ? 'act_again' : 'act_run';
    if (shown.act !== label) {
      shown.act = label;
      action?.set({ label });
    }
  }
  function update() {
    place();
    refresh();
  }

  // ── the run ─────────────────────────────────────────────────────────────────
  function run() {
    if (s.locked) return;
    if (s.time >= RUN.time) s.time = 0;
    s.running = true;
    audio.tick?.();
    const t0 = s.time;
    tweener
      .animate({
        key: 'run',
        duration: ((RUN.time - t0) / RUN.time) * RUN_SCREEN,
        ease: (x) => x,
        onUpdate: (k) => {
          s.time = t0 + (RUN.time - t0) * k;
          update();
        },
      })
      .finished.then((done) => {
        s.running = false;
        update();
        if (done) {
          audio.success?.();
          emit('arrive', snapshot());
        }
      });
    update();
  }
  function stopRun() {
    tweener.cancel('run');
    s.running = false;
  }
  function setAngle(a, { emitChange = true } = {}) {
    const next = wrap(Math.round(a));
    if (next === s.angle && s.time === 0) return;
    stopRun();
    s.angle = next;
    s.time = 0; // a new direction: both back on the start line
    update();
    angleLabel();
    fit(true);
    if (emitChange) emit('change', snapshot());
  }
  function turn(step) {
    if (s.locked) return lockedNudge();
    audio.tick?.();
    setAngle(Math.round((s.angle + step) / STEP) * STEP);
  }

  // ── camera: frame the start, boy 1's path and boy 2's line ──────────────────
  function bounds() {
    const end = lineAt(RUN.displacement, s.angle);
    const pts = [...PATH, START.two, end];
    const box = new THREE.Box3();
    for (const p of pts) {
      box.expandByPoint(at(p.e, p.n, 0));
      box.expandByPoint(at(p.e, p.n, 2.2));
    }
    return box.expandByVector(new THREE.Vector3(0.7, 0, 0.7));
  }
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  function viewPose(view) {
    const box = bounds();
    const target = box.getCenter(new THREE.Vector3()).setY(0.6);
    const d0 = VIEWS[view];
    const cam = camera.clone();
    let d = 30;
    const topRoom = Math.min(0.3, 60 / Math.max(stage.height, 200)); // the corner buttons
    for (let i = 0; i < 6; i++) {
      cam.position.copy(target).addScaledVector(d0, d);
      cam.lookAt(target);
      cam.updateMatrixWorld();
      let k = 0;
      let j = 0;
      for (const x of [box.min.x, box.max.x])
        for (const y of [box.min.y, box.max.y])
          for (const z of [box.min.z, box.max.z]) {
            const c = corners[j++].set(x, y, z).project(cam);
            k = Math.max(k, Math.abs(c.x) / 0.96, c.y > 0 ? c.y / (1 - topRoom * 2) : -c.y / 0.96);
          }
      d *= 0.35 + 0.65 * k;
    }
    // the sun's shadow box round the same area
    const half = box.getSize(tmp).length() / 2 + 1;
    sun.target.position.copy(target).setY(0);
    sun.position.copy(target).add(new THREE.Vector3(-6, 20, 8));
    Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 50 });
    sun.shadow.camera.updateProjectionMatrix();
    return { target, position: target.clone().addScaledVector(d0, d) };
  }
  function flyTo({ position, target }, duration = 0.6) {
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
      },
    }).finished;
  }
  function fit(animate) {
    if (s.userMovedCamera) return;
    flyTo(viewPose(s.view), animate ? 0.5 : 0);
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(viewPose(s.view), animate ? 0.8 : 0);
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
    if (!s.userMovedCamera) {
      tweener.cancel('camera');
      flyTo(viewPose(s.view), 0);
    }
  });

  // ── dragging the বেগ arrow turns boy 2 ──────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  function groundPoint(e) {
    const r = stage.canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.ray.intersectPlane(ground, hit);
  }
  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const p = groundPoint(e);
      if (!p || drag) return;
      // on or near the arrow (or boy 2): turn him
      const from = velArrow.root.position;
      const tip = points.tip();
      const seg = tip.clone().sub(from).setY(0);
      const rel = p.clone().sub(from).setY(0);
      const f = THREE.MathUtils.clamp(rel.dot(seg) / seg.lengthSq(), 0, 1);
      const near = rel.sub(seg.multiplyScalar(f)).length() < 0.9;
      if (!near) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      drag = { id: e.pointerId };
      capturePointer(ui.canvasHost, e.pointerId);
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const p = groundPoint(e);
    if (!p) return;
    const a = (Math.atan2(-p.z - START.two.n, p.x - START.two.e) * 180) / Math.PI;
    if (Math.hypot(p.x - START.two.e, -p.z - START.two.n) > 0.6) setAngle(Math.round(a / 5) * 5, { emitChange: false });
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    emit('change', snapshot());
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  let hintTimer = 0;
  function lockedNudge() {
    ui.hintText.textContent = t('q_locked');
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => ui.hint.classList.remove('show'), 3000);
    audio.error?.();
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
  const WALKS = [
    [100, 50, 20],
    [120, 80, 40],
    [60, 30, 12],
    [90, 45, 15],
    [200, 120, 50],
  ];
  const value = (u) => (v) => `${N(fmt(v, 2))}<small>${t(u)}</small>`;
  const words = (keys) => (j) => `<span class="sv-opt">${t(keys[j])}</span>`;
  function numericChoices(right, wrong) {
    const seen = new Set([fmt(right, 2)]);
    const list = [right];
    for (const w of wrong) {
      if (list.length === 4) break;
      if (!(w >= 0) || seen.has(fmt(w, 2))) continue;
      seen.add(fmt(w, 2));
      list.push(w);
    }
    return shuffle(list);
  }
  let kinds = [];
  let question = null;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    lines: { text: 3, feedback: 2 },
    action: { hide: (r) => action?.hide(r), show: (r) => action?.show(r) },
    hooks: {
      enter() {
        s.mode = 'quiz';
        stopRun();
        kinds = ['dir', ...shuffle(['calc', 'vector', 'same', 'round'])];
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.showAngle = true;
        angleLabel();
        syncUI();
      },
      async prepare(i, _alive, say) {
        s.locked = false;
        s.showAngle = true;
        const kind = kinds[i % kinds.length];
        if (kind === 'dir') {
          // boy 2 faces one of the eight directions; the angle is hidden, the student names the direction
          const k = pickOne([1, 2, 3, 5, 6, 7]);
          s.showAngle = false;
          setAngle(k * 45);
          angleLabel();
          s.locked = true;
          const keys = [DIRS[k], ...shuffle(DIRS.filter((_d, j) => j !== k)).slice(0, 3)].map((d) => `dir_${d}`);
          const order = shuffle([0, 1, 2, 3]);
          question = { kind, d: t(keys[0]) };
          say(t('q_dir'));
          return {
            choices: [0, 1, 2, 3],
            expected: order.indexOf(0),
            tolerance: 0.5,
            label: (j) => words(keys)(order[j]),
            meta: { kind, angle: k * 45 },
          };
        }
        s.locked = true;
        if (kind === 'calc') {
          const [D, d, tt] = pickOne(WALKS);
          const speed = Math.random() < 0.5;
          say(t(speed ? 'q_calc_speed' : 'q_calc_vel', { t: tt, D, d }));
          const right = (speed ? D : d) / tt;
          const wrong = speed ? [d / tt, tt / D, (D + d) / tt] : [D / tt, tt / d, (D + d) / tt];
          question = { kind, D, d, t: tt, speed, right };
          return { choices: numericChoices(right, wrong), expected: right, tolerance: 0.004, label: value('u_ms'), meta: { kind, D, d, t: tt } };
        }
        if (kind === 'vector') {
          const keys = shuffle(['opt_velocity', 'opt_speed', 'opt_distance', 'opt_time']);
          question = { kind };
          say(t('q_vector'));
          return { choices: [0, 1, 2, 3], expected: keys.indexOf('opt_velocity'), tolerance: 0.5, label: words(keys), meta: { kind } };
        }
        if (kind === 'same') {
          const keys = shuffle(['opt_same', 'opt_both_same', 'opt_vel_same', 'opt_both_diff']);
          question = { kind };
          say(t('q_same'));
          return { choices: [0, 1, 2, 3], expected: keys.indexOf('opt_same'), tolerance: 0.5, label: words(keys), meta: { kind } };
        }
        const [D, tt] = pickOne([
          [400, 80],
          [200, 50],
          [300, 60],
        ]);
        question = { kind, D, t: tt };
        say(t('q_round', { D, t: tt }));
        return { choices: shuffle([0, D / tt, D / 2 / tt, tt / D]), expected: 0, tolerance: 0.001, label: value('u_ms'), meta: { kind } };
      },
      reveal() {
        const q = question;
        if (q.kind === 'dir') {
          s.showAngle = true;
          angleLabel();
          return t('why_dir', { d: q.d });
        }
        if (q.kind === 'calc') return t(q.speed ? 'why_calc_speed' : 'why_calc_vel', { D: q.D, d: q.d, t: q.t, r: fmt(q.right, 2) });
        if (q.kind === 'vector') return t('why_vector');
        if (q.kind === 'same') return t('why_same');
        return t('why_round', { D: q.D, t: q.t, v: fmt(q.D / q.t, 2), z: 0 });
      },
      done() {
        s.locked = false;
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    const front = ui.$('[data-view="front"]');
    if (front) front.hidden = s.view !== '3d';
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
    if (b.dataset.view) setView(b.dataset.view);
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
      case 'reset':
        if (!s.locked) {
          stopRun();
          s.time = 0;
          update();
          emit('change', snapshot());
        }
        break;
      case 'left':
        turn(STEP);
        break;
      case 'right':
        turn(-STEP);
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
    if ((k === ' ' || k === 'enter') && !target.closest('button')) run();
    else if (k === 'arrowleft' || k === 'arrowup') turn(STEP);
    else if (k === 'arrowright' || k === 'arrowdown') turn(-STEP);
    else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else return;
    e.preventDefault();
  });

  // ── the action: the kit's button in the panel, its badge on the two boys at the start line ─────────────
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_run',
    icon: ICONS.play,
    target: () => null, // the button only: the two boys and their labels keep the start clear
    avoid: [ui.corner, ui.hint],
    pulse: Boolean(o.coach),
    onAct: () => run(),
  });

  // ── start ───────────────────────────────────────────────────────────────────
  update();
  angleLabel();
  setView(s.view, { animate: false });
  syncUI();
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
     * Change any of: angle (boy 2's direction, degrees from east towards north; both go back to the start line);
     * time (0–20 s of the run, stopped); playing (true: run from where they are); view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.angle != null) setAngle(Number(p.angle));
      if (p.time != null) {
        stopRun();
        s.time = Math.min(Math.max(Number(p.time), 0), RUN.time);
        update();
      }
      if (p.playing === true && !s.running) run();
      if (p.playing === false) {
        stopRun();
        update();
      }
      return snapshot();
    },
    async reset() {
      quiz.stop();
      stopRun();
      s.time = 0;
      s.showAngle = true;
      setAngle(DEFAULTS.angle, { emitChange: false });
      update();
      angleLabel();
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => world,
  };
}
