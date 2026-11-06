// Why a rose looks red (book p217, the part on absorption under topic 8.2.1, figure 8.06): the student view. The book's red
// rose with green leaves, under one lamp. White light comes in as a band of the spectrum colours; every colour but the
// object's own ends at the surface (absorbed), and only red leaves the petal and only green the leaf, toward an eye. Then the
// book's surprise: with red light the leaf has nothing to give back and looks black; with green light the rose does. The
// 3D view multiplies the lamp's colour by each surface's reflectance, channel by channel, so its colours are the rule itself.
// The panel is the kit's clean sheet (one action, one result, one rule). A 5-question test.
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
import { fitPose } from './camera.js';
import { createI18n } from './i18n.js';
import { createRays } from './rays.js';
import { absorbed, BANDS, LAMP, leaving, looks, reflected, shuffle, toEye } from './reading.js';
import { createRose } from './rose.js';
import { createSetting, FRAMES, LAYOUT } from './scene.js';

const RESULT_HOLD = 1000; // ms a finished step's result stays up: a tap on the action before that is ignored
export const DEFAULTS = {
  light: 'white', // 'white' | 'red' | 'green' | 'blue'
  rays: false, // the band and the arrows are drawn
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true, // the numbered ring pulses at first
  numerals: null, // 'bn' | 'latin' (default follows the language)
  lang: 'bn',
  shadow: true,
  sound: true,
};

