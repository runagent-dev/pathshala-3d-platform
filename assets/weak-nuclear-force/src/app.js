// Weak nuclear force (book page 68, topic 3.2.3), student view. A radioactive nucleus (6 protons, 8 neutrons):
// the student taps it (or presses "β রশ্মি দেখো") and sees the book's effect, slowed down a great deal: the weak
// nuclear force acts at a point inside one neutron, the neutron becomes a proton, and an electron, the beta (β) ray,
// shoots out in a straight line. A zoom with three stops shows how short the force's reach is: the whole atom
// (about 10⁻¹⁰ m, where the electromagnetic force holds the electrons), the nucleus (protons and neutrons, about
// 10⁻¹⁵ m each) and, a thousand times closer inside that neutron, the weak force's reach, a sphere of 10⁻¹⁸ m. A
// scale bar follows the zoom. The panel keeps the four fundamental forces in order (weakest first) with the book's
// sentence on strength. Then a short test. Built on the shared student kit (@shared/student/…).
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createAudio } from '@shared/student/audio.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { buildStudentShell } from '@shared/student/shell.js';
import { createCoach } from '@shared/student/coach.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createI18n } from './i18n.js';
import { EXIT, createBeta, createNucleus, createReach, faceCamera } from './nucleus.js';
import { createAtom } from './atom.js';
import { BETA, FORCES, NUCLEON_R, NUCLEUS, REACH_R, STOPS, STOP_IDS, betaAt, focusWeight, scaleBar, smoothstep, zoomOf } from './physics.js';

export const DEFAULTS = {
  stop: 'nucleus', // 'atom' | 'nucleus' | 'reach'
  beta: null, // 0…1: the β emission shown stopped at this point (for pictures); null: not started
  view: 'front', // 'front' | '3d'
  mode: 'explore', // 'explore' | 'quiz'
  coach: true,
  numerals: null,
  lang: 'bn',
  bg: 'light',
  sound: true,
};

const VIEW_DIRS = {
  front: new THREE.Vector3(0, 0.08, 1).normalize(),
  '3d': new THREE.Vector3(0.62, 0.4, 0.68).normalize(),
};
const LABEL_COLOR = {
  p: '#c92a2a',
  n: '#495057',
  weak: '#2b8a3e',
  beta: '#1864ab',
  e: '#1864ab',
  nucleus: '#1d2733',
  reach: '#2b8a3e',
  r: '#1d2733',
};
const MIN_NUCLEUS_PX = 11; // the nucleus is drawn at least this big (radius): at the atom's scale it is far below a pixel
const ELECTRON_PX = 4.5; // electrons in the atom: a dot this big (radius)
const SPARK_PX = 50; // the spark where the weak force acts: a point this big on the screen
const SIGN_PX = 9; // "+" and "−" only on balls at least this big (radius)
const DOUBLE_TAP_MS = 400;

