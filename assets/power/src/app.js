// Power (ক্ষমতা), book p120, topic 4.7: the student view. Two electric pumps in a sunny courtyard lift water from the
// underground tank to two tanks on the roof, h = 3 m up. "একই কাজ": both lift 500 kg (the same work W = mgh), the
// big pump in half the time, so its power is twice as much: P = W/t, live from the stopwatches. "একই সময়": both run
// 15 s, the big pump does twice the work. "বাতি": the book's 100 W bulb over the door uses 100 J each second (1 W =
// 1 J/s), next to the book's 1000 MW power plant. The panel is the kit's clean sheet (one action, one result as a small
// P = W ÷ t table, one rule): docs/student-kit.md. A 5-question test.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAction } from '@shared/student/action.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { parts } from './build.js';
import { fitPose } from './camera.js';
import { createI18n, group } from './i18n.js';
import {
  BULB,
  BULB_TIME,
  bulbAt,
  choicesFrom,
  energyMistakes,
  FULL,
  G,
  H,
  PUMPS,
  plain,
  plan,
  power,
  powerMistakes,
  readingAt,
  roundTo,
  SAME_TIME,
  SPEED,
  shuffle,
  workToLift,
} from './power.js';
import { createPump } from './pump.js';
import { createScene, LAYOUT, ROOF } from './scene.js';
import { createTank, TANK } from './tank.js';

