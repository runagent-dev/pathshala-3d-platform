// Archimedes' principle and buoyancy (book page 137, topic 5.3.1), student view. One cargo ship floats in a sunny
// harbour; the water behind its flat stern is cut away, so the hull under the water shows. Four steps, one idea at a
// time (the row of words):
//   চাপ: the water's pressure arrows on the hull, short near the surface, long at the bottom (P = hρg); the two sides'
//     arrows are equal pairs that cancel; the bottom's add up to one bold upward arrow, প্লবতা F = P₂A = Ahρg.
//   ওজন ও প্লবতা: the ship's weight W down and its buoyancy up, equal. A solid steel cylinder of the empty ship's mass
//     hangs on a spring balance: lowered into the water it seems to weigh less (by the water it pushes aside); let go,
//     it sinks, because it pushes aside far less water than the hollow ship.
//   অপসারিত পানি: the water the hull pushes aside, as a glowing block of the hull's shape, slides out, rises and hangs
//     on the spring balance: its weight Vρg is the ship's buoyancy.
//   মাল বোঝাই: containers (20 t each) are lowered onto the deck; the ship settles deeper, the waterline climbs the
//     draft marks and the load line, W and প্লবতা grow together.
// Then a five-question test. Built on the shared student kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createArrow } from '@shared/arrow.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { createQuiz } from '@shared/student/quiz.js';
import { ICONS } from '@shared/student/icons.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { FLOOR, XC, createHarbour } from './harbour.js';
import { BOX, createBalance, createFoam, createGhost, createShip, createSteel } from './ship.js';
import {
  AREA,
  CONTAINER_T,
  G,
  HULL,
  MAX_CONTAINERS,
  QUIZ_LOADS,
  RHO,
  RHO_STEEL,
  SHIP_T,
  STEEL,
  STEPS,
  buoyancy,
  displaced,
  displacedChoices,
  draft,
  fixLoad,
  forceLength,
  groupBD,
  groupIntl,
  pressureAt,
  pressureChoices,
  pressureLength,
  round,
  shipMass,
  steelBuoyancy,
  steelWeight,
  weight,
} from './reading.js';

export const DEFAULTS = {
  step: 'pressure', // 'pressure' | 'weight' | 'displaced' | 'load'
  load: 0, // containers on board (0 … 12)
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { W: '#7048e8', B: '#e8590c', P: '#e03131', water: '#0b6e99', steel: '#495057', ink: '#14171c' };
const NBSP = ' ';
const DOUBLE_TAP = 450; // ms
const AX = XC - 0.1; // the arrows on the ship are drawn here: just inside the water's cut face, over the stern
const STEEL_AT = new THREE.Vector3(12, 0, -10.2); // where the steel cylinder hangs (x, z)
const GHOST_Z = -12.6; // where the pushed-aside water hangs, beside the ship
const GHOST_X = 1.41; // the middle of the hull's outline (its centroid)
const WIRE = 2.2; // the wire from the balance's hook to the cylinder
const STEEL_AIR = 0.5; // the cylinder's bottom this far above the water, hanging
const STEEL_DEEP = 0.7; // lowered: its top this far under the water (the book's h₁)
const GHOST_UP = 0.9; // the hanging block's bottom above the water
const SIDE_ROWS = 4; // pressure arrows on each side
const BOTTOM_ZS = [-3.2, -1.6, 0, 1.6, 3.2];
const MARGIN = { top: 52, bottom: 14, side: 6 };
const UPV = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);
const TO_PLUS_Z = new THREE.Vector3(0, 0, 1);
const TO_MINUS_Z = new THREE.Vector3(0, 0, -1);

