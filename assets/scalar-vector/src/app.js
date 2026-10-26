// Scalar and vector quantities (book page 38, topic 2.3), student view: "find your friend" on a school field seen from
// slightly above. You stand on a chalk compass; your friend is hiding. Call, and the friend answers with a size only
// ("৩০ মিটার দূরে"): a measuring line sweeps round and the ring of every place 30 m away lights up with question
// marks, so you cannot find them (a মান alone; like a temperature, a স্কেলার needs nothing more, but a position
// does). Ask the direction too ("৩০ মিটার, উত্তর-পূর্ব দিকে"): the compass point glows, one arrow A grows to exactly
// one spot, the friend pops up, and you walk over (মান + দিক = ভেক্টর). Then the book's চিত্র ২.০৩ in the same story:
// B, C and D walk their own clues from other places, and each arrow in turn slides, unturned and unstretched, onto
// the tail of the one the book compares it with: B covers A exactly (হুবহু এক, যদিও ভিন্ন অবস্থানে), C has A's
// মান but another দিক (an orange arc), D has C's দিক but half its মান. The panel is the kit's clean sheet: one big
// numbered action whose same badge rings what to touch on the field, one result line, one rule that grows to the
// book's words. Then a five-question test on scenes set up for each question.
// Built on the shared student kit (@shared/student/…).
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
import { COLORS, P, createChalkLine, createField, createFlag, createRing, createRose, createScaleBar } from './field.js';
import { createKid } from './people.js';
import { createArc, createFieldArrow } from './vectors.js';
import { fitPose } from './camera.js';
import {
  CELLS,
  FRIEND,
  PAIRS,
  QUANTITIES,
  RING,
  START,
  TEST_D,
  TEST_L,
  VECTORS,
  WALKERS,
  along,
  centredTail,
  compass,
  equalOptions,
  findOptions,
  headOf,
  verdict,
  whyPartner,
} from './reading.js';

