// Force: contact and non-contact (book page 67, topic 3.1.2: বল), student view: one of the page's examples. One big
// action plays it (its numbered badge rings the body the force acts on): the force acts, the body starts moving (or
// slows), and the run holds at the telling moment, where the picture itself says which kind of force it is. A
// contact force lights the patch where the two bodies touch with the tag "ছুঁয়ে আছে: স্পর্শ বল"; a non-contact force
// shows the empty gap between them, measured ("ফাঁক ৬০ cm"), with the tag "ছোঁয়নি: অস্পর্শ বল". The arrow and the tag
// carry the kind's colour and words. The panel is the kit's clean sheet: the action, one result line naming the
// force and its kind, one rule that starts with the book's definition of force and grows into this force's kind.
// Then a short test about this example and a new case or two. Built on the shared student kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { createGapMark } from './marks.js';
import { createCraneScene } from './crane.js';
import { createParachuteScene, createRopeScene } from './pool.js';
import {
  CASES,
  CHOICE_KIND,
  DURATION,
  EFFECT,
  EXAMPLE,
  KEY,
  KIND,
  KIND_CHOICES,
  QUESTIONS,
  SLOW,
  actionAt,
  gapCm,
  moved,
  roundTo,
  shuffle,
} from './motion.js';

export const DEFAULTS = {
  at: 'rest', // 'rest' | 'key' | 'end': where it starts (key: held at the telling moment)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the action's marker pulses when it appears
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

/** One colour per kind of force, the same for the arrow, the patch or gap, the tag and the panel's words. */
const COLORS = { contact: '#e8590c', noncontact: '#7048e8', test: '#4b5766' }; // the chapter's pull and gravity; test: "this force" (grey)
const TOP_ROOM = 52; // px kept clear at the top of the view for the corner buttons
const TAP = { move: 10, ms: 600 }; // a tap on the picture: the finger comes up within 10 px and 0.6 s

/**
 * Where the labels may go round their point, best first, as "dx,dy" offsets in px (the kit's annotations: a label
 * left of its point when dx < 0, right of it when dx > 0, centred on it when dx = 0): the tag round the contact patch
 * or the middle of the gap, the force's name round its arrow (at `along` from its tail to its head).
 */
const SPOTS = {
  crane: { tag: '-26,-58 -46,-40 -56,0 -46,44 26,-72 -26,62 56,0', force: '24,0 24,-30 24,30 -24,0' },
  rope: { tag: '0,-62 -34,-54 34,-54 0,62', force: '0,-24 0,24 24,0' },
  parachute: { tag: '0,74 64,0 -64,0 0,-74', force: '24,0 -24,0 24,26' },
};
const spotsOf = (id, which) =>
  SPOTS[id][which].split(' ').map((p) => {
    const [dx, dy] = p.split(',').map(Number);
    return { dx, dy };
  });

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'cnf');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learnAlign: 'start',
    learn: cleanSheet(t, { lines: { action: 1, outcome: 1, rule: 3 } }),
  });
  const sheet = bindCleanSheet(ui.learn);
  const outcomeEl = /** @type {HTMLElement} */ (ui.$('.pvc-outcome'));
  outcomeEl.setAttribute('aria-live', 'polite');
  // how time is shown (held, slowed down, real) sits in the panel, at the end of the action's row, not on the view
  const note = document.createElement('span');
  note.className = 'cnf-note';
  ui.$('.pvc-act-row').append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.01, far: 200, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  const setting = o.bg !== 'transparent'; // each example in its place (setting.js); a transparent page: patches only
  const shadows = o.shadow && setting;
  const sun = new THREE.DirectionalLight(0xffffff, shadows ? 0.6 : 0.4);
  scene.add(sun, sun.target);
  if (shadows) {
    // soft PCF in a box fitted round each example (showScene): 1024 px on a tight box is as sharp as the 2048 px VSM
    // was, and only the examples' bodies cast (the settings, arrows and marks do not)
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 3;
  }

  const make = {
    crane: createCraneScene,
    rope: createRopeScene,
    parachute: createParachuteScene,
  };
  const isPool = (id) => id in CASES;
  const kindOf = (id) => KIND[id] || CASES[id];
  /** @type {Record<string, any>} */
  const scenes = {};
  function sceneOf(id) {
    if (!scenes[id]) {
      const sc = make[id]({ color: COLORS[kindOf(id)], setting });
      sc.root.visible = false;
      scene.add(sc.root);
      scenes[id] = sc;
    }
    return scenes[id];
  }
  sceneOf(EXAMPLE);

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    example: EXAMPLE,
    scene: '', // what the 3D shows: the example, or a test case
    phase: 'rest', // 'rest' | 'acting' | 'paused' (held at the telling moment, or at a time) | 'done'
    time: 0, // s along the example's action
    playing: false,
    stopAt: Number.POSITIVE_INFINITY, // the run holds here (the telling moment)
    seen: false, // its run has reached the telling moment once
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    poolTime: 0,
    poolFrozen: false, // the test case's loop held at a telling moment (the comb's answer)
    reveal: false, // a test question is answered: its marks, its tag and the force's name show
  };
  /** The test question on screen: its kind, its scene, its set of answers, whether its answer shows the marks. */
  /** @type {{ kind: string, id: string, set: string, keys: string[], marks: boolean } | null} */
  let question = null;
  const cur = () => scenes[s.scene];
  /** The example's motion now (an example scene), or {} for a test case. */
  const motion = () => (isPool(s.scene) || !s.scene ? {} : actionAt(s.scene, s.time));

  // ── what the 3D shows over the scene: the gap, the tag, the force's name ─────
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const gapMark = createGapMark({ stage, layer: ui.annoLayer });
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint, () => action?.ringBox()] });
  const pv = new THREE.Vector3();
  const toScreen = (p) => {
    pv.copy(p).project(camera);
    return { x: (pv.x * 0.5 + 0.5) * stage.width, y: (-pv.y * 0.5 + 0.5) * stage.height };
  };
  /** A world box on the screen (canvas pixels). */
  function screenBox(b) {
    let l = Number.POSITIVE_INFINITY;
    let tp = Number.POSITIVE_INFINITY;
    let r = Number.NEGATIVE_INFINITY;
    let bt = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < 8; i++) {
      const p = toScreen(pv.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z));
      l = Math.min(l, p.x);
      r = Math.max(r, p.x);
      tp = Math.min(tp, p.y);
      bt = Math.max(bt, p.y);
    }
    return { left: l, top: tp, right: r, bottom: bt };
  }
  const bodyBoxes = () => (cur()?.bodies(motion()) || []).map(screenBox);
  const tail = new THREE.Vector3();
  const tip = new THREE.Vector3();
  const mid = new THREE.Vector3();
  /** Boxes along the force arrow (canvas pixels), so the tag keeps off it. */
  function arrowBoxes() {
    const sc = cur();
    if (!sc?.arrow.root.visible) return [];
    sc.arrow.ends(tail, tip);
    const a = toScreen(tail);
    const b = toScreen(tip);
    const out = [];
    for (let k = 0; k <= 6; k++) {
      const x = a.x + ((b.x - a.x) * k) / 6;
      const y = a.y + ((b.y - a.y) * k) / 6;
      out.push({ left: x - 9, top: y - 9, right: x + 9, bottom: y + 9 });
    }
    return out;
  }
  /** The point the force's name is placed round: the middle of its arrow, or its head where that ends in open space. */
  const arrowMid = () => {
    cur()?.arrow.ends(tail, tip);
    return mid.lerpVectors(tail, tip, SPOTS[s.scene]?.along ?? 0.55);
  };
  const gapMid = new THREE.Vector3();
  const gapPoint = () => {
    const g = cur()?.gap(motion());
    return g ? gapMid.addVectors(g.a, g.b).multiplyScalar(0.5) : gapMid;
  };
  const contactPoint = () => cur()?.contact(motion()) || gapMid;

  /** Do the patch or gap and the tag show now? While the force acts on a body it moves; in the test, with the answer. */
  function marksNow() {
    if (!cur()) return false;
    if (s.mode === 'quiz') return s.reveal && Boolean(question?.marks);
    const m = motion();
    return s.phase !== 'rest' && Boolean(m.acting) && moved(s.scene, m);
  }
  /** The gap (world ends) shown now, or null. */
  const gapNow = () => (marksNow() ? cur().gap(motion()) : null);
  const gapNowCm = () => {
    const g = gapNow();
    return g ? gapCm(g.a.distanceTo(g.b)) : 0;
  };
  gapMark.set(gapNow);
  /** The arrow's colour: its kind; in a test question a plain grey "this force" until the answer says the kind. */
  const arrowColor = () => (s.mode === 'quiz' && !(s.reveal && question?.marks) ? COLORS.test : COLORS[kindOf(s.scene)]);

  const labelKey = { tag: '', force: '' };
  const labelText = { tag: '', force: '' };
  /** The two labels: the tag at the patch or gap (placed first), and the force's name beside its arrow. */
  function syncLabels() {
    const sc = cur();
    const id = s.scene;
    const m = motion();
    const quiz = s.mode === 'quiz';
    const want = {};
    if (marksNow()) {
      const g = sc.gap(m);
      if (sc.contact(m) && (isPool(id) || m.touching))
        want.tag = { key: `${id}|c`, text: t('tag_contact'), kind: 'tag-c', color: COLORS.contact, point: contactPoint };
      else if (g)
        want.tag = {
          key: `${id}|n`,
          text: `${t('tag_noncontact')}<small>${t('tag_gap', { d: gapCm(g.a.distanceTo(g.b)) })}</small>`,
          kind: 'tag-n',
          color: COLORS.noncontact,
          point: gapPoint,
        };
    }
    if (sc.arrow.root.visible) {
      // a test question names its force only with the answer (the name would give the reason away)
      const named = !quiz || s.reveal || question?.kind === 'effect';
      want.force = { key: `${id}|f`, text: named ? t(`f_${id}`) : t('f_this'), kind: 'force', color: arrowColor(), point: arrowMid };
    }
    const fresh = want.tag && labelKey.tag !== want.tag.key;
    for (const which of ['tag', 'force']) {
      const w = want[which];
      if (!w) {
        if (labelKey[which]) anno.remove(which);
        labelKey[which] = labelText[which] = '';
        continue;
      }
      // a new tag is placed before the force's name (it gets the first pick of the room), so the name comes again
      if (labelKey[which] !== w.key || (which === 'force' && fresh)) {
        anno.add(which, {
          text: w.text,
          point: w.point,
          kind: w.kind,
          color: w.color,
          spots: spotsOf(id, which),
          avoid: which === 'tag' ? [bodyBoxes, arrowBoxes, gapMark.boxes] : [bodyBoxes, gapMark.boxes],
          optional: which === 'force',
        });
        labelKey[which] = w.key;
        labelText[which] = `${w.text}|${w.color}`;
      } else if (labelText[which] !== `${w.text}|${w.color}`) {
        anno.update(which, { text: w.text, color: w.color });
        labelText[which] = `${w.text}|${w.color}`;
      }
    }
  }

  /** Draw the current scene at the current time, with its arrow, patch or gap and labels. */
  function drawScene() {
    const sc = cur();
    if (!sc) return;
    const marks = marksNow();
    if (isPool(s.scene)) sc.update(s.poolTime, { arrowOn: true, marks });
    else {
      const m = motion();
      // the arrow whenever the force acts: also in the first picture when it already does (the sliding crate, the
      // football's weight while the hands hold it)
      sc.update(m, { arrowOn: Boolean(m.acting), moving: true, marks });
    }
    sc.arrow.setColor(arrowColor());
    syncLabels();
    noteNow();
    stage.invalidate();
  }

  /** Show scene `id` (an example or a test case), with its camera, light and note. */
  function showScene(id, { animate = true } = {}) {
    const prev = s.scene;
    s.scene = id;
    const sc = sceneOf(id);
    for (const [k, other] of Object.entries(scenes)) other.root.visible = k === id;
    scene.background = sc.background ?? null;
    // the light (and its shadow box) follows the scene
    const c = sc.shadow.center;
    const r = sc.shadow.r;
    sun.position.set(c.x + r * 0.6, c.y + r * 1.6, c.z + r * 1.1);
    sun.target.position.copy(c);
    Object.assign(sun.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: r * 0.2, far: r * 5 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = r * 0.004;
    if (prev !== id) {
      s.userMovedCamera = false;
      const pose = viewPose();
      controls.minDistance = pose.distance * 0.35;
      controls.maxDistance = pose.distance * 3;
      flyTo(pose, 0);
      if (animate) {
        sc.root.scale.setScalar(0.94);
        tweener.animate({
          key: 'pop',
          duration: 0.3,
          ease: ease.outCubic,
          onUpdate: (k) => {
            sc.root.scale.setScalar(0.94 + 0.06 * k);
            stage.invalidate();
          },
        });
      } else {
        tweener.cancel('pop');
        sc.root.scale.setScalar(1);
      }
    }
    drawScene();
  }

  // ── the panel: the row of words, the action, the result, the rule ─────────────
  /** What the big action does now: play the example from rest; its step 1 until it has been seen, then a replay. */
  const plan = () => ({ label: `${s.seen ? 'again' : 'act'}_${s.example}`, step: s.seen ? '' : 1 });

  /** The result line: the example in the book's words at rest, what is being set up, then the force and its kind. */
  function outcomeHtml(m) {
    const id = s.example;
    if (s.phase === 'rest') return t(`rest_${id}`);
    if (s.phase === 'done') return t(`end_${id}`);
    if (!moved(id, m)) return t(`pre_${id}`);
    return t(`out_${id}`);
  }
  /** The rule: the book's definition of force, then this force's kind and what it does to its body. */
  function ruleHtml(m) {
    const id = s.example;
    const played = s.phase !== 'rest' && s.phase !== 'done' && moved(id, m);
    if (!played && !s.seen) return t('rule_start');
    const head = `kinds_${KIND[id]}`;
    return played ? `${t(head)} ${t(`eff_${EFFECT[id]}`)}` : t(head);
  }

  let lastNote = '';
  /** Write the panel and the action (only what changed: it runs on every frame of a run). */
  function refresh() {
    if (s.mode === 'quiz') return;
    const id = s.example;
    const m = actionAt(id, s.time);
    sheet.outcome(outcomeHtml(m));
    sheet.rule(ruleHtml(m));
    const p = plan();
    action?.set({ step: p.step, label: p.label, enabled: s.phase !== 'acting' });
    noteNow();
  }
  /** How time is shown, in the top left corner: held, slowed down, or real. */
  function noteNow() {
    const id = s.scene;
    const held = !isPool(id) && Boolean(id) && s.phase === 'paused';
    // held on purpose at the telling moment: said plainly, with a pause sign, so it is not taken for a frozen screen
    const html = isPool(id) || !id ? '' : held ? `${ICONS.pause}${t('note_held')}` : SLOW[id] > 1 ? t('note_slow', { k: SLOW[id] }) : t('note_real');
    if (html === lastNote) return;
    note.innerHTML = lastNote = html;
    note.classList.toggle('held', held);
  }

  // ── the action ──────────────────────────────────────────────────────────────
  let lastAct = -1e9;
  /** The example starts afresh, at rest. */
  function setExample(id = EXAMPLE, { animate = true } = {}) {
    s.time = 0;
    s.phase = 'rest';
    s.playing = false;
    s.stopAt = Number.POSITIVE_INFINITY;
    showScene(id, { animate });
    hideHint();
    refresh();
    emitChange();
  }

  /** Play the current example from rest to its telling moment, where it holds. */
  function play({ silent = false } = {}) {
    if (s.locked) return lockedNudge();
    if (s.phase === 'acting') return;
    s.time = 0;
    s.phase = 'acting';
    s.playing = true;
    s.stopAt = KEY[s.example];
    lastAct = performance.now();
    if (!silent) audio.pop();
    refresh();
    drawScene();
    emit('act', { example: s.example });
    emitChange();
  }

  /** The big action (its button, its badge, Space/Enter): play the example from rest. */
  function doAction() {
    if (s.locked) return lockedNudge();
    if (s.phase === 'acting' || performance.now() - lastAct < 400) return; // a double tap is not a second action
    play();
  }

  /** The run has reached its telling moment (or a time it was sent to): it is seen. */
  function arrived() {
    if (s.mode !== 'quiz' && s.phase === 'paused' && Math.abs(s.time - KEY[s.scene]) < 1e-6) s.seen = true;
  }

  stage.addTicker((dt) => {
    if (isPool(s.scene)) {
      if (s.poolFrozen) return false;
      s.poolTime += dt;
      drawScene();
      return true;
    }
    if (!s.playing) return false;
    const id = s.scene;
    let next = s.time + dt;
    let held = false;
    if (next >= s.stopAt) {
      next = s.stopAt;
      held = true;
    }
    if (next >= DURATION[id]) {
      next = DURATION[id];
      held = true;
    }
    s.time = next;
    if (held) {
      s.playing = false;
      s.phase = next >= DURATION[id] ? 'done' : 'paused';
      arrived();
      if (s.mode !== 'quiz') audio.tick();
    }
    drawScene();
    refresh();
    if (held) emitChange();
    return true;
  });

  // ── camera ──────────────────────────────────────────────────────────────────
  const basisX = new THREE.Vector3();
  const basisY = new THREE.Vector3();
  const corner = new THREE.Vector3();
  const centre = new THREE.Vector3();
  /** The front (or 3D) view that fits the scene's box in the room below the buttons. */
  function viewPose(view = s.view) {
    const sc = cur();
    const dir = sc.views[view];
    // a big, wide view (book page, desktop) has room for more (the magnet's hand); a small phone keeps the close view
    const wide = stage.width >= 600 && stage.width / Math.max(stage.height, 1) > 1.7;
    const { min, max } = (wide && sc.fitWide) || sc.fit;
    centre.addVectors(min, max).multiplyScalar(0.5);
    basisX.crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
    basisY.crossVectors(dir, basisX).normalize();
    let hw = 0;
    let hh = 0;
    let depth = 0;
    for (let i = 0; i < 8; i++) {
      corner.set(i & 1 ? max.x : min.x, i & 2 ? max.y : min.y, i & 4 ? max.z : min.z).sub(centre);
      hw = Math.max(hw, Math.abs(corner.dot(basisX)));
      hh = Math.max(hh, Math.abs(corner.dot(basisY)));
      depth = Math.max(depth, corner.dot(dir));
    }
    const W = Math.max(stage.width, 1);
    const H = Math.max(stage.height, 1);
    const top = Math.min(TOP_ROOM, H * 0.16);
    const bottom = 8;
    const side = 12;
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const tanH = tanV * (W / H);
    const usableV = Math.max(0.4, (H - top - bottom) / H);
    const usableH = Math.max(0.6, (W - 2 * side) / W);
    const distance = Math.max(hh / tanV / usableV, hw / tanH / usableH) + depth;
    // centre the box in the room below the buttons: move the look-at point up the screen
    const perPixel = (2 * (distance - depth) * tanV) / H;
    const target = centre.clone().addScaledVector(basisY, ((top - bottom) / 2) * perPixel);
    camera.near = Math.max(0.002, distance * 0.02);
    camera.far = distance * 40;
    camera.updateProjectionMatrix();
    return { target, position: target.clone().addScaledVector(dir, distance), distance };
  }
  function flyTo({ position, target }, duration = 0.8) {
    tweener.cancel('camera');
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
    // turning and zooming only in the 3D view: in the front view the framing stays as fitted
    controls.enableRotate = controls.enableZoom = !s.locked; // the test keeps the view still
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    return flyTo(viewPose(s.view), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    turning = true;
  });
  // the view starts from the front; a drag turns it (the camera really moves: a tap never does), and then the "front"
  // button appears to come back
  let turning = false;
  controls.addEventListener('end', () => {
    turning = false;
  });
  controls.addEventListener('change', () => {
    if (!turning || s.view === '3d') return;
    s.view = '3d';
    syncUI();
  });
  stage.onResize(() => {
    root.classList.toggle('cnf-compact', stage.height < 300 || stage.width < 360);
    if (!s.userMovedCamera && cur()) flyTo(viewPose(s.view), 0);
    noteNow();
  });

  // ── touching the picture: a tap on the example plays it ─────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  /** Does a finger at canvas point p touch the example (its big invisible targets)? */
  function pick(p) {
    const sc = cur();
    if (!sc?.hits.length) return false;
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(sc.hits, false).length > 0;
  }
  /** @type {{ id: number, x: number, y: number, at: number } | null} */
  let down = null;
  ui.canvasHost.addEventListener('pointerdown', (e) => {
    audio.unlock();
    root.focus({ preventScroll: true });
    if ((e.pointerType === 'mouse' && e.button !== 0) || s.mode === 'quiz') return;
    down = pick(canvasPoint(e)) ? { id: e.pointerId, x: e.clientX, y: e.clientY, at: performance.now() } : null;
  });
  // a real tap plays it; a drag on it still turns the camera in the 3D view
  window.addEventListener('pointerup', (e) => {
    const d = down;
    if (!d || e.pointerId !== d.id) return;
    down = null;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > TAP.move || performance.now() - d.at > TAP.ms) return;
    if (s.mode !== 'quiz' && pick(canvasPoint(e)) && s.phase !== 'acting' && performance.now() - lastAct > 400) play();
  });
  window.addEventListener('pointercancel', () => {
    down = null;
  });
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
      ui.canvasHost.style.cursor = s.mode !== 'quiz' && pick(p) ? 'pointer' : '';
    });
  });

  // ── hint line (only for a locked tap in the test) ───────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 4000 } = {}) {
    ui.hintText.textContent = text;
    ui.hintAct.hidden = true;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    if (duration) hintTimer = setTimeout(hideHint, duration);
    stage.invalidate();
  }
  function hideHint() {
    clearTimeout(hintTimer);
    ui.hint.classList.remove('show');
    stage.invalidate();
  }
  function lockedNudge() {
    showHint(t('q_locked'), { duration: 1800 }); // short: in the test it sits over the picture
    audio.error();
  }

  // the big button in the panel and the numbered ring round the body the force acts on (the ring lets taps through to
  // the body, whose own tap plays the example too); the ring shows only while the example waits at rest
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: `act_${s.example}`,
    target: () => (s.mode === 'explore' && s.phase === 'rest' && !isPool(s.scene) && cur() ? cur().subject() : null),
    pad: 8,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── the test ────────────────────────────────────────────────────────────────
  const textLabel = (keys) => (j) => `<span class="cnf-opt">${t(keys[j])}</span>`;
  let order = [];

  /** A book example for a question: it plays from rest and holds at its telling moment, its arrow in plain grey. */
  function questionExample(id) {
    s.reveal = false;
    s.time = 0;
    s.playing = true;
    s.phase = 'acting';
    s.stopAt = KEY[id];
    showScene(id, { animate: false });
  }
  function questionCase(id) {
    s.reveal = false;
    s.playing = false;
    s.poolTime = 0.6;
    s.poolFrozen = false;
    showScene(id, { animate: false });
  }

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: QUESTIONS.length,
    lines: { text: 2, feedback: 3 },
    action,
    hooks: {
      enter() {
        s.mode = 'quiz';
        s.locked = true;
        s.playing = false;
        hideHint();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.reveal = false;
        question = null;
        syncUI();
        setExample(EXAMPLE, { animate: false });
      },
      prepare(i, _alive, say) {
        // a new round (also "take the test again"): a new order
        if (i === 0) order = shuffle(QUESTIONS);
        const { kind, set } = order[i % order.length];
        if (kind === 'case') questionCase(set);
        else questionExample(EXAMPLE);
        const keys = shuffle(KIND_CHOICES[set]);
        question = { kind, id: s.scene, set, keys, marks: true };
        drawScene();
        say(t(`q_${set}`));
        return {
          choices: [0, 1, 2, 3],
          expected: keys.indexOf(KIND_CHOICES[set][0]),
          tolerance: 0.5,
          label: textLabel(keys),
          meta: { kind, case: set, answer: CHOICE_KIND[set] },
        };
      },
      reveal(_q, correct, picked) {
        const q = question;
        // the worked answer leads with the answer and, after a wrong tap, speaks to that very mistake
        const missed = correct ? null : q.keys[picked.value];
        s.reveal = true;
        if (!isPool(s.scene)) {
          // held at the telling moment, so the numbers in the answer are the ones in the picture
          s.time = KEY[s.scene];
          s.playing = false;
          s.phase = 'paused';
        }
        drawScene();
        return t(missed ? `miss_${missed}` : `why_${q.set}`, { d: gapNowCm() });
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
    if (!s.locked) controls.enableRotate = controls.enableZoom = true; // the test keeps the view still
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
    const b = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('button'));
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
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if ((k === ' ' || k === 'enter') && !target.closest('button')) doAction();
    else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshot() {
    const id = s.example;
    const m = actionAt(id, isPool(s.scene) ? 0 : s.time);
    const p = plan();
    const g = gapNow();
    return {
      example: s.example,
      scene: s.scene,
      phase: s.phase,
      time: roundTo(s.time, 0.01),
      speed: roundTo(m.speed, 0.01), // real m/s (the friction, football and magnet examples are shown slower)
      acting: s.phase !== 'rest' && Boolean(m.acting),
      touching: Boolean(m.touching),
      gap: m.gap == null ? null : roundTo(m.gap, 0.001), // m
      kind: KIND[id],
      effect: EFFECT[id],
      marks: g ? 'gap' : marksNow() ? 'contact' : null, // what the picture shows: the contact patch, the measured gap
      seen: s.seen,
      step: p.step, // the big action's number (1 until the example has been seen)
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.phase, snap.seen, snap.view, snap.mode]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  /** Jump the example to 'rest', 'key' or 'end' (or a time in s), held there. */
  function jump(at) {
    const id = s.example;
    s.playing = false;
    if (at === 'rest' || at === 0) {
      s.time = 0;
      s.phase = 'rest';
    } else {
      const time = at === 'key' ? KEY[id] : at === 'end' ? DURATION[id] : Math.min(DURATION[id], Math.max(0, Number(at) || 0));
      s.time = time;
      s.phase = time >= DURATION[id] ? 'done' : 'paused';
      arrived();
    }
    drawScene();
    refresh();
    emitChange();
  }

  // ── start ───────────────────────────────────────────────────────────────────
  controls.enableRotate = controls.enableZoom = true;
  root.classList.toggle('cnf-compact', stage.height < 300 || stage.width < 360);
  setExample(EXAMPLE, { animate: false });
  if (o.at === 'key' || o.at === 'end') jump(o.at);
  syncUI();
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
     * Change any of: at ('rest' | 'key' | 'end' | seconds: jump there, held), play (true: play the example to its
     * telling moment), act (true: what the big button does), view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.at != null && s.mode !== 'quiz') jump(p.at);
      if (p.play) play({ silent: true });
      if (p.act) doAction();
      drawScene();
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      hideHint();
      s.seen = false;
      setExample(EXAMPLE, { animate: false });
      await setView('front');
    },
    startPractice: () => quiz.start(),
    capture(opts = {}) {
      // a transparent picture (background: null) leaves the setting's sky or wall colour out
      const before = scene.background;
      if (opts.background === null) scene.background = null;
      try {
        return stage.capture(opts);
      } finally {
        scene.background = before;
        stage.invalidate();
      }
    },
    exportRoot: () => cur().model, // the example's objects: no ground, arrow, patch or labels
  };
}
