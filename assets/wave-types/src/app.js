// Transverse and longitudinal waves (book pages 194–195, topic 7.2.2), student view. On a long teak lab bench a wave
// driver sends one travelling wave, y = a sin(kx − ωt), along a medium. Two words choose the medium the book uses:
// a stretched manila rope (the driver shakes its end up and down: অনুপ্রস্থ তরঙ্গ) or a long steel spring lying on the
// bench (the driver pushes and pulls its end: অনুদৈর্ঘ্য তরঙ্গ, with সংকোচন and প্রসারণ that travel, shaded teal on the
// bench). One particle is green, with a white mark at its rest place: it only swings in place (an outlined green
// double arrow), up-down on the rope and back-forth on the spring, while the outlined blue arrow shows the wave going
// on. One action button (and the badge on the driver) starts and pauses it; the result line names the wave and how the
// particle moves; the rule grows with the book's sentences; a comparison of the two fills the side panel. A 5-question
// test. Built on the shared kit.
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
import { fitPose } from './camera.js';
import { boldArrow, doubleArrow } from './arrows.js';
import { backdropTexture, createSetting } from './setting.js';
import {
  COLORS,
  ROPE_Y,
  SPRING,
  SPRING_Y,
  X0,
  createDensityStrip,
  createDriver,
  createRestMarks,
  createRope,
  createSpring,
  createStand,
  mediumMaterials,
} from './medium.js';
import { KIND, MEDIA, WAVE, amplitude, displacement, features, front, heading, nearest, period, round, settled, speed } from './reading.js';

