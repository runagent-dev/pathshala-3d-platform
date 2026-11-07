// Charge (book pages 272–273, topic 10.1), student view. চিত্র ১০.০১ in 3D: a model of an argon atom over a plain round
// stand in a calm blue setting: a nucleus of 18 protons (red, "+") and 22 neutrons (grey, no sign), three orbits with
// 2, 8 and 8 electrons (blue, "−"). Four steps, one tap each, slow: ① the camera flies into the nucleus (প্রোটন +,
// নিউট্রন: no charge); ② back out, the 18 electrons come in one by one, filling one orbit before the next (2, 8, 8):
// as many electrons as protons, total charge 0 (বিদ্যুৎ নিরপেক্ষ বা নিস্তড়িৎ); ③ one outer electron is taken away: the
// atom has one positive charge (আয়নিত বা আহিত); the student may tap more outer electrons (inner ones are held tight),
// or tap a taken one to bring it back; ④ the other way round, on a chlorine atom (2-8-7, the book's লবণ): a stray
// electron joins its free place and the atom's total charge is negative. The panel counts the charges (a row of + and
// a row of −, paired) and gives the charge in coulombs (e = 1.6 × 10⁻¹⁹ C). A calm card on the first screen; one
// lead-in line, the result and the rule per step; the kit's how-to row; a five-question test.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createHowTo } from '@shared/student/howto.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createRotateCue } from '@shared/student/rotatecue.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createTweener, ease } from '@shared/tween.js';
import { COLORS, createAtom, FIRST_OUT_DEG, GAP_DEG, PARK_R, R_ELECTRON, R_NUCLEON, SHELL_R } from './atom.js';
import { fitPose } from './camera.js';
import { createI18n } from './i18n.js';
import { ATOMS, coulombs, E_CHARGE, extraChoices, MAX_REMOVED, netCharge, removedChoices, STEPS } from './reading.js';
import { backdrop, createStand } from './setting.js';

