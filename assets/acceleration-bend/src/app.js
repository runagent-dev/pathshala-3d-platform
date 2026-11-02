// Acceleration on a bend (book page 43, topic 2.6), student view: a CNG auto-rickshaw at a steady 2.5 m/s on open
// sand; holding বাঁয়ে or ডানে turns it. The speedometer stays put, but the বেগ arrow turns, so ত্বরণ আছে (towards
// the middle of the turn) while it turns, and only then. The straight road (speeding up, braking, the বেগ–সময় graph)
// is the lab acceleration. Then a short test. Built on the shared student kit (@shared/student/…); the physics is in
// drive.js.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener } from '@shared/tween.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createCoach } from '@shared/student/coach.js';
import { ICONS, svg } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createArrow } from './arrow.js';
import { blobTexture, createCNG } from './cng.js';
import { TICK, TURN, TURN_ACCEL, dirOf, fixed, fmt, newTurn, tickTurn, turnCentre, turnStep, turnVectors } from './drive.js';
import { createCompass, createSpeedometer } from './gauges.js';
import { createI18n } from './i18n.js';
import { createField } from './street.js';

export const DEFAULTS = {
  view: 'front', // 'front' (from above) | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

// one colour per meaning: বেগ blue; the ত্বরণ of turning purple, ত্বরণ নেই grey (style.css has the same).
// Arrows, lines and the track use the colours; words use the darker shades of the same (readable on white).
const COLORS = {
  velocity: '#1c6fd9',
  up: '#7048e8',
  none: '#868e96',
  turn: '#7048e8',
  track: '#a9b1ba',
  ink: '#1d2733',
};
const TEXT = { velocity: '#1c63c4', none: '#5c6670', turn: '#6741d9' };
const V_SCALE = 0.6; // m of arrow per m/s (2.5 m/s: 1.5 m)
const A_SCALE = 0.75; // m of arrow per ms⁻², seen from farther away (2.1 ms⁻²: 1.6 m)
const BEND_Y = { v: 1.95, a: 2.05 }; // both arrows lie just over the roof

const PEDAL_ICONS = {
  left: svg('<path d="M17 20v-6a5 5 0 0 0-5-5H6"/><path d="M10 5L6 9l4 4"/>'),
  right: svg('<path d="M7 20v-6a5 5 0 0 1 5-5h6"/><path d="M14 5l4 4-4 4"/>'),
};

// where the camera looks from (from the target towards the camera): az turns from the south towards the east
const look = (azDeg, elDeg) => {
  const az = THREE.MathUtils.degToRad(azDeg);
  const el = THREE.MathUtils.degToRad(elDeg);
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
};
// from above but tilted, north up (the camera does not turn with the CNG, so its arrows are seen turning)
const VIEWS = { front: look(0, 42), '3d': look(-35, 28) };

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const U = (key) => `<span class="ac-u">${t(key)}</span>`;

  root.classList.add('pvc', 'ac');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side', // the panel beside the 3D on landscape frames (kit 1.5.0)
    learn: `
          <div class="ac-top">
            <button class="pvc-btn ac-restart" data-act="restart">${ICONS.reset}<span>${t('act_restart')}</span></button>
          </div>
          <div class="ac-big">
            <div class="ac-dial">
              <div class="ac-compass"></div>
              <div class="ac-reads">
                <div class="ac-read"><span><span class="k">${t('speed_name')}</span> <b data-v="speed"></b></span><small>${t('speed_same')}</small></div>
                <div class="ac-read"><span><span class="k">${t('dir_name')}</span> <b data-v="dir"></b></span><small data-v="dir-c"></small></div>
              </div>
            </div>
          </div>
          <div class="ac-mid">
            <div class="ac-acc">
              <span class="ac-k"><b>${t('lbl_acc')}</b></span>
              <span class="ac-res"><b data-v="acc"></b><small data-v="acc-c"></small></span>
            </div>
          </div>
          <p class="ac-say"></p>`,
  });
  // in the panel, under আবার শুরু: the two pedals and the speed (nothing floats on the 3D view)
  const speedoEl = document.createElement('div');
  speedoEl.className = 'ac-speedo';
  const pedalsEl = document.createElement('div');
  pedalsEl.className = 'ac-pedals';
  pedalsEl.setAttribute('role', 'group');
  pedalsEl.setAttribute('aria-label', t('pedals'));
  pedalsEl.innerHTML = `<button class="ac-pedal" data-side="left"></button><button class="ac-pedal" data-side="right"></button>`;
  const acts = document.createElement('div');
  acts.className = 'ac-acts';
  acts.append(pedalsEl, speedoEl);
  ui.$('.ac-top').after(acts);
  const pedalBtn = { left: pedalsEl.querySelector('[data-side="left"]'), right: pedalsEl.querySelector('[data-side="right"]') };

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.1, far: 400, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.minDistance = 4;
  controls.maxDistance = 60;
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI * 0.48; // never under the road
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const annotations = createAnnotations({ stage, layer: ui.annoLayer });
  // a soft, slightly muted sky (never white), the far ground fading into its haze
  if (o.bg !== 'transparent') {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 256;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#9fbad3');
    grad.addColorStop(0.6, '#cfdbe5');
    grad.addColorStop(1, '#e4ded2');
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 256);
    const sky = new THREE.CanvasTexture(c);
    sky.colorSpace = THREE.SRGBColorSpace;
    scene.background = sky;
  }
  scene.fog = new THREE.Fog(0xe4ded2, 30, 80);

  const field = createField({ colors: COLORS });
  const cng = createCNG();
  scene.add(field.root, cng.root);

  const blobMat = new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, toneMapped: false });
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.9), blobMat);
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.012;
  blob.userData.noExport = true;
  cng.root.add(blob);

  const vArrow = createArrow({ color: COLORS.velocity, name: 'Velocity' });
  const aArrow = createArrow({ color: COLORS.turn, name: 'Acceleration' });
  scene.add(vArrow.root, aArrow.root);

  // while the CNG turns, the circle it is going round (dashed) and the middle of it, where its ত্বরণ points
  const turnRing = new THREE.Group();
  const turnSpoke = new THREE.Group(); // the dashed radius from the middle (raised) towards the CNG
  turnRing.name = 'TurnCircle';
  turnRing.userData.noExport = true;
  turnRing.visible = false;
  {
    const n = 44;
    const dashes = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(((2 * Math.PI * TURN.r) / n) * 0.55, 0.08).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: COLORS.turn, transparent: true, opacity: 0.6, depthWrite: false, toneMapped: false }),
      n,
    );
    const m = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      m.makeRotationY(-a - Math.PI / 2).setPosition(TURN.r * Math.cos(a), 0.035, -TURN.r * Math.sin(a));
      dashes.setMatrixAt(i, m);
    }
    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(0.26, 24).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false }),
    );
    halo.position.y = 0.036;
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.17, 24).rotateX(-Math.PI / 2), dashes.material.clone());
    dot.material.opacity = 1;
    dot.position.y = 0.04;
    // the middle is also marked at the height of the arrows, on a thin stalk from the ground dot, with a dashed radius
    // from the CNG to it at that height: the ত্বরণ arrow lies along that radius, so on the screen it points at the
    // marker in every view (a level arrow over the roof would aim above a mark on the ground)
    const solid = new THREE.MeshBasicMaterial({ color: COLORS.turn, toneMapped: false });
    const faint = new THREE.MeshBasicMaterial({ color: COLORS.turn, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false });
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, BEND_Y.a - 0.04, 8).translate(0, (BEND_Y.a + 0.04) / 2, 0), faint);
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 12), solid);
    marker.position.y = BEND_Y.a;
    const rim = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 18, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide, toneMapped: false }),
    );
    rim.position.y = BEND_Y.a;
    const nd = 9;
    const radius = new THREE.InstancedMesh(new THREE.BoxGeometry(0.17, 0.035, 0.035), faint, nd);
    for (let i = 0; i < nd; i++) radius.setMatrixAt(i, m.makeTranslation(0.3 + (i + 0.5) * ((TURN.r - 0.5) / nd), BEND_Y.a, 0));
    turnSpoke.add(radius);
    turnRing.add(dashes, halo, dot, stalk, rim, marker, turnSpoke);
  }
  scene.add(turnRing);

  const shadows = o.shadow && o.bg !== 'transparent';
  let sun = null;
  if (shadows) {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    sun = new THREE.DirectionalLight(0xffffff, 0.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 30 });
    sun.shadow.radius = 5;
    scene.add(sun, sun.target);
    blob.visible = false;
  }

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    // who holds which pedal: 'pointer:<id>' | 'key:<key>' | 'api' (the bridge) | 'quiz' → 'left' | 'right'
    holds: new Map(),
    turn: { st: newTurn(), prev: { e: 0, north: 0, h: 0 }, prevSteer: 0, clock: 0, ticks: 0 },
    steered: false, // the student has turned it once (the first-use pointer then stops)
    plainTrack: false, // the test: the track is not coloured by turning
  };
  const anchor = new THREE.Vector3(); // what the camera follows
  const smooth = new THREE.Vector3(); // it follows a little behind
  const rel = { position: new THREE.Vector3(0, 3, 14), target: new THREE.Vector3(0, 1.4, 0) }; // camera, from the anchor

  // ── pedals: press and hold (several fingers or keys may hold at once) ─────────
  const held = (side) => [...s.holds.values()].includes(side);
  const steer = () => (held('left') === held('right') ? 'none' : held('left') ? 'left' : 'right');

  const byStudent = (source) => source.startsWith('pointer:') || source.startsWith('key:');
  function press(source, side) {
    if (s.holds.get(source) === side) return;
    if (s.locked && source !== 'quiz') return lockedNudge();
    if (byStudent(source)) {
      // the student's own finger or key takes over from anything the bridge was holding
      s.holds.delete('api');
      s.steered = true;
      audio.unlock();
      audio.pop();
      coach?.objectUsed();
    }
    s.holds.set(source, side);
    syncPedals();
    refresh();
    emit('pedal', { pedal: steer() });
  }
  function release(source) {
    if (!s.holds.delete(source)) return;
    syncPedals();
    refresh();
    emit('pedal', { pedal: steer() });
  }
  function releaseAll() {
    s.holds.clear();
    syncPedals();
  }
  function syncPedals() {
    for (const side of ['left', 'right']) {
      const b = pedalBtn[side];
      const on = held(side);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    }
  }
  function labelPedals() {
    for (const side of ['left', 'right']) {
      const b = pedalBtn[side];
      b.dataset.pedal = side;
      b.innerHTML = `${PEDAL_ICONS[side]}<span>${t(`pedal_${side}`)}</span>`;
    }
  }
  let shownKind = ''; // what the arrow labels show now
  // each arrow label is made again only when what it says or where it sits changes (so it does not flicker)
  const labelKeys = { v: '', a: '', c: '' };
  const labelEls = {};
  function label(id, key, make) {
    if (labelKeys[id] === key) return;
    labelKeys[id] = key;
    annotations.remove(id);
    labelEls[id] = null;
    if (key) {
      make();
      labelEls[id] = ui.annoLayer.lastElementChild; // the label just made (the kit adds it last)
    }
  }
  /** Forget the arrow labels: they are made again on the next frame (after a change of mode or question). */
  function relabel() {
    shownKind = '';
    for (const id of Object.keys(labelKeys)) {
      labelKeys[id] = '';
      labelEls[id] = null;
      annotations.remove(id);
    }
  }
  const tmpA = new THREE.Vector3();

  // ── the CNG on the sand ─────────────────────────────────────────────────────
  function newBend() {
    s.turn = { st: newTurn(), prev: { e: 0, north: 0, h: 0 }, prevSteer: 0, clock: 0, ticks: 0 };
    field.clearTrack();
    smooth.set(0, 0, 0);
  }
  const turnSign = (name) => (name === 'left' ? 1 : name === 'right' ? -1 : 0);
  function tickBend(dt) {
    const T = s.turn;
    T.clock += dt;
    while (T.ticks * TICK <= T.clock + 1e-9) {
      T.prev = { e: T.st.e, north: T.st.north, h: T.st.h };
      const name = steer();
      T.prevSteer = turnSign(name);
      field.addPoint(T.prev.e, T.prev.north, T.prev.h, T.prevSteer !== 0 && !s.plainTrack);
      tickTurn(T.st, name);
      T.ticks++;
    }
    const f = Math.min(1, Math.max(0, T.clock / TICK - (T.ticks - 1)));
    const p = turnStep(T.prev.e, T.prev.north, T.prev.h, T.prevSteer, f * TICK);
    placeBend(p.e, p.north, p.h, T.prevSteer, dt);
    const key = `${T.prevSteer}|${dirOf(p.h)}`;
    if (key !== tickBend.key) {
      tickBend.key = key;
      refresh();
      emitChange();
    }
    compass.set(p.h, T.prevSteer);
    return true;
  }
  const bend = { v: new THREE.Vector3(1, 0, 0), a: new THREE.Vector3(0, 0, -1), centre: new THREE.Vector3(), turning: 0 };
  function placeBend(e, north, h, sgn, dt) {
    cng.root.position.set(e, 0, -north);
    cng.root.rotation.set(0, h, 0);
    cng.roll(TURN.v * (s.turn.ticks * TICK));
    cng.steer(sgn * 0.38);
    field.follow(e, -north);
    const showAcc = s.mode !== 'quiz' || quiz.revealed;
    // while it turns: the circle it goes round and its middle; the camera then looks half-way between the two, so
    // the CNG, its arrows and the middle of the turn are all in the picture (and it follows a little behind)
    const c = turnCentre(e, north, h, sgn);
    bend.centre.set(c.e, 0, -c.north);
    bend.turning = sgn;
    turnRing.visible = Boolean(sgn) && showAcc;
    turnRing.position.copy(bend.centre);
    tmpA.set(e, 0, -north);
    if (sgn) tmpA.lerp(bend.centre, 0.5);
    if (dt === null || smooth.distanceTo(tmpA) > 12) smooth.copy(tmpA);
    else smooth.lerp(tmpA, 1 - Math.exp(-(dt || 0) / 0.45));
    anchor.copy(smooth);
    // the arrows just over the roof, from its middle: বেগ along the way it goes, ত্বরণ towards the middle of the turn
    const vec = turnVectors(h, sgn);
    bend.v.set(vec.ve, 0, -vec.vn).normalize();
    vArrow.root.scale.set(1.7, 1, 1.7); // thicker: the bend is seen from farther away
    aArrow.root.scale.set(1.7, 1, 1.7);
    vArrow.set(tmpA.set(e, BEND_Y.v, -north), bend.v, TURN.v * V_SCALE);
    if (sgn) bend.a.set(vec.ae, 0, -vec.an).normalize();
    turnSpoke.rotation.y = Math.atan2(bend.a.z, -bend.a.x); // the dashed radius runs from the middle out to the CNG
    // the ত্বরণ arrow starts over the side of the CNG that faces the middle of the turn, and points at it
    aArrow.set(tmpA.set(e, BEND_Y.a, -north).addScaledVector(bend.a, 0.45), bend.a, sgn ? TURN_ACCEL * A_SCALE : 0);
    aArrow.setColor(COLORS.turn);
    if (!showAcc) aArrow.root.visible = false;
    const kind = `${sgn ? 'turn' : 'straight'}|${showAcc}`;
    if (kind !== shownKind) {
      shownKind = kind;
      bendLabels(sgn, showAcc);
    }
    speedo.set(TURN.v, N(fixed(TURN.v, 1)));
    moveSun();
  }
  /** The bend's labels: words without leaders, each put where it collides with nothing (see placeBendLabels). */
  function bendLabels(sgn, showAcc) {
    const tag = (id, text, color, point) => annotations.add(id, { text, point, dx: 0, dy: 0, kind: 'tag', color });
    label('v', 'bend', () => tag('v', t('lbl_velocity'), TEXT.velocity, () => bendSpots.v));
    label('a', showAcc ? `bend|${sgn ? 'turn' : 'straight'}` : '', () =>
      tag('a', t(sgn ? 'lbl_acc' : 'lbl_no_acc'), sgn ? TEXT.turn : TEXT.none, () => bendSpots.a),
    );
    label('c', showAcc && sgn ? 'bend' : '', () => tag('c', t('lbl_centre'), TEXT.turn, () => bendSpots.c));
  }
  const bendSpots = { v: new THREE.Vector3(), a: new THREE.Vector3(), c: new THREE.Vector3() };
  const lastSpot = {}; // the candidate each label took last frame
  const HIDDEN = new THREE.Vector3(0, -1e6, 0); // a point no camera sees: the label is hidden (nothing fits)
  const projected = new THREE.Vector3();
  /** A point on the canvas (px) and its depth (NDC z), or null behind the camera. */
  function toCanvas(p) {
    projected.copy(p).project(camera);
    if (projected.z > 1) return null;
    return { x: (projected.x * 0.5 + 0.5) * stage.width, y: (-projected.y * 0.5 + 0.5) * stage.height, z: projected.z };
  }
  /** The canvas point (px) at a depth, back in 3D (for the label kit, which wants a 3D point). */
  const fromCanvas = (x, y, z, out) => out.set((x / stage.width) * 2 - 1, -(y / stage.height) * 2 + 1, z).unproject(camera);
  const CNG_BOX = [-1.42, 1.42].flatMap((x) => [0, 1.75].flatMap((y) => [-0.66, 0.66].map((z) => new THREE.Vector3(x, y, z))));
  const cornerTmp = new THREE.Vector3();
  /**
   * Each frame on the bend: where its labels go. A label tries a few spots (past the tip of its arrow, beside the
   * tip, beside the middle; around the CNG for ত্বরণ নেই; round the middle of the turn) and takes the first that
   * stays inside the picture and clear of the corner buttons, the speedometer, the pedals, the CNG, both arrows and
   * the other labels; when none does, the least covered one (ত্বরণ নেই and the middle's label are hidden instead).
   */
  function placeBendLabels() {
    camera.updateMatrixWorld();
    const W = stage.width;
    const H = stage.height;
    const c = stage.canvas.getBoundingClientRect();
    const rectOf = (el, pad = 4) => {
      if (!el || el.hidden || getComputedStyle(el).visibility === 'hidden') return null;
      const r = el.getBoundingClientRect();
      return r.width ? { l: r.left - c.left - pad, t: r.top - c.top - pad, r: r.right - c.left + pad, b: r.bottom - c.top + pad } : null;
    };
    const blocks = [rectOf(ui.corner)].filter(Boolean);
    // the CNG as the box round its projected corners
    let box = null;
    for (const k of CNG_BOX) {
      const q = toCanvas(cornerTmp.copy(k).applyMatrix4(cng.root.matrixWorld));
      if (!q) continue;
      box = box
        ? { l: Math.min(box.l, q.x), t: Math.min(box.t, q.y), r: Math.max(box.r, q.x), b: Math.max(box.b, q.y) }
        : { l: q.x, t: q.y, r: q.x, b: q.y };
    }
    if (box) blocks.push(box);
    // the arrows (and the middle of the turn) as short runs of small boxes
    const arrowPts = (arrow) => {
      if (!arrow.root.visible) return [];
      const a = toCanvas(arrow.root.position);
      const b = toCanvas(arrow.tip);
      if (!a || !b) return [];
      return {
        a,
        b,
        boxes: Array.from({ length: 7 }, (_, i) => ({ x: a.x + ((b.x - a.x) * i) / 6, y: a.y + ((b.y - a.y) * i) / 6 })).map((p) => ({
          l: p.x - 6,
          t: p.y - 6,
          r: p.x + 6,
          b: p.y + 6,
        })),
      };
    };
    const va = arrowPts(vArrow);
    const aa = arrowPts(aArrow);
    for (const x of [va, aa]) if (x.boxes) blocks.push(...x.boxes);
    // the middle of the turn: the raised marker, its stalk down to the ground dot, and the dashed radius to the CNG
    const cc = turnRing.visible ? toCanvas(cornerTmp.copy(bend.centre).setY(BEND_Y.a)) : null;
    if (cc) {
      const ground = toCanvas(bend.centre);
      const roof = toCanvas(cornerTmp.copy(cng.root.position).setY(BEND_Y.a));
      blocks.push({ l: cc.x - 12, t: cc.y - 12, r: cc.x + 12, b: cc.y + 12 });
      for (const end of [ground, roof])
        if (end)
          for (let i = 1; i <= 6; i++) {
            const x = cc.x + ((end.x - cc.x) * i) / 6;
            const y = cc.y + ((end.y - cc.y) * i) / 6;
            blocks.push({ l: x - 5, t: y - 5, r: x + 5, b: y + 5 });
          }
    }

    const overlap = (p, q) => Math.max(0, Math.min(p.r, q.r) - Math.max(p.l, q.l)) * Math.max(0, Math.min(p.b, q.b) - Math.max(p.t, q.t));
    function choose(id, el, candidates, z, { hideIfNone = false } = {}) {
      if (!el) return;
      const hw = el.offsetWidth / 2 + 3;
      const hh = el.offsetHeight / 2 + 3;
      let best = null;
      // the spot used last time goes first while it stays free, so a label does not hop between two free spots
      const order = candidates.map((_, i) => i);
      const last = lastSpot[id] ?? -1;
      if (last > 0 && last < order.length) order.unshift(...order.splice(last, 1));
      for (const i of order) {
        const [x, y] = candidates[i];
        const r = { l: x - hw, t: y - hh, r: x + hw, b: y + hh };
        const outside = r.l < 6 || r.t < 6 || r.r > W - 6 || r.b > H - 6;
        const cover = blocks.reduce((sum, q) => sum + overlap(r, q), 0) + (outside ? 1e6 : 0);
        if (!best || cover < best.cover) best = { x, y, r, cover, i };
        if (cover === 0) break;
      }
      lastSpot[id] = best?.i ?? -1;
      if (!best || (hideIfNone && best.cover > 0)) return bendSpots[id].copy(HIDDEN);
      blocks.push(best.r); // the next labels keep clear of this one
      fromCanvas(best.x, best.y, z, bendSpots[id]);
    }
    /** Spots round an arrow: past its tip, beside the tip (both sides), beside its middle (both sides). */
    const aroundArrow = (ar, el) => {
      const dx = ar.b.x - ar.a.x;
      const dy = ar.b.y - ar.a.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const hw = el.offsetWidth / 2 + 6;
      const hh = el.offsetHeight / 2 + 6;
      const reach = (nx, ny) => Math.abs(nx) * hw + Math.abs(ny) * hh; // how far the box's centre must be along (nx, ny)
      const mx = (ar.a.x + ar.b.x) / 2;
      const my = (ar.a.y + ar.b.y) / 2;
      const along = reach(ux, uy);
      const side = reach(-uy, ux);
      return [
        [ar.b.x + ux * along, ar.b.y + uy * along],
        [ar.b.x - uy * side, ar.b.y + ux * side],
        [ar.b.x + uy * side, ar.b.y - ux * side],
        [mx - uy * side, my + ux * side],
        [mx + uy * side, my - ux * side],
        [ar.b.x + ux * along - uy * side, ar.b.y + uy * along + ux * side],
        [ar.b.x + ux * along + uy * side, ar.b.y + uy * along - ux * side],
      ];
    };
    /** Spots round a box: right, left, below, above (with a little gap). */
    const aroundBox = (b, el) => {
      const hw = el.offsetWidth / 2 + 8;
      const hh = el.offsetHeight / 2 + 8;
      const cx = (b.l + b.r) / 2;
      const cy = (b.t + b.b) / 2;
      return [
        [b.r + hw, cy],
        [b.l - hw, cy],
        [cx, b.b + hh],
        [cx, b.t - hh],
        [b.r + hw, b.b + hh],
        [b.l - hw, b.b + hh],
      ];
    };
    if (labelEls.v && va.a) choose('v', labelEls.v, aroundArrow(va, labelEls.v), va.b.z);
    if (labelEls.a) {
      if (bend.turning && aa.a) choose('a', labelEls.a, aroundArrow(aa, labelEls.a), aa.b.z);
      else if (box) {
        const z = toCanvas(cng.root.position)?.z ?? 0.5;
        choose('a', labelEls.a, aroundBox(box, labelEls.a), z, { hideIfNone: true });
      }
    }
    if (labelEls.c && cc) {
      const r = { l: cc.x - 12, t: cc.y - 12, r: cc.x + 12, b: cc.y + 12 };
      choose('c', labelEls.c, aroundBox(r, labelEls.c).slice(0, 4).reverse(), cc.z, { hideIfNone: true });
    }
  }
  stage.onBeforeRender(placeBendLabels);

  function moveSun() {
    if (!sun) return;
    const p = cng.root.position;
    sun.position.set(p.x + 3, 12, p.z + 5);
    sun.target.position.copy(p);
  }

  // the motion runs on real time (performance.now), not the stage's capped frame time, so a slow phone still shows
  // 1 s as 1 s; a long pause (a hidden tab) counts as at most a quarter of a second
  let lastNow = performance.now();
  stage.addTicker(() => {
    const now = performance.now();
    const dt = Math.min(0.25, Math.max(0, (now - lastNow) / 1000));
    lastNow = now;
    const moving = tickBend(dt);
    followCamera();
    return moving;
  });

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const cells = {};
  for (const node of root.querySelectorAll('.pvc-learn [data-v]')) cells[node.dataset.v] = { node, html: null };
  function put(k, html) {
    const c = cells[k];
    if (c && c.html !== html) {
      c.html = html;
      c.node.innerHTML = html;
    }
  }
  const sayEl = $('.ac-say');
  let sayShown = '';
  const say = (html) => {
    if (html !== sayShown) {
      sayShown = html;
      sayEl.innerHTML = html;
    }
  };
  const compass = createCompass($('.ac-compass'), { t, colors: COLORS });
  const speedo = createSpeedometer(speedoEl, { t, N, colors: COLORS });

  function refresh() {
    const T = s.turn;
    const sgn = T.prevSteer;
    put('speed', `${N(fixed(TURN.v, 1))} ${U('u_ms')}`);
    put('dir', t(`dir_${dirOf(T.st.h)}`));
    put('dir-c', t(sgn ? 'dir_changing' : 'dir_same'));
    cells['dir-c'].node.dataset.on = String(Boolean(sgn));
    put('acc', t(sgn ? 'acc_yes' : 'acc_no'));
    put('acc-c', t(sgn ? 'acc_center' : 'acc_none_why'));
    cells.acc.node.parentElement.dataset.kind = sgn ? 'up' : 'none';
    say(t(sgn ? 'say_turn' : 'say_straight'));
    stage.invalidate();
  }

  function snapshot() {
    const T = s.turn;
    return {
      view: s.view,
      mode: s.mode,
      pedal: steer(),
      speed: TURN.v,
      heading: +((((T.st.h * 180) / Math.PI) % 360) + 360).toFixed(1) % 360,
      direction: dirOf(T.st.h),
      turning: T.prevSteer === 1 ? 'left' : T.prevSteer === -1 ? 'right' : 'none',
      acceleration: T.prevSteer ? +TURN_ACCEL.toFixed(3) : 0,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = `${snap.mode}|${snap.pedal}|${snap.turning}|${snap.direction}`;
    if (key === lastEmitted) return;
    lastEmitted = key;
    emit('change', snap);
  }

  // ── camera: framed round the CNG (or half-way to the middle of its turn), clear of the buttons; it follows ──
  const WORLD_UP = new THREE.Vector3(0, 1, 0);
  /** What must be in the picture, from the anchor: a ring with room for the arrows and their labels (the labels
   *  find their own free spots each frame); some points carry a label box on the screen [l, t, r, b] px. */
  function contentOf() {
    const P = (x, y, z, box = null) => ({ p: new THREE.Vector3(x, y, z), box });
    const pts = [];
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      pts.push(P(3.1 * Math.cos(a), 0, 3.1 * Math.sin(a)), P(2.6 * Math.cos(a), 2, 2.6 * Math.sin(a), [-26, -13, 26, 13]));
    }
    return pts;
  }
  /** A box on the stage, on the canvas (px), a little bigger; null when it is not shown. */
  function boxOf(el, pad = 6) {
    if (!el || el.hidden || getComputedStyle(el).visibility === 'hidden' || getComputedStyle(el).display === 'none') return null;
    const c = stage.canvas.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (!r.width) return null;
    return { left: r.left - c.left - pad, right: r.right - c.left + pad, top: r.top - c.top - pad, bottom: r.bottom - c.top + pad };
  }
  function fitPose(view) {
    const pts = contentOf();
    const lo = new THREE.Vector3(Infinity, Infinity, Infinity);
    const hi = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    for (const { p } of pts) {
      lo.min(p);
      hi.max(p);
    }
    const target = lo.clone().add(hi).multiplyScalar(0.5);
    target.y = 0.9;
    const back = VIEWS[view].clone();
    const right = new THREE.Vector3().crossVectors(WORLD_UP, back).normalize();
    const up = new THREE.Vector3().crossVectors(back, right);
    const local = pts.map(({ p, box }) => {
      const q = p.clone().sub(target);
      return { x: q.dot(right), y: q.dot(up), z: q.dot(back), box };
    });
    const W = stage.width;
    const H = Math.max(stage.height, 120);
    const boxes = [boxOf(ui.corner)].filter(Boolean);
    const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const th = tv * camera.aspect;
    const M = 8;
    const clear = (px, py) => {
      if (px < M || px > W - M || py < M || py > H - M) return false;
      return !boxes.some((r) => px > r.left && px < r.right && py > r.top && py < r.bottom);
    };
    const fits = (d, sx, sy) =>
      local.every(({ x, y, z, box }) => {
        const depth = d - z;
        if (depth < 0.3) return false;
        const px = W / 2 + (x / (depth * th)) * (W / 2) + sx;
        const py = H / 2 - (y / (depth * tv)) * (H / 2) + sy;
        if (!box) return clear(px, py);
        return (
          clear(px + box[0], py + box[1]) && clear(px + box[2], py + box[1]) && clear(px + box[0], py + box[3]) && clear(px + box[2], py + box[3])
        );
      });
    let best = null;
    for (let sy = -40; sy <= 60; sy += 5)
      for (let sx = -30; sx <= 30; sx += 10) {
        let a = 1;
        let b = 160;
        if (!fits(b, sx, sy)) continue;
        for (let i = 0; i < 26; i++) {
          const mid = (a + b) / 2;
          if (fits(mid, sx, sy)) b = mid;
          else a = mid;
        }
        if (!best || b < best.d - 1e-3) best = { d: b, sx, sy };
      }
    const d = (best?.d ?? 30) * 1.02;
    // the shift moves the picture: the camera moves the other way by as much, at the distance of the scene
    const t2 = target.addScaledVector(up, ((best?.sy ?? 0) / (H / 2)) * d * tv).addScaledVector(right, (-(best?.sx ?? 0) / (W / 2)) * d * th);
    return { target: t2, position: t2.clone().addScaledVector(back, d), distance: d };
  }
  function applyFog(d) {
    scene.fog.near = d + 10;
    scene.fog.far = d + 46;
  }
  function flyTo(pose, duration = 0.8) {
    applyFog(pose.distance ?? 20);
    const p0 = rel.position.clone();
    const t0 = rel.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      rel.position.copy(pose.position);
      rel.target.copy(pose.target);
      followCamera();
      stage.invalidate();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        rel.position.lerpVectors(p0, pose.position, k);
        rel.target.lerpVectors(t0, pose.target, k);
        followCamera();
        stage.invalidate();
      },
    }).finished;
  }
  let following = false;
  /** Keep the camera where it is relative to what it follows (the student may have turned it). */
  function followCamera() {
    following = true;
    camera.position.copy(anchor).add(rel.position);
    controls.target.copy(anchor).add(rel.target);
    controls.update();
    following = false;
  }
  controls.addEventListener('change', () => {
    if (following) return;
    rel.position.copy(camera.position).sub(anchor);
    rel.target.copy(controls.target).sub(anchor);
  });
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(fitPose(s.view), animate ? 0.8 : 0);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  stage.onResize(() => {
    if (!s.userMovedCamera) flyTo(fitPose(s.view), 0);
  });

  // ── the CNG back at the start, going straight ───────────────────────────────
  function toField({ animate = true } = {}) {
    releaseAll();
    relabel();
    annotations.clear();
    tickBend.key = '';
    newBend();
    placeBend(0, 0, 0, 0, null);
    labelPedals();
    s.userMovedCamera = false;
    syncUI();
    flyTo(fitPose(s.view), animate ? 0.7 : 0);
    refresh();
    emitChange();
  }
  function restart() {
    if (s.locked) return lockedNudge();
    releaseAll();
    newBend();
    refresh();
    emitChange();
  }
  /** Turn at once (the bridge's `drive`, the poster): [[steer, seconds], …] from the start; the last one is held. */
  function driveNow(script) {
    releaseAll();
    newBend();
    const T = s.turn;
    let last = 'none';
    for (const [name, secs] of script) {
      last = name === 'left' || name === 'right' ? name : 'none';
      for (let i = Math.round(Number(secs) / TICK); i > 0; i--) {
        T.prev = { e: T.st.e, north: T.st.north, h: T.st.h };
        T.prevSteer = turnSign(last);
        field.addPoint(T.prev.e, T.prev.north, T.prev.h, T.prevSteer !== 0);
        tickTurn(T.st, last);
        T.ticks++;
      }
    }
    T.clock = T.ticks * TICK;
    if (last !== 'none') s.holds.set('api', last);
    syncPedals();
    relabel();
  }

  // ── pointer and keys on the pedals ──────────────────────────────────────────
  pedalsEl.addEventListener('pointerdown', (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest('.ac-pedal');
    if (!b || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    coach?.interrupt();
    try {
      b.setPointerCapture(e.pointerId); // the finger may slide off the pedal and still hold it
    } catch {}
    press(`pointer:${e.pointerId}`, b.dataset.side);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) pedalsEl.addEventListener(type, (e) => release(`pointer:${e.pointerId}`));
  pedalsEl.addEventListener('contextmenu', (e) => e.preventDefault());

  // ── hint line (the test only: in learning the panel says everything) ────────
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

  // ── the test: three questions, each on the sand (the ত্বরণ arrow, the circle and the coloured track are hidden
  // until the answer) ─────────────────────────────────────────────────────────
  const shuffle = (list) => {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  // each question: its choices (the right one first) and the slip each wrong one shows
  const QUESTIONS = {
    bend: { turn: 'left', opts: ['opt_bend_yes_dir', 'opt_bend_no_speed', 'opt_bend_no_dir', 'opt_bend_yes_speed'] },
    dir: { turn: 'right', opts: ['opt_dir_centre', 'opt_dir_forward', 'opt_dir_back', 'opt_dir_out'] },
    straight: { turn: null, opts: ['opt_str_none', 'opt_str_moving', 'opt_str_speed', 'opt_str_forward'] },
  };
  const MISTAKES = {
    opt_bend_no_speed: 'mis_bend_speed',
    opt_bend_no_dir: 'mis_bend_dir',
    opt_bend_yes_speed: 'mis_bend_up',
    opt_dir_forward: 'mis_dir_forward',
    opt_dir_back: 'mis_dir_back',
    opt_dir_out: 'mis_dir_out',
    opt_str_moving: 'mis_str_moving',
    opt_str_speed: 'mis_str_speed',
    opt_str_forward: 'mis_str_forward',
  };
  let kinds = [];
  let question = null;
  let lastPick = -1;
  function clearQuizMarks() {
    s.plainTrack = false;
    relabel();
    releaseAll();
  }

  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 3,
    hooks: {
      enter() {
        s.mode = 'quiz';
        s.locked = true;
        hideHint();
        releaseAll();
        kinds = shuffle(['bend', 'dir', 'straight']);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        clearQuizMarks();
        toField();
        syncUI();
      },
      prepare(i, _alive, sayQ) {
        clearQuizMarks();
        const kind = kinds[i % kinds.length];
        const Q = QUESTIONS[kind];
        lastPick = -1;
        toField({ animate: false });
        s.plainTrack = true;
        if (Q.turn) s.holds.set('quiz', Q.turn);
        relabel();
        const keys = shuffle([...Q.opts]);
        sayQ(t(`q_${kind}`, { v: fmt(TURN.v) }));
        question = { kind, keys };
        return {
          choices: [0, 1, 2, 3],
          expected: keys.indexOf(Q.opts[0]),
          tolerance: 0.5,
          label: (j) => `<span class="ac-opt">${t(keys[j], { v: fmt(TURN.v) })}</span>`,
          meta: { kind },
        };
      },
      reveal(_q, correct) {
        const Q = question;
        relabel(); // the ত্বরণ arrow (or ত্বরণ নেই) and the circle show now
        let why = t(`why_${Q.kind}`, { v: fmt(TURN.v) });
        const k = lastPick >= 0 ? Q.keys[lastPick] : '';
        if (!correct && MISTAKES[k]) why += t(MISTAKES[k]);
        return why;
      },
      done() {
        s.locked = false;
        clearQuizMarks();
        toField();
      },
    },
  });

  // ── first-use pointer: on the বাঁয়ে pedal ──────────────────────────────────
  let coach = null;
  if (o.coach) {
    // spots on the upper part of the pedal, best first (the kit keeps a hand clear of the bottom 48 px)
    const spots = () => {
      const r = boxOf(pedalBtn.left, 0);
      if (!r) return [];
      const x = (r.left + r.right) / 2;
      return [r.top + 14, r.top + 0.25 * (r.bottom - r.top), r.top + 6, r.top + 3].map((y) => ({ x, y }));
    };
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, speedoEl],
      object: {
        label: 'coach_turn',
        candidates: () => (s.mode !== 'quiz' && !s.steered ? spots() : []),
        grabbable: (p) => {
          const r = boxOf(pedalBtn.left, 0);
          return Boolean(r) && p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom;
        },
        demo: null,
        cancel: () => {},
      },
    });
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
    pedalsEl.inert = s.mode === 'quiz';
    coach?.setMode(s.mode);
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  for (const b of ui.$$('[data-view="front"]')) b.textContent = t('view_top_short');
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      lastPick = Number(b.dataset.q);
      quiz.choose(lastPick);
    }
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'restart':
        restart();
        break;
      case 'fullscreen':
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
    }
  });
  // keys: hold ← or → to turn
  const keySide = (k) => (k === 'arrowleft' ? 'left' : k === 'arrowright' ? 'right' : null);
  root.addEventListener('keydown', (e) => {
    const target = /** @type {Element} */ (e.target);
    if (target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const side = keySide(k);
    if (side) {
      if (!e.repeat) press(`key:${k}`, side);
    } else if (k === 'r' && s.mode !== 'quiz') restart();
    else if (k === 'f') setView('front');
    else if (k === 'v') setView('3d');
    else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });
  root.addEventListener('keyup', (e) => release(`key:${e.key.toLowerCase()}`));
  window.addEventListener('blur', () => {
    for (const k of [...s.holds.keys()]) if (k.startsWith('key:') || k.startsWith('pointer:')) s.holds.delete(k);
    syncPedals();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  labelPedals();
  setView(s.view, { animate: false });
  toField({ animate: false });
  syncPedals();
  syncUI();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    else coach?.start(1400);
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
     * Change any of: pedal (held until changed: 'left' | 'right' | 'none'); drive ([[steer, seconds], …] turned at
     * once from the start, the last one held); restart; view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.restart) restart();
      if (p.drive) driveNow(p.drive);
      if (p.pedal != null) {
        const side = p.pedal === 'left' || p.pedal === 'right' ? p.pedal : null;
        if (side) press('api', side);
        else release('api');
      }
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      clearQuizMarks();
      toField({ animate: false });
      await setView('front');
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The CNG itself, at the origin, in metres (arrows, ground and labels are drawings, left out). */
    exportRoot: () => {
      const g = new THREE.Group();
      g.name = 'CNGAutoRickshaw';
      const c = cng.root.clone(true);
      c.position.set(0, 0, 0);
      c.rotation.set(0, 0, 0);
      g.add(c);
      return g;
    },
  };
}
