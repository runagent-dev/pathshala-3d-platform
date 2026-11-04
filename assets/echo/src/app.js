// Echo (প্রতিধ্বনি, book page 201, topic 7.3.1), student view. A student stands on dry flat ground in front of a tall
// sandstone cliff, on a measuring tape that starts at the cliff's foot. The student drags the student (or picks a
// distance word) and calls out, hands cupped round the mouth, as people do at a hill: a train of sound waves (teal
// wavefronts) spreads from the mouth to the cliff, is reflected, and the echo spreads back from the image of the mouth
// behind the cliff face, slowed 20 times (said in the panel). A time line in the panel draws the call as a bar of its
// real length from 0, the echo as the same bar from t = 2d ÷ 330, and the 0.1 s band from the call's start: if the
// echo's start is inside it the two merge, beyond it the echo is heard on its own. The rule grows with what the
// student finds: sound is reflected → the 0.1 s → 0.1 s × 330 m/s = 33 m, half of it 16.5 m (then marked on the tape).
// With sound on, a synthesized voice calls and its echo plays at the real delay. Test: five questions. Built on the
// shared kit.
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { bindCleanSheet, buildStudentShell, cleanSheet } from '@shared/student/shell.js';
import { createAction } from '@shared/student/action.js';
import { ICONS } from '@shared/student/icons.js';
import { createQuiz } from '@shared/student/quiz.js';
import { capturePointer, releasePointer } from '@shared/student/pointer.js';
import { createI18n } from './i18n.js';
import { fitPose } from './camera.js';
import { CLIFF, HAZE, TAPE, createCliff, createSetting, skyTexture } from './setting.js';
import { MOUTH, createListener } from './listener.js';
import { createPulse } from './pulse.js';
import { createTimeline } from './timeline.js';
import { createVoice } from './voice.js';
import {
  CALL,
  D_STEP,
  EXAMPLES,
  FAR_TIMES,
  GAP,
  GAP_PATH,
  MIN_D,
  SLOW,
  V_SOUND,
  distanceChoices,
  echoTime,
  hearChoices,
  round,
  separate,
  shownTime,
  snapD,
} from './reading.js';

export const DEFAULTS = {
  d: 10,
  mode: 'explore',
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  shadow: true,
  sound: true,
};

