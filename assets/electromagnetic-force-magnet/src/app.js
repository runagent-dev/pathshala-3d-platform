// Electromagnetic force: the magnets (book page 68, topic 3.2.2), student view on the kit's clean sheet: one action,
// one result, one rule. A cell, a switch and a coil of wire in a row, and a bar magnet on a little cart. "১ সুইচ চালু
// করো": the current runs and the coil becomes a magnet that pulls the cart in (unlike poles); "২ চুম্বকটি ঘুরিয়ে দাও":
// like poles, it is pushed away; turned back, it is pulled in again from the far end (the range is infinite).
// The result line says the poles and the force, the rule line explains it in the book's words and grows into the
// book's rule; a quiet strip names the four fundamental forces in order. Then a short test. The comb and the bits of
// paper (the book's own experiment) are the lab electromagnetic-force. Physics in physics.js, the model in
// magnet-scene.js, framing in camera.js.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { createArrow } from './arrow.js';
import { createPresentation } from './presentation.js';
import { fitPose } from './camera.js';
import { createI18n } from './i18n.js';
import { ARROW, COIL, createMagnetScene, magnetX } from './magnet-scene.js';
import { MAG, cartAccel, STRENGTH_EXP, facingPole, interaction, magnetArrowLength, settleCart, stepCart } from './physics.js';

