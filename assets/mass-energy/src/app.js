// Relation between mass and energy (ভর ও শক্তির সম্পর্ক), book p119, topic 4.6: the student view. Three scenes, picked
// from one row of words:
//   একটি নিউক্লিয়াস  the book's চিত্র ৪.০৬: a slow neutron goes into a glowing ²³⁵U nucleus, which wobbles, stretches and
//                    splits into ⁹²Kr and ¹⁴¹Ba with three fast neutrons and a flash of শক্তি. The panel shows the book's
//                    equation with each side's mass, and works E = mc² out with the mass that went missing.
//   চেইন রি-অ্যাকশন   the three neutrons, slowed, split three more nuclei, whose nine neutrons split nine more.
//   শক্তিকেন্দ্র        a nuclear power plant at dusk, cut open: the core glows, steam turns the turbine, the generator
//                    lights a town. The student picks the fuel's mass (1 g … 1 kg) and whether it is split (0.079% of
//                    the mass becomes energy) or, as the book's E = mc² says, turned fully into energy; the panel gives
//                    E in J and how long it would light a 100 W bulb.
// The split and the chain are pure functions of time: the student replays them and scrubs them with a slider (or
// the arrow keys). The panel is the kit's clean sheet (one action, one result, one rule). A 5-question test.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { fitPose } from './camera.js';
import { createI18n } from './i18n.js';
import { createSystem, PHASE } from './nucleus.js';
import { createPlant, duskSky, HAZE, poolBackground, SUN } from './plant.js';
import {
  C,
  energyPerSplit,
  fissionFraction,
  fuel,
  indianParts,
  MASS,
  MASSES_G,
  NUCLEUS,
  reaction,
  round,
  sci,
  shuffle,
  sigRound,
  BULB_W,
  U_KG,
} from './reading.js';

export const DEFAULTS = {
  scene: 'one', // 'one' | 'chain' | 'plant'
  t: 0, // s: how far into the split or the chain (for pictures)
  m: 1, // g of uranium-235 in the power-plant scene
  part: 'fission', // 'fission' | 'full'
  run: false, // the power plant running (for pictures)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the neutron pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  bg: 'light', // 'light' (the scenery) | 'transparent'
  shadow: true,
  sound: true,
};