const COLORS = { ink: '#1d2733', teal: '#0b7285', time: '#c2255c' };
const TAIL = 8; // m the echo's front travels past the student before it has faded (its train is 5 m long)
const TRAIN = 5; // m: the drawn train passes the student whole before the fade begins
const DOUBLE_TAP = 400; // ms
const MARGIN = { top: 44, bottom: 10, side: 10 };
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const clamp01 = (x) => Math.max(0, Math.min(1, x));
// the view: from behind the student's right, low (about 9° above the ground), 20–30° off the line to the cliff (less
// on a narrow frame), so the student is near and big, the tape runs away to the cliff and the cliff fills the back
// with its top running off the frame
const ELEV = 0.2;
const viewDir = (aspect) => {
  const az = THREE.MathUtils.degToRad(19 + 11 * clamp01((aspect - 0.9) / 0.9));
  return V(Math.cos(az), ELEV, Math.sin(az)).normalize();
};
const FACING = -Math.PI / 2 + 0.8; // at rest the student stands turned toward the camera, so we see the face
const CALL_FACING = -Math.PI / 2 + 0.66; // calling, they turn to the cliff (−x), still showing the hands to the camera
const RAISE = 0.5; // s: rest → the hands at the mouth
const LOWER = 0.6; // s: back to rest
const WORD_SHOW = 0.05; // s (real, 1 s in the picture): how long the called word shows
const ROW_Z = -0.5; // the air particles' row on the ground, beside the student's line
const EAR = 0.012; // s (real): how long the "heard" ring round the head lasts
/** The mouth's place in the call for a student d m from the cliff (the sound's source). */
const mouthAt = (d, out) => out.set(d + Math.sin(CALL_FACING) * MOUTH.z, MOUTH.y, Math.cos(CALL_FACING) * MOUTH.z);
const SPAN_Z = TAPE.z - TAPE.width / 2 - 0.16; // the d bar, just in front of the tape's near edge
const MIN_FRAME = 6; // m: the view frames at least this much ground in front of the cliff

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  const exId = (d) => `d${String(d).replace('.', '_')}`;

  root.classList.add('pvc', 'ec');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    layout: 'side',
    learn: cleanSheet(t, {
      examples: { label: 'ex_label', results: true, items: EXAMPLES.map((d) => ({ id: exId(d), label: t('ex_d', { d: N(d) }) })) },
      quiet: [{ act: 'home', label: 'act_home', icon: ICONS.reset }],
      lines: { action: 1, outcome: 3, rule: 4 },
    }),
    learnAlign: 'start',
  });
  const sheet = bindCleanSheet(ui.learn);
  const $ = ui.$;
  // the time line, under the result
  const tlHost = document.createElement('div');
  tlHost.className = 'ec-tl-host';
  $('.pvc-outcome').after(tlHost);
  const timeline = createTimeline(tlHost, t, N, { gap: GAP, call: CALL });
  // wide panels only (style.css): the book's chain 0.1 s → 33 m → 16.5 m as it is found, and the distances tried
  const chain = document.createElement('div');
  chain.className = 'ec-chain';
  chain.setAttribute('role', 'img');
  chain.setAttribute('aria-label', t('ch_aria', { gap: N(GAP), path: N(GAP_PATH), min: N(MIN_D) }).replace(/&nbsp;/g, ' '));
  /** The chain with what is found so far: a step not yet found shows "?" (the rule says the same). */
  function chainHTML(step) {
    const v = (k, html) => (step >= k ? html : '<span class="ec-q">?</span>');
    return `
    <span class="ec-ch"><b class="ec-c-time">${v(1, `${N(GAP)}&nbsp;${t('u_s')}`)}</b><small>${t('ch_gap')}</small></span>
    <span class="ec-ch-op">× ${N(V_SOUND)}&nbsp;${t('u_ms')}<i>→</i></span>
    <span class="ec-ch"><b>${v(2, `${N(GAP_PATH)}&nbsp;${t('u_m')}`)}</b><small>${t('ch_path')}</small></span>
    <span class="ec-ch-op">÷ ${N(2)}<i>→</i></span>
    <span class="ec-ch"><b>${v(2, `${N(MIN_D)}&nbsp;${t('u_m')}`)}</b><small>${t('ch_min')}</small></span>`;
  }
  tlHost.after(chain);
  const tried = document.createElement('div');
  tried.className = 'ec-tried';
  tried.innerHTML = `<div class="ec-tr-head">${t('tr_head')}</div><ol></ol><p class="ec-tr-empty">${t('tr_empty')}</p>`;
  chain.after(tried);
  const triedList = /** @type {HTMLOListElement} */ (tried.querySelector('ol'));
  // honest time: a small note in the 3D view's top-left corner (the buttons are top right)
  const note = document.createElement('div');
  note.className = 'ec-note';
  note.textContent = t(o.sound ? 'note_slow_sound' : 'note_slow', { k: N(SLOW) });
  ui.stage.appendChild(note);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 46, near: 0.2, far: 600, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  stage.renderer.localClippingEnabled = true;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = 0.6;
  controls.maxPolarAngle = Math.PI * 0.49;
  if (o.bg !== 'transparent') {
    scene.background = skyTexture();
    scene.fog = new THREE.Fog(HAZE, 90, 320);
  }
  scene.add(new THREE.HemisphereLight('#dfe9f7', '#8a6a4a', 1.05));
  const sun = new THREE.DirectionalLight('#fff0d8', 2.3);
  sun.position.set(30, 40, 34);
  sun.target.position.set(18, 0, 0);
  scene.add(sun, sun.target);
  if (o.shadow && o.bg !== 'transparent') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.03;
    sun.shadow.radius = 3;
    Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 14, bottom: -14, near: 20, far: 110 });
    sun.shadow.camera.updateProjectionMatrix();
  }
  sun.target.updateMatrixWorld();

  const setting = createSetting();
  scene.add(setting.root);
  const listener = createListener();
  listener.root.rotation.y = FACING;
  scene.add(listener.root);
  // a big invisible box round the student: a finger grabs it easily
  const hit = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.1, 1.3), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 1.05;
  hit.userData.noExport = true;
  listener.root.add(hit);
  // a flat double arrow at the feet: the student can be moved along the tape
  const slideMark = doubleArrow();
  scene.add(slideMark);
  // the distance d drawn on the ground beside the tape: a dark bar from the cliff's foot to the student, end ticks
  const span = dSpan();
  scene.add(span.root);
  const pulse = createPulse({ cliffTop: CLIFF.height - 1.5, rowZ: ROW_Z });
  scene.add(pulse.root);
  // the moment the echo reaches the student: a teal ring round the head spreads once
  const ear = new THREE.Mesh(
    new THREE.TorusGeometry(0.2, 0.022, 8, 40).rotateX(Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: COLORS.teal, transparent: true, depthWrite: false }),
  );
  ear.userData.noExport = true;
  ear.renderOrder = 8;
  scene.add(ear);
  // the tape's numbers every 5 m: upright words in the label layer, placed on the screen (style.css .ec-num)
  const numLayer = document.createElement('div');
  numLayer.className = 'ec-nums';
  ui.stage.appendChild(numLayer);
  const nums = [];
  for (let m = 0; m <= 40; m += 5) {
    const e = document.createElement('span');
    e.className = 'ec-num';
    e.textContent = N(m);
    numLayer.appendChild(e);
    nums.push({ m, el: e, box: null, w: 0, h: 0 });
  }

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const voice = createVoice(audio);
  /** @type {ReturnType<typeof createAction> | null} */
  let action = null;
  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  // ── state ───────────────────────────────────────────────────────────────────
  const s = {
    d: snapD(o.d),
    mode: 'explore',
    locked: false,
    run: 0,
    tau: /** @type {number | null} */ (null), // real time since the call started (s); null: no call at this distance yet
    playing: false,
    call: 0, // the student's pose: 0 at rest, 1 calling
    frozen: false, // the pulse held at a moment by the bridge (set tau)
    found: { near: false, far: false },
    results: new Map(), // example id → its time (s)
    tried: /** @type {number[]} */ ([]), // distances called from, the latest first
    frameD: 0, // the distance the camera frames
    userMovedCamera: false,
    dragging: false,
    show: { labels: true, tape: true, dLabel: true, time: false },
  };
  const now = () => performance.now();
  let lastAct = Number.NEGATIVE_INFINITY;
  const tEnd = (d) => (2 * d + TAIL) / V_SOUND;
  const arrived = () => s.tau != null && s.tau >= echoTime(s.d) - 1e-9;

  // ── the scene from the state ────────────────────────────────────────────────
  const src = new THREE.Vector3();
  const mouth = (out = src) => mouthAt(s.d, out);
  const tmp = new THREE.Vector3();
  function syncScene() {
    listener.root.position.set(s.d, 0, 0);
    slideMark.position.set(s.d, 0.03, 0);
    slideMark.visible = s.mode === 'explore' && !s.playing;
    span.set(s.d, !!s.show.dLabel);
    // the pose: the app tweens s.call; the mouth opens as the word starts
    listener.root.rotation.y = FACING + (CALL_FACING - FACING) * s.call;
    listener.setCall(s.call, s.call * clamp01((s.tau ?? 0) / 0.006));
    listener.root.updateMatrixWorld(true);
    mouth();
    // the pulse
    if (s.tau == null) pulse.hide();
    else {
      const r = V_SOUND * s.tau;
      const back = r > src.x ? r : 0;
      const fade = clamp01(1 - (r - 2 * s.d - TRAIN) / (TAIL - TRAIN));
      pulse.set(src, r, back, 1, fade, s.d - 0.35);
    }
    const kE = s.tau == null ? -1 : (s.tau - echoTime(s.d)) / EAR;
    ear.visible = kE >= 0 && kE < 1;
    if (ear.visible) {
      listener.headAt(ear.position);
      ear.scale.setScalar(1 + 1.6 * kE);
      ear.material.opacity = 1 - kE;
    }
    placeNumbers();
    setting.tape.mark.visible = s.found.near && s.found.far && s.mode === 'explore';
    stage.invalidate();
  }

  /** The tape's numbers on the screen, just beyond the tape's near edge; one that would touch the student, the
   * action's ring or a nearer number is left out (the tape's ticks are still there). */
  const numAt = new THREE.Vector3();
  const scr = { x: 0, y: 0 };
  function placeNumbers() {
    numLayer.hidden = !s.show.tape;
    if (!s.show.tape) return;
    const keep = [personBox()];
    const ring = action?.ringBox?.();
    if (ring) keep.push(ring);
    const hitsAny = (b) => keep.some((r) => b.left < r.right + 2 && b.right > r.left - 2 && b.top < r.bottom + 2 && b.bottom > r.top - 2);
    // nearest first: the numbers near the camera are the ones to keep
    for (let i = nums.length - 1; i >= 0; i--) {
      const n = nums[i];
      if (!n.w) {
        n.el.style.display = '';
        n.w = n.el.offsetWidth;
        n.h = n.el.offsetHeight;
      }
      numAt.set(n.m, 0, TAPE.z + TAPE.width / 2 + 0.05);
      tmp.copy(numAt).project(camera);
      toScreen(numAt, scr);
      const box = { left: scr.x - n.w / 2, right: scr.x + n.w / 2, top: scr.y + 1, bottom: scr.y + 1 + n.h };
      const on = tmp.z < 1 && box.left > 2 && box.right < stage.width - 2 && box.bottom < stage.height - 2 && box.top > 30 && !hitsAny(box);
      n.box = on ? box : null;
      n.el.style.display = on ? '' : 'none';
      if (on) {
        n.el.style.transform = `translate(${Math.round(box.left)}px, ${Math.round(box.top)}px)`;
        keep.push(box);
      }
    }
  }
  const numBoxes = () => nums.map((n) => n.box).filter(Boolean);

  // ── the panel ───────────────────────────────────────────────────────────────
  const sumVars = (d) => {
    const st = shownTime(d);
    return { two: N(2), d: N(d), v: N(V_SOUND), eq: st.exact ? '=' : '≈', t: N(st.shown), gap: N(GAP), p: N(round(2 * d, 1)) };
  };
  function verdict(d) {
    const tt = echoTime(d);
    const k = Math.abs(tt - GAP) < 1e-9 ? 'v_equal' : tt > GAP ? 'v_more' : 'v_less';
    return t(k, { gap: N(GAP) });
  }
  function refresh() {
    const d = s.d;
    // the result line
    if (s.tau == null) sheet.outcome(t('out_before', { d: N(d) }));
    else if (!arrived()) sheet.outcome(t(V_SOUND * s.tau < mouth().x ? 'out_going' : 'out_back', sumVars(d)));
    else sheet.outcome(`${t('out_sum', sumVars(d))} ${verdict(d)}`);
    // the rule
    const f = s.found;
    sheet.rule(
      f.near && f.far
        ? t('rule_all', { gap: N(GAP), v: N(V_SOUND), path: N(GAP_PATH), min: N(MIN_D) })
        : f.near
          ? t('rule_near', { gap: N(GAP) })
          : f.far
            ? t('rule_far', { gap: N(GAP) })
            : t('rule_0'),
    );
    // the words: the chosen one, the next one to try, the times found
    const id = EXAMPLES.includes(d) ? exId(d) : null;
    sheet.choose(id);
    let next = null;
    if (!(f.near && f.far) && (f.near || f.far)) {
      const want = EXAMPLES.find((x) => separate(x) === f.near && !s.results.has(exId(x)));
      next = want != null ? exId(want) : null;
    }
    sheet.next(s.mode === 'explore' ? next : null);
    for (const x of EXAMPLES) sheet.result(exId(x), s.results.has(exId(x)) ? `${N(s.results.get(exId(x)))} s` : '');
    // the chain (wide panels): its first step once the 0.1 s is known, the rest once both sides are found
    const step = f.near && f.far ? 2 : f.near || f.far ? 1 : 0;
    if (chain.dataset.step !== String(step)) {
      chain.dataset.step = String(step);
      chain.innerHTML = chainHTML(step);
    }
    const rows = s.tried
      .map((x) => {
        const sep = separate(x);
        return `<li><span>d = ${N(x)}&nbsp;${t('u_m')}</span><span class="ec-c-time">${N(round(echoTime(x), 3))}&nbsp;${t('u_s')}</span><span class="${sep ? 'ec-yes' : 'ec-no'}">${t(sep ? 'tr_sep' : 'tr_merge')}</span></li>`;
      })
      .join('');
    if (triedList.dataset.rows !== rows) {
      triedList.dataset.rows = rows;
      triedList.innerHTML = rows;
    }
    tried.dataset.empty = String(!s.tried.length);
    // the time line
    timeline.set({
      cursor: (s.playing || s.frozen) && s.tau != null ? Math.min(s.tau, echoTime(d)) : null,
      echo: arrived() ? echoTime(d) : null,
      inside: !separate(d),
    });
    // the action
    if (action) {
      const step = f.near && f.far ? '' : f.near || f.far ? 2 : 1;
      action.set({ step, label: 'act_call', enabled: true });
      if (s.mode === 'explore' && !s.playing && !s.frozen && !s.dragging) action.show('scene');
      else action.hide('scene');
    }
    syncLabels();
    stage.invalidate();
  }

  // ── labels on the picture ───────────────────────────────────────────────────
  function toScreen(p, out) {
    tmp.copy(p).project(camera);
    out.x = (tmp.x * 0.5 + 0.5) * stage.width;
    out.y = (-tmp.y * 0.5 + 0.5) * stage.height;
    return out;
  }
  /** The student on the screen: labels keep off it. */
  function personBox() {
    const a = toScreen(V(s.d, 0, 0), { x: 0, y: 0 });
    const b = toScreen(V(s.d, listener.height, 0), { x: 0, y: 0 });
    const w = Math.max(10, Math.abs(a.y - b.y) * 0.23);
    return { left: a.x - w, right: a.x + w, top: Math.min(a.y, b.y) - 4, bottom: Math.max(a.y, b.y) + 4 };
  }
  const anno = createAnnotations({
    stage,
    layer: ui.annoLayer,
    avoid: [ui.corner, ui.hint, note, personBox, () => action?.box(), () => action?.ringBox(), numBoxes],
  });
  const spot = (dx, dy) => ({ dx, dy });
  const ABOVE = [spot(0, -28), spot(24, -30), spot(-24, -30), spot(0, -50)];
  const BELOW = [spot(0, 26), spot(20, 30), spot(-20, 30), spot(0, -28)];
  const SIDE = [spot(-30, -22), spot(30, -22), spot(-40, 0), spot(40, 0)];
  const SPEECH = [spot(-30, -20), spot(-34, -2), spot(-26, -38), spot(30, -24), spot(30, -44)];
  const SPEECH_BACK = [spot(30, -30), spot(-30, -34), spot(34, -12), spot(0, -52), spot(44, -46)];
  const labelState = new Map();
  const front = new THREE.Vector3();
  const headTop = new THREE.Vector3();
  function wantLabels() {
    const want = new Map();
    if (!s.show.labels) {
      if (s.show.time && s.tau != null)
        want.set('time', {
          text: t('lbl_time', { t: N(round(s.tau, 3)) }),
          point: () => V(s.d, listener.height + 0.1, 0),
          spots: ABOVE,
          color: COLORS.time,
        });
      return want;
    }
    want.set('cliff', {
      text: t('lbl_cliff'),
      point: () => V(0.3, CLIFF.height * 0.34, -3),
      spots: [spot(40, -10), ...SIDE, ...ABOVE],
      color: COLORS.ink,
      optional: true,
    });
    if (s.show.dLabel) want.set('d', { text: t('lbl_d', { d: N(s.d) }), point: () => V(s.d / 2, 0.03, SPAN_Z), spots: BELOW, color: COLORS.ink });
    if (s.found.near && s.found.far && s.mode === 'explore' && Math.abs(s.d - MIN_D) > 2.5 && Math.abs(s.d / 2 - MIN_D) > 6)
      want.set('min', {
        text: t('lbl_min', { min: N(MIN_D) }),
        point: () => V(MIN_D, 0.03, TAPE.z - TAPE.width / 2),
        spots: ABOVE,
        color: COLORS.time,
        optional: true,
      });
    // the word itself: near the mouth as it is called, fainter near the head when its echo comes back
    if (s.tau != null && (s.playing || s.frozen)) {
      const back = s.tau - echoTime(s.d);
      if (s.tau < WORD_SHOW)
        want.set('word', { text: t('lbl_word'), point: () => mouth(V(0, 0, 0)), spots: SPEECH, color: COLORS.teal, kind: 'word', optional: true });
      if (back >= 0 && back < WORD_SHOW)
        want.set('wordBack', {
          text: t('lbl_word'),
          point: () => listener.headAt(headTop),
          spots: SPEECH_BACK,
          color: COLORS.teal,
          kind: 'wordback',
          optional: true,
        });
    }
    if (s.tau != null && (s.playing || s.frozen || s.mode === 'quiz')) {
      const r = V_SOUND * s.tau;
      mouth();
      if (r < src.x * 0.92 && r > 1.5)
        want.set('front', {
          text: t('lbl_sound'),
          point: () => pulse.frontPoint('out', mouth(V(0, 0, 0)), V_SOUND * (s.tau ?? 0), front),
          spots: ABOVE,
          color: COLORS.teal,
          optional: true,
        });
      else if (r > src.x * 1.1 && r < 2 * s.d - 1)
        want.set('front', {
          text: t('lbl_echo'),
          point: () => pulse.frontPoint('back', mouth(V(0, 0, 0)), V_SOUND * (s.tau ?? 0), front),
          spots: ABOVE,
          color: COLORS.teal,
          optional: true,
        });
    }
    if (s.show.time && s.tau != null)
      want.set('time', {
        text: t('lbl_time', { t: N(round(s.tau, 3)) }),
        point: () => V(s.d, listener.height + 0.1, 0),
        spots: ABOVE,
        color: COLORS.time,
      });
    return want;
  }
  function syncLabels() {
    const want = wantLabels();
    for (const id of [...labelState.keys()])
      if (!want.has(id)) {
        anno.remove(id);
        labelState.delete(id);
      }
    for (const [id, w] of want) {
      const key = `${w.text}|${w.color}`;
      if (!labelState.has(id) || !anno.has(id)) {
        anno.add(id, { text: w.text, point: w.point, kind: w.kind ?? 'tag', color: w.color, spots: w.spots, optional: w.optional });
        anno.update(id, {});
        labelState.set(id, key);
      } else if (labelState.get(id) !== key) {
        anno.update(id, { text: w.text, point: w.point, spots: w.spots, color: w.color });
        labelState.set(id, key);
      }
    }
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  /** The points the view must show: the student (with room for the label above), the tape's start, the cliff's face. */
  function viewPose(d = s.frameD || Math.max(MIN_FRAME, s.d)) {
    const points = [];
    // the student (with room for the labels above the head and the tape beside the feet) …
    for (const x of [d - 0.8, d + 0.9]) for (const y of [0, 2.25]) for (const z of [ROW_Z - 0.3, TAPE.z + 0.45]) points.push(V(x, y, z));
    // … the tape's start at the cliff's foot and a little of the face above it
    points.push(V(0, 0, TAPE.z + 0.5), V(0, 0, ROW_Z - 0.5), V(0, 3.2, 0));
    return fitPose({
      points,
      bias: 0.6,
      dir: viewDir(stage.width / Math.max(1, stage.height)),
      camera,
      width: stage.width,
      height: stage.height,
      margin: MARGIN,
    });
  }
  function place(pose) {
    camera.position.copy(pose.position);
    controls.target.copy(pose.target);
    controls.update();
  }
  function flyTo({ position, target: aim }, duration = 0.7) {
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    if (!duration) {
      tweener.cancel('camera');
      place({ position, target: aim });
      syncScene();
      return Promise.resolve(true);
    }
    return tweener.animate({
      key: 'camera',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        camera.position.lerpVectors(p0, position, k);
        controls.target.lerpVectors(t0, aim, k);
        controls.update();
        syncScene();
      },
    }).finished;
  }
  /** Frames the current distance (unless the student turned the view). */
  function frame(animate = true) {
    s.frameD = Math.max(MIN_FRAME, s.d);
    if (s.userMovedCamera) return Promise.resolve(true);
    return flyTo(viewPose(), animate ? 0.6 : 0);
  }
  function homeView() {
    s.userMovedCamera = false;
    syncUI();
    return frame(true);
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
    syncUI();
  });
  controls.addEventListener('change', () => syncScene());
  stage.onResize(() => {
    if (!s.userMovedCamera) place(viewPose());
    syncScene();
    refresh();
  });

  // ── the distance ────────────────────────────────────────────────────────────
  /** Tweens the pose to k (0 rest, 1 calling); resolves true when it gets there. */
  function poseTo(k, duration) {
    const from = s.call;
    return tweener.animate({
      key: 'pose',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (x) => {
        s.call = from + (k - from) * x;
        syncScene();
      },
    }).finished;
  }
  /** The pose at once. */
  function setPose(k) {
    tweener.cancel('pose');
    s.call = k;
  }
  function stopRun() {
    s.run++;
    tweener.cancel('run');
    voice.stop();
    s.playing = false;
    s.frozen = false;
    tweener.cancel('pose');
    if (s.call > 0) poseTo(0, LOWER);
  }
  /** Moves the student to d at once (a drag, a key): no call at the new place yet. */
  function setD(d, { refit = true, animate = true } = {}) {
    const v = snapD(d);
    if (v === s.d && s.tau == null) return;
    stopRun();
    if (v !== s.d) audio.tick();
    s.d = v;
    s.tau = null;
    syncScene();
    refresh();
    if (refit) frame(animate);
    emitChange();
  }
  /** Walks the student to d (an example word, the bridge). */
  function walkTo(d) {
    const v = snapD(d);
    stopRun();
    s.tau = null;
    const d0 = s.d;
    s.frameD = Math.max(MIN_FRAME, v);
    if (!s.userMovedCamera) flyTo(viewPose(), 0.7);
    if (Math.abs(v - d0) < 1e-6) {
      refresh();
      emitChange();
      return Promise.resolve(true);
    }
    const token = s.run;
    return tweener
      .animate({
        key: 'walk',
        duration: Math.min(1, 0.35 + Math.abs(v - d0) * 0.025),
        ease: ease.inOutCubic,
        onUpdate: (k) => {
          if (token !== s.run) return;
          s.d = round(d0 + (v - d0) * k, 2);
          syncScene();
          refresh();
        },
      })
      .finished.then((ok) => {
        if (token !== s.run) return false;
        s.d = v;
        syncScene();
        refresh();
        emitChange();
        return ok;
      });
  }

  // ── the call ────────────────────────────────────────────────────────────────
  /**
   * The student raises their hands, calls at the current distance and holds the call until the echo has faded (the
   * slowed picture is shorter than the word, so the pose is held to the end), then rests. Resolves when the echo has
   * faded (or the run was stopped).
   */
  async function call() {
    stopRun();
    tweener.cancel('walk');
    s.d = snapD(s.d);
    const token = s.run;
    const d = s.d;
    s.tau = null;
    s.playing = true;
    hintOff();
    syncScene();
    refresh();
    emitChange();
    const up = await poseTo(1, RAISE);
    if (!up || token !== s.run) return false;
    s.tau = 0;
    // the real sound: the word now, its echo exactly 2d ÷ 330 s after it (merged when that is under 0.1 s)
    voice.play(echoTime(d));
    syncScene();
    refresh();
    emitChange();
    const ok = await tweener.animate({
      key: 'run',
      duration: tEnd(d) * SLOW,
      ease: ease.linear,
      onUpdate: (k) => {
        if (token !== s.run) return;
        s.tau = k * tEnd(d);
        syncScene();
        refresh();
      },
    }).finished;
    if (!ok || token !== s.run) return false;
    finishCall(d);
    poseTo(0, LOWER);
    return true;
  }
  /** The call at d is over: its result is known. */
  function finishCall(d) {
    s.playing = false;
    s.tau = tEnd(d);
    if (separate(d)) s.found.far = true;
    else s.found.near = true;
    if (EXAMPLES.includes(d)) s.results.set(exId(d), round(echoTime(d), 3));
    if (s.mode === 'explore') s.tried = [d, ...s.tried.filter((x) => x !== d)].slice(0, 6);
    syncScene();
    refresh();
    emitChange();
  }
  function doCall() {
    if (s.locked) return lockedNudge();
    if (now() - lastAct < DOUBLE_TAP) return;
    lastAct = now();
    audio.unlock();
    call();
  }
  action = createAction({
    stage,
    layer: ui.coachLayer,
    host: $('.pvc-act-slot'),
    t,
    step: 1,
    label: 'act_call',
    target: () => V(s.d, 1.12, 0),
    radius: 24,
    avoid: [ui.corner, ui.hint, () => anno.boxes()],
    pulse: Boolean(o.coach),
    onAct: () => doCall(),
  });

  // ── dragging the student; a tap on the student calls ────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  function rayAt(e) {
    const r = stage.canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster;
  }
  function groundX(e) {
    const p = rayAt(e).ray.intersectPlane(groundPlane, new THREE.Vector3());
    return p ? p.x : null;
  }
  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      if (drag || e.button > 0) return;
      if (!rayAt(e).intersectObject(hit, false).length) return; // the camera takes it
      e.stopPropagation();
      e.preventDefault();
      audio.unlock();
      if (s.locked) return lockedNudge();
      const gx = groundX(e);
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, offset: gx == null ? 0 : s.d - gx };
      capturePointer(ui.canvasHost, e.pointerId);
    },
    true,
  );
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 7) return;
    if (!drag.moved) {
      drag.moved = true;
      s.dragging = true;
      stopRun();
      tweener.cancel('walk');
      hintOff();
      emit('dragstart', snapshot());
    }
    const gx = groundX(e);
    if (gx != null) setD(gx + drag.offset, { refit: false });
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const was = drag;
    drag = null;
    releasePointer(ui.canvasHost, e.pointerId);
    if (!was.moved) {
      if (e.type === 'pointerup') doCall();
      return;
    }
    s.dragging = false;
    frame(true);
    refresh();
    emit('dragend', snapshot());
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);

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
    return {
      d: s.d,
      echoTime: round(echoTime(s.d), 4),
      separate: separate(s.d),
      called: s.tau != null,
      clapped: s.tau != null, // the older name, kept for pages that read it
      callSeconds: CALL,
      echoBack: arrived(),
      playing: s.playing,
      found: { ...s.found },
      minDistance: MIN_D,
      mode: s.mode,
      unit: 'm',
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const key = JSON.stringify([snap.d, snap.called, snap.echoBack, snap.playing, snap.found, snap.mode]);
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
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  function choicesOf(items, kind, label) {
    const list = shuffle([...items]);
    return {
      list,
      choices: [0, 1, 2, 3],
      expected: list.indexOf(items[0]),
      tolerance: 0.5,
      label: (j) => `<span class="ec-opt">${label(list[j])}</span>`,
      meta: { kind, answer: items[0].key },
    };
  }
  /** A scene for the test: the student at d, the pulse at τ, some labels hidden. */
  function testScene(d, tau, show = {}) {
    stopRun();
    tweener.cancel('walk');
    s.d = d;
    s.tau = tau;
    setPose(tau == null ? 0 : 1);
    s.show = { labels: true, tape: true, dLabel: true, time: false, ...show };
    s.userMovedCamera = false;
    s.frameD = Math.max(MIN_FRAME, d);
    syncUI();
    syncScene();
    refresh();
  }
  const KINDS = ['what', 'gap', 'far', 'hear', 'bat'];
  let learnSaved = null;
  let question = null;
  let picked = -1;
  const sec = (x) => `${N(x)}&nbsp;s`;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: KINDS.length,
    lines: { text: 3, feedback: 4 },
    action,
    hooks: {
      enter() {
        learnSaved = { d: s.d, tau: s.tau };
        s.mode = 'quiz';
        s.locked = true;
        hintOff();
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        stopRun();
        s.show = { labels: true, tape: true, dLabel: true, time: false };
        s.d = learnSaved?.d ?? s.d;
        s.tau = null;
        s.userMovedCamera = false;
        syncUI();
        frame(false);
        syncScene();
        refresh();
        emitChange();
      },
      async prepare(i, alive) {
        picked = -1;
        const kind = KINDS[i % KINDS.length];
        question = { kind };
        if (kind === 'what') {
          const d = pick([18, 20, 22]);
          testScene(d, (1.75 * d) / V_SOUND, { labels: false });
        } else if (kind === 'gap') {
          testScene(20, (1.6 * 20) / V_SOUND, {});
        } else if (kind === 'far') {
          const tt = pick(FAR_TIMES);
          question.t = tt;
          question.d = round((V_SOUND * tt) / 2, 2);
          testScene(question.d, tt, { labels: false, tape: false, time: true });
        } else if (kind === 'hear') {
          question.d = pick([5, 10, 12, 25, 30, 35]);
          testScene(question.d, null, { dLabel: false });
        } else {
          testScene(22, (1.5 * 22) / V_SOUND, {});
        }
        await flyTo(viewPose(), 0.6);
        if (!alive()) return null;
        if (kind === 'what')
          return {
            text: t('q_what'),
            ...choicesOf(
              ['c_what_right', 'c_what_refr', 'c_what_ultra', 'c_what_super'].map((key) => ({ key })),
              kind,
              (x) => t(x.key),
            ),
          };
        if (kind === 'gap')
          return {
            text: t('q_gap'),
            ...choicesOf(
              [
                { key: 'right', v: GAP },
                { key: 'half', v: GAP / 2 },
                { key: 'long', v: 1 },
                { key: 'tiny', v: 0.01 },
              ],
              kind,
              (x) => sec(N(x.v)),
            ),
          };
        if (kind === 'far')
          return {
            text: t('q_far', { v: N(V_SOUND) }).replace(/&nbsp;/g, '\u00a0'),
            ...choicesOf(distanceChoices(question.t), kind, (x) => `${N(x.d)}&nbsp;m`),
          };
        if (kind === 'hear') {
          const items = hearChoices(question.d);
          return {
            text: t('q_hear'),
            ...choicesOf(items, kind, (x) => t(`c_hear_${x.yes ? 'yes' : 'no'}_${x.after ? 'after' : 'before'}`, { gap: N(GAP) })),
          };
        }
        return {
          text: t('q_bat'),
          ...choicesOf(
            ['c_bat_right', 'c_bat_color', 'c_bat_speed', 'c_bat_heavy'].map((key) => ({ key })),
            kind,
            (x) => t(x.key),
          ),
        };
      },
      reveal(q, correct) {
        const k = question.kind;
        const wrong = correct ? null : q.list?.[picked]?.key;
        const note = (map, vars = {}) => (wrong && map[wrong] ? ` ${t(map[wrong], vars)}` : '');
        if (k === 'what') {
          s.show.labels = true;
          refresh();
          return t('why_what') + note({ c_what_refr: 'mis_refr', c_what_ultra: 'mis_ultra', c_what_super: 'mis_super' });
        }
        if (k === 'gap') {
          const v = { gap: N(GAP), half: N(GAP / 2), tiny: N(0.01) };
          return t('why_gap', v) + note({ half: 'mis_gap_half', long: 'mis_gap_long', tiny: 'mis_gap_tiny' }, v);
        }
        if (k === 'far') {
          const whole = round(V_SOUND * question.t, 2);
          const v = { d: N(question.d), v: N(V_SOUND), t: N(question.t), whole: N(whole), two: N(2), min: N(MIN_D) };
          s.show = { labels: true, tape: true, dLabel: true, time: true };
          syncScene();
          refresh();
          return t('why_far', v) + note({ whole: 'mis_far_whole', gap: 'mis_far_gap', quarter: 'mis_far_quarter' }, v);
        }
        if (k === 'hear') {
          const d = question.d;
          s.show.dLabel = true;
          s.tau = echoTime(d);
          setPose(1);
          syncScene();
          refresh();
          const v = { ...sumVars(d) };
          const why = t(separate(d) ? 'why_hear_yes' : 'why_hear_no', v);
          return why + note({ flip: 'mis_hear_flip', time: 'mis_hear_time', reason: 'mis_hear_reason' }, v);
        }
        return t('why_bat', { f: N(100) }) + note({ c_bat_color: 'mis_bat_color', c_bat_speed: 'mis_bat_speed', c_bat_heavy: 'mis_bat_heavy' });
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    const frontBtn = ui.$('[data-view="front"]');
    if (frontBtn) frontBtn.hidden = !s.userMovedCamera;
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
    stopRun();
    tweener.cancel('walk');
    s.d = snapD(DEFAULTS.d);
    s.tau = null;
    s.found = { near: false, far: false };
    s.results.clear();
    s.tried = [];
    s.userMovedCamera = false;
    hintOff();
    syncUI();
    frame(true);
    syncScene();
    refresh();
    emitChange();
  }
  const fullscreenBtn = $('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {HTMLElement} */ (/** @type {Element} */ (e.target).closest('button'));
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view === 'front') homeView();
    if (b.dataset.example) {
      if (s.locked) return lockedNudge();
      const d = Number(b.dataset.example.slice(1).replace('_', '.'));
      hintOff();
      walkTo(d);
    }
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      picked = Number(b.dataset.q);
      quiz.choose(picked);
    }
    if (b.dataset.act === 'q-next') quiz.next();
    else if (b.dataset.act === 'q-again') quiz.start();
    else if (b.dataset.act === 'home') goHome();
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
    const move = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[k];
    const sceneKey = Boolean(move) || ['r', 'R', 'Home'].includes(k) || ((k === ' ' || k === 'Enter') && !onButton);
    if (sceneKey && s.mode === 'quiz') {
      if (quiz.active && !quiz.revealed) lockedNudge();
      return;
    }
    if (move) setD(s.d + move * (e.shiftKey ? 5 : D_STEP));
    else if ((k === ' ' || k === 'Enter') && !onButton) doCall();
    else if (k === 'r' || k === 'R' || k === 'Home') goHome();
    else if (k === 'Escape') hintOff();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  s.frameD = Math.max(MIN_FRAME, s.d);
  syncUI();
  syncScene();
  place(viewPose());
  syncScene();
  refresh();
  if (o.mode === 'quiz') quiz.start();
  const ready = Promise.resolve();

  return {
    ready,
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: snapshot,
    /** For the builder's checks: the student's height on the screen (px) and the stage's size. */
    measure() {
      const b = personBox();
      return { student: Math.round(b.bottom - b.top - 8), width: stage.width, height: stage.height };
    },
    /**
     * d: the student's distance from the cliff (m, 4–40, in 0.5 m steps); call: true plays the call (animate: false
     * lands at once on its result; clap: true is the older name for it); tau: holds the sound that many real seconds
     * after the call's start, with the student in the calling pose; found: { near, far } sets what the student has found
     * (the rule's stage).
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      const wantCall = Boolean(p.call || p.clap);
      if ((p.d != null || wantCall) && s.mode === 'quiz') quiz.stop();
      if (p.found) {
        s.found = { near: Boolean(p.found.near), far: Boolean(p.found.far) };
        syncScene();
        refresh();
      }
      if (p.d != null) {
        if (animate) await walkTo(Number(p.d));
        else setD(Number(p.d), { animate: false });
      }
      if (p.tau != null) {
        // the sound held at a moment (real seconds after the call's start): posters, the book
        stopRun();
        s.tau = Math.max(0, Math.min(tEnd(s.d), Number(p.tau)));
        setPose(1);
        s.frozen = true;
        syncScene();
      }
      if (wantCall) {
        if (animate) {
          lastAct = now();
          await call();
        } else {
          stopRun();
          setPose(0);
          finishCall(s.d);
        }
      }
      refresh();
      emitChange();
      return snapshot();
    },
    async reset() {
      quiz.stop();
      goHome();
      return snapshot();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    /** The cliff, the tape and the student where they stand, in metres. */
    exportRoot() {
      const g = new THREE.Group();
      g.name = 'Echo';
      // the cliff cropped to its middle (the scene's runs off every frame)
      g.add(createCliff(CLIFF.exportWidth, 0.6).root, listener.root.clone(true));
      const tape = setting.tape.root.clone(true);
      tape.children = tape.children.filter((c) => !c.userData.noExport && c.visible);
      g.add(tape);
      return g;
    },
  };
}

