// Energy (book page 102, section 4.2 শক্তি): a rider pedals a bicycle up a hill (positive work gives it energy), rests
// at the top (the energy is stored by height), rolls down without pedalling (potential energy becomes kinetic energy,
// the total stays the same with no friction) and brakes on the flat road (negative work takes the energy away, as heat
// in the brakes). One action, one result (a bar of the energy), one rule in the book's words.
import * as THREE from 'three';
import { createArrow } from '@shared/arrow.js';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { BIKE, createBike } from './bike.js';
import { fitPose } from './camera.js';
import {
  CLIMB_SPEED,
  G,
  HILL,
  MASS,
  START_X,
  TOTAL,
  energyOf,
  fmt1,
  groupJ,
  heightAt,
  kinetic,
  potential,
  slopeAt,
  speedAt,
  step,
  xAtHeight,
} from './energy.js';
import { createLandscape } from './hill.js';
import { createI18n } from './i18n.js';
import { createRider } from './rider.js';

export const PHASES = ['start', 'climb', 'top', 'roll', 'flat', 'brake', 'stopped'];
const PARTS = ['up', 'down', 'brake'];
const PART_OF = { start: 'up', climb: 'up', top: 'up', roll: 'down', flat: 'down', brake: 'brake', stopped: 'brake' };
const MOVING = new Set(['climb', 'roll', 'flat', 'brake']);