export const DEFAULTS = {
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

// one colour per thing: the force as in the other three figures of 3.2 (তড়িৎ চৌম্বক blue), the magnet's poles as
// painted (N red, S grey: not blue, which is the force's colour); style.css has the same
const COLORS = { em: '#1c7ed6', north: '#e03131', south: '#5c6670' };
const START_GAP = 40; // mm between the coil and the magnet at the start
const DOUBLE_TAP = 400; // ms in which a second tap on the action is ignored
const TAP_MOVE = 7; // px a finger may move and still tap
const deg = THREE.MathUtils.degToRad;
// how far above the front the camera looks from (front view): from high up, so the cell and the switch show in front
// of the coil, not on it
const ELEVATION = 38;

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  /** A power of ten in the language's digits: 10<sup>36</sup>. */
  const pow = (n) => `${N(10)}<sup>${N(String(n).replace('-', '−'))}</sup>`;

  root.classList.add('pvc', 'ef');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  // the four fundamental forces, weakest first, this one marked (colour, weight and an underline): quiet words
  const forces = ['grav', 'weak', 'em', 'strong']
    .map((k) => `<span class="ef-f ${k}${k === 'em' ? ' on' : ''}"${k === 'em' ? ' aria-current="true"' : ''}>${t(`f_${k}`)}</span>`)
    .join(' <i aria-hidden="true">·</i> ');
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learnAlign: 'start',
    learn: `${cleanSheet(t, {
      lines: { action: 1, outcome: 1, rule: 3 },
    })}
          <p class="ef-forces" role="group" aria-label="${t('forces')}"><span class="ef-forces-k">${t('forces')}</span> <span class="ef-forces-list">${forces}</span></p>`,
  });
  const sheet = bindCleanSheet(ui.learn);
  const outcomeEl = ui.$('.pvc-outcome');

  // ── 3D ──────────────────────────────────────────────────────────────────────
  // a long lens (narrow field of view): the parts nearer the camera are not drawn much bigger than they are
  const stage = createStage(ui.canvasHost, { fov: 20, near: 5, far: 12000, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  const presentation = createPresentation(stage, o.bg === 'transparent');
  controls.minDistance = 120;
  controls.maxDistance = 4000;
  controls.maxPolarAngle = Math.PI * 0.49; // never under the table
  controls.enableRotate = false;
  controls.enablePan = false;
  controls.enableZoom = false; // the front view frames itself (zoom only when turning the view)
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const ms = createMagnetScene({ colors: COLORS });
  scene.add(ms.root);
  const magArrow = createArrow({ color: COLORS.em, name: 'ForceOnMagnet', radius: 1.4, head: 7, headRadius: 4 });
  const coilArrow = createArrow({ color: COLORS.em, name: 'ForceOnCoil', radius: 1.4, head: 7, headRadius: 4 });
  ms.root.add(magArrow.root, coilArrow.root);

  // soft shadows on the bench only (nothing else receives them): PCF in a box fitted round what casts them, seen from
  // the light, so 1024 px look as sharp as the old 2048 px soft shadows did
  const shadows = o.shadow && o.bg !== 'transparent';
  let sun = null;
  if (shadows) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
    sun = new THREE.DirectionalLight(0xffffff, 0.4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 3;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.4;
    scene.add(sun, sun.target);
    for (const part of [ms.coil, ms.cart, ...Object.values(ms.meshes)])
      part.traverse((m) => {
        if (m instanceof THREE.Mesh && m.material && !m.material.transparent && m.material.visible !== false && !m.userData.noExport)
          m.castShadow = true;
      });
  }
  // the shadow box (mm, in the light's frame round its target): the cell, the switch, the coil and the cart along its
  // whole track
  const SUN = { at: new THREE.Vector3(-10, 0, 10), box: { left: -170, right: 190, top: 110, bottom: -95, near: 330, far: 700 } };
  const SUN_FROM = new THREE.Vector3(60, 420, 260);
  /** The sun's shadow covers what casts one, and no more. */
  function aimSun() {
    if (!sun) return;
    const { at, box } = SUN;
    sun.position.copy(at).add(SUN_FROM);
    sun.target.position.copy(at);
    sun.target.updateMatrixWorld();
    Object.assign(sun.shadow.camera, box);
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.needsUpdate = true;
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const now = () => performance.now();
  const s = {
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    showArrows: true,
    // the magnets: the switch, which way the bar magnet lies ('SN': its S end faces the coil), the gap (mm), speed
    mag: { on: false, orient: 'SN', gap: START_GAP, v: 0, hold: false, flipping: false, dragging: false, everOn: false, fromFar: false, flips: 0 },
    // what the student has seen: like poles pushed apart (then a pull from far away grows into the book's rule)
    seen: false,
  };
  let run = 0; // every new question bumps it: an older animation that wakes up after a wait stops there
  let lastAct = -1e9;

  // ── the magnets ─────────────────────────────────────────────────────────────
  const mag = s.mag;
  const currentForce = () => (mag.flipping ? null : interaction(mag.on, facingPole(mag.orient)));
  const FAR = MAG.gapMax - 12; // mm: a pull that starts from this far shows the infinite range
  /** Remember whether this pull starts from far away (the rule then speaks of the range). */
  const noteStart = () => {
    mag.fromFar = currentForce() === 'attract' && mag.gap >= FAR;
  };
  function placeCart() {
    ms.cart.position.x = magnetX(mag.gap);
  }
  const PX = new THREE.Vector3(1, 0, 0);
  const NX = new THREE.Vector3(-1, 0, 0);
  const magFrom = new THREE.Vector3();
  const coilFrom = new THREE.Vector3();
  let currentShown = false;
  function tickMagnet(dt) {
    let moving = false;
    const kind = currentForce();
    // a cart at rest that the force cannot move (held by friction, or against the coil or the block) needs no step
    const resting =
      mag.v === 0 &&
      (!kind ||
        (kind === 'attract' && mag.gap === 0) ||
        (kind === 'repel' && mag.gap === MAG.gapMax) ||
        Math.abs(cartAccel(mag.gap, kind)) <= MAG.friction);
    if (!mag.hold && !mag.dragging && !resting) {
      const st = stepCart({ gap: mag.gap, v: mag.v }, kind, dt);
      moving = st.v !== 0 || Math.abs(st.gap - mag.gap) > 1e-6;
      if (moving) {
        mag.gap = st.gap;
        mag.v = st.v;
        placeCart();
        if (st.hit === 'coil') {
          if (s.mode !== 'quiz' || quiz.revealed) audio.contact?.();
          emit('snap', { gap: 0 });
        }
        if (st.hit === 'stop') audio.tick();
        if (!mag.v) {
          refresh();
          emitChange();
        }
      }
    }
    // the two forces, at the facing ends just above them: a pull points from each body towards the other (the
    // arrows' tips meet at the gap), a push points away from the gap; they shrink with distance but never vanish
    const show = s.showArrows && Boolean(kind);
    const len = show ? magnetArrowLength(mag.gap) : 0;
    const magEnd = COIL.x1 + mag.gap;
    let movedMag;
    let movedCoil;
    if (kind === 'attract') {
      movedMag = magArrow.set(magFrom.set(magEnd + len, ARROW.y, ARROW.z), NX, len);
      movedCoil = coilArrow.set(coilFrom.set(COIL.x1 - len, ARROW.y, ARROW.z), PX, len);
    } else {
      movedMag = magArrow.set(magFrom.set(magEnd, ARROW.y, ARROW.z), PX, len);
      movedCoil = coilArrow.set(coilFrom.set(COIL.x1, ARROW.y, ARROW.z), NX, len);
    }
    if (movedMag || movedCoil) {
      stage.invalidate();
      syncForceLabel(kind);
    }
    // the current runs along the wires while the switch is closed (only then is there anything to draw each frame)
    const flowing = mag.on;
    const stopped = currentShown && !flowing; // the chevrons just went: one more frame without them
    if (flowing || stopped) ms.setCurrent(flowing, now() / 1000);
    currentShown = flowing;
    return moving || mag.flipping || flowing || stopped;
  }
  stage.addTicker((dt) => tickMagnet(dt));

  function setSwitch(on, { animate = true } = {}) {
    on = Boolean(on);
    if (on === mag.on) return;
    mag.on = on;
    if (on) mag.everOn = true;
    noteStart();
    ms.setCoilOn(on);
    tweener.animate({
      key: 'switch',
      duration: animate ? 0.22 : 0,
      onUpdate: (k) => {
        ms.setBlade(on ? k : 1 - k);
        stage.invalidate();
      },
    });
    if (animate && s.mode !== 'quiz') audio.lock?.(!on);
    emit('switch', { on });
    refresh();
    refreshLabels();
    emitChange();
  }
  /** Turn the bar magnet round (it lifts a little, turns, and settles back on its cart). */
  function flip({ animate = true } = {}) {
    if (mag.flipping) return;
    const r0 = mag.orient === 'SN' ? 0 : Math.PI;
    const next = mag.orient === 'SN' ? 'NS' : 'SN';
    const done = () => {
      mag.orient = next;
      mag.flipping = false;
      ms.magnet.rotation.y = next === 'SN' ? 0 : Math.PI;
      ms.magnet.position.y = 19.5;
      if (s.mode !== 'quiz') mag.flips += 1;
      noteStart();
      emit('flip', { facing: facingPole(next) });
      refresh();
      refreshLabels();
      emitChange();
    };
    if (!animate) return done();
    mag.flipping = true;
    mag.v = 0;
    refresh();
    tweener.animate({
      key: 'flip',
      duration: 0.5,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        ms.magnet.rotation.y = r0 + Math.PI * k;
        ms.magnet.position.y = 19.5 + Math.sin(Math.PI * k) * 14;
        stage.invalidate();
      },
      onComplete: done,
    });
  }
  /** The cart put at a gap; it then moves as the force says (or, without animation, to where it would stop). */
  function placeMagnet(gap, { animate = true } = {}) {
    mag.gap = Math.min(Math.max(Number(gap) || 0, 0), MAG.gapMax);
    mag.v = 0;
    noteStart();
    if (!animate && !mag.hold) mag.gap = settleCart(mag.gap, currentForce()).gap;
    placeCart();
    refresh();
    emitChange();
  }

  // ── the panel: the action, the result line, the rule line ──────────────────
  const pole = (p) => `<span class="ef-pole ${p === 'N' ? 'n' : 's'}">${p}</span>`;
  const TARGETS = {
    switch: () => ms.meshes.sw,
    magnet: () => ms.magnet,
    none: () => null,
  };
  // the big button in the panel and its numbered badge on the part to touch (made before the labels, so in every frame
  // the ring is placed first and the labels keep off it)
  /** @type {ReturnType<typeof createAction>} */
  const action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_on',
    target: TARGETS.switch,
    pad: 8,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: o.coach,
    onAct: doAction,
  });
  /** What the action does now: its id, the student's step number ('' once both steps are done), words, target. */
  function plan() {
    if (!mag.on) return { id: 'on', step: 1, label: 'act_on', target: 'switch' };
    return mag.flips
      ? { id: 'flip', step: '', label: 'act_flip_back', target: 'magnet' }
      : { id: 'flip', step: 2, label: 'act_flip', target: 'magnet' };
  }
  function outcomeHtml() {
    const kind = currentForce();
    if (!mag.on) return t('out_off');
    if (!kind) return t('out_turn');
    // the coil's pull is drawn far stronger than one cell's air-core coil could give (said here, not on the picture)
    const note = ` <small>${t('note_pull')}</small>`;
    return (kind === 'attract' ? t('out_attract', { a: pole('N'), b: pole('S') }) : t('out_repel', { a: pole('N'), b: pole('N') })) + note;
  }
  let lastRule = '';
  function ruleHtml() {
    const kind = currentForce();
    if (!mag.on) return t(mag.everOn ? 'rule_mag_off' : 'rule_mag_0');
    if (!kind) return lastRule || t('rule_mag_on'); // turning round: keep the last sentence
    if (kind === 'repel') return t('rule_mag_repel');
    // pulled in from far away: the range; once like poles have been seen too, the book's rule
    if (mag.fromFar) return s.seen && s.mode !== 'quiz' ? t('rule_law', { p: pow(STRENGTH_EXP) }) : t('rule_mag_far');
    return t('rule_mag_on');
  }
  function refresh() {
    sheet.outcome(outcomeHtml());
    if (outcomeEl.dataset.k !== 'magnet') outcomeEl.dataset.k = 'magnet';
    lastRule = ruleHtml();
    sheet.rule(lastRule);
    if (currentForce() === 'repel' && s.mode !== 'quiz') s.seen = true;
    const p = plan();
    action.set({ step: p.step, label: p.label, target: TARGETS[p.target], enabled: !mag.flipping });
    // the ring shows on the part to touch while nothing plays
    if (mag.flipping) action.hide('run');
    else action.show('run');
    stage.invalidate();
  }

  function snapshot() {
    const p = plan();
    return {
      view: s.view,
      mode: s.mode,
      magnet: {
        on: mag.on,
        facing: facingPole(mag.orient),
        gap: +mag.gap.toFixed(1),
        force: currentForce(),
        moving: mag.v !== 0,
      },
      next: { action: p.id, step: p.step }, // what the big button does now
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.mode, snap.magnet, snap.next]);
    if (k === lastEmitted) return;
    lastEmitted = k;
    emit('change', snap);
  }

  // ── labels in the picture (the kit's annotations: each takes the first clear spot) ──
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint, () => action?.ringBox(), () => action?.box()] });
  /** Add a label, or change it in place (no fade-in again) if it is there. */
  function label(id, opts) {
    if (anno.has(id)) anno.update(id, opts);
    else anno.add(id, opts);
  }
  const pv = new THREE.Vector3();
  const toScreen = (p) => {
    pv.copy(p).project(camera);
    return { x: (pv.x * 0.5 + 0.5) * stage.width, y: (-pv.y * 0.5 + 0.5) * stage.height };
  };
  /** A box round some screen points (px). */
  function boxOfPoints(list, pad = 4) {
    const b = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    for (const q of list) {
      b.left = Math.min(b.left, q.x - pad);
      b.right = Math.max(b.right, q.x + pad);
      b.top = Math.min(b.top, q.y - pad);
      b.bottom = Math.max(b.bottom, q.y + pad);
    }
    return b;
  }
  /** An arrow on the screen (px box round it), or null when hidden. */
  function arrowBox(arrow, pad = 5) {
    if (!arrow.root.visible) return null;
    return boxOfPoints([toScreen(arrow.root.position), toScreen(arrow.tip())], pad);
  }
  const COIL_LABEL_AT = new THREE.Vector3(COIL.x0 + 14, 2 * COIL.flange, 0); // the top of the coil's left end
  const cartLabelAt = new THREE.Vector3();
  const cellLabelAt = new THREE.Vector3();
  const forceMid = new THREE.Vector3();
  function syncForceLabel(kind) {
    if (magArrow.root.visible && kind) {
      forceMid.set(COIL.x1 + mag.gap / 2, ARROW.y, ARROW.z); // right above the gap, where the two arrows meet or part
      label('force', {
        text: t(kind),
        kind: 'callout',
        color: COLORS.em,
        point: () => forceMid,
        spots: [
          { dx: 0, dy: -20 },
          { dx: 0, dy: -34 },
        ],
        avoid: [() => arrowBox(magArrow, 3), () => arrowBox(coilArrow, 3)],
      });
    } else anno.remove('force');
  }
  /** The labels that belong to this state (the force's follows by itself). */
  function refreshLabels() {
    const quizzing = s.mode === 'quiz';
    // while the current flows the coil is a magnet: its ends are named under them (N faces the bar magnet)
    if (mag.on) {
      const below = (dx) => [
        { dx: 0, dy: 16 },
        { dx, dy: 14 },
      ];
      label('poleS', { text: 'S', kind: 'pole', color: COLORS.south, point: () => ms.points.south, spots: below(-12) });
      label('poleN', { text: 'N', kind: 'pole', color: COLORS.north, point: () => ms.points.north, spots: below(12) });
    } else {
      anno.remove('poleS');
      anno.remove('poleN');
    }
    // the parts' names keep off the coil's poles (added later, so they would not move for a name)
    const poles = () => [anno.box('poleS'), anno.box('poleN')].filter(Boolean);
    const part = (id, key, point, spots, show = true) =>
      show && !quizzing ? label(id, { text: t(key), point, spots, optional: true, avoid: [poles] }) : anno.remove(id);
    part(
      'current',
      'current_on',
      () => ms.points.cell,
      [
        { dx: 0, dy: 34 },
        { dx: -30, dy: 30 },
        { dx: 30, dy: 30 },
      ],
      mag.on,
    );
    // above the coil's left end (the cell and the switch lie in front of it), while it is only a coil: once the
    // current flows it is a magnet, named by its poles, and the force's name takes the room above it
    part(
      'coil',
      'lbl_coil',
      () => COIL_LABEL_AT,
      [
        { dx: -6, dy: -30 },
        { dx: 30, dy: -34 },
        { dx: -30, dy: -20 },
      ],
      !mag.on,
    );
    part('magnet', 'lbl_magnet', () => cartLabelAt.set(ms.cart.position.x, 2, 18), [
      { dx: 0, dy: 20 },
      { dx: 20, dy: 18 },
      { dx: 36, dy: 30 },
      { dx: 0, dy: 40 },
    ]);
    part(
      'switch',
      'lbl_switch',
      () => ms.points.switch,
      [
        { dx: 0, dy: 44 },
        { dx: 0, dy: 72 },
        { dx: 56, dy: 30 },
        { dx: 60, dy: 50 },
      ],
      !mag.everOn,
    );
    part(
      'cell',
      'lbl_cell',
      () => cellLabelAt.copy(ms.points.cell).setX(ms.points.cell.x - 12), // a little left: clear of the switch's ring
      [
        { dx: 0, dy: 36 },
        { dx: 0, dy: 58 },
        { dx: 0, dy: 74 },
        { dx: -40, dy: 34 },
        { dx: -60, dy: 12 },
      ],
      !mag.everOn,
    );
    syncForceLabel(currentForce());
    stage.invalidate();
  }

  // ── camera: one frame per example that shows the whole experiment ──────────
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  function viewDir() {
    const el = deg(ELEVATION + (s.view === '3d' ? 12 : 0));
    const az = s.view === '3d' ? deg(32) : 0;
    return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  }
  /** What a view must show: points, some with a box round them on the screen (px from the point). */
  function contentOf() {
    const pts = [];
    // the magnets: the coil with the cell and the switch in front of it, the track to the end block, the arrows, the names
    const { left, right, front } = ms.extent;
    pts.push(V(left, 0, front), V(left, 22, -16), V(right, 0, 22), V(right, 24, -22));
    pts.push(V(COIL.x0, 2 * COIL.flange, -20)); // the coil
    pts.push(V(COIL.x1 - 40, ARROW.y + 5, ARROW.z), V(COIL.x1 + MAG.gapMax + 40, ARROW.y + 5, ARROW.z)); // the arrows
    pts.push({ p: V(COIL.x1 + START_GAP / 2, ARROW.y, ARROW.z), box: [-45, -44, 45, 0] }); // their label
    pts.push({ p: COIL_LABEL_AT, box: [-70, -44, 60, 0] }); // the coil's name above it
    pts.push({ p: V(magnetX(START_GAP), 0, 20), box: [-50, 0, 50, 40] }); // the magnet's name under it
    for (const p of [ms.points.cell, ms.points.switch]) pts.push({ p: V(p.x, 0, p.z + 10), box: [-50, 0, 50, 70] }); // their names
    return pts;
  }
  function boxOf(node, pad = 6) {
    if (!node || node.hidden || getComputedStyle(node).visibility === 'hidden') return null;
    const c = stage.canvas.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    if (!r.width) return null;
    return { left: r.left - c.left - pad, right: r.right - c.left + pad, top: r.top - c.top - pad, bottom: r.bottom - c.top + pad };
  }
  /** A camera pose that shows the example's whole experiment as big as it can, clear of the corner buttons. */
  function poseFor() {
    return fitPose({
      points: contentOf(),
      dir: viewDir(),
      fov: camera.fov,
      aspect: camera.aspect,
      width: stage.width,
      height: stage.height,
      keepOff: [boxOf(ui.corner)].filter(Boolean),
    });
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
    return flyTo(poseFor(), animate ? 0.8 : 0);
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
  // a turned phone: the picture is framed again at once
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(poseFor(), 0);
  });

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /** The action: the big button, its badge on the picture, a tap on the part it rings, Space/Enter. */
  function doAction() {
    audio.unlock();
    if (s.locked || s.mode === 'quiz') return lockedNudge();
    if (mag.flipping) return;
    const t0 = now();
    if (t0 - lastAct < DOUBLE_TAP) return; // a double tap must not undo the first
    lastAct = t0;
    const p = plan();
    if (p.id === 'on') setSwitch(true);
    else if (p.id === 'flip') flip();
  }

  // ── the start: the magnets, framed ──────────────────────────────────────────
  function showMagnet({ animate = true } = {}) {
    mag.dragging = false;
    drag = null;
    anno.clear();
    hideHint();
    s.userMovedCamera = false;
    aimSun();
    flyTo(poseFor(), animate ? 0.7 : 0);
    syncUI();
    refresh();
    refreshLabels();
    emitChange();
  }

  // ── touching the 3D ─────────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hitP = new THREE.Vector3();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function rayAt(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  }
  /** What a finger at this canvas point takes: 'magnet', 'switch' or null. */
  function pick(p) {
    rayAt(p);
    const hit = raycaster.intersectObjects(ms.hits, false)[0];
    return hit ? hit.object.userData.part : null;
  }
  /** Where the finger is on the plane of the magnets (z = 0), in mm. */
  function planeAt(p) {
    rayAt(p);
    return raycaster.ray.intersectPlane(plane, hitP) ? hitP.clone() : null;
  }
  let drag = null; // { id, part, x0, y0, moved, dx }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const p = canvasPoint(e);
      const part = pick(p);
      if (!part) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (part === 'switch') return setSwitch(!mag.on); // like a real switch, it acts as the finger goes down
      const at = planeAt(p);
      if (!at) return;
      drag = { id: e.pointerId, part, x0: p.x, y0: p.y, moved: false, dx: ms.cart.position.x - at.x };
      capturePointer(ui.canvasHost, e.pointerId); // keep the drag when the finger leaves the part
    },
    true,
  );
  function dragTo(e) {
    const p = canvasPoint(e);
    if (!drag.moved) {
      if (Math.hypot(p.x - drag.x0, p.y - drag.y0) < TAP_MOVE) return;
      drag.moved = true;
    }
    const at = planeAt(p);
    if (!at) return;
    mag.dragging = true;
    mag.v = 0;
    mag.gap = Math.min(Math.max(at.x + drag.dx - magnetX(0), 0), MAG.gapMax);
    placeCart();
    stage.invalidate();
  }
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (drag && e.pointerId === drag.id) {
      e.preventDefault();
      dragTo(e);
    } else if (e.pointerType === 'mouse' && !drag) {
      ui.canvasHost.style.cursor = pick(canvasPoint(e)) ? (s.locked ? 'not-allowed' : 'pointer') : '';
    }
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    releasePointer(ui.canvasHost, e.pointerId);
    mag.dragging = false;
    noteStart();
    if (!d.moved && e.type === 'pointerup') flip(); // a tap on the magnet turns it round
    refresh();
    refreshLabels();
    emitChange();
  };
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

  // ── hint line (only for the locked picture in the test) ─────────────────────
  let hintTimer = 0;
  function showHint(msg, { duration = 3000 } = {}) {
    ui.hintText.textContent = msg;
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
    showHint(t('q_locked'));
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
  const opt = (html) => `<span class="ef-opt">${html}</span>`;
  /** A question whose answers are i18n keys (or functions): the right one first in `keys`. */
  function wordChoices(keys) {
    const order = shuffle(keys.map((_, i) => i));
    return {
      choices: [0, 1, 2, 3],
      expected: order.indexOf(0),
      tolerance: 0.5,
      label: (j) => opt(typeof keys[order[j]] === 'function' ? keys[order[j]]() : t(keys[order[j]])),
      order,
    };
  }
  /** The magnets set up for a question: the switch, the magnet's facing pole, held at a gap. */
  function magnetQuestion({ on, facing, gap }) {
    tweener.cancel('flip');
    mag.flipping = false;
    ms.magnet.position.y = 19.5;
    mag.orient = facing === 'N' ? 'NS' : 'SN';
    ms.magnet.rotation.y = mag.orient === 'SN' ? 0 : Math.PI;
    mag.hold = true;
    setSwitch(on, { animate: false });
    placeMagnet(gap);
    refreshLabels();
  }

  let kinds = [];
  let question = null;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 4,
    lines: { text: 2, feedback: 3 },
    action,
    hooks: {
      enter() {
        ++run;
        s.mode = 'quiz';
        s.showArrows = false;
        drag = null;
        mag.dragging = false;
        hideHint();
        // three about the magnets, one about the book's number
        kinds = shuffle(['poles', 'off', 'range', 'strength']);
        syncUI();
        refreshLabels();
      },
      leave() {
        ++run;
        s.mode = 'explore';
        s.locked = false;
        s.showArrows = true;
        mag.hold = false;
        restoreLearn();
        syncUI();
      },
      async prepare(i, _alive, say) {
        ++run;
        s.locked = true;
        s.showArrows = false; // the arrows would give the answer away: they come back after it
        const kind = kinds[i % kinds.length];
        question = { kind };
        let c;
        if (kind === 'poles') {
          const facing = Math.random() < 0.5 ? 'N' : 'S';
          magnetQuestion({ on: true, facing, gap: 34 });
          say(t('q_poles'));
          c = wordChoices(
            facing === 'N'
              ? ['opt_like_rep', 'opt_like_att', 'opt_unlike_att', 'opt_unlike_rep']
              : ['opt_unlike_att', 'opt_unlike_rep', 'opt_like_rep', 'opt_like_att'],
          );
          question.facing = facing;
        } else if (kind === 'off') {
          magnetQuestion({ on: false, facing: Math.random() < 0.5 ? 'N' : 'S', gap: 22 });
          say(t('q_off'));
          c = wordChoices(['opt_off_right', 'opt_off_always', 'opt_off_copper', 'opt_off_repel']);
        } else if (kind === 'strength') {
          magnetQuestion({ on: true, facing: 'S', gap: 0 });
          say(t('q_strength'));
          const em = t('f_em_long');
          const grav = t('f_grav_long');
          c = wordChoices([
            () => t('opt_str', { f: em, p: pow(STRENGTH_EXP) }),
            () => t('opt_str', { f: grav, p: pow(STRENGTH_EXP) }),
            () => t('opt_str', { f: em, p: STRENGTH_EXP }),
            () => t('opt_str', { f: grav, p: STRENGTH_EXP }),
          ]);
        } else {
          // the range, from the picture: the switch on, the magnet at the far end of the track (unlike poles facing);
          // is the coil still pulling it? (its arrows show after the answer, and the magnet rolls in)
          magnetQuestion({ on: true, facing: 'S', gap: MAG.gapMax });
          say(t('q_range'));
          c = wordChoices(['opt_far_right', 'opt_far_zero', 'opt_far_touch', 'opt_far_more']);
        }
        Object.assign(question, c);
        return { ...c, meta: { kind, facing: question.facing } };
      },
      reveal(_q, _correct, picked) {
        const q = question;
        const mistake = picked && picked.index >= 0 ? q.order[picked.index] : -1; // which wrong answer (1–3), or -1 / 0
        const miss = (key) => (mistake > 0 && t(`${key}_${mistake}`) !== `${key}_${mistake}` ? ` ${t(`${key}_${mistake}`)}` : '');
        const my = ++run;
        if (q.kind === 'poles') {
          mag.hold = false;
          s.showArrows = true;
          return (q.facing === 'N' ? t('why_poles_rep', { p: 'N' }) : t('why_poles_att', { a: 'N', b: 'S' })) + miss('mis_poles');
        }
        if (q.kind === 'off') {
          mag.hold = false;
          // then the switch goes on: now it is a magnet again
          wait(1400).then(() => {
            if (my !== run || s.mode !== 'quiz') return;
            s.showArrows = true;
            setSwitch(true);
          });
          return t('why_off') + miss('mis_off');
        }
        // no arrows here: their size is this coil and this magnet, not the 10^36 of the forces themselves
        if (q.kind === 'strength') return t('why_strength', { p: pow(STRENGTH_EXP), one: 1, n: STRENGTH_EXP }); // long enough already: no note
        mag.hold = false;
        s.showArrows = true;
        return t('why_range') + miss('mis_range');
      },
      done() {
        s.locked = false;
      },
    },
  });
  /** Back from the test: the magnets as at the start. */
  function restoreLearn() {
    tweener.cancel('flip');
    mag.flipping = false;
    ms.magnet.position.y = 19.5;
    mag.orient = 'SN';
    ms.magnet.rotation.y = 0;
    setSwitch(false, { animate: false });
    mag.everOn = false;
    mag.flips = 0;
    placeMagnet(START_GAP);
    showMagnet();
  }

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
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
    const k = e.key.toLowerCase();
    const learning = s.mode !== 'quiz'; // in the test the picture belongs to the question
    if ((k === ' ' || k === 'enter') && !target.closest('button')) doAction();
    else if ((k === 'arrowleft' || k === 'arrowright') && learning) {
      mag.v = 0;
      placeMagnet(mag.gap + (k === 'arrowright' ? 5 : -5));
    } else if (k === 'x' && learning) flip();
    else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  placeCart();
  ms.setCoilOn(false);
  showMagnet({ animate: false });
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
     * Change any of: on (the switch), facing ('N' | 'S': the magnet's end facing the coil), gap (mm between them; the
     * force then acts); view; animate: false jumps (the cart goes straight to where it would stop).
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.on != null || p.facing || p.gap != null) {
        if (p.facing && facingPole(mag.orient) !== p.facing) flip({ animate });
        if (p.on != null) setSwitch(p.on, { animate });
        if (p.gap != null) placeMagnet(p.gap, { animate });
        else if (!animate) placeMagnet(mag.gap, { animate: false });
      }
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      ++run;
      restoreLearn();
      s.seen = false;
      refresh();
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture: (opts) => presentation.capture(opts),
    // the coil, the cell, the switch and the magnet on its cart (no arrows or tags)
    exportRoot: () => ms.root,
  };
}