export function createApp(root, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;
  /** A power of ten in metres, e.g. 10⁻¹⁸ m, in the language's digits. */
  const P = (exp) => `<span class="wn-pow">${N('10')}<sup>${exp < 0 ? '−' : ''}${N(String(Math.abs(exp)))}</sup> m</span>`;

  root.classList.add('pvc', 'wn');
  root.dataset.theme = o.bg;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ladder = FORCES.map(
    (f) =>
      `<li class="wn-f${f.id === 'weak' ? ' on' : ''}" style="--c:${f.color}"><b>${t(`f_${f.id}`)}</b><small>${f.range == null ? t('range_inf') : P(f.range)}</small></li>`,
  ).join('');
  const ui = buildStudentShell(root, t, {
    learn: `
          <p class="wn-idea" aria-live="polite"></p>
          <div class="wn-forces">
            <div class="wn-forces-head"><b>${t('forces_title')}</b><span>${t('forces_order')}</span></div>
            <ol class="wn-ladder">${ladder}</ol>
            <p class="wn-strength">${t('strength_book')}</p>
          </div>
          <div class="wn-foot">
            <div class="pvc-seg wn-stops" role="group" aria-label="${t('stops_label')}">
              ${STOP_IDS.map((id) => `<button data-stop="${id}">${t(`stop_${id}`)}</button>`).join('')}
            </div>
            <button class="pvc-btn primary" data-act="beta"><span></span></button>
          </div>`,
  });
  // on the 3D view: how it is stylised (top left), the scale bar (bottom left), the inside of the neutron (behind)
  const note = document.createElement('div');
  note.className = 'wn-note';
  const scaleEl = document.createElement('div');
  scaleEl.className = 'wn-scale';
  scaleEl.setAttribute('aria-label', t('scale_label'));
  scaleEl.innerHTML = '<i></i><span></span>';
  const inside = document.createElement('div');
  inside.className = 'wn-inside';
  ui.stage.insertBefore(inside, ui.canvasHost);
  ui.stage.append(note, scaleEl);

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 30, near: 0.02, far: 4000, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.enableZoom = false; // the zoom is the figure's (three stops), not the camera's
  controls.enablePan = false;
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(-3, 5, 6);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(4, -1, 3);
  scene.add(key, fill, new THREE.AmbientLight(0xffffff, 0.25));

  // The scene is drawn in femtometres. The camera never travels: every frame the world is scaled by 1 / R (R: the
  // zoom's radius in fm) and moved so that the point looked at is at the origin.
  const world = new THREE.Group();
  world.name = 'WeakNuclearForceScene';
  scene.add(world);
  const nucleusWrap = new THREE.Group(); // drawn bigger than life when the zoom is far out
  world.add(nucleusWrap);
  const nucleus = createNucleus();
  nucleusWrap.add(nucleus.root);
  const beta = createBeta();
  nucleusWrap.add(beta.root);
  const reach = createReach();
  world.add(reach.root);
  const atom = createAtom();
  world.add(atom.root);
  const D = nucleus.nucleons[nucleus.changing]; // the neutron that changes
  reach.root.position.copy(D.pos);
  const signs = nucleus.nucleons.filter((x) => x.sign).map((x) => ({ sign: x.sign, centre: x.pos, r: NUCLEON_R }));
  const minusSign = [{ sign: beta.minus, centre: beta.electron.position, r: 0.34 }];

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const annotations = createAnnotations({ stage, layer: ui.annoLayer });

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
  }

  const s = {
    stop: STOPS[o.stop] ? o.stop : 'nucleus', // where the zoom is going (or is)
    z: zoomOf(STOPS[o.stop] ? o.stop : 'nucleus'), // the zoom now: log10 of the radius in fm that fits in the view
    flying: false,
    beta: null, // the β emission: { t0 } (running, from performance.now()) or { frozen: seconds }
    neutral: false, // a test question asks which force it is: no green, no force label
    mystery: null, // a test question hides this: 'beta' (what the ray is) | 'reach' (how far the force acts)
    counts: false, // a test question shows the numbers of protons and neutrons on their labels
    view: o.view === '3d' ? '3d' : 'front',
    mode: 'explore',
    locked: false,
    userMovedCamera: false,
    rotating: false,
    shownReach: false, // the student has looked at the reach (the chip stops glowing)
  };
  const now = () => performance.now();
  const betaTime = () => (s.beta ? (s.beta.frozen ?? (now() - s.beta.t0) / 1000) : null);
  const betaNow = () => {
    const tt = betaTime();
    return tt == null ? null : betaAt(tt);
  };

  function snapshot() {
    const b = betaNow();
    return {
      stop: s.stop,
      zoom: +s.z.toFixed(3),
      size: +(2 * 10 ** s.z * 1e-15).toExponential(2), // metres across the view (about)
      flying: s.flying,
      beta: b?.phase ?? null, // null | 'change' | 'fly' | 'done'
      protons: b ? b.protons : NUCLEUS.protons,
      neutrons: b ? b.neutrons : NUCLEUS.neutrons,
      electrons: b ? b.emitted : 0,
      scale: bar.exp,
      view: s.view,
      mode: s.mode,
    };
  }
  let lastEmitted = '';
  function emitChange() {
    const snap = snapshot();
    const k = JSON.stringify([snap.stop, snap.flying, snap.beta, snap.view, snap.mode]);
    if (k === lastEmitted) return;
    lastEmitted = k;
    emit('change', snap);
  }

  // ── the panel ───────────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    idea: $('.wn-idea'),
    betaBtn: $('[data-act="beta"]'),
    betaLabel: $('[data-act="beta"] span'),
    stops: ui.$$('[data-stop]'),
    bar: scaleEl.querySelector('i'),
    barText: scaleEl.querySelector('span'),
  };
  let ideaKey = '';
  function refresh() {
    const b = betaNow();
    let k;
    let html;
    if (s.stop === 'atom') [k, html] = ['atom', t('idea_atom', { atom: P(-10) })];
    else if (s.stop === 'reach') [k, html] = ['reach', t('idea_reach', { r: P(-18) })];
    else if (!b) [k, html] = ['nucleus', t('idea_nucleus')];
    else if (b.phase === 'change') [k, html] = ['change', t('idea_change')];
    else {
      const p0 = NUCLEUS.protons;
      const n0 = NUCLEUS.neutrons;
      [k, html] = ['done', t('idea_done', { p0, p1: p0 + 1, n0, n1: n0 - 1 })];
    }
    if (k !== ideaKey) {
      ideaKey = k;
      el.idea.innerHTML = html;
    }
    const running = Boolean(b && s.beta.t0 != null && b.phase !== 'done');
    el.betaLabel.textContent = t(b && s.stop === 'nucleus' && !running ? 'act_again' : 'act_beta');
    el.betaBtn.classList.toggle('is-busy', running);
    el.betaBtn.setAttribute('aria-disabled', String(running || s.locked));
    for (const btn of el.stops) {
      const on = btn.dataset.stop === s.stop;
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', String(on));
    }
    setNote(); // now, so that labels placed next see its new size
    stage.invalidate();
  }

  /** The stage note follows what is on the screen now (also mid-zoom). */
  let noteKey = '';
  function setNote() {
    const b = betaNow();
    const zone = s.z > 2.4 ? 'atom' : insideNeutron() ? 'reach' : 'nucleus';
    const k = zone === 'atom' ? 'note_atom' : zone === 'reach' ? 'note_reach' : b ? 'note_slow' : 'note_base';
    if (k === noteKey) return;
    noteKey = k;
    note.textContent = t(k);
  }

  // ── the zoom: the world scaled and moved every frame ───────────────────────
  const focus = new THREE.Vector3();
  const tanHalf = () => Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  /** Pixels per femtometre at the point looked at. */
  const pxPerFm = () => stage.height / 2 / (camera.position.length() * tanHalf()) / 10 ** s.z;
  /** The camera is inside the changing neutron (its ball is then hidden and the haze shows). */
  const camFm = () => camera.position.length() * 10 ** s.z;
  const insideNeutron = () => focusWeight(s.z) > 0.99 && camFm() < NUCLEON_R * 0.97;
  let bar = { exp: 0, px: 0 };
  let barKey = '';
  const birth = new THREE.Vector3();
  const ePos = new THREE.Vector3();

  function applyScene() {
    const R = 10 ** s.z;
    focus.copy(D.pos).multiplyScalar(focusWeight(s.z));
    world.scale.setScalar(1 / R);
    world.position.copy(focus).multiplyScalar(-1 / R);
    const ppf = pxPerFm();
    const enlarge = Math.max(1, MIN_NUCLEUS_PX / (nucleus.radius * ppf));
    nucleusWrap.scale.setScalar(enlarge);
    const into = insideNeutron();
    nucleusWrap.visible = !into;
    const haze = focusWeight(s.z) > 0.5 ? (1 - smoothstep(NUCLEON_R * 0.8, NUCLEON_R * 1.05, camFm())).toFixed(3) : '0';
    if (haze !== inside.style.opacity) inside.style.opacity = haze;
    world.updateMatrixWorld(true);

    // signs on the balls, when they are big enough to read
    const bigEnough = NUCLEON_R * ppf * enlarge >= SIGN_PX;
    for (const x of signs) x.sign.material.visible = bigEnough;
    faceCamera(signs, nucleus.root, camera);

    // the atom: fades out as the zoom goes into the nucleus
    const fade = smoothstep(2.3, 3.7, s.z);
    atom.root.visible = fade > 0.001;
    if (atom.root.visible) atom.update(ELECTRON_PX / ppf, fade);

    drawBeta(ppf, enlarge);

    // the weak force's reach, at its real size (it shows only far inside the neutron)
    reach.root.visible = REACH_R * ppf > 0.8;
    reach.facing.quaternion.copy(camera.quaternion);

    // the scale bar: the longest power of ten that fits
    bar = scaleBar(ppf, Math.min(stage.width * 0.5, 240));
    const hide = s.mystery === 'reach' || (s.stop === 'atom' && !s.flying); // at the atom, its size line says it
    const k = `${bar.exp}|${Math.round(bar.px)}|${hide}`;
    if (k !== barKey) {
      barKey = k;
      scaleEl.hidden = hide || !(bar.px > 0);
      el.bar.style.width = `${Math.round(bar.px)}px`;
      el.barText.innerHTML = P(bar.exp);
    }
    setNote();
  }
  stage.onBeforeRender(applyScene);

  /** The β emission at its time now: the spark, the colour change, the electron and its track. */
  function drawBeta(ppf, enlarge) {
    const b = betaNow();
    nucleus.setChange(b ? b.change : 0);
    beta.root.visible = Boolean(b) && s.z < 1.6;
    if (!beta.root.visible) return;
    beta.spark.visible = b.spark > 0.01;
    beta.spark.position.copy(D.pos);
    const size = Math.min(SPARK_PX, 2.2 * NUCLEON_R * ppf * enlarge); // never much bigger than the neutron
    beta.spark.scale.setScalar((size * (0.65 + 0.35 * b.spark)) / (ppf * enlarge));
    beta.spark.material.opacity = Math.min(1, b.spark * 1.8);
    birth.copy(D.pos).addScaledVector(EXIT, NUCLEON_R + 0.1);
    const flying = b.electron != null && b.phase !== 'done';
    beta.electron.visible = flying;
    beta.minus.visible = flying && 0.34 * ppf * enlarge >= SIGN_PX * 0.6;
    if (b.electron == null) return beta.setTrack(birth, null);
    ePos.copy(birth).addScaledVector(EXIT, b.electron);
    beta.electron.position.copy(ePos);
    beta.setTrack(birth, ePos);
    faceCamera(minusSign, nucleus.root, camera);
  }

  // ── the β emission ─────────────────────────────────────────────────────────
  let lastPhase = null;
  function clearBeta() {
    s.beta = null;
    lastPhase = null;
    nucleus.setChange(0);
    annotations.remove('weak');
    annotations.remove('beta');
  }
  function playBeta() {
    clearBeta();
    s.beta = { t0: now() };
    beta.setNeutral(s.neutral);
    coach?.objectUsed();
    refresh();
    emitChange();
  }
  function freezeBeta(k) {
    clearBeta();
    s.beta = { frozen: Math.min(1, Math.max(0, k)) * BETA.duration };
    beta.setNeutral(s.neutral);
    refresh();
    emitChange();
  }
  function onPhase(phase) {
    if (phase) emit('beta', { phase });
    if (phase === 'fly' && s.beta?.t0 != null) audio.tick(); // the electron leaves: a click, as in a counter
    if (phase === 'done' && s.beta?.t0 != null && !s.shownReach && s.mode === 'explore') {
      // there is more to see: how short the force's reach is
      for (const b of el.stops) b.classList.toggle('wn-nudge', b.dataset.stop === 'reach');
    }
    if (phase === 'fly' && s.counts && s.stop === 'nucleus' && !s.flying && !s.rotating)
      buildLabels(); // new numbers
    else if (phase && phase !== 'done' && s.stop === 'nucleus' && !s.flying && !s.rotating) addWeakLabel();
    refresh();
    emitChange();
  }
  stage.addTicker(() => {
    const b = betaNow();
    const phase = b?.phase ?? null;
    if (phase !== lastPhase) {
      lastPhase = phase;
      onPhase(phase);
    }
    if (b && b.electron != null && !annotations.has('beta')) maybeBetaLabel();
    const running = Boolean(b && s.beta.t0 != null && phase !== 'done');
    return running; // keep drawing while it moves (the zoom and camera flights keep drawing through the tweener)
  });

  // ── going between the three stops ──────────────────────────────────────────
  let flight = 0;
  let act = 0; // a pending action after a flight (e.g. "β" pressed while looking at the atom)
  function goStop(stop, { animate = true } = {}) {
    if (!STOPS[stop]) return Promise.resolve(false);
    const my = ++flight;
    const z0 = s.z;
    const z1 = zoomOf(stop);
    s.stop = stop;
    if (stop === 'reach') {
      clearBeta(); // the zoom goes into a neutron that has not changed yet
      s.shownReach = true;
      for (const b of el.stops) b.classList.remove('wn-nudge');
      if (s.view !== 'front' || s.userMovedCamera) setView('front', { animate }); // the neutron faces the front
    }
    annotations.clear();
    hideHint();
    emit('stop', { stop });
    if (!animate || Math.abs(z1 - z0) < 1e-6) {
      tweener.cancel('zoom');
      s.z = z1;
      s.flying = false;
      arrive();
      return Promise.resolve(true);
    }
    s.flying = true;
    refresh();
    emitChange();
    return tweener
      .animate({
        key: 'zoom',
        duration: 0.8 + 0.33 * Math.abs(z1 - z0),
        ease: ease.inOutSine,
        onUpdate: (k) => {
          s.z = z0 + (z1 - z0) * k;
          stage.invalidate();
        },
      })
      .finished.then((done) => {
        if (my !== flight) return false;
        s.flying = false;
        if (done) arrive();
        return done;
      });
  }
  function arrive() {
    applyScene();
    buildLabels();
    refresh();
    emitChange();
  }
  function chooseStop(stop) {
    if (s.locked) return lockedNudge();
    act++;
    if (stop === s.stop && !s.flying) return;
    goStop(stop);
  }

  /** "β রশ্মি দেখো": at the nucleus it plays (again); elsewhere the zoom goes to the nucleus first. */
  let lastAct = -1e9;
  function betaAction() {
    if (s.locked) return lockedNudge();
    const n = now();
    if (n - lastAct < DOUBLE_TAP_MS) return; // a quick second tap does not start it over
    lastAct = n;
    audio.unlock();
    const b = betaNow();
    if (b && s.beta.t0 != null && b.phase !== 'done') return showHint(t('hint_wait'), { duration: 1800 });
    if (s.stop !== 'nucleus' || s.flying || Math.abs(s.z - zoomOf('nucleus')) > 1e-3) {
      // not at the nucleus yet (another stop, a zoom on its way, the first look at the atom): go there first
      const my = ++act;
      goStop('nucleus').then((ok) => ok && my === act && !s.locked && playBeta());
      return;
    }
    playBeta();
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  const up = new THREE.Vector3();
  const right = new THREE.Vector3();
  /** The camera for a direction: a ball of radius 1 round the origin fits below the corner buttons. */
  function viewPose(dir) {
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const H = Math.max(stage.height, 1);
    const W = Math.max(stage.width, 1);
    const cornerW = ui.corner.offsetWidth || 220;
    const clear = W / 2 - H / 2 > cornerW + 20; // the ball (as tall as the view) stays clear of the buttons
    const top = clear ? 10 : Math.min(58, Math.max(40, H * 0.14));
    const bottom = 30; // the scale bar
    const left = W * 0.06; // the content sits a little left of the middle: the β ray leaves to the right
    const usableH = Math.max(0.4, (H - top - bottom) / H);
    const usableW = Math.max(0.5, (W - 20 - 2 * left) / W);
    const d = Math.max(1 / Math.tan(vfov / 2) / usableH, 1 / Math.tan(hfov / 2) / usableW);
    const perPx = (2 * d * Math.tan(vfov / 2)) / H;
    up.set(0, 1, 0).addScaledVector(dir, -dir.y).normalize();
    right.crossVectors(up, dir).normalize();
    const target = up
      .clone()
      .multiplyScalar(((top - bottom) / 2) * perPx)
      .addScaledVector(right, left * perPx);
    return { target, position: target.clone().addScaledVector(dir, d) };
  }
  function flyCam({ position, target }, duration = 0.8) {
    tweener.cancel('camera');
    if (!duration) {
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    const p0 = camera.position.clone();
    const t0 = controls.target.clone();
    const len0 = p0.distanceTo(t0);
    const len1 = position.distanceTo(target);
    const d0 = p0.clone().sub(t0).normalize();
    const d1 = position.clone().sub(target).normalize();
    const dir = new THREE.Vector3();
    return tweener.animate({
      key: 'camera',
      duration,
      onUpdate: (k) => {
        // round the ball, not through it: the direction turns and the distance changes on its own
        dir.copy(d0).lerp(d1, k).normalize();
        controls.target.lerpVectors(t0, target, k);
        camera.position.copy(controls.target).addScaledVector(dir, len0 + (len1 - len0) * k);
        controls.update();
        stage.invalidate();
      },
    }).finished;
  }
  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    controls.enableRotate = s.view === '3d';
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    emitChange();
    return flyCam(viewPose(VIEW_DIRS[s.view]), animate ? 0.8 : 0).then((done) => {
      if (done && !s.flying) buildLabels();
      return done;
    });
  }
  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    s.rotating = true;
    tweener.cancel('camera');
    annotations.clear(); // the labels come back in good places once the turning stops
  });
  controls.addEventListener('end', () => {
    s.rotating = false;
    if (!s.flying) setTimeout(() => !s.rotating && !s.flying && buildLabels(), 350);
  });
  stage.onResize(() => {
    // re-fit at once (a camera flight in progress ends where it was going; the zoom goes on by itself)
    const dir = s.userMovedCamera ? camera.position.clone().sub(controls.target).normalize() : VIEW_DIRS[s.view];
    flyCam(viewPose(dir), 0);
    root.classList.toggle('wn-compact', stage.height < 300 || stage.width < 360);
    requestAnimationFrame(() => !s.flying && !s.rotating && buildLabels());
  });

  // ── labels on the 3D, placed where they cover nothing ──────────────────────
  const v = new THREE.Vector3();
  const w0 = new THREE.Vector3();
  const w1 = new THREE.Vector3();
  function toScreen(p) {
    v.copy(p).project(camera);
    return { x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height, z: v.z };
  }
  /** The world point drawn at canvas pixel (x, y), as deep as world point ref. */
  function unprojectAt(x, y, ref, out) {
    v.copy(ref).project(camera);
    return out.set((x / stage.width) * 2 - 1, -(y / stage.height) * 2 + 1, v.z).unproject(camera);
  }
  const measurer = document.createElement('div');
  measurer.className = 'pvc-anno pvc-anno-callout wn-measure';
  measurer.setAttribute('aria-hidden', 'true');
  ui.annoLayer.append(measurer);
  function boxSize(text) {
    measurer.innerHTML = text;
    return { w: measurer.offsetWidth, h: measurer.offsetHeight };
  }
  function rectOf(elm) {
    if (!elm || elm.hidden) return null;
    const r = elm.getBoundingClientRect();
    if (!r.width || getComputedStyle(elm).opacity === '0') return null;
    const c = stage.canvas.getBoundingClientRect();
    return { x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height };
  }
  const overlap = (a, b, pad = 4) =>
    Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + pad) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + pad);
  function circleHit(box, c) {
    const dx = Math.max(Math.abs(c.x - (box.x + box.w / 2)) - box.w / 2, 0);
    const dy = Math.max(Math.abs(c.y - (box.y + box.h / 2)) - box.h / 2, 0);
    return Math.max(0, c.r + 4 - Math.hypot(dx, dy));
  }
  function segmentHit(box, sg) {
    // sample the segment: how many samples fall inside the box (grown by 6 px)
    let n = 0;
    for (let i = 0; i <= 24; i++) {
      const x = sg.a.x + ((sg.b.x - sg.a.x) * i) / 24;
      const y = sg.a.y + ((sg.b.y - sg.a.y) * i) / 24;
      if (x > box.x - 6 && x < box.x + box.w + 6 && y > box.y - 6 && y < box.y + box.h + 6) n++;
    }
    return n;
  }
  /** The kit's offset (dx, dy) that puts a w×h label box with its top left at (x, y), for anchor a (see annotations.js). */
  function offsetFor(a, x, y, w, h) {
    const dy = y + h / 2 - a.y;
    if (x - a.x > 4) return { dx: x - a.x, dy }; // the box's left edge, right of the anchor
    if (x + w - a.x < -4) return { dx: x + w - a.x, dy }; // its right edge, left of the anchor
    return { dx: Math.max(-4, Math.min(4, x + w / 2 - a.x)), dy }; // centred above or below it
  }
  let placed = []; // label boxes placed so far (this layout)
  function obstacles() {
    const rects = [ui.corner, note, scaleEl, ui.hint.classList.contains('show') ? ui.hint : null].map(rectOf).filter(Boolean);
    const circles = [];
    const segs = [];
    if (s.stop === 'nucleus' || s.stop === 'atom') circles.push(nucleusDisc());
    if (s.stop === 'nucleus') {
      // the electron's way out, from the neutron to the edge of the view
      const a = toScreen(nucleus.root.localToWorld(w0.copy(D.pos)));
      const b = toScreen(nucleus.root.localToWorld(w0.copy(D.pos).addScaledVector(EXIT, BETA.distance)));
      segs.push({ a, b });
    }
    if (s.stop === 'reach') circles.push(reachDisc());
    return { rects, circles, segs };
  }
  function nucleusDisc() {
    const c = toScreen(nucleusWrap.getWorldPosition(w0));
    return { x: c.x, y: c.y, r: nucleus.radius * pxPerFm() * nucleusWrap.scale.x };
  }
  function reachDisc() {
    const c = toScreen(reach.root.getWorldPosition(w0));
    return { x: c.x, y: c.y, r: REACH_R * pxPerFm() };
  }
  /**
   * Add label `id` for anchor(): its box goes just beyond the edge of `disc` ({ x, y, r } on the screen: the nucleus,
   * the sphere…) in the direction `angle` (degrees on the screen, 0 right, 90 down), turned a little either way when
   * it would cover something (the buttons, the note, the scale bar, the electron's way, another label). rim: the
   * radius (fm) of the ball the anchor is the centre of; the leader then starts on its edge, toward the label.
   */
  function place(id, text, anchor, angle, color, disc, gap = 16, rim = 0) {
    const a = toScreen(anchor(w0));
    if (a.z > 1 || a.z < -1) return;
    const { w, h } = boxSize(text);
    const obs = obstacles();
    let best = null;
    for (const turn of [0, 20, -20, 40, -40, 65, -65, 90, -90, 130, -130, 180]) {
      const th = THREE.MathUtils.degToRad(angle + turn);
      const ux = Math.cos(th);
      const uy = Math.sin(th);
      const out = disc.r + gap + (Math.abs(ux) * w + Math.abs(uy) * h) / 2;
      const x0 = disc.x + ux * out - w / 2;
      const y0 = disc.y + uy * out - h / 2;
      const box = { x: Math.min(Math.max(x0, 6), stage.width - w - 6), y: Math.min(Math.max(y0, 6), stage.height - h - 6), w, h };
      let cost = (Math.abs(box.x - x0) + Math.abs(box.y - y0)) * 3 + Math.abs(turn) * 0.4;
      for (const r of [...obs.rects, ...placed]) cost += overlap(box, r);
      for (const c of obs.circles) cost += circleHit(box, c) * 40;
      for (const sg of obs.segs) cost += segmentHit(box, sg) * 60;
      if (!best || cost < best.cost) best = { box, cost };
    }
    placed.push(best.box);
    const pt = new THREE.Vector3();
    let point = () => anchor(pt);
    let from = a;
    if (rim) {
      // on the ball's edge, on the side of the label (as seen now; it stays on that side as the view turns)
      const ux = best.box.x + w / 2 - a.x;
      const uy = best.box.y + h / 2 - a.y;
      const len = Math.hypot(ux, uy) || 1;
      const side = new THREE.Vector3();
      point = () => {
        side.setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(ux / len);
        side.addScaledVector(w1.setFromMatrixColumn(camera.matrixWorld, 1), -uy / len);
        // the world group's own units are femtometres (its parts are not turned, and the nucleus is life size here)
        return world.localToWorld(world.worldToLocal(anchor(pt)).addScaledVector(side, rim * 0.8));
      };
      from = toScreen(point());
    }
    const { dx, dy } = offsetFor(from, best.box.x, best.box.y, w, h);
    annotations.add(id, { text, point, dx, dy, kind: 'callout', color });
  }
  const narrow = () => stage.width < 520; // labels in two lines
  const nucleonAt = (i) => (out) => nucleus.root.localToWorld(out.copy(nucleus.nucleons[i].pos));
  function addWeakLabel() {
    if (s.neutral || annotations.has('weak')) return;
    // on the point where it acts (the spark); the name beyond the nucleus, below the electron's way out
    place('weak', t(narrow() ? 'label_weak_2' : 'label_weak'), nucleonAt(nucleus.changing), 32, LABEL_COLOR.weak, nucleusDisc(), 4);
  }
  /**
   * The β ray's name rides beside its track once the electron is well out of the nucleus: above it, or below it
   * when that covers less of the other labels (in a turned view the track can run anywhere).
   */
  const sA = new THREE.Vector3();
  const sB = new THREE.Vector3();
  const betaPt = new THREE.Vector3();
  let betaBox = { w: 0, h: 0 };
  let betaSide = -1; // -1 above the track, 1 below; chosen when the label is added
  function betaLabelPoint(out, side = betaSide) {
    const b = betaNow();
    if (!b || b.electron == null) return out.set(0, 0, 0);
    nucleus.root.localToWorld(sA.copy(D.pos).addScaledVector(EXIT, NUCLEON_R + 0.1));
    nucleus.root.localToWorld(sB.copy(D.pos).addScaledVector(EXIT, NUCLEON_R + 0.1 + b.electron));
    const a = toScreen(sA);
    const e = toScreen(sB);
    // the part of the track that is on the screen
    const m = 10;
    let k = 1;
    for (const [p, lo, hi] of [
      ['x', m, stage.width - m],
      ['y', m, stage.height - m],
    ]) {
      const d = e[p] - a[p];
      if (e[p] > hi && d > 0) k = Math.min(k, (hi - a[p]) / d);
      if (e[p] < lo && d < 0) k = Math.min(k, (lo - a[p]) / d);
    }
    const ex = a.x + (e.x - a.x) * k;
    const ey = a.y + (e.y - a.y) * k;
    const len = Math.hypot(ex - a.x, ey - a.y) || 1;
    const ux = (ex - a.x) / len;
    const uy = (ey - a.y) / len;
    let nx = -uy;
    let ny = ux;
    if (Math.sign(ny || 1) !== side) [nx, ny] = [-nx, -ny];
    const { w, h } = betaBox;
    const along = Math.min(Math.max(len * 0.55, w / 2 + 16), Math.max(len - w / 2, w / 2 + 16));
    const off = (Math.abs(nx) * w + Math.abs(ny) * h) / 2 + 8;
    return unprojectAt(a.x + ux * along + nx * off, a.y + uy * along + ny * off, sA, out);
  }
  function betaLabelText() {
    return t(s.mystery === 'beta' ? 'label_beta_q' : narrow() ? 'label_beta_2' : 'label_beta');
  }
  function maybeBetaLabel() {
    if (s.stop !== 'nucleus' || s.flying || s.rotating || !s.beta) return;
    const b = betaNow();
    nucleus.root.localToWorld(sA.copy(D.pos));
    nucleus.root.localToWorld(sB.copy(D.pos).addScaledVector(EXIT, NUCLEON_R + 0.1 + b.electron));
    const a = toScreen(sA);
    const e = toScreen(sB);
    if (Math.hypot(e.x - a.x, e.y - a.y) < 90 && b.phase !== 'done') return; // not yet out far enough
    const text = betaLabelText();
    betaBox = boxSize(text);
    // the side of the track where it covers less (the force's name, the buttons, the note), above when equal
    const cost = (side) => {
      const c = toScreen(betaLabelPoint(w0, side));
      const bx = { x: c.x - betaBox.w / 2, y: c.y - betaBox.h / 2, w: betaBox.w, h: betaBox.h };
      const others = [...placed, ...obstacles().rects];
      return others.reduce((sum, r) => sum + overlap(bx, r), 0) + (side === 1 ? 1 : 0);
    };
    betaSide = cost(-1) <= cost(1) ? -1 : 1;
    annotations.add('beta', { text, point: () => betaLabelPoint(betaPt), dx: 0, dy: 0, kind: 'callout', color: LABEL_COLOR.beta });
  }

  /** All the labels for what is on the screen now. */
  function buildLabels() {
    annotations.clear();
    placed = [];
    if (s.flying || s.rotating) return;
    if (s.stop === 'nucleus') {
      const disc = nucleusDisc();
      const b = betaNow();
      // a test question gives the numbers on the labels (they change when the electron leaves)
      const [pText, nText] = s.counts
        ? [t('label_proton_n', { n: b ? b.protons : NUCLEUS.protons }), t('label_neutron_n', { n: b ? b.neutrons : NUCLEUS.neutrons })]
        : [t('label_proton'), t('label_neutron')];
      place('p', pText, nucleonAt(nucleus.labelled.p), -125, LABEL_COLOR.p, disc, 10, NUCLEON_R);
      place('n', nText, nucleonAt(nucleus.labelled.n), 170, LABEL_COLOR.n, disc, 10, NUCLEON_R);
      if (b) addWeakLabel();
      if (b && b.electron != null) maybeBetaLabel();
    } else if (s.stop === 'atom') {
      // the atom's size on a line under it, then the nucleus and one electron
      const size = t('label_atom_size', { s: P(-10) });
      const pt = new THREE.Vector3();
      annotations.add('size', { text: size, point: () => atom.sizeMid(pt), dx: 0, dy: 0, kind: 'callout', color: LABEL_COLOR.nucleus });
      placed.push(boxAt(atom.sizeMid(w0), size));
      place('nucleus', t('label_nucleus'), (out) => nucleusWrap.getWorldPosition(out), 140, LABEL_COLOR.nucleus, nucleusDisc(), 22);
      const e = toScreen(atom.electronWorld(4, w0));
      place('e', t('label_electron'), (out) => atom.electronWorld(4, out), -40, LABEL_COLOR.e, { x: e.x, y: e.y, r: ELECTRON_PX + 2 }, 18);
    } else {
      const name = t(narrow() ? 'label_reach_2' : 'label_reach');
      place('reach', name, (out) => reach.root.getWorldPosition(out), -90, LABEL_COLOR.reach, reachDisc(), 16, REACH_R * 1.25);
      const text = s.mystery === 'reach' ? t('label_unknown') : P(-18);
      const pt = new THREE.Vector3();
      annotations.add('r', { text, point: () => reach.mid(pt), dx: 0, dy: -22, kind: 'callout', color: LABEL_COLOR.r });
    }
  }
  /** The box of a label centred on world point p. */
  function boxAt(p, text) {
    const c = toScreen(p);
    const { w, h } = boxSize(text);
    return { x: c.x - w / 2, y: c.y - h / 2, w, h };
  }

  // ── touching the 3D ─────────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  /** What a finger at canvas point p takes: 'nucleus' (at the nucleus), 'go' (the tiny nucleus in the atom), or null. */
  function pick(p, reach_ = 30) {
    if (s.flying) return null;
    if (s.stop === 'atom') {
      const c = toScreen(nucleusWrap.getWorldPosition(w0));
      return Math.hypot(c.x - p.x, c.y - p.y) < reach_ + MIN_NUCLEUS_PX ? 'go' : null;
    }
    if (s.stop !== 'nucleus') return null;
    ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.intersectObjects(nucleus.hits, false).length) return 'nucleus';
    // a finger a little off the ball still counts
    const c = toScreen(nucleusWrap.getWorldPosition(w0));
    return Math.hypot(c.x - p.x, c.y - p.y) < nucleus.radius * pxPerFm() + reach_ * 0.5 ? 'nucleus' : null;
  }
  function touch(hit) {
    if (s.locked) return lockedNudge();
    if (hit === 'go') return chooseStop('nucleus');
    betaAction();
  }
  let down = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      root.focus({ preventScroll: true });
      coach?.interrupt();
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const hit = pick(canvasPoint(e), e.pointerType === 'mouse' ? 16 : 30);
      if (!hit) return; // the camera controls take it
      if (s.view === 'front') {
        // nothing turns in the front view: act at once
        e.stopPropagation();
        e.preventDefault();
        touch(hit);
        return;
      }
      down = { hit, x: e.clientX, y: e.clientY, id: e.pointerId }; // in the turning view, a tap (not a drag) acts
    },
    true,
  );
  ui.canvasHost.addEventListener('pointerup', (e) => {
    if (!down || e.pointerId !== down.id) return;
    const d = down;
    down = null;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) touch(d.hit);
  });
  ui.canvasHost.addEventListener('pointercancel', () => (down = null));
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
      ui.canvasHost.style.cursor = pick(p, 16) ? (s.locked ? 'not-allowed' : 'pointer') : '';
    });
  });

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(text, { duration = 4000 } = {}) {
    ui.hintText.textContent = text;
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
    showHint(t('q_locked'), { duration: 3000 });
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
  const textLabel = (keys) => (j) => `<span class="wn-txt">${t(keys[j])}</span>`;
  /** Wrong answers worth a word: the choice's key → what is wrong with it. */
  const MISTAKES = {
    c_strong: 'cause_m_strong',
    c_em: 'cause_m_em',
    c_gravity: 'cause_m_gravity',
    w_light: 'what_m_light',
    w_proton: 'what_m_nucleon',
    w_neutron: 'what_m_nucleon',
    r_any: 'range_m_any',
    s_none: 'strong_m_none',
  };
  /** The scene of a question: where the zoom is, the nucleus fresh (or the β emission stopped at k), what is hidden. */
  function setupQuestion({ stop, betaAt: k = null, neutral = false, mystery = null, counts = false }) {
    act++;
    s.neutral = neutral;
    s.mystery = mystery;
    s.counts = counts;
    beta.setNeutral(neutral);
    clearBeta();
    if (k != null) freezeBeta(k);
    const arrived = goStop(stop);
    barKey = '';
    if (!s.flying) buildLabels();
    refresh();
    return arrived;
  }

  let kinds = [];
  let question = null;
  let lastPick = -1;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    hooks: {
      enter() {
        s.mode = 'quiz';
        s.locked = true;
        act++;
        hideHint();
        for (const b of el.stops) b.classList.remove('wn-nudge');
        kinds = shuffle(['cause', pickOne(['what', 'count']), pickOne(['range', 'far']), pickOne(['strong', 'order']), 'where']);
        syncUI();
      },
      leave() {
        s.mode = 'explore';
        s.locked = false;
        s.neutral = false;
        s.mystery = null;
        s.counts = false;
        beta.setNeutral(false);
        clearBeta();
        barKey = '';
        goStop('nucleus');
        syncUI();
        refresh();
      },
      prepare(i, alive, say) {
        const kind = kinds[i % kinds.length];
        question = { kind };
        lastPick = -1;
        const choiceOf = (keys, right) => ({
          choices: [0, 1, 2, 3],
          expected: keys.indexOf(right),
          tolerance: 0.5,
          label: textLabel(keys),
          meta: { kind },
        });
        if (kind === 'cause') {
          // the β ray comes out, with nothing to say which force did it (no green, no label)
          const arrived = setupQuestion({ stop: 'nucleus', neutral: true });
          arrived.then((ok) => ok && alive() && playBeta());
          say(t('q_cause'));
          const keys = shuffle(['c_weak', 'c_strong', 'c_em', 'c_gravity']);
          question = { kind, keys };
          return choiceOf(keys, 'c_weak');
        }
        if (kind === 'what') {
          // the ray has gone out; its label asks what it is
          setupQuestion({ stop: 'nucleus', betaAt: 1, mystery: 'beta' });
          say(t('q_what'));
          const keys = shuffle(['w_electron', 'w_proton', 'w_neutron', 'w_light']);
          question = { kind, keys };
          return choiceOf(keys, 'w_electron');
        }
        if (kind === 'count') {
          // the nucleus before, its labels with the numbers: think what changes
          setupQuestion({ stop: 'nucleus', counts: true });
          const p = NUCLEUS.protons;
          const n = NUCLEUS.neutrons;
          say(t('q_protons'));
          question = { kind, p, n };
          return {
            choices: shuffle([p + 1, p, p - 1, n]),
            expected: p + 1,
            tolerance: 0.5,
            label: (val) => t('count_n', { n: val }),
            meta: { kind },
          };
        }
        if (kind === 'range') {
          // inside the neutron: the sphere's size is hidden, and so is the scale bar
          setupQuestion({ stop: 'reach', mystery: 'reach' });
          say(t('q_range'));
          const opts = shuffle([-18, -15, -10, 'any']);
          question = { kind, opts };
          return {
            choices: [0, 1, 2, 3],
            expected: opts.indexOf(-18),
            tolerance: 0.5,
            label: (j) => (opts[j] === 'any' ? `<span class="wn-txt">${t('r_any')}</span>` : P(opts[j])),
            meta: { kind },
          };
        }
        if (kind === 'far') {
          setupQuestion({ stop: 'atom' });
          say(t('q_far'));
          const keys = shuffle(['far_gravity', 'far_weak', 'far_both', 'far_none']);
          question = { kind, keys };
          return choiceOf(keys, 'far_gravity');
        }
        if (kind === 'strong' || kind === 'order') {
          setupQuestion({ stop: 'nucleus' });
          say(t(kind === 'strong' ? 'q_strong' : 'q_order'));
          const keys = shuffle(kind === 'strong' ? ['s_gravity', 's_em', 's_strong', 's_none'] : ['o_between', 'o_first', 'o_last', 'o_third']);
          question = { kind, keys };
          return choiceOf(keys, kind === 'strong' ? 's_gravity' : 'o_between');
        }
        // where: the whole atom on the screen (the other forces' places are in it, or far beyond it)
        setupQuestion({ stop: 'atom' });
        say(t('q_where'));
        const keys = shuffle(['wh_nucleus', 'wh_earth', 'wh_comb', 'wh_atom']);
        question = { kind, keys };
        return choiceOf(keys, 'wh_nucleus');
      },
      reveal(shown, correct) {
        const q = question;
        const r = P(-18);
        const picked = q.keys?.[lastPick];
        const note_ = !correct && MISTAKES[picked] ? ` ${t(MISTAKES[picked])}` : '';
        if (q.kind === 'cause') {
          // now the force is named, in its colour
          s.neutral = false;
          beta.setNeutral(false);
          if (!s.flying) addWeakLabel();
          stage.invalidate();
          return t('cause_why') + note_;
        }
        if (q.kind === 'what') {
          s.mystery = null;
          annotations.remove('beta');
          maybeBetaLabel();
          return t('what_why') + note_;
        }
        if (q.kind === 'count') {
          // it happens: one neutron turns red
          if (s.stop === 'nucleus' && !s.flying) playBeta();
          const said = shown.choices[lastPick];
          const why = said === q.n ? 'count_m_n' : said < q.p ? 'count_m_less' : 'count_m_same';
          const mistake = correct ? '' : ` ${t(why, { n: q.n })}`;
          return t('count_why', { p1: q.p + 1, n0: q.n, n1: q.n - 1 }) + mistake;
        }
        if (q.kind === 'range') {
          s.mystery = null;
          barKey = '';
          if (!s.flying) buildLabels();
          stage.invalidate();
          const picked_ = q.opts[lastPick];
          const extra = !correct && picked_ === 'any' ? ` ${t('range_m_any')}` : '';
          return t('range_why', { r, r15: P(-15), r10: P(-10) }) + extra;
        }
        if (q.kind === 'far') return t('far_why', { r });
        if (q.kind === 'strong') return t('strong_why') + note_;
        if (q.kind === 'order') return t('order_why');
        return t('where_why', { r });
      },
      done() {
        s.locked = false;
        refresh();
      },
    },
  });

  // ── first-use pointer: on the nucleus ───────────────────────────────────────
  let coach = null;
  if (o.coach) {
    const spot = new THREE.Vector3();
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe: null,
      tweener,
      avoid: [ui.corner, ui.hint, note, scaleEl],
      object: {
        label: 'coach_tap',
        // the neutron that will change, then the middle of the nucleus
        candidates: () =>
          s.stop === 'nucleus' && !s.flying ? [toScreen(nucleonAt(nucleus.changing)(spot)), toScreen(nucleusWrap.getWorldPosition(spot))] : [],
        grabbable: (p) => pick(p) === 'nucleus',
        // the nucleus swells a little, twice, as if to say "here"
        async demo(alive) {
          for (let i = 0; i < 2 && alive(); i++) {
            await tweener.animate({
              key: 'coach-pulse',
              duration: 0.7,
              onUpdate: (k) => {
                nucleus.root.scale.setScalar(1 + 0.06 * Math.sin(k * Math.PI));
                stage.invalidate();
              },
            }).finished;
          }
          nucleus.root.scale.setScalar(1);
        },
        cancel: () => {
          tweener.cancel('coach-pulse');
          nucleus.root.scale.setScalar(1);
          stage.invalidate();
        },
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
    coach?.setMode(s.mode);
  }
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;
  root.addEventListener('click', (e) => {
    const b = /** @type {Element} */ (e.target).closest('button');
    if (!b || !root.contains(b)) return;
    audio.unlock();
    if (b.dataset.view) {
      if (s.locked && s.mode === 'quiz') return lockedNudge();
      setView(b.dataset.view);
    }
    if (b.dataset.stop) chooseStop(b.dataset.stop);
    if (b.dataset.mode === 'quiz' && s.mode !== 'quiz') quiz.start();
    if (b.dataset.mode === 'explore') quiz.stop();
    if (b.dataset.q != null) {
      lastPick = Number(b.dataset.q); // the reveal names the mistake behind a wrong choice
      quiz.choose(lastPick);
    }
    switch (b.dataset.act) {
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'beta':
        betaAction();
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
    const i = STOP_IDS.indexOf(s.stop);
    if (k === 'b' || (k === ' ' && !target.closest('button'))) betaAction();
    else if (k === 'arrowup' || k === '+' || k === '=')
      chooseStop(STOP_IDS[Math.min(STOP_IDS.length - 1, i + 1)]); // closer in
    else if (k === 'arrowdown' || k === '-')
      chooseStop(STOP_IDS[Math.max(0, i - 1)]); // further out
    else if (k === '1' || k === '2' || k === '3') chooseStop(STOP_IDS[Number(k) - 1]);
    else if (k === 'f' || k === 'v') {
      if (s.locked && s.mode === 'quiz') lockedNudge();
      else setView(k === 'f' ? 'front' : '3d');
    } else if (k === 'escape') hideHint();
    else return;
    e.preventDefault();
  });

  // ── start ───────────────────────────────────────────────────────────────────
  controls.enableRotate = s.view === '3d';
  root.classList.toggle('wn-compact', stage.height < 300 || stage.width < 360);
  flyCam(viewPose(VIEW_DIRS[s.view]), 0);
  // the first time (with the pointers on) the zoom starts at the whole atom and goes into the nucleus
  const intro = o.coach && o.mode !== 'quiz' && s.stop === 'nucleus' && o.beta == null;
  if (intro) s.z = zoomOf('atom');
  syncUI();
  if (o.beta != null && Number.isFinite(Number(o.beta)) && s.stop === 'nucleus') freezeBeta(Number(o.beta));
  applyScene();
  if (!intro) buildLabels();
  refresh();
  const ready = (async () => {
    if (o.mode === 'quiz') quiz.start();
    else if (intro) {
      setTimeout(() => {
        if (s.stop !== 'nucleus' || s.flying || s.mode !== 'explore' || s.z !== zoomOf('atom')) return;
        s.z = zoomOf('atom');
        goStop('nucleus');
      }, 700);
      coach?.start(3900);
    } else coach?.start();
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
     * Change any of: stop ('atom' | 'nucleus' | 'reach': the zoom goes there), beta (true: the β emission plays at the
     * nucleus; false: a fresh nucleus; a number 0…1: the emission stopped at that point), view; animate: false jumps.
     */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.view) await setView(p.view, { animate });
      if (p.stop && STOPS[p.stop]) {
        act++;
        const going = goStop(p.stop, { animate });
        if (!animate) await going;
      }
      if (p.beta === false) {
        clearBeta();
        buildLabels();
        refresh();
        emitChange();
      } else if (p.beta === true) {
        if (s.stop !== 'nucleus') await goStop('nucleus', { animate });
        playBeta();
      } else if (typeof p.beta === 'number' && Number.isFinite(p.beta)) {
        if (s.stop !== 'nucleus') await goStop('nucleus', { animate: false });
        freezeBeta(p.beta);
        buildLabels();
      }
      return snapshot();
    },
    async reset() {
      quiz.stop();
      hideHint();
      act++;
      s.neutral = false;
      s.mystery = null;
      s.counts = false;
      clearBeta();
      await setView('front', { animate: false });
      await goStop('nucleus', { animate: false });
      refresh();
      emitChange();
    },
    startPractice: () => quiz.start(),
    capture: (opts) => stage.capture(opts),
    exportRoot: () => nucleus.root, // the nucleus: 6 protons and 8 neutrons (signs, the β parts and the atom are not exported)
  };
}