export const DEFAULTS = {
  phase: 'start', // start already part way (pictures): one of PHASES
  height: '', // m: where on the way up (climb) or down (roll) to start
  hold: false, // keep a scene started part way still (pictures) until the student acts
  view: 'front',
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { push: '#e8590c', brake: '#c2255c' };
const VIEW_FRONT = new THREE.Vector3(0, Math.sin(THREE.MathUtils.degToRad(4)), Math.cos(THREE.MathUtils.degToRad(4)));
const VIEW_3D = new THREE.Vector3(-0.5, 0.38, 0.78).normalize();
const DOUBLE_TAP = 400; // ms
const FLAT_X = HILL.half + 1.5; // m: where the brake part starts when chosen from the words

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const J = (e) => t('m_value', { e: groupJ(e) });

  root.classList.add('pvc', 'en');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, {
      examples: { label: 'parts', results: true, items: PARTS.map((id) => ({ id, label: `chip_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 2, rule: 4 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));

  // the result: one bar of the bicycle's energy (height part, motion part; the heat the brakes took, hatched)
  const outcome = ui.$('.pvc-outcome');
  outcome.innerHTML = `<span class="en-meter" role="img"><span class="en-bar"><i class="pe"></i><i class="ke"></i><i class="heat"></i></span><span class="en-legend"><span class="pe"><i></i>${t('m_pe')} <b></b></span><span class="ke"><i></i>${t('m_ke')} <b></b></span><span class="third"><i></i><em></em> <b></b></span></span></span>`;
  const meter = {
    root: outcome.querySelector('.en-meter'),
    pe: outcome.querySelector('.en-bar .pe'),
    ke: outcome.querySelector('.en-bar .ke'),
    heat: outcome.querySelector('.en-bar .heat'),
    peText: outcome.querySelector('.en-legend .pe b'),
    keText: outcome.querySelector('.en-legend .ke b'),
    third: outcome.querySelector('.en-legend .third'),
    thirdName: outcome.querySelector('.en-legend .third em'),
    thirdText: outcome.querySelector('.en-legend .third b'),
  };

  const note = document.createElement('div');
  note.className = 'en-note';
  note.textContent = t('note', { m: MASS });
  ui.stage.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.1, far: 400, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  const SKY = { top: '#2f8fe0', low: '#bfe4fb' };
  if (o.bg !== 'transparent') {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, SKY.top);
    grad.addColorStop(0.75, SKY.low);
    grad.addColorStop(1, '#d9f0fc');
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    scene.background = tex;
  }
  scene.fog = new THREE.Fog(SKY.low, 90, 320);
  scene.add(new THREE.HemisphereLight('#d8ecff', '#4f7a2a', 0.9));
  const sun = new THREE.DirectionalLight('#fff1d6', 2.1);
  scene.add(sun, sun.target);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -2.2, right: 2.2, top: 2.2, bottom: -2.2, near: 1, far: 30 });
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
  }
  controls.enablePan = false;
  controls.enableRotate = false;
  controls.enableZoom = false;
  controls.minDistance = 4;
  controls.maxDistance = 60;
  controls.maxPolarAngle = Math.PI * 0.49;

  const world = new THREE.Group();
  world.name = 'Energy';
  scene.add(world);
  const land = createLandscape();
  world.add(land.root);
  const cyclist = new THREE.Group();
  cyclist.name = 'CyclistOnBicycle';
  const bike = createBike();
  const rider = createRider();
  bike.root.remove(bike.hit);
  cyclist.add(bike.root, rider.root, bike.hit);
  world.add(cyclist);

  // the force on the bicycle (pedal force along the motion, brake force against it) and the height above the road below
  const arrows = {
    push: createArrow({ color: COLORS.push, radius: 0.035, name: 'PedalForce' }),
    brake: createArrow({ color: COLORS.brake, radius: 0.035, name: 'BrakeForce' }),
  };
  for (const a of Object.values(arrows)) world.add(a.root);
  const dashed = (color) =>
    new THREE.LineDashedMaterial({ color, dashSize: 0.18, gapSize: 0.12, depthTest: false, transparent: true, opacity: 0.85 });
  const heightLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 1, 0)]), dashed('#3b4250'));
  heightLine.renderOrder = 10;
  heightLine.name = 'HeightGuide';
  const baseLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-HILL.half - 2, 0.02, 0.9), new THREE.Vector3(HILL.half + 2, 0.02, 0.9)]),
    dashed('#6b7280'),
  );
  baseLine.computeLineDistances();
  baseLine.renderOrder = 10;
  baseLine.name = 'RoadLevelGuide';
  for (const l of [heightLine, baseLine]) {
    l.userData.noExport = true;
    world.add(l);
  }

  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── the state: every line, label and arrow is drawn from it ────────────────
  const s = {
    phase: 'start',
    x: START_X,
    v: 0,
    heat: 0,
    wheel: 0, // the wheels' turn (radians)
    crank: Math.PI * 0.25, // the near crank's angle
    taken: 0, // actions the student has done since the last start (the button's step is taken + 1)
    found: { up: false, down: false, brake: false },
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    frozen: false, // a test scene: nothing moves
    held: false, // started part way and kept still (pictures, `hold`) until the student acts
    quizPE: false, // the test shows the potential energy as a label
    userMovedCamera: false,
  };
  let lastTap = Number.NEGATIVE_INFINITY;

  // ── where the bicycle is: both wheels on the road, the frame along the line between the axles ───────────────────
  const rearAxle = new THREE.Vector3();
  const frontAxle = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const axleAt = (x, out) => {
    const k = slopeAt(x);
    const n = 1 / Math.sqrt(1 + k * k);
    return out.set(x - k * n * BIKE.wheel, heightAt(x) + n * BIKE.wheel, 0);
  };
  const pelvis = new THREE.Vector3();
  const grips = [new THREE.Vector3(), new THREE.Vector3()];
  function placeCyclist() {
    const half = (BIKE.front.x - BIKE.rear.x) / 2;
    const c = 1 / Math.sqrt(1 + slopeAt(s.x) ** 2);
    axleAt(s.x - half * c, rearAxle);
    axleAt(s.x + half * c, frontAxle);
    const pitch = Math.atan2(frontAxle.y - rearAxle.y, frontAxle.x - rearAxle.x);
    cyclist.rotation.z = pitch;
    tmp.copy(BIKE.rear).applyAxisAngle(new THREE.Vector3(0, 0, 1), pitch);
    cyclist.position.copy(rearAxle).sub(tmp);
    bike.roll(s.wheel);
    bike.setCrank(s.crank);
    const pedals = bike.pedals();
    const braking = s.phase === 'brake';
    const climbing = s.phase === 'climb';
    // the rider leans into the climb, sits up a little over the top, and braces back while braking
    const lean = climbing ? 0.86 + 0.03 * Math.sin(2 * s.crank) : braking ? 0.66 : 0.76;
    pelvis.copy(BIKE.saddle).add(tmp.set(braking ? -0.05 : -0.025, 0.075, 0));
    grips[0].copy(BIKE.grip);
    grips[1].copy(BIKE.grip).setZ(-BIKE.grip.z);
    rider.pose({
      pelvis,
      lean,
      grips,
      pedals,
      ankles: [0, 1].map((i) => 0.12 + 0.14 * Math.sin(s.crank + i * Math.PI)),
      look: 0.85,
    });
    bike.setHeat(braking ? Math.min(1, s.v / 6 + 0.25) : s.phase === 'stopped' ? 0.15 : 0);
    cyclist.updateMatrixWorld(true);
    // the arrows: along the road, in front while pedalling, behind while braking
    const k = slopeAt(s.x);
    tangent.set(1, k, 0).normalize();
    if (climbing && heightAt(s.x) < HILL.height - 0.35) {
      arrows.push.set(
        tmp
          .copy(frontAxle)
          .addScaledVector(tangent, 0.45)
          .add(new THREE.Vector3(0, 0.25, 0.5)),
        tangent,
        1.1,
      );
    } else arrows.push.hide();
    if (braking)
      arrows.brake.set(
        tmp
          .copy(rearAxle)
          .addScaledVector(tangent, -0.4)
          .add(new THREE.Vector3(0, 0.25, 0.5)),
        tangent.clone().negate(),
        1.1,
      );
    else arrows.brake.hide();
    // the height above the road below: a dashed line down through the hill to the road's level
    const y = heightAt(s.x);
    heightLine.visible = baseLine.visible = y > 0.05;
    heightLine.geometry.setFromPoints([new THREE.Vector3(s.x, 0.02, 0.9), new THREE.Vector3(s.x, y, 0.9)]);
    heightLine.computeLineDistances();
    // the sun follows, so the shadow under the bicycle stays sharp
    sun.position.set(s.x + 3, y + 9, 6);
    sun.target.position.set(s.x, y, 0);
  }

  // ── camera: follows the bicycle, the road's level always in view so the height reads ─────────────────────────────
  const frame = new THREE.Box3();
  const followAt = new THREE.Vector3();
  function viewPose(view = s.view) {
    const y = heightAt(s.x);
    const ahead = s.phase === 'climb' || MOVING.has(s.phase) ? 0.8 : 0.4;
    const half = stage.width / Math.max(1, stage.height) < 1.3 ? 4.2 : 6; // m each side: closer on tall screens
    frame.min.set(s.x + ahead - half, -0.3, -0.6);
    frame.max.set(s.x + ahead + half, Math.max(3.2, y + 2.4), 0.9);
    const top = Math.min(58, stage.height * 0.18);
    return fitPose({
      box: frame,
      dir: view === '3d' ? VIEW_3D : VIEW_FRONT,
      camera,
      width: stage.width,
      height: stage.height,
      margin: { top, bottom: 14, side: 6 },
    });
  }
  function followCamera() {
    if (!s.userMovedCamera) {
      const p = viewPose();
      camera.position.copy(p.position);
      controls.target.copy(p.target);
    } else {
      // the student turned the view: keep their angle, move along with the bicycle
      followAt.set(s.x, heightAt(s.x) + 0.9, 0);
      tmp.subVectors(followAt, controls.target);
      camera.position.add(tmp);
      controls.target.add(tmp);
    }
    controls.update();
  }
  function setView(view) {
    if (s.mode === 'quiz') return;
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = controls.enableZoom = s.view === '3d';
    s.userMovedCamera = false;
    followCamera();
    syncUI();
    stage.invalidate();
    emit('view', { view: s.view });
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
  });
  controls.addEventListener('change', () => stage.invalidate());

  // ── labels on the scene ─────────────────────────────────────────────────────
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const bodyBox = new THREE.Box3();
  const tmpBox = new THREE.Box3();
  const screen = { left: 0, top: 0, right: 0, bottom: 0 };
  function cyclistBox() {
    bodyBox.setFromObject(bike.root);
    return bodyBox.union(tmpBox.setFromObject(rider.root));
  }
  function screenBox(box3, out) {
    let i = 0;
    for (const x of [box3.min.x, box3.max.x])
      for (const y of [box3.min.y, box3.max.y]) for (const z of [box3.min.z, box3.max.z]) corners[i++].set(x, y, z).project(camera);
    out.left = out.top = Number.POSITIVE_INFINITY;
    out.right = out.bottom = Number.NEGATIVE_INFINITY;
    for (const c of corners) {
      const px = (c.x * 0.5 + 0.5) * stage.width;
      const py = (-c.y * 0.5 + 0.5) * stage.height;
      out.left = Math.min(out.left, px);
      out.right = Math.max(out.right, px);
      out.top = Math.min(out.top, py);
      out.bottom = Math.max(out.bottom, py);
    }
    return out;
  }
  const arrowBoxes = [0, 1].map(() => ({ left: 0, top: 0, right: 0, bottom: 0 }));
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [
      ui.corner,
      ui.hint,
      note,
      () => action?.ringBox(),
      () => action?.box(),
      () => [
        screenBox(cyclistBox(), screen),
        ...Object.values(arrows).flatMap((a, i) => (a.root.visible ? [screenBox(tmpBox.setFromObject(a.root), arrowBoxes[i])] : [])),
      ],
    ],
  });
  const grid = (dys, dxs) => dys.flatMap((dy) => dxs.map((dx) => ({ dx, dy })));
  const SPOTS = {
    height: grid([0, -20, 20, -40, 40], [-14, 14, -40, 40]),
    force: grid([-26, -46, 26, -66, 46], [0, 30, -30, 60, -60, 90, -90]),
    pe: grid([-40, -60, -80, 40], [0, 40, -40, 80, -80]),
  };
  const midHeight = new THREE.Vector3();
  const arrowMid = new THREE.Vector3();
  const pePoint = new THREE.Vector3();
  function label(id, show, opts) {
    if (!show) {
      if (anno.has(id)) anno.remove(id);
      return;
    }
    if (anno.has(id)) {
      anno.setText(id, opts.text);
      anno.update(id, { color: opts.color });
    } else anno.add(id, opts);
  }
  function labels() {
    const y = heightAt(s.x);
    midHeight.set(s.x, y / 2, 0.9);
    label('height', y > 0.4, { text: t('l_height', { h: fmt1(y) }), point: () => midHeight, kind: 'part', spots: SPOTS.height, optional: true });
    const a = arrows.push.root.visible ? arrows.push : arrows.brake.root.visible ? arrows.brake : null;
    if (a) arrowMid.copy(a.root.position).lerp(a.tip, 0.5);
    label('force', Boolean(a), {
      text: t(a === arrows.push ? 'l_push' : 'l_brake'),
      color: a === arrows.push ? COLORS.push : COLORS.brake,
      point: () => arrowMid,
      kind: 'part',
      spots: SPOTS.force,
      optional: true,
    });
    pePoint.copy(cyclist.position).add(tmp.set(0, 1.9, 0));
    label('pe', s.quizPE, {
      text: t('l_pe', { e: groupJ(energyOf(s).potential) }),
      color: '#5f3dc4',
      point: () => pePoint,
      kind: 'callout',
      spots: SPOTS.pe,
    });
    anno.update();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  function next() {
    if (s.held) return { label: 'act_go', kind: 'go', enabled: true };
    switch (s.phase) {
      case 'start':
        return { label: 'act_climb', kind: 'climb', enabled: true };
      case 'climb':
        return { label: 'act_climbing', kind: 'climb', enabled: false };
      case 'top':
        return { label: 'act_roll', kind: 'roll', enabled: true };
      case 'roll':
        return { label: 'act_brake', kind: 'brake', enabled: false };
      case 'flat':
        return { label: 'act_brake', kind: 'brake', enabled: true };
      case 'brake':
        return { label: 'act_braking', kind: 'brake', enabled: false };
      default:
        return { label: 'act_again', kind: 'again', enabled: true };
    }
  }
  /** The student's own step on the button: the one being done while it runs (climbing, braking), else the next. */
  const stepOf = (n) => (n.kind === 'again' ? '' : Math.max(1, s.taken + (s.phase === 'climb' || s.phase === 'brake' ? 0 : 1)));
  function refresh() {
    const e = energyOf(s);
    const pct = (j) => `${Math.max(0, Math.min(100, (j / TOTAL) * 100)).toFixed(2)}%`;
    meter.pe.style.width = pct(e.potential);
    meter.ke.style.width = pct(e.kinetic);
    meter.heat.style.width = pct(e.heat);
    meter.peText.textContent = J(e.potential);
    meter.keText.textContent = J(e.kinetic);
    const heat = e.heat > 5;
    meter.third.className = heat ? 'heat' : 'tot';
    meter.thirdName.textContent = t(heat ? 'm_heat' : 'm_total');
    meter.thirdText.textContent = J(heat ? e.heat : e.total);
    meter.root.setAttribute(
      'aria-label',
      t('m_aria', { pe: groupJ(e.potential), ke: groupJ(e.kinetic), total: groupJ(e.total), heat: groupJ(e.heat) }),
    );
    sheet.rule(t(`rule_${s.phase}`, { e: groupJ(s.phase === 'stopped' ? e.heat : TOTAL), v: fmt1(speedAt(0)) }));
    const part = PART_OF[s.phase];
    sheet.choose(part);
    sheet.next(s.phase === 'top' ? 'down' : s.phase === 'flat' ? 'brake' : s.phase === 'stopped' ? 'up' : null);
    sheet.result('up', s.found.up ? t('res_up', { e: groupJ(TOTAL) }) : '');
    sheet.result('down', s.found.down ? t('res_down') : '');
    sheet.result('brake', s.found.brake ? t('res_brake', { e: groupJ(TOTAL) }) : '');
    const n = next();
    action?.set({
      step: stepOf(n),
      label: n.label,
      icon: n.kind === 'again' ? ICONS.reset : ICONS.hand,
      enabled: n.enabled && !s.locked,
    });
    labels();
    stage.invalidate();
  }

  function snapshot() {
    const e = energyOf(s);
    const r = (j) => Math.round(j / 10) * 10;
    const n = next();
    return {
      phase: s.phase,
      x: Math.round(s.x * 100) / 100,
      height: Math.round(e.height * 100) / 100,
      speed: Math.round(s.v * 100) / 100,
      energy: { potential: r(e.potential), kinetic: r(e.kinetic), total: r(e.total), heat: r(e.heat), work: r(e.work) },
      found: { ...s.found },
      next: { action: n.kind, step: stepOf(n), enabled: n.enabled && !s.locked },
      view: s.view,
      mode: s.mode,
    };
  }
  let lastPhase = s.phase;
  function emitChange() {
    emit('change', snapshot());
  }

  // ── the trip ────────────────────────────────────────────────────────────────
  /** Put the bicycle at a phase at once (pictures, the test, the words): height for climb/roll, speed for brake. */
  function jumpTo(phase, { height, speed } = {}) {
    const p = PHASES.includes(phase) ? phase : 'start';
    s.held = false;
    s.phase = p;
    s.heat = 0;
    s.v = 0;
    const h = Number.isFinite(+height) && height !== '' && height != null ? Math.min(HILL.height - 0.05, Math.max(0, +height)) : null;
    if (p === 'start') s.x = START_X;
    else if (p === 'climb') {
      s.x = xAtHeight(h ?? 2.5, -1);
      s.v = CLIMB_SPEED;
    } else if (p === 'top') s.x = 0;
    else if (p === 'roll') {
      s.x = xAtHeight(h ?? 2.5, 1);
      s.v = speedAt(heightAt(s.x));
    } else if (p === 'flat') {
      s.x = FLAT_X;
      s.v = speedAt(0);
    } else {
      s.x = FLAT_X + 5;
      const v0 = speedAt(0);
      s.v = p === 'stopped' ? 0 : Math.min(v0, Number.isFinite(+speed) && speed !== '' && speed != null ? +speed : 6);
      s.heat = kinetic(v0) - kinetic(s.v);
    }
    // what the student would have seen to get here
    s.found.up = s.found.up || ['top', 'roll', 'flat', 'brake', 'stopped'].includes(p);
    s.found.down = s.found.down || ['flat', 'brake', 'stopped'].includes(p);
    s.found.brake = s.found.brake || p === 'stopped';
    if (p !== 'climb') s.crank = 0; // coasting: the cranks level
    lastPhase = p;
    placeCyclist();
    followCamera();
    refresh();
  }

  function doAction() {
    if (s.locked || s.mode === 'quiz') return lockedNudge();
    const now = performance.now();
    if (now - lastTap < DOUBLE_TAP) return;
    const n = next();
    if (!n.enabled) {
      action?.flash();
      return;
    }
    lastTap = now;
    audio.tick();
    s.held = false;
    if (n.kind === 'again') {
      goHome();
      return;
    }
    if (n.kind === 'go') {
      refresh();
      emitChange();
      return;
    }
    s.taken++;
    if (n.kind === 'climb') s.phase = 'climb';
    else if (n.kind === 'roll') s.phase = 'roll';
    else if (n.kind === 'brake') s.phase = 'brake';
    emit('action', { action: n.kind });
    refresh();
    emitChange();
  }

  function goHome() {
    s.taken = 0;
    s.userMovedCamera = false;
    jumpTo('start');
    emitChange();
  }

  /** Run the trip on: small steps, the wheels and cranks turning with the distance. */
  function advanceTrip(dt) {
    if (s.frozen || s.held || !MOVING.has(s.phase)) return false;
    const steps = Math.max(1, Math.ceil(dt / 0.01));
    for (let i = 0; i < steps; i++) {
      const before = s.x;
      const n = step(s, dt / steps);
      const ds = (n.x - before) * Math.sqrt(1 + slopeAt(before) ** 2);
      s.wheel -= ds / BIKE.wheel;
      if (s.phase === 'climb' && heightAt(n.x) < HILL.height - (CLIMB_SPEED * CLIMB_SPEED) / (2 * G)) s.crank -= ds / BIKE.wheel / BIKE.ratio;
      else {
        // coasting: the cranks come round to level and stay
        const level = Math.round(s.crank / Math.PI) * Math.PI;
        s.crank += (level - s.crank) * Math.min(1, (dt / steps) * 4);
      }
      Object.assign(s, { phase: n.phase, x: n.x, v: n.v, heat: n.heat ?? s.heat });
    }
    if (s.phase !== lastPhase) onPhase(lastPhase, s.phase);
    return true;
  }
  function onPhase(from, to) {
    lastPhase = to;
    if (to === 'top') s.found.up = true;
    if (to === 'flat') s.found.down = true;
    if (to === 'stopped') {
      s.found.brake = true;
      if (!s.locked) audio.success();
    }
    emit('phase', { from, to });
    refresh();
    emitChange();
  }

  let throttle = 0;
  stage.addTicker((dt) => {
    const moved = advanceTrip(dt);
    if (moved) {
      placeCyclist();
      followCamera();
      throttle += dt;
      if (throttle > 0.1) {
        throttle = 0;
        refresh();
      } else labels();
    }
    return moved;
  });
  stage.onResize(() => {
    followCamera();
    refresh();
  });

  // the big button in the panel and the numbered ring on the bicycle (taps on the ring go through to the bicycle)
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_climb',
    target: () => cyclistBox(),
    pad: 6,
    avoid: [
      ui.corner,
      ui.hint,
      note,
      () => anno.boxes(),
      () => Object.values(arrows).flatMap((a, i) => (a.root.visible ? [screenBox(tmpBox.setFromObject(a.root), arrowBoxes[i])] : [])),
    ],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── touching the scene: the bicycle acts like the big button ───────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const r = stage.canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / stage.width) * 2 - 1, -((e.clientY - r.top) / stage.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.intersectObject(bike.hit, false).length === 0) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      doAction();
    },
    true,
  );

  let hintTimer = 0;
  function lockedNudge() {
    ui.hintText.textContent = t('q_locked');
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(hintOff, 2600);
  }
  function hintOff() {
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
  const word = (key) => ({ key, text: t(key) });
  const joules = (key, j) => ({ key, text: J(j) });
  /** Four tap choices (the right one first in `items`): shuffled, with the index of the right one. */
  function choices(items, kind) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="en-opt">${list[j].text}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  const KINDS = ['climb', 'top', 'roll', 'brake', 'dir', 'unit'];
  let kinds = [];
  let question = null;
  let learnSaved = null;
  function setScene(phase, opts, alive) {
    if (!alive()) return false;
    s.frozen = false;
    s.quizPE = false;
    jumpTo(phase, opts);
    s.frozen = true;
    return true;
  }
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    action,
    lines: { text: 3, feedback: 3 },
    hooks: {
      enter() {
        learnSaved = { phase: s.phase, x: s.x, v: s.v, heat: s.heat, taken: s.taken, found: { ...s.found } };
        s.mode = 'quiz';
        s.locked = true;
        s.view = 'front';
        s.userMovedCamera = false;
        controls.enableRotate = controls.enableZoom = false;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.frozen = false;
        s.quizPE = false;
        hintOff();
        if (learnSaved) {
          Object.assign(s, { phase: learnSaved.phase, x: learnSaved.x, v: learnSaved.v, heat: learnSaved.heat, taken: learnSaved.taken });
          s.found = { ...learnSaved.found };
          lastPhase = s.phase;
          placeCyclist();
        }
        followCamera();
        syncUI();
        refresh();
        emitChange();
      },
      prepare(i, alive) {
        if (i === 0) kinds = shuffle([...KINDS]).slice(0, 5); // a new round, a new order
        const kind = kinds[i % kinds.length];
        question = { kind };
        if (kind === 'climb') {
          if (!setScene('climb', { height: pickOne([1.5, 2.5, 3.5]) }, alive)) return null;
          return { text: t('q_climb'), ...choices([word('c_pos'), word('c_neg'), word('c_none'), word('c_nowork')], kind) };
        }
        if (kind === 'top') {
          if (!setScene('top', {}, alive)) return null;
          return { text: t('q_top'), ...choices([word('t_pe'), word('t_none'), word('t_ke'), word('t_lost')], kind) };
        }
        if (kind === 'roll') {
          const h = pickOne([1, 2, 4]);
          if (!setScene('roll', { height: h }, alive)) return null;
          s.quizPE = true;
          const pe = potential(h);
          question.pe = pe;
          question.ke = TOTAL - pe;
          refresh();
          return {
            text: t('q_roll', { total: groupJ(TOTAL) }),
            ...choices([joules('r_ke', TOTAL - pe), joules('r_pe', pe), joules('r_total', TOTAL), joules('r_sum', TOTAL + pe)], kind),
          };
        }
        if (kind === 'brake') {
          if (!setScene('brake', { speed: pickOne([5, 6.5, 8]) }, alive)) return null;
          return { text: t('q_brake'), ...choices([word('b_neg'), word('b_pos'), word('b_gone'), word('b_pe')], kind) };
        }
        if (kind === 'dir') {
          if (!setScene('top', {}, alive)) return null;
          return {
            text: t('q_dir', { total: groupJ(TOTAL) }),
            ...choices([joules('d_same', TOTAL), { key: 'd_neg', text: `−${J(TOTAL)}` }, joules('d_zero', 0), joules('d_half', TOTAL / 2)], kind),
          };
        }
        if (!setScene('start', {}, alive)) return null;
        return { text: t('q_unit'), ...choices([word('u_j'), word('u_n'), word('u_w'), word('u_p')], kind) };
      },
      reveal(q, correct, picked) {
        const k = question.kind;
        const key = correct ? null : q.list?.[picked.index]?.key;
        const why = (map, vars = {}) => {
          const extra = key && map.includes(key) ? ` ${t(`not_${key}`, { h: HILL.height })}` : '';
          return t(`why_${k}`, vars) + extra;
        };
        if (k === 'climb') return why(['c_neg', 'c_none', 'c_nowork']);
        if (k === 'top') return why(['t_none', 't_ke', 't_lost'], { e: groupJ(TOTAL) });
        if (k === 'roll') return why(['r_pe', 'r_total', 'r_sum'], { total: groupJ(TOTAL), pe: groupJ(question.pe), ke: groupJ(question.ke) });
        if (k === 'brake') return why(['b_pos', 'b_gone', 'b_pe']);
        if (k === 'dir') return why(['d_neg', 'd_zero', 'd_half'], { total: groupJ(TOTAL) });
        return why(['u_n', 'u_w', 'u_p']);
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
  function choosePart(part) {
    if (s.mode === 'quiz') return;
    s.taken = 0;
    s.userMovedCamera = false;
    jumpTo(part === 'down' ? 'top' : part === 'brake' ? 'flat' : 'start');
    emit('part', { part });
    emitChange();
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example) choosePart(b.dataset.example);
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
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(target.closest('button'));
    const sceneKey = ['1', '2', '3', 'r', 'R', 'Home', 'ArrowRight'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3'].includes(k)) choosePart(PARTS[Number(k) - 1]);
    else if (k === 'ArrowRight' || ((k === ' ' || k === 'Enter') && !onButton)) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  jumpTo(o.phase, { height: o.height });
  controls.enableRotate = controls.enableZoom = s.view === '3d';
  followCamera();
  syncUI();
  refresh();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
  })();
  if (o.hold && MOVING.has(s.phase)) s.held = true;

  return {
    ready,
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: snapshot,
    /**
     * Change any of: phase (jump to 'start' | 'climb' | 'top' | 'roll' | 'flat' | 'brake' | 'stopped'; climb and roll
     * take `height` in m, brake takes `speed` in m/s), part ('up' | 'down' | 'brake', as the words), tap (true: the
     * big button), home (true), view ('front' | '3d').
     */
    async set(p = {}) {
      if (s.mode !== 'quiz') {
        if (p.view) setView(p.view);
        if (p.part) choosePart(p.part);
        if (p.phase) {
          s.taken = 0;
          jumpTo(p.phase, { height: p.height, speed: p.speed });
        }
        if (p.hold != null) s.held = Boolean(p.hold) && MOVING.has(s.phase);
        if (p.home) goHome();
        if (p.tap) {
          lastTap = Number.NEGATIVE_INFINITY;
          doAction();
        }
      }
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.found = { up: false, down: false, brake: false };
      s.view = 'front';
      s.userMovedCamera = false;
      controls.enableRotate = controls.enableZoom = false;
      goHome();
      syncUI();
      refresh();
    },
    startPractice: () => quiz.start(),
    capture(opts = {}) {
      const before = scene.background;
      if (opts.background !== undefined) scene.background = null;
      try {
        return stage.capture(opts);
      } finally {
        scene.background = before;
        stage.invalidate();
      }
    },
    /** The rider on the bicycle where they are now, and the road over the hill (no trees, sky or guide lines). */
    exportRoot() {
      const copy = new THREE.Group();
      copy.name = 'Energy';
      const c = cyclist.clone(true);
      copy.add(c, land.hillRoad());
      return copy;
    },
  };
}