const LEARN = ['white', 'red', 'green'];
const ALL = [...LEARN, 'blue'];
const MARGINS = { top: 8, bottom: 6, side: 6 };
const BOTH_MARGINS = { top: 6, bottom: 2, side: 4 };
const ORDER = { white: ['rose', 'leaf'], red: ['leaf'], green: ['rose'], blue: [] }; // the close-ups of each light
const WIDE = 1.2; // a view at least this wide has room for the lamp in the frame that shows the idea
const SINGLE = 2.6; // a coloured light's band, in stripes
const WIDTHS = (light) => BANDS.map((b) => (light === 'white' ? 1 : b === light ? SINGLE : 0));
const CHIP = { red: '#c92a2a', green: '#237a35', blue: '#1864ab', white: '#343a40', black: '#212529' };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const dirFrom = (az, el, out = new THREE.Vector3()) => {
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e));
};

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });

  root.classList.add('pvc', 'coo');
  root.dataset.theme = 'light';
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;

  // ── the shell: the sheet of one action, one result, one rule ────────────────────────────────────────────
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', items: LEARN.map((id) => ({ id, label: `ex_${id}` })) },
      quiet: [
        { act: 'replay', label: 'act_replay', icon: ICONS.play },
        { act: 'home', label: 'act_home', icon: ICONS.reset },
      ],
      tight: true,
      lines: { action: 1, outcome: 1, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const caption = document.createElement('p');
  caption.className = 'coo-cap';
  caption.innerHTML = t('cap_book');
  ui.learn.appendChild(caption);
  ui.canvasHost.setAttribute('aria-label', t('aria_stage'));
  const note = document.createElement('div');
  note.className = 'coo-note';
  note.textContent = t('note_rays');
  ui.stage.appendChild(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 24, near: 4, far: 900, environment: false, toneMapping: THREE.NoToneMapping });
  const { camera, controls } = stage;
  controls.enablePan = false;
  const setting = createSetting({ stage, shadow: Boolean(o.shadow) });
  const rose = createRose({ layout: LAYOUT });
  stage.scene.add(rose.root);
  const rays = createRays({ stage, host: ui.canvasHost });

  // ── the state ───────────────────────────────────────────────────────────────────────────────────────────
  let restUntil = 0; // no action before this (performance.now): the last step's result is being looked at
  const start = ALL.includes(o.light) ? o.light : 'white';
  const s = {
    light: start,
    rgb: [...LAMP[start]], // the lamp's light now, linear (it moves when the filter does)
    gel: [...LAMP[start === 'white' ? 'red' : start]],
    filter: start === 'white' ? 0 : 1,
    rays: Boolean(o.rays) || false,
    busy: false,
    seen: new Set(o.rays ? [start] : []),
    mode: 'explore',
    locked: false,
    view: o.view === '3d' ? '3d' : 'front',
    userMovedCamera: false,
    quiz: null,
    frame: 'full', // what the camera shows (FRAMES)
    focus: null, // the object the close-up is on, while it is
  };
  let token = 0;
  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── what the 3D shows, from the state ──────────────────────────────────────────────────────────────────
  function applyLight() {
    setting.light(s.rgb);
    setting.lamp.set(s.filter, s.rgb, s.gel);
  }
  function keepsFor(light) {
    return {
      rose: reflected('rose', light)[0] ?? null,
      leaf: reflected('leaf', light)[0] ?? null,
    };
  }
  /** Everything drawn in its final place, at once. */
  function settle(light, on) {
    const v = rays.view;
    const k = keepsFor(light);
    v.widths.set(WIDTHS(light));
    v.rose.on = v.leaf.on = true;
    for (const name of ['rose', 'leaf']) {
      const p = v[name];
      p.grow = on ? 1 : 0;
      p.keeps = k[name];
      p.absorb = on && absorbed(name, light).length ? 1 : 0;
      p.out = on && k[name] ? 1 : 0;
      p.sight = on && !k[name] ? 1 : 0;
    }
    s.rgb = [...LAMP[light]];
    s.filter = light === 'white' ? 0 : 1;
    if (light !== 'white') s.gel = [...LAMP[light]];
    s.frame = on ? 'both' : 'full';
    s.focus = null;
    applyLight();
  }

  const RUNS = ['out', 'light', 'hold', 'camera', 'out-rose', 'out-leaf', 'grow-rose', 'grow-leaf', 'absorb-rose', 'absorb-leaf'];
  function stopRun() {
    ++token;
    for (const k of RUNS) tweener.cancel(k);
    s.busy = false;
    s.focus = null;
  }

  /**
   * The story of one light, told by the camera. It looks at the lamp while the light changes and the band comes; then it goes
   * close to each object in turn while what is absorbed sinks in and what is left leaves for the eye; then it stands back
   * to the picture that shows the whole idea. quick: no close-ups (the test).
   */
  async function run(light, { quick = false, band = true } = {}) {
    stopRun();
    const my = token;
    const alive = () => my === token;
    const v = rays.view;
    s.busy = true;
    clearLabels();
    s.light = light;
    draw();
    const tween = (key, duration, onUpdate, e = ease.inOutCubic) =>
      tweener.animate({
        key,
        duration,
        ease: e,
        onUpdate: (k) => {
          if (alive()) {
            onUpdate(k);
            stage.invalidate();
          }
        },
      }).finished;
    const hold = (duration) => tween('hold', duration, () => {});

    // what was leaving stops
    const r0 = v.rose;
    const l0 = v.leaf;
    const fromOut = [r0.out, l0.out, r0.sight, l0.sight];
    if (fromOut.some((x) => x > 0)) {
      await tween('out', 0.25, (k) => {
        r0.out = fromOut[0] * (1 - k);
        l0.out = fromOut[1] * (1 - k);
        r0.sight = fromOut[2] * (1 - k);
        l0.sight = fromOut[3] * (1 - k);
      });
      if (!alive()) return false;
    }
    const keeps = keepsFor(light);
    const wantRgb = LAMP[light];
    const from = [...s.rgb];
    const changes = from.join() !== wantRgb.join();
    if (!quick && (changes || r0.grow < 1 || l0.grow < 1) && s.frame !== 'full') {
      await fly('full', 1.5);
      if (!alive()) return false;
    }
    if (changes) {
      const w0 = Float32Array.from(v.widths);
      const w1 = WIDTHS(light);
      const f0 = s.filter;
      const f1 = light === 'white' ? 0 : 1;
      const swap = f0 > 0 && f1 > 0; // one filter out, the next one in
      const a0 = [r0.absorb, l0.absorb];
      if (!swap && f1 > 0) s.gel = [...wantRgb];
      await tween('light', quick ? 0.85 : 1.5, (x) => {
        s.rgb = from.map((c, i) => c + (wantRgb[i] - c) * x);
        if (swap) {
          s.filter = x < 0.5 ? 1 - 2 * x : 2 * x - 1;
          if (x >= 0.5) s.gel = [...wantRgb];
        } else s.filter = f0 + (f1 - f0) * x;
        for (let i = 0; i < 6; i++) v.widths[i] = w0[i] + (w1[i] - w0[i]) * x;
        r0.absorb = a0[0] * (1 - x);
        l0.absorb = a0[1] * (1 - x);
        applyLight();
      });
      if (!alive()) return false;
    }
    r0.keeps = keeps.rose;
    l0.keeps = keeps.leaf;
    audio.tick();
    if (!band) {
      s.busy = false;
      draw();
      return true;
    }
    const order = quick ? [] : ORDER[light] || [];
    /** A band comes, unless it is there already. */
    const come = (name, duration) => {
      if (v[name].grow >= 1) return Promise.resolve(true);
      return tween(`grow-${name}`, duration, (x) => {
        v[name].grow = Math.max(v[name].grow, x);
      });
    };
    // one band at a time, the first close-up's first; in the test both together
    await Promise.all((order.length ? order.slice(0, 1) : ['rose', 'leaf']).map((n) => come(n, quick ? 0.8 : 1.1)));
    if (!alive()) return false;
    s.rays = true;
    draw();

    /** One object: its absorbed colours sink in, then its own colour leaves. */
    const finish = (name, duration, key = 'out') =>
      tween(key, duration, (x) => {
        const p = v[name];
        if (p.keeps) p.out = x;
        else p.sight = x;
      });
    const sink = (name, duration) => {
      if (!absorbed(name, light).length) return Promise.resolve(true);
      return tween(`absorb-${name}`, duration, (x) => {
        v[name].absorb = Math.max(v[name].absorb, x);
      });
    };
    for (const name of order) {
      const flying = fly(name, 1.5);
      await Promise.all([come(name, 0.9), sink(name, 0.9)]);
      if (!alive()) return false;
      await flying;
      if (!alive()) return false;
      s.focus = name;
      draw();
      await finish(name, 1);
      if (!alive()) return false;
      await hold(1.1);
      if (!alive()) return false;
      s.focus = null;
      draw();
    }
    // whatever was not looked at closely finishes on the way back
    const rest = ['rose', 'leaf'].filter((n) => !order.includes(n));
    const flying = quick && s.frame === 'both' ? null : fly('both', 1.5);
    await Promise.all(rest.map((n) => sink(n, 0.5)));
    if (!alive()) return false;
    await Promise.all(
      rest.map((n) =>
        tween(`out-${n}`, 0.7, (x) => {
          const p = v[n];
          if (p.keeps) p.out = x;
          else p.sight = x;
        }),
      ),
    );
    if (!alive()) return false;
    await flying;
    if (!alive()) return false;
    s.busy = false;
    restUntil = performance.now() + RESULT_HOLD;
    s.seen.add(light);
    audio.success();
    draw();
    emitChange();
    return true;
  }

  // ── camera ─────────────────────────────────────────────────────────────────────────────────────────────
  let camFrom = null;
  let camK = 1;
  const camDir = new THREE.Vector3();
  function poseNow() {
    const f = FRAMES[s.frame];
    dirFrom(f.az, f.el, camDir);
    const box = f.wide && stage.width / stage.height >= WIDE ? f.wide : f.box;
    return fitPose({ box, dir: camDir, camera, width: stage.width, height: stage.height, margin: s.frame === 'both' ? BOTH_MARGINS : MARGINS });
  }
  function applyCamera() {
    if (s.userMovedCamera) return;
    const pz = poseNow();
    if (camK < 1 && camFrom) {
      const k = ease.inOutCubic(camK);
      camera.position.lerpVectors(camFrom.position, pz.position, k);
      controls.target.lerpVectors(camFrom.target, pz.target, k);
    } else {
      camera.position.copy(pz.position);
      controls.target.copy(pz.target);
    }
    controls.update();
  }
  /** The camera goes to a frame. Its promise settles when it arrives (or a finger takes over). */
  function fly(frame, duration = 1.5) {
    if (s.userMovedCamera) {
      s.userMovedCamera = false;
      rotate.home();
      s.view = 'front';
      syncUI();
    }
    camFrom = { position: camera.position.clone(), target: controls.target.clone() };
    s.frame = frame;
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
    s.userMovedCamera = false;
    rotate.home();
    syncUI();
    if (animate) fly(s.frame, 1.5);
    else camK = 1;
    stage.invalidate();
  }
  /** The student has really turned the view. */
  function turnedByHand() {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    camK = 1;
    if (s.view !== '3d') {
      s.view = '3d';
      syncUI();
      emit('view', { view: s.view });
    }
  }
  const rotate = createRotateCue(stage, {
    layer: ui.stage,
    short: `${t.num(360)}°`,
    label: t('rotate_me'),
    pulse: Boolean(o.coach),
    at: 'bottom-right',
    onTurn: turnedByHand,
  });

  // ── how to use, in the panel: the same icons as on the view, with a few words (kit createHowTo) ──────────
  createHowTo(ui, t, [{ kind: 'orbit', cue: rotate }, { kind: 'front' }], { stage });
  // the stage also calls this when it lowers its resolution mid-turn: a view the student has turned stays theirs
  stage.onResize(() => {
    draw();
  });
  stage.onBeforeRender(() => {
    applyCamera();
    camera.updateMatrixWorld();
  });

  // ── labels on the picture: few and short, each pinned to what it names ───────────────────────────────────
  let action = null;
  const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, rotate.el, note] });
  const shown = new Map();
  const pts = new Map();
  /** A label at (dx, dy) px from a world point. The key labels are never dropped: they have no spots to run out of. */
  function label(id, on, text, point, color, dx = 0, dy = 0) {
    if (!on) {
      if (shown.has(id)) {
        anno.remove(id);
        shown.delete(id);
      }
      return;
    }
    if (!pts.has(id)) pts.set(id, new THREE.Vector3());
    pts.get(id).copy(point);
    const was = shown.get(id);
    if (!was) {
      anno.add(id, { text, point: () => pts.get(id), color, dx, dy, kind: 'part' });
      shown.set(id, { text, dx, dy });
      return;
    }
    // only what really moved: an update asks for a new frame, and a still figure draws nothing
    if (Math.abs(was.dx - dx) > 0.5 || Math.abs(was.dy - dy) > 0.5) {
      anno.update(id, { dx, dy });
      was.dx = dx;
      was.dy = dy;
    }
    if (was.text !== text) {
      anno.setText(id, text);
      was.text = text;
    }
  }
  function clearLabels() {
    for (const id of [...shown.keys()]) anno.remove(id);
    shown.clear();
  }
  const tmp = new THREE.Vector3();
  const depth = new THREE.Vector3();
  /** The world point that is at these canvas px, at the rose's depth: a label's pin for a point of the drawing. */
  function atPixel(x, y) {
    depth.copy(LAYOUT.bloomCentre).project(camera);
    return tmp.set((x / stage.width) * 2 - 1, 1 - (y / stage.height) * 2, depth.z).unproject(camera);
  }
  const leafMiddle = new THREE.Vector3(12.2, -10.7, 2.8);
  const roseTop = new THREE.Vector3().copy(LAYOUT.bloomCentre).add(new THREE.Vector3(1.5, 3.6, 1));
  function labels() {
    const v = rays.view;
    const q = s.quiz;
    const I = rays.info;
    const u = I.unit;
    const L = s.light;
    const still = camK >= 1;
    const whole = !s.busy && still && (s.rays || q?.drawn) && !q?.waiting; // the final picture
    const on = (name) => (whole || (still && s.focus === name)) && v[name].on;

    // what ends here: at the end of the band, to the side away from the arrow
    for (const name of ['rose', 'leaf']) {
      const f = I[`${name}_fade`];
      const b = I[`${name}_band`];
      const has = on(name) && absorbed(name, L).length > 0 && v[name].absorb >= 1;
      const reach = (name === 'rose' ? 40 : 54) * u ** 0.5;
      label(`a-${name}`, has, t('l_absorb'), has ? atPixel(f.x, f.y) : O, CHIP.white, b.nx * reach - (b.nx < 0 ? 6 : -6), b.ny * reach);
    }
    // what leaves: beside the middle of the arrow, on its outer side
    for (const name of ['rose', 'leaf']) {
      const a = I[`${name}_out`];
      const has = on(name) && v[name].out >= 1;
      const side = name === 'rose' ? -1 : 1; // the rose's label above its arrow, the leaf's to the right of its own
      const reach = 30 * u ** 0.5;
      label(
        `o-${name}`,
        has,
        t(name === 'rose' ? 'l_out_red' : 'l_out_green'),
        has ? atPixel(a.x, a.y) : O,
        CHIP[name === 'rose' ? 'red' : 'green'],
        -a.uy * reach * side + (side > 0 ? 8 : -8),
        a.ux * reach * side,
      );
    }
    // what looks black: the middle of the object
    const blackRose = on('rose') && !v.rose.keeps;
    const blackLeaf = on('leaf') && !v.leaf.keeps;
    label('b-rose', blackRose, t('l_black'), roseTop, CHIP.black, 34 * u, -40 * u);
    label('b-leaf', blackLeaf, t('l_black'), leafMiddle, CHIP.black, 36 * u, 34 * u);
    // the light, on its band
    const b = I.leaf_band;
    const inOn = whole && v.leaf.grow >= 1;
    label('in', inOn, t(`l_${L}`), inOn ? atPixel(b.x, b.y) : O, CHIP[L], b.nx * 40 - 6, b.ny * 40);
    label('card', Boolean(q?.card), t('l_card'), LAYOUT.card, CHIP.white, -6, -80);
    anno.update(); // places them now, on this frame's drawing (it asks for no new frame)
  }
  const O = new THREE.Vector3();
  stage.onAfterRender(labels);

  // ── moving on through the book ─────────────────────────────────────────────────────────────────────────
  function phase() {
    if (s.busy) return 'busy';
    if (!s.rays) return 'start';
    if (!s.seen.has('red')) return 'red';
    if (!s.seen.has('green')) return 'green';
    return s.light === 'white' ? 'test' : 'white';
  }
  let lastAct = -1e9;
  function act() {
    if (s.locked) return lockedNudge();
    const now = performance.now();
    if (now - lastAct < 400 || now < restUntil) return;
    lastAct = now;
    audio.unlock();
    const ph = phase();
    if (ph === 'busy') return;
    if (ph === 'start') return run(s.light);
    if (ph === 'test') return quiz.start();
    return run(ph);
  }
  /** The light of now, slowly, from the start. */
  function replay() {
    if (s.locked) return lockedNudge();
    if (s.busy) return;
    stopRun();
    settle(s.light, false);
    s.rays = false;
    camK = 1;
    return run(s.light);
  }
  function pick(light) {
    if (s.locked) return lockedNudge();
    if (!LEARN.includes(light)) return;
    if (light === s.light && s.rays && !s.busy) return;
    audio.unlock();
    run(light);
  }

  // ── the panel ───────────────────────────────────────────────────────────────────────────────────────────
  const steady = { act: '' };
  const colourWord = (c) => t(`c_${c}`);
  function outcome() {
    const a = looks('rose', s.light);
    const b = looks('leaf', s.light);
    return t('out_looks', { a: colourWord(a), b: colourWord(b), ca: `coo-c-${a}`, cb: `coo-c-${b}` });
  }
  function rule() {
    if (!s.rays) return t('rule_start');
    return t(`rule_${s.light}`);
  }
  const ACTIONS = {
    busy: ['act_wait', ''],
    start: ['act_show', 1],
    red: ['act_red', 2],
    green: ['act_green', 3],
    white: ['act_white', ''],
    test: ['act_test', ''],
  };
  const replayBtn = ui.$('[data-act="replay"]');
  const homeBtn = ui.$('[data-act="home"]'); // it gives way to the test's offer, which needs the room
  function panel() {
    if (s.quiz) return;
    replayBtn.hidden = !s.rays;
    replayBtn.disabled = s.busy;
    homeBtn.hidden = phase() === 'test';
    sheet.outcome(outcome());
    sheet.rule(rule());
    sheet.choose(s.light);
    const ph = phase();
    sheet.next(ph === 'red' || ph === 'green' ? ph : null);
    const [word, step] = ACTIONS[ph];
    const enabled = ph !== 'busy';
    const key = `${word}|${step}|${enabled}`;
    if (action && steady.act !== key) {
      steady.act = key;
      action.set({ label: word, step, enabled });
    }
  }
  function draw() {
    panel();
    stage.invalidate();
  }

  const lensPoint = new THREE.Vector3();
  function lensAt() {
    lensPoint.copy(LAYOUT.lamp).project(camera);
    return { x: ((lensPoint.x + 1) / 2) * stage.width, y: ((1 - lensPoint.y) / 2) * stage.height };
  }

  // ── the action, and what it points at ──────────────────────────────────────────────────────────────────
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: ui.$('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_show',
    target: () => {
      if (s.locked || s.busy || camK < 1) return null;
      // only while the lamp is well inside the view: a ring half off the edge says nothing
      const a = lensAt();
      return a.x < 44 || a.y < 44 ? null : LAYOUT.lampBody;
    },
    radius: 24,
    avoid: [
      ui.corner,
      ui.hint,
      note,
      () => anno.boxes(),
      () => {
        // the lens and where the bands start stay clear
        const a = lensAt();
        return { left: a.x - 44, top: a.y - 30, right: a.x + 70, bottom: a.y + 70 };
      },
    ],
    pulse: Boolean(o.coach),
    onAct: () => act(),
  });

  // a tap on the lamp is the same action
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;
  ui.canvasHost.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, at: performance.now() };
  });
  ui.canvasHost.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const quick = performance.now() - down.at < 600;
    down = null;
    if (moved > 8 || !quick) return;
    const r = ui.canvasHost.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2);
    ray.setFromCamera(ndc, camera);
    if (ray.intersectObject(setting.lamp.hit, false).length) act();
  });

  // ── the test ────────────────────────────────────────────────────────────────────────────────────────────
  let qCurrent = null;
  let order = [];
  let pair = 'leaf'; // which object the prediction asks about; the reading question takes the other light
  const notesOf = (pairs) => new Map(pairs.map(([k, v]) => [String(k), v]));
  /** The scene of a question: this light, the drawing as far as the question allows. */
  function quizScene(q, light, { drawn = false, frame = 'full', card = false, blind = false } = {}) {
    stopRun();
    s.rays = false;
    s.light = light;
    settle(light, false);
    s.frame = frame;
    rays.view.rose.grow = rays.view.leaf.grow = drawn ? 1 : 0;
    setting.card.visible = card;
    setBlind(blind);
    s.quiz = { ...q, drawn, card, waiting: true };
    clearLabels();
    stage.invalidate();
  }
  /** The lamp and the eye away: the objects alone must tell which light this is. */
  function setBlind(on) {
    setting.lamp.root.visible = !on;
    rays.view.eye = !on;
  }
  /** After the answer: the picture finishes the sentence. */
  function showAnswer(q) {
    if (!s.quiz) return;
    s.quiz.waiting = false;
    setBlind(false);
    run(q.after ?? s.light, { quick: true, band: q.band !== false });
  }
  const OTHER = { red: 'green', green: 'red' };
  const Q = {
    predict() {
      quizScene({ kind: 'predict' }, 'white');
      const obj = pair;
      const light = obj === 'leaf' ? 'red' : 'green';
      const own = OTHER[light];
      const wrong = [light, own, 'white'];
      return {
        text: t(`q_predict_${obj}`),
        answer: 'black',
        wrong,
        label: (k) => t(`c_${k}`),
        notes: notesOf([
          [light, t(`n_predict_${obj}_light`)],
          [own, t(`n_predict_${obj}_own`)],
          ['white', t('n_predict_white')],
        ]),
        reveal: t(`a_predict_${obj}`),
        after: light,
      };
    },
    why() {
      const obj = pair;
      const light = obj === 'leaf' ? 'red' : 'green';
      quizScene({ kind: 'why' }, light, { drawn: true, frame: 'both' });
      const wrong = ['reflect', 'other', 'none'];
      return {
        text: t(`q_why_${obj}`),
        answer: 'absorb',
        wrong,
        label: (k) => t(`c_why_${obj}_${k}`),
        notes: notesOf(wrong.map((k) => [k, t(`n_why_${obj}_${k}`)])),
        reveal: t(`a_why_${obj}`),
      };
    },
    infer() {
      // the other light: this scene must not repeat the one before it
      const light = pair === 'leaf' ? 'green' : 'red';
      quizScene({ kind: 'infer' }, light, { frame: 'plant', blind: true });
      const wrong = [OTHER[light], 'blue', 'white'];
      return {
        text: t(`q_infer_${light}`),
        answer: light,
        wrong,
        label: (k) => t(`c_${k}`),
        notes: notesOf([
          [OTHER[light], t(`n_infer_${light}`)],
          ['blue', t('n_infer_blue')],
          ['white', t('n_infer_white')],
        ]),
        reveal: t(`a_infer_${light}`),
      };
    },
    blue() {
      quizScene({ kind: 'blue' }, 'white');
      const wrong = ['rose', 'leaf', 'both'];
      return {
        text: t('q_blue'),
        answer: 'neither',
        wrong,
        label: (k) => t(`c_from_${k}`),
        notes: notesOf(wrong.map((k) => [k, t(`n_blue_${k}`)])),
        reveal: t('a_blue'),
        after: 'blue',
      };
    },
    card() {
      quizScene({ kind: 'card' }, 'white', { card: true });
      const wrong = ['white', 'black', 'green'];
      return {
        text: t('q_card'),
        answer: 'red',
        wrong,
        label: (k) => t(`c_${k}`),
        notes: notesOf(wrong.map((k) => [k, t(`n_card_${k}`)])),
        reveal: t('a_card'),
        after: 'red',
        band: false,
      };
    },
  };
  const saved = { light: 'white', rays: false, seen: [] };
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
        saved.light = s.light;
        saved.rays = s.rays;
        saved.seen = [...s.seen];
        pair = Math.random() < 0.5 ? 'leaf' : 'rose';
        // in this order no scene gives away a later answer
        order = ['predict', 'why', 'infer', 'blue', 'card'];
        clearLabels();
        syncUI();
      },
      leave() {
        stopRun();
        s.mode = 'explore';
        s.locked = false;
        s.quiz = null;
        setting.card.visible = false;
        setBlind(false);
        s.light = saved.light;
        s.rays = saved.rays;
        s.seen = new Set(saved.seen);
        clearLabels();
        const frame = s.rays ? 'both' : 'full';
        settle(s.light, s.rays);
        syncUI();
        camFrom = { position: camera.position.clone(), target: controls.target.clone() };
        fly(frame, 0.5);
        draw();
      },
      async prepare(i, alive, say) {
        const q = Q[order[i]]();
        qCurrent = q;
        say(q.text);
        const frame = s.frame;
        const done = await fly(frame, 0.4);
        if (!alive()) return null;
        if (!done) camK = 1;
        const out = [q.answer];
        for (const w of q.wrong) if (out.length < 4 && !out.includes(w)) out.push(w);
        return { choices: shuffle(out), expected: q.answer, tolerance: 1e-6, label: q.label, meta: { kind: order[i] } };
      },
      reveal(_q, correct, picked) {
        const q = qCurrent;
        showAnswer(q);
        const why = !correct && picked ? q.notes.get(String(picked.value)) : '';
        // the note names what the student chose: alone it could be read as being about the right answer
        return `${q.reveal}${why ? ` <span class="coo-why">${t('n_pick', { x: q.label(picked.value) })} ${why}</span>` : ''}`;
      },
      done() {},
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────────────────────────────────
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
  function home() {
    if (s.locked) return lockedNudge();
    stopRun();
    s.light = 'white';
    s.rays = false;
    s.seen.clear();
    clearLabels();
    settle('white', false);
    fly('full', 1.5);
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
    const what = b.dataset.act || b.dataset.example || '';
    const now = performance.now();
    if (what && what === lastTap.what && now - lastTap.at < 120) return;
    lastTap = { what, at: now };
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) quiz.choose(Number(b.dataset.q));
    if (b.dataset.example) pick(b.dataset.example);
    const a = b.dataset.act;
    if (a === 'q-next') quiz.next();
    if (a === 'q-again') quiz.start();
    if (a === 'home') home();
    if (a === 'replay') replay();
    if (a === 'fullscreen') {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else root.requestFullscreen?.().catch(() => {});
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLButtonElement && (e.key === 'Enter' || e.key === ' ')) return;
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) {
      e.preventDefault();
      if (s.locked) return lockedNudge();
      const i = LEARN.indexOf(s.light);
      pick(LEARN[clamp((i < 0 ? 0 : i) + step, 0, LEARN.length - 1)]);
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (s.mode === 'quiz') return;
      act();
    }
  });

  // ── state for the book ──────────────────────────────────────────────────────────────────────────────────
  const part = (object) => ({
    looks: looks(object, s.light),
    reflected: reflected(object, s.light),
    absorbed: absorbed(object, s.light),
    arrow: rays.view[object].on && rays.view[object].out >= 1,
  });
  /** Where the middle of a petal and of the leaf are on the view, as fractions: for a book page that wants to point at them. */
  function marks() {
    camera.updateMatrixWorld();
    const at = (p) => {
      const n = tmp.copy(p).project(camera);
      return [+((n.x + 1) / 2).toFixed(4), +((1 - n.y) / 2).toFixed(4)];
    };
    return { rose: at(LAYOUT.bloomFace), leaf: at(leafMiddle) };
  }
  function snapshot() {
    return {
      light: s.light,
      rays: s.rays,
      busy: s.busy,
      band: BANDS.filter((_, i) => rays.view.widths[i] > 0.05),
      rose: part('rose'),
      leaf: part('leaf'),
      toEye: toEye(s.light),
      frame: s.frame,
      marks: marks(),
      roseLeaving: leaving('rose', s.light),
      leafLeaving: leaving('leaf', s.light),
      mode: s.mode,
      locked: s.locked,
      view: s.view,
    };
  }
  let lastEmit = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.light, snap.rays]);
    if (k !== lastEmit) {
      lastEmit = k;
      emit('change', snap);
    }
  }

  // ── start ───────────────────────────────────────────────────────────────────────────────────────────────
  settle(s.light, s.rays);
  syncUI();
  setView(s.view, { animate: false });
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
      const animate = p.animate !== false;
      if (p.view) setView(p.view, { animate });
      const light = ALL.includes(p.light) ? p.light : s.light;
      if (p.light != null || p.rays != null) {
        if (animate && p.rays !== false) {
          run(light); // the story takes its time: the answer does not wait for it
        } else {
          stopRun();
          s.light = light;
          if (p.rays != null) s.rays = Boolean(p.rays);
          if (s.rays) s.seen.add(light);
          clearLabels();
          settle(light, s.rays);
        }
      }
      if (!animate) camK = 1;
      draw();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      home();
      setView('front', { animate: false });
      camK = 1;
      draw();
      emitChange();
    },
    startPractice: () => quiz.start(),
    /** The view with its drawing on it, cover-fitted to the size asked for (background: null keeps it transparent). */
    capture({ width = 800, height = 500, background = '#ffffff' } = {}) {
      stage.render();
      const out = document.createElement('canvas');
      out.width = width;
      out.height = height;
      const ctx = out.getContext('2d');
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
      }
      const gl = stage.canvas;
      const k = Math.max(width / gl.width, height / gl.height);
      const x = (width - gl.width * k) / 2;
      const y = (height - gl.height * k) / 2;
      ctx.drawImage(gl, x, y, gl.width * k, gl.height * k);
      ctx.drawImage(rays.canvas, x, y, gl.width * k, gl.height * k);
      return out.toDataURL('image/png');
    },
    exportRoot: () => rose.root,
  };
}
