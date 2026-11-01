// Force: contact and non-contact (book page 67, topic 3.1.2: বল), student view. The page's five examples, one at a
// time: a crane lifts a heavy block, a student pushes a trolley, friction stops a sliding crate, a football let go
// falls, a magnet pulls a nail. One big action plays the example (ক্রেন দিয়ে তোলো, ধাক্কা দাও, …; its numbered badge
// rings the body the force acts on): the force acts, the body starts moving (or slows), and the run holds at the
// telling moment, where the picture itself says which kind of force it is. A contact force lights the patch where
// the two bodies touch (the hook in the ring, the palms on the carton, the floor under the crate) with the tag
// "ছুঁয়ে আছে: স্পর্শ বল"; a non-contact force shows the empty gap between them, measured ("ফাঁক ৬০ cm"), with the tag
// "ছোঁয়নি, তবু টানে: অস্পর্শ বল". The arrow and the tag carry the kind's colour and words. The panel is the kit's clean
// sheet: the five examples as one row of words (each gets its kind under it once seen), the action, one result line
// naming the force and its kind, one rule that starts with the book's definition of force and grows into the two
// kinds. Then a short test with new cases (a rope, a parachute, a comb) and the usual confusions (friction with
// nobody pushing, gravity with nothing touching). Built on the shared student kit.
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
import { createPushScene } from './push.js';
import { createFrictionScene } from './friction.js';
import { createFallScene } from './fall.js';
import { createMagnetScene } from './magnet.js';
import { createCombScene, createParachuteScene, createRopeScene } from './pool.js';
import {
  CASES,
  CHOICE_KIND,
  DURATION,
  EFFECT,
  EFFECT_CHOICES,
  EFFECT_RIGHT,
  EXAMPLE_IDS,
  KEY,
  KIND,
  KIND_CHOICES,
  QUESTION_KINDS,
  SLOW,
  actionAt,
  gapCm,
  moved,
  roundTo,
  shuffle,
} from './motion.js';

