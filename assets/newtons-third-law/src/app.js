// Newton's third law (book pages 84–86, topic 3.8), student view. Two skaters on a smooth floor face each other, hands
// together. One tap and they push each other with the same steady force for a moment (10 N): a pair of equal, opposite
// arrows, each drawn on the body it acts on and named ("A-এর ওপর বল", "B-এর ওপর বল"), so the two never cancel; both
// move off, and with unequal masses the lighter one accelerates more (a = F/m). The second picture is the book's
// চিত্র ৩.১২: an apple let go above the Earth. The pair of arrows is the same size (9.8 N) on the apple and on the
// Earth, but the Earth's acceleration a = (m/M)g is 1.64 × 10⁻²⁴ ms⁻²: it cannot be drawn.
// The panel is the kit's clean sheet (one action, one result, one rule): the pairs as one row of words, one big
// numbered action whose same numbered badge rings the hands (or the apple), one result line, and one rule that grows
// up to the book's boxed law, word for word. Then a short test. Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createArrow } from '@shared/arrow.js';
import { createDashedArrow } from './arrow.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createI18n } from './i18n.js';
import { createRink } from './rink.js';
import { createSkater } from './skater.js';
import { APPLE_R, createEarthScene } from './earth.js';
import { fitPose } from './camera.js';
import { APPLE_FALL, APPLE_MASS, EARTH_MASS, G, PAIRS, PUSH_FORCE, appleAt, earthAcceleration, pushAt, pushStats, sci } from './physics.js';