export const DEFAULTS = {
  stage: 0, // steps already done: 0 start · 1 the ring · 2 found · 3 B, C, D walked · 4–6 B, C, D compared
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the field pulses (false: it stays still)
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const NAMES = ['B', 'C', 'D'];
const F = headOf(FRIEND); // where the friend is
const YOU_END = [F[0] + 4.6, F[1] - 1.6]; // you stop beside the friend (not on the arrow's head)
const LINE_AT = 210; // the measuring line ends pointing this way (away from the answer)
const TEMP = 37; // ° C, the book's body temperature
const WALK = 17; // m/s: walks are quicker than life (no time is shown)
const STRIDE = 2.4; // m of walk per radian of the legs' swing
const DOUBLE_TAP = 450; // ms
const FRAME = new THREE.Box3(new THREE.Vector3(-29, 0, -29.5), new THREE.Vector3(29, 6, 29));
const VIEW_3D = new THREE.Vector3(-0.5, 0.62, 0.6).normalize();
const MARGIN = { top: 48, bottom: 8, side: 8 };
const rad = THREE.MathUtils.degToRad;
const lerp2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const headingTo = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  /** A vector's name as it is written by hand: the letter with a small arrow over it (style.css). */
  const V = (n) => `<span class="sv-vec">${n}</span>`;
  const dirName = (angle) => t(`dir_${compass(angle)}`);

  root.classList.add('pvc', 'sv');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, { quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }], lines: { action: 1, outcome: 2, rule: 3 } }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const outcomeEl = ui.$('.pvc-outcome');
  const note = document.createElement('div');
  note.className = 'sv-note';
  ui.stage.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 1, far: 900, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableRotate = false;
  controls.enableZoom = false;
  controls.minDistance = 40;
  controls.maxDistance = 320;
  controls.maxPolarAngle = rad(80);
  const world = new THREE.Group();
  world.name = 'ScalarVector';
  scene.add(world);

  const field = createField();
  const rose = createRose({ t, at: START });
  const ring = createRing({ at: START, radius: RING, from: LINE_AT });
  const ring20 = createRing({ at: START, radius: TEST_D, from: 0, dashes: 52 }); // the test's ring
  ring20.root.name = 'TestRing';
  const scaleBar = createScaleBar();
  world.add(field.root, rose.root, ring.root, ring20.root, scaleBar.root);

  const you = createKid({ name: 'You', clothes: { top: '#f8f9fa', legs: '#25324a' } });
  const friend = createKid({ name: 'Friend', clothes: { top: '#f03e3e', legs: '#1f2d3d', hair: '#2b1d14' } });
  const kids = {
    B: createKid({ name: 'ChildB', clothes: { top: '#fcc419', legs: '#343a40' } }),
    C: createKid({ name: 'ChildC', clothes: { top: '#e64980', legs: '#2b2f36', hair: '#3b2412' } }),
    D: createKid({ name: 'ChildD', clothes: { top: '#22b8cf', legs: '#343a40' } }),
  };
  world.add(you.root, friend.root, ...Object.values(kids).map((k) => k.root));

  const arrows = Object.fromEntries(['A', ...NAMES].map((n) => [n, createFieldArrow({ name: `Vector${n}` })]));
  const ghost = createFieldArrow({ name: 'Copy', color: '#9b7cf6', opacity: 0.66, ticks: false, hit: false });
  ghost.root.userData.noExport = true;
  const arc = createArc();
  arc.mesh.userData.noExport = true;
  world.add(...Object.values(arrows).map((a) => a.root), ghost.root, arc.mesh);

  // the test's things: four flags, three chalk lines, five arrows
  const flags = Array.from({ length: 4 }, (_, i) => createFlag(`Flag${i}`));
  for (const f of flags) f.root.visible = false;
  const chalk = Array.from({ length: 3 }, (_, i) => createChalkLine(`ChalkLine${i}`));
  const testArrows = Array.from({ length: 5 }, (_, i) => createFieldArrow({ name: `TestArrow${i}` }));
  const testGroup = new THREE.Group();
  testGroup.name = 'TestScene';
  testGroup.userData.noExport = true;
  testGroup.add(...flags.map((f) => f.root), ...chalk.map((c) => c.mesh), ...testArrows.map((a) => a.root));
  world.add(testGroup);

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  let sun = null;
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    sun = new THREE.DirectionalLight(0xffffff, 0.55);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 10, far: 260 });
    sun.shadow.radius = 5;
    sun.shadow.bias = -0.0005;
    sun.position.set(40, 120, 60);
    sun.target.position.set(0, 0, 0);
    scene.add(sun, sun.target);
    field.ground.receiveShadow = true;
    const casters = [
      you.root,
      friend.root,
      ...Object.values(kids).map((k) => k.root),
      ...Object.values(arrows).map((a) => a.root),
      ...testArrows.map((a) => a.root),
      ...flags.map((f) => f.root),
    ];
    for (const obj of casters)
      obj.traverse((m) => {
        if (m instanceof THREE.Mesh && m.material && !m.material.transparent && m.material.visible !== false) m.castShadow = true;
      });
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const s = {
    clue: 0, // 0 nothing yet · 1 the distance only · 2 distance and direction (found)
    walked: false, // B, C and D have walked their clues
    compared: [], // the children whose arrows were slid onto their partner's tail, in order
    current: null, // whose comparison shows now
    pending: null, // what an animation is in the middle of: 'heard' | 'walking' | { moving: name }
    busy: false,
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    scene: 'learn', // 'learn' | 'test'
    locked: false,
    userMovedCamera: false,
  };
  let token = 0; // bumped by anything that calls off what is pending
  let lastAct = Number.NEGATIVE_INFINITY;
  const now = () => performance.now();

  /** The look of the learn scene at one moment: every animation moves these numbers, applyLearn() draws them. */
  function freshVis() {
    return {
      ring: { drawn: 0, marks: 0, markOpacity: 1, opacity: 1, line: 0, lineAngle: LINE_AT, lineOpacity: 1 },
      rose: 0, // the উত্তর-পূর্ব point glows
      a: 0, // how much of A is drawn
      you: { p: [...START], heading: 285, walk: 0, wave: 0, waveT: 0, look: 0 },
      friend: { pop: 0, wave: 0, waveT: 0 },
      w: Object.fromEntries(NAMES.map((n) => [n, { show: 0, f: 0, p: [...WALKERS[n].tail], walk: 0 }])),
      ghost: { name: null, k: 0, show: 0 },
      arc: 0,
    };
  }
  /** The scene once a state is reached (no animation). */
  function visFor({ clue, walked, current }) {
    const v = freshVis();
    if (clue >= 1) Object.assign(v.ring, { drawn: 1, marks: 1, line: 1 });
    if (clue >= 2) {
      Object.assign(v.ring, { line: 0, markOpacity: 0.3, opacity: 0.5 });
      v.rose = 1;
      v.a = 1;
      v.friend = { pop: 1, wave: 1, waveT: 0.6 };
      v.you = { p: [...YOU_END], heading: 180, walk: 0, wave: 0, waveT: 0, look: 0 };
    }
    if (walked) {
      Object.assign(v.ring, { opacity: 0, markOpacity: 0 });
      v.rose = 0;
      v.friend.wave = 0;
      for (const n of NAMES) v.w[n] = { show: 1, f: 1, p: headOf(WALKERS[n]), walk: 0 };
    }
    if (current) {
      v.ghost = { name: current, k: 1, show: 1 };
      v.arc = verdict(VECTORS[current], VECTORS[PAIRS[current]]) === 'direction' ? 1 : 0;
    }
    return v;
  }
  let vis = freshVis();

  const popScale = (k) => (k >= 1 ? 1 : Math.max(0.001, ease.outBack(Math.max(0, k))));
  function placeKid(kid, st) {
    kid.root.position.copy(P(st.p[0], st.p[1]));
    kid.root.rotation.y = rad(st.heading);
    kid.pose(st);
  }

  /** Draws the learn scene from `vis`. */
  function applyLearn() {
    const r = vis.ring;
    ring.root.visible = true;
    ring.setDrawn(r.drawn);
    ring.setMarks(r.marks, r.markOpacity);
    ring.setOpacity(r.opacity);
    ring.setLine(r.lineAngle, r.line, r.lineOpacity);
    rose.highlight(vis.rose > 0.01 ? FRIEND.angle : null, vis.rose);
    if (vis.a > 0.001) arrows.A.set(FRIEND, vis.a);
    else arrows.A.hide();
    you.root.visible = true;
    placeKid(you, vis.you);
    friend.root.visible = vis.friend.pop > 0.001;
    friend.body.scale.setScalar(popScale(vis.friend.pop));
    placeKid(friend, { p: F, heading: 0, walk: 0, look: 0, wave: vis.friend.wave, waveT: vis.friend.waveT });
    for (const n of NAMES) {
      const w = vis.w[n];
      const kid = kids[n];
      kid.root.visible = w.show > 0.001;
      kid.body.scale.setScalar(popScale(w.show));
      placeKid(kid, { p: w.p, heading: WALKERS[n].angle, walk: w.walk, look: 0, wave: 0, waveT: 0 });
      if (w.f > 0.001) arrows[n].set(WALKERS[n], w.f);
      else arrows[n].hide();
    }
    const g = vis.ghost;
    if (g.name && g.show > 0.01) {
      const v = VECTORS[g.name];
      const to = VECTORS[PAIRS[g.name]].tail;
      ghost.set({ ...v, tail: lerp2(v.tail, to, g.k) }, 1, 1.2 + Math.sin(Math.PI * g.k) * 5);
      ghost.setOpacity(g.show);
    } else ghost.hide();
    if (g.name && vis.arc > 0.01) {
      const ref = VECTORS[PAIRS[g.name]];
      arc.set(ref.tail, ref.angle, VECTORS[g.name].angle, 12, vis.arc);
    } else arc.hide();
    learnLabels();
    stage.invalidate();
  }

  // ── labels on the field ─────────────────────────────────────────────────────
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, note, () => (ui.hint.classList.contains('show') ? hintBox() : null), () => action?.box(), () => action?.ringBox()],
  });
  const shownText = new Map();
  /** A label on the field, or none (spec null). Text, point and colour change in place. */
  function setLabel(id, spec) {
    if (!spec) {
      if (anno.has(id)) anno.remove(id);
      shownText.delete(id);
      return;
    }
    const key = `${spec.text}|${spec.color}|${spec.kind}`;
    if (!anno.has(id)) {
      anno.add(id, { kind: 'callout', avoid: [sceneBoxes], ...spec });
      shownText.set(id, key);
    } else if (shownText.get(id) !== key) {
      anno.update(id, { text: spec.text, color: spec.color, point: spec.point, spots: spec.spots ?? null });
      shownText.set(id, key);
    } else anno.update(id, { point: spec.point });
  }
  // beside the head first (straight above it is the compass's উ, behind the child on the screen), outside the ring the
  // action draws round you
  const BY_HEAD = [
    { dx: 34, dy: 0 },
    { dx: -34, dy: 0 },
    { dx: 30, dy: -22 },
    { dx: -30, dy: -22 },
    { dx: 0, dy: -30 },
  ];
  // the friend's name away from you (you stand on the friend's right)
  const FRIEND_SPOTS = [
    { dx: -20, dy: -12 },
    { dx: 0, dy: -18 },
    { dx: -26, dy: 2 },
    { dx: -22, dy: 16 },
  ];
  const ABOVE = [
    { dx: 0, dy: -16 },
    { dx: 18, dy: -12 },
    { dx: -18, dy: -12 },
    { dx: 24, dy: 4 },
    { dx: -24, dy: 4 },
    { dx: 0, dy: 26 },
  ];
  const BESIDE = [
    { dx: -22, dy: -14 },
    { dx: 22, dy: 14 },
    { dx: 0, dy: -24 },
    { dx: 0, dy: 24 },
    { dx: 30, dy: -6 },
    { dx: -30, dy: 6 },
    { dx: -36, dy: -26 },
    { dx: 36, dy: 26 },
  ];
  const tmp = new THREE.Vector3();
  const headTop = (kid) => () => kid.root.localToWorld(tmp.copy(kid.top));

  /** Boxes on the screen no label may cover: the arrows (beads along them), the children, the flags. */
  const proj = new THREE.Vector3();
  function toScreen(p) {
    proj.copy(p).project(camera);
    return { x: (proj.x * 0.5 + 0.5) * stage.width, y: (-proj.y * 0.5 + 0.5) * stage.height };
  }
  const beadA = new THREE.Vector3();
  const beadB = new THREE.Vector3();
  /** The children on the screen, `half` of their height out to each side of their feet. */
  function kidBoxes(half = 0.3) {
    const out = [];
    for (const kid of [you, friend, ...Object.values(kids)]) {
      if (!kid.root.visible) continue;
      const foot = toScreen(kid.root.getWorldPosition(beadA));
      const top = toScreen(kid.root.localToWorld(beadB.copy(kid.top)));
      const w = Math.max(8, Math.abs(foot.y - top.y) * half);
      out.push({ left: foot.x - w, top: top.y, right: foot.x + w, bottom: foot.y + 3 });
    }
    return out;
  }
  function sceneBoxes() {
    const out = [];
    const bead = (p, r) => {
      const c = toScreen(p);
      out.push({ left: c.x - r, top: c.y - r, right: c.x + r, bottom: c.y + r });
    };
    for (const a of [...Object.values(arrows), ghost, ...testArrows]) {
      const v = a.vector;
      if (!v) continue;
      const len = v.length;
      const n = Math.max(2, Math.ceil(len / 4));
      for (let i = 0; i <= n; i++) {
        const [x, y] = along({ ...v, length: len }, i / n);
        bead(P(x, y, 1, beadA), 10);
      }
    }
    out.push(...kidBoxes(0.45));
    for (const f of flags) {
      if (!f.root.visible) continue;
      const foot = toScreen(f.root.getWorldPosition(beadA));
      const top = toScreen(f.root.localToWorld(beadB.copy(f.top)));
      out.push({ left: foot.x - 6, top: top.y, right: foot.x + 18, bottom: foot.y + 3 });
    }
    return out;
  }
  function hintBox() {
    const o2 = stage.canvas.getBoundingClientRect();
    const r = ui.hint.getBoundingClientRect();
    return { left: r.left - o2.left, top: r.top - o2.top, right: r.right - o2.left, bottom: r.bottom - o2.top };
  }

  function learnLabels() {
    if (s.scene !== 'learn' && !picture) return;
    const found = s.clue >= 2 || vis.friend.pop > 0.6;
    const early = !s.walked && s.pending !== 'walking';
    setLabel('you', early ? { text: t('l_you'), point: headTop(you), color: '#1d2733', spots: BY_HEAD } : null);
    setLabel(
      'friend',
      early && found && vis.friend.pop > 0.6
        ? { text: t('l_friend'), point: headTop(friend), color: '#2b8a3e', spots: FRIEND_SPOTS, optional: true }
        : null,
    );
    setLabel(
      'line',
      ring.line && vis.ring.lineOpacity > 0.6 && vis.ring.drawn > 0.999
        ? { text: t('l_metres', { d: RING }), point: () => ring.lineMiddle(), color: COLORS.magnitude, spots: BESIDE }
        : null,
    );
    const aFull = vis.a > 0.999;
    setLabel(
      'A',
      aFull
        ? {
            text: early ? t('l_vector', { v: V('A'), d: RING, dir: dirName(FRIEND.angle) }) : V('A'),
            point: () => arrows.A.middle(),
            color: COLORS.vector,
            spots: BESIDE,
          }
        : null,
    );
    for (const n of NAMES) {
      const w = vis.w[n];
      if (w.show < 0.6) {
        setLabel(n, null);
        continue;
      }
      const drawn = w.f > 0.999;
      setLabel(n, {
        text: drawn ? V(n) : n,
        point: drawn ? nameAt[n] : headTop(kids[n]),
        color: COLORS.vector,
        spots: drawn ? BESIDE : ABOVE,
      });
    }
    const g = vis.ghost;
    if (g.name && g.k > 0.999 && s.current === g.name) {
      const v = verdict(VECTORS[g.name], VECTORS[PAIRS[g.name]]);
      const spec = {
        equal: { text: `${ICONS.check}<span>${t('l_same')}</span>`, color: COLORS.equal },
        direction: { text: t('l_dir'), color: COLORS.direction },
        magnitude: { text: t('l_mag'), color: COLORS.magnitude },
      }[v === 'both' ? 'direction' : v];
      const point = v === 'direction' ? () => arc.middle() : () => ghost.tip();
      // it repeats the result line, so it hides when nothing is free round its point
      const spots = v === 'direction' ? [{ dx: 0, dy: -14 }, ...ABOVE, ...BESIDE] : [...BESIDE, ...ABOVE];
      setLabel('verdict', { ...spec, point, spots, optional: true });
    } else setLabel('verdict', null);
    setLabel('scale', {
      text: t('l_metres', { d: 10 }),
      point: () => scaleBar.middle,
      color: '#2f3d4a',
      kind: 'part',
      spots: [
        { dx: 0, dy: -12 },
        { dx: 40, dy: 0 },
      ],
      optional: true,
    });
  }
  let picture = false; // a test question shows the learn scene as its picture
  // the ring to compare an arrow sits a little nearer its tail than its head, where its child stands (room for the badge)
  const ringAt = Object.fromEntries(NAMES.map((n) => [n, P(...along(WALKERS[n], 0.3), 1.6)]));
  // a child's arrow is named near its head (its middle is where D's copy ends when it lies on C; its ring is nearer the tail)
  const nameAt = Object.fromEntries(
    NAMES.map((n) => [
      n,
      (
        (p) => () =>
          p
      )(P(...along(WALKERS[n], 0.82), 1.5)),
    ]),
  );

  // ── the panel: one action, one result, one rule ─────────────────────────────
  /** What the big button (and a tap on its ring) does next, with the student's step number. */
  function plan() {
    if (s.clue === 0) return { act: 'call', step: 1, label: 'act_call' };
    if (s.clue === 1) return { act: 'ask', step: 2, label: 'act_ask' };
    if (!s.walked) return { act: 'walk', step: 3, label: 'act_walk' };
    const n = NAMES.find((x) => !s.compared.includes(x));
    if (n) return { act: 'compare', name: n, step: 4 + s.compared.length, label: `act_cmp_${n}` };
    return { act: 'again', step: '', label: 'act_again' };
  }
  /** What the ring goes round: you (your visible body: you call, ask and call the others), or the middle of the arrow to compare (a long diagonal arrow's box would ring half the field). */
  function actionTarget() {
    if (s.scene !== 'learn' || s.busy) return null;
    const p = plan();
    if (p.act === 'compare') return ringAt[p.name];
    return you.body;
  }

  function outcome() {
    const pend = s.pending;
    if (pend?.moving) return [t('out_moving', { x: V(pend.moving), y: V(PAIRS[pend.moving]) }), 'vector'];
    if (pend === 'heard') return [t('out_heard', { d: RING, dir: dirName(FRIEND.angle) }), 'vector'];
    if (pend === 'walking') return [t('out_walking'), 'vector'];
    if (s.current) {
      const x = s.current;
      const y = PAIRS[x];
      const v = verdict(VECTORS[x], VECTORS[y]);
      const key = v === 'equal' ? 'out_equal' : v === 'magnitude' ? 'out_mag' : 'out_dir';
      return [t(key, { x: V(x), y: V(y) }), v];
    }
    if (s.walked) return [t('out_walk', { a: V('A') }), 'vector'];
    if (s.clue >= 2) return [t('out_found', { d: RING, dir: dirName(FRIEND.angle) }), 'vector'];
    if (s.clue === 1) return [t('out_ring', { d: RING }), 'magnitude'];
    return [t('out_start'), ''];
  }
  function rule() {
    if (s.compared.length === NAMES.length && s.current) return t('rule_all');
    if (s.current === 'B') return t('rule_B', { a: V('A'), b: V('B') });
    if (s.current === 'C') return t(s.compared.includes('B') ? 'rule_C_ab' : 'rule_C', { a: V('A'), b: V('B'), c: V('C') });
    if (s.current === 'D') return t('rule_D', { c: V('C'), d: V('D') });
    if (s.walked) return t('rule_walk');
    if (s.clue >= 2) return t('rule_found');
    if (s.clue === 1) return t('rule_ring', { d: RING });
    return t('rule_start', { temp: TEMP });
  }

  let lastKind = null;
  function refresh() {
    if (s.scene === 'learn') {
      const [html, kind] = outcome();
      sheet.outcome(html);
      if (kind !== lastKind) outcomeEl.dataset.k = lastKind = kind;
      sheet.rule(rule());
    }
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: p.label, enabled: !s.busy && s.mode !== 'quiz' });
    }
    const n = t(stage.width < 560 ? 'note_big_short' : 'note_big');
    if (note.textContent !== n) note.textContent = n;
    stage.invalidate();
  }

  function snapshot() {
    const p = plan();
    const vec = (n) => {
      const v = VECTORS[n];
      return { tail: v.tail, length: v.length, angle: v.angle, direction: compass(v.angle) };
    };
    const vectors = { A: s.clue >= 2 ? vec('A') : null };
    for (const n of NAMES) vectors[n] = s.walked ? vec(n) : null;
    return {
      stage: s.clue + (s.walked ? 1 + s.compared.length : 0),
      clue: ['none', 'distance', 'direction'][s.clue], // what the friend has said
      found: s.clue >= 2,
      walked: s.walked,
      compared: [...s.compared],
      current: s.current ? { name: s.current, with: PAIRS[s.current], verdict: verdict(VECTORS[s.current], VECTORS[PAIRS[s.current]]) } : null,
      vectors, // map metres: x to পূর্ব, y to উত্তর; angle from পূর্ব towards উত্তর
      next: p.act === 'compare' ? { action: p.act, step: p.step, name: p.name } : { action: p.act, step: p.step },
      busy: s.busy,
      camera: camera.position.toArray().map((x) => +x.toFixed(2)), // scene metres (y up, -z north)
      target: controls.target.toArray().map((x) => +x.toFixed(2)),
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.stage, snap.compared, snap.current, snap.busy, snap.mode, snap.view]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_call',
    target: actionTarget,
    pad: 8,
    radius: 22,
    avoid: [ui.corner, note, () => anno.boxes(), () => kidBoxes(0.2)], // never over a child (the friend found!)
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── the steps ───────────────────────────────────────────────────────────────
  const animKeys = new Set();
  let animSeq = 0;
  /** A tween that redraws the learn scene each frame; resolves false if called off. */
  function anim(duration, onUpdate, fn = ease.inOutCubic) {
    const key = `sv${++animSeq}`;
    animKeys.add(key);
    return tweener
      .animate({
        key,
        duration,
        ease: fn,
        onUpdate: (k, p) => {
          onUpdate(k, p);
          applyLearn();
        },
      })
      .finished.then((done) => {
        animKeys.delete(key);
        return done;
      });
  }
  function cancelAnims() {
    for (const k of [...animKeys]) tweener.cancel(k);
    animKeys.clear();
  }
  function begin() {
    ++token;
    cancelAnims();
    s.busy = true;
    refresh();
    emitChange();
    return token;
  }
  function end(my) {
    if (my !== token) return false;
    s.busy = false;
    s.pending = null;
    snap();
    refresh();
    emitChange();
    return true;
  }
  /** The scene exactly as the state says. */
  function snap() {
    vis = visFor(s);
    applyLearn();
  }

  async function stepCall(animate) {
    const my = begin();
    s.clue = 1; // the friend answers at once: "30 m away"
    vis = visFor({ clue: 0 });
    refresh();
    audio.pop();
    emit('step', { step: 1, action: 'call' });
    if (animate) {
      vis.ring.line = 1;
      const look = anim(1.9, (_k, p) => (vis.you.look = Math.sin(p * Math.PI * 2) * 0.75), ease.linear);
      // the measuring line sweeps once round, drawing the ring of every place 30 m away
      if (!(await anim(1.4, (k) => ((vis.ring.drawn = k), (vis.ring.lineAngle = LINE_AT + 360 * k)), ease.inOutSine)) || my !== token) return;
      audio.pop();
      if (!(await anim(0.8, (k) => (vis.ring.marks = k), ease.linear)) || my !== token) return;
      await look;
    }
    end(my);
  }

  async function stepAsk(animate) {
    const my = begin();
    s.pending = 'heard'; // "30 m, to the north-east"
    vis = visFor({ clue: 1 });
    refresh();
    emit('step', { step: 2, action: 'ask' });
    if (animate) {
      if (!(await anim(0.45, (k) => ((vis.rose = k), (vis.ring.markOpacity = 1 - 0.7 * k), (vis.ring.lineOpacity = 1 - k))))) return;
      if (my !== token || !(await anim(0.9, (k) => (vis.a = k), ease.inOutSine)) || my !== token) return;
    }
    // exactly one place: the friend pops up there
    s.clue = 2;
    s.pending = null;
    refresh();
    emitChange();
    audio.success();
    if (animate) {
      if (!(await anim(0.5, (k) => ((vis.friend.pop = k), (vis.ring.opacity = 1 - 0.5 * k)), ease.linear)) || my !== token) return;
      const dist = Math.hypot(YOU_END[0] - START[0], YOU_END[1] - START[1]);
      vis.you.heading = headingTo(START, YOU_END);
      const walked = await anim(
        dist / WALK,
        (_k, p) => {
          vis.you.p = lerp2(START, YOU_END, p);
          vis.you.walk = p < 1 ? (p * dist) / STRIDE + 0.001 : 0;
          vis.you.look = 0;
        },
        ease.linear,
      );
      if (!walked || my !== token) return;
      const h0 = vis.you.heading;
      if (
        !(await anim(0.9, (_k, p) => {
          vis.you.walk = 0;
          vis.you.heading = h0 + (180 - h0) * Math.min(1, p * 2);
          vis.friend.wave = Math.min(1, p * 3);
          vis.friend.waveT = p * 0.9;
        })) ||
        my !== token
      )
        return;
    }
    end(my);
  }

  async function stepWalk(animate) {
    const my = begin();
    s.pending = 'walking';
    vis = visFor({ clue: 2 });
    refresh();
    emit('step', { step: 3, action: 'walk' });
    if (animate) {
      const fade = (k) => {
        vis.ring.opacity = 0.5 * (1 - k);
        vis.ring.markOpacity = 0.3 * (1 - k);
        vis.rose = 1 - k;
        vis.friend.wave = 1 - k;
        for (const n of NAMES) vis.w[n].show = k;
      };
      if (!(await anim(0.5, fade, ease.linear)) || my !== token) return;
      audio.pop();
      if (!(await anim(0.8, (k) => NAMES.forEach((n) => (vis.w[n].f = k)), ease.inOutSine)) || my !== token) return;
      const far = Math.max(...NAMES.map((n) => WALKERS[n].length));
      const walk = (_k, p) => {
        for (const n of NAMES) {
          const L = WALKERS[n].length;
          const d = Math.min(L, p * far);
          vis.w[n].p = along(WALKERS[n], d / L);
          vis.w[n].walk = d < L ? d / STRIDE + 0.001 : 0;
        }
      };
      if (!(await anim(far / WALK, walk, ease.linear)) || my !== token) return;
    }
    s.walked = true;
    end(my);
  }

  async function stepCompare(name, animate) {
    if (!s.walked) {
      s.walked = true;
      s.clue = 2;
    }
    const my = begin();
    s.pending = { moving: name };
    s.current = null;
    vis = visFor(s);
    vis.ghost = { name, k: 0, show: 0 };
    vis.arc = 0;
    applyLearn();
    refresh();
    if (animate) {
      if (!(await anim(0.3, (k) => (vis.ghost.show = k), ease.linear)) || my !== token) return;
      if (!(await anim(1.2, (k) => (vis.ghost.k = k))) || my !== token) return;
    }
    s.current = name;
    if (!s.compared.includes(name)) s.compared.push(name);
    s.pending = null;
    const v = verdict(VECTORS[name], VECTORS[PAIRS[name]]);
    emit('compare', { name, with: PAIRS[name], verdict: v });
    emit('step', { step: 3 + s.compared.length, action: 'compare', name });
    if (v === 'equal') audio.success();
    else audio.contact();
    refresh();
    if (animate && v === 'direction') {
      vis.ghost.k = 1;
      if (!(await anim(0.4, (k) => (vis.arc = k), ease.linear)) || my !== token) return;
    }
    end(my);
  }

  /** Back to the start: nothing said yet, you on the compass. */
  function goHome() {
    ++token;
    cancelAnims();
    Object.assign(s, { clue: 0, walked: false, compared: [], current: null, pending: null, busy: false });
    snap();
    refresh();
    emitChange();
  }

  /** Straight to a state: the number of steps done (0 … 6) in the story's order. */
  function jumpTo(stageN) {
    const n = Math.max(0, Math.min(6, Math.round(Number(stageN) || 0)));
    ++token;
    cancelAnims();
    s.clue = Math.min(2, n);
    s.walked = n >= 3;
    s.compared = NAMES.slice(0, Math.max(0, n - 3));
    s.current = s.compared.at(-1) ?? null;
    s.pending = null;
    s.busy = false;
    snap();
    refresh();
    emitChange();
  }

  /** The action: the big button, its badge, a tap on what it rings, Space/Enter/→. */
  function doAction({ animate = true } = {}) {
    if (s.locked) return lockedNudge();
    if (s.busy) return;
    if (animate && now() - lastAct < DOUBLE_TAP) return; // a double tap must not skip a step
    lastAct = now();
    hintOff();
    const p = plan();
    if (p.act === 'call') return stepCall(animate);
    if (p.act === 'ask') return stepAsk(animate);
    if (p.act === 'walk') return stepWalk(animate);
    if (p.act === 'compare') return stepCompare(p.name, animate);
    goHome();
    lastAct = now();
    return stepCall(animate);
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  /** 0 for a portrait stage … 1 for a wide one. */
  const wideness = () => Math.min(1, Math.max(0, (stage.width / Math.max(1, stage.height) - 0.9) / 0.9));
  function frontDir() {
    const e = rad(44 - 6 * wideness()); // a little steeper on a phone held upright, lower on wide frames
    return new THREE.Vector3(0, Math.sin(e), Math.cos(e));
  }
  function viewPose(view = s.view) {
    return fitPose({ box: FRAME, dir: view === '3d' ? VIEW_3D : frontDir(), camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  function flyTo({ position, target }, duration = 0.8) {
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
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
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    controls.enableZoom = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emitChange();
    emit('view', { view: s.view });
    return flyTo(viewPose(), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    refresh();
  });

  // ── touching the field ──────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const hits = (obj) => obj?.visible && raycaster.intersectObject(obj, false).length > 0;
  /** What a tap at a canvas point means in the learn scene: { act } or { compare: name } or null. */
  function pick(p) {
    if (s.scene !== 'learn') return null;
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    if (s.walked) for (const n of NAMES) if (hits(arrows[n].hit) || hits(kids[n].hit)) return { compare: n };
    const next = plan().act;
    if (next !== 'compare' && hits(you.hit)) return { act: true };
    return null;
  }
  // a real tap on what the step needs does it (the finger comes up within 8 px and 500 ms, like the kit's badge); a
  // drag that starts there still turns the camera in the rotated view
  /** @type {{ id: number, x: number, y: number, t: number, what: { act?: boolean, compare?: string } } | null} */
  let down = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const what = pick(canvasPoint(e));
      down = what ? { id: e.pointerId, x: e.clientX, y: e.clientY, t: now(), what } : null;
    },
    true,
  );
  window.addEventListener(
    'pointerup',
    (e) => {
      const d = down;
      down = null;
      if (!d || e.pointerId !== d.id || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8 || now() - d.t > 500) return;
      if (s.locked) return lockedNudge();
      if (s.busy) return;
      if (d.what.act) doAction();
      else if (now() - lastAct >= DOUBLE_TAP) {
        lastAct = now();
        stepCompare(d.what.compare, true);
      }
    },
    true,
  );
  window.addEventListener('pointercancel', () => (down = null), true);
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
      ui.canvasHost.style.cursor = pick(p) ? 'pointer' : '';
    });
  });

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
  const letters = [...t('letters')];

  /** The five kinds in an order where no scene gives away a later answer, the two flag questions apart. */
  function questionOrder() {
    const kinds = ['clue', 'find', 'why', 'equal', 'kind'];
    for (let i = 0; i < 200; i++) {
      shuffle(kinds);
      const at = (k) => kinds.indexOf(k);
      if (at('clue') < at('find') && at('why') < at('equal') && at('find') - at('clue') > 1) break;
    }
    return kinds;
  }

  /** Every test thing hidden, the learn scene cleared, the front view. */
  function clearTest() {
    ++token;
    cancelAnims();
    tweener.cancel('test');
    picture = false;
    for (const f of flags) f.root.visible = false;
    for (const c of chalk) c.clear();
    for (const a of testArrows) a.hide();
    ghost.hide();
    arc.hide();
    ring.root.visible = false;
    ring20.setDrawn(0);
    ring20.setMarks(0);
    ring20.setLine(0, 0);
    rose.highlight(null);
    rose.root.visible = true;
    for (const a of Object.values(arrows)) a.hide();
    for (const k of [you, friend, ...Object.values(kids)]) {
      k.root.visible = false;
      k.body.scale.setScalar(1);
    }
    for (const id of ['you', 'friend', 'line', 'A', 'verdict', ...NAMES]) setLabel(id, null);
    for (let i = 0; i < 6; i++) setLabel(`t${i}`, null);
    setLabel('tq', null);
    if (s.view !== 'front') setView('front', { animate: false });
    stage.invalidate();
  }
  function youAtStart() {
    you.root.visible = true;
    placeKid(you, { p: START, heading: 285, walk: 0, wave: 0, waveT: 0, look: 0 });
    setLabel('you', { text: t('l_you'), point: headTop(you), color: '#1d2733', spots: BY_HEAD });
  }
  const flagLabel = (i, k) =>
    setLabel(`t${i}`, {
      text: t('flag', { k }),
      point: () => flags[i].root.localToWorld(tmp.copy(flags[i].top)),
      color: COLORS.flag,
      spots: [
        { dx: 0, dy: -14 },
        { dx: 26, dy: -6 },
        { dx: -26, dy: -6 },
        { dx: 0, dy: 22 },
      ],
    });
  function placeFlag(i, angle, d = TEST_D) {
    const [x, y] = headOf({ tail: START, length: d, angle });
    flags[i].root.visible = true;
    flags[i].root.position.copy(P(x, y));
    return [x, y];
  }
  const testTween = (duration, onUpdate, fn = ease.inOutCubic) =>
    tweener.animate({
      key: 'test',
      duration,
      ease: fn,
      onUpdate: (k, p) => {
        onUpdate(k, p);
        stage.invalidate();
      },
    }).finished;

  let kinds = [];
  let question = null;
  let learnSaved = null;

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    action,
    lines: { text: 2, feedback: 3 },
    hooks: {
      enter() {
        learnSaved = { clue: s.clue, walked: s.walked, compared: [...s.compared], current: s.current };
        ++token;
        cancelAnims();
        s.busy = false;
        s.pending = null;
        Object.assign(s, { clue: 0, walked: false, compared: [], current: null });
        s.mode = 'quiz';
        s.scene = 'test';
        s.locked = true;
        hintOff();
        kinds = questionOrder();
        syncUI();
        refresh();
        emitChange();
      },
      leave() {
        clearTest();
        s.mode = 'explore';
        s.scene = 'learn';
        s.locked = false;
        hintOff();
        Object.assign(s, learnSaved || { clue: 0, walked: false, compared: [], current: null });
        s.busy = false;
        s.pending = null;
        snap();
        syncUI();
        refresh();
        emitChange();
      },
      async prepare(i, alive) {
        clearTest();
        if (i === 0) {
          kinds = questionOrder(); // a new order on "আবার পরীক্ষা দাও" too
          s.locked = true;
        }
        const kind = kinds[i % kinds.length];
        if (kind === 'clue') return prepClue();
        if (kind === 'find') return prepFind();
        if (kind === 'equal') return prepEqual();
        if (kind === 'why') return prepWhy();
        if (!alive()) return null;
        return prepKind();
      },
      reveal(_q, correct, picked) {
        return revealFor(question, correct, picked.index);
      },
      done() {
        s.locked = false;
      },
    },
  });

  const choiceList = (items, kind, meta = {}) => {
    const list = shuffle([...items]);
    question = { kind, list, ...meta };
    return {
      choices: [0, 1, 2, 3],
      expected: list.findIndex((x) => x.right),
      tolerance: 0.5,
      label: (j) => `<span class="sv-opt">${list[j].text}</span>`,
      meta: { kind, answer: items.find((x) => x.right).key },
    };
  };

  /** "I am 20 m away": three flags, all 20 m from you in three directions; which one? Any of them. */
  function prepClue() {
    youAtStart();
    const start = Math.floor(Math.random() * 8);
    const angles = [start, start + 3, start + 5].map((k) => (k % 8) * 45);
    const order = shuffle([0, 1, 2]);
    const spots = angles.map((a, j) => ({ a, k: letters[order[j]] })).sort((p, q) => p.k.localeCompare(q.k));
    spots.forEach(({ a, k }, j) => {
      placeFlag(j, a);
      chalk[j].set(headOf({ tail: START, length: 2.6, angle: a }), headOf({ tail: START, length: TEST_D - 2, angle: a }));
      flagLabel(j, k);
      const mid = P(...headOf({ tail: START, length: TEST_D * 0.55, angle: a }), 0.3);
      setLabel(`t${3 + j}`, { text: t('l_metres', { d: TEST_D }), point: () => mid, color: '#1d2733', kind: 'part', spots: BESIDE, optional: true });
    });
    const items = [
      { key: 'any', right: true, text: t('c_any') },
      ...spots.map(({ a, k }) => ({ key: `spot_${k}`, k, text: t('c_spot', { k, dir: dirName(a) }) })),
    ];
    return { text: t('q_clue', { d: TEST_D }), ...choiceList(items, 'clue') };
  }

  /** "20 m to the south-east": four flags 20 m away on the diagonals; the clue's direction picks one. */
  function prepFind() {
    youAtStart();
    const angle = pickOne([45, 135, 225, 315]);
    const opts = findOptions(angle);
    const ks = shuffle([...letters]);
    opts.forEach((op, j) => {
      placeFlag(j, op.angle);
      op.k = ks[j];
      flagLabel(j, op.k);
    });
    ring20.setDrawn(1);
    ring20.setOpacity(0.35);
    const sorted = [...opts].sort((p, q) => p.k.localeCompare(q.k));
    question = { kind: 'find', angle, opts, sorted };
    return {
      text: t('q_find', { d: TEST_D, dir: dirName(angle) }),
      choices: [0, 1, 2, 3],
      expected: sorted.findIndex((op) => op.kind === 'right'),
      tolerance: 0.5,
      label: (j) => `<span class="sv-opt">${t('flag', { k: sorted[j].k })}</span>`,
      meta: { kind: 'find', answer: compass(angle) },
    };
  }

  /** Five arrows on the field: which is the same vector as A? (turned, half as long and reversed are near misses) */
  function prepEqual() {
    rose.root.visible = false; // the arrows lie where the compass is; the question is about matching them
    const a = pickOne([45, 90, 0, 135]);
    const opts = shuffle(equalOptions({ length: TEST_L, angle: a }, pickOne([90, -90])));
    const cells = shuffle([0, 1, 2, 3, 4, 5]);
    const aCell = cells[0];
    const placed = opts.map((op, j) => ({ ...op, cell: cells[j + 1] })).sort((p, q) => p.cell - q.cell);
    const names = ['B', 'C', 'D', 'E'];
    const A = { tail: centredTail(CELLS[aCell], TEST_L, a), length: TEST_L, angle: a };
    testArrows[0].set(A);
    setLabel('t0', { text: V('A'), point: () => testArrows[0].middle(), color: COLORS.vector, spots: BESIDE });
    placed.forEach((op, j) => {
      op.name = names[j];
      op.v = { tail: centredTail(CELLS[op.cell], op.length, op.angle), length: op.length, angle: op.angle };
      testArrows[j + 1].set(op.v);
      setLabel(`t${j + 1}`, { text: V(op.name), point: () => testArrows[j + 1].middle(), color: COLORS.vector, spots: BESIDE });
    });
    question = { kind: 'equal', A, placed };
    return {
      text: t('q_equal', { a: 'A' }),
      choices: [0, 1, 2, 3],
      expected: placed.findIndex((op) => op.kind === 'equal'),
      tolerance: 0.5,
      label: (j) => `<span class="sv-opt sv-opt-vec">${V(placed[j].name)}</span>`,
      meta: { kind: 'equal', answer: placed.find((op) => op.kind === 'equal').name },
    };
  }

  /** Two arrows P and Q: why are they different vectors? (only the দিক, only the মান, or both differ) */
  function prepWhy() {
    rose.root.visible = false; // the arrows lie where the compass is; the question is about matching them
    const kind = pickOne(['direction', 'magnitude', 'both']);
    const a = pickOne([45, 0, 90, 135]);
    const p = { length: TEST_L, angle: a };
    const q = whyPartner(p, kind, pickOne([90, -90]));
    const [cp, cq] = pickOne([
      [0, 5],
      [3, 2],
      [0, 4],
      [3, 1],
    ]);
    const P1 = { ...p, tail: centredTail(CELLS[cp], p.length, p.angle) };
    const Q1 = { ...q, tail: centredTail(CELLS[cq], q.length, q.angle) };
    testArrows[0].set(P1);
    testArrows[1].set(Q1);
    setLabel('t0', { text: V('P'), point: () => testArrows[0].middle(), color: COLORS.vector, spots: BESIDE });
    setLabel('t1', { text: V('Q'), point: () => testArrows[1].middle(), color: COLORS.vector, spots: BESIDE });
    const items = ['direction', 'magnitude', 'both', 'place'].map((k) => ({ key: k, right: k === kind, text: t(`w_${k}`) }));
    return { text: t('q_why', { p: 'P', q: 'Q' }), ...choiceList(items, 'why', { P: P1, Q: Q1, answer: kind }) };
  }

  /** The found friend as the picture; which quantity needs only a মান (or which needs a দিক too)? */
  function prepKind() {
    picture = true;
    s.clue = 2; // the learn scene's step 2 as the picture (the learn state is kept apart and comes back)
    vis = visFor({ clue: 2, walked: false, current: null });
    applyLearn();
    setLabel('line', null);
    const scalarQ = Math.random() < 0.5;
    const scalars = Object.keys(QUANTITIES).filter((k) => QUANTITIES[k] === 'scalar');
    const vectors = Object.keys(QUANTITIES).filter((k) => QUANTITIES[k] === 'vector');
    const right = scalarQ ? pickOne(scalars) : pickOne(vectors);
    const wrong = scalarQ ? vectors : shuffle(scalars.filter((k) => k !== 'temp')).slice(0, 3);
    const items = [{ key: right, right: true, text: t(`qn_${right}`) }, ...wrong.map((k) => ({ key: k, text: t(`qn_${k}`) }))];
    return { text: t(scalarQ ? 'q_kind_s' : 'q_kind_v'), ...choiceList(items, 'kind', { scalarQ }) };
  }

  /** The worked answer (it leads with the answer and names the student's mistake); the scene shows it. */
  function revealFor(q, correct, pickedIndex) {
    const my = token;
    if (q.kind === 'clue') {
      ring20.setOpacity(1);
      testTween(0.9, (k) => (ring20.setDrawn(k), ring20.setMarks(Math.max(0, k * 1.4 - 0.4))), ease.linear);
      const pick = q.list[pickedIndex];
      return t('why_clue', { d: TEST_D }) + (correct ? '' : ` ${t('not_spot', { k: pick.k, d: TEST_D })}`);
    }
    if (q.kind === 'find') {
      const right = q.opts.find((op) => op.kind === 'right');
      rose.highlight(right.angle);
      testArrows[0].set({ tail: START, length: TEST_D, angle: right.angle }, 0);
      testTween(0.8, (k) => testArrows[0].set({ tail: START, length: TEST_D, angle: right.angle }, k), ease.inOutSine).then((done) => {
        if (!done || my !== token) return;
        const [x, y] = headOf({ tail: START, length: TEST_D, angle: right.angle });
        friend.root.visible = true;
        placeKid(friend, { p: [x + 3.2, y], heading: 270, walk: 0, look: 0, wave: 1, waveT: 0.5 });
        testTween(0.45, (k) => friend.body.scale.setScalar(popScale(k)), ease.linear);
      });
      const pick = q.sorted[pickedIndex];
      const note = correct ? '' : ` ${t(`not_${pick.kind}`, { dir: dirName(pick.angle) })}`;
      return t('why_find', { k: right.k, d: TEST_D, dir: dirName(right.angle) }) + note;
    }
    if (q.kind === 'equal') {
      const j = q.placed.findIndex((op) => op.kind === 'equal');
      const op = q.placed[j];
      testTween(1.2, (k) => {
        ghost.set({ ...op.v, tail: lerp2(op.v.tail, q.A.tail, k) }, 1, 1.2 + Math.sin(Math.PI * k) * 5);
        ghost.setOpacity(0.66);
      });
      const pick = q.placed[pickedIndex];
      return t('why_equal', { x: V(op.name), a: V('A') }) + (correct ? '' : ` ${t(`not_${pick.kind}`, { x: V(pick.name) })}`);
    }
    if (q.kind === 'why') {
      const { P: P1, Q: Q1 } = q;
      testTween(1.2, (k) => {
        ghost.set({ ...Q1, tail: lerp2(Q1.tail, P1.tail, k) }, 1, 1.2 + Math.sin(Math.PI * k) * 5);
        ghost.setOpacity(0.66);
      }).then((done) => {
        if (done && my === token && q.answer !== 'magnitude') arc.set(P1.tail, P1.angle, Q1.angle, 9, 1);
        stage.invalidate();
      });
      const vars = { l1: P1.length, l2: Q1.length, d1: dirName(P1.angle), d2: dirName(Q1.angle) };
      let note = '';
      if (!correct) {
        const pick = q.list[pickedIndex].key;
        if (pick === 'place') note = t('not_place');
        else {
          const sameMag = P1.length === Q1.length;
          const sameDir = P1.angle === Q1.angle;
          const claimsMagDiff = pick === 'magnitude' || pick === 'both';
          const claimsDirDiff = pick === 'direction' || pick === 'both';
          const notes = [];
          if (claimsMagDiff && sameMag) notes.push(t('not_same_mag'));
          if (!claimsMagDiff && !sameMag) notes.push(t('not_diff_mag'));
          if (claimsDirDiff && sameDir) notes.push(t('not_same_dir'));
          if (!claimsDirDiff && !sameDir) notes.push(t('not_diff_dir'));
          note = notes[0] ?? ''; // the first wrong claim (one note keeps the answer short)
        }
      }
      return t(`why_${q.answer}`, vars) + (note ? ` ${note}` : '');
    }
    // kind
    const right = q.list.find((x) => x.right);
    const pick = q.list[pickedIndex];
    const note = correct ? '' : ` ${t(QUANTITIES[pick.key] === 'vector' ? 'not_is_vector' : 'not_is_scalar', { q: pick.text })}`;
    return t(q.scalarQ ? 'why_kind_s' : 'why_kind_v', { q: right.text }) + note;
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
    const sceneKey = ['ArrowRight', 'ArrowLeft', 'r', 'R', 'Home'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (k === 'ArrowRight' || ((k === ' ' || k === 'Enter') && !onButton)) doAction();
    else if (k === 'ArrowLeft') jumpTo(Math.max(0, snapshot().stage - 1));
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  jumpTo(o.stage);
  setView(s.view, { animate: false });
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
     * Change any of: stage (0 … 6: the steps done, in the story's order), act (true: the next step, as the big
     * button), compare ('B' | 'C' | 'D': slide that arrow onto its partner's tail), home (true: back to the start),
     * view; animate: false jumps to the end of a step.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (s.mode === 'quiz' && (p.stage != null || p.act || p.compare || p.home)) quiz.stop();
      if (p.home) goHome();
      if (p.stage != null) jumpTo(p.stage);
      if (p.act) {
        if (s.busy) {
          jumpTo(snapshot().stage + (s.pending ? 1 : 0)); // finish the step that is running, then do the next
        }
        lastAct = Number.NEGATIVE_INFINITY;
        await doAction({ animate });
      }
      if (p.compare && NAMES.includes(p.compare)) {
        ++token;
        cancelAnims();
        s.busy = false;
        await stepCompare(p.compare, animate);
      }
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      goHome();
      await setView('front', { animate: false });
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The field round the start (80 m square), the chalk compass, the arrows and the children as they are, in metres. */
    exportRoot() {
      const copy = new THREE.Group();
      copy.name = 'ScalarVector';
      const patch = new THREE.Mesh(new THREE.PlaneGeometry(84, 84).rotateX(-Math.PI / 2), field.ground.material.clone());
      patch.material.map = field.ground.material.map.clone();
      patch.material.map.repeat.set(84 / 16, 84 / 16);
      patch.material.map.needsUpdate = true;
      patch.name = 'Grass';
      copy.add(patch, rose.root.clone(true));
      for (const a of Object.values(arrows)) if (a.visible) copy.add(a.root.clone(true));
      for (const k of [you, friend, ...Object.values(kids)]) if (k.root.visible) copy.add(k.root.clone(true));
      return copy;
    },
  };
}