const SCENES = ['one', 'chain', 'plant'];
const COLORS = { energy: '#b86200', kr: '#2f6fb0', ba: '#7b3fb8', n: '#4f5864', slow: '#1c6fd9', plant: '#3b4250' };
// the single split: the neutron sets off at 0 s, touches at 1.6 s; the split is over by 6.6 s
const ONE = { tHit: 1.6, pace: 1, dur: 7 };
// the chain: faster, each step's neutrons take 1.5 s to reach the next nuclei
const CH = { pace: 1.3, hit0: 1.0, travel: 1.5 };
const splitAt = (tHit, pace) => tHit + PHASE.split / pace;
const CH_T1 = splitAt(CH.hit0, CH.pace) + CH.travel; // the second step's nuclei are hit
const CH_T2 = splitAt(CH_T1, CH.pace) + CH.travel;
const CH_DUR = splitAt(CH_T2, CH.pace) + (PHASE.fly - PHASE.split) / CH.pace + 0.3;
const VIEW_DIRS = {
  nuc: { front: new THREE.Vector3(0, 0.04, 1).normalize(), '3d': new THREE.Vector3(0.55, 0.35, 0.8).normalize() },
  plant: { front: new THREE.Vector3(0.36, 0.42, 1).normalize(), '3d': new THREE.Vector3(0.95, 0.85, 0.75).normalize() },
};
const smooth = (a, b, x) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const bn = t.lang === 'bn';

  // ── formula pieces (the font has no ² or ⁻: powers are <sup>) ───────────────────────────────────────────────
  const sup = (x) => `<sup>${N(x)}</sup>`;
  const F = {
    two: 2,
    emc: `<i>E</i> = <i>mc</i>${sup(2)}`,
    c2: `<i>c</i>${sup(2)}`,
  };
  /** A number as m × 10ⁿ (n ≠ 0), with the minus sign U+2212: "২.৭৮ × ১০⁻¹¹". */
  function sciH(x, sig = 3) {
    const { m, e } = sci(x, sig);
    if (e === 0) return N(m);
    const pow = `${N(10)}<sup>${e < 0 ? '−' : ''}${N(Math.abs(e))}</sup>`;
    return `<span class="me-nb">${m === '1' ? pow : `${N(m)}&nbsp;×&nbsp;${pow}`}</span>`;
  }
  const cH = sciH(C);
  const ccH = sciH(C * C);
  /** A nuclide as the book writes it: mass number over atomic number, before the symbol. */
  const nuc = (sym, A, Z, k = '') =>
    `<span class="me-nuc">${k ? `<span class="me-k">${N(k)}</span>` : ''}<span class="me-az"><span>${N(A)}</span><span>${N(Z)}</span></span>${sym}</span>`;
  /** Years the bulb glows, said the way people say big numbers. */
  function yearsText(y) {
    const n = sigRound(y, 2);
    if (!bn) return t('years', { n: n >= 1e6 ? `${+(n / 1e6).toPrecision(2)} million` : n.toLocaleString('en-US') });
    if (n < 1000) return t('years', { n });
    const p = indianParts(n);
    const parts = [];
    if (p.crore) parts.push(t('w_crore', { n: p.crore }));
    if (p.lakh) parts.push(t('w_lakh', { n: p.lakh }));
    if (p.thousand) parts.push(t('w_thousand', { n: p.thousand }));
    if (p.rest) parts.push(N(p.rest));
    return t('years', { n: parts.join(' ') });
  }
  const gText = (g) => (g >= 1000 ? `${N(g / 1000)} ${t('u_kg')}` : `${N(g)} ${t('u_g')}`);
  const pct = () => round(fissionFraction() * 100, 3);

  root.classList.add('pvc', 'me');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the panel: the scenes, the book's equation (or the fuel), one action and the scrubber, one result, one rule ──
  const RX = reaction();
  const eqHtml = `<div class="me-eq" role="group" aria-label="${t('eq_aria')}">
      <span class="me-side l">${nuc('n', 1, 0)}<span class="me-op">+</span>${nuc('U', 235, 92)}</span>
      <span class="me-arrow">${ICONS.arrowR}</span>
      <span class="me-side r">${nuc('Kr', 92, 36)}<span class="me-op">+</span>${nuc('Ba', 141, 56)}<span class="me-op">+</span>${nuc('n', 1, 0, 3)}</span>
      <b class="me-mass l" data-v="L">${N(RX.left)} ${t('u_u')}</b>
      <b class="me-mass r" data-v="R"></b>
      <span class="me-scale" aria-hidden="true"><svg viewBox="0 0 48 34"><path class="post" d="M24 9 V30 M16 31 H32"/><g class="beam"><path d="M5 9 H43"/><path class="pan" d="M5 9 L1 19 H11 Z"/><path class="pan r" d="M43 9 L37 19 H48 Z"/></g><circle cx="24" cy="9" r="2.4"/></svg></span>
    </div>`;
  const fuelHtml = `<div class="me-fuel" role="group" aria-label="${t('calc')}">
      <div class="me-step" role="group" aria-label="${t('calc_m')}">
        <span class="me-name"><i>m</i></span>
        <button type="button" class="me-btn" data-act="m-" aria-label="${t('m_down')}">${ICONS.minus}</button>
        <b class="me-val" data-v="m" aria-live="polite"></b>
        <button type="button" class="me-btn" data-act="m+" aria-label="${t('m_up')}">${ICONS.plus}</button>
      </div>
      <div class="me-seg" role="radiogroup" aria-label="${t('part')}">
        <button type="button" role="radio" data-part="fission" aria-label="${t('part_fission', { p: pct() })}">${N(pct())}%</button>
        <button type="button" role="radio" data-part="full" aria-label="${t('part_full')}">${N(100)}%</button>
      </div>
    </div>`;
  const sheetHtml = cleanSheet(t, {
    examples: {
      label: 'ex_label',
      items: [
        { id: 'one', label: 'ex_one' },
        { id: 'chain', label: 'ex_chain' },
        { id: 'plant', label: 'ex_plant' },
      ],
    },
    quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
    lines: { action: 1, outcome: 2, rule: 3 },
  })
    .replace('<div class="pvc-act-row"', `<div class="me-calc">${eqHtml}${fuelHtml}</div><div class="pvc-act-row"`)
    .replace(
      '<div class="pvc-act-slot"></div>',
      `<div class="pvc-act-slot"></div><input type="range" class="me-scrub" min="0" max="1000" step="1" value="0" aria-label="${t('scrub')}" title="${t('scrub')}">`,
    );
  const ui = buildStudentShell(root, t, { learn: sheetHtml, learnAlign: 'start' });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  const el = {
    eq: $('.me-eq'),
    fuel: $('.me-fuel'),
    massR: $('[data-v="R"]'),
    scale: $('.me-scale'),
    m: $('[data-v="m"]'),
    mMinus: $('[data-act="m-"]'),
    mPlus: $('[data-act="m+"]'),
    scrub: /** @type {HTMLInputElement} */ ($('.me-scrub')),
  };
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'me-note';
  ui.stage.append(note);
  // the chain's steps: 1 → 3 → 9, each lit when that step's nuclei split
  const steps = document.createElement('div');
  steps.className = 'me-steps';
  steps.setAttribute('aria-label', t('chain_aria'));
  steps.innerHTML = [1, 3, 9]
    .map((n, i) => `${i ? `<span class="me-to">${ICONS.arrowR}</span>` : ''}<b data-gen="${i}">${t('chain_gen', { n })}</b>`)
    .join('');
  ui.stage.append(steps);
  const genEls = [...steps.querySelectorAll('[data-gen]')];

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 32, near: 0.5, far: 2000, environment: 'studio-light' });
  const { camera, controls, scene, renderer } = stage;
  controls.enablePan = false;
  controls.enableRotate = false;
  controls.enableZoom = false;
  const transparent = o.bg === 'transparent';
  const bgPool = transparent ? null : poolBackground();
  // the dusk sky: the plant scene's background and the light its materials reflect (the nuclei keep the studio's)
  const sky = transparent ? null : duskSky();
  const envStudio = scene.environment;
  const envDusk = (() => {
    if (!sky) return envStudio;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromEquirectangular(sky).texture;
    pmrem.dispose();
    return env;
  })();
  const hemi = new THREE.HemisphereLight('#ffffff', '#9fd2ea', 1.1);
  const key = new THREE.DirectionalLight('#ffffff', 2.2);
  const rim = new THREE.DirectionalLight('#8fe0ff', 1.4);
  scene.add(hemi, key, key.target, rim);

  const one = createSystem({ name: 'Fission', max: 1, word: t('star') });
  const chain = createSystem({ name: 'ChainReaction', max: 13, word: t('star'), flashScale: 0.6, glowScale: 0.9, trails: true, detail: 0.65 });
  const plant = createPlant();
  scene.add(one.root, chain.root, plant.root);
  if (o.shadow && !transparent) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -45, right: 50, top: 40, bottom: -30, near: 10, far: 220 });
    key.shadow.bias = -0.0006;
    plant.root.traverse((m) => {
      if (m.isMesh && m.name !== 'ReactorCore') {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
  }

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────────
  const s = {
    scene: SCENES.includes(o.scene) ? o.scene : 'one',
    t: 0, // s into the split (one) or the chain
    playing: false,
    played: { one: false, chain: false, plant: false }, // what the student has done (the action's step, the rule)
    m: MASSES_G.includes(Number(o.m)) ? Number(o.m) : 1,
    part: o.part === 'full' ? 'full' : 'fission',
    on: false, // the plant switched on
    power: 0, // the plant's power now, 0 … 1
    layout: 'tall', // 'tall' | 'wide': which way the nucleus splits, so it fits the frame
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    labels: 'learn', // 'learn' | 'quiz'
    quizScene: null, // the test's still scene
    token: 0,
    userMovedCamera: false,
  };
  const dur = () => (s.scene === 'chain' ? CH_DUR : ONE.dur);

  // ── the nuclei, laid out for the frame ───────────────────────────────────────────────────────────────────────
  const rotZ = (a) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), a);
  const LEFT = new THREE.Vector3(-1, 0, 0);
  const unit = (x, y, z = 0) => new THREE.Vector3(x, y, z).normalize();
  let oneBox = null; // what the camera frames once the pieces have flown
  function layoutOne() {
    const tall = s.layout === 'tall';
    const q = tall ? rotZ(0) : rotZ(-1.2);
    const n = { centre: new THREE.Vector3(), q, tHit: ONE.tHit, pace: ONE.pace, slot: 0, tFrom: 0, s1: 21, star: true, out: [] };
    n.slot = one.slotFacing(q, LEFT);
    const T = one.template;
    const slotW = T.home[n.slot].clone().applyQuaternion(q);
    n.from = slotW.clone().add(new THREE.Vector3(-12.5, 0, 0));
    n.out = (
      tall ? [unit(1, 0.34, 0.12), unit(1, -0.42, -0.08), unit(-1, 0.55, 0.2)] : [unit(0.28, 1, 0.1), unit(0.55, -1, -0.05), unit(-0.75, 0.9, 0.15)]
    ).map((dir) => ({ dir, dist: 14 }));
    one.setNuclei([n]);
    // the box of the finished split: both fragments, the three neutrons, the star
    one.render(ONE.dur, camera.quaternion);
    const info = one.render(ONE.dur, camera.quaternion)[0];
    oneBox = new THREE.Box3();
    oneBox.expandByPoint(info.ba.clone().addScalar(T.rBa)).expandByPoint(info.ba.clone().addScalar(-T.rBa));
    oneBox.expandByPoint(info.kr.clone().addScalar(T.rKr)).expandByPoint(info.kr.clone().addScalar(-T.rKr));
    for (const p of info.out) oneBox.expandByPoint(p.clone().addScalar(1.6)).expandByPoint(p.clone().addScalar(-1.6));
    oneBox.expandByPoint(new THREE.Vector3(-T.rU, -T.rU, 0)).expandByPoint(new THREE.Vector3(T.rU, T.rU, 0));
  }
  let chainBoxes = null;
  function layoutChain() {
    const T = chain.template;
    const sx = s.layout === 'wide' ? 1.3 : 1;
    const at = (r, deg) => new THREE.Vector3(Math.cos((deg * Math.PI) / 180) * r * sx, Math.sin((deg * Math.PI) / 180) * r, 0);
    const list = [];
    const mk = (centre, tHit, angle, parent) => {
      const q = rotZ(angle).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.35));
      const towards = parent ? parent.centre.clone().sub(centre).normalize() : unit(-0.85, 0.5);
      const n = { centre, q, tHit, pace: CH.pace, slot: one.slotFacing(q, towards), s1: T.s0 * 1.22, out: [], fade: 1 };
      list.push(n);
      return n;
    };
    const g0 = mk(new THREE.Vector3(), CH.hit0, 0.4, null);
    g0.from = g0.centre.clone().add(T.home[g0.slot].clone().applyQuaternion(g0.q)).add(unit(-0.85, 0.5).multiplyScalar(13));
    g0.tFrom = 0;
    const kids1 = [90, 210, 330].map((deg, i) => {
      const c = mk(at(21, deg), CH_T1, 1.1 + i * 1.7, g0);
      c.deg = deg;
      return c;
    });
    g0.out = kids1.map((c) => ({ to: c }));
    for (const k1 of kids1) {
      const kids2 = [-44, 0, 44].map((d, i) => {
        const c = mk(k1.centre.clone().add(at(18, k1.deg + d).setZ(0)), CH_T2, 0.7 + i * 2.1 + k1.deg / 50, k1);
        c.deg = k1.deg + d;
        return c;
      });
      k1.out = kids2.map((c) => ({ to: c }));
      for (const k2 of kids2) k2.out = [-30, 5, 35].map((d) => ({ dir: at(1, k2.deg + d).normalize(), dist: 9 }));
    }
    chain.setNuclei(list);
    const pad = T.rU + 1.5;
    const boxOf = (ns, extra = []) => {
      const b = new THREE.Box3();
      for (const n of ns) b.expandByPoint(n.centre.clone().addScalar(pad)).expandByPoint(n.centre.clone().addScalar(-pad));
      for (const p of extra) b.expandByPoint(p);
      return b;
    };
    chainBoxes = [boxOf([g0], [g0.from]), boxOf([g0, ...kids1]), boxOf(list)];
  }
  function relayout() {
    const wide = stage.width / Math.max(1, stage.height) > 1.25;
    const want = wide ? 'wide' : 'tall';
    if (want === s.layout && oneBox) return;
    s.layout = want;
    layoutOne();
    layoutChain();
  }

  // ── what is shown: the scene's objects, background and lights ─────────────────────────────────────────────────
  function applyScene() {
    const sc = s.quizScene?.scene ?? s.scene;
    one.root.visible = sc === 'one';
    chain.root.visible = sc === 'chain';
    plant.root.visible = sc === 'plant';
    if (sc === 'plant') {
      scene.background = sky;
      scene.environment = envDusk;
      scene.environmentIntensity = 0.75;
      scene.fog = transparent ? null : new THREE.FogExp2(HAZE, 0.0024);
      hemi.color.set('#aab6ff');
      hemi.groundColor.set('#c4945e');
      hemi.intensity = 0.55;
      key.color.set('#ffc28a');
      key.intensity = 3.1;
      key.target.position.set(5, 0, -10);
      key.position.copy(SUN).multiplyScalar(110).add(key.target.position);
      key.castShadow = renderer.shadowMap.enabled;
      rim.intensity = 0.35;
      rim.color.set('#8f9cff');
      rim.position.set(60, 30, -80);
    } else {
      scene.background = bgPool;
      scene.environment = envStudio;
      scene.environmentIntensity = 1;
      scene.fog = null;
      hemi.color.set('#ffffff');
      hemi.groundColor.set('#8ccbe8');
      hemi.intensity = 1.15;
      key.color.set('#fffaf0');
      key.intensity = 2.3;
      key.position.set(-20, 30, 40);
      key.target.position.set(0, 0, 0);
      key.castShadow = false;
      rim.intensity = 1.5;
      rim.color.set('#8fe0ff');
      rim.position.set(25, -10, -30);
    }
    note.textContent = sc === 'plant' ? t('note_plant') : t('note_nuc');
    steps.hidden = sc !== 'chain' || s.labels === 'quiz';
  }

  // ── camera: frames what matters at this moment (pure function of the time, so scrubbing is smooth) ───────────
  let camFrom = null;
  let camK = 1;
  const camBox = new THREE.Box3();
  const bA = new THREE.Box3();
  const lerpBox = (a, b, u, out) => {
    out.min.lerpVectors(a.min, b.min, u);
    out.max.lerpVectors(a.max, b.max, u);
    return out;
  };
  function boxNow(out) {
    const q = s.quizScene;
    const sc = q?.scene ?? s.scene;
    const tt = q ? q.t : s.t;
    if (sc === 'plant') return out.copy(plant.box);
    if (sc === 'chain') {
      const [b0, b1, b2] = chainBoxes;
      if (tt < 2.5) return out.copy(b0);
      if (tt < CH_T1 + 1.2) return lerpBox(b0, b1, smooth(2.5, 4.0, tt), out);
      return lerpBox(b1, b2, smooth(CH_T1 + 1.2, CH_T1 + 2.9, tt), out);
    }
    const T = one.template;
    const n = one.nuclei[0];
    const start = bA.makeEmpty();
    start.expandByPoint(n.from.clone().add(new THREE.Vector3(-1.5, -T.rU - 1, 0)));
    start.expandByPoint(new THREE.Vector3(T.rU + 1, T.rU + 1, 0));
    const close = new THREE.Box3(new THREE.Vector3(-T.rU - 3.2, -T.rU - 3.2, 0), new THREE.Vector3(T.rU + 3.2, T.rU + 3.2, 0));
    if (tt < 2.6) return lerpBox(start, close, smooth(1.0, 2.4, tt), out);
    return lerpBox(close, oneBox, smooth(ONE.tHit + 2.15, ONE.tHit + 3.4, tt), out);
  }
  function margins() {
    const sc = s.quizScene?.scene ?? s.scene;
    return { top: sc === 'chain' && s.labels === 'learn' ? 52 : 46, bottom: 24, side: 8 };
  }
  function poseNow() {
    boxNow(camBox);
    const sc = s.quizScene?.scene ?? s.scene;
    const dirs = sc === 'plant' ? VIEW_DIRS.plant : VIEW_DIRS.nuc;
    return fitPose({ box: camBox, dir: dirs[s.view], camera, width: stage.width, height: stage.height, margin: margins() });
  }
  function applyCamera() {
    if (s.userMovedCamera) return;
    const p = poseNow();
    if (camK < 1 && camFrom) {
      const k = ease.inOutCubic(camK);
      camera.position.lerpVectors(camFrom.position, p.position, k);
      controls.target.lerpVectors(camFrom.target, p.target, k);
    } else {
      camera.position.copy(p.position);
      controls.target.copy(p.target);
    }
    controls.update();
  }
  function flyCamera(duration = 0.7) {
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    camK = 0;
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        camK = k;
        stage.invalidate();
      },
      onComplete: () => {
        camK = 1;
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    if (animate) flyCamera(0.8);
    else camK = 1;
    stage.invalidate();
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    camK = 1;
  });
  stage.onResize(() => {
    s.userMovedCamera = false;
    relayout();
    draw();
  });

  // ── every frame: the camera, then the nuclei turned to it, then the labels ────────────────────────────────────
  let infoOne = [];
  let infoChain = [];
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    updateNuclei();
    labels();
  });

  // ── the running animation ─────────────────────────────────────────────────────────────────────────────────────
  stage.addTicker((dt) => {
    let moving = false;
    if (s.playing && !s.quizScene) {
      const before = s.t;
      s.t = Math.min(dur(), s.t + dt);
      sounds(before, s.t);
      if (s.t >= dur()) finish();
      moving = true;
    }
    const plantShown = (s.quizScene?.scene ?? s.scene) === 'plant';
    if (plantShown && !s.quizScene) {
      const target = s.on ? 1 : 0;
      if (s.power !== target || s.on) {
        s.power = THREE.MathUtils.clamp(s.power + (s.on ? dt / 4.5 : -dt / 2), 0, 1);
        plant.set(s.power, dt);
        moving = true;
      }
    }
    if (moving) draw();
    return moving;
  });
  /** A click as the neutron touches, a boom at each split. */
  function sounds(a, b) {
    if (s.scene === 'one') {
      if (a < ONE.tHit && b >= ONE.tHit) audio.contact();
      if (a < splitAt(ONE.tHit, ONE.pace) && b >= splitAt(ONE.tHit, ONE.pace)) audio.pop();
    } else
      for (const th of [CH.hit0, CH_T1, CH_T2]) {
        const ts = splitAt(th, CH.pace);
        if (a < ts && b >= ts) audio.pop();
      }
  }
  function finish() {
    s.playing = false;
    if (!s.played[s.scene]) {
      s.played[s.scene] = true;
      audio.success();
    }
    emitChange();
  }
  function play() {
    if (s.locked) return lockedNudge();
    audio.unlock();
    s.token += 1;
    s.t = 0;
    s.playing = true;
    s.userMovedCamera = false;
    draw();
    emitChange();
  }
  function seekTo(tt, { user = false } = {}) {
    s.playing = false;
    s.t = THREE.MathUtils.clamp(tt, 0, dur());
    if (user && s.t >= splitAt(s.scene === 'chain' ? CH_T2 : ONE.tHit, s.scene === 'chain' ? CH.pace : ONE.pace) + 0.5) s.played[s.scene] = true;
    draw();
    emitChange();
  }
  function setPlant(on) {
    if (s.locked) return lockedNudge();
    audio.unlock();
    s.on = on;
    if (on) {
      s.played.plant = true;
      audio.success();
    } else audio.tick();
    draw();
    emitChange();
  }

  // ── labels on the picture (each only while what it says is true) ──────────────────────────────────────────────
  let action = null;
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, note, steps, () => action?.ringBox(), () => starBox(), () => neutronBoxes()],
  });
  const shown = new Map();
  const pts = new Map();
  function label(id, on, text, point, color, spots, optional = false) {
    if (!on) {
      if (shown.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
      return;
    }
    if (!pts.has(id)) pts.set(id, new THREE.Vector3());
    pts.get(id).copy(point);
    if (!shown.has(id)) {
      anno.add(id, { text, point: () => pts.get(id), color, spots, kind: 'part', optional });
      shown.set(id, text);
    } else if (shown.get(id) !== text) {
      anno.setText(id, text);
      shown.set(id, text);
    }
  }
  function clearLabels() {
    for (const id of [...shown.keys()]) anno.remove(id);
    shown.clear();
  }
  const SIDE = [
    { dx: 46, dy: -30 },
    { dx: -46, dy: -30 },
    { dx: 46, dy: 30 },
    { dx: -46, dy: 30 },
  ];
  const ABOVE = [
    { dx: 0, dy: -34 },
    { dx: 0, dy: 34 },
    { dx: 50, dy: -24 },
  ];
  // behind a neutron coming in from the left: never over the nucleus it flies at
  const BEHIND = [
    { dx: -28, dy: -34 },
    { dx: -28, dy: 34 },
  ];
  const SMALL = [
    { dx: 22, dy: -18 },
    { dx: -22, dy: -18 },
    { dx: 22, dy: 18 },
    { dx: -22, dy: 18 },
  ];
  const tmpP = new THREE.Vector3();
  const tmpQ = new THREE.Vector3();
  /** A point on a nucleus's rim toward the camera's upper side (labels' dots sit on the rim, not on the middle). */
  const rimOf = (c, r, dir) =>
    tmpP
      .copy(dir)
      .applyQuaternion(camera.quaternion)
      .multiplyScalar(r * 0.92)
      .add(c);
  function labels() {
    const sc = s.quizScene?.scene ?? s.scene;
    const quiz = s.labels === 'quiz';
    const qk = s.quizScene?.kind;
    const T = one.template;
    // the single split
    const a = sc === 'one' ? infoOne[0] : null;
    const UP = tmpQ.set(0.55, 0.75, 0).normalize();
    label('nin', !quiz && a?.phase === 'come', t('l_n_in'), a?.incoming ?? tmpP, COLORS.slow, BEHIND);
    label(
      'U',
      !quiz && Boolean(a) && (a.phase === 'come' || a.phase === 'wait'),
      `${sup(235)}U`,
      a ? rimOf(a.centre, T.rU, UP) : tmpP,
      '#9c2236',
      SIDE,
    );
    label(
      'unst',
      !quiz && Boolean(a) && (a.phase === 'wobble' || a.phase === 'neck'),
      t('l_unstable'),
      a ? rimOf(a.centre, T.rU, UP) : tmpP,
      '#9c2236',
      SIDE,
    );
    const frag = Boolean(a?.split) && (!quiz || qk === 'neutrons' || qk === 'mass');
    label('ba', frag, `${sup(NUCLEUS.Ba.A)}Ba`, a ? rimOf(a.ba, T.rBa, UP) : tmpP, COLORS.ba, SIDE);
    label('kr', frag, `${sup(NUCLEUS.Kr.A)}Kr`, a ? rimOf(a.kr, T.rKr, UP) : tmpP, COLORS.kr, SIDE);
    for (let j = 0; j < 3; j++) label(`n${j}`, !quiz && Boolean(a?.split) && a.outOn[j], t('l_n'), a ? a.out[j] : tmpP, COLORS.n, SMALL, true);
    // the chain: one of the first neutrons on its way, being slowed
    const c0 = sc === 'chain' ? infoChain[0] : null;
    const tt = s.quizScene ? s.quizScene.t : s.t;
    const slowOn = !quiz && Boolean(c0?.split) && c0.outOn[0] && tt < CH_T1 - 0.2;
    label('slow', slowOn, t('l_slow'), c0 ? c0.out[0] : tmpP, COLORS.slow, ABOVE, true);
    label(
      'U0',
      !quiz && Boolean(c0) && (c0.phase === 'come' || c0.phase === 'wait'),
      `${sup(235)}U`,
      c0 ? rimOf(c0.centre, T.rU, UP) : tmpP,
      '#9c2236',
      SIDE,
    );
    label('nin0', !quiz && c0?.phase === 'come' && tt > 0, t('l_n_in'), c0?.incoming ?? tmpP, COLORS.slow, ABOVE, true);
    // the power plant
    const pl = sc === 'plant';
    const A = plant.anchors;
    label('core', pl, t('l_core'), A.core(), COLORS.plant, SIDE);
    label('steam', pl && !quiz, t('l_steam'), A.steam(), COLORS.plant, ABOVE, true);
    label('turb', pl && !quiz, t('l_turbine'), A.turbine(), COLORS.plant, ABOVE, true);
    label('gen', pl && !quiz, t('l_generator'), A.generator(), COLORS.plant, ABOVE, true);
    label('power', pl && !quiz && s.power > 0.6, t('l_power'), A.town(), COLORS.energy, ABOVE, true);
    label('fuel', pl && qk === 'calc', t('l_fuel', { m: s.quizScene?.m ?? 1 }), A.core(), COLORS.energy, ABOVE);
  }

  /** The star of energy on the screen (canvas pixels), so no label covers it. */
  const starV = new THREE.Vector3();
  function starBox() {
    const a = infoOne[0];
    const sc = s.quizScene?.scene ?? s.scene;
    if (sc !== 'one' || !a?.split) return null;
    const r = one.template.rU * 0.8;
    starV.copy(a.centre).project(camera);
    const cx = (starV.x * 0.5 + 0.5) * stage.width;
    const cy = (-starV.y * 0.5 + 0.5) * stage.height;
    starV
      .copy(a.centre)
      .addScaledVector(tmpQ.set(1, 0, 0).applyQuaternion(camera.quaternion), r)
      .project(camera);
    const rp = Math.abs((starV.x * 0.5 + 0.5) * stage.width - cx);
    return { left: cx - rp, top: cy - rp, right: cx + rp, bottom: cy + rp };
  }

  /** The three new neutrons on the screen: no label may hide one (the test asks the student to count them). */
  function neutronBoxes() {
    const a = infoOne[0];
    const sc = s.quizScene?.scene ?? s.scene;
    if (sc !== 'one' || !a?.split) return null;
    const out = [];
    for (let j = 0; j < 3; j++) {
      if (!a.outOn[j]) continue;
      starV.copy(a.out[j]).project(camera);
      const x = (starV.x * 0.5 + 0.5) * stage.width;
      const y = (-starV.y * 0.5 + 0.5) * stage.height;
      out.push({ left: x - 11, top: y - 11, right: x + 11, bottom: y + 11 });
    }
    return out;
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────────
  const E1 = energyPerSplit();
  const dmKg = RX.defect * U_KG;
  function outcome() {
    if (s.scene === 'one') {
      const a = infoOne[0];
      const ph = a?.phase ?? 'wait';
      let w;
      if (a?.split) w = t('out_split', { dm: RX.defect, kg: sciH(dmKg) });
      else if (ph === 'come') w = s.t > 0 ? t('out_come') : t('out_start');
      else if (ph === 'wobble') w = t('out_wobble');
      else if (ph === 'neck') w = t('out_neck');
      else w = t('out_start');
      const f = a?.split ? t('f_E', { emc: F.emc, kg: sciH(dmKg), c: cH, two: 2, E: sciH(E1) }) : t('f_left', { n: MASS.n, U: MASS.U, L: RX.left });
      return `<span class="me-w">${w}</span><span class="me-f">${f}</span>`;
    }
    if (s.scene === 'chain') {
      const n = infoChain.filter((x) => x.split).length;
      const done = n === 13;
      const w = n === 0 ? t('out_chain_start') : done ? t('out_chain_done', { a: 1, b: 3, c: 9, n }) : t('out_chain_run', { n });
      const f = n === 0 ? t('f_chain_start', { e1: sciH(E1) }) : t('f_chain', { n, e1: sciH(E1), E: sciH(n * E1) });
      return `<span class="me-w">${w}</span><span class="me-f">${f}</span>`;
    }
    const fu = fuel(s.m, s.part);
    const w = t(s.part === 'full' ? 'out_plant_full' : 'out_plant', { m: gText(s.m), p: pct(), kg: sciH(fu.kg) });
    const f = t('f_E', { emc: F.emc, kg: sciH(fu.kg), c: cH, two: 2, E: sciH(fu.E) });
    return `<span class="me-w">${w}</span><span class="me-f">${f}</span>`;
  }
  function rule() {
    if (s.scene === 'one') return infoOne[0]?.split ? t('rule_split', { emc: F.emc, c2: F.c2, cc: ccH, two: 2 }) : t('rule_start');
    if (s.scene === 'chain') return infoChain.length && infoChain.every((x) => x.split) ? t('rule_chain_done') : t('rule_chain');
    const fu = fuel(s.m, s.part);
    return t(s.on ? 'rule_plant_on' : 'rule_plant_off', { W: BULB_W, years: yearsText(fu.years) });
  }
  function panel() {
    if (s.labels !== 'learn') return;
    sheet.choose(s.scene);
    sheet.next(!s.played.one ? null : !s.played.chain ? 'chain' : !s.played.plant ? 'plant' : null);
    const nuc = s.scene !== 'plant';
    el.eq.hidden = !nuc;
    el.fuel.hidden = nuc;
    el.scrub.hidden = !nuc;
    // the right side's mass once the nucleus has split (the balance tips: the left side is heavier)
    const split = s.scene === 'one' ? Boolean(infoOne[0]?.split) : infoChain.some((x) => x.split);
    el.massR.innerHTML = split ? `${N(RX.right)} ${t('u_u')}` : '&nbsp;';
    el.scale.classList.toggle('tipped', split);
    if (nuc) {
      const v = String(Math.round((s.t / dur()) * 1000));
      if (el.scrub.value !== v) el.scrub.value = v;
      el.scrub.disabled = s.locked;
    }
    el.m.textContent = gText(s.m);
    el.mMinus.disabled = s.locked || s.m === MASSES_G[0];
    el.mPlus.disabled = s.locked || s.m === MASSES_G.at(-1);
    for (const b of ui.$$('[data-part]')) {
      const on = b.dataset.part === s.part;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', String(on));
    }
    sheet.outcome(outcome());
    sheet.rule(rule());
    // the chain's steps light up as each step's nuclei split
    if (s.scene === 'chain') {
      const lit = [0, 1, 4].map((i) => Boolean(infoChain[i]?.split));
      genEls.forEach((g, i) => g.classList.toggle('on', lit[i]));
    }
    // the action
    const done = s.played[s.scene];
    const used = Object.values(s.played).filter(Boolean).length;
    const step = done ? '' : used + 1;
    let lab = s.scene === 'plant' ? 'act_plant_on' : 'act_shoot';
    if (s.scene === 'plant' && s.on) lab = 'act_plant_off';
    else if (s.scene !== 'plant' && (done || s.t > 0)) lab = 'act_again';
    const numbered = lab === 'act_shoot' || lab === 'act_plant_on';
    const icon = s.scene === 'plant' ? (s.on ? ICONS.pause : ICONS.play) : s.t > 0 ? ICONS.reset : ICONS.hand;
    const keyNow = `${lab}|${step}|${icon.length}|${lab === 'act_again'}`;
    if (action && action.lastKey !== keyNow) {
      action.lastKey = keyNow;
      action.set({ label: lab, step: numbered ? step : '', icon });
    }
  }

  /** The nuclei at this moment (what the panel and the labels read; drawn again, turned to the camera, per frame). */
  function updateNuclei() {
    const sc = s.quizScene?.scene ?? s.scene;
    const tt = s.quizScene ? s.quizScene.t : s.t;
    if (sc === 'one') infoOne = one.render(tt, camera.quaternion);
    if (sc === 'chain') infoChain = chain.render(tt, camera.quaternion);
  }
  function draw() {
    applyScene();
    updateNuclei();
    panel();
    note.hidden = false;
    stage.invalidate();
  }

  // ── the action: one big button; its badge on the waiting neutron (or the reactor) ─────────────────────────────
  const ringPoint = new THREE.Vector3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_shoot',
    icon: ICONS.hand,
    target: () => {
      if (s.locked || camK < 1) return null;
      if (s.scene === 'one' && s.t === 0 && !s.playing) return ringPoint.copy(one.nuclei[0].from);
      if (s.scene === 'chain' && s.t === 0 && !s.playing) return ringPoint.copy(chain.nuclei[0].from);
      if (s.scene === 'plant' && !s.on) return ringPoint.copy(plant.anchors.core());
      return null;
    },
    radius: 22,
    avoid: [ui.corner, ui.hint, note, steps, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });
  let lastAct = -1e9;
  function act() {
    if (s.locked) return lockedNudge();
    const now = performance.now();
    if (now - lastAct < 400) return;
    lastAct = now;
    if (s.scene === 'plant') return setPlant(!s.on);
    play();
  }

  // ── choosing a scene ────────────────────────────────────────────────────────────────────────────────────────
  function choose(sc, { animate = true } = {}) {
    if (s.locked) return lockedNudge();
    if (!SCENES.includes(sc)) return;
    const changed = sc !== s.scene;
    s.token += 1;
    s.scene = sc;
    s.playing = false;
    if (changed) s.t = 0;
    s.userMovedCamera = false;
    if (sc === 'plant') plant.set(s.power, 0);
    clearLabels();
    draw();
    if (animate && changed) {
      camFrom = null;
      camK = 1;
      // a quick fade between scenes of very different size
      ui.stage.classList.remove('me-fade');
      void ui.stage.offsetWidth;
      ui.stage.classList.add('me-fade');
    }
    emitChange();
  }

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────────
  const QUESTIONS = ['neutrons', 'mass', 'calc', 'chain', 'why'];
  let order = QUESTIONS;
  let qCurrent = null;
  const plainU = (x) => `${N(x)} ${t('u_u')}`;
  const notesOf = (pairs) => new Map(pairs.map(([v, html]) => [String(v), html]));
  function choicesFrom(answer, wrong) {
    const out = [answer];
    for (const w of wrong) if (out.length < 4 && !out.some((x) => Math.abs(x - w) <= Math.abs(answer) * 1e-9)) out.push(w);
    return shuffle(out);
  }
  function quizScene(q) {
    s.quizScene = q;
    s.playing = false;
    clearLabels();
    if (q.scene === 'plant') plant.set(q.power ?? 0, 0);
    applyScene();
    stage.invalidate();
  }
  function prepare(i) {
    const kind = order[i];
    if (kind === 'neutrons') {
      quizScene({ kind, scene: 'one', t: ONE.dur });
      return {
        text: t('q_neutrons'),
        answer: 3,
        wrong: [1, 2, 4],
        label: (x) => t('c_count', { n: x }),
        notes: notesOf([
          [1, t('n_neutrons_1')],
          [2, t('n_neutrons_2')],
          [4, t('n_neutrons_4')],
        ]),
        reveal: t('a_neutrons', { n: 3, kr: NUCLEUS.Kr.A, ba: NUCLEUS.Ba.A }),
      };
    }
    if (kind === 'mass') {
      quizScene({ kind, scene: 'one', t: ONE.dur });
      const dm = RX.defect;
      const dec = round(dm / 10, 5);
      return {
        text: `${t('q_mass_book', { L: RX.left, R: RX.right })} ${t('q_mass')}`,
        answer: dm,
        wrong: [dec, MASS.n, 0],
        label: plainU,
        notes: notesOf([
          [0, t('n_mass_0')],
          [dec, t('n_mass_dec')],
          [MASS.n, t('n_mass_n')],
        ]),
        reveal: t('a_mass', { dm, L: RX.left, R: RX.right, emc: F.emc }),
      };
    }
    if (kind === 'calc') {
      const m = shuffle([1, 2, 5])[0];
      quizScene({ kind, scene: 'plant', power: 0, m });
      const kg = m / 1000;
      const E = kg * C * C;
      const wrong = [m * C * C, kg * C, kg * 2 * C];
      const J = (x) => `${sciH(x)} ${t('u_J')}`;
      return {
        text: t('q_calc', { m, c: cH }),
        answer: E,
        wrong,
        tolerance: E * 1e-6,
        label: J,
        html: true,
        notes: notesOf([
          [wrong[0], t('n_calc_g', { m, kg: N(kg) })],
          [wrong[1], t('n_calc_c', { c2: F.c2 })],
          [wrong[2], t('n_calc_2c', { c2: F.c2, two: 2 })],
        ]),
        reveal: t('a_calc', { E: sciH(E), emc: F.emc, kg: N(kg), c: cH, two: 2 }),
      };
    }
    if (kind === 'chain') {
      quizScene({ kind, scene: 'chain', t: splitAt(CH_T1, CH.pace) + 0.75, hideLast: true });
      return {
        text: t('q_chain', { k: 3 }),
        answer: 9,
        wrong: [3, 6, 27],
        label: (x) => t('c_count', { n: x }),
        notes: notesOf([
          [3, t('n_chain_same', { k: 3, a: 9 })],
          [6, t('n_chain_add', { k: 3, a: 9 })],
          [27, t('n_chain_27', { w: 27, a: 9, k: 3 })],
        ]),
        reveal: t('a_chain', { a: 9, k: 3 }),
      };
    }
    // why so much energy: the answers are words (values are their indices)
    quizScene({ kind, scene: 'plant', power: 1 });
    const words = [t('c_why_c2', { c2: F.c2 }), t('c_why_more'), t('c_why_half'), t('c_why_n')];
    return {
      text: t('q_why'),
      answer: 0,
      wrong: [1, 2, 3],
      label: (x) => words[x],
      notes: notesOf([
        [1, t('n_why_more')],
        [2, t('n_why_half', { emc: F.emc })],
        [3, t('n_why_n', { one: 1 })],
      ]),
      reveal: t('a_why', { c2: F.c2, cc: ccH, two: 2, emc: F.emc }),
    };
  }
  // the chain question hides the last step's nuclei (the picture must not show the answer)
  const showLast = (on) => {
    for (const [i, n] of chain.nuclei.entries()) if (i >= 4) n.hidden = !on;
  };
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    lines: { text: 3, feedback: 3 },
    action,
    hooks: {
      enter() {
        s.mode = 'quiz';
        s.labels = 'quiz';
        s.locked = true;
        s.playing = false;
        // the neutrons' count first (every later scene of the split shows them); the why question last
        order = ['neutrons', ...shuffle(['mass', 'calc', 'chain']), 'why'];
        clearLabels();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.labels = 'learn';
        s.locked = false;
        s.quizScene = null;
        showLast(true);
        clearLabels();
        if (s.scene === 'plant') plant.set(s.power, 0);
        camFrom = null;
        camK = 1;
        syncUI();
        draw();
      },
      async prepare(i, alive, say) {
        const q = prepare(i);
        qCurrent = q;
        showLast(!(s.quizScene?.hideLast ?? false));
        say(q.text.replace(/<[^>]+>/g, ''));
        const done = await flyCamera(0.5);
        if (!alive()) return null;
        if (!done) camK = 1;
        // the question may carry markup (powers): write it again as HTML
        ui.$('.pvc-q-text').innerHTML = q.text;
        return {
          choices: choicesFrom(q.answer, q.wrong),
          expected: q.answer,
          tolerance: q.tolerance ?? 1e-6,
          label: q.label,
          meta: { kind: order[i] },
        };
      },
      reveal(_q, correct, picked) {
        const q = qCurrent;
        const why = !correct && picked ? q.notes.get(String(picked.value)) : '';
        return `${q.reveal}${why ? ` <span class="me-why">${why}</span>` : ''}`;
      },
      done() {},
    },
  });

  // ── buttons, keys ─────────────────────────────────────────────────────────────────────────────────────────────
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
  let hintTimer = 0;
  function hint(text) {
    ui.hintText.innerHTML = text;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => ui.hint.classList.remove('show'), 3200);
  }
  function lockedNudge() {
    hint(t('q_locked'));
    audio.error();
  }
  function stepM(dir) {
    if (s.locked) return lockedNudge();
    const i = MASSES_G.indexOf(s.m) + dir;
    if (i < 0 || i >= MASSES_G.length) return;
    audio.tick();
    s.m = MASSES_G[i];
    draw();
    emitChange();
  }
  function setPart(part) {
    if (s.locked) return lockedNudge();
    if (part === s.part) return;
    audio.tick();
    s.part = part === 'full' ? 'full' : 'fission';
    draw();
    emitChange();
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  let lastTap = { what: '', at: 0 };
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    // a second tap within 120 ms on the same button is a bounce, not a second tap
    const what = b.dataset.act || b.dataset.example || b.dataset.part || '';
    const now = performance.now();
    if (what && what === lastTap.what && now - lastTap.at < 120) return;
    lastTap = { what, at: now };
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.example) choose(b.dataset.example);
    if (b.dataset.part) setPart(b.dataset.part);
    const a = b.dataset.act;
    if (a === 'q-next') quiz.next();
    if (a === 'q-again') quiz.start();
    if (a === 'home') home();
    if (a === 'm-') stepM(-1);
    if (a === 'm+') stepM(1);
    if (a === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  el.scrub.addEventListener('input', () => {
    if (s.locked) return;
    seekTo((Number(el.scrub.value) / 1000) * dur(), { user: true });
  });
  el.scrub.addEventListener('keydown', (e) => e.stopPropagation()); // the slider's own arrow keys
  root.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return;
    const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (d) {
      e.preventDefault();
      if (s.locked) return lockedNudge();
      if (s.scene === 'plant') return stepM(d);
      return seekTo(s.t + d * 0.25, { user: true });
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (s.mode === 'quiz') return;
      act();
    }
  });
  function home() {
    if (s.locked) return lockedNudge();
    s.token += 1;
    s.playing = false;
    s.t = 0;
    s.on = false;
    s.power = 0;
    plant.set(0, 0);
    s.m = 1;
    s.part = 'fission';
    s.userMovedCamera = false;
    clearLabels();
    draw();
    emitChange();
  }

  // ── state for the book ────────────────────────────────────────────────────────────────────────────────────────
  function snapshot() {
    const split = s.scene === 'chain' ? chain.render(s.t, camera.quaternion).filter((x) => x.split).length : 0;
    const fu = fuel(s.m, s.part);
    return {
      scene: s.scene,
      t: +s.t.toFixed(3),
      duration: +dur().toFixed(3),
      playing: s.playing,
      left: RX.left,
      right: RX.right,
      defect: RX.defect,
      energyPerSplit: +E1.toPrecision(4),
      split: s.scene === 'one' ? s.t >= splitAt(ONE.tHit, ONE.pace) : split > 0,
      splits: s.scene === 'chain' ? split : s.t >= splitAt(ONE.tHit, ONE.pace) ? 1 : 0,
      m: s.m,
      part: s.part,
      convertedKg: +fu.kg.toPrecision(4),
      E: +fu.E.toPrecision(4),
      bulbYears: +fu.years.toPrecision(4),
      on: s.on,
      power: +s.power.toFixed(3),
      mode: s.mode,
      locked: s.locked,
      view: s.view,
    };
  }
  let lastEmit = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.scene, snap.split, snap.splits, snap.m, snap.part, snap.on, snap.playing]);
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snap);
    }
  }

  // ── start ─────────────────────────────────────────────────────────────────────────────────────────────────────
  relayout();
  syncUI();
  setView(s.view, { animate: false });
  if (s.scene !== 'plant' && Number(o.t) > 0) s.t = THREE.MathUtils.clamp(Number(o.t), 0, dur());
  if (s.t >= dur() - 1e-6) s.played[s.scene] = true;
  if (o.run) {
    s.on = true;
    s.power = 1;
    s.played.plant = true;
  }
  plant.set(s.power, 0);
  draw();
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
    getState: () => snapshot(),
    async set(p = {}) {
      if (p.view) setView(p.view, { animate: p.animate !== false });
      if (p.scene && SCENES.includes(p.scene) && p.scene !== s.scene) choose(p.scene, { animate: p.animate !== false });
      if (p.m != null && MASSES_G.includes(Number(p.m))) s.m = Number(p.m);
      if (p.part) s.part = p.part === 'full' ? 'full' : 'fission';
      if (p.t != null) seekTo(Number(p.t));
      if (p.play) play();
      if (p.run != null) {
        s.on = Boolean(p.run);
        if (p.animate === false) s.power = s.on ? 1 : 0;
        if (s.on) s.played.plant = true;
        plant.set(s.power, 0);
      }
      draw();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.played = { one: false, chain: false, plant: false };
      setView('front', { animate: false });
      s.scene = 'one';
      home();
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
    exportRoot() {
      one.render(s.scene === 'one' ? s.t : ONE.dur, camera.quaternion);
      return one.exportGroup();
    },
  };
}