export const DEFAULTS = {
  example: 'equal', // 'equal' | 'unequal' | 'apple'
  at: '', // s after the push or the release: start already moving (for pictures)
  tried: '', // pairs already tried, e.g. 'equal,unequal' (their words show what they showed)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring pulses (false: it stays still)
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const IDS = ['equal', 'unequal', 'apple'];
const NBSP = '\u00a0';
const MS2 = 'ms<sup>−2</sup>';
// the two forces of a pair are the same kind of force: the same colour (a push or pull orange, gravity violet), told apart by
// position, name and a solid or dashed arrow (never by colour alone)
const COLORS = { force: '#e8590c', gravity: '#7048e8', accel: '#0c8599' };
const ARROW_PER_N = 0.06; // m of arrow per newton: 10 N is 0.6 m, in both pictures
const SLOW = 2; // the apple's fall is shown this many times slower
const LEAD = 450; // ms the skaters (or the apple) stand ready after a tap before the push
const DONE_AFTER = 1.6; // s after the push ends: the result is in (the button offers the next pair)
const GONE_AFTER = 4.6; // s after the push ends: they have left the picture, and stand ready again
const REACH0 = 0.3; // m from each shoulder to the hands' meeting point at the start (arms bent)
const LEAN = 0.12; // rad: leaning into the push
const HANDS_Y = 1.22; // m: the hands' height
const HANDS_Z = 0.17; // m: the hands are this far to the side of the middle line
const ARROW_Z = 0.3; // m: the force arrows are drawn in front of the bodies, at the hands' height
const ARROW_GAP = 0.08; // m: the two arrows are this far above and below the hands' height
const SKATER_LOOK = {
  A: { jacket: '#9db6d4', trousers: '#2f3d55', hair: '#1d1d20' },
  B: { jacket: '#b7d3a0', trousers: '#3a3f47', hair: '#5a3d23' },
};
const DOUBLE_TAP = 450; // ms: a second request this soon after one is ignored
const FRONT_DIR = new THREE.Vector3(0, 0.2, 1).normalize();
const VIEW_3D = new THREE.Vector3(-0.55, 0.38, 1).normalize();
const SKATER_BOX = new THREE.Box3(new THREE.Vector3(-1.5, -0.05, -0.55), new THREE.Vector3(1.5, 1.85, 0.55));
const APPLE_BOX = new THREE.Box3(new THREE.Vector3(-1.45, -0.7, -0.3), new THREE.Vector3(1.45, 1.95, 0.3));
const MARGIN = { top: 34, bottom: 8, side: 8 };

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const plain = (x) => String(+x.toFixed(3));
  const sciHtml = (x) => {
    const { mantissa, exponent } = sci(x);
    return `${N(mantissa)} × ${N(10)}<sup>${exponent < 0 ? '−' : ''}${N(Math.abs(exponent))}</sup>`;
  };

  root.classList.add('pvc', 'nt');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: cleanSheet(t, {
      examples: { label: 'pairs', results: true, items: IDS.map((id) => ({ id, label: `chip_${id}` })) },
      quiet: [],
      lines: { action: 2, outcome: 2, rule: 3 },
    }),
  });
  const sheet = bindCleanSheet(ui.learn);
  const badge = document.createElement('div');
  badge.className = 'nt-badge';
  ui.stage.append(badge);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 24, near: 0.05, far: 120, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 1.5;
  controls.maxDistance = 30;
  controls.enablePan = false;
  controls.enableRotate = false;
  const world = new THREE.Group();
  world.name = 'NewtonsThirdLaw';
  scene.add(world);

  // the two pictures: the skaters on their floor, and the apple above the Earth (only one shows at a time)
  const skatersGroup = new THREE.Group();
  skatersGroup.name = 'Skaters';
  const rink = createRink();
  const A = createSkater({ ...SKATER_LOOK.A, name: 'SkaterA' });
  const B = createSkater({ ...SKATER_LOOK.B, name: 'SkaterB' });
  skatersGroup.add(rink.root, A.root, B.root);
  B.root.rotation.y = Math.PI;
  const earthScene = createEarthScene({ renderer: stage.renderer, fall: APPLE_FALL });
  world.add(skatersGroup, earthScene.root);

  // invisible hit boxes: a finger on a skater or on the apple does what the big button does
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitA = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.9, 0.7), hitMat);
  const hitB = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2, 0.8), hitMat);
  for (const [h, sk] of [
    [hitA, A],
    [hitB, B],
  ]) {
    h.position.y = 0.95;
    h.userData.noExport = true;
    sk.root.add(h);
  }

  const mkArrow = (color, name, dashed = false) => {
    const a = dashed ? createDashedArrow({ color, name }) : createArrow({ color, radius: 0.016, head: 0.1, headRadius: 0.05, name });
    a.root.userData.noExport = true;
    a.material.depthTest = false; // a diagram arrow: always seen in full, even where it reaches into the ground
    a.root.traverse((m) => {
      m.renderOrder = 8;
    });
    world.add(a.root);
    return a;
  };
  const arrows = {
    a: mkArrow(COLORS.force, 'ForceOnA', true), // B's push on A: dashed
    b: mkArrow(COLORS.force, 'ForceOnB'), // A's push on B: solid
    apple: mkArrow(COLORS.gravity, 'ForceOnApple'), // the Earth's pull on the apple: solid
    earth: mkArrow(COLORS.gravity, 'ForceOnEarth', true), // the apple's pull on the Earth: dashed
  };

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  let sun = null;
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    sun = new THREE.DirectionalLight(0xffffff, 0.45);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -2.6, right: 2.6, top: 2.6, bottom: -2.6, near: 1, far: 10 });
    sun.shadow.radius = 5;
    sun.shadow.bias = -0.0004;
    sun.position.set(1.2, 4.5, 3);
    sun.target.position.set(0, 0, 0);
    scene.add(sun, sun.target);
    for (const sk of [A, B])
      sk.root.traverse((m) => {
        if (m instanceof THREE.Mesh && !m.userData.noExport) m.castShadow = true;
      });
    earthScene.root.traverse((m) => {
      if (m instanceof THREE.Mesh && m.material?.visible !== false) {
        m.castShadow = m !== earthScene.earth;
        m.receiveShadow = m === earthScene.earth;
      }
    });
  }

  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }
  const now = () => performance.now();

  // ── the state ───────────────────────────────────────────────────────────────
  const s = {
    example: IDS.includes(o.example) ? o.example : 'equal',
    scene: 'skaters', // 'skaters' | 'apple'
    pair: { ...PAIRS.equal }, // masses on the floor (a test question may use others)
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    tried: { equal: false, unequal: false, apple: false },
    show: { first: true, second: true }, // which of the two arrows of the picture may show (the test hides some)
    names: true, // the names of the bodies (A · 50 kg …)
    userMovedCamera: false,
  };
  // the clock of the picture: running from t0 (ms; in the future while they stand ready), or still at `frozen` seconds
  const sim = { t0: null, frozen: null, done: false };
  let lastTap = Number.NEGATIVE_INFINITY;

  /** Seconds of the picture's own clock (apparent time: the apple's is slowed by SLOW). */
  function simTime() {
    if (sim.t0 != null) return Math.max(0, (now() - sim.t0) / 1000);
    return sim.frozen ?? 0;
  }
  const started = () => sim.t0 != null && now() >= sim.t0;
  const skaters = () => s.scene === 'skaters';
  const skaterState = () => ({ time: simTime(), ...pushAt(s.pair.mA, s.pair.mB, simTime()) });
  const appleState = () => {
    const time = simTime();
    return { time, ...appleAt(time / SLOW) };
  };
  /** The run's end for the skaters: when the push ends, and the other moments after it (apparent s). */
  const pushEnd = () => pushStats(s.pair.mA, s.pair.mB).T;
  const busy = () => {
    // a run is in progress and the student should not start another yet
    if (sim.t0 == null || sim.done) return false;
    return true;
  };

  // ── placing things ──────────────────────────────────────────────────────────
  const V3 = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const handsBox = new THREE.Box3();
  const handTargets = { A: [V3(0, 0, 0), V3(0, 0, 0)], B: [V3(0, 0, 0), V3(0, 0, 0)] };
  const handsWorld = V3(0, HANDS_Y, 0); // the middle of the hands now
  const dim = (m) => ({ h: 0.88 + 0.0019 * m, z: 0.75 + 0.0065 * m });
  /** Dress the two skaters for these masses: heavier means a little taller and a good deal broader. */
  function dress() {
    for (const [sk, m] of [
      [A, s.pair.mA],
      [B, s.pair.mB],
    ]) {
      const d = dim(m);
      sk.root.scale.set(d.h * (1 + d.z) * 0.5, d.h, d.z);
    }
  }
  const BODY_SHIFT = REACH0 + Math.sin(LEAN) * (1.33 - 0.86);
  /** The skaters at a moment: positions, arms, arrows. */
  function placeSkaters(st) {
    const xa = -(BODY_SHIFT + st.dA);
    const xb = BODY_SHIFT + st.dB;
    A.root.position.set(xa, 0, 0);
    B.root.position.set(xb, 0, 0);
    A.root.rotation.y = 0;
    B.root.rotation.y = Math.PI;
    const pushing = st.phase === 'push' || st.phase === 'rest';
    const T = pushEnd();
    const relax = st.phase === 'glide' ? Math.min(1, (st.time - T) / 0.5) : 0;
    const lean = LEAN * (1 - 0.75 * relax);
    // the hands meet midway between the two shoulders, at the hands' height
    const xc = (st.dB - st.dA) / 2;
    handsWorld.set(xc, HANDS_Y, 0);
    for (const [sk, key, flip] of [
      [A, 'A', 1],
      [B, 'B', -1],
    ]) {
      const hands = handTargets[key];
      // the right hand is on the skater's right: +z for A (facing +x), −z for B (facing −x)
      for (const [i, side] of [
        [0, 1],
        [1, -1],
      ]) {
        tmpA.set(xc, HANDS_Y, side * flip * HANDS_Z);
        sk.toLocal(tmpA, hands[i]);
      }
      sk.pose({ lean, hands, relax: pushing ? 0 : relax });
    }
    // the force arrows: each starts at the hands' meeting point and points away from the other skater
    const F = PUSH_FORCE * ARROW_PER_N;
    const on = st.force;
    // (a little apart in height, so they read as two arrows, one on each body, not as one double arrow)
    if (on && s.show.first) arrows.a.set(tmpA.set(xc, HANDS_Y - ARROW_GAP, ARROW_Z), V3(-1, 0, 0), F);
    else arrows.a.hide();
    if (on && s.show.second) arrows.b.set(tmpB.set(xc, HANDS_Y + ARROW_GAP, ARROW_Z), V3(1, 0, 0), F);
    else arrows.b.hide();
    arrows.apple.hide();
    arrows.earth.hide();
  }

  const APPLE_ARROW_X = 0.36;
  /** The apple at a moment: the hand opens, the apple falls, the arrows (only while it falls). */
  function placeApple(st) {
    earthScene.setFall(st.fallen);
    earthScene.setGrip(st.time);
    const y = earthScene.startY - st.fallen;
    const L = G * APPLE_MASS * ARROW_PER_N;
    const released = st.time > 0 && !st.landed;
    if (released && s.show.first) arrows.apple.set(tmpA.set(0, y - APPLE_R * 0.9, 0.12), V3(0, -1, 0), L);
    else arrows.apple.hide();
    if (released && s.show.second) arrows.earth.set(tmpB.set(APPLE_ARROW_X, 0, 0.12), V3(0, 1, 0), L);
    else arrows.earth.hide();
    arrows.a.hide();
    arrows.b.hide();
  }

  function place() {
    if (skaters()) placeSkaters(skaterState());
    else placeApple(appleState());
  }

  // ── the camera ──────────────────────────────────────────────────────────────
  const fit = (box, dir) => fitPose({ box, dir, camera, width: stage.width, height: stage.height, margin: MARGIN });
  function viewPose() {
    const box = skaters() ? SKATER_BOX : APPLE_BOX;
    return fit(box, s.view === '3d' ? VIEW_3D : FRONT_DIR);
  }
  function flyTo({ position, target }, duration = 0.8, key = 'camera') {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel(key);
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key,
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
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    refresh();
  });

  // ── labels in the picture (the kit's annotations: each takes the first clear spot) ──
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint, badge, () => action?.ringBox(), () => action?.box()] });
  const labelText = new Map();
  /** Add a label, or change its words in place; `null` takes it away. */
  function label(id, opts) {
    if (!opts) {
      if (anno.has(id)) anno.remove(id);
      labelText.delete(id);
      return;
    }
    if (!anno.has(id)) {
      anno.add(id, opts);
      labelText.set(id, opts.text);
    } else if (labelText.get(id) !== opts.text) {
      anno.update(id, { text: opts.text });
      labelText.set(id, opts.text);
    }
  }
  const pv = new THREE.Vector3();
  const toScreen = (p) => {
    pv.copy(p).project(camera);
    return { x: (pv.x * 0.5 + 0.5) * stage.width, y: (-pv.y * 0.5 + 0.5) * stage.height };
  };
  // a skater's force label hangs at its outer side, at the height of the arrow
  const LEFT = [
    { dx: -9, dy: 0 },
    { dx: -9, dy: -42 },
    { dx: -9, dy: 42 },
  ];
  const RIGHT = LEFT.map((p) => ({ ...p, dx: -p.dx }));
  const NAME_LEFT = [
    { dx: -9, dy: 0 },
    { dx: -9, dy: 26 },
    { dx: -9, dy: -26 },
  ];
  const NAME_RIGHT = NAME_LEFT.map((p) => ({ ...p, dx: -p.dx }));
  // the apple's force label hangs at the apple's left, above the arrow's tail (never down on the Earth, where its name is)
  const LEFT_HIGH = [
    { dx: -12, dy: -22 },
    { dx: -12, dy: -62 },
    { dx: -12, dy: 8 },
  ];
  // the apple's name: beside it (farther out if the ring round it is big), else above it
  const APPLE_NAME = [52, 92, 140]
    .flatMap((d) => [
      { dx: d, dy: -4 },
      { dx: -d, dy: -4 },
    ])
    .concat([
      { dx: 52, dy: 30 },
      { dx: -52, dy: 30 },
      { dx: 0, dy: -50 },
    ]);
  // the Earth's acceleration after the landing: below and to the side of the apple, clear of the ring round it
  const ACC_SPOTS = [52, 92, 140].flatMap((d) => [
    { dx: -d, dy: 34 },
    { dx: d, dy: 34 },
  ]);
  const EARTH_NAME = [
    { dx: 0, dy: 0 },
    { dx: -6, dy: 0 },
    { dx: 0, dy: 30 },
    { dx: -6, dy: 30 },
  ];
  const BACK = 0.26; // m: from a skater's middle to its back, where its force label hangs
  const tagA = V3(0, 0, 0);
  const tagB = V3(0, 0, 0);
  const midA = V3(0, 0, 0);
  const midB = V3(0, 0, 0);
  const applePoint = V3(0, 0, 0);
  const applePull = V3(0, 0, 0);
  const earthPull = V3(APPLE_ARROW_X, 0.3, 0.12);
  const earthTag = V3(-1.0, -0.5, 0.2);
  // the name F (the book's) comes only at the last step, once all three pairs have been seen
  const forceText = (on, f, { dashed = false, neg = false } = {}) =>
    `<span class="nt-key${dashed ? ' dash' : ''}"></span>${t(on)}<br>${t(allTried() ? (neg ? 'l_F_neg' : 'l_F_sym') : 'l_F', { f })}`;
  /** Which labels show, and where: names of the bodies (always), the forces (while they act). */
  function syncLabels() {
    if (skaters()) {
      for (const id of ['apple', 'earth', 'earthAcc', 'pullApple', 'pullEarth']) label(id, null);
      const st = skaterState();
      // the names (with the masses) hang at the outer side of each skater, at knee height; a name goes when its skater has left the picture
      const tag = (id, sk, side, text, out) => {
        const p = out.set(sk.root.position.x + side * BACK, 0.55, 0);
        const x = toScreen(p).x;
        const inView = x > 4 && x < stage.width - 4;
        label(
          id,
          s.names && inView
            ? {
                text,
                kind: 'part',
                color: '#334155',
                point: () => out.set(sk.root.position.x + side * BACK, 0.55, 0),
                spots: side < 0 ? NAME_LEFT : NAME_RIGHT,
              }
            : null,
        );
      };
      tag('A', A, -1, t('l_A', { m: s.pair.mA }), tagA);
      tag('B', B, 1, t('l_B', { m: s.pair.mB }), tagB);
      const f = plain(PUSH_FORCE);
      label(
        'onA',
        st.force && s.show.first
          ? {
              text: forceText('l_on_A', f, { dashed: true, neg: true }),
              kind: 'callout',
              color: COLORS.force,
              point: () => midA.set(A.root.position.x - BACK, HANDS_Y - ARROW_GAP, ARROW_Z),
              spots: LEFT,
            }
          : null,
      );
      label(
        'onB',
        st.force && s.show.second
          ? {
              text: forceText('l_on_B', f),
              kind: 'callout',
              color: COLORS.force,
              point: () => midB.set(B.root.position.x + BACK, HANDS_Y + ARROW_GAP, ARROW_Z),
              spots: RIGHT,
            }
          : null,
      );
    } else {
      for (const id of ['A', 'B', 'onA', 'onB']) label(id, null);
      const st = appleState();
      const released = st.time > 0 && !st.landed;
      // the forces are what the picture is about: they are placed first, the names take what room is left
      if (released !== namesAfterForces) {
        namesAfterForces = released;
        for (const id of ['apple', 'earth', 'earthAcc']) label(id, null);
      }
      const f = plain(+(G * APPLE_MASS).toFixed(1));
      label(
        'pullApple',
        released && s.show.first
          ? {
              text: forceText('l_on_apple', f),
              kind: 'callout',
              color: COLORS.gravity,
              point: () => applePull.set(0, earthScene.startY - st.fallen - APPLE_R * 0.9, 0.12),
              spots: LEFT_HIGH,
              optional: true,
            }
          : null,
      );
      label(
        'pullEarth',
        released && s.show.second
          ? {
              text: forceText('l_on_earth', f, { dashed: true }),
              kind: 'callout',
              color: COLORS.gravity,
              point: () => earthPull,
              spots: RIGHT,
              optional: true,
            }
          : null,
      );
      label(
        'apple',
        s.names
          ? {
              text: t('l_apple', { m: APPLE_MASS }),
              kind: 'part',
              color: '#334155',
              point: () => earthScene.appleAt(applePoint),
              spots: APPLE_NAME,
              optional: true,
            }
          : null,
      );
      // the Earth: "very heavy" while the apple falls; once it has landed, its (tiny) acceleration, for the one who wants the number
      label(
        'earth',
        s.names && !(st.landed && s.mode === 'explore')
          ? { text: `${t('l_earth_name')}<br>${t('l_earth_big')}`, kind: 'part', color: '#334155', point: () => earthTag, spots: EARTH_NAME }
          : null,
      );
      label(
        'earthAcc',
        s.names && st.landed && s.mode === 'explore'
          ? {
              text: `${t('l_earth_acc')}<br>${sciHtml(earthAcceleration(APPLE_MASS, EARTH_MASS))}${NBSP}${MS2}`,
              kind: 'part',
              color: '#334155',
              point: () => earthScene.appleAt(applePoint),
              spots: ACC_SPOTS,
            }
          : null,
      );
    }
  }
  let namesAfterForces = false;

  // ── the panel: one action, one result, one rule ─────────────────────────────
  const outcomeEl = ui.$('.pvc-outcome');
  const allTried = () => IDS.every((id) => s.tried[id]);

  /**
   * What the big button (and a tap on the picture) does now: run this pair; or, once it is over, run the next pair
   * not tried yet, in the row's order (that word is marked); "again" when all have been tried. The badge's number is
   * the student's own step: the pairs tried so far + 1; "again" has none.
   */
  function plan() {
    const ex = s.example;
    const step = IDS.filter((id) => s.tried[id]).length + 1;
    const fresh = !s.tried[ex] && sim.t0 == null;
    if (fresh) return { example: ex, label: `act_${ex}`, step };
    const over = sim.t0 == null || sim.done;
    const next = over ? IDS.find((id) => !s.tried[id] && id !== ex) : null;
    if (next) return { example: next, label: `act_on_${next}`, step };
    return { example: ex, label: ex === 'apple' ? 'act_again_apple' : 'act_again', step: '' };
  }

  function outcomeKey() {
    if (s.example === 'apple') {
      const st = appleState();
      if (st.time > 0 && !st.landed)
        return [allTried() ? 'out_apple_fall_f' : 'out_apple_fall', { f: plain(+(G * APPLE_MASS).toFixed(1)) }, 'gravity'];
      if (st.landed || s.tried.apple) return ['out_apple_after', {}, 'rest'];
      return ['out_apple_rest', {}, 'rest'];
    }
    const st = skaterState();
    if (st.phase === 'push') return [allTried() ? 'out_push_f' : 'out_push', { f: plain(PUSH_FORCE) }, 'force'];
    if (st.phase === 'glide' || s.tried[s.example]) {
      if (s.pair.mA === s.pair.mB) return ['out_same', {}, 'rest'];
      return ['out_more', { k: plain(+(Math.max(s.pair.mA, s.pair.mB) / Math.min(s.pair.mA, s.pair.mB)).toFixed(1)) }, 'accel'];
    }
    return ['out_rest', {}, 'rest'];
  }

  function ruleKey() {
    if (allTried()) return 'rule_law';
    if (s.tried[s.example] || started()) return `rule_${s.example}`;
    return s.example === 'apple' ? 'rule_start_apple' : 'rule_start_skaters';
  }

  let lastKind = '';
  let lastPlan = '';
  function refresh() {
    sheet.choose(s.example);
    for (const id of IDS) sheet.result(id, s.tried[id] ? t(`res_${id}`) : '');
    const [key, vars, kind] = outcomeKey();
    sheet.outcome(t(key, vars));
    if (kind !== lastKind) outcomeEl.dataset.k = lastKind = kind;
    sheet.rule(t(ruleKey()));
    if (action) {
      const p = plan();
      const sig = `${p.example}|${p.label}|${p.step}`;
      if (sig !== lastPlan) {
        action.set({ step: p.step, label: p.label });
        lastPlan = sig;
      }
      sheet.next(p.example !== s.example ? p.example : null); // the word the action will choose next
      // the ring shows on the hands (or the apple) while they wait, never while they move
      if (s.mode === 'explore' && sim.t0 == null) action.show('run');
      else action.hide('run');
    }
    const note = skaters() ? t('badge_skaters') : t('badge_apple', { k: SLOW });
    if (badge.innerHTML !== note) badge.innerHTML = note;
    syncLabels();
    stage.invalidate();
    // the ring (and the number badge) settle on the next frame: the labels then make room for them
    if (!annoPending) {
      annoPending = true;
      requestAnimationFrame(() => {
        annoPending = false;
        anno.update();
      });
    }
  }
  let annoPending = false;

  function snapshot() {
    const p = plan();
    const sk = skaters();
    const st = sk ? skaterState() : appleState();
    const base = {
      example: s.example,
      scene: s.scene,
      phase: sk ? st.phase : st.time <= 0 ? 'rest' : st.landed ? 'landed' : 'fall',
      time: +st.time.toFixed(2), // s of the picture's own clock (the apple's is shown SLOW times slower)
      mode: s.mode,
      view: s.view,
      tried: { ...s.tried },
      next: { example: p.example, step: p.step },
    };
    if (sk) {
      const xa = A.root.position.x;
      const xb = B.root.position.x;
      return {
        ...base,
        masses: { A: s.pair.mA, B: s.pair.mB },
        force: st.force ? PUSH_FORCE : 0, // N on each skater while the hands touch
        arrows: { onA: arrows.a.root.visible, onB: arrows.b.root.visible },
        acceleration: { A: round(st.aA, 3), B: round(st.aB, 3) }, // ms⁻²
        speed: { A: round(st.vA, 3), B: round(st.vB, 3) }, // m/s, each away from the other
        position: { A: round(xa, 3), B: round(xb, 3) }, // m
        moved: { A: round(st.dA, 3), B: round(st.dB, 3) }, // m from where each stood
      };
    }
    return {
      ...base,
      mass: APPLE_MASS,
      force: st.time > 0 && !st.landed ? round(G * APPLE_MASS, 2) : 0, // N on the apple and on the Earth while it falls
      arrows: { onApple: arrows.apple.root.visible, onEarth: arrows.earth.root.visible },
      fallen: round(st.fallen, 3), // m
      speed: round(st.v, 3), // m/s
      acceleration: { apple: G, earth: earthAcceleration(APPLE_MASS, EARTH_MASS) }, // ms⁻²
    };
  }
  const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.example, snap.phase, snap.tried, snap.mode, snap.view]);
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── the run ─────────────────────────────────────────────────────────────────
  /** Back to the start: the skaters face to face (or the apple in the hand), nothing moving. */
  function standStill({ frozen = null } = {}) {
    sim.t0 = null;
    sim.frozen = frozen;
    sim.done = false;
    place();
    refresh();
  }

  /** Show another pair: the skaters dressed for it (or the apple), the camera there, everything standing still. */
  function setExample(id, { quiet = false } = {}) {
    if (!IDS.includes(id)) return;
    const changed = id !== s.example;
    s.example = id;
    const was = s.scene;
    s.scene = id === 'apple' ? 'apple' : 'skaters';
    if (s.scene === 'skaters') s.pair = { ...PAIRS[id] };
    skatersGroup.visible = s.scene === 'skaters';
    earthScene.root.visible = s.scene === 'apple';
    s.show = { first: true, second: true };
    s.names = true;
    dress();
    sim.t0 = null;
    sim.frozen = null;
    sim.done = false;
    if (was !== s.scene) {
      s.userMovedCamera = false;
      flyTo(viewPose(), 0);
    }
    place();
    refresh();
    if (changed && !quiet) emit('example', { example: id });
  }

  /** The push (or the release): from `at` s of the picture's clock, or after a short moment of standing ready. */
  function startRun({ quiet = false, at = null } = {}) {
    sim.done = false;
    sim.frozen = null;
    sim.t0 = at == null ? now() + LEAD : now() - at * 1000;
    lastTap = now();
    place();
    refresh();
    if (!quiet) emit(skaters() ? 'push' : 'release', { example: s.example });
    stage.invalidate();
  }

  /** Carry on from a still moment (the test's answer): the picture's clock runs on from where it stood. */
  function resume() {
    const at = sim.frozen ?? 0;
    sim.frozen = null;
    sim.t0 = now() - at * 1000;
    sim.done = false;
  }

  /** What happens as the clock runs: the result is in, they have gone, the apple has landed. Returns true while moving. */
  function advance() {
    if (sim.t0 == null) return false;
    if (!started()) return true; // standing ready
    if (skaters()) {
      const st = skaterState();
      const T = st.T;
      if (!sim.done && st.time >= T + DONE_AFTER) {
        sim.done = true;
        if (s.mode === 'explore') {
          s.tried[s.example] = true;
          emit('done', { example: s.example });
        }
        refresh();
        emitChange();
      }
      if (st.time >= T + GONE_AFTER) {
        standStill(); // they have left the picture: the pair stands ready again (in the test, without the arrows)
        return false;
      }
      return true;
    }
    const st = appleState();
    if (st.landed && !sim.done) {
      sim.done = true;
      if (s.mode === 'explore') {
        s.tried.apple = true;
        emit('done', { example: 'apple' });
      }
      audio.contact?.();
      refresh();
      emitChange();
    }
    if (st.landed && st.time > st.tLand * SLOW + 0.3) {
      // it lies on the Earth: nothing moves any more
      sim.frozen = st.time;
      sim.t0 = null;
      refresh();
      emitChange();
      return false;
    }
    return true;
  }

  let lastKey = '';
  stage.addTicker(() => {
    const moving = advance();
    if (moving) place();
    const st = skaters() ? skaterState() : appleState();
    const key = `${s.example}|${st.phase ?? (st.landed ? 'landed' : st.time > 0 ? 'fall' : 'rest')}|${sim.done}|${started()}|${sim.t0 != null}`;
    if (key !== lastKey) {
      lastKey = key;
      refresh();
      emitChange();
    }
    // labels follow the moving bodies without being written again (their points are live)
    if (moving) {
      if (skaters()) syncLabels(); // a name goes when its skater has left the picture
      anno.update();
    }
    return moving;
  });

  /** The action: the big button, its badge on the view, a tap on a skater or the apple, Space/Enter/→. */
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastTap < DOUBLE_TAP) return;
    if (busy()) {
      showHint(t('hint_wait'), { duration: 2200 });
      return;
    }
    const p = plan();
    if (p.example !== s.example) setExample(p.example);
    startRun();
  }

  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_equal',
    target: () => {
      if (!skaters()) return earthScene.appleBody;
      return handsBox.set(tmpA.set(handsWorld.x - 0.22, HANDS_Y - 0.2, -0.22), tmpB.set(handsWorld.x + 0.22, HANDS_Y + 0.2, 0.22));
    },
    pad: 10,
    avoid: [ui.corner, ui.hint, badge, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // ── touching the picture: a skater or the apple does what the big button does ──
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = skaters() ? [hitA, hitB] : [earthScene.hit];
    return raycaster.intersectObjects(hits, false).length > 0;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (!pick(canvasPoint(e))) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      doAction(); // it acts as the finger goes down: the same as the big button
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

  // ── view and hint ───────────────────────────────────────────────────────────
  function setView(view, { animate = true, duration = 0.8 } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    refresh();
    emitChange();
    return flyTo(viewPose(), animate ? duration : 0);
  }
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
  /** Four tap choices from string keys (the right one first): shuffled, with the index of the right one. */
  function textChoices(items, kind, extra = {}) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="nt-opt">${list[j].text}</span>`,
      meta: { kind, answer: items[0].key, ...extra },
    };
  }
  const item = (key, vars) => ({ key, text: t(key, vars) });
  /** The five kinds in a random order, the size question before the cancelling one (a scene must not give a later answer away). */
  function questionOrder() {
    const kinds = ['react', 'cancel', 'who', 'size', 'earth'];
    for (let i = 0; i < 50; i++) {
      shuffle(kinds);
      if (kinds.indexOf('size') < kinds.indexOf('cancel')) break;
    }
    return kinds;
  }

  let saved = null;
  let kinds = [];
  let question = null;
  let picked = -1;

  /** A scene for a question: nothing running, only the arrows and names it wants. */
  function questionScene({ scene, pair = null, frozen = 0, show = { first: false, second: false }, names = true }) {
    s.scene = scene;
    s.example = scene === 'apple' ? 'apple' : pair && pair.mA !== pair.mB ? 'unequal' : 'equal';
    if (pair) s.pair = { ...pair };
    skatersGroup.visible = scene === 'skaters';
    earthScene.root.visible = scene === 'apple';
    s.show = { ...show };
    s.names = names;
    dress();
    sim.t0 = null;
    sim.frozen = frozen;
    sim.done = false;
    s.userMovedCamera = false;
    flyTo(viewPose(), 0);
    place();
    refresh();
  }

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    action,
    lines: { text: 3, feedback: 4 },
    hooks: {
      enter() {
        saved = { example: s.example, tried: { ...s.tried } };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        kinds = questionOrder();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        const back = saved || { example: 'equal', tried: { equal: false, unequal: false, apple: false } };
        s.tried = { ...back.tried };
        setExample(back.example, { quiet: true });
        syncUI();
        setView(s.view, { animate: false });
        refresh();
        emitChange();
      },
      async prepare(i) {
        const kind = kinds[i % kinds.length];
        picked = -1;
        question = { kind };
        if (kind === 'react') {
          // the apple is falling; only the Earth's pull on it is drawn
          questionScene({ scene: 'apple', frozen: 0.7, show: { first: true, second: false } });
          return { text: t('q_react'), ...textChoices([item('r_ok'), item('r_same'), item('r_none'), item('r_ground')], kind) };
        }
        if (kind === 'cancel') {
          // two equal skaters in the middle of the push, both arrows drawn
          const T = pushStats(PAIRS.equal.mA, PAIRS.equal.mB).T;
          questionScene({ scene: 'skaters', pair: PAIRS.equal, frozen: T * 0.55, show: { first: true, second: true } });
          return { text: t('q_cancel'), ...textChoices([item('c_ok'), item('c_small'), item('c_fric'), item('c_time')], kind) };
        }
        if (kind === 'who') {
          const pair = pickOne([
            { mA: 50, mB: 100 },
            { mA: 100, mB: 50 },
            { mA: 40, mB: 80 },
            { mA: 80, mB: 40 },
          ]);
          questionScene({ scene: 'skaters', pair });
          const light = pair.mA < pair.mB ? 'A' : 'B';
          const right = `who_${light}`;
          const heavy = `who_${light === 'A' ? 'B' : 'A'}`;
          question.light = light;
          question.pair = pair;
          question.heavy = heavy;
          return { text: t('q_who'), ...textChoices([item(right), item(heavy), item('who_same'), item('who_unknown')], kind, { light }) };
        }
        if (kind === 'size') {
          const pair = pickOne([
            { mA: 50, mB: 100 },
            { mA: 100, mB: 50 },
            { mA: 40, mB: 80 },
            { mA: 80, mB: 40 },
          ]);
          questionScene({ scene: 'skaters', pair });
          question.pair = pair;
          return { text: t('q_size'), ...textChoices([item('s_equal'), item('s_heavy'), item('s_light'), item('s_pusher')], kind) };
        }
        questionScene({ scene: 'apple', frozen: 0, show: { first: false, second: false } });
        return { text: t('q_earth'), ...textChoices([item('e_ok'), item('e_less'), item('e_cancel'), item('e_none')], kind) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey])}` : '');
        s.show = { first: true, second: true };
        if (k === 'react') {
          resume();
          return t('why_react') + note({ r_same: 'not_r_same', r_none: 'not_r_none', r_ground: 'not_r_ground' });
        }
        if (k === 'cancel') {
          resume();
          return t('why_cancel') + note({ c_small: 'not_c_small', c_fric: 'not_c_fric', c_time: 'not_c_time' });
        }
        if (k === 'who') {
          startRun({ quiet: true, at: 0 });
          const { mA, mB } = question.pair;
          return (
            t('why_who', { x: question.light, light: Math.min(mA, mB), heavy: Math.max(mA, mB) }) +
            note({ [question.heavy]: 'not_who_heavy', who_same: 'not_who_same', who_unknown: 'not_who_unknown' })
          );
        }
        if (k === 'size') {
          startRun({ quiet: true, at: 0 });
          return t('why_size', { f: plain(PUSH_FORCE) }) + note({ s_heavy: 'not_s_heavy', s_light: 'not_s_light', s_pusher: 'not_s_pusher' });
        }
        startRun({ quiet: true, at: 0 });
        return (
          t('why_earth', { M: sciHtml(EARTH_MASS), ae: sciHtml(earthAcceleration(APPLE_MASS, EARTH_MASS)) }) +
          note({ e_less: 'not_e_less', e_cancel: 'not_e_cancel', e_none: 'not_e_none' })
        );
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
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example) {
      if (s.locked) lockedNudge();
      else setExample(b.dataset.example);
    }
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
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
    const k = e.key;
    const onButton = Boolean(target.closest('button'));
    const sceneKey = ['1', '2', '3', 'r', 'R', 'Home', 'ArrowRight'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3'].includes(k)) setExample(IDS[Number(k) - 1]);
    else if (k === 'ArrowRight' || ((k === ' ' || k === 'Enter') && !onButton)) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') setExample(s.example);
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  for (const id of String(o.tried || '')
    .split(',')
    .map((x) => x.trim())) {
    if (IDS.includes(id)) s.tried[id] = true;
  }
  setExample(s.example, { quiet: true });
  setView(s.view, { animate: false });
  syncUI();
  const at = o.at === '' || o.at == null ? null : Number(o.at);
  if (at != null && Number.isFinite(at)) startRun({ quiet: true, at: Math.max(0, at) });
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
     * Change any of: example ('equal' | 'unequal' | 'apple'), tried (pairs already tried, e.g. ['equal']), push
     * (true: the same as the big button), at (s of the picture's clock after the push or the release: jump there),
     * home (true: back to the start), view. animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.tried) {
        for (const id of Array.isArray(p.tried) ? p.tried : String(p.tried).split(',')) if (IDS.includes(id)) s.tried[id] = true;
        refresh();
      }
      if (p.example) setExample(p.example, { quiet: true });
      if (p.home) setExample(s.example, { quiet: true });
      if (p.at != null) startRun({ quiet: true, at: Math.max(0, Number(p.at) || 0) });
      else if (p.push) startRun({ quiet: true });
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.tried = { equal: false, unequal: false, apple: false };
      s.view = 'front';
      controls.enableRotate = false;
      syncUI();
      setExample('equal', { quiet: true });
      await setView('front', { animate: false });
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The two skaters on a short floor, or the Earth and the apple, as they stand now, in metres. */
    exportRoot() {
      const copy = new THREE.Group();
      copy.name = 'NewtonsThirdLaw';
      if (skaters()) {
        const floor = createRink(1.6);
        const group = new THREE.Group();
        group.name = 'Skaters';
        group.add(floor.root, A.root.clone(true), B.root.clone(true));
        copy.add(group);
      } else {
        const c = earthScene.root.clone(true);
        c.visible = true;
        copy.add(c);
      }
      return copy;
    },
  };
}