export const DEFAULTS = {
  medium: 'rope',
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const DOUBLE_TAP = 400; // ms
const MARGIN = { top: 50, bottom: 12, side: 10 };
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const RIGHT = V(1, 0, 0);
const UP = V(0, 1, 0);
/** The boxes the camera frames per medium: [x0, y0, x1, y1, z]. */
const BOX = {
  rope: [X0 - 0.1, 0.02, X0 + WAVE.L - 0.06, ROPE_Y + 0.15, 0.05],
  spring: [X0 - 0.25, 0.0, X0 + WAVE.L - 0.02, 0.2, 0.08],
};
/** Where the green particle has settled into its full swing (s). */
const SETTLE = WAVE.marked / speed() + period();

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'wt');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'media', results: true, items: MEDIA.map((m) => ({ id: m, label: `ex_${m}` })) },
      quiet: [{ act: 'reset', label: 'act_reset', icon: ICONS.reset }],
      lines: { action: 1, outcome: 2, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;

  // the comparison of the two media under the rule, and a small note
  const cmp = document.createElement('div');
  cmp.className = 'wt-cmp';
  const arrowSvg = (m) => {
    const g = COLORS.mark;
    const b = COLORS.wave;
    const head = (x, y, dx, dy, c) => {
      const px = -dy;
      const py = dx;
      return `<path d="M${x + dx * 7},${y + dy * 7} L${x + px * 5},${y + py * 5} L${x - px * 5},${y - py * 5} Z" fill="${c}" stroke="#fff" stroke-width="1.2"/>`;
    };
    const wave = `<line x1="8" y1="34" x2="54" y2="34" stroke="${b}" stroke-width="4"/>${head(54, 34, 1, 0, b)}`;
    const part =
      m === 'rope'
        ? `<line x1="30" y1="6" x2="30" y2="24" stroke="${g}" stroke-width="4"/>${head(30, 6, 0, -1, g)}${head(30, 24, 0, 1, g)}`
        : `<line x1="16" y1="16" x2="44" y2="16" stroke="${g}" stroke-width="4"/>${head(44, 16, 1, 0, g)}${head(16, 16, -1, 0, g)}`;
    return `<svg viewBox="0 0 68 42" width="68" height="42" aria-hidden="true">${part}${wave}</svg>`;
  };
  cmp.innerHTML = `<div class="wt-cmp-head">${t('cmp_head')}</div>${MEDIA.map(
    (m) =>
      `<div class="wt-cmp-row" data-m="${m}">${arrowSvg(m)}<div class="wt-cmp-text"><span class="wt-cmp-line"></span><span class="wt-cmp-kind"></span></div></div>`,
  ).join('')}<div class="wt-cmp-key"><span class="wt-key-g">${t('cmp_particle')}</span><span class="wt-key-b">${t('cmp_wave')}</span></div>`;
  $('.pvc-rule').after(cmp);
  const note = document.createElement('p');
  note.className = 'wt-note';
  cmp.after(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 80, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = true;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = Math.PI * 0.49;

  if (o.bg !== 'transparent') scene.background = backdropTexture();
  scene.add(new THREE.HemisphereLight('#f1ecff', '#6a4a36', 1.0));
  const sun = new THREE.DirectionalLight('#fff1dc', 2.2);
  sun.position.set(1.2, 4, 3);
  sun.target.position.set(0, 0, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#d6dcff', 0.55);
  fill.position.set(-3, 2, 4);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.004;
    sun.shadow.radius = 3;
  }
  Object.assign(sun.shadow.camera, { left: -1.3, right: 1.3, top: 0.7, bottom: -0.7, near: 2, far: 7 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.target.updateMatrixWorld();

  const setting = createSetting();
  scene.add(setting.root);
  const mats = mediumMaterials();
  const rope = createRope(mats);
  const spring = createSpring(mats);
  const strip = createDensityStrip();
  const driver = createDriver(mats);
  const stand = createStand(mats, spring);
  const marks = createRestMarks(spring);
  scene.add(rope.root, spring.root, strip.mesh, driver.root, stand.root, marks.root);

  // the arrows: the particle's swing (green, both ways) and the wave's direction (blue)
  const swing = doubleArrow('ParticleSwing', COLORS.mark, 0.0042);
  const waveArrow = boldArrow('WaveDirection', COLORS.wave, 0.0055);
  scene.add(swing.root, waveArrow.root);
  // the test's mark round one place of the paused spring: a dark ring with a white rim, drawn over the coils
  const which = new THREE.Group();
  which.name = 'WhichPlace';
  which.userData.noExport = true;
  for (const [r, c, order] of [
    [0.0034, '#ffffff', 40],
    [0.002, '#1d2733', 41],
  ]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(SPRING.R + 0.016, r, 8, 48).rotateY(Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: c, depthTest: false, transparent: true, toneMapped: false }),
    );
    ring.renderOrder = order;
    which.add(ring);
  }
  which.visible = false;
  scene.add(which);

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const s = {
    mode: 'explore',
    locked: false,
    medium: MEDIA.includes(o.medium) ? o.medium : 'rope',
    running: false,
    t: 0, // the wave's clock (s since the driver started)
    seen: { rope: false, spring: false },
    userMovedCamera: false,
    show: { labels: true, swing: true, feature: null }, // the test hides some, or marks one place
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  const markedX = () => (s.medium === 'spring' ? spring.markedX : WAVE.marked);
  const settledNow = () => s.t >= SETTLE;

  // ── the scene from the state ────────────────────────────────────────────────
  const P = new THREE.Vector3();
  function syncScene() {
    const m = s.medium;
    const a = amplitude(m);
    rope.root.visible = m === 'rope';
    spring.root.visible = m === 'spring';
    strip.mesh.visible = m === 'spring' && s.t > 0 && !s.show.feature;
    which.visible = Boolean(s.show.feature) && m === 'spring';
    if (which.visible) spring.at(s.show.feature.x, s.t, which.position);
    driver.setMedium(m);
    stand.setMedium(m);
    marks.setMedium(m);
    driver.setDisp(displacement(0, s.t, a));
    driver.setOn(s.running);
    if (m === 'rope') rope.update(s.t);
    else {
      spring.update(s.t);
      if (s.t > 0) strip.update(s.t, a);
    }
    // the green particle's swing, at its rest place, once it swings fully
    const xm = markedX();
    if (s.show.swing && s.t > 0 && settled(xm, s.t)) {
      if (m === 'rope') swing.set(V(X0 + xm + 0.045, ROPE_Y, 0.02), UP, a + 0.012);
      else swing.set(V(X0 + xm, SPRING_Y + SPRING.R + 0.06, 0), RIGHT, a + 0.04);
    } else swing.hide();
    // the wave's direction, beyond the green particle, once the wave has gone past it
    if (s.show.labels && front(s.t) > xm + 0.15) {
      const y = m === 'rope' ? ROPE_Y + a + 0.075 : SPRING_Y + SPRING.R + 0.05;
      waveArrow.set(V(X0 + 0.98, y, 0), RIGHT, 0.32);
    } else waveArrow.hide();
    stage.invalidate();
  }

  stage.addTicker((dt) => {
    if (!s.running) return false;
    s.t += dt;
    if (!s.seen[s.medium] && settledNow() && s.mode === 'explore') {
      s.seen[s.medium] = true;
      audio.success?.();
      emitChange();
    }
    syncScene();
    refresh();
    return true;
  });

  // ── the panel ───────────────────────────────────────────────────────────────
  const other = (m) => (m === 'rope' ? 'spring' : 'rope');
  function plan() {
    if (s.running) return { label: 'act_pause', step: '', icon: ICONS.pause };
    if (s.t > 0) return { label: 'act_resume', step: '', icon: ICONS.play };
    const done = Number(s.seen.rope) + Number(s.seen.spring);
    return { label: `act_${s.medium}`, step: s.seen[s.medium] ? '' : done + 1, icon: ICONS.hand };
  }
  function refresh() {
    const m = s.medium;
    sheet.choose(m);
    for (const k of MEDIA) sheet.result(k, s.seen[k] ? t(`res_${k}`) : '');
    sheet.next(s.seen[m] && !s.seen[other(m)] ? other(m) : null);
    let out;
    if (s.t <= 0) out = t(`out_idle_${m}`);
    else if (!settledNow()) out = t('out_coming');
    else out = t(`out_${m}`) + (s.running ? '' : t('out_paused'));
    sheet.outcome(out);
    if (s.seen.rope && s.seen.spring) sheet.rule(t('rule_both'));
    else if (s.seen[m]) sheet.rule(t(`rule_${m}`));
    else sheet.rule(t('rule_start'));
    for (const k of MEDIA) {
      const row = cmp.querySelector(`[data-m="${k}"]`);
      const line = s.seen[k] ? t(`cmp_${k}`) : t(`cmp_${k}_new`);
      const kind = s.seen[k] ? t(`cmp_kind_${k}`) : '';
      const l = row.querySelector('.wt-cmp-line');
      if (l.innerHTML !== line) l.innerHTML = line;
      const kd = row.querySelector('.wt-cmp-kind');
      if (kd.textContent !== kind) kd.textContent = kind;
      row.classList.toggle('on', k === m);
      row.classList.toggle('seen', s.seen[k]);
    }
    const n = s.t > 0 && front(s.t) >= WAVE.L - 0.05 ? t('note_end') : '';
    if (note.textContent !== n) note.textContent = n;
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: p.label, icon: p.icon, enabled: true });
      if (!s.running && s.t <= 0 && s.mode === 'explore' && o.coach) action.show('scene');
      else action.hide('scene');
    }
    syncLabels();
    stage.invalidate();
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const tmp = new THREE.Vector3();
  const A0 = { x: 0, y: 0 };
  const A1 = { x: 0, y: 0 };
  function toScreen(p, out) {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  const boxOf = (p0, p1, pad) => {
    toScreen(p0, A0);
    toScreen(p1, A1);
    return {
      left: Math.min(A0.x, A1.x) - pad,
      top: Math.min(A0.y, A1.y) - pad,
      right: Math.max(A0.x, A1.x) + pad,
      bottom: Math.max(A0.y, A1.y) + pad,
    };
  };
  /** The medium itself (its band of motion), the arrows: labels never sit on them. */
  function keepClear() {
    const out = [];
    const a = amplitude(s.medium);
    if (s.medium === 'rope') {
      for (let i = 0; i < 6; i++) {
        const x0 = X0 + (i / 6) * WAVE.L;
        const x1 = X0 + ((i + 1) / 6) * WAVE.L;
        out.push(boxOf(V(x0, ROPE_Y - a - 0.01, 0), V(x1, ROPE_Y + a + 0.01, 0), 2));
      }
    } else {
      for (let i = 0; i < 6; i++) {
        const x0 = X0 + (i / 6) * WAVE.L;
        const x1 = X0 + ((i + 1) / 6) * WAVE.L;
        out.push(boxOf(V(x0, SPRING_Y - SPRING.R, SPRING.R), V(x1, SPRING_Y + SPRING.R, -SPRING.R), 1));
      }
    }
    if (swing.visible) out.push(boxOf(swing.a.tip, swing.b.tip, 6));
    if (waveArrow.visible) out.push(boxOf(waveArrow.root.position, waveArrow.tip, 6));
    return out;
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, keepClear, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const ABOVE = [spot(0, -26), spot(20, -28), spot(-20, -28), spot(0, -44), spot(30, -40)];
  const BELOW = [spot(0, 30), spot(18, 34), spot(-18, 34), spot(0, 48)];
  const RIGHT_OF = [spot(22, 0), spot(26, -16), spot(26, 16), spot(34, -28)];
  const labelState = new Map();
  const featPoint = (kind, near) => () => {
    const f = nearest(s.t, kind, near);
    const x = f ? f.x : near;
    return spring
      .at(x, s.t, P)
      .clone()
      .setY(SPRING_Y - SPRING.R * 0.2)
      .setZ(SPRING.R);
  };
  function wantLabels() {
    const want = new Map();
    const m = s.medium;
    const xm = markedX();
    if (s.show.feature) {
      const f = s.show.feature;
      want.set('which', {
        text: t('lbl_which'),
        point: () =>
          spring
            .at(f.x, s.t, P)
            .clone()
            .setY(SPRING_Y - SPRING.R - 0.012)
            .setZ(SPRING.R * 0.6),
        spots: BELOW,
        color: '#1d2733',
      });
      return want;
    }
    if (!s.show.labels) return want;
    if (swing.visible)
      want.set('particle', {
        text: t('lbl_particle'),
        point: () => (m === 'rope' ? V(X0 + xm + 0.045, ROPE_Y + amplitude(m) + 0.01, 0.02) : V(X0 + xm, SPRING_Y + SPRING.R + 0.065, 0)),
        spots: m === 'rope' ? [...ABOVE, ...RIGHT_OF] : ABOVE,
        color: COLORS.markText,
      });
    if (waveArrow.visible)
      want.set('wave', {
        text: t('lbl_wave'),
        point: () => V(X0 + 1.14, m === 'rope' ? ROPE_Y + amplitude(m) + 0.075 : SPRING_Y + SPRING.R + 0.05, 0),
        spots: ABOVE,
        color: COLORS.waveText,
      });
    if (m === 'spring' && s.t > 0) {
      const fs = features(s.t, { from: 0.25, to: WAVE.L - WAVE.taper });
      if (fs.some((f) => f.kind === 'compression') && fs.some((f) => f.kind === 'rarefaction')) {
        want.set('comp', { text: t('lbl_comp'), point: featPoint('compression', 1.0), spots: BELOW, color: COLORS.tealText, optional: true });
        want.set('rare', { text: t('lbl_rare'), point: featPoint('rarefaction', 0.42), spots: BELOW, color: COLORS.tealText, optional: true });
      }
    }
    return want;
  }
  function syncLabels() {
    const want = wantLabels();
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: 'force', color: w.color, spots: w.spots, optional: w.optional });
        labelState.set(id, w.text);
      } else if (labelState.get(id) !== w.text) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots });
        labelState.set(id, w.text);
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const bbox = new THREE.Box3();
  const dir = new THREE.Vector3();
  function viewPose() {
    const [x0, y0, x1, y1, z] = BOX[s.medium];
    bbox.min.set(x0, y0, -z);
    bbox.max.set(x1, y1, z);
    // a three-quarter view from the front left (the driver near), about 19° above; turned a little more along the
    // medium in taller frames, so the long medium uses the height too
    const aspect = stage.width / Math.max(1, stage.height);
    const yaw = THREE.MathUtils.degToRad(Math.max(25, Math.min(40, 25 + (2.1 - aspect) * 15)));
    dir.set(-Math.sin(yaw), 0.36, Math.cos(yaw)).normalize();
    return fitPose({ box: bbox, dir, camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  function place(pose) {
    camera.position.copy(pose.position);
    controls.target.copy(pose.target);
    controls.update();
  }
  function flyTo({ position, target: aim }, duration = 0.7) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      place({ position, target: aim });
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, aim, k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  function homeView(animate = true) {
    s.userMovedCamera = false;
    syncUI();
    return flyTo(viewPose(), animate ? 0.7 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    syncUI();
  });
  controls.addEventListener('change', () => stage.invalidate());
  stage.onResize(() => {
    if (!s.userMovedCamera) place(viewPose());
    syncScene();
    refresh();
  });

  // ── the action: start / pause the driver ────────────────────────────────────
  function start() {
    s.running = true;
    hintOff();
    audio.pop?.();
    syncScene();
    refresh();
    emitChange();
  }
  function pause() {
    s.running = false;
    syncScene();
    refresh();
    emitChange();
  }
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    if (s.running) pause();
    else start();
  }
  /** Choose a medium: it starts at rest, the camera frames it. */
  function choose(m, { animate = true } = {}) {
    if (!MEDIA.includes(m)) return;
    if (s.locked) return lockedNudge();
    const changed = m !== s.medium;
    s.medium = m;
    s.running = false;
    s.t = 0;
    lastAct = Number.NEGATIVE_INFINITY;
    syncScene();
    if (changed || !s.userMovedCamera) {
      s.userMovedCamera = false;
      syncUI();
      flyTo(viewPose(), animate ? 0.6 : 0);
    }
    refresh();
    emitChange();
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_rope',
    target: () => (s.mode === 'explore' ? driver.body : null),
    pad: 8,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // touching the driver or the medium acts like the big button (a real tap: the finger comes up where it went down)
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitBox = new THREE.Box3();
  let down = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      down = { x: e.clientX, y: e.clientY, at: now() };
    },
    true,
  );
  ui.canvasHost.addEventListener(
    'pointerup',
    (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8 || now() - down.at > 500) return;
      down = null;
      const r = stage.canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / stage.width) * 2 - 1, -((e.clientY - r.top) / stage.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      driver.hit.updateMatrixWorld();
      hitBox.setFromObject(driver.hit);
      if (raycaster.ray.intersectsBox(hitBox)) doAction();
    },
    true,
  );

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 3000 } = {}) {
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
    audio.error?.();
  }

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshot() {
    const a = amplitude(s.medium);
    const xm = markedX();
    return {
      medium: s.medium,
      kind: KIND[s.medium],
      running: s.running,
      t: round(s.t, 3),
      front: round(front(s.t), 3), // how far the wave has gone (m)
      particle: round(displacement(xm, s.t, a), 4), // the green particle's displacement (m): up (rope) or along (spring)
      heading: heading(s.medium, s.t, xm),
      amplitude: a,
      wavelength: WAVE.lambda,
      frequency: WAVE.f,
      speed: round(speed(), 3),
      seen: MEDIA.filter((m) => s.seen[m]),
      next: plan().label.replace('act_', ''),
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.medium, snap.running, snap.seen, snap.mode, snap.t === 0]);
    if (key === lastEmitted) return;
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
  function choicesOf(keys) {
    const list = shuffle([...keys]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(keys[0]),
      tolerance: 0.5,
      label: (j) => `<span class="wt-opt">${t(list[j])}</span>`,
    };
  }
  /** The five questions: the rope's particle, the spring's coil after a while, a place on the paused spring, sound, water. */
  const KINDS = ['rope', 'where', 'feature', 'sound', 'water'];
  let learnSaved = null;
  let question = null;
  let picked = -1;
  /** Sets up a scene for the test: a medium at a moment, running or not, some marks hidden. */
  function setScene(m, { time = 0, running = false, show = {} } = {}) {
    s.medium = m;
    s.t = time;
    s.running = running;
    s.show = { labels: true, swing: true, feature: null, ...show };
    s.userMovedCamera = false;
    syncUI();
    syncScene();
    refresh();
  }
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: KINDS.length,
    lines: { text: 3, feedback: 3 },
    action,
    hooks: {
      enter() {
        learnSaved = { medium: s.medium, seen: { ...s.seen } };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.show = { labels: true, swing: true, feature: null };
        if (learnSaved) s.seen = learnSaved.seen;
        setScene(learnSaved?.medium ?? s.medium);
        place(viewPose());
        refresh();
        emitChange();
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        question = { kind };
        if (kind === 'rope') setScene('rope', { time: SETTLE + 0.3, running: true, show: { labels: false, swing: false } });
        else if (kind === 'where') setScene('spring', { time: 14.2, running: true, show: { labels: false, swing: false } });
        else if (kind === 'feature') {
          const time = 6.1 + Math.random() * 0.6;
          const want = Math.random() < 0.5 ? 'compression' : 'rarefaction';
          const f = nearest(time, want, 0.45 + Math.random() * 0.45);
          question.feature = f;
          setScene('spring', { time, running: false, show: { labels: false, swing: false, feature: f } });
        } else setScene('rope', { time: 0, running: false, show: { labels: false, swing: false } });
        await flyTo(viewPose(), 0.6);
        if (!alive()) return null;
        if (kind === 'rope') return { text: t('q_rope'), ...choicesOf(['c_updown', 'c_along', 'c_carried', 'c_still']) };
        if (kind === 'where') return { text: t('q_where'), ...choicesOf(['c_home', 'c_far', 'c_back', 'c_stuck']) };
        if (kind === 'feature') {
          const right = question.feature.kind === 'compression' ? 'c_comp' : 'c_rare';
          const wrong = right === 'c_comp' ? 'c_rare' : 'c_comp';
          return { text: t('q_feature'), ...choicesOf([right, wrong, 'c_lambda', 'c_amp']) };
        }
        if (kind === 'sound') return { text: t('q_sound', { fig: '7.04' }), ...choicesOf(['c_long', 'c_trans', 'c_nowave', 'c_both']) };
        return { text: t('q_water'), ...choicesOf(['c_trans', 'c_long', 'c_nowave', 'c_both']) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked];
        const noteOf = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey])}` : '');
        // the answer shown on the picture: the marks and labels come back
        if (k === 'rope' || k === 'where') {
          s.show = { labels: true, swing: true, feature: null };
          syncScene();
          refresh();
        } else if (k === 'feature') {
          s.show = { labels: true, swing: false, feature: null };
          syncScene();
          refresh();
        } else if (k === 'sound') setScene('spring', { time: SETTLE + 0.5, running: true });
        else setScene('rope', { time: SETTLE + 0.5, running: true });
        if (k === 'rope') return t('why_rope') + noteOf({ c_along: 'mis_along', c_carried: 'mis_carried', c_still: 'mis_still' });
        if (k === 'where') return t('why_where') + noteOf({ c_far: 'mis_far', c_back: 'mis_back', c_stuck: 'mis_stuck' });
        if (k === 'feature') {
          const comp = question.feature.kind === 'compression';
          return t(comp ? 'why_comp' : 'why_rare') + noteOf({ c_comp: 'mis_swap', c_rare: 'mis_swap', c_lambda: 'mis_lambda', c_amp: 'mis_amp' });
        }
        if (k === 'sound') return t('why_sound') + noteOf({ c_trans: 'mis_trans_sound', c_nowave: 'mis_nowave', c_both: 'mis_both' });
        return t('why_water') + noteOf({ c_long: 'mis_long_water', c_nowave: 'mis_nowave', c_both: 'mis_both' });
      },
      done() {
        s.running = false;
        refresh();
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    const frontBtn = ui.$('[data-view="front"]');
    if (frontBtn) frontBtn.hidden = !s.userMovedCamera;
    root.dataset.mode = s.mode === 'quiz' ? 'quiz' : 'explore';
    root.dataset.medium = s.medium;
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
  }
  function goHome() {
    s.userMovedCamera = false;
    choose(s.medium, { animate: true });
    syncUI();
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.example) choose(b.dataset.example);
    if (b.dataset.view === 'front') homeView();
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.act === 'reset') goHome();
    else if (b.dataset.act === 'q-next') quiz.next();
    else if (b.dataset.act === 'q-again') quiz.start();
    else if (b.dataset.act === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    const tgt = /** @type {Element} */ (e.target);
    if (tgt.closest('input, textarea, select, .pvc-examples') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(tgt.closest('button'));
    const sceneKey = ['r', 'R', 'Home', 'ArrowRight', 'ArrowLeft'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'ArrowRight') choose('spring');
    else if (k === 'ArrowLeft') choose('rope');
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  syncScene();
  place(viewPose());
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
     * medium: 'rope' | 'spring' (starts at rest); running: true | false; t: the wave's clock in seconds (a moment,
     * e.g. for a picture). `seen` marks media as found (for a page that opens with the comparison filled in).
     */
    async set(p = {}) {
      if (s.mode === 'quiz' && (p.medium != null || p.t != null || p.running != null)) quiz.stop();
      if (p.medium != null && MEDIA.includes(p.medium)) choose(p.medium, { animate: p.animate !== false });
      if (p.t != null) {
        s.t = Math.max(0, Number(p.t) || 0);
        if (s.t >= SETTLE) s.seen[s.medium] = true;
      }
      if (Array.isArray(p.seen)) for (const m of p.seen) if (MEDIA.includes(m)) s.seen[m] = true;
      if (p.running != null) s.running = Boolean(p.running);
      if (p.tap) {
        lastAct = Number.NEGATIVE_INFINITY;
        doAction();
      }
      syncScene();
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.seen = { rope: false, spring: false };
      s.show = { labels: true, swing: true, feature: null };
      s.medium = 'rope';
      goHome();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The medium as it is now, the driver and the stand, in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'WaveTypes';
      const bench = setting.top.clone();
      g.add(bench);
      for (const part of [rope.root, spring.root, driver.root, stand.root]) if (part.visible) g.add(part.clone(true));
      g.traverse((c) => {
        if (c.isMesh && c.geometry?.attributes?.position?.usage === THREE.DynamicDrawUsage) c.geometry = c.geometry.clone();
      });
      return g;
    },
  };
}