/** A flat double-headed arrow on the ground along x (white with a dark rim): "this can slide along the tape". */
function doubleArrow() {
  const shape = (w, h, head, len) => {
    const sh = new THREE.Shape();
    sh.moveTo(-len, 0);
    sh.lineTo(-len + head, h);
    sh.lineTo(-len + head, w);
    sh.lineTo(len - head, w);
    sh.lineTo(len - head, h);
    sh.lineTo(len, 0);
    sh.lineTo(len - head, -h);
    sh.lineTo(len - head, -w);
    sh.lineTo(-len + head, -w);
    sh.lineTo(-len + head, -h);
    sh.closePath();
    return new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2);
  };
  const g = new THREE.Group();
  g.name = 'SlideMark';
  g.userData.noExport = true;
  const rim = new THREE.Mesh(shape(0.12, 0.3, 0.42, 1.12), new THREE.MeshBasicMaterial({ color: '#1d2733', transparent: true, opacity: 0.85 }));
  const fill = new THREE.Mesh(shape(0.07, 0.23, 0.34, 1.04), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  fill.position.y = 0.004;
  g.add(rim, fill);
  g.position.z = -0.0;
  return g;
}

/** The distance d on the ground: a bar of unit length scaled to d, a tick at each end (not exported). */
function dSpan() {
  const root = new THREE.Group();
  root.userData.noExport = true;
  const mat = new THREE.MeshBasicMaterial({ color: '#1d2733' });
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.07).rotateX(-Math.PI / 2).translate(0.5, 0, 0), mat);
  const tickGeo = new THREE.PlaneGeometry(0.07, 0.42).rotateX(-Math.PI / 2);
  const t0 = new THREE.Mesh(tickGeo, mat);
  const t1 = new THREE.Mesh(tickGeo, mat);
  root.add(bar, t0, t1);
  root.position.set(0, 0.022, SPAN_Z);
  return {
    root,
    set(d, visible) {
      root.visible = visible;
      bar.scale.x = d;
      t0.position.x = 0.04;
      t1.position.x = d;
    },
  };
}