/** A direction from the target towards the camera: az degrees round from the stern (+x) towards −z, el above. */
function dirFrom(az, el) {
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return new THREE.Vector3(Math.cos(e) * Math.cos(a), Math.sin(e), -Math.cos(e) * Math.sin(a));
}

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const G_ = (x) => N(t.lang === 'bn' ? groupBD(x) : groupIntl(x)); // Bangladeshi commas in Bangla (২৫,৪৮,০০০)
  const D1 = (x) => N(round(x, 1)); // a draft in m, one decimal (১.৩)
  const near100 = (x) => Math.round(x / 100) * 100; // "প্রায়" numbers: to the nearest hundred

  root.classList.add('pvc', 'by');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'steps', results: false, items: STEPS.map((id) => ({ id, label: `chip_${id}` })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 1, rule: 3 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;

  // the sums under the action: two lines with the student's numbers; in মাল বোঝাই a stepper for the containers
  const eq = document.createElement('div');
  eq.className = 'by-eq';
  eq.innerHTML = `
    <div class="by-load">
      <span class="by-name">${t('name_load', { c: N(CONTAINER_T) })}</span>
      <span class="by-ctl">
        <button type="button" class="by-pm" data-step="load" data-dir="-1" aria-label="${t('less_load')}">${ICONS.minus}</button>
        <output class="by-val" data-val="load" aria-live="polite"></output>
        <button type="button" class="by-pm" data-step="load" data-dir="1" aria-label="${t('more_load')}">${ICONS.plus}</button>
      </span>
    </div>
    <div class="by-line" data-line="1"></div>
    <div class="by-line" data-line="2"></div>`;
  $('.pvc-act-row').after(eq);
  const line1 = /** @type {HTMLElement} */ (eq.querySelector('[data-line="1"]'));
  const line2 = /** @type {HTMLElement} */ (eq.querySelector('[data-line="2"]'));

  // the water's numbers and, while the water is weighed, "imagine": in the panel, under the sums
  const notes = document.createElement('div');
  notes.className = 'by-notes';
  const dataNote = document.createElement('div');
  dataNote.className = 'by-note';
  const extraNote = document.createElement('div');
  extraNote.className = 'by-note by-note-x';
  notes.append(dataNote, extraNote);
  eq.append(notes);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 32, near: 0.3, far: 2000, environment: false, exposure: 1.0 });
  const { camera, controls, scene } = stage;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = true;
  controls.minDistance = 8;
  controls.maxDistance = 120;
  // in the 3D view the camera stays on the cut-away side, above the water
  controls.minAzimuthAngle = THREE.MathUtils.degToRad(15);
  controls.maxAzimuthAngle = THREE.MathUtils.degToRad(160);
  controls.minPolarAngle = THREE.MathUtils.degToRad(55);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(91);
  const harbour = createHarbour(scene, stage.renderer, { transparent: o.bg === 'transparent', shadow: o.shadow });

  const ship = createShip({ N });
  scene.add(ship.root);
  const foam = createFoam();
  scene.add(foam);
  const ghost = createGhost();
  scene.add(ghost.root);
  const steel = createSteel();
  scene.add(steel.root);
  const balance = createBalance();
  scene.add(balance.root);
  const cableMat = new THREE.MeshStandardMaterial({ color: '#3b4148', metalness: 0.6, roughness: 0.4 });
  /** A thin rod between two points (wires, slings). */
  function rod(radius = 0.05) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1, 6).translate(0, 0.5, 0), cableMat);
    m.visible = false;
    m.userData.noExport = true;
    scene.add(m);
    const d = new THREE.Vector3();
    return {
      mesh: m,
      between(a, b) {
        d.subVectors(b, a);
        const len = d.length();
        m.visible = len > 1e-3;
        if (!m.visible) return;
        m.position.copy(a);
        m.quaternion.setFromUnitVectors(UPV, d.divideScalar(len));
        m.scale.set(1, len, 1);
      },
      hide() {
        m.visible = false;
      },
    };
  }
  const wire = rod(0.045);
  // the spreader beam and its wires for the hanging block of water
  const spreader = new THREE.Mesh(new THREE.BoxGeometry(17, 0.32, 0.32), new THREE.MeshStandardMaterial({ color: '#f2b705', roughness: 0.5 }));
  spreader.visible = false;
  spreader.userData.noExport = true;
  scene.add(spreader);
  const slings = [rod(), rod(), rod(0.04), rod(0.04)];

  // the water's particles round the hull's section (চাপ): more of them deeper, where they push harder; they jostle
  // while the arrows grow, then rest
  const DOTS = 64;
  const dots = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.075, 8, 6),
    new THREE.MeshBasicMaterial({ color: '#e7f8ff', transparent: true, opacity: 0.8, depthWrite: false, fog: false }),
    DOTS,
  );
  dots.name = 'WaterParticles';
  dots.userData.noExport = true;
  dots.renderOrder = 4;
  dots.visible = false;
  scene.add(dots);
  const dotSeed = (() => {
    let x = 9;
    return () => {
      x = (x * 16807) % 2147483647;
      return x / 2147483647;
    };
  })();
  // depth fraction (0 at the surface … 1 at 1.2 m under the keel, more of them deeper), across (−1 … 1), a phase
  const dotAt = Array.from({ length: DOTS }, () => ({ d: Math.sqrt(dotSeed()), z: dotSeed() * 2 - 1, p: dotSeed() * 6.28 }));
  const m4 = new THREE.Matrix4();
  function placeDots() {
    dots.visible = s.step === 'pressure' && s.pa > 0 && s.show.arrows;
    if (!dots.visible) return;
    const h = s.hv;
    const wob = 0.09 * Math.sin(s.pa * Math.PI) * (1 - s.sum);
    dotAt.forEach((q, i) => {
      const y = -q.d * (h + 1.2);
      let z = q.z * (HULL.beam / 2 + 1.3);
      // not inside the hull: pushed out to its side
      if (y > -h && Math.abs(z) < HULL.beam / 2 + 0.12) z = Math.sign(z || 1) * (HULL.beam / 2 + 0.12 + Math.abs(q.z) * 1.1);
      m4.makeTranslation(AX - 0.3, y + wob * Math.sin(q.p + s.pa * 30), z + wob * Math.cos(q.p + s.pa * 23));
      dots.setMatrixAt(i, m4);
    });
    dots.instanceMatrix.needsUpdate = true;
  }

  // the arrows are the point of the picture: thick, flat colour in a white outline, drawn over the scenery, as thick
  // on the screen at every size (their radius follows the camera's distance)
  const R0 = 0.06;
  const flat = (color) =>
    new THREE.MeshBasicMaterial({ color, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false });
  const OUT_FROM = new THREE.Vector3();
  const arrowList = [];
  function boldArrow(name, color, px) {
    const mat = flat(color);
    const omat = flat('#ffffff');
    const core = createArrow({ name, radius: R0, head: R0 * 5, headRadius: R0 * 2.7, material: mat });
    const pad = R0 * 0.7;
    const outline = createArrow({
      name: `${name}Outline`,
      radius: R0 + pad,
      head: R0 * 5 + pad * 2.8,
      headRadius: R0 * 2.7 + pad * 2,
      material: omat,
    });
    core.root.add(outline.root);
    core.root.traverse((m) => {
      m.renderOrder = 21;
    });
    outline.root.traverse((m) => {
      m.renderOrder = 20;
    });
    core.root.userData.noExport = true;
    scene.add(core.root);
    const tip = new THREE.Vector3();
    const from = new THREE.Vector3();
    const dir = new THREE.Vector3();
    let len = 0;
    let alpha = 1;
    const a = {
      root: core.root,
      tip,
      from,
      color,
      get on() {
        return len > 1e-6 && alpha > 0.01;
      },
      set(p, d, length) {
        from.copy(p);
        dir.copy(d).normalize();
        len = length;
        tip.copy(p).addScaledVector(dir, length);
        a.place();
      },
      /** Redraw at the camera's current distance (thickness in pixels). */
      place() {
        if (len <= 1e-6) {
          core.hide();
          return;
        }
        const perPx = (2 * camera.position.distanceTo(from) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / Math.max(1, stage.height);
        const k = Math.min(30, Math.max(0.4, (px * perPx) / R0));
        core.root.scale.setScalar(k);
        core.set(from, dir, len / k);
        OUT_FROM.set(0, -pad, 0);
        outline.set(OUT_FROM, UPV, len / k + pad * 2.2);
        core.root.visible = alpha > 0.01;
      },
      opacity(v) {
        alpha = v;
        mat.opacity = v;
        omat.opacity = v;
        core.root.visible = len > 1e-6 && v > 0.01;
      },
      hide() {
        len = 0;
        core.hide();
      },
    };
    arrowList.push(a);
    return a;
  }
  const arrows = {
    W: boldArrow('ShipWeight', COLORS.W, 4.2),
    B: boldArrow('ShipBuoyancy', COLORS.B, 4.2),
    sW: boldArrow('SteelWeight', COLORS.W, 3.6),
    sB: boldArrow('SteelBuoyancy', COLORS.B, 3.6),
    gW: boldArrow('WaterWeight', COLORS.W, 3.6),
    left: Array.from({ length: SIDE_ROWS }, (_, i) => boldArrow(`PressureLeft${i}`, COLORS.P, 2.4)),
    right: Array.from({ length: SIDE_ROWS }, (_, i) => boldArrow(`PressureRight${i}`, COLORS.P, 2.4)),
    bottom: BOTTOM_ZS.map((_, i) => boldArrow(`PressureBottom${i}`, COLORS.P, 2.4)),
    hUp: boldArrow('DepthUp', COLORS.ink, 1.3),
    hDown: boldArrow('DepthDown', COLORS.ink, 1.3),
  };

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    step: STEPS.includes(o.step) ? o.step : 'pressure',
    phase: 0, // what the step's action has done: চাপ 0 / 1 arrows / 2 added up; ওজন 0 in the air / 1 in the water / 2 let go; অপসারিত 0 / 1 weighed
    n: fixLoad(o.load), // containers on board
    hv: draft(fixLoad(o.load)), // the ship's draft as drawn now (it eases to draft(n))
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    // animation values
    pa: 0, // the pressure arrows grow (0 … 1)
    sum: 0, // they add up (0 … 1)
    steelY: 0, // the cylinder's centre (m)
    steelHung: true,
    ghostK: 0, // the block of water's journey (0 … 1)
    drop: Array(MAX_CONTAINERS).fill(0), // how far above its place each container is (m)
    reading: 0, // the balance's reading (N)
    found: { pressure: false, sum: false, lower: false, drop: false, ghost: false, load: false },
    show: { values: true, arrows: true, h: true, V: true, reading: true }, // the test hides some until the answer
    userMovedCamera: false,
    run: 0, // a token: every new action, step, reset bumps it
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  const steelAirY = () => STEEL_AIR + STEEL.h / 2;
  const steelDeepY = () => -STEEL_DEEP - STEEL.h / 2;
  const steelFloorY = () => FLOOR + STEEL.h / 2;
  s.steelY = steelAirY();
  /** How much of the cylinder is under the water (0 … 1). */
  const steelUnder = () => Math.min(1, Math.max(0, (STEEL.h / 2 - s.steelY) / STEEL.h));
  const W = () => weight(shipMass(s.n));
  const target = () => draft(s.n);

  // ── the scene from the state ────────────────────────────────────────────────
  const hookAt = new THREE.Vector3();
  const tmpA = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  function syncScene() {
    ship.root.position.y = -s.hv;
    const loaded = (i) => i < s.n || s.drop[i] > 0;
    ship.containers.forEach((c, i) => {
      c.visible = loaded(i) && s.drop[i] < 40;
      c.position.y = ship.slots[i].y + s.drop[i];
    });

    // the steel cylinder and the balance holding it (ওজন ও প্লবতা)
    const inWeight = s.step === 'weight';
    steel.root.visible = inWeight;
    steel.root.position.set(STEEL_AT.x, s.steelY, STEEL_AT.z);
    const g = ghostPath();
    const ghostOn = s.step === 'displaced' && s.ghostK > 0;
    if (inWeight && s.steelHung) {
      hookAt.set(STEEL_AT.x, s.steelY + steel.top + WIRE, STEEL_AT.z);
      balance.root.visible = true;
      balance.root.position.copy(hookAt);
      wire.between(hookAt, tmpA.set(STEEL_AT.x, s.steelY + steel.top - 0.2, STEEL_AT.z));
    } else if (inWeight) {
      // let go: the balance stays where it was, empty
      balance.root.visible = true;
      wire.hide();
    } else if (ghostOn && g.hang > 0) {
      balance.root.visible = true;
      hookAt.set(GHOST_X, g.y + g.h + 3.4, GHOST_Z);
      balance.root.position.copy(hookAt);
      wire.hide();
    } else {
      balance.root.visible = false;
      wire.hide();
    }
    balance.setPull(s.reading / weight(shipMass(MAX_CONTAINERS)));

    // the block of water the hull pushes aside (অপসারিত পানি)
    ghost.root.position.set(0, g.y, g.z);
    ghost.root.scale.set(1, Math.max(0.01, g.h), 1);
    ghost.setOpacity(ghostOn ? g.alpha : 0);
    const rig = ghostOn && g.hang > 0;
    spreader.visible = rig;
    if (rig) {
      const top = g.y + g.h;
      spreader.position.set(GHOST_X, top + 1.6, GHOST_Z);
      const ends = [GHOST_X - 8.2, GHOST_X + 8.2];
      ends.forEach((x, i) => {
        slings[i].between(tmpA.set(x, top + 1.6, GHOST_Z), hookAt);
        slings[i + 2].between(tmpA.set(x, top, GHOST_Z), tmpB.set(x, top + 1.6, GHOST_Z));
      });
    } else for (const r of slings) r.hide();

    placeDots();
    layoutArrows();
    stage.invalidate();
  }

  /** Where the block of water is on its journey: in the hull, sideways under the water, up, hanging. */
  function ghostPath() {
    const k = s.ghostK;
    const h = s.hv;
    const slide = ease.inOutCubic(Math.min(1, Math.max(0, (k - 0.22) / 0.3)));
    const rise = ease.inOutCubic(Math.min(1, Math.max(0, (k - 0.55) / 0.3)));
    return {
      alpha: Math.min(1, k / 0.12),
      z: GHOST_Z * slide,
      y: -h + (h + GHOST_UP) * rise,
      h,
      hang: k >= 0.85 ? 1 : 0,
    };
  }

  /** Every arrow from the state (and at the camera's distance). */
  function layoutArrows() {
    for (const a of arrowList) a.hide();
    const h = s.hv;
    const showArrows = s.show.arrows;
    // the water's pressure on the hull (চাপ): rows on both sides, a row under the bottom
    if (s.step === 'pressure' && s.pa > 0 && showArrows) {
      const fadeSides = 1 - 0.72 * Math.min(1, s.sum / 0.5); // the cancelled pairs stay, faint
      for (let i = 0; i < SIDE_ROWS; i++) {
        const d = (h * (i + 0.6)) / SIDE_ROWS;
        const len = pressureLength(pressureAt(d)) * s.pa;
        arrows.left[i].set(tmpA.set(AX, -d, HULL.beam / 2 + len), TO_MINUS_Z, len);
        arrows.right[i].set(tmpA.set(AX, -d, -HULL.beam / 2 - len), TO_PLUS_Z, len);
        arrows.left[i].opacity(fadeSides);
        arrows.right[i].opacity(fadeSides);
      }
      const len = pressureLength(pressureAt(h)) * s.pa;
      const gather = ease.inOutCubic(Math.min(1, Math.max(0, (s.sum - 0.2) / 0.6)));
      BOTTOM_ZS.forEach((z, i) => {
        arrows.bottom[i].set(tmpA.set(AX, -h - len, z * (1 - gather)), UPV, len);
        arrows.bottom[i].opacity(1 - gather);
      });
      if (s.sum > 0.4) {
        const L = forceLength(buoyancy(h)) * ease.outCubic(Math.min(1, (s.sum - 0.4) / 0.6));
        arrows.B.set(tmpA.set(AX, -h - L, 0), UPV, L);
      }
    }
    if (s.step === 'pressure' && s.phase >= 1 && s.show.h) {
      // h₂: the depth of the bottom, a thin two-way arrow on the stern (also in the test, without the pressure arrows)
      arrows.hUp.set(tmpA.set(AX, -h / 2, 2.3), UPV, h / 2);
      arrows.hDown.set(tmpA.set(AX, -h / 2, 2.3), DOWN, h / 2);
    }
    // the ship's weight and buoyancy (ওজন ও প্লবতা, মাল বোঝাই, অপসারিত পানি)
    if ((s.step === 'weight' || s.step === 'load' || (s.step === 'displaced' && s.ghostK >= 0.85)) && showArrows) {
      const Lb = forceLength(buoyancy(h));
      arrows.B.set(tmpA.set(AX, -h - Lb, 0), UPV, Lb);
      // (beside the hanging water, its own weight stands for the ship's: the two arrows match)
      if (s.step !== 'displaced') arrows.W.set(tmpA.set(AX, HULL.depth - h + 0.15, 0), DOWN, forceLength(W()));
    }
    if (s.step === 'load' && s.show.h) {
      arrows.hUp.set(tmpA.set(AX, -h / 2, 2.3), UPV, h / 2);
      arrows.hDown.set(tmpA.set(AX, -h / 2, 2.3), DOWN, h / 2);
    }
    // the steel cylinder: its weight, and its buoyancy for the part under the water
    if (s.step === 'weight' && showArrows) {
      arrows.sW.set(tmpA.set(STEEL_AT.x, s.steelY, STEEL_AT.z), DOWN, forceLength(steelWeight()));
      // its buoyancy pushes on its bottom, like the ship's (a seventh of its weight: a short arrow)
      const Lb = forceLength(steelBuoyancy() * steelUnder());
      const bottom = s.steelY - STEEL.h / 2;
      if (Lb > 0.01) arrows.sB.set(tmpA.set(STEEL_AT.x, bottom - Lb, STEEL_AT.z), UPV, Lb);
    }
    // the hanging water's weight
    if (s.step === 'displaced' && s.ghostK >= 0.85 && showArrows && s.show.reading) {
      const g = ghostPath();
      arrows.gW.set(tmpA.set(AX - 0.4, g.y + g.h / 2, GHOST_Z), DOWN, forceLength(buoyancy(h)));
    }
  }
  function placeArrows() {
    for (const a of arrowList) if (a.on) a.place();
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  /** The action's words and number for the step and phase. */
  function plan() {
    const f = s.found;
    if (s.step === 'pressure') {
      if (s.phase === 0) return { label: 'act_show_p', step: f.pressure ? '' : 1 };
      if (s.phase === 1) return { label: 'act_sum', step: f.sum ? '' : 2 };
      return { label: 'act_again_p', step: '' };
    }
    if (s.step === 'weight') {
      if (s.phase === 0) return { label: 'act_lower', step: f.lower ? '' : 1 };
      if (s.phase === 1) return { label: 'act_drop', step: f.drop ? '' : 2 };
      return { label: 'act_again_w', step: '' };
    }
    if (s.step === 'displaced') return { label: s.phase ? 'act_again_d' : 'act_ghost', step: f.ghost || s.phase ? '' : 1 };
    if (s.n >= MAX_CONTAINERS) return { label: 'act_unload', step: '' };
    return { label: 'act_load', step: f.load ? '' : 1 };
  }

  function linesHtml() {
    const h = target();
    const n = s.n;
    if (s.step === 'pressure') {
      const P2 = pressureAt(h);
      const a = t('eq_p2', { h: D1(h), rho: G_(RHO), g: N(G), P: G_(P2) });
      const b = s.phase >= 2 || s.sum > 0.4 ? t('eq_f', { P: G_(P2), A: N(AREA), F: G_(buoyancy(h)) }) : t('eq_sides');
      return [a, b];
    }
    if (s.step === 'weight') {
      const a = t('eq_ship_w', { m: G_(shipMass(n)), g: N(G), W: G_(W()) });
      if (s.phase === 0) return [a, t('eq_steel_air', { W: G_(steelWeight()), V: N(round(STEEL.V, 1)) })];
      return [a, t('eq_steel_water', { W: G_(steelWeight()), B: G_(near100(steelBuoyancy())) })];
    }
    if (s.step === 'displaced') {
      const V = displaced(h);
      return [t('eq_v', { A: N(AREA), h: D1(h), V: N(round(V, 1)) }), t('eq_vw', { V: N(round(V, 1)), rho: G_(RHO), g: N(G), F: G_(buoyancy(h)) })];
    }
    return [t('eq_load', { n: N(n), m: N(SHIP_T + CONTAINER_T * n), h: D1(h) }), t('eq_balance', { W: G_(W()) })];
  }

  function outcomeHtml() {
    const h = target();
    if (s.step === 'pressure') {
      if (s.phase === 0) return t('out_p0');
      if (s.phase === 1) return t('out_p1', { P: G_(pressureAt(h)) });
      return t('out_p2', { F: G_(buoyancy(h)) });
    }
    if (s.step === 'weight') {
      if (s.phase === 0) return t('out_w0', { R: G_(round(s.reading, 0)) });
      if (s.phase === 1) return t('out_w1', { R: G_(near100(s.reading)) });
      return t('out_w2');
    }
    if (s.step === 'displaced') return s.phase ? t('out_d1', { F: G_(buoyancy(h)) }) : t('out_d0', { h: D1(h) });
    if (s.n >= MAX_CONTAINERS) return t('out_full');
    if (s.n === 0) return t('out_empty', { h: D1(h) });
    return t('out_load', { n: N(s.n), h: D1(h) });
  }

  function ruleHtml() {
    const f = s.found;
    if (s.step === 'pressure') return s.phase >= 2 || (s.phase === 0 && f.sum) ? t('rule_sum', { zero: N(0) }) : t('rule_pressure');
    if (s.step === 'weight')
      return s.phase >= 2 || (s.phase === 0 && f.drop) ? t('rule_drop', { rs: G_(RHO_STEEL) }) : s.phase === 1 ? t('rule_lower') : t('rule_weight');
    if (s.step === 'displaced') return t('rule_archimedes');
    return s.n >= MAX_CONTAINERS ? t('rule_full') : t('rule_load');
  }

  let lastNotes = '';
  function refresh() {
    sheet.choose(s.step);
    sheet.outcome(outcomeHtml());
    sheet.rule(ruleHtml());
    const [a, b] = linesHtml();
    if (line1.dataset.html !== a) {
      line1.innerHTML = a;
      line1.dataset.html = a;
    }
    if (line2.dataset.html !== b) {
      line2.innerHTML = b;
      line2.dataset.html = b;
    }
    eq.dataset.step = s.step;
    $('[data-val="load"]').textContent = N(s.n);
    for (const b2 of eq.querySelectorAll('[data-step]')) {
      const dir = Number(/** @type {HTMLElement} */ (b2).dataset.dir);
      b2.classList.toggle('off', dir < 0 ? s.n <= 0 : s.n >= MAX_CONTAINERS);
    }
    if (action) {
      const p = plan();
      action.set({ step: p.step, label: p.label });
      // the ring only before the step's first action: then the arrows and labels need the room
      if (s.phase === 0 && s.step !== 'load') action.show('scene');
      else action.hide('scene');
    }
    const key = `${s.step}|${s.phase}|${stage.width < 560}`;
    if (key !== lastNotes) {
      dataNote.innerHTML = t('note_data', { rho: G_(RHO), g: N(G) });
      extraNote.textContent = s.step === 'displaced' && s.phase ? t('note_imagine') : '';
      lastNotes = key;
    }
    syncLabels();
    stage.invalidate();
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  const tmp = new THREE.Vector3();
  const P0 = { x: 0, y: 0 };
  const P1 = { x: 0, y: 0 };
  function toScreen(p, out) {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  function arrowBoxes() {
    const list = [];
    for (const a of arrowList) {
      if (!a.on || a.color === COLORS.ink) continue;
      toScreen(a.from, P0);
      toScreen(a.tip, P1);
      list.push({
        left: Math.min(P0.x, P1.x) - 6,
        top: Math.min(P0.y, P1.y) - 6,
        right: Math.max(P0.x, P1.x) + 6,
        bottom: Math.max(P0.y, P1.y) + 6,
      });
    }
    return list;
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, arrowBoxes, () => action?.box(), () => action?.ringBox()],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const RIGHT_OF = [spot(14, 0), spot(14, 16), spot(14, -16), spot(14, 30)];
  const LEFT_OF = [spot(-14, 0), spot(-14, 16), spot(-14, -16), spot(-14, 30)];
  const BELOW = [spot(0, 18), spot(18, 18), spot(-18, 18), spot(0, 34)];
  const ABOVE = [spot(0, -18), spot(18, -18), spot(-18, -18), spot(0, -34)];
  const pt = {};
  const P = (id) => {
    if (!pt[id]) pt[id] = new THREE.Vector3();
    return pt[id];
  };
  const labelState = new Map();
  const want = new Map();
  const mid = (a) => P(`mid-${a.root.name}`).lerpVectors(a.from, a.tip, 0.5);
  function syncLabels() {
    want.clear();
    const h = s.hv;
    const v = s.show.values;
    const compact = stage.height < 250 || stage.width < 340;
    const add = (id, w) => want.set(id, w);
    if (s.step === 'pressure' && s.pa > 0.6) {
      if (arrows.bottom[0].on)
        add('P', {
          text: v ? t('lbl_P2', { v: G_(pressureAt(h)) }) : t('lbl_P2_sym'),
          point: () => P('P').copy(arrows.bottom[0].from),
          spots: [...BELOW, ...RIGHT_OF],
          color: COLORS.P,
        });
      if (arrows.hUp.on)
        add('h', {
          text: v ? t('lbl_h2', { v: D1(h) }) : t('lbl_h2_sym'),
          point: () => P('h').set(AX, -h * 0.5, 2.3),
          spots: [spot(-16, 0), spot(-16, 14), spot(-16, -14), spot(16, -20)],
          color: COLORS.ink,
          optional: compact,
        });
      if (s.sum > 0.15 && s.phase >= 2) {
        add('cancelL', {
          text: t('lbl_cancel'),
          point: () => P('cl').set(AX, -h * 0.55, HULL.beam / 2 + 0.5),
          spots: [spot(-10, -22), spot(-14, 0), spot(-10, 22)],
          color: COLORS.P,
          optional: compact,
        });
        add('cancelR', {
          text: t('lbl_cancel'),
          point: () => P('cr').set(AX, -h * 0.55, -HULL.beam / 2 - 0.5),
          spots: [spot(10, -22), spot(14, 0), spot(10, 22)],
          color: COLORS.P,
          optional: compact,
        });
      }
    }
    if (arrows.B.on && (s.step !== 'pressure' || s.sum > 0.9))
      add('B', {
        text: v ? t('lbl_B', { v: G_(buoyancy(h)) }) : t('lbl_B_sym'),
        point: () => mid(arrows.B),
        spots: [...RIGHT_OF, ...LEFT_OF, ...BELOW],
        color: COLORS.B,
      });
    if (arrows.W.on)
      add('W', {
        text: v ? t('lbl_W', { v: G_(W()) }) : t('lbl_W_sym'),
        point: () => mid(arrows.W),
        spots: [...LEFT_OF, ...RIGHT_OF, ...ABOVE],
        color: COLORS.W,
      });
    if (s.step === 'weight') {
      add('steel', {
        text: t('lbl_steel'),
        point: () => P('steel').set(STEEL_AT.x, s.steelY + STEEL.h / 2, STEEL_AT.z - STEEL.r * 0.7),
        spots: [spot(16, -10), spot(18, 8), spot(-16, -10), ...ABOVE],
        color: COLORS.steel,
        optional: compact,
      });
      if (arrows.sB.on && s.steelY < 0)
        add('sB', {
          text: t('lbl_sB', { v: G_(near100(steelBuoyancy() * steelUnder())) }),
          point: () => mid(arrows.sB),
          spots: [...RIGHT_OF, ...LEFT_OF],
          color: COLORS.B,
          optional: true,
        });
      if (s.steelHung)
        add('reading', {
          text: steelUnder() > 0 ? t('lbl_reading_about', { v: G_(near100(s.reading)) }) : t('lbl_reading', { v: G_(round(s.reading, 0)) }),
          point: () => P('rd').copy(balance.root.position).add(balance.labelAt()),
          spots: [spot(20, 0), spot(20, 16), spot(-20, 0), spot(20, -16)],
          color: COLORS.ink,
        });
    }
    if (s.step === 'displaced' && s.ghostK > 0.15) {
      const g = ghostPath();
      add('V', {
        text: s.show.V ? t('lbl_V', { v: N(round(displaced(h), 1)) }) : t('lbl_V_sym'),
        point: () => P('V').set(2, g.y + g.h, g.z - HULL.beam / 2 + 0.6),
        spots: [spot(18, -14), spot(18, 8), spot(18, 24), ...BELOW],
        color: COLORS.water,
      });
      if (arrows.gW.on)
        add('gW', {
          text: t('lbl_water_w'),
          point: () => mid(arrows.gW),
          spots: [...RIGHT_OF, ...BELOW, ...LEFT_OF],
          color: COLORS.W,
        });
      if (s.ghostK >= 0.85)
        add('reading', {
          text: s.show.reading ? t('lbl_reading', { v: G_(round(s.reading, 0)) }) : t('lbl_reading_q'),
          point: () => P('rd').copy(balance.root.position).add(balance.labelAt()),
          spots: [spot(20, 0), spot(20, 16), spot(-20, 0), spot(20, -16)],
          color: COLORS.ink,
        });
    }
    if (s.step === 'load') {
      add('loadline', {
        text: t('lbl_loadline'),
        point: () => P('ll').copy(ship.spots.loadLine).add(ship.root.position),
        spots: [spot(16, -14), spot(16, 6), spot(-16, -14), spot(0, -26)],
        color: COLORS.ink,
        optional: compact,
      });
      if (arrows.hUp.on)
        add('h', {
          text: v ? t('lbl_h', { v: D1(h) }) : t('lbl_h_sym'),
          point: () => P('h').set(AX, -h * 0.5, 2.3),
          spots: [spot(-16, 0), spot(-16, 14), spot(-16, -14)],
          color: COLORS.ink,
          optional: true,
        });
    }
    const order = ['P', 'B', 'W', 'gW', 'reading', 'V', 'h', 'steel', 'sB', 'loadline', 'cancelL', 'cancelR'];
    const sorted = [...want.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of sorted) {
      const key = `${w.text}|${w.spots.map((p) => `${p.dx},${p.dy}`).join(';')}`;
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: 'force', color: w.color, spots: w.spots, optional: w.optional });
        labelState.set(id, key);
      } else if (labelState.get(id) !== key) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots });
        labelState.set(id, key);
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const box = new THREE.Box3();
  /** What the camera shows for a step and phase (the same box whatever is animating, so the camera keeps still). */
  function viewPose(step = s.step, phase = s.phase) {
    const h = target();
    const aspect = stage.width / Math.max(1, stage.height);
    const portrait = aspect < 1.05;
    let dir;
    if (step === 'pressure' && phase >= 1) {
      // close to the stern, nearly end on: the hull's section under the water and its arrows
      const pl = pressureLength(pressureAt(h));
      const below = Math.max(pl, forceLength(buoyancy(h)));
      box.min.set(AX - 0.4, -h - below - 0.3, -HULL.beam / 2 - pl - 0.4);
      box.max.set(AX, 1.1, HULL.beam / 2 + pl + 0.4);
      dir = dirFrom(9, 4);
    } else if (step === 'weight') {
      // the cylinder in the air with its balance; in the water; on the bottom (the camera follows it down)
      const lowest = [-h - forceLength(W()) - 0.3, steelDeepY() - STEEL.h / 2 - 0.4, FLOOR - 0.3][phase] ?? -4;
      const hook = (phase === 0 ? steelAirY() : steelDeepY()) + steel.top + WIRE;
      box.min.set(STEEL_AT.x - 2, lowest, STEEL_AT.z - STEEL.r - 0.4);
      box.max.set(XC, hook + 3.6, HULL.beam / 2 + 0.2);
      dir = dirFrom(portrait ? 10 : 14, 7);
    } else if (step === 'displaced') {
      box.min.set(-6, -h - forceLength(buoyancy(h)) - 0.3, GHOST_Z - HULL.beam / 2 - 0.4);
      box.max.set(XC, GHOST_UP + h + 3.4 + 1.6, HULL.beam / 2 + 0.3);
      dir = dirFrom(portrait ? 12 : 18, 9);
    } else if (step === 'load') {
      const Lmax = forceLength(weight(shipMass(MAX_CONTAINERS)));
      box.min.set(-4, -2.5 - Lmax - 0.3, -HULL.beam / 2 - 0.3);
      box.max.set(XC, HULL.depth - 1.3 + 2 * BOX.y + 0.4, HULL.beam / 2 + 0.3);
      dir = dirFrom(portrait ? 24 : 34, 11);
    } else {
      // the whole ship, from its stern quarter
      box.min.set(-14, -h - 0.4, -HULL.beam / 2);
      box.max.set(XC, HULL.depth + 5.4 - h, HULL.beam / 2);
      dir = dirFrom(portrait ? 30 : 38, 8);
    }
    return fitPose({ box, dir, camera, width: stage.width, height: stage.height, margin: MARGIN });
  }
  function haze() {
    if (!(scene.fog instanceof THREE.Fog)) return;
    const d = camera.position.distanceTo(controls.target);
    scene.fog.near = d + 120;
    scene.fog.far = d + 900;
  }
  function flyTo({ position, target: aim }, duration = 0.8) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      camera.position.copy(position);
      controls.target.copy(aim);
      controls.update();
      haze();
      placeArrows();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener
      .animate({
        key: 'camera',
        duration,
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          camera.position.lerpVectors(p0, position, k);
          controls.target.lerpVectors(t0, aim, k);
          controls.update();
          haze();
          placeArrows();
          stage.invalidate();
        },
      })
      .finished.then((done) => {
        if (done) refresh();
        return done;
      });
  }
  function frame(duration = 0.9) {
    if (s.userMovedCamera) return Promise.resolve(false);
    return flyTo(viewPose(), duration);
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    return flyTo(viewPose(), animate ? 0.7 : 0);
  }
  controls.addEventListener('start', () => {
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
    }
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  controls.addEventListener('change', () => {
    haze();
    placeArrows();
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(viewPose(), 0);
    placeArrows();
    refresh();
  });

  // ── the steps ───────────────────────────────────────────────────────────────
  const wait = (sec) => tweener.animate({ key: 'wait', duration: sec, onUpdate: () => {} }).finished;
  /** Puts a step's scene at its start (phase 0), or at a given phase at once. */
  function sceneFor(step, phase = 0) {
    tweener.cancel('pa');
    tweener.cancel('steel');
    tweener.cancel('ghost');
    tweener.cancel('wait');
    s.step = step;
    s.phase = phase;
    s.pa = step === 'pressure' && phase >= 1 ? 1 : 0;
    s.sum = step === 'pressure' && phase >= 2 ? 1 : 0;
    s.steelHung = !(step === 'weight' && phase >= 2);
    s.steelY = step === 'weight' ? ([steelAirY(), steelDeepY(), steelFloorY()][phase] ?? steelAirY()) : steelAirY();
    s.ghostK = step === 'displaced' && phase >= 1 ? 1 : 0;
    s.reading = readingNow();
    syncScene();
  }
  /** The balance's reading for the scene as it is (what holds the cylinder up, or the water's weight). */
  function readingNow() {
    if (s.step === 'weight') return s.steelHung ? steelWeight() - steelBuoyancy() * steelUnder() : 0;
    if (s.step === 'displaced') return s.ghostK >= 0.85 ? buoyancy(s.hv) * Math.min(1, (s.ghostK - 0.85) / 0.15) : 0;
    return 0;
  }

  function chooseStep(step, { animate = true } = {}) {
    if (!STEPS.includes(step)) return Promise.resolve(false);
    s.run++;
    settleShip(true);
    sceneFor(step, 0);
    s.userMovedCamera = false;
    hintOff();
    refresh();
    emit('step', { step });
    emitChange();
    return flyTo(viewPose(), animate ? 0.9 : 0);
  }

  /** The step's action: one tap does the next thing. */
  async function act({ jump = false } = {}) {
    const token = ++s.run;
    const alive = () => token === s.run;
    const step = s.step;
    if (step === 'pressure') {
      if (s.phase === 0) {
        s.phase = 1;
        if (s.mode === 'explore') s.found.pressure = true;
        refresh();
        frame(jump ? 0 : 1.0);
        audio.pop();
        if (jump) s.pa = 1;
        else await tweener.animate({ key: 'pa', duration: 1.6, ease: ease.outCubic, onUpdate: (k) => ((s.pa = k), syncScene()) }).finished;
        if (!alive()) return false;
        s.pa = 1;
      } else if (s.phase === 1) {
        s.phase = 2;
        if (s.mode === 'explore') s.found.sum = true;
        refresh();
        audio.pop();
        if (jump) s.sum = 1;
        else
          await tweener.animate({ key: 'pa', duration: 2.2, ease: ease.linear, onUpdate: (k) => ((s.sum = k), syncScene(), syncLabels()) }).finished;
        if (!alive()) return false;
        s.sum = 1;
      } else {
        // again: from the start, the camera stays close
        s.phase = 0;
        s.pa = 0;
        s.sum = 0;
        syncScene();
        return act({ jump });
      }
    } else if (step === 'weight') {
      if (s.phase === 0) {
        s.phase = 1;
        if (s.mode === 'explore') s.found.lower = true;
        refresh();
        frame(jump ? 0 : 2.4);
        const y0 = s.steelY;
        const y1 = steelDeepY();
        if (jump) s.steelY = y1;
        else
          await tweener.animate({
            key: 'steel',
            duration: 2.6,
            ease: ease.inOutCubic,
            onUpdate: (k) => {
              s.steelY = y0 + (y1 - y0) * k;
              s.reading = readingNow();
              syncScene();
              refresh();
            },
          }).finished;
        if (!alive()) return false;
        s.steelY = y1;
      } else if (s.phase === 1) {
        s.phase = 2;
        if (s.mode === 'explore') s.found.drop = true;
        s.steelHung = false;
        s.reading = 0;
        refresh();
        frame(jump ? 0 : 1.6);
        audio.pop();
        const y0 = s.steelY;
        const y1 = steelFloorY();
        if (jump) s.steelY = y1;
        else
          await tweener.animate({
            key: 'steel',
            duration: 1.8,
            ease: (k) => k * k * k,
            onUpdate: (k) => {
              s.steelY = y0 + (y1 - y0) * k;
              syncScene();
            },
          }).finished;
        if (!alive()) return false;
        s.steelY = y1;
        if (!jump) audio.contact();
      } else {
        sceneFor('weight', 0);
        frame(jump ? 0 : 0.9);
      }
    } else if (step === 'displaced') {
      s.phase = 1;
      if (s.mode === 'explore') s.found.ghost = true;
      s.ghostK = 0;
      refresh();
      if (jump) s.ghostK = 1;
      else
        await tweener.animate({
          key: 'ghost',
          duration: 5.2,
          ease: ease.linear,
          onUpdate: (k) => {
            s.ghostK = k;
            s.reading = readingNow();
            syncScene();
            refresh();
          },
        }).finished;
      if (!alive()) return false;
      s.ghostK = 1;
    } else {
      if (s.n >= MAX_CONTAINERS) await setLoad(0, { animate: !jump });
      else await setLoad(s.n + 1, { animate: !jump });
      return true;
    }
    s.reading = readingNow();
    syncScene();
    refresh();
    emitChange();
    return true;
  }

  /** Containers on or off: each new one is lowered onto the deck, then the ship settles to its new draft. */
  async function setLoad(n, { animate = true } = {}) {
    const v = fixLoad(n);
    if (v === s.n) return false;
    const token = ++s.run;
    const from = s.n;
    s.n = v;
    if (s.mode === 'explore' && s.step === 'load') s.found.load = true;
    tweener.cancel('drop');
    tweener.cancel('settle');
    if (!animate) {
      s.drop.fill(0);
      s.hv = target();
      s.reading = readingNow();
      syncScene();
      refresh();
      emitChange();
      return true;
    }
    refresh();
    emitChange();
    if (v > from) {
      // the new ones come down from above, one after another
      const fresh = [];
      for (let i = from; i < v; i++) {
        s.drop[i] = 9;
        fresh.push(i);
      }
      syncScene();
      audio.pop();
      await tweener.animate({
        key: 'drop',
        duration: 0.9,
        ease: ease.outCubic,
        onUpdate: (k) => {
          for (const i of fresh) s.drop[i] = 9 * (1 - k);
          syncScene();
        },
      }).finished;
      if (token !== s.run) return false;
      audio.contact();
    } else {
      // taken off: up and away
      const gone = [];
      for (let i = v; i < from; i++) gone.push(i);
      await tweener.animate({
        key: 'drop',
        duration: 0.8,
        ease: (k) => k * k * k,
        onUpdate: (k) => {
          for (const i of gone) s.drop[i] = 45 * k;
          syncScene();
        },
      }).finished;
      for (const i of gone) s.drop[i] = 0;
      if (token !== s.run) return false;
    }
    return settleShip(false, token);
  }
  /** The ship eases to the draft of its load with a small bob (the weight is felt first, the buoyancy catches up). */
  function settleShip(jump, token = s.run) {
    tweener.cancel('settle');
    const h0 = s.hv;
    const h1 = target();
    if (jump || Math.abs(h1 - h0) < 1e-6) {
      s.drop.fill(0);
      s.hv = h1;
      syncScene();
      return Promise.resolve(true);
    }
    return tweener
      .animate({
        key: 'settle',
        duration: 1.8,
        ease: ease.linear,
        onUpdate: (k) => {
          s.hv = h1 + (h0 - h1) * Math.exp(-4.2 * k) * Math.cos(Math.PI * 2.4 * k) * (1 - k * 0.2);
          syncScene();
          syncLabels();
        },
      })
      .finished.then((done) => {
        if (!done || token !== s.run) return false;
        s.hv = h1;
        syncScene();
        refresh();
        return true;
      });
  }

  // ── the action: the big button, the ring, a tap on the ship ─────────────────
  function doAction() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    hintOff();
    act();
  }
  const ringBox = new THREE.Box3();
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_show_p',
    target: () => {
      if (s.step === 'weight')
        return steel.root.visible ? ringBox.setFromCenterAndSize(steel.root.position, tmpB.set(STEEL.r * 2, STEEL.h, STEEL.r * 2)) : null;
      // the stern's part under the water
      ringBox.min.set(7, -s.hv, -HULL.beam / 2);
      ringBox.max.set(HULL.stern, 0.4, HULL.beam / 2);
      return ringBox;
    },
    pad: 6,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: o.coach,
    onAct: () => {
      audio.unlock();
      doAction();
    },
  });

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const list = s.step === 'weight' ? [steel.body] : ship.hull.children;
    return raycaster.intersectObjects(list, false).length > 0;
  }
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      if (s.view === '3d' || !pick(canvasPoint(e))) return;
      e.stopPropagation();
      e.preventDefault();
      doAction();
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      ui.canvasHost.style.cursor = s.view !== '3d' && pick(p) ? (s.locked ? 'not-allowed' : 'pointer') : '';
    });
  });

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
  function stepLoad(dir) {
    if (s.locked) return lockedNudge();
    if (s.step !== 'load') {
      chooseStep('load').then(() => setLoad(s.n + dir));
      return;
    }
    setLoad(s.n + dir);
  }

  // ── state for the book ──────────────────────────────────────────────────────
  function snapshot() {
    const h = target();
    const p = plan();
    return {
      step: s.step,
      phase: s.phase,
      load: s.n,
      mass: shipMass(s.n), // kg
      draft: h, // m
      W: W(), // N
      B: buoyancy(h), // N
      V: displaced(h), // m³
      P2: pressureAt(h), // Pa
      steel: s.step !== 'weight' ? null : s.phase === 0 ? 'air' : s.phase === 1 ? 'water' : 'bottom',
      reading: round(s.reading, 0),
      found: { ...s.found },
      next: p.label.replace('act_', ''),
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange(force = false) {
    const snap = snapshot();
    const key = JSON.stringify([snap.step, snap.phase, snap.load, snap.found, snap.mode, snap.view]);
    if (key === lastEmitted && !force) return;
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
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
  function choicesOf(items, kind, label) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="by-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  /** A question's scene: this load, this step and phase, these labels; nothing moving. */
  function scene_(n, step, phase, show = {}) {
    s.run++;
    tweener.cancel('drop');
    tweener.cancel('settle');
    s.n = fixLoad(n);
    s.drop.fill(0);
    s.hv = target();
    s.show = { values: true, arrows: true, h: true, V: true, reading: true, ...show };
    sceneFor(step, phase);
    refresh();
    return flyTo(viewPose(), 0.6);
  }
  function revealAll() {
    s.show = { values: true, arrows: true, h: true, V: true, reading: true };
    syncScene();
    refresh();
  }
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const paText = (v) => `${G_(v)}${NBSP}Pa`;
  const nText = (v) => `${G_(v)}${NBSP}N`;

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
        learnSaved = { step: s.step, n: s.n, found: { ...s.found } };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        const saved = learnSaved;
        s.show = { values: true, arrows: true, h: true, V: true, reading: true };
        s.found = { ...(saved?.found || s.found) };
        syncUI();
        s.run++;
        s.n = saved?.n ?? s.n;
        s.drop.fill(0);
        s.hv = target();
        sceneFor(saved?.step ?? 'pressure', 0);
        refresh();
        emitChange();
        flyTo(viewPose(), 0);
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = ['sides', 'pressure', 'displaced', 'more', 'steel'][i % 5];
        const n = pickOne(QUIZ_LOADS);
        if (kind === 'sides') {
          await scene_(n, 'pressure', 1, { values: false, h: false });
          if (!alive()) return null;
          question = { kind };
          const items = ['c_cancel', 'c_lift', 'c_down', 'c_one_side'].map((key) => ({ key }));
          return { text: t('q_sides'), ...choicesOf(items, kind, (x) => t(x.key)) };
        }
        if (kind === 'pressure') {
          await scene_(n, 'pressure', 1, { arrows: false });
          if (!alive()) return null;
          const h = target();
          question = { kind, h };
          return { text: t('q_pressure'), ...choicesOf(pressureChoices(h), kind, (x) => paText(x.v)) };
        }
        if (kind === 'displaced') {
          await scene_(n, 'displaced', 1, { values: false, reading: false });
          if (!alive()) return null;
          const V = displaced(target());
          question = { kind, V };
          return { text: t('q_displaced'), ...choicesOf(displacedChoices(V), kind, (x) => nText(x.v)) };
        }
        if (kind === 'more') {
          await scene_(Math.min(n, MAX_CONTAINERS - 2), 'load', 0, { values: false });
          if (!alive()) return null;
          question = { kind };
          const items = ['c_deeper_more', 'c_deeper_same', 'c_sink_all', 'c_rise'].map((key) => ({ key }));
          return { text: t('q_more'), ...choicesOf(items, kind, (x) => t(x.key)) };
        }
        await scene_(0, 'weight', 2, { values: false });
        if (!alive()) return null;
        question = { kind: 'steel' };
        const items = ['c_less_water', 'c_heavier', 'c_no_push', 'c_pull_down'].map((key) => ({ key }));
        return { text: t('q_steel'), ...choicesOf(items, 'steel', (x) => t(x.key)) };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrongKey = correct ? null : q.list?.[picked]?.key;
        const note = (map) => (wrongKey && map[wrongKey] ? ` ${t(map[wrongKey], { d: N(HULL.depth) })}` : '');
        revealAll();
        if (k === 'pressure') {
          const h = question.h;
          return (
            t('why_pressure', { P: G_(pressureAt(h)), h: D1(h), rho: G_(RHO), g: N(G) }) +
            note({ noG: 'mis_noG', deck: 'mis_deck', force: 'mis_force' })
          );
        }
        if (k === 'displaced') {
          const V = question.V;
          return (
            t('why_displaced', { F: G_(buoyancy(target())), V: N(round(V, 1)), rho: G_(RHO), g: N(G) }) +
            note({ mass: 'mis_mass', noRho: 'mis_noRho', steel: 'mis_steel' })
          );
        }
        if (k === 'sides') return t('why_sides') + note({ c_lift: 'mis_lift', c_down: 'mis_down', c_one_side: 'mis_one_side' });
        if (k === 'more') return t('why_more') + note({ c_deeper_same: 'mis_deeper_same', c_sink_all: 'mis_sink_all', c_rise: 'mis_rise' });
        return (
          t('why_steel', { rs: G_(RHO_STEEL), rw: G_(RHO) }) +
          note({ c_heavier: 'mis_heavier', c_no_push: 'mis_no_push', c_pull_down: 'mis_pull_down' })
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
    s.run++;
    s.found = { pressure: false, sum: false, lower: false, drop: false, ghost: false, load: false };
    tweener.cancel('drop');
    s.n = 0;
    s.drop.fill(0);
    s.hv = target();
    return chooseStep('pressure');
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.example) {
      if (s.locked) lockedNudge();
      else if (b.dataset.example !== s.step || s.phase > 0) chooseStep(b.dataset.example);
    }
    if (b.dataset.step) stepLoad(Number(b.dataset.dir));
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
    const tgt = /** @type {Element} */ (e.target);
    if (tgt.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    const onButton = Boolean(tgt.closest('button'));
    const sceneKey =
      ['1', '2', '3', '4', 'r', 'R', 'Home', 'ArrowUp', 'ArrowDown', '+', '-'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (['1', '2', '3', '4'].includes(k)) chooseStep(STEPS[Number(k) - 1]);
    else if (k === 'ArrowUp' || k === '+') stepLoad(1);
    else if (k === 'ArrowDown' || k === '-') stepLoad(-1);
    else if ((k === ' ' || k === 'Enter') && !onButton) doAction();
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  syncUI();
  sceneFor(s.step, 0);
  flyTo(viewPose(), 0);
  syncScene();
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
     * Change any of: step ('pressure' | 'weight' | 'displaced' | 'load'), load (containers 0 … 12; the ship settles to
     * its draft), phase (what the step's action has done: 0, 1, 2; with animate: false it is there at once), view
     * ('front' | '3d'), found (what the rule has already told).
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.found) {
        Object.assign(s.found, p.found);
        refresh();
      }
      if (p.step && (p.step !== s.step || p.phase != null)) await chooseStep(p.step, { animate });
      if (p.load != null) await setLoad(p.load, { animate });
      if (p.phase != null) {
        const ph = Math.max(0, Math.min(s.step === 'pressure' || s.step === 'weight' ? 2 : 1, Math.round(Number(p.phase) || 0)));
        if (ph !== s.phase && s.step !== 'load') {
          if (s.phase > ph) sceneFor(s.step, 0);
          while (s.phase < ph) await act({ jump: !animate });
        }
      }
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      s.show = { values: true, arrows: true, h: true, V: true, reading: true };
      await setView('front', { animate: false });
      await goHome();
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The ship with its load, in metres (keel at the bottom). */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'CargoShip';
      const c = ship.root.clone(true);
      c.position.set(0, 0, 0);
      g.add(c);
      return g;
    },
  };
}