export const DEFAULTS = {
  view: 'front',
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const DOUBLE_TAP = 420; // ms
const MARGIN = { top: 50, bottom: 12, side: 10 };
/** How long things take (s): slow enough to follow. */
const T = { fly: 2, fill: 4.8, back: 1.8, out: 2, swap: 1.6, hold: 0.8, join: 2, spinTail: 2.2 };
/**
 * Where each step ends: the camera on the nucleus (focus) or wide enough for the electrons waiting outside (wide), the
 * electrons and orbits shown, the electrons in, argon or chlorine (swap), chlorine's stray electron in (join).
 */
const TARGET = {
  intro: { focus: 0, wide: 0, eVis: 1, ringVis: 1, fill: 1, swap: 0, join: 0 },
  nucleus: { focus: 1, wide: 0, eVis: 0, ringVis: 0.28, fill: 1, swap: 0, join: 0 },
  shells: { focus: 0, wide: 0, eVis: 1, ringVis: 1, fill: 1, swap: 0, join: 0 },
  less: { focus: 0, wide: 1, eVis: 1, ringVis: 1, fill: 1, swap: 0, join: 0 },
  more: { focus: 0, wide: 1, eVis: 1, ringVis: 1, fill: 1, swap: 1, join: 1 },
};
const ORDER = ['intro', ...STEPS];
/** How fast each orbit turns while the electrons settle (rad/s), inner fastest. */
const OMEGA = [0.9, 0.55, 0.36];
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const rad = THREE.MathUtils.degToRad;
const STAND_Y = -(PARK_R + 1.7);

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc', 'ca');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: STEPS.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      tight: true,
      lines: { action: 1, outcome: 2, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  // the line before the action: what the next tap will show (on the first screen, a few calm words in a card)
  const lead = document.createElement('p');
  lead.className = 'ca-lead';
  $('.pvc-act-row').before(lead);
  // the count of charges: a row of + (protons) over a row of − (electrons), paired; then the sum
  const tally = document.createElement('div');
  tally.className = 'ca-tally';
  tally.setAttribute('role', 'group');
  tally.setAttribute('aria-label', t('reading'));
  tally.innerHTML = `<span class="ca-tl p">${t('tally_p')}</span><span class="ca-tl e">${t('tally_e')}</span><svg class="pvc-graph ca-tally-svg" role="img"></svg>`;
  $('.pvc-act-row').after(tally);
  const tallySvg = /** @type {SVGSVGElement} */ (tally.querySelector('svg'));
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  // a short note on the view: this is a model, not to scale (as coulombs-law's note on its arrows)
  const note = document.createElement('div');
  note.className = 'ca-note';
  note.textContent = t('note_model');
  ui.stage.append(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 1, far: 3000, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;

  scene.add(new THREE.HemisphereLight('#e6efff', '#6d5a44', 1.0));
  const sun = new THREE.DirectionalLight('#fff4e2', 2.1);
  sun.position.set(30, 70, 45);
  sun.target.position.set(0, -4, 0);
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.7);
  fill.position.set(-50, 20, 40);
  scene.add(fill);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    sun.shadow.radius = 3;
    Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 40, far: 130 });
    sun.shadow.camera.updateProjectionMatrix();
  }
  sun.target.updateMatrixWorld();
  scene.background = o.bg === 'transparent' ? null : backdrop();

  const stand = createStand();
  stand.root.position.y = STAND_Y;
  const atom = createAtom();
  scene.add(stand.root, atom.root);
  atom.root.updateMatrixWorld(true);
  const SLOT_OF = (shell, deg) => atom.SLOTS.ar.findIndex((x) => x.shell === shell && x.deg === deg);
  const FIRST = SLOT_OF(2, FIRST_OUT_DEG);
  /** The outer electrons in the order the keys (and the book page's `removed: n`) take them. */
  const REMOVE_ORDER = [45, 225, 0, 180, 315, 135, 90, 270].map((d) => SLOT_OF(2, d));
  const OUTER = new Set(REMOVE_ORDER);
  const STRAY = 17; // chlorine's stray electron

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
    step: 'intro',
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    busy: false,
    run: 0,
    userMovedCamera: false,
    quizKind: '',
  };
  const v = { ...TARGET.intro };
  const rem = new Array(18).fill(0); // each argon electron's way out: 0 in its place, 1 waiting outside
  const park = new Array(18).fill(0); // the angle (rad) it waits at
  /** @type {Set<number>} the argon electrons taken away (where they are going) */
  const removed = new Set();
  let joined = false; // chlorine's stray electron is (going) in its place
  const phase = [0, 0, 0];
  let spin = 0; // seconds of turning left
  const shake = { i: -1, k: 0 };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;

  // the orbits turn while the electrons settle, then stop (nothing draws while idle)
  stage.addTicker((dt) => {
    if (spin <= 0) return false;
    const k = Math.min(1, spin / 1.2);
    for (let i = 0; i < 3; i++) phase[i] += OMEGA[i] * dt * k;
    spin = Math.max(0, spin - dt);
    return true;
  });

  // ── the scene from the state ────────────────────────────────────────────────
  const A = V(0, 0, 0);
  const B = V(0, 0, 0);
  const P = V(0, 0, 0);
  const GAPS = [V(0, 0, 0), V(0, 0, 0), V(0, 0, 0)];
  const gapList = [];
  const element = () => (v.swap < 0.5 ? 'ar' : 'cl');
  /** How far electron i has come in while the orbits fill (0 not yet, 1 in its place). */
  // (the last one lands at fill = 1 exactly: rounding must not leave it a hair short)
  const arrived = (i) => clamp01((v.fill - (0.8 * i) / 17) / 0.2 + 1e-9);
  function syncScene() {
    const el = element();
    atom.setElement(el);
    const k0 = v.swap < 0.5 ? 1 - 2 * v.swap : 2 * v.swap - 1; // the old atom shrinks away, the new one grows
    const k = ease.inOutCubic(clamp01(k0));
    atom.setNucleusScale(Math.max(1e-3, k));
    atom.mats.electron.opacity = v.eVis;
    atom.electrons.visible = v.eVis > 0.01;
    atom.mats.ring.opacity = v.ringVis;
    const slots = atom.SLOTS[el];
    gapList.length = 0;
    for (let i = 0; i < 18; i++) {
      const sl = slots[i];
      let scale = 1;
      atom.slotPoint(sl.shell, sl.deg, phase[sl.shell], B);
      if (el === 'cl' && i === STRAY) {
        atom.parkPoint(rad(GAP_DEG) + phase[2], A);
        P.lerpVectors(A, B, ease.inOutCubic(v.join));
        if (v.join < 0.97) gapList.push(GAPS[gapList.length].copy(B));
      } else {
        const f = arrived(i);
        if (f < 1) {
          atom.parkPoint(rad(sl.deg) + phase[sl.shell], A, PARK_R + 4);
          P.lerpVectors(A, B, ease.outCubic(f));
          scale = f > 0 ? 0.35 + 0.65 * f : 0;
        } else P.copy(B);
        if (el === 'ar' && rem[i] > 0) {
          atom.parkPoint(park[i], A);
          P.lerpVectors(B, A, ease.inOutCubic(rem[i]));
          if (rem[i] > 0.12 && gapList.length < 3) gapList.push(GAPS[gapList.length].copy(B));
        }
      }
      if (shake.i === i && shake.k) P.addScaledVector(B.normalize(), shake.k * 0.45);
      atom.setElectron(i, P, scale * k);
    }
    atom.setGaps(gapList, k);
  }

  /** The counts now: protons, neutrons, electrons in the atom, electrons in each orbit. */
  function counts() {
    const el = element();
    const a = ATOMS[el];
    const shellsNow = [0, 0, 0];
    let e = 0;
    const slots = atom.SLOTS[el];
    for (let i = 0; i < 18; i++) {
      const inAtom = el === 'cl' ? i !== STRAY || v.join > 0.5 : arrived(i) >= 1 && rem[i] < 0.5;
      if (!inAtom) continue;
      e++;
      shellsNow[slots[i].shell]++;
    }
    return { el, p: a.protons, n: a.neutrons, e, net: netCharge(a.protons, e), shells: shellsNow };
  }

  // ── labels on the picture: short ─────────────────────────────────────────────
  const tmp = V(0, 0, 0);
  const SP = { x: 0, y: 0 };
  function toScreen(p, out) {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  /** A point in the atom's plane (cm) in the world. */
  const W = (p) => atom.root.localToWorld(p.clone());
  const pxPerCm = (p) => {
    const d = camera.position.distanceTo(p);
    return stage.height / (2 * d * Math.tan(rad(camera.fov / 2)));
  };
  /** Each electron on the screen (for taps and for keeping labels off them): x, y, r in canvas pixels. */
  const eScreen = Array.from({ length: 18 }, () => ({ x: 0, y: 0, r: 0, on: false }));
  const E_BOXES = Array.from({ length: 18 }, () => ({ left: 0, top: 0, right: 0, bottom: 0 }));
  function projectElectrons() {
    const show = atom.electrons.visible && v.eVis > 0.5;
    for (let i = 0; i < 18; i++) {
      const q = eScreen[i];
      const k = atom.electronScale(i);
      q.on = show && k > 0.5 && i < atom.electronCount;
      if (!q.on) continue;
      const w = atom.root.localToWorld(tmp.copy(atom.electronAt(i)));
      const r = R_ELECTRON * k * pxPerCm(w);
      toScreen(w, q);
      q.r = r;
    }
  }
  function electronBoxes() {
    projectElectrons();
    const out = [];
    eScreen.forEach((q, i) => {
      if (!q.on) return;
      const b = E_BOXES[i];
      b.left = q.x - q.r - 2;
      b.right = q.x + q.r + 2;
      b.top = q.y - q.r - 2;
      b.bottom = q.y + q.r + 2;
      out.push(b);
    });
    return out;
  }
  /** @type {HTMLElement | null} */
  let rotateEl = null;
  function boxOf(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = stage.canvas.getBoundingClientRect();
    return r.width ? { left: r.left - c.left, top: r.top - c.top, right: r.right - c.left, bottom: r.bottom - c.top } : null;
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, note, () => action?.box(), () => action?.ringBox(), () => boxOf(rotateEl)],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const RIGHT_OF = [spot(22, 0), spot(22, -20), spot(22, 20), spot(30, -38)];
  const LEFT_OF = [spot(-22, 0), spot(-22, -20), spot(-22, 20), spot(-30, -38)];
  const ABOVE = [spot(0, -26), spot(24, -26), spot(-24, -26), spot(0, -44)];
  const BELOW = [spot(0, 26), spot(-24, 26), spot(24, 26), spot(0, 44)];
  const UP_LEFT = [spot(-24, -26), spot(-26, 0), spot(0, -30), spot(-34, -44)];
  const DOWN_RIGHT = [spot(26, 26), spot(30, 0), spot(0, 32), spot(36, 44)];
  // the nucleus's front ball on the upper right (a proton) and on the left (a neutron), for their labels
  function frontBall(el, proton, score) {
    const L = atom.LAYOUT[el];
    let best = -1;
    let bs = Number.NEGATIVE_INFINITY;
    L.pts.forEach((p, i) => {
      if (L.flags[i] !== proton) return;
      const sc = score(p);
      if (sc > bs) {
        bs = sc;
        best = i;
      }
    });
    return L.pts[best];
  }
  const PROTON_AT = { ar: frontBall('ar', true, (p) => p.x + p.y + 1.6 * p.z), cl: frontBall('cl', true, (p) => p.x + p.y + 1.6 * p.z) };
  const NEUTRON_AT = { ar: frontBall('ar', false, (p) => -p.x - 0.2 * p.y + 1.6 * p.z), cl: frontBall('cl', false, (p) => -p.x + 1.6 * p.z) };
  const RIM_UR = V(0.62, 0.62, 0.45).normalize().multiplyScalar(R_NUCLEON);
  const RIM_L = V(-0.8, 0, 0.6).normalize().multiplyScalar(R_NUCLEON);
  /** Electron i's outer rim (away from the nucleus): a label's dot goes there, never on its "−". */
  const rim = (i) => {
    if (i < 0) return W(V(0, 0, 0)); // (only for the frame before its label goes)
    const p = atom.electronAt(i).clone();
    return W(p.addScaledVector(p.clone().normalize(), R_ELECTRON * 0.95));
  };
  const learning = () => s.mode !== 'quiz';
  const settled = () => !s.busy;
  const netText = () => {
    const c = counts();
    const q = c.net === 0 ? N(0) : `${c.net > 0 ? '+' : '−'}${N(Math.abs(c.net))}`;
    return t('lbl_net', { atom: t(`atom_${c.el}`), q });
  };
  const netColor = () => {
    const c = counts();
    return c.net > 0 ? COLORS.proton : c.net < 0 ? COLORS.electron : '#343a40';
  };
  const firstRemoved = () => [...removed][0] ?? -1;
  const LABELS = {
    nucleus: {
      text: () => t('lbl_nucleus'),
      point: () => W(V(0.55, -0.83, 0).multiplyScalar(atom.nucleusRadius())),
      color: '#343a40',
      spots: [...DOWN_RIGHT, ...BELOW],
      show: () => learning() && s.step === 'intro' && settled(),
    },
    electron: {
      text: () => t('lbl_electron'),
      point: () =>
        W(
          atom
            .electronAt(SLOT_OF(2, 135))
            .clone()
            .add(V(-0.7, 0.7, 0).multiplyScalar(R_ELECTRON)),
        ),
      color: COLORS.electron,
      spots: UP_LEFT,
      show: () => learning() && s.step === 'intro' && settled(),
    },
    orbit: {
      text: () => t('lbl_orbit'),
      point: () => W(atom.slotPoint(1, 202.5, phase[1], V(0, 0, 0))),
      color: '#343a40',
      spots: [...LEFT_OF, ...BELOW],
      show: () => learning() && s.step === 'intro' && settled(),
    },
    proton: {
      text: () => t('lbl_proton'),
      point: () => W(PROTON_AT[element()].clone().add(RIM_UR)),
      color: COLORS.proton,
      spots: [...RIGHT_OF, ...ABOVE],
      show: () => learning() && s.step === 'nucleus' && settled(),
    },
    neutron: {
      text: () => t('lbl_neutron'),
      point: () => W(NEUTRON_AT[element()].clone().add(RIM_L)),
      color: '#495057',
      spots: [...LEFT_OF, ...BELOW],
      show: () => learning() && s.step === 'nucleus' && settled(),
    },
    removed: {
      text: () => t('lbl_removed'),
      point: () => rim(firstRemoved()),
      color: COLORS.electron,
      spots: [...RIGHT_OF, ...ABOVE, ...BELOW],
      show: () => learning() && s.step === 'less' && element() === 'ar' && firstRemoved() >= 0 && rem[firstRemoved()] > 0.98,
    },
    stray: {
      text: () => t('lbl_stray'),
      point: () => rim(STRAY),
      color: COLORS.electron,
      spots: [...UP_LEFT, ...LEFT_OF, ...ABOVE],
      show: () => learning() && s.step === 'more' && element() === 'cl' && v.swap > 0.99 && v.join < 0.02,
    },
    joined: {
      text: () => t('lbl_joined'),
      point: () => rim(STRAY),
      color: COLORS.electron,
      spots: [...UP_LEFT, ...LEFT_OF, ...ABOVE],
      show: () => learning() && s.step === 'more' && element() === 'cl' && v.swap > 0.99 && v.join > 0.98,
    },
    net: {
      text: netText,
      // centred over the atom, no leader (it names the whole atom)
      point: () => W(V(0, SHELL_R[2] + R_ELECTRON + 0.4, 0)),
      color: netColor,
      kind: 'net',
      spots: [spot(0, -18), spot(0, -34), spot(-80, -14), spot(80, -14)],
      show: () => learning() && ['shells', 'less', 'more'].includes(s.step) && settled() && v.swap % 1 === 0,
    },
  };
  for (let sh = 0; sh < 3; sh++)
    LABELS[`shell${sh}`] = {
      text: () => t('lbl_shell', { n: counts().shells[sh] }),
      // between two electrons: the inner orbit's on its right (its two electrons are at the top and bottom), the others
      // down and to the right, so the three counts stand apart
      point: () => W(atom.slotPoint(sh, sh === 0 ? 0 : 292.5, phase[sh], V(0, 0, 0))),
      color: '#343a40',
      kind: 'count',
      spots: [spot(0, 0)],
      optional: true, // a small phone: a count with no room hides (the result line has them)
      show: () => learning() && ['shells', 'less', 'more'].includes(s.step) && settled() && v.swap % 1 === 0,
    };
  const shown = new Map(); // id → [text, colour] as last written
  function syncLabels() {
    for (const [id, L] of Object.entries(LABELS)) {
      const want = L.show();
      if (want) {
        const text = L.text();
        const color = typeof L.color === 'function' ? L.color() : L.color;
        const was = shown.get(id);
        if (!anno.has(id)) {
          anno.add(id, {
            text,
            point: L.point,
            kind: L.kind || 'tag',
            color,
            spots: L.spots,
            optional: Boolean(L.optional),
            // a label never sits on an electron (the orbit counts sit on the orbit, between two)
            avoid: L.kind === 'count' ? [] : [electronBoxes],
          });
          shown.set(id, [text, color]);
        } else if (!was || was[0] !== text || was[1] !== color) {
          anno.update(id, { text, color });
          shown.set(id, [text, color]);
        }
      } else if (anno.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
    }
  }

  // ── camera: a gentle three-quarter view; it flies into the nucleus and back ───
  const RA = SHELL_R[2] + R_ELECTRON + 0.5;
  const RW = PARK_R + R_ELECTRON + 0.3;
  const BOX_ATOM = new THREE.Box3(V(-RA, -RA, -1.5), V(RA, RA, 1.5));
  const BOX_WIDE = new THREE.Box3(V(-RW, -RW, -1.5), V(RW, RW, 1.5));
  const BOX_NUCLEUS = new THREE.Box3(V(-3.6, -3.6, -3), V(3.6, 3.6, 3));
  const DIR = V(0.52, 0.3, 1).normalize();
  const poses = { atom: null, wide: null, nucleus: null };
  function fitPoses() {
    const d = DIR.clone();
    if (s.view === '3d' && !s.userMovedCamera) d.add(V(0.6, 0.2, 0)).normalize();
    const args = { dir: d, camera, width: stage.width, height: stage.height, margin: MARGIN };
    const wa = BOX_ATOM.clone().applyMatrix4(atom.root.matrixWorld);
    const ww = BOX_WIDE.clone().applyMatrix4(atom.root.matrixWorld);
    const wn = BOX_NUCLEUS.clone().applyMatrix4(atom.root.matrixWorld);
    const pose = (box) => {
      const f = fitPose({ box, ...args });
      return { target: f.target, dist: f.position.distanceTo(f.target), dir: d };
    };
    poses.atom = pose(wa);
    poses.wide = pose(ww);
    poses.nucleus = pose(wn);
  }
  const guided = { position: V(0, 0, 0), target: V(0, 0, 0) };
  function guidedPose() {
    const f = ease.inOutCubic(clamp01(v.focus));
    const w = ease.inOutCubic(clamp01(v.wide));
    const { atom: a0, wide: a1, nucleus: b } = poses;
    const lg = (x, y, k) => Math.exp(Math.log(x) + (Math.log(y) - Math.log(x)) * k);
    const aDist = lg(a0.dist, a1.dist, w);
    guided.target.lerpVectors(a0.target, a1.target, w).lerp(b.target, f);
    const dist = lg(aDist, b.dist, f);
    guided.position.copy(guided.target).addScaledVector(a0.dir, dist);
    return guided;
  }
  let camK = 1;
  let camFrom = null;
  function applyCamera() {
    if (s.userMovedCamera) return;
    const g = guidedPose();
    if (camK < 1 && camFrom) {
      const k = ease.inOutCubic(camK);
      camera.position.lerpVectors(camFrom.position, g.position, k);
      controls.target.lerpVectors(camFrom.target, g.target, k);
    } else {
      camera.position.copy(g.position);
      controls.target.copy(g.target);
    }
    controls.update();
  }
  /** The guided camera takes the view back, flying from wherever the student left it. */
  function takeView(duration = T.back) {
    const was = s.userMovedCamera;
    if (was) {
      s.userMovedCamera = false;
      rotate.home();
    }
    if (s.view !== 'front') {
      s.view = 'front';
      fitPoses();
      syncUI();
      emit('view', { view: s.view });
    }
    if (!was && camK >= 1) return Promise.resolve(true);
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    camK = 0;
    if (!duration) {
      camK = 1;
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        camK = k;
        stage.invalidate();
      },
      onComplete: () => {
        camK = 1;
      },
    }).finished;
  }
  function beginOrbit() {
    if (s.userMovedCamera) return;
    s.userMovedCamera = true;
    tweener.cancel('camera');
    camK = 1;
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
      emitChange();
    }
  }
  const rotate = createRotateCue(stage, {
    layer: ui.stage,
    short: `${t.num(360)}°`,
    label: t('view_rotate'),
    pulse: Boolean(o.coach),
    zoom: [0.35, 2.2],
    when: () => s.mode !== 'quiz',
    onTurn: beginOrbit,
  });
  rotateEl = rotate.el;
  function setView(view, { animate = true } = {}) {
    if (view === '3d') {
      s.view = '3d';
      s.userMovedCamera = false;
      rotate.home();
      fitPoses();
      camFrom = { position: camera.position.clone(), target: controls.target.clone() };
      camK = animate ? 0 : 1;
      syncUI();
      emit('view', { view: s.view });
      emitChange();
      if (!animate) return Promise.resolve(true);
      return tweener.animate({ key: 'camera', duration: T.back, onUpdate: (k) => (camK = k), onComplete: () => (camK = 1) }).finished;
    }
    const p = takeView(animate ? T.back : 0);
    emitChange();
    return p;
  }
  let lastTally = '';
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
    syncScene();
    atom.commit(camera.quaternion);
    // the panel's count follows the electrons as they come and go
    const c = counts();
    const key = `${c.el}|${c.e}`;
    if (key !== lastTally) {
      lastTally = key;
      syncLabels();
      writeTally();
      if (!s.busy && s.mode !== 'quiz') sheet.outcome(outcome());
    }
  });
  // the panel under the 3D (a phone held upright) or beside it: the figure's portrait rules apply only under it
  const panelEl = /** @type {HTMLElement} */ ($('.pvc-panel'));
  function syncLayout() {
    const stack = panelEl.getBoundingClientRect().top > root.getBoundingClientRect().top + 20;
    root.classList.toggle('ca-stack', stack);
  }
  stage.onResize(() => {
    syncLayout();
    fitPoses();
    syncScene();
    lastTallyWidth = 0;
    writeTally();
    refresh();
  });

  // ── taking electrons away and adding one ─────────────────────────────────────
  function tweenRem(i, to, duration) {
    const from = rem[i];
    if (!duration) {
      rem[i] = to;
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: `rem${i}`,
      duration,
      ease: ease.linear,
      onUpdate: (k) => {
        rem[i] = from + (to - from) * k;
        stage.invalidate();
      },
    }).finished;
  }
  /** Take outer electron i of argon away (it waits outside, beyond its own place on the orbit). */
  function takeAway(i, duration = T.out) {
    if (removed.has(i)) return Promise.resolve(true);
    removed.add(i);
    if (rem[i] < 0.01) park[i] = rad(atom.SLOTS.ar[i].deg) + phase[2];
    return tweenRem(i, 1, duration * (1 - rem[i])).then((ok) => {
      if (ok) done();
      return ok;
    });
  }
  function bringBack(i, duration = T.out * 0.8) {
    if (!removed.has(i)) return Promise.resolve(true);
    removed.delete(i);
    syncLabels();
    return tweenRem(i, 0, duration * rem[i]).then((ok) => {
      if (ok) done();
      return ok;
    });
  }
  /** The argon electrons taken away, all at once (a jump): these and no others. */
  function setRemoved(list) {
    for (let i = 0; i < 18; i++) tweener.cancel(`rem${i}`);
    removed.clear();
    rem.fill(0);
    for (const i of list) {
      removed.add(i);
      rem[i] = 1;
      park[i] = rad(atom.SLOTS.ar[i].deg) + phase[2];
    }
  }
  function setJoin(to, duration = T.join) {
    joined = to;
    const from = v.join;
    const goal = to ? 1 : 0;
    if (!duration) {
      v.join = goal;
      return Promise.resolve(true);
    }
    return tweener
      .animate({
        key: 'join',
        duration: duration * Math.abs(goal - from),
        ease: ease.linear,
        onUpdate: (k) => {
          v.join = from + (goal - from) * k;
          stage.invalidate();
        },
      })
      .finished.then((ok) => {
        if (ok) done();
        return ok;
      });
  }
  function shakeElectron(i) {
    shake.i = i;
    tweener.animate({
      key: 'shake',
      duration: 0.6,
      ease: ease.linear,
      onUpdate: (k) => {
        shake.k = Math.sin(k * Math.PI * 5) * (1 - k);
        stage.invalidate();
      },
      onComplete: () => {
        shake.i = -1;
        shake.k = 0;
      },
    });
  }

  // ── the steps ───────────────────────────────────────────────────────────────
  /** Moves some of the values to where they go, together, over `duration` seconds. */
  function tweenTo(to, duration, my, key = 'step') {
    const from = { ...v };
    return tweener
      .animate({
        key,
        duration,
        ease: key === 'fill' ? ease.linear : ease.inOutCubic,
        onUpdate: (k) => {
          if (my !== s.run) return;
          for (const name of Object.keys(to)) v[name] = from[name] + (to[name] - from[name]) * k;
          stage.invalidate();
        },
      })
      .finished.then((ok) => ok && my === s.run);
  }
  const wait = (sec, my) => tweener.animate({ key: 'wait', duration: sec }).finished.then((ok) => ok && my === s.run);
  function stopAll() {
    s.run++;
    for (const k of ['step', 'fill', 'wait', 'join', 'shake']) tweener.cancel(k);
    for (let i = 0; i < 18; i++) tweener.cancel(`rem${i}`);
    shake.i = -1;
    shake.k = 0;
    s.busy = false;
  }
  /** Plays the way from one step to the next (or jumps); resolves false if something else took over. */
  async function play(from, to, my, first) {
    if (from === 'intro' && to === 'nucleus') return tweenTo({ focus: 1, eVis: 0, ringVis: TARGET.nucleus.ringVis }, T.fly, my);
    if (from === 'nucleus' && to === 'shells') {
      v.fill = 0;
      v.eVis = 1;
      spin = T.fill + T.spinTail;
      const [a, b] = await Promise.all([tweenTo({ focus: 0, ringVis: 1 }, T.back, my), tweenTo({ fill: 1 }, T.fill, my, 'fill')]);
      return a && b;
    }
    if (from === 'shells' && to === 'less') {
      audio.pop?.();
      const [a, b] = await Promise.all([tweenTo({ wide: 1 }, T.out, my), takeAway(first)]);
      return a && b;
    }
    if (from === 'less' && to === 'more') {
      v.join = 0;
      joined = false;
      if (!(await tweenTo({ swap: 0.5 }, T.swap / 2, my))) return false;
      // a new atom: its orbits at their home angles (the free place upper left, where the stray electron waits)
      phase.fill(0);
      if (!(await tweenTo({ swap: 1 }, T.swap / 2, my))) return false;
      setRemoved([]);
      syncLabels(); // the stray electron's label, while it waits
      if (!(await wait(T.hold, my))) return false;
      return setJoin(true).then((ok) => ok && my === s.run);
    }
    // a jump (a step word, back, several at once): everything together
    const goal = TARGET[to];
    const goalRemoved = to === 'less' ? [first] : [];
    if (to !== 'more') {
      joined = false;
    } else joined = true;
    const remFrom = [...rem];
    const remTo = rem.map((_, i) => (goalRemoved.includes(i) ? 1 : 0));
    removed.clear();
    for (const i of goalRemoved) {
      removed.add(i);
      if (rem[i] < 0.01) park[i] = rad(atom.SLOTS.ar[i].deg) + phase[2];
    }
    const remTween = tweener.animate({
      key: 'remAll',
      duration: T.back,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        for (let i = 0; i < 18; i++) rem[i] = remFrom[i] + (remTo[i] - remFrom[i]) * k;
      },
    }).finished;
    const ok = await tweenTo(goal, T.back, my);
    await remTween;
    return ok;
  }
  async function go(step, { animate = true, first = FIRST } = {}) {
    if (!(step in TARGET)) return;
    const from = s.step;
    stopAll();
    tweener.cancel('remAll');
    const my = s.run;
    s.step = step;
    hintOff();
    takeView(animate ? T.back : 0);
    if (!animate || from === step) {
      Object.assign(v, TARGET[step]);
      phase.fill(0);
      spin = 0;
      setRemoved(step === 'less' ? [first] : []);
      joined = step === 'more';
      s.busy = false;
      done();
      return;
    }
    s.busy = true;
    refresh();
    emitChange();
    audio.tick?.();
    const ok = await play(from, step, my, first);
    if (!ok || my !== s.run) return;
    s.busy = false;
    audio.success?.();
    done();
  }
  function done() {
    syncScene();
    syncLabels();
    writeTally();
    refresh();
    emitChange();
  }

  // ── the count of charges in the panel ─────────────────────────────────────────
  let lastTallyWidth = 0;
  let lastTallyKey = '';
  const showsTally = () => ['shells', 'less', 'more'].includes(s.step) && !(s.step === 'shells' && v.fill === 0 && s.busy);
  function writeTally() {
    const on = s.mode !== 'quiz' && showsTally();
    tally.classList.toggle('ca-off', !on);
    // drawn even while hidden, so its room is always the same
    const c = counts();
    const width = Math.round(tallySvg.clientWidth || 240);
    const key = `${c.el}|${c.e}|${width}`;
    if (key === lastTallyKey && width === lastTallyWidth) return;
    lastTallyKey = key;
    lastTallyWidth = width;
    const cols = Math.max(c.p, c.e, 18);
    const labelW = 0; // the row words are HTML, beside the drawing
    const step = (width - 2) / cols;
    const r = Math.max(4, Math.min(7, step / 2 - 1));
    const rowH = Math.max(2 * r + 4, 18);
    const h = Math.round(rowH * 2 + 2);
    tallySvg.setAttribute('viewBox', `0 0 ${width} ${h}`);
    tallySvg.setAttribute('height', String(h));
    tallySvg.setAttribute('aria-label', t('aria_tally', { p: c.p, e: c.e }));
    const parts = [];
    const y1 = rowH / 2;
    const y2 = rowH * 1.5 + 2;
    const arm = r * 0.55;
    const th = Math.max(1.4, r * 0.28);
    for (let j = 0; j < cols; j++) {
      const x = labelW + step * (j + 0.5);
      const hasP = j < c.p;
      const hasE = j < c.e;
      const lone = hasP !== hasE; // a charge with no partner: the atom's net charge
      if (hasP) {
        parts.push(`<circle class="ca-dot p${lone ? ' lone' : ''}" cx="${x}" cy="${y1}" r="${r}"/>`);
        parts.push(`<path class="ca-sign" d="M${x - arm} ${y1}H${x + arm}M${x} ${y1 - arm}V${y1 + arm}" stroke-width="${th}"/>`);
      }
      if (hasE) {
        parts.push(`<circle class="ca-dot e${lone ? ' lone' : ''}" cx="${x}" cy="${y2}" r="${r}"/>`);
        parts.push(`<path class="ca-sign" d="M${x - arm} ${y2}H${x + arm}" stroke-width="${th}"/>`);
      } else if (c.el === 'ar' && j < 18) parts.push(`<circle class="ca-dot gap" cx="${x}" cy="${y2}" r="${r - 0.6}"/>`);
    }
    tallySvg.innerHTML = parts.join('');
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const ACTIONS = {
    busy: ['act_wait', '', ICONS.hand],
    intro: ['act_look', 1, ICONS.hand],
    nucleus: ['act_fill', 2, ICONS.hand],
    shells: ['act_remove', 3, ICONS.hand],
    less: ['act_add', 4, ICONS.hand],
    more: ['act_quiz', '', ICONS.chevR],
  };
  const homeBtn = /** @type {HTMLButtonElement} */ ($('[data-act="home"]'));
  const steady = { lead: '', act: '' };
  /** A charge in coulombs as HTML: 1.6 × 10<sup>−19</sup> (no sign). */
  function qHtml(n) {
    const c = coulombs(n);
    if (!c.sign) return N(0);
    if (!c.exp) return N(c.m);
    return `${N(c.m)}&nbsp;×&nbsp;${N(10)}<sup>${c.exp < 0 ? '−' : ''}${N(Math.abs(c.exp))}</sup>`;
  }
  /** The sum of the charges, coloured: (+18) + (−17) = +1. */
  function sumHtml(c) {
    const cls = c.net > 0 ? 'p' : c.net < 0 ? 'e' : 'z';
    const q = c.net === 0 ? N(0) : `${c.net > 0 ? '+' : '−'}${N(Math.abs(c.net))}`;
    return `<span class="ca-sum"><span class="ca-fp">(+${N(c.p)})</span> + <span class="ca-fe">(−${N(c.e)})</span> = <b class="ca-f${cls}">${q}</b></span>`;
  }
  function outcome() {
    const c = counts();
    const sum = sumHtml(c);
    if (s.step === 'nucleus') return t('out_nucleus', { p: c.p, n: c.n });
    if (s.step === 'shells') return t('out_shells', { sum, a: c.shells[0], b: c.shells[1], c: c.shells[2] });
    if (s.step === 'less') return c.net > 0 ? t('out_less', { sum, k: c.net, q: qHtml(c.net) }) : t('out_less_0', { sum });
    if (s.step === 'more') return c.net < 0 ? t('out_more', { sum, q: qHtml(1) }) : t('out_more_0', { sum });
    return '';
  }
  function refresh() {
    if (s.mode === 'quiz') return;
    const calm = s.step === 'intro';
    const ph = s.busy ? 'busy' : s.step;
    const leadHtml = calm
      ? `<span class="ca-long">${t('intro')}</span><span class="ca-short">${t('intro_short')}</span>`
      : s.busy
        ? steady.lead
        : t(`lead_${s.step}`);
    if (steady.lead !== leadHtml) {
      steady.lead = leadHtml;
      lead.innerHTML = leadHtml;
      lead.classList.toggle('pvc-note', calm);
      ui.learn.classList.toggle('ca-calm', calm);
    }
    sheet.outcome(calm || s.busy ? '' : outcome());
    sheet.rule(calm || s.busy ? '' : t(`rule_${s.step}`, { q: qHtml(1) }));
    sheet.choose(calm ? null : s.step);
    sheet.next({ intro: 'nucleus', nucleus: 'shells', shells: 'less', less: 'more' }[s.step] ?? null);
    const [word, step, icon] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled, icon });
    }
    if (action) {
      if (step !== '' && enabled && s.mode === 'explore' && o.coach && s.step === 'intro') action.show('scene');
      else action.hide('scene');
    }
    homeBtn.hidden = s.step === 'intro';
    homeBtn.disabled = s.busy;
    writeTally();
    syncLabels();
    stage.invalidate();
  }

  // ── the action: the big button, the ring on the nucleus, a tap on the atom ────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    const i = ORDER.indexOf(s.step);
    if (i < ORDER.length - 1) return go(ORDER[i + 1]);
    return quiz.start();
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_look',
    icon: ICONS.hand,
    target: () => atom.root.localToWorld(V(0, 0, 0)),
    radius: 30,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  // taps on the picture: a tap (not a turn of the view) on an electron, the nucleus or the atom
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  /** What a finger at p touches: { kind: 'electron', i } | { kind: 'nucleus' } | { kind: 'atom' } | null. */
  function hitAt(p) {
    projectElectrons();
    let best = -1;
    let bd = Number.POSITIVE_INFINITY;
    eScreen.forEach((q, i) => {
      if (!q.on) return;
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < Math.max(22, q.r * 1.6) && d < bd) {
        bd = d;
        best = i;
      }
    });
    if (best >= 0) return { kind: 'electron', i: best };
    const c = atom.root.localToWorld(V(0, 0, 0));
    toScreen(c, SP);
    const px = pxPerCm(c);
    const d = Math.hypot(SP.x - p.x, SP.y - p.y);
    if (d < atom.nucleusRadius() * px + 10) return { kind: 'nucleus' };
    if (d < (SHELL_R[2] + 1) * px) return { kind: 'atom' };
    return null;
  }
  function onTap(p) {
    const hit = hitAt(p);
    if (!hit) return;
    audio.unlock();
    if (s.locked) return lockedNudge();
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    const step = s.step;
    if (hit.kind === 'electron') {
      const i = hit.i;
      const el = element();
      if (step === 'less' && el === 'ar') {
        if (removed.has(i)) {
          audio.tick?.();
          bringBack(i);
        } else if (!OUTER.has(i)) {
          shakeElectron(i);
          audio.error();
          showHint(t('hint_inner'), { duration: 3200 });
        } else if (removed.size >= MAX_REMOVED) {
          audio.error();
          showHint(t('hint_max', { n: MAX_REMOVED }), { duration: 3200 });
        } else {
          audio.pop?.();
          takeAway(i);
        }
        emitChange();
        return;
      }
      if (step === 'more' && el === 'cl') {
        if (i === STRAY) {
          audio.pop?.();
          setJoin(!joined);
        } else showHint(t('hint_stray'), { duration: 2600 });
        emitChange();
        return;
      }
      if (step === 'shells') {
        if (!OUTER.has(i)) {
          shakeElectron(i);
          audio.error();
          showHint(t('hint_inner'), { duration: 3200 });
          return;
        }
        if (now() - lastAct < DOUBLE_TAP) return;
        lastAct = now();
        return go('less', { first: i });
      }
      return doAction();
    }
    if (hit.kind === 'nucleus' && (step === 'less' || step === 'more')) return showHint(t('hint_nucleus'), { duration: 2800 });
    if (step === 'less' || step === 'more') return;
    doAction();
  }
  let down = null;
  ui.canvasHost.addEventListener('pointerdown', (e) => {
    audio.unlock();
    down = { ...canvasPoint(e), t: now(), id: e.pointerId };
  });
  ui.canvasHost.addEventListener('pointerup', (e) => {
    if (!down || down.id !== e.pointerId) return;
    const p = canvasPoint(e);
    const tap = Math.hypot(p.x - down.x, p.y - down.y) < 8 && now() - down.t < 600;
    down = null;
    if (tap) onTap(p);
  });
  ui.canvasHost.addEventListener('pointercancel', () => {
    down = null;
  });
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || down) return;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      const hit = hitAt(p);
      ui.canvasHost.style.cursor = hit ? (s.locked ? 'not-allowed' : 'pointer') : '';
    });
  });

  // ── how to use, in the panel: the rotate pill, the সামনে button, a tap on the atom or an electron ──
  createHowTo(
    ui,
    t,
    [
      { kind: 'orbit', cue: rotate },
      { kind: 'front' },
      { kind: 'tap', text: t('howto_tap'), when: () => !['less', 'more'].includes(s.step), onTap: () => action?.show('scene') },
      { kind: 'tap', text: t('howto_tap_e'), when: () => ['less', 'more'].includes(s.step) },
    ],
    { stage, after: $('.pvc-rule'), collapse: true },
  );

  // ── hint line ───────────────────────────────────────────────────────────────
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

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshot() {
    const c = counts();
    return {
      step: s.step,
      atom: c.el,
      protons: c.p,
      neutrons: c.n,
      electrons: c.e,
      shells: c.shells,
      net: c.net, // in units of e (+1: one positive charge)
      charge: c.net * E_CHARGE, // C
      removed: c.el === 'ar' ? removed.size : 0,
      joined: c.el === 'cl' ? joined : false,
      busy: s.busy,
      next: { intro: 'nucleus', nucleus: 'shells', shells: 'less', less: 'more', more: 'quiz' }[s.step],
      view: s.view,
      mode: s.mode,
      question: s.mode === 'quiz' && question ? { kind: question.kind, right: question.right ?? null } : null, // the place of the right choice
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.busy, snap.mode, snap.view, snap.removed, snap.joined]);
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
  function choicesOf(items, kind, label) {
    const list = shuffle([...items]);
    if (question) question.right = list.indexOf(items[0]); // for the book page and the tests
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="ca-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  const words = (keys) => keys.map((key) => ({ key }));
  const signed = (n) => (n === 0 ? N(0) : `${n > 0 ? '+' : '−'}${N(Math.abs(n))}`);
  /** A choice's charge in coulombs as HTML (sign, mantissa × 10^exp, C). */
  const cLabel = (q) => {
    if (!q.sign) return N(0);
    const m = q.exp ? `${N(q.m)}&nbsp;×&nbsp;${N(10)}<sup>${q.exp < 0 ? '−' : ''}${N(Math.abs(q.exp))}</sup>` : N(q.m);
    return `${q.sign > 0 ? '+' : '−'}${m}&nbsp;${t('u_c')}`;
  };
  let learnSaved = null;
  let question = null;
  let picked = -1;
  /** The five questions: the unsigned balls, why neutral, what moves, electrons taken away, one electron more. */
  const KINDS = ['unsigned', 'zero', 'move', 'removed', 'extra'];
  const SCENE_OF = { unsigned: 'nucleus', zero: 'shells', move: 'intro', removed: 'less', extra: 'more' };
  const QUIZ_REMOVED = [SLOT_OF(2, 45), SLOT_OF(2, 225)];

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
        learnSaved = s.step;
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
        writeTally();
        syncLabels();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.quizKind = '';
        question = null;
        syncUI();
        go(learnSaved || 'intro', { animate: false });
      },
      async prepare(i, alive) {
        picked = -1;
        question = null;
        const kind = KINDS[i % KINDS.length];
        s.quizKind = kind;
        await go(SCENE_OF[kind], { animate: false });
        if (kind === 'removed') {
          setRemoved(QUIZ_REMOVED);
          done();
        }
        await tweener.animate({ key: 'wait', duration: 0.3 }).finished;
        if (!alive()) return null;
        const c = counts();
        question = { kind, c };
        if (kind === 'unsigned')
          return { text: t('q_unsigned'), ...choicesOf(words(['c_un_right', 'c_un_proton', 'c_un_electron', 'c_un_neg']), kind, (x) => t(x.key)) };
        if (kind === 'zero')
          return { text: t('q_zero'), ...choicesOf(words(['c_z_right', 'c_z_neutron', 'c_z_spin', 'c_z_small']), kind, (x) => t(x.key)) };
        if (kind === 'move')
          return { text: t('q_move'), ...choicesOf(words(['c_mv_right', 'c_mv_proton', 'c_mv_neutron', 'c_mv_inner']), kind, (x) => t(x.key)) };
        if (kind === 'removed') return { text: t('q_removed'), ...choicesOf(removedChoices(c.p, c.p - c.e), kind, (x) => signed(x.v)) };
        return { text: t('q_extra'), ...choicesOf(extraChoices(), kind, (x) => cLabel(x.q)) };
      },
      reveal(q, correct) {
        const { kind: k, c } = question;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note = (map, vars) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey], vars)}` : '');
        if (k === 'unsigned')
          return t('why_unsigned') + note({ c_un_proton: 'mis_un_proton', c_un_electron: 'mis_un_electron', c_un_neg: 'mis_un_neg' });
        if (k === 'zero') return t('why_zero', { n: c.p }) + note({ c_z_neutron: 'mis_z_neutron', c_z_spin: 'mis_z_spin', c_z_small: 'mis_z_small' });
        if (k === 'move') return t('why_move') + note({ c_mv_proton: 'mis_mv_proton', c_mv_neutron: 'mis_mv_neutron', c_mv_inner: 'mis_mv_inner' });
        if (k === 'removed')
          return (
            t('why_removed', { v: signed(c.net), p: c.p, e: c.e, k: c.net }) +
            note({ flip: 'mis_rm_flip', zero: 'mis_rm_zero', protons: 'mis_rm_protons' })
          );
        return (
          t('why_extra', { v: cLabel(coulombs(-1)), q: qHtml(1) }) +
          note({ flip: 'mis_ex_flip', one: 'mis_ex_one', zero: 'mis_ex_zero' }, { p: c.p, e: c.e, one: 1 })
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
  function goHome() {
    return go('intro', { animate: false });
  }
  /** One more outer electron taken away (the keys), or brought back. */
  function keyMore(dir) {
    if (s.busy) return showHint(t('hint_wait'), { duration: 2000 });
    if (s.step === 'less' && element() === 'ar') {
      if (dir > 0) {
        const i = REMOVE_ORDER.find((x) => !removed.has(x));
        if (removed.size >= MAX_REMOVED || i == null) return showHint(t('hint_max', { n: MAX_REMOVED }), { duration: 3200 });
        takeAway(i);
      } else {
        const list = [...removed];
        if (list.length) bringBack(list[list.length - 1]);
      }
    } else if (s.step === 'more' && element() === 'cl') setJoin(dir > 0);
    emitChange();
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example && s.mode === 'explore') {
      if (s.busy && b.dataset.example === s.step) return;
      go(b.dataset.example);
    }
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.act === 'home') goHome();
    else if (b.dataset.act === 'q-next') quiz.next();
    else if (b.dataset.act === 'q-again') quiz.start();
    else if (b.dataset.act === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    const tgt = /** @type {Element} */ (e.target);
    if (tgt.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(tgt.closest('button'));
    const sceneKey = ['r', 'R', 'Home', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'ArrowRight' && !onButton) {
      if (s.step !== 'more') doAction();
    } else if (k === 'ArrowLeft' && !onButton) go(ORDER[Math.max(1, ORDER.indexOf(s.step) - 1)]);
    else if (k === 'ArrowUp' && !onButton) keyMore(1);
    else if (k === 'ArrowDown' && !onButton) keyMore(-1);
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncLayout();
  fitPoses();
  syncUI();
  applyCamera();
  syncScene();
  refresh();
  // compile what later steps show before the first tap
  stage.warmUp({ show: [atom.gaps] });
  // and upload the empty place's dashes now, not on the frame that first shows one
  stage.renderer.initTexture(atom.mats.gap.alphaMap);
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
     * Change any of: step ('intro' | 'nucleus' | 'shells' | 'less' | 'more'); removed (in 'less': how many outer
     * electrons of argon are taken away, 0–3); joined (in 'more': the stray electron in chlorine's free place); view
     * ('front' | '3d'). animate: false lands at once.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.step) await go(p.step, { animate });
      if (p.removed != null && s.step === 'less') {
        const n = Math.max(0, Math.min(MAX_REMOVED, Math.round(Number(p.removed))));
        if (animate) {
          for (const i of [...removed]) if (!REMOVE_ORDER.slice(0, n).includes(i)) bringBack(i);
          await Promise.all(REMOVE_ORDER.slice(0, n).map((i) => takeAway(i)));
        } else {
          setRemoved(REMOVE_ORDER.slice(0, n));
          done();
        }
      }
      if (p.joined != null && s.step === 'more') await setJoin(Boolean(p.joined), animate ? T.join : 0);
      done();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      await setView('front', { animate: false });
      await goHome();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The atom model (the nucleus, the orbits, the electrons as they are now), in cm; exported in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'AtomModel';
      g.add(atom.exportCopy());
      stage.invalidate();
      return g;
    },
  };
}
