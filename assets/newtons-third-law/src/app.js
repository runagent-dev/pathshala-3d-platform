import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { buildStudentShell, cleanSheet, bindCleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createAudio } from '@shared/student/audio.js';
import { createLessonArrow } from './arrow.js';
import { createBoatScene } from './boat.js';
import { createEarthScene, EARTH_R } from './earth.js';
import { createPresentation } from './presentation.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { BOAT, APPLE_MASS, EARTH_MASS, G, boatAt, appleAt, earthAcceleration, sci } from './physics.js';

export const DEFAULTS = {
  example: 'boat',
  at: '',
  view: 'front',
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};
const SLOW = 2;
const APPLE_SLOW = 6;
const APPLE_DISTANCE = 0.9; // pause before contact, so only the free-fall force pair needs to be shown
const APPLE_END = Math.sqrt((2 * APPLE_DISTANCE) / G);
const IDS = ['boat', 'apple'];
const CALC_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8.5 7h7M8.5 11.5h1M14.5 11.5h1M8.5 15.5h1M14.5 15.5h1M8.5 18.5h1M14.5 18.5h1"/></svg>';
const FORCE_GOLD = '#ffc531';
const GRAVITY_VIOLET = '#b9a0ff';
const SCRATCH = new THREE.Vector3();
const SCRATCH2 = new THREE.Vector3();
const VELOCITY_INK = '#0f3a66';
const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const scientific = (x) => {
    const q = sci(x);
    return `${N(q.mantissa)} × ${N(10)}<sup>${q.exponent < 0 ? '−' : ''}${N(Math.abs(q.exponent))}</sup>`;
  };
  root.classList.add('pvc', 'nt');
  root.lang = t.lang;
  root.dataset.ui = 'simple';
  root.dataset.theme = o.bg;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, {
      examples: { label: 'pairs', items: IDS.map((id) => ({ id, label: `chip_${id}` })) },
      quiet: [{ act: 'maths-open', label: 'maths_open', icon: CALC_ICON }],
      lines: { action: 1, outcome: 2, rule: 2 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);
  const mathsDialog = document.createElement('dialog');
  mathsDialog.className = 'nt-math-dialog';
  mathsDialog.setAttribute('aria-label', t('maths_title'));
  root.append(mathsDialog);
  let resumeAfterMath = false;
  const equations = document.createElement('div');
  equations.className = 'nt-equations';
  ui.$('.pvc-rule').before(equations);
  const stage = createStage(ui.canvasHost, { fov: 26, near: 0.05, far: 100, environment: 'studio-light' });
  const { scene, camera, controls } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = false;
  controls.minDistance = 3;
  controls.maxDistance = 30;
  const boat = createBoatScene(),
    earth = createEarthScene({ renderer: stage.renderer });
  const presentation = createPresentation(
    stage,
    o.bg === 'transparent',
    ['Sky', 'Clouds'].map((name) => boat.setting.getObjectByName(name)),
  );
  scene.add(boat.root, earth.root);
  const audio = createAudio(o.sound);
  const listeners = new Map();
  const emit = (name, payload) => {
    for (const fn of listeners.get(name) || []) fn(payload);
  };
  const s = {
    example: IDS.includes(o.example) ? o.example : 'boat',
    time: 0,
    running: false,
    done: false,
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    showFirst: true,
    showSecond: true,
    lessonStep: 0,
    reason: null,
  };
  let action = null;
  let quiz = null;
  let lastText = '';
  let lastEquations = '';
  let lastPhase = '';
  function screenBox(bounds) {
    if (bounds.isEmpty()) return null;
    const box = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    const { min, max } = bounds;
    for (const x of [min.x, max.x])
      for (const y of [min.y, max.y])
        for (const z of [min.z, max.z]) {
          const p = SCRATCH.set(x, y, z).project(camera);
          const px = (p.x * 0.5 + 0.5) * stage.width;
          const py = (-p.y * 0.5 + 0.5) * stage.height;
          box.left = Math.min(box.left, px);
          box.right = Math.max(box.right, px);
          box.top = Math.min(box.top, py);
          box.bottom = Math.max(box.bottom, py);
        }
    return box;
  }
  function boyScreenBox() {
    return s.example === 'boat' ? screenBox(boat.personBounds) : null;
  }
  function appleScreenBoxes() {
    if (s.example !== 'apple') return [];
    return [earth.earth, earth.apple, earth.root.getObjectByName('AppleStart'), force1.root, force2.root]
      .filter((object) => object.visible)
      .map((object) => {
        object.updateWorldMatrix(true, true);
        const bounds = new THREE.Box3();
        if (object === earth.earth) {
          // A rotated sphere keeps its radius; a rotated bounding cube would hide useful labels.
          bounds.setFromCenterAndSize(object.getWorldPosition(v()), v(EARTH_R * 2, EARTH_R * 2, EARTH_R * 2));
          return screenBox(bounds);
        }
        object.traverseVisible((mesh) => {
          if (mesh instanceof THREE.Mesh && mesh.material.visible !== false) bounds.expandByObject(mesh);
        });
        return screenBox(bounds);
      })
      .filter(Boolean);
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, boyScreenBox, appleScreenBoxes, () => action?.ringBox(), () => action?.box()],
  });
  // A label is placed once; later calls only change its words (when they differ), so it keeps its spot and nothing is
  // written to the page while the words stay the same.
  const label = (id, opts) => {
    if (anno.has(id)) anno.update(id, { text: opts.text });
    else anno.add(id, opts);
  };
  const arrow = (name, colour, dashed = false, style = {}) => {
    const a = createLessonArrow({ name, color: colour, dashed, ...style });
    scene.add(a.root);
    return a;
  };
  // the force pair: gold (a push) or violet (gravity), outlined dark inside a white halo; the velocities white inside
  // a navy edge, so neither melts into the blue river or the wooden boat
  const force1 = arrow('ForceOnBoyOrApple', FORCE_GOLD);
  const force2 = arrow('ForceOnBoatOrEarth', FORCE_GOLD, true);
  const motion1 = arrow('BoyVelocity', '#ffffff', false, { edge: '#0f3a66', halo: null });
  const motion2 = arrow('BoatVelocity', '#ffffff', false, { edge: '#0f3a66', halo: null });
  const measurement = new THREE.Line(
    new THREE.BufferGeometry()
      .setAttribute('position', new THREE.Float32BufferAttribute(12, 3))
      .setAttribute('lineDistance', new THREE.Float32BufferAttribute(4, 1)),
    new THREE.LineDashedMaterial({ color: 0xaed8f1, dashSize: 0.045, gapSize: 0.035, transparent: true, opacity: 0.65, depthTest: false }),
  );
  measurement.userData.noExport = true;
  measurement.frustumCulled = false;
  measurement.renderOrder = 3;
  scene.add(measurement);
  let sun = null;
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
    // the boy and the boat cast; the box is fitted round the whole jump (the boat's recoil to the boy's landing)
    // at the river the morning sun is the main light (so the shadows on the water and the jetty show); the
    // presentation's key light only fills in (see chooseExample)
    sun = new THREE.DirectionalLight(0xffebcd, 2.4);
    sun.target.position.set(0.3, 0.6, 0);
    sun.position.set(-3.6, 6.6, 1.5); // from the left, so the shadows fall to the right of the boat and the boy, in view
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 3;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.01;
    Object.assign(sun.shadow.camera, { left: -1.8, right: 1.75, top: 3.35, bottom: -2.9, near: 3.5, far: 13 });
    sun.shadow.camera.updateProjectionMatrix();
    scene.add(sun, sun.target);
  }
  const maxTime = () => (s.example === 'boat' ? BOAT.duration : APPLE_END);
  const stateNow = () =>
    s.example === 'boat'
      ? boatAt(s.time)
      : { time: s.time, phase: s.time === 0 ? 'rest' : 'fall', fallen: appleAt(s.time).fallen, force: APPLE_MASS * G };
  function getState() {
    const m = stateNow();
    return {
      example: s.example,
      scene: s.example,
      phase: m.phase,
      time: s.time,
      playing: s.running,
      done: s.done,
      mode: s.mode,
      view: s.view,
      force: m.force,
      masses: s.example === 'boat' ? { person: BOAT.personMass, boat: BOAT.boatMass } : { apple: APPLE_MASS, earth: EARTH_MASS },
      ...(s.example === 'boat'
        ? {
            position: { person: m.personX, boat: m.boatX, personY: m.personY },
            speed: { person: m.personV, boat: m.boatV },
            horizontalAcceleration: { person: m.personA, boat: m.boatA },
          }
        : { fallen: m.fallen, acceleration: { apple: G, earth: earthAcceleration() }, lesson: { step: s.lessonStep, reason: s.reason } }),
      arrows:
        s.example === 'boat'
          ? { onPerson: force1.root.visible, onBoat: force2.root.visible }
          : { onApple: force1.root.visible, onEarth: force2.root.visible },
    };
  }
  function setCamera() {
    const dir = s.view === '3d' ? (s.example === 'boat' ? v(-0.38, 0.3, 1) : v(0.35, 0.14, 1)) : s.example === 'boat' ? v(0, 0.23, 1) : v(0, 0, 1);
    const p = fitPose({
      box: s.example === 'boat' ? boat.bounds : earth.bounds,
      dir: dir.normalize(),
      camera,
      width: stage.width,
      height: stage.height,
      margin: {
        top: s.example === 'apple' && stage.height < 260 ? 50 : 60,
        bottom: 14,
        side: s.example === 'apple' && stage.height > stage.width * 1.3 ? 100 : 16,
      },
    });
    camera.position.copy(p.position);
    controls.target.copy(p.target);
    controls.update();
    stage.invalidate();
  }
  stage.onResize(setCamera);
  function setView(view) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    ui.$$('[data-view]').forEach((b) => b.classList.toggle('on', b.dataset.view === s.view));
    setCamera();
    emit('view', { view: s.view });
  }
  function fullEquationHtml() {
    if (s.example === 'boat')
      return `<div class="nt-pair">${t('pair_formula')}</div><small>${t('boat_masses', { m: BOAT.personMass, M: BOAT.boatMass })}</small>`;
    return `<small class="nt-parameters">${t('apple_masses', { m: APPLE_MASS, M: scientific(EARTH_MASS) })}</small>
  <div class="nt-magnitude"><span class="nt-formula">${t('magnitude', { f: (APPLE_MASS * G).toFixed(1) })}</span><span class="nt-pair">${t('gravity_pair')}</span></div>
  <div>${t('apple_acc', { g: G })}</div><div class="nt-earth-acc">${t('earth_acc', { a: scientific(earthAcceleration()) })}</div>
  <small class="nt-constants">${t('constants', { G: scientific(6.67e-11), g: G })}</small><small>${t('distance')}</small>`;
  }
  // The force-pair box under the action: the two forces named (who pushes or pulls whom) with their size and the
  // arrow's solid or dashed key, then one small line of notes (what is left out, how slow time runs). The apple's
  // lesson uses the same box: the steps (on wide frames), then the pair, the question, or the two accelerations.
  function pairRow(key, arrowGlyph, dashed, value) {
    return `<div class="nt-pull-row"><span class="nt-pull-key${dashed ? ' dash' : ''}" aria-hidden="true">${arrowGlyph}</span><span>${t(key)}</span>${value ? `<b>${value}</b>` : ''}</div>`;
  }
  function equationHtml() {
    if (s.example === 'boat') {
      const f = t('force_number', { f: BOAT.force });
      const rows = pairRow('pair_boat_on_boy', '→', false, f) + pairRow('pair_boat_on_boat', '←', true, f);
      return `<div class="nt-lesson-content">${rows}<p class="nt-caption">${t('caption_boat', { n: SLOW })}</p></div>`;
    }
    const progress = `<ol class="nt-progress" aria-label="${t('lesson_progress')}">${['lesson_fall', 'lesson_pair', 'lesson_mass'].map((key, i) => `<li${s.lessonStep === i ? ' aria-current="step"' : ''}><b>${N(i + 1)}</b> ${t(key)}</li>`).join('')}</ol>`;
    let content;
    if (s.lessonStep === 2 && s.reason !== 'mass') {
      content = `<div class="nt-reasons"><button type="button" data-reason="mass">${t('reason_mass')}</button><button type="button" data-reason="force"${s.reason === 'force' ? ' aria-pressed="true"' : ''}>${t('reason_force')}</button></div><p class="nt-reason-feedback" role="status">${s.reason === 'force' ? t('reason_retry', { f: APPLE_MASS * G }) : ''}</p>`;
    } else if (s.lessonStep === 2) {
      content = `<div class="nt-simple-row"><span>${t('simple_apple_label')}</span><strong>${t('summary_apple')}</strong></div><div class="nt-simple-row"><span>${t('simple_earth_label')}</span><strong>${t('summary_earth')}</strong></div><p class="nt-caption">${t('caption_apple_end')}</p>`;
    } else {
      const reading = s.lessonStep === 1 ? t('force_number', { f: APPLE_MASS * G }) : '';
      content = `${pairRow('pull_apple', '↓', false, reading)}${pairRow('pull_earth', '↑', true, reading)}<p class="nt-caption">${t('caption_apple', { n: APPLE_SLOW })}</p>`;
    }
    return `${progress}<div class="nt-lesson-content">${content}</div>`;
  }
  function openMaths() {
    if (s.mode === 'quiz') return;
    resumeAfterMath = s.running;
    s.running = false;
    updatePicture();
    mathsDialog.innerHTML = `<h2>${t('maths_title')}</h2><div class="nt-dialog-maths">${fullEquationHtml()}</div><button type="button" class="pvc-btn primary" data-act="maths-close">${t('maths_close')}</button>`;
    mathsDialog.showModal();
    updatePicture();
  }
  mathsDialog.addEventListener('close', () => {
    if (resumeAfterMath && s.mode === 'explore') {
      s.running = true;
    }
    resumeAfterMath = false;
    updatePicture();
  });
  function syncMode() {
    root.dataset.mode = s.mode;
    ui.learn.inert = s.mode === 'quiz';
    ui.quiz.inert = s.mode !== 'quiz';
    for (const button of ui.$$('.pvc-tabs [data-mode]')) {
      const selected = button.dataset.mode === s.mode;
      button.classList.toggle('on', selected);
      button.setAttribute('aria-selected', String(selected));
    }
  }
  function updatePanel(m) {
    root.dataset.example = s.example;
    syncMode();
    sheet.choose(s.example);
    const key =
      s.example === 'boat'
        ? `boat_${m.phase === 'landed' ? 'done' : m.phase}`
        : s.lessonStep === 2
          ? s.reason === 'mass'
            ? 'guide_understood'
            : 'guide_question'
          : s.lessonStep === 1
            ? 'guide_pair'
            : s.done
              ? 'guide_observed'
              : s.time > 0
                ? 'guide_falling'
                : 'guide_ready';
    if (key !== lastText) {
      sheet.outcome(t(key));
      lastText = key;
    }
    sheet.rule(
      t(
        s.example === 'boat'
          ? 'rule_boat'
          : s.lessonStep === 2
            ? s.reason === 'mass'
              ? 'guide_rule_end'
              : 'guide_rule_question'
            : s.lessonStep === 1
              ? 'guide_rule_pair'
              : 'guide_rule_start',
      ),
    );
    const html = equationHtml();
    if (html !== lastEquations) {
      equations.innerHTML = html;
      lastEquations = html;
    }
    if (action) {
      const actionLabel =
        s.example === 'boat'
          ? s.done
            ? 'act_again'
            : 'act_boat'
          : s.lessonStep === 2
            ? s.reason === 'mass'
              ? 'act_restart'
              : 'act_answer'
            : s.lessonStep === 1
              ? 'act_reason'
              : s.done
                ? 'act_compare'
                : 'act_apple';
      action.set({
        label: actionLabel,
        step: s.example === 'boat' ? 1 : s.lessonStep + 1,
        target: target,
        enabled: !s.running && !(s.example === 'apple' && s.lessonStep === 2 && s.reason !== 'mass'),
      });
      if (s.running || s.time > 0) action.hide('running');
      else action.show('running');
    }
  }
  const remove = (id) => anno.remove(id);
  const gravitySpots = (side) => [28, 44, 60, 80].map((gap) => ({ dx: side * gap, dy: 0 }));
  // the middle of each gravity arrow's shaft (one vector per arrow, reused every frame)
  const anchors = new Map();
  const gravityAnchor = (arrow, dashed) => {
    if (!anchors.has(arrow)) anchors.set(arrow, v(0, 0));
    return anchors
      .get(arrow)
      .copy(arrow.tip)
      .setY(arrow.tip.y + (dashed ? -0.43 : 0.43));
  };
  function gravitySide() {
    camera.updateMatrixWorld(true);
    if (!force1.root.visible || !force2.root.visible) return -1;
    const left = SCRATCH.copy(gravityAnchor(force1, false)).project(camera).x;
    return left <= SCRATCH2.copy(gravityAnchor(force2, true)).project(camera).x ? -1 : 1;
  }
  let lastGravitySide = 0;
  stage.onBeforeRender(() => {
    if (s.example !== 'apple') return;
    const side = gravitySide();
    if (side === lastGravitySide) return;
    lastGravitySide = side;
    // Keep the cards outside the pair even when the student rotates the camera behind it.
    anno.update('force1', { spots: gravitySpots(side) });
    anno.update('force2', { spots: gravitySpots(-side) });
  });
  function forceLabel(id, a, key, dashed, dy) {
    const gravity = s.example === 'apple';
    const text = `<span class="nt-key ${dashed ? 'dash' : ''}"></span>${t(key)}${!gravity || s.mode === 'quiz' || s.lessonStep > 0 ? `<br><b>${t('force_value', { f: gravity ? APPLE_MASS * G : BOAT.force })}</b>` : ''}`;
    label(id, {
      text: gravity ? `<span class="nt-gravity-label" data-force-body="${dashed ? 'earth' : 'apple'}">${text}</span>` : text,
      kind: 'callout',
      color: gravity ? '#6741b5' : '#a05000',
      point: gravity ? () => gravityAnchor(a, dashed) : () => a.tip,
      spots: gravity
        ? gravitySpots(gravitySide() * (dashed ? -1 : 1))
        : [
            { dx: dashed ? -16 : 16, dy },
            { dx: 0, dy: dashed ? 40 : -40 },
            { dx: dashed ? -10 : 10, dy: dashed ? 34 : -46 },
            { dx: dashed ? 16 : -16, dy },
            { dx: 0, dy: dashed ? -40 : 40 },
            { dx: 0, dy: dashed ? 64 : -64 },
          ],
      optional: true,
    });
  }
  // reused every frame: where the arrows start and where the labels point
  const P = {
    a: v(0, 0),
    b: v(0, 0),
    boy: v(0, 0),
    boat: v(0, 0),
    apple: v(0, 0),
    start: v(0, 0),
    fallen: v(0, 0),
    earth: v(0.7, -1.68, 0.9),
    radius: v(0, 0),
  };
  const RIGHT = v(1, 0);
  const LEFT = v(-1, 0);
  const DOWN = v(0, -1);
  const UPWARD = v(0, 1);
  const measurePoints = [v(0, -EARTH_R, 1.14), v(-1.34, -EARTH_R, 1.14), v(-1.34, 0, 1.14), v(0, 0, 1.14)];
  let shownExample = null;
  function updatePicture() {
    const m = stateNow();
    if (shownExample !== s.example) {
      shownExample = s.example;
      for (const a of [force1, force2]) a.material.color.set(s.example === 'boat' ? FORCE_GOLD : GRAVITY_VIOLET);
      boat.root.visible = s.example === 'boat';
      earth.root.visible = s.example === 'apple';
    }
    measurement.visible = s.example === 'apple' && mathsDialog.open;
    force1.hide();
    force2.hide();
    motion1.hide();
    motion2.hide();
    if (s.example === 'boat') {
      boat.set(m);
      for (const id of ['apple', 'earth', 'radius', 'trail-start', 'trail-fallen']) remove(id);
      if (m.contact) {
        if (s.showFirst) force1.set(P.a.set(m.personX + 0.16, m.personY + 0.82, 0.63), RIGHT, 0.85);
        if (s.showSecond) force2.set(P.b.set(m.boatX - 0.15, 0.42, 0.63), LEFT, 0.85);
      } else if (s.time > BOAT.pushTime && s.mode === 'explore') {
        if (m.personV > 0) motion1.set(P.a.set(m.personX, m.personY + 0.7, 0.63), RIGHT, 0.62);
        motion2.set(P.b.set(m.boatX - 0.15, 0.42, 0.63), LEFT, 0.62);
      }
      // the force labels first: they matter most, so the part names (re-added after them) give way on a small view
      const forcesNow = force1.root.visible || force2.root.visible;
      if (forcesNow && !anno.has('force1') && !anno.has('force2')) for (const id of ['boy', 'boat']) remove(id);
      if (force1.root.visible) forceLabel('force1', force1, 'on_boy', false, -25);
      else remove('force1');
      if (force2.root.visible) forceLabel('force2', force2, 'on_boat', true, -25);
      else remove('force2');
      label('boy', {
        text: t('boy', { m: BOAT.personMass }),
        point: () => P.boy.copy(boat.person.position).add(SCRATCH.set(0, 1.48, 0.1)),
        spots: [
          { dx: 0, dy: -18 },
          { dx: 34, dy: 0 },
          { dx: -34, dy: 0 },
        ],
        optional: true,
      });
      label('boat', {
        text: t('boat', { m: BOAT.boatMass }),
        point: () => P.boat.copy(boat.boat.position).add(SCRATCH.set(-0.3, 0.05, 0.45)),
        spots: [
          { dx: 0, dy: 24 },
          { dx: -30, dy: 20 },
        ],
        optional: true,
      });
      if (motion1.root.visible) {
        label('motion-boy', {
          text: t('motion_boy'),
          point: () => motion1.tip,
          kind: 'callout',
          color: VELOCITY_INK,
          spots: [
            { dx: 12, dy: -14 },
            { dx: 0, dy: -30 },
          ],
          optional: true,
        });
      } else remove('motion-boy');
      if (motion2.root.visible) {
        label('motion-boat', {
          text: t('motion_boat'),
          point: () => motion2.tip,
          kind: 'callout',
          color: VELOCITY_INK,
          spots: [
            { dx: 0, dy: -35 },
            { dx: -12, dy: -22 },
          ],
          optional: true,
        });
      } else remove('motion-boat');
    } else {
      for (const id of ['boy', 'boat', 'motion-boy', 'motion-boat']) remove(id);
      earth.setFall(m.fallen);
      const y = earth.apple.position.y;
      // Both arrows lie in one diagram plane, so their identical lengths also look identical in the front view.
      if (s.showFirst) force1.set(P.a.set(-0.52, y, 1.18), DOWN, 0.6);
      if (s.showSecond) force2.set(P.b.set(0.8, -0.5, 1.18), UPWARD, 0.6);
      // Place the essential force cards before optional part names and the fall readout.
      if (force1.root.visible) forceLabel('force1', force1, 'on_apple', false, 0);
      else remove('force1');
      if (force2.root.visible) forceLabel('force2', force2, 'on_earth', true, 0);
      else remove('force2');
      const withTrail = s.mode === 'explore' && m.fallen > 0.02;
      earth.showTrail(withTrail, m.fallen);
      if (withTrail) {
        label('trail-start', {
          text: t('trail_start'),
          point: () => P.start.set(-0.4, earth.startY, 0.2),
          spots: [
            { dx: -16, dy: 0 },
            { dx: 24, dy: -14 },
          ],
          optional: true,
        });
        label('trail-fallen', {
          text: t('trail_fallen', { s: N(m.fallen.toFixed(1)) }),
          point: () => P.fallen.set(-0.4, earth.apple.position.y, 0.2),
          spots: [
            { dx: -16, dy: 0 },
            { dx: -12, dy: -25 },
          ],
          optional: true,
        });
      } else {
        remove('trail-start');
        remove('trail-fallen');
      }
      if (measurement.visible) {
        measurePoints[2].y = measurePoints[3].y = y;
        measurement.geometry.setFromPoints(measurePoints);
        // the dashes' distances in place (computeLineDistances makes a new GPU buffer each time)
        const d = measurement.geometry.attributes.lineDistance;
        for (let i = 1; i < 4; i++) d.setX(i, d.getX(i - 1) + measurePoints[i].distanceTo(measurePoints[i - 1]));
        d.needsUpdate = true;
      }
      label('apple', {
        text: t('apple', { m: APPLE_MASS }),
        point: () => P.apple.copy(earth.apple.position).add(SCRATCH.set(-0.29, 0.1, 0.2)),
        spots: [
          { dx: -25, dy: -12 },
          { dx: 0, dy: -32 },
        ],
        optional: true,
      });
      label('earth', {
        text: t('earth'),
        point: () => P.earth,
        spots: [
          { dx: 24, dy: 0 },
          { dx: 64, dy: 0 },
          { dx: 96, dy: 0 },
          { dx: 0, dy: 56 },
        ],
        optional: true,
      });
      if (measurement.visible)
        label('radius', {
          text: t('radius_symbol'),
          point: () => P.radius.set(-1.34, (y - EARTH_R) / 2, 1.14),
          spots: [{ dx: 12, dy: 0 }],
          optional: true,
        });
      else remove('radius');
    }
    updatePanel(m);
    stage.invalidate();
    if (m.phase !== lastPhase) {
      lastPhase = m.phase;
      emit('change', getState());
    }
  }
  const feet = new THREE.Box3();
  function target() {
    if (s.example === 'apple') return earth.hit;
    feet.min.copy(boat.person.position).add(SCRATCH.set(-0.12, 0, -0.15));
    feet.max.copy(boat.person.position).add(SCRATCH.set(0.2, 0.2, 0.15));
    return feet;
  }
  function chooseExample(example) {
    if (!IDS.includes(example)) return;
    if (mathsDialog.open) {
      resumeAfterMath = false;
      mathsDialog.close();
    }
    s.example = example;
    s.time = 0;
    s.done = false;
    s.running = false;
    s.showFirst = s.showSecond = true;
    s.lessonStep = 0;
    s.reason = null;
    lastText = '';
    anno.clear();
    presentation.set(example);
    if (sun) {
      // the sun leads at the river, with less of the studio's soft light, so the shadows read on the water and the jetty
      const river = example === 'boat';
      sun.visible = river;
      presentation.key.intensity = river ? 0.55 : 2.2;
      presentation.fill.intensity = river ? 0.55 : 0.8;
      scene.environmentIntensity = river ? 0.5 : 1;
    }
    setCamera();
    updatePicture();
    emit('example', { example });
  }
  function play() {
    if (s.mode === 'quiz' || s.running) return;
    s.time = 0;
    s.done = false;
    s.running = true;
    s.showFirst = s.showSecond = true;
    s.lessonStep = 0;
    s.reason = null;
    updatePicture();
    emit(s.example === 'boat' ? 'push' : 'release', getState());
  }
  function act() {
    if (s.mode === 'quiz' || s.running) return;
    if (s.example !== 'apple' || (s.lessonStep === 0 && !s.done) || (s.lessonStep === 2 && s.reason === 'mass')) {
      play();
      return;
    }
    if (s.lessonStep < 2) {
      s.lessonStep += 1;
      updatePicture();
      emit('change', getState());
    }
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_boat',
    target,
    pad: 8,
    avoid: [ui.corner, () => anno.boxes()],
    pulse: o.coach,
    onAct: act,
  });
  stage.addTicker((dt) => {
    if (!s.running) return false;
    s.time = Math.min(maxTime(), s.time + dt / (s.example === 'apple' ? APPLE_SLOW : SLOW));
    if (s.time >= maxTime()) {
      s.running = false;
      s.done = true;
      emit('done', getState());
    }
    updatePicture();
    return true;
  });
  const banks = [
    {
      kind: 'size',
      example: 'boat',
      at: 0.18,
      second: false,
      options: [t('opt_force', { f: 150 }), t('opt_force', { f: 300 }), t('opt_force', { f: 600 }), t('opt_force', { f: 0 })],
      answer: 1,
    },
    { kind: 'cancel', example: 'boat', at: 0.18, options: ['opt_two', 'opt_cancel', 'opt_later', 'opt_weaker'], answer: 0 },
    { kind: 'motion', example: 'boat', at: 0, options: ['opt_forward', 'opt_still', 'opt_back', 'opt_down'], answer: 2 },
    { kind: 'react', example: 'apple', at: 0.2, second: false, options: ['opt_less', 'opt_none', 'opt_same', 'opt_up'], answer: 3 },
    { kind: 'earth', example: 'apple', at: 0.2, options: ['opt_zero', 'opt_mass', 'opt_bigforce', 'opt_nogravity'], answer: 1 },
  ];
  quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    action,
    questions: 5,
    lines: { text: 3, feedback: 4 },
    hooks: {
      enter() {
        s.mode = 'quiz';
        s.running = false;
        setView('front');
        root.dataset.mode = 'quiz';
        syncMode();
      },
      leave() {
        s.mode = 'explore';
        syncMode();
        chooseExample('boat');
      },
      prepare(index) {
        const q = banks[index];
        chooseExample(q.example);
        s.time = q.at;
        s.showFirst = true;
        s.showSecond = q.second !== false;
        updatePicture();
        return {
          text: t(`q_${q.kind}`, { f: BOAT.force }),
          choices: [0, 1, 2, 3],
          expected: q.answer,
          tolerance: 0.1,
          label: (i) => (q.kind === 'size' ? q.options[i] : t(q.options[i])),
          meta: { kind: q.kind },
        };
      },
      reveal(q) {
        s.showFirst = s.showSecond = true;
        if (s.example === 'apple') anno.clear();
        updatePicture();
        return t(`why_${q.meta.kind}`, { f: BOAT.force });
      },
      done() {
        s.running = false;
      },
    },
  });
  root.addEventListener('click', (event) => {
    const b = event.target.closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    else if (b.dataset.mode === 'explore') quiz.stop();
    else if (b.dataset.example && s.mode !== 'quiz') chooseExample(b.dataset.example);
    else if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    else if (b.dataset.view && s.mode !== 'quiz') setView(b.dataset.view);
    else if (b.dataset.reason && s.example === 'apple' && s.lessonStep === 2 && s.mode !== 'quiz') {
      s.reason = b.dataset.reason;
      updatePicture();
      if (s.reason === 'mass') ui.$('.pvc-act').focus();
      else equations.querySelector('[data-reason="mass"]').focus();
      emit('change', getState());
    } else if (b.dataset.act === 'maths-open') openMaths();
    else if (b.dataset.act === 'maths-close') mathsDialog.close();
    else if (b.dataset.act === 'q-next') quiz.next();
    else if (b.dataset.act === 'q-again') quiz.start();
    else if (b.dataset.act === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.();
    }
  });
  const ray = new THREE.Raycaster();
  let tapStart = null;
  ui.canvasHost.addEventListener('pointerdown', (event) => {
    tapStart = { x: event.clientX, y: event.clientY };
  });
  ui.canvasHost.addEventListener('pointercancel', () => {
    tapStart = null;
  });
  ui.canvasHost.addEventListener('pointerup', (event) => {
    const start = tapStart;
    tapStart = null;
    if (s.mode === 'quiz' || !start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) return;
    const rect = stage.canvas.getBoundingClientRect();
    ray.setFromCamera(
      new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, (-(event.clientY - rect.top) / rect.height) * 2 + 1),
      camera,
    );
    if (ray.intersectObject(s.example === 'boat' ? boat.hit : earth.hit, true).length) act();
  });
  root.addEventListener('keydown', (event) => {
    if (event.target.closest('button') || s.mode === 'quiz') return;
    if ([' ', 'Enter', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      act();
    } else if (event.key === '1') chooseExample('boat');
    else if (event.key === '2') chooseExample('apple');
  });
  if (!document.fullscreenEnabled) ui.$('[data-act="fullscreen"]').hidden = true;
  chooseExample(s.example);
  setView(s.view);
  if (o.at !== '') {
    s.time = Math.min(maxTime(), Math.max(0, Number(o.at) || 0));
    updatePicture();
  }
  const ready = earth.ready.then(() => {
    stage.invalidate();
    if (o.mode === 'quiz') return quiz.start();
  });
  return {
    ready,
    on(name, fn) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(fn);
      return () => listeners.get(name).delete(fn);
    },
    getState,
    set(p = {}) {
      if (p.example) chooseExample(p.example);
      if (p.view) setView(p.view);
      if (p.home) {
        s.time = 0;
        s.done = false;
        s.running = false;
        s.lessonStep = 0;
        s.reason = null;
      }
      if (p.push) play();
      if (p.at != null) {
        s.time = Math.min(maxTime(), Math.max(0, Number(p.at) || 0));
        s.running = false;
        s.done = s.time >= maxTime();
      }
      if (s.example === 'apple' && p.lessonStep != null) {
        s.lessonStep = Math.max(0, Math.min(2, Math.trunc(Number(p.lessonStep) || 0)));
        s.running = false;
        s.reason = null;
      }
      updatePicture();
      return getState();
    },
    reset() {
      quiz.stop();
      s.mode = 'explore';
      chooseExample('boat');
      setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => presentation.capture(opts),
    exportRoot: () => (s.example === 'boat' ? boat.root : earth.root),
  };
}