export const DEFAULTS = {
  example: 'work', // 'work' (same work, different times) | 'time' (same time, different work) | 'bulb' (100 W bulb)
  at: '', // seconds into the run (scene time), held still (pictures); empty: before the run
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring on the pumps pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const EXAMPLES = ['work', 'time', 'bulb'];
const IDS = /** @type {const} */ (['small', 'big']);
const COLORS = { W: '#237a35', t: '#c2255c', P: '#862e9c', h: '#1c6fd9' };
const PUMP_COLORS = { small: '#1f74c9', big: '#d4382c' };
const PUMP_SIZE = { small: 1, big: 1.32 };
const ELEVATION = 2; // degrees: the front view stands in the courtyard and looks up a little at the roof tanks
const AZIMUTH = -9; // degrees: from a little to the left, so the pumps and tanks show their depth
const VIEW_3D = new THREE.Vector3(-0.55, 0.32, 0.9).normalize();

/** A stopwatch drawn in SVG for a label (the font has no clock glyph); its hand at `sec` on a 60 s dial. */
function stopwatchSvg(sec, color) {
  const a = ((sec % 60) / 60) * Math.PI * 2;
  const x = 12 + Math.sin(a) * 6.2;
  const y = 14 - Math.cos(a) * 6.2;
  return `<svg class="pw-sw" viewBox="0 0 24 26" aria-hidden="true"><rect x="10" y="0.6" width="4" height="3" rx="1" fill="${color}"/><circle cx="12" cy="14" r="9.4" fill="#fff" stroke="${color}" stroke-width="2.2"/><path d="M12 14 L${x.toFixed(2)} ${y.toFixed(2)}" stroke="${color}" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="14" r="1.5" fill="${color}"/></svg>`;
}

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const NG = (x) => N(group(x));

  root.classList.add('pvc', 'pw');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the panel: the examples, one action, the P = W ÷ t table, one rule ────────
  const sheetHtml = cleanSheet(t, {
    examples: {
      label: 'examples',
      items: EXAMPLES.map((id) => ({ id, label: `ex_${id}` })),
    },
    quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
    lines: { action: 1, rule: 3 }, // the result's table keeps its own height (a header and two rows)
  });
  const ui = buildStudentShell(root, t, { learn: sheetHtml, learnAlign: 'start' });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  const outcomeEl = $('.pvc-outcome');
  outcomeEl.setAttribute('aria-label', t('calc'));

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 42, near: 0.1, far: 400, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 0.8;
  controls.maxDistance = 40;
  controls.enablePan = false;
  controls.enableRotate = false;
  controls.maxPolarAngle = Math.PI * 0.49; // never under the courtyard
  // a vivid sunny sky: deep blue at the top, pale near the horizon
  if (o.bg !== 'transparent') {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#1d6fd1');
    g.addColorStop(0.5, '#4fa3e8');
    g.addColorStop(0.85, '#a9d8f6');
    g.addColorStop(1, '#d8eefb');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    const sky = new THREE.CanvasTexture(c);
    sky.colorSpace = THREE.SRGBColorSpace;
    scene.background = sky;
    scene.fog = new THREE.Fog('#d3e8f6', 16, 95); // a little haze on the neighbourhood, none on the house
  }
  scene.add(new THREE.HemisphereLight('#dff0ff', '#b98a55', 0.9));
  const key = new THREE.DirectionalLight('#fff3dc', 1.25);
  key.position.set(-6, 12, 9);
  scene.add(key);

  const world = new THREE.Group();
  world.name = 'Power';
  scene.add(world);
  const pumps = {};
  const tanks = {};
  for (const id of IDS) {
    pumps[id] = createPump({ color: PUMP_COLORS[id], size: PUMP_SIZE[id], name: `Pump_${id}`, cableSide: id === 'big' ? 1 : -1 }); // cables from the wall
    // the small pump's suction faces right (+x) toward the hatch, the big one's left
    pumps[id].root.position.set(LAYOUT.pumpX[id], 0, LAYOUT.pumpZ);
    if (id === 'big') pumps[id].root.rotation.y = Math.PI;
    tanks[id] = createTank({ name: `RoofTank_${id}`, accent: PUMP_COLORS[id] });
    tanks[id].root.position.set(LAYOUT.pumpX[id], ROOF, LAYOUT.tankZ);
    world.add(pumps[id].root, tanks[id].root);
  }
  const place3d = createScene({ pumps, tanks });
  world.add(place3d.root);
  const bulb = place3d.bulb;

  // h: a bold arrow up from the courtyard to the roof tanks' floor, with a foot on the ground and a dashed guide back
  // to the tank at the top; a white outline (the inside of a slightly bigger copy) keeps it clear on the yellow wall,
  // the red bricks and the sky alike. Two meshes, no shadows.
  const hCore = parts();
  const hRim = parts();
  const SHAFT = 0.03;
  const HEAD = 0.22;
  const PAD = 0.014;
  const foot = new THREE.Vector3(LAYOUT.hArrowX, 0.02, LAYOUT.pumpZ);
  const shaftLen = H - 0.02 - HEAD;
  hCore.add(new THREE.CylinderGeometry(SHAFT, SHAFT, shaftLen, 16), foot.x, foot.y + shaftLen / 2, foot.z);
  hRim.add(new THREE.CylinderGeometry(SHAFT + PAD, SHAFT + PAD, shaftLen + PAD, 16), foot.x, foot.y + shaftLen / 2, foot.z);
  hCore.add(new THREE.ConeGeometry(0.085, HEAD, 24), foot.x, H - HEAD / 2, foot.z);
  hRim.add(new THREE.ConeGeometry(0.085 + PAD * 1.6, HEAD + PAD * 2.6, 24), foot.x, H - HEAD / 2 - PAD * 0.4, foot.z);
  hCore.add(new THREE.BoxGeometry(0.26, 0.03, 0.05), foot.x, foot.y + 0.015, foot.z); // the foot: where h starts
  hRim.add(new THREE.BoxGeometry(0.26 + 2 * PAD, 0.03 + 2 * PAD, 0.05 + 2 * PAD), foot.x, foot.y + 0.015, foot.z);
  const guidePts = [
    new THREE.Vector3(LAYOUT.hArrowX, H, LAYOUT.pumpZ),
    new THREE.Vector3(LAYOUT.hArrowX, H, LAYOUT.tankZ),
    new THREE.Vector3(LAYOUT.pumpX.small - TANK.R, H, LAYOUT.tankZ),
  ];
  const up = new THREE.Vector3(0, 1, 0);
  const dash = new THREE.Vector3();
  const rot = new THREE.Quaternion();
  const eul = new THREE.Euler();
  for (let i = 0; i < guidePts.length - 1; i++) {
    const a = guidePts[i];
    const b = guidePts[i + 1];
    const len = a.distanceTo(b);
    dash.subVectors(b, a).normalize();
    eul.setFromQuaternion(rot.setFromUnitVectors(up, dash));
    for (let d = i === 0 ? 0.12 : 0; d < len - 0.02; d += 0.16) {
      const seg = Math.min(0.09, len - d);
      const p = a.clone().addScaledVector(dash, d + seg / 2);
      hCore.add(new THREE.CylinderGeometry(0.012, 0.012, seg, 8), p.x, p.y, p.z, eul.x, eul.y, eul.z);
      hRim.add(new THREE.CylinderGeometry(0.02, 0.02, seg + 0.016, 8), p.x, p.y, p.z, eul.x, eul.y, eul.z);
    }
  }
  const hArrow = new THREE.Group();
  hArrow.name = 'HeightH';
  hArrow.add(
    hCore.mesh(
      new THREE.MeshStandardMaterial({ name: 'HeightArrow', color: COLORS.h, emissive: COLORS.h, emissiveIntensity: 0.25, roughness: 0.45 }),
      'HeightArrow',
    ),
    hRim.mesh(new THREE.MeshBasicMaterial({ name: 'HeightOutline', color: '#ffffff', side: THREE.BackSide }), 'HeightOutline'),
  );
  world.add(hArrow);

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);

  if (o.shadow && o.bg !== 'transparent') {
    // soft sun shadows, the shadow camera fitted closely round what casts and takes them in view (the house front,
    // the courtyard, the props by the walls), so a 1024 map is as sharp as a 2048 one on the old loose fit. Which
    // parts cast and take shadows is set where they are built (the ground and the far scenery only take them, or not).
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    const sun = new THREE.DirectionalLight('#ffffff', 0.7);
    sun.position.set(-5, 11, 8);
    sun.target.position.set(0, 1.5, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 3;
    sun.shadow.blurSamples = 8;
    sun.shadow.bias = -0.0005;
    scene.add(sun, sun.target);
    fitShadow(sun, new THREE.Box3(new THREE.Vector3(-7.6, -0.1, -1.6), new THREE.Vector3(7.6, ROOF + 1.7, 4.6)));
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── the state: every line, label, tank and pump is drawn from it ─────────────
  const s = {
    example: EXAMPLES.includes(o.example) ? o.example : 'work',
    phase: 'ready', // 'ready' | 'run' | 'done'
    t: 0, // scene seconds since the switch went on (the pumps' runs are shown SPEED times faster)
    paused: false,
    mass: FULL, // kg each pump fills in 'work' (the test changes it)
    T: SAME_TIME, // s each pump runs in 'time' (the test changes it)
    bulbP: BULB, // W (the test changes it)
    bulbT: BULB_TIME, // s
    runs: { work: 0, time: 0, bulb: 0 },
    labels: 'full', // 'full' | 'noP' (the test: the pumps' powers hidden) | 'noE' (the bulb's energy hidden)
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    lastAct: -1e9,
  };
  const isBulb = () => s.example === 'bulb';
  const planNow = () => plan(s.example === 'time' ? 'time' : 'work', s.mass, s.T);
  const total = () => (isBulb() ? s.bulbT : planNow().total);

  /** Where everything is now: each pump's reading, the bulb's. */
  function now() {
    const p = planNow();
    const tt = isBulb() || s.phase === 'ready' ? 0 : s.phase === 'done' ? p.total : s.t;
    const pumpsNow = {};
    for (const id of IDS) pumpsNow[id] = { ...readingAt(p[id], tt), P: p[id].P, plan: p[id] };
    const bt = !isBulb() || s.phase === 'ready' ? 0 : s.phase === 'done' ? s.bulbT : s.t;
    return { pumps: pumpsNow, bulb: bulbAt(bt, s.bulbP, s.bulbT) };
  }

  // ── what the student sees ──────────────────────────────────────────────────
  let action = null;
  function place(dt = 0, n = now()) {
    const pumpScene = !isBulb();
    for (const id of IDS) {
      const r = n.pumps[id];
      tanks[id].setMass(pumpScene ? r.mSmooth : 0);
      const on = pumpScene && s.phase === 'run' && r.running; // a still held mid-run still shows the water flowing
      tanks[id].pour(on, dt);
      pumps[id].run(on, dt * (s.paused ? 0 : 1), s.t);
      place3d.switches(id, pumpScene && s.phase === 'run' && r.running);
    }
    bulb.set(isBulb() && s.phase === 'run');
    labels(n);
    panel(n);
    stage.invalidate();
  }

  // ── labels on the picture ──────────────────────────────────────────────────
  let flights = 0;
  /** Labels keep their spot while it stays clear: after the camera has moved to a new view, let them choose again. */
  function relabel() {
    for (const id of shown.keys()) anno.remove(id);
    shown.clear();
    place();
  }
  // the h arrow's shaft on the screen: labels keep off it (the pump's name never sits on the arrow)
  const ha = new THREE.Vector3();
  const hb = new THREE.Vector3();
  function arrowBox() {
    if (!hArrow.visible) return null;
    ha.set(LAYOUT.hArrowX, 0, LAYOUT.pumpZ).project(camera);
    hb.set(LAYOUT.hArrowX, H, LAYOUT.pumpZ).project(camera);
    const x = (ha.x * 0.5 + 0.5) * stage.width;
    return { left: x - 7, right: x + 7, top: (-hb.y * 0.5 + 0.5) * stage.height, bottom: (-ha.y * 0.5 + 0.5) * stage.height };
  }
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint, () => action?.ringBox(), arrowBox] });
  const shown = new Map();
  function label(id, on, text, point, color, spots, optional = false) {
    if (!on) {
      if (shown.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
      return;
    }
    if (!shown.has(id)) {
      anno.add(id, { text, point: () => point, color, spots, kind: 'part', optional });
      shown.set(id, text);
    } else if (shown.get(id) !== text) {
      anno.setText(id, text);
      shown.set(id, text);
    }
  }
  const pts = {
    tank: { small: new THREE.Vector3(), big: new THREE.Vector3() },
    pump: { small: new THREE.Vector3(), big: new THREE.Vector3() },
    h: new THREE.Vector3(LAYOUT.hArrowX, H * 0.55, LAYOUT.pumpZ),
    bulb: new THREE.Vector3(),
  };
  for (const id of IDS) {
    pts.tank[id].set(LAYOUT.pumpX[id], ROOF + TANK.FLOOR + TANK.BODY * 0.55, LAYOUT.tankZ + TANK.R);
    // at the pump's outer end (its fan cover), so the name sits outside the action's ring, beside the pump
    pts.pump[id].set(LAYOUT.pumpX[id] + (id === 'small' ? -0.36 : 0.48), 0.24, LAYOUT.pumpZ);
  }
  bulb.group.getWorldPosition(pts.bulb);
  // the stopwatch labels sit outside the tanks (left of the left one, right of the right one), or above
  const SIDE = {
    small: [
      { dx: -32, dy: 0 },
      { dx: 0, dy: -58 },
      { dx: 32, dy: 0 },
      { dx: 34, dy: -44 },
      { dx: 0, dy: 72 },
    ],
    big: [
      { dx: 32, dy: 0 },
      { dx: 0, dy: -58 },
      { dx: -32, dy: 0 },
      { dx: -34, dy: -44 },
      { dx: 0, dy: 72 },
    ],
  };
  const OUTSIDE = {
    small: [
      { dx: -20, dy: 0 },
      { dx: 0, dy: 44 },
      { dx: 0, dy: -48 },
      { dx: 16, dy: -44 }, // on a short phone: over the wall above the pump (the ring is gone once it runs)
    ],
    big: [
      { dx: 20, dy: 0 },
      { dx: 0, dy: 44 },
      { dx: 0, dy: -48 },
      { dx: -16, dy: -44 },
    ],
  };
  function labels(n) {
    const pumpScene = !isBulb();
    for (const id of IDS) {
      const r = n.pumps[id];
      const time = `${stopwatchSvg(r.t, COLORS.t)}<b class="pw-l-t">${t('l_time', { t: r.t })}</b>`;
      const mass = `<small class="pw-l-m">${t('l_mass', { m: group(plain(s.phase === 'ready' ? 0 : r.m)) })}</small>`;
      label(`tank-${id}`, pumpScene, `<span class="pw-l">${time}${mass}</span>`, pts.tank[id], COLORS.t, SIDE[id]);
      const showP = s.labels === 'full' && s.phase === 'done';
      const name = `${t(`pump_${id}`)}${showP ? ` <b class="pw-l-P">${t('l_P', { P: PUMPS[id] })}</b>` : ''}`;
      label(`pump-${id}`, pumpScene, name, pts.pump[id], PUMP_COLORS[id], OUTSIDE[id], true);
    }
    label('h', pumpScene, t('l_h', { h: H }), pts.h, COLORS.h, [
      { dx: -44, dy: 0 },
      { dx: 44, dy: 0 },
    ]);
    const b = n.bulb;
    const bulbTime = `${stopwatchSvg(b.t, COLORS.t)}<b class="pw-l-t">${t('l_time', { t: b.t })}</b>`;
    const energy = s.phase === 'ready' || s.labels === 'noE' ? '' : `<small class="pw-l-E">${t('l_energy', { E: group(b.E) })}</small>`;
    label(
      'bulb',
      isBulb(),
      `<span class="pw-l"><b class="pw-l-name">${t('l_bulb', { P: s.bulbP })}</b>${bulbTime}${energy}</span>`,
      pts.bulb,
      COLORS.P,
      [
        { dx: 40, dy: 0 },
        { dx: -40, dy: 0 },
        { dx: 0, dy: 90 },
      ],
    );
    hArrow.visible = pumpScene;
  }

  // ── the panel: P = W ÷ t for each pump (or the bulb, and the book's power plant) ──
  const cell = (cls, html) => `<span class="${cls}">${html}</span>`;
  function row(name, W, tt, P, ghost = false) {
    const g = ghost ? ' pw-ghost' : '';
    return `${cell(`pw-name${g}`, name)}${cell(`c-W${g}`, W)}${cell(`pw-op${g}`, '÷')}${cell(`c-t${g}`, tt)}${cell(`pw-op${g}`, '=')}<b class="c-P${g}"${ghost ? ' aria-hidden="true"' : ''}>${P}</b>`;
  }
  const q = (u) => `?${u ? ` ${u}` : ''}`;
  function panel(n) {
    const head = `${cell('pw-name', '')}${cell('pw-h c-W', `${t('col_W')} <i>W</i>`)}${cell('pw-op', '')}${cell('pw-h c-t', `${t('col_t')} <i>t</i>`)}${cell('pw-op', '')}${cell('pw-h c-P', `${t('col_P')} <i>P</i>`)}`;
    let rows = '';
    if (isBulb()) {
      const b = n.bulb;
      const known = s.phase !== 'ready' && b.t > 0;
      rows += row(t('row_bulb'), known ? `${NG(b.E)} J` : q('J'), known ? `${N(b.t)} s` : q('s'), `${N(s.bulbP)} W`);
      // the book's power plant once the bulb has shown what a watt is (until then the row is kept, hidden)
      rows += row(t('row_plant'), `${N(1000)} × ${N('10<sup>6</sup>')} J`, `${N(1)} s`, `${N(1000)} MW`, s.phase !== 'done');
    } else {
      const p = planNow();
      for (const id of IDS) {
        const r = n.pumps[id];
        const known = s.phase !== 'ready' && r.t > 0;
        const W = known ? `${NG(r.W)} J` : s.example === 'work' ? `${NG(p[id].W)} J` : q('J');
        const tt = known ? `${N(r.t)} s` : s.example === 'time' ? `${N(p[id].t)} s` : q('s');
        const P = known ? `${NG(power(r.W, r.t))} W` : q('W');
        rows += row(t(`pump_${id}`), W, tt, P);
      }
    }
    sheet.outcome(`<span class="pw-grid">${head}${rows}</span>`);

    // the rule, growing with what the student has found out
    const ph = s.phase;
    let rule;
    if (s.example === 'work') {
      rule =
        ph === 'ready'
          ? t('rule_work_ready', { m: s.mass, h: H, g: G, W: group(workToLift(s.mass)) })
          : ph === 'run'
            ? t('rule_work_run', { k: SPEED })
            : t('rule_work_done');
    } else if (s.example === 'time') {
      rule = ph === 'ready' ? t('rule_time_ready', { T: s.T }) : ph === 'run' ? t('rule_time_run', { k: SPEED }) : t('rule_time_done');
    } else {
      rule = ph === 'ready' ? t('rule_bulb_ready', { P: s.bulbP }) : ph === 'run' ? t('rule_bulb_run', { P: s.bulbP }) : t('rule_bulb_done');
    }
    sheet.rule(rule);

    sheet.choose(s.example);
    const nx = nextAction();
    sheet.next(nx.example !== s.example ? nx.example : null);
    action?.set({ label: nx.label, step: nx.step, enabled: s.phase !== 'run' && !s.locked });
  }

  /** What the big button does next: { label, step, example }. Steps count the examples the student has tried. */
  function nextAction() {
    const tried = EXAMPLES.filter((e) => s.runs[e] > 0).length;
    const ex = s.example;
    if (s.phase === 'done') {
      const untried = EXAMPLES.find((e) => s.runs[e] === 0 && e !== ex); // never "try" the one just finished
      if (untried) return { label: `act_try_${untried}`, step: tried + 1, example: untried };
      return { label: 'act_again', step: '', example: ex };
    }
    return { label: ex === 'bulb' ? 'act_bulb' : 'act_run', step: s.runs[ex] === 0 ? tried + 1 : '', example: ex };
  }

  // ── the run ─────────────────────────────────────────────────────────────────
  function snapshot() {
    const n = now();
    const pumpsOut = {};
    for (const id of IDS) {
      const r = n.pumps[id];
      pumpsOut[id] = { P: r.P, t: r.t, m: r.m, W: r.W, running: r.running, done: r.done };
    }
    return {
      example: s.example,
      phase: s.phase,
      t: roundTo(s.t, 0.001),
      total: total(),
      mass: s.mass,
      T: s.T,
      h: H,
      pumps: pumpsOut,
      bulb: { P: s.bulbP, t: n.bulb.t, E: n.bulb.E, on: isBulb() && s.phase === 'run' },
      runs: { ...s.runs },
      next: (({ label, step, example }) => ({ label, step, example }))(nextAction()),
      mode: s.mode,
      view: s.view,
      locked: s.locked,
      paused: s.paused,
    };
  }
  let lastEmit = '';
  /** Tells the bridge when a stopwatch has moved on a whole second (or the example or phase changed). */
  function changed(n = now()) {
    const k = `${s.example}|${s.phase}|${n.pumps.small.t}|${n.pumps.big.t}|${n.bulb.t}`;
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snapshot());
    }
  }

  function finishRun() {
    s.phase = 'done';
    s.t = total();
    s.runs[s.example]++;
    audio.success();
    place();
    emit('stop', snapshot());
    changed();
  }
  let lastSec = { small: 0, big: 0 };
  stage.addTicker((dt) => {
    if (s.phase !== 'run' || s.paused) return false;
    s.t += dt * (isBulb() ? 1 : SPEED);
    if (s.t >= total()) {
      finishRun();
      return false;
    }
    // a soft tick as each pump's tank fills
    const n = now();
    for (const id of IDS) {
      if (!isBulb() && n.pumps[id].done && lastSec[id] !== -1) {
        lastSec[id] = -1;
        audio.tick();
      }
    }
    place(dt, n);
    changed(n);
    return true;
  });

  /** Back to the start of the current example (no motion). */
  function toReady() {
    s.phase = 'ready';
    s.t = 0;
    s.paused = false;
    lastSec = { small: 0, big: 0 };
    place();
    changed();
  }
  function startRun() {
    if (s.locked) return lockedNudge();
    s.t = 0;
    s.paused = false;
    s.phase = 'run';
    s.lastAct = performance.now();
    lastSec = { small: 0, big: 0 };
    audio.unlock();
    audio.pop();
    place();
    emit('run', snapshot());
    changed();
  }
  /** Seconds into the run (scene time), held still (for pictures and the bridge). */
  function holdAt(sec) {
    if (sec >= total()) {
      s.t = total();
      s.phase = 'done';
      s.paused = false;
    } else {
      s.t = Math.max(0, sec);
      s.phase = 'run';
      s.paused = true;
    }
    place();
    changed();
  }

  /** The big button (and a tap on a pump or the bulb). */
  function act() {
    if (s.locked) return lockedNudge();
    if (performance.now() - s.lastAct < 400) return; // a double tap never undoes the first
    if (s.phase === 'run' && !s.paused) return;
    const nx = nextAction();
    if (nx.example !== s.example) setExample(nx.example);
    startRun();
  }

  function setExample(ex, { animate = true } = {}) {
    s.example = EXAMPLES.includes(ex) ? ex : 'work';
    toReady();
    const token = ++flights;
    fitCamera(animate ? 0.8 : 0).then(() => token === flights && relabel());
    emit('example', { example: s.example });
  }

  // ── camera: the pumps, the arrow and the tanks; or the bulb over the door ─────
  const box = new THREE.Box3();
  function viewPose() {
    if (isBulb()) {
      const b = LAYOUT.bulb;
      // the bulb with the top of the door under it and the wall round it, so it reads as the lamp over the door
      box.min.set(b.x - 0.6, b.y - 0.95, b.z - 0.2);
      box.max.set(b.x + 0.6, b.y + 0.3, b.z + 0.1);
    } else {
      box.min.set(LAYOUT.hArrowX - 0.25, -0.05, LAYOUT.tankZ - TANK.R);
      box.max.set(LAYOUT.pumpX.big + 0.75, ROOF + TANK.FLOOR + TANK.BODY + 0.3, LAYOUT.pumpZ + 0.3);
    }
    const e = THREE.MathUtils.degToRad(ELEVATION);
    const az = THREE.MathUtils.degToRad(AZIMUTH);
    const dir = s.view === '3d' ? VIEW_3D : new THREE.Vector3(Math.sin(az) * Math.cos(e), Math.sin(e), Math.cos(az) * Math.cos(e));
    // the corner buttons are top right: a wide view keeps the tanks (in the middle) clear of them without a margin
    const wide = stage.width / Math.max(1, stage.height) > 1.6;
    const top = wide && !isBulb() ? 16 : Math.min(58, stage.height * 0.2);
    const bottom = wide && !isBulb() ? 12 : isBulb() ? 24 : 34; // room for the pumps' names under them
    const side = isBulb() ? Math.min(110, stage.width * 0.2) : 14; // room for the bulb's label beside it
    return fitPose({ box, dir, camera, width: stage.width, height: stage.height, margin: { top, bottom, side } });
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
      },
    }).finished;
  }
  function fitCamera(duration = 0.7) {
    if (s.userMovedCamera) return Promise.resolve(true);
    return flyTo(viewPose(), duration);
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    controls.enableZoom = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(viewPose(), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    place();
  });

  // ── taps on a pump (or the bulb) do the action ──────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      const r = stage.canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const pickable = isBulb() ? [bulb.hit] : [pumps.small.hit, pumps.big.hit];
      if (!raycaster.intersectObjects(pickable, false).length) return;
      e.stopPropagation();
      e.preventDefault();
      act();
    },
    true,
  );

  function lockedNudge() {
    ui.hintText.textContent = t('q_locked');
    ui.hint.classList.add('show');
    clearTimeout(lockedNudge.timer);
    lockedNudge.timer = setTimeout(() => ui.hint.classList.remove('show'), 3000);
    audio.error();
  }

  // ── the action: the big button, and its numbered badge in a ring round the pumps (or the bulb) ─
  const pumpsBox = new THREE.Box3();
  const tmpBox = new THREE.Box3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_run',
    // no ring once the run is over: nothing covers the results (the button offers the next step)
    target: () => {
      if (s.phase === 'done') return null;
      if (isBulb()) return bulb.mesh;
      pumpsBox.makeEmpty();
      for (const id of IDS) pumpsBox.union(tmpBox.copy(pumps[id].ringBox).applyMatrix4(pumps[id].root.matrixWorld));
      return pumpsBox;
    },
    pad: 8,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // ── the test ────────────────────────────────────────────────────────────────
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const numLabel = (unit) => (c) => `${NG(c.value)}<small> ${unit}</small>`;
  let saved = null;
  /** Set a question's scene at once: the example, its numbers, the run finished, labels. */
  function questionScene(ex, { mass = FULL, T = SAME_TIME, bulbP = BULB, bulbT = BULB_TIME, labels: lm = 'full' } = {}) {
    Object.assign(s, { example: ex, mass, T, bulbP, bulbT, labels: lm, userMovedCamera: false });
    holdAt(1e9);
    flyTo(viewPose(), 0);
    relabel();
  }
  const QUESTIONS = {
    P() {
      const mass = pick([300, 400, 500]);
      const id = pick(IDS);
      const other = id === 'small' ? 'big' : 'small';
      questionScene('work', { mass, labels: 'noP' });
      const p = plan('work', mass);
      const W = workToLift(mass);
      const choices = choicesFrom(PUMPS[id], powerMistakes(mass, p[id].t, p[other].t));
      return {
        text: t('q_P', { name: t(`of_${id}`), g: G }),
        choices,
        label: numLabel('W'),
        reveal: () => t('r_P', { P: PUMPS[id], m: mass, g: G, h: H, W: group(W), t: p[id].t }),
        after: 'full',
      };
    },
    same() {
      const T = pick([6, 9, 12]); // whole kilograms in both tanks, and the big one never overflows
      questionScene('time', { T, labels: 'noP' });
      const p = plan('time', FULL, T);
      const choices = [
        { html: t('c_same_right'), why: null },
        { html: t('c_same_eq'), why: 'm_same_eq' },
        { html: t('c_same_work'), why: 'm_same_work' },
        { html: t('c_same_half'), why: 'm_same_half' },
      ];
      return { text: t('q_same', { T }), choices, reveal: () => t('r_same', { T, mb: plain(p.big.m), ms: plain(p.small.m) }), after: 'full' };
    },
    bulb() {
      const P = pick([40, 60, 100]);
      const tt = pick([5, 8, 12, 15]);
      questionScene('bulb', { bulbP: P, bulbT: tt, labels: 'noE' });
      const choices = choicesFrom(P * tt, energyMistakes(P, tt));
      return {
        text: t('q_bulb'),
        choices,
        label: numLabel('J'),
        reveal: () => t('r_bulb', { E: group(P * tt), P, t: tt }),
        after: 'full',
      };
    },
    unit() {
      const id = pick(IDS);
      questionScene('work', { labels: 'full' });
      const P = PUMPS[id];
      const choices = [
        { html: t('c_u_right', { P }), why: null },
        { html: t('c_u_total', { P }), why: 'm_u_total' },
        { html: t('c_u_kg', { P }), why: 'm_u_kg' },
        { html: t('c_u_time', { P }), why: 'm_u_time' },
      ];
      return { text: t('q_unit', { name: t(`of_${id}`), P }), choices, reveal: () => t('r_unit', { P }) };
    },
    plant() {
      questionScene('bulb', { labels: 'full' });
      const MW = 1000;
      const choices = [
        { html: t('c_pl_right', { MW }), why: null },
        { html: t('c_pl_M', { MW }), why: 'm_pl_M' },
        { html: t('c_pl_k', { MW }), why: 'm_pl_k' },
        { html: t('c_pl_W', { MW }), why: 'm_pl_W' },
      ];
      return { text: t('q_plant', { MW }), choices, reveal: () => t('r_plant', { MW }) };
    },
  };
  const ORDER = ['P', 'same', 'bulb', 'unit', 'plant'];
  let currentQ = null;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: ORDER.length,
    lines: { text: 2, feedback: 3 },
    action,
    hooks: {
      enter() {
        saved = { example: s.example, phase: s.phase === 'done' ? 'done' : 'ready' };
        s.mode = 'quiz';
        s.locked = true;
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        currentQ = null;
        Object.assign(s, { mass: FULL, T: SAME_TIME, bulbP: BULB, bulbT: BULB_TIME, labels: 'full' });
        if (saved) {
          s.example = saved.example;
          if (saved.phase === 'done') holdAt(1e9);
          else toReady();
        }
        s.userMovedCamera = false;
        const token = ++flights;
        fitCamera(0.6).then(() => token === flights && relabel());
        syncUI();
        place();
      },
      prepare(i, alive) {
        if (!alive()) return null;
        const qq = QUESTIONS[ORDER[i]]();
        // the right choice is always the first made: shuffle their order, keep the index
        const order = shuffle(qq.choices.map((_, j) => j));
        currentQ = qq;
        place();
        return {
          text: qq.text,
          choices: order,
          expected: 0,
          tolerance: 0.5,
          label: (j) => (qq.label ? qq.label(qq.choices[j]) : `<span class="pw-opt">${qq.choices[j].html}</span>`),
          meta: { question: ORDER[i], example: s.example },
        };
      },
      reveal(_q, correct, picked) {
        const qq = currentQ;
        if (!qq) return '';
        if (qq.after) {
          s.labels = qq.after;
          place();
        }
        const why = !correct && qq.choices[picked.value]?.why;
        return `${qq.reveal()}${why ? ` <span class="pw-why">${t(why)}</span>` : ''}`;
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
    if (s.mode !== 'quiz') ui.hint.classList.remove('show');
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.example) {
      if (s.locked) lockedNudge();
      else if (b.dataset.example !== s.example || s.phase === 'run') setExample(b.dataset.example);
    }
    const a = b.dataset.act;
    if (a === 'q-next') quiz.next();
    if (a === 'q-again') quiz.start();
    if (a === 'home') {
      if (s.locked) lockedNudge();
      else toReady();
    }
    if (a === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if (/** @type {Element} */ (e.target).closest?.('.pvc-examples, .pvc-quiz, button')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      act();
    }
  });

  // ── start ───────────────────────────────────────────────────────────────────
  const at = o.at === '' || o.at == null ? null : Number(o.at);
  if (at != null && Number.isFinite(at)) holdAt(at);
  else place();
  setView(s.view, { animate: false });
  relabel();
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
    getState: () => snapshot(),
    /**
     * Change any of: example ('work' | 'time' | 'bulb'), run (true: switch on), at (scene seconds into the run, held
     * still), done (true: the run finished), home (true: back to the start), paused, view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.example && p.example !== s.example) setExample(p.example, { animate });
      if (p.home) toReady();
      if (p.at != null) holdAt(Number(p.at));
      if (p.done) holdAt(1e9);
      // a run finished from outside counts as run (the big button then offers the next example)
      if (s.phase === 'done' && (p.done || p.at != null) && !s.runs[s.example]) {
        s.runs[s.example] = 1;
        place();
      }
      if (p.paused != null && s.phase === 'run') s.paused = Boolean(p.paused);
      if (p.run && (s.phase !== 'run' || s.paused)) startRun();
      stage.invalidate();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      Object.assign(s, { example: 'work', mass: FULL, T: SAME_TIME, bulbP: BULB, bulbT: BULB_TIME, labels: 'full' });
      s.runs = { work: 0, time: 0, bulb: 0 };
      toReady();
      await setView('front');
      return snapshot();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => world,
  };
}

/** Fits a directional light's shadow camera round a world box (in the light's own view), with a small margin. */
function fitShadow(light, box) {
  light.updateMatrixWorld();
  light.target.updateMatrixWorld();
  const view = new THREE.Matrix4().lookAt(light.position, light.target.position, new THREE.Vector3(0, 1, 0));
  view.setPosition(light.position);
  const inv = view.invert();
  const lo = new THREE.Vector3(Infinity, Infinity, Infinity);
  const hi = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  const p = new THREE.Vector3();
  for (const x of [box.min.x, box.max.x])
    for (const y of [box.min.y, box.max.y])
      for (const z of [box.min.z, box.max.z]) {
        p.set(x, y, z).applyMatrix4(inv);
        lo.min(p);
        hi.max(p);
      }
  const cam = light.shadow.camera;
  Object.assign(cam, { left: lo.x - 0.2, right: hi.x + 0.2, bottom: lo.y - 0.2, top: hi.y + 0.2, near: Math.max(0.1, -hi.z - 1), far: -lo.z + 1 });
  cam.updateProjectionMatrix();
}