export const DEFAULTS = {
  example: 'crane', // the first example shown
  at: 'rest', // 'rest' | 'key' | 'end': where it starts (key: held at the telling moment)
  seen: false, // all five already seen (their kinds under the words; a summary for the book page)
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
  push: { tag: '0,-66 34,-62 -34,-62 40,-46 -50,-30 40,46 -50,40', force: '30,-54 54,-62 0,-60 0,76 96,24' },
  friction: { tag: '0,50 34,48 -34,48 62,0 0,-74', force: '-14,0 -14,-24 -14,24 0,26 0,-26', along: 1 },
  fall: { tag: '-18,0 -18,-44 -18,44 18,0 18,-44', force: '34,0 34,24 34,-26 -34,0' },
  magnet: { tag: '0,50 26,50 -26,50 0,-58', force: '0,-36 -30,-34 30,-34 0,-52 0,40' },
  rope: { tag: '0,-62 -34,-54 34,-54 0,62', force: '0,-24 0,24 24,0' },
  parachute: { tag: '0,74 64,0 -64,0 0,-74', force: '24,0 -24,0 24,26' },
  comb: { tag: '0,62 -30,58 30,58 -34,0 34,0 0,-74', force: '-22,0 22,0 0,24' },
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
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', results: true, items: EXAMPLE_IDS.map((id) => ({ id, label: `ex_${id}` })) },
      lines: { action: 1, outcome: 1, rule: 3 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);
  const resultEls = Object.fromEntries(sheet.words.map((b) => [b.dataset.example, /** @type {HTMLElement} */ (b.querySelector('.pvc-ex-res'))]));
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
    push: createPushScene,
    friction: createFrictionScene,
    fall: createFallScene,
    magnet: createMagnetScene,
    rope: createRopeScene,
    parachute: createParachuteScene,
    comb: createCombScene,
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
  for (const id of EXAMPLE_IDS) sceneOf(id);

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    example: EXAMPLE_IDS.includes(o.example) ? o.example : 'crane',
    scene: '', // what the 3D shows: an example, or a test case (rope, parachute, comb)
    phase: 'rest', // 'rest' | 'acting' | 'paused' (held at the telling moment, or at a time) | 'done'
    time: 0, // s along the example's action
    playing: false,
    stopAt: Number.POSITIVE_INFINITY, // the run holds here (the telling moment)
    seen: /** @type {Record<string, string>} */ ({}), // example → its kind, once its run reached the telling moment
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
  const seenCount = () => Object.keys(s.seen).length;
  /** The next example not seen yet, after `from` in the page's order (or null when all five are seen). */
  function nextUnseen(from) {
    const i = EXAMPLE_IDS.indexOf(from);
    for (let k = 1; k <= EXAMPLE_IDS.length; k++) {
      const id = EXAMPLE_IDS[(i + k) % EXAMPLE_IDS.length];
      if (!s.seen[id]) return id;
    }
    return null;
  }
  /**
   * What the big action does now: play this example (from rest), or once it has been seen, go on to the next one not
   * seen yet. Its step counts the student's own steps (the examples seen so far, plus one); a replay has none.
   */
  function plan() {
    const id = s.example;
    if (s.phase === 'rest' || s.phase === 'acting')
      return s.seen[id] ? { id, label: `again_${id}`, step: '' } : { id, label: `act_${id}`, step: seenCount() + 1 };
    const next = nextUnseen(id);
    return next ? { id: next, label: `act_${next}`, step: seenCount() + 1 } : { id, label: `again_${id}`, step: '' };
  }

  /** The result line: the example in the book's words at rest, what is being set up, then the force and its kind. */
  function outcomeHtml(m) {
    const id = s.example;
    if (s.phase === 'rest') return t(`rest_${id}`);
    if (s.phase === 'done') return t(`end_${id}`);
    if (!moved(id, m)) return t(`pre_${id}`);
    return t(`out_${id}`);
  }
  /** The rule: the book's definition of force, then the kinds found so far and what this force does to its body. */
  function ruleHtml(m) {
    const id = s.example;
    const played = s.phase !== 'rest' && s.phase !== 'done' && moved(id, m);
    const kinds = new Set(Object.values(s.seen));
    if (played) kinds.add(KIND[id]);
    const all = seenCount() === EXAMPLE_IDS.length;
    if (!kinds.size) return t('rule_start');
    const head = all ? 'kinds_all' : kinds.size === 2 ? 'kinds_both' : kinds.has('contact') ? 'kinds_contact' : 'kinds_noncontact';
    return played ? `${t(head)} ${t(`eff_${EFFECT[id]}`)}` : t(head);
  }

  let lastNote = '';
  /** Write the panel and the action (only what changed: it runs on every frame of a run). */
  function refresh() {
    if (s.mode === 'quiz') return;
    const id = s.example;
    const m = actionAt(id, s.time);
    sheet.choose(id);
    for (const x of EXAMPLE_IDS) {
      sheet.result(x, s.seen[x] ? t(`res_${s.seen[x]}`) : '');
      const k = s.seen[x] || '';
      if (resultEls[x] && resultEls[x].dataset.kind !== k) resultEls[x].dataset.kind = k;
    }
    sheet.outcome(outcomeHtml(m));
    sheet.rule(ruleHtml(m));
    const p = plan();
    sheet.next(p.id !== id ? p.id : null);
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
  /** Choose an example: it starts afresh, at rest. */
  function setExample(id, { animate = true } = {}) {
    if (!EXAMPLE_IDS.includes(id)) return;
    s.example = id;
    s.time = 0;
    s.phase = 'rest';
    s.playing = false;
    s.stopAt = Number.POSITIVE_INFINITY;
    showScene(id, { animate });
    hideHint();
    refresh();
    emit('example', { example: id });
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

  /** The big action (its button, its badge, Space/Enter): play this example, or go on to the next one not seen yet. */
  function doAction() {
    if (s.locked) return lockedNudge();
    if (s.phase === 'acting' || performance.now() - lastAct < 400) return; // a double tap is not a second action
    const p = plan();
    if (p.id !== s.example) setExample(p.id);
    play();
  }

  /** The run has reached its telling moment (or a time it was sent to): it is seen. */
  function arrived() {
    if (s.mode !== 'quiz' && s.phase === 'paused' && Math.abs(s.time - KEY[s.scene]) < 1e-6) s.seen[s.scene] = KIND[s.scene];
  }

  let lastTouch = false;
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
    const m = actionAt(id, s.time);
    if (id === 'magnet' && m.touching && !lastTouch) audio.contact(); // the nail clicks onto the magnet
    lastTouch = Boolean(m.touching);
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
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
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
    questions: 5,
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
        setExample(s.example, { animate: false });
      },
      prepare(i, _alive, say) {
        // a new round (also "take the test again"): a new order
        if (i === 0) order = shuffle(QUESTION_KINDS);
        const kind = order[i % order.length];
        let set;
        if (kind === 'case' || kind === 'comb') {
          set = kind === 'comb' ? 'comb' : pickOne(['rope', 'parachute']);
          questionCase(set);
        } else if (kind === 'friction' || kind === 'gravity') {
          set = kind === 'friction' ? 'crate' : 'ball';
          questionExample(kind === 'friction' ? 'friction' : 'fall');
        } else {
          // what the magnet's pull does to the nail: the book's definition of force (no kind asked, no marks)
          questionExample('magnet');
          const keys = shuffle(EFFECT_CHOICES);
          question = { kind, id: 'magnet', set: 'magnet', keys, marks: false };
          drawScene();
          say(t('q_eff_magnet'));
          return {
            choices: [0, 1, 2, 3],
            expected: keys.indexOf(EFFECT_RIGHT.magnet),
            tolerance: 0.5,
            label: textLabel(keys),
            meta: { kind, example: 'magnet' },
          };
        }
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
        if (q.kind === 'effect') {
          // it goes on to the end: the answer happens, the nail rushes on faster and clicks onto the magnet
          s.stopAt = Number.POSITIVE_INFINITY;
          s.playing = true;
          s.phase = 'acting';
          drawScene();
          return t(missed ? `miss_${missed}_magnet` : 'why_eff_magnet');
        }
        s.reveal = true;
        if (q.set === 'comb') {
          // held where one bit is on its way up and others still lie on the table: the gap stays to be seen
          s.poolTime = 1.75;
          s.poolFrozen = true;
        } else if (!isPool(s.scene)) {
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
    if (b.dataset.example) {
      if (s.locked) lockedNudge();
      else if (b.dataset.example !== s.example || s.phase !== 'rest') setExample(b.dataset.example);
    }
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
    const n = Number(k);
    if (n >= 1 && n <= EXAMPLE_IDS.length) {
      if (s.locked) lockedNudge();
      else setExample(EXAMPLE_IDS[n - 1]);
    } else if (k === 'arrowright' || k === 'arrowleft') {
      // (on the row of words the kit's radio group takes the arrows itself)
      if (s.locked) lockedNudge();
      else {
        const i = EXAMPLE_IDS.indexOf(s.example) + (k === 'arrowright' ? 1 : -1);
        setExample(EXAMPLE_IDS[(i + EXAMPLE_IDS.length) % EXAMPLE_IDS.length]);
      }
    } else if ((k === ' ' || k === 'enter') && !target.closest('button')) doAction();
    else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshot() {
    const id = isPool(s.scene) ? s.example : s.scene || s.example;
    const m = actionAt(id, s.time);
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
      seen: { ...s.seen },
      next: { example: p.id, step: p.step }, // what the big action does now
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.example, snap.phase, snap.seen, snap.view, snap.mode]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  /** Jump the current example to 'rest', 'key' or 'end' (or a time in s), held there. */
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
  if (o.seen) for (const id of EXAMPLE_IDS) s.seen[id] = KIND[id];
  setExample(s.example, { animate: false });
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
     * Change any of: example ('crane' | 'push' | 'friction' | 'fall' | 'magnet', starts afresh at rest), seen ('all' |
     * 'none' | { id: true }), at ('rest' | 'key' | 'end' | seconds: jump there, held), play (true: play this example
     * to its telling moment), act (true: what the big button does now), view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.seen === 'all') for (const id of EXAMPLE_IDS) s.seen[id] = KIND[id];
      else if (p.seen === 'none') s.seen = {};
      else if (p.seen && typeof p.seen === 'object') {
        s.seen = {};
        for (const [id, on] of Object.entries(p.seen)) if (EXAMPLE_IDS.includes(id) && on) s.seen[id] = KIND[id];
      }
      if (p.example && s.mode !== 'quiz') setExample(p.example, { animate });
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
      s.seen = {};
      if (o.seen) for (const id of EXAMPLE_IDS) s.seen[id] = KIND[id];
      setExample(EXAMPLE_IDS.includes(o.example) ? o.example : 'crane', { animate: false });
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
