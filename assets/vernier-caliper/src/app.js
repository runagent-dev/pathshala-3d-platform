// Vernier caliper app: wires the 3D model, interaction, UI, tour, practice and quiz together.
//
//   import { createVernierApp } from './src/app.js';
//   const app = createVernierApp(document.getElementById('app'), { lc: 0.02 });
//   app.on('change', (reading) => …);
//   app.set({ value: 31.4, specimen: 'sphere' });
import * as THREE from 'three';
import { exportGLB as exportFigureGLB } from '@shared/export-glb.js';
import { createStage } from '@shared/stage.js';
import { createPresentation } from './presentation.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createCaliper, DIM } from './caliper.js';
import { createSpecimen, SPECIMENS, SPECIMEN_KINDS, gapLimits, entryOffset } from './specimens.js';
import { createLoupe } from '@shared/student/loupe.js';
import { createAnnotations } from '@shared/student/annotations.js';
import { createAudio } from '@shared/student/audio.js';
import { createI18n } from './i18n.js';
import { buildUI, ICONS } from './ui.js';
import { createTour } from './tour.js';
import { createPractice } from './practice.js';
import { createQuiz, QUIZ_KINDS } from './quiz.js';
import { createCoach } from './coach.js';
import { measure, format, formatSigned, roundTo, LEAST_COUNTS } from './reading.js';

export const VERSION = '0.3.6';

/** Wait (briefly) for the Bangla webfont, so the numbers engraved on the scales are drawn with it. */
export function loadFonts(timeout = 2500) {
  if (!document.fonts?.load) return Promise.resolve();
  const loads = ['400', '500', '600', '700'].map((w) => document.fonts.load(`${w} 24px "Noto Sans Bengali"`, 'অআ০১২৩ab12')); // check:allow-bangla font sample, not shown
  return Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, timeout))]).catch(() => {});
}

export const DEFAULTS = {
  lc: 0.1, // 0.1 | 0.05 | 0.02 mm
  zeroError: 0, // mm, multiple of lc
  value: 24.6, // starting jaw gap (mm)
  unit: 'mm', // 'mm' | 'cm'
  view: 'front', // 'front' | '3d'
  specimen: null, // 'sphere' | 'cylinder' | 'block' | 'ring' | 'bore'
  size: null, // specimen size (mm); default per specimen
  magnifier: true,
  guides: true,
  labels: false,
  locked: false,
  sound: true,
  hideReading: false,
  theme: 'light', // 'light' | 'dark' | 'transparent'
  ui: 'simple', // 'simple' (student view: reading + quiz) | 'full' (all tools, tour, typed practice) | 'compact' | 'none'
  lang: 'bn', // 'bn' | 'en'
  numerals: null, // 'bn' | 'latin' (default follows lang); also used for the numbers engraved on the scales
  shadow: true, // soft shadow behind the caliper (light theme)
  strings: {},
  mode: 'explore', // 'explore' | 'quiz' (simple ui) | 'tour' | 'practice' (full ui)
  practiceZeroError: false,
  coach: true, // student view: pointers that show the jaw and the magnifier can be moved
};

const VIEW_DIRS = {
  front: new THREE.Vector3(0, 0, 1),
  '3d': new THREE.Vector3(0.5, 0.42, 1).normalize(),
};

export function createVernierApp(root, userOptions = {}) {
  const o = { ...DEFAULTS, ...userOptions };
  if (!LEAST_COUNTS.includes(o.lc)) o.lc = DEFAULTS.lc;
  const t = createI18n(o.lang, o.strings, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc');
  root.dataset.theme = o.theme;
  root.dataset.ui = o.ui === 'simple' ? 'simple' : 'full';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildUI(root, t, { ui: o.ui, kinds: SPECIMEN_KINDS });

  const stage = createStage(ui.canvasHost, { fov: 24, near: 2, far: 8000, environment: 'studio' });
  const { camera, controls, scene } = stage;
  // Use the stage's fallback colour when a magnifier looks outside the scene.
  const stageBackground = getComputedStyle(root).getPropertyValue('--stage-background').trim() || '#ffffff';
  controls.zoomToCursor = true;
  controls.rotateSpeed = 0.6; // a one-finger swipe on a phone should turn it, not spin it
  controls.minDistance = 18;
  controls.maxDistance = 1800;

  const M = createMaterials(stage.renderer);
  const presentation = createPresentation(stage, M, o);
  const caliper = createCaliper({
    materials: M,
    lc: o.lc,
    zeroError: 0,
    text: { digits: N, cm: t('eng_cm'), mm: t('unit_mm'), brand: t('eng_brand'), range: t('eng_range') },
  });
  scene.add(caliper.root);

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  const annotations = createAnnotations({ stage, layer: ui.annoLayer });
  const loupe = createLoupe({
    stage,
    layer: ui.lensLayer,
    clearColor: o.theme === 'dark' ? 0x10151d : new THREE.Color(stageBackground).getHex(),
    formatZoom: (z) => `${N(z)}×`,
    onDragStart: () => coach?.lensUsed(),
  });

  const castShadows = (obj) =>
    obj.traverse((m) => {
      if (m.isMesh && !m.isInstancedMesh && !m.material.transparent) m.castShadow = true;
    });
  castShadows(caliper.root);

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
    for (const fn of listeners.get('*') || []) fn(payload, type);
  }

  const s = {
    gap: 0,
    lc: o.lc,
    zeroError: 0,
    unit: o.unit === 'cm' ? 'cm' : 'mm',
    view: o.view === '3d' ? '3d' : 'front',
    magnifier: !!o.magnifier,
    guides: !!o.guides,
    labels: !!o.labels,
    locked: false,
    sound: !!o.sound,
    hidden: !!o.hideReading,
    specimen: null,
    mode: 'explore',
    dragging: false,
    contact: false,
    userMovedCamera: false,
  };
  let highlightOverride = null; // function(reading) → spec, used by the tour/practice

  const reading = () => measure(s.gap, s.lc, s.zeroError);

  // ── reading + highlights ─────────────────────────────────────────────────────
  let lastKey = '';
  let emitTimer = 0;
  let lastEmit = 0;
  function snapshot(r = reading()) {
    return {
      value: s.zeroError ? r.corrected : r.observed,
      observed: r.observed,
      corrected: r.corrected,
      msr: r.msr,
      vsr: r.vsr,
      numeral: r.numeral,
      lc: s.lc,
      divisions: r.n,
      zeroError: s.zeroError,
      unit: 'mm',
      gap: +s.gap.toFixed(4),
      contact: s.contact,
      locked: s.locked,
      specimen: s.specimen ? { kind: s.specimen.kind, mode: s.specimen.mode, size: s.specimen.size } : null,
      mode: s.mode,
    };
  }

  function queueChange(force = false) {
    const snap = snapshot();
    const key = `${snap.observed}|${snap.zeroError}|${snap.lc}|${snap.contact}|${snap.locked}|${snap.specimen?.kind}`;
    if (key === lastKey && !force) return;
    lastKey = key;
    clearTimeout(emitTimer);
    const wait = Math.max(0, 100 - (performance.now() - lastEmit));
    emitTimer = setTimeout(() => {
      lastEmit = performance.now();
      emit('change', snapshot());
    }, wait);
  }

  function applyHighlights(r) {
    const spec = highlightOverride ? highlightOverride(r) : null;
    if (spec) return caliper.highlight(spec);
    if (!s.guides) return caliper.clearHighlights();
    caliper.highlight({ msr: r.msr, zero: true, coincide: { main: r.coincideMain, vernier: r.vsr } });
  }

  const $ = ui.$;
  const dockEls = {
    title: $('.pvc-ro-title'),
    value: $('.pvc-ro-value .v'),
    unit: $('.pvc-ro-value .u'),
    status: $('.pvc-ro-status span'),
    statusDot: $('.pvc-ro-status'),
    msr: $('.pvc-term.msr .v'),
    msrU: $('.pvc-term.msr .u'),
    vsr: $('.pvc-term.vsr .v'),
    vsrU: $('.pvc-term.vsr .u'),
    lc: $('.pvc-term.lc .v'),
    lcU: $('.pvc-term.lc .u'),
    ze: $('.pvc-term.ze .v'),
    zeU: $('.pvc-term.ze .u'),
    work: $('.pvc-work'),
  };

  function status() {
    if (s.locked) return { text: t(s.mode === 'quiz' ? 'q_status' : 'status_locked'), tone: 'locked' };
    if (s.contact && s.specimen) return { text: t('status_contact', { object: t(`sp_${s.specimen.kind}`) }), tone: 'contact' };
    if (s.gap < 1e-6) return { text: t('status_closed'), tone: 'idle' };
    return { text: t('status_free'), tone: 'idle' };
  }

  // Student view: the reading, and the same number written as M + V × VC with each part named.
  const learnEls = ui.simple && {
    key: $('.pvc-result .k'),
    value: $('.pvc-result .v'),
    unit: $('.pvc-result .u'),
    msr: $('.pvc-t.msr b'),
    vsr: $('.pvc-t.vsr b'),
    lc: $('.pvc-t.lc b'),
    ze: $('.pvc-t.ze b'),
    status: $('.pvc-status span'),
    statusDot: $('.pvc-status'),
    object: $('[data-act="object"] span'),
  };

  function updateLearn(r) {
    const u = s.unit;
    const shown = s.zeroError ? r.corrected : r.observed;
    learnEls.key.textContent = s.zeroError ? t('corrected') : t('reading');
    learnEls.value.textContent = N(format(shown, s.lc, u));
    learnEls.unit.textContent = t.unit(u);
    learnEls.msr.textContent = N(u === 'cm' ? (r.msr / 10).toFixed(1) : String(r.msr));
    learnEls.vsr.textContent = N(r.vsr);
    learnEls.lc.textContent = N(u === 'cm' ? String(+(s.lc / 10).toFixed(4)) : String(s.lc));
    learnEls.ze.textContent = `(${N(formatSigned(s.zeroError, s.lc, u))})`;
    ui.learn.classList.toggle('has-ze', !!s.zeroError);
    const st = status();
    learnEls.status.textContent = st.text;
    learnEls.statusDot.dataset.tone = st.tone;
  }

  function updateDock(r) {
    if (ui.simple) return updateLearn(r);
    const u = s.unit;
    const U = t.unit(u);
    const shown = s.zeroError ? r.corrected : r.observed;
    dockEls.title.textContent = s.zeroError ? t('corrected') : t('reading');
    dockEls.value.textContent = N(format(shown, s.lc, u));
    dockEls.unit.textContent = U;
    const msrText = N(u === 'cm' ? (r.msr / 10).toFixed(1) : String(r.msr));
    const lcText = N(u === 'cm' ? String(+(s.lc / 10).toFixed(4)) : String(s.lc));
    const zeText = N(formatSigned(s.zeroError, s.lc, u));
    dockEls.msr.textContent = msrText;
    dockEls.msrU.textContent = U;
    dockEls.vsr.textContent = N(r.vsr);
    dockEls.vsrU.textContent = r.n === 10 ? '' : t('numeral', { n: r.numeral });
    dockEls.lc.textContent = lcText;
    dockEls.lcU.textContent = U;
    dockEls.ze.textContent = zeText;
    dockEls.zeU.textContent = U;
    ui.read.classList.toggle('has-ze', !!s.zeroError);
    const total = `${N(format(r.observed, s.lc, u))}`;
    const lines = [
      `<div class="w-f">${t('formula')}</div>`,
      `<div>= <b class="c-msr">${msrText}</b> + <b class="c-vsr">${N(r.vsr)}</b> × <b class="c-lc">${lcText}</b></div>`,
    ];
    if (s.zeroError) {
      lines.push(`<div>= ${total} ${U}</div>`);
      lines.push(`<div class="w-f">${t('formula_ze')}</div>`);
      lines.push(`<div>= ${total} − (<b class="c-ze">${zeText}</b>) = <b class="c-total">${N(format(shown, s.lc, u))} ${U}</b></div>`);
    } else {
      lines.push(`<div>= <b class="c-total">${total} ${U}</b></div>`);
    }
    dockEls.work.innerHTML = lines.join('');

    const st = status();
    dockEls.status.textContent = st.text;
    dockEls.statusDot.dataset.tone = st.tone;
  }

  function refresh() {
    const r = reading();
    applyHighlights(r);
    updateDock(r);
    tour?.onReading(r);
    queueChange();
    stage.invalidate();
  }

  // ── jaw gap ──────────────────────────────────────────────────────────────────
  const limits = () => gapLimits(s.specimen);

  function setGap(g) {
    const [lo, hi] = limits();
    const v = THREE.MathUtils.clamp(g, lo, hi);
    const prev = s.gap;
    let contact = false;
    if (s.specimen) {
      const bound = s.specimen.mode === 'outside' ? lo : hi;
      contact = Math.abs(v - bound) < 1e-6;
      if (contact && !s.contact && Math.abs(prev - v) > 1e-6) onContact();
    }
    s.contact = contact;
    if (s.dragging && Math.floor(prev) !== Math.floor(v)) audio.tick();
    s.gap = v;
    caliper.setGap(v);
    refresh();
  }

  function animateGap(target, duration = 0.6, fn = ease.inOutCubic) {
    const g0 = s.gap;
    if (Math.abs(target - g0) < 1e-6) return Promise.resolve(true);
    return tweener.animate({ key: 'gap', duration, ease: fn, onUpdate: (k) => setGap(g0 + (target - g0) * k) }).finished;
  }

  function snapGap() {
    const [lo, hi] = limits();
    const target = THREE.MathUtils.clamp(roundTo(s.gap, s.lc), lo, hi);
    return animateGap(target, 0.14, ease.outCubic);
  }

  function stepGap(dir, big = false) {
    if (s.locked) return lockedNudge();
    coach?.objectUsed();
    coach?.objectReleased();
    tweener.cancel('gap');
    const step = big ? 1 : s.lc;
    setGap(roundTo(roundTo(s.gap, s.lc) + dir * step, s.lc));
    queueChange(true);
  }

  function onContact() {
    audio.contact();
    if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.(12);
    const sp = s.specimen;
    tweener.animate({
      key: 'glow',
      duration: 0.7,
      ease: ease.linear,
      onUpdate: (_k, p) => sp?.setGlow(Math.sin(Math.PI * Math.min(1, p * 1.2))),
      onComplete: () => sp?.setGlow(0),
    });
    if (s.mode === 'explore') showHint(t('hint_contact'), { duration: 2600 });
  }

  // ── lock ─────────────────────────────────────────────────────────────────────
  function setLocked(on, { sound = true } = {}) {
    s.locked = !!on;
    const a0 = caliper.state.lockAngle;
    const a1 = s.locked ? -Math.PI * 1.25 : 0;
    tweener.animate({ key: 'lock', duration: 0.45, ease: ease.outCubic, onUpdate: (k) => caliper.setLockAngle(a0 + (a1 - a0) * k) });
    if (sound) audio.lock(s.locked);
    syncUI();
    refresh();
  }

  function lockedNudge() {
    showHint(t(s.mode === 'quiz' ? 'q_locked' : 'hint_locked'), { duration: 3200 });
    audio.error();
    const a = caliper.state.lockAngle;
    tweener.animate({
      key: 'lock',
      duration: 0.4,
      ease: ease.linear,
      onUpdate: (_k, p) => caliper.setLockAngle(a + Math.sin(p * Math.PI * 4) * 0.12 * (1 - p)),
    });
  }

  // ── camera ───────────────────────────────────────────────────────────────────
  function frameBounds() {
    let x0 = DIM.beamStart - 3;
    let x1 = Math.max(DIM.beamEnd + 3, DIM.beamEnd + s.gap + 2);
    let y0 = DIM.jawTip - 3;
    const y1 = 39;
    if (s.specimen?.mode === 'depth') x1 = Math.max(x1, DIM.beamEnd + s.specimen.size + 13);
    // In tall or small frames (phones, side columns) frame the jaws and the scales being read, not the whole beam.
    else if (camera.aspect < 1.25 || stage.width < 560) {
      x0 = -24; // crops the end of the beam head, keeps the fixed jaw
      x1 = Math.min(x1, Math.max(s.gap + 66, 92));
    }
    if (s.specimen?.mode === 'outside') y0 = Math.min(y0, -24 - s.specimen.size / 2 - 3);
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
  }

  function fitDistance(w, h) {
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    // leave room for the top bar and the floating buttons
    const usableH = Math.max(0.5, 1 - 70 / Math.max(stage.height, 200));
    return Math.max(h / 2 / Math.tan(vfov / 2) / usableH, w / 2 / Math.tan(hfov / 2)) * 1.05;
  }

  function viewPose(view) {
    const b = frameBounds();
    const target = new THREE.Vector3(b.cx, b.cy, 0);
    const d = fitDistance(b.w, b.h) * (view === '3d' ? 0.95 : 1);
    return { target, position: target.clone().addScaledVector(VIEW_DIRS[view], d) };
  }

  const sph0 = new THREE.Spherical();
  const sph1 = new THREE.Spherical();
  const off = new THREE.Vector3();
  function flyTo({ position, target }, duration = 0.9) {
    tweener.cancel('camera');
    if (!duration) {
      camera.position.copy(position);
      controls.target.copy(target);
      controls.update();
      stage.invalidate();
      return Promise.resolve(true);
    }
    const t0 = controls.target.clone();
    sph0.setFromVector3(off.copy(camera.position).sub(t0));
    sph1.setFromVector3(off.copy(position).sub(target));
    let dTheta = sph1.theta - sph0.theta;
    if (dTheta > Math.PI) dTheta -= Math.PI * 2;
    if (dTheta < -Math.PI) dTheta += Math.PI * 2;
    const a = { r: sph0.radius, phi: sph0.phi, theta: sph0.theta };
    const tgt = new THREE.Vector3();
    const sp = new THREE.Spherical();
    return tweener.animate({
      key: 'camera',
      duration,
      ease: ease.inOutCubic,
      onUpdate: (k) => {
        tgt.lerpVectors(t0, target, k);
        // interpolate distance in log space so zooming feels even
        sp.set(Math.exp(Math.log(a.r) + (Math.log(sph1.radius) - Math.log(a.r)) * k), a.phi + (sph1.phi - a.phi) * k, a.theta + dTheta * k);
        controls.target.copy(tgt);
        camera.position.setFromSpherical(sp).add(tgt);
        camera.lookAt(tgt);
        stage.invalidate();
      },
    }).finished;
  }

  function applyControls() {
    if (s.view === 'front') {
      controls.enableRotate = false;
      controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
      controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
    } else {
      controls.enableRotate = true;
      controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
      controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    }
  }

  function setView(view, { animate = true } = {}) {
    s.view = view === '3d' ? '3d' : 'front';
    applyControls();
    if (ui.simple) loupe.setFollow(true); // the view buttons also bring a moved magnifier back to the reading
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(viewPose(s.view), animate ? 0.9 : 0);
  }

  /** Fly to look at a caliper-space point from `distance` mm, keeping the current viewing direction. */
  function focusOn(point, distance, { duration = 0.9, dir } = {}) {
    const d = dir || (s.view === 'front' ? VIEW_DIRS.front : off.copy(camera.position).sub(controls.target).normalize().clone());
    return flyTo({ target: point.clone(), position: point.clone().addScaledVector(d, distance) }, duration);
  }

  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  controls.addEventListener('change', () => {
    const dist = camera.position.distanceTo(controls.target);
    const near = THREE.MathUtils.clamp(dist * 0.04, 0.4, 20);
    if (Math.abs(near - camera.near) / camera.near > 0.15) {
      camera.near = near;
      camera.updateProjectionMatrix();
    }
  });
  stage.onResize(() => {
    if (!s.userMovedCamera && !tweener.busy) flyTo(viewPose(s.view), 0);
  });

  // ── picking + dragging ───────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitPoint = new THREE.Vector3();
  const pickTargets = [caliper.slider, caliper.fixed];

  function canvasPoint(e) {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function setRay(p, viaLens) {
    if (viaLens) {
      loupe.toNDC(p.x, p.y, ndc);
      raycaster.setFromCamera(ndc, loupe.camera);
    } else {
      ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
    }
    return raycaster.ray;
  }
  function pick(p) {
    const viaLens = loupe.contains(p.x, p.y);
    setRay(p, viaLens);
    const hits = raycaster.intersectObjects(pickTargets, true);
    const h = hits.find((x) => x.object.visible && !x.object.userData.keep);
    if (!h) return null;
    let kind = 'fixed';
    for (let ob = h.object; ob; ob = ob.parent) {
      if (ob === caliper.lock) {
        kind = 'lock';
        break;
      }
      if (ob === caliper.slider) {
        kind = 'slider';
        break;
      }
    }
    return { kind, point: h.point.clone(), viaLens };
  }

  let drag = null;
  let pressLock = null;
  let hover = null;

  // Fingers are wide: a touch that lands just off the jaw still takes it. The offset is kept for the
  // whole drag, so the jaw moves exactly with the finger and does not jump.
  function nearbySlider(p) {
    for (const r of [8, 16]) {
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const q = { x: p.x + r * Math.cos(a), y: p.y + r * Math.sin(a) };
        const h = pick(q);
        if (h?.kind === 'slider') return { hit: h, offset: { x: q.x - p.x, y: q.y - p.y } };
      }
    }
    return null;
  }

  function setHover(kind) {
    if (hover === kind) return;
    hover = kind;
    const glow = kind === 'slider' && !s.locked;
    M.sliderSteel.emissive.setHex(glow ? 0x0b1622 : 0x000000);
    M.satinSlider.emissive?.setHex(glow ? 0x0b1622 : 0x000000);
    ui.canvasHost.style.cursor = kind === 'lock' ? 'pointer' : kind === 'slider' ? (s.locked ? 'not-allowed' : 'grab') : '';
    stage.invalidate();
  }

  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      root.focus({ preventScroll: true });
      closePopovers();
      coach?.interrupt();
      if (drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const p = canvasPoint(e);
      let hit = pick(p);
      let offset = { x: 0, y: 0 };
      if ((!hit || hit.kind === 'fixed') && e.pointerType !== 'mouse') {
        const near = nearbySlider(p);
        if (near) ({ hit, offset } = near);
      }
      if (!hit || hit.kind === 'fixed') return; // let the orbit controls have it
      e.stopPropagation();
      e.preventDefault();
      if (hit.kind === 'lock') {
        pressLock = { id: e.pointerId, x: e.clientX, y: e.clientY };
        ui.canvasHost.setPointerCapture(e.pointerId);
        return;
      }
      if (s.locked) return lockedNudge();
      const camPos = hit.viaLens ? loupe.camera.position : camera.position;
      const n = camPos.clone().sub(hit.point).normalize();
      n.x = 0;
      if (n.lengthSq() < 1e-4) n.set(0, 0, 1);
      n.normalize();
      drag = {
        id: e.pointerId,
        plane: new THREE.Plane().setFromNormalAndCoplanarPoint(n, hit.point),
        startX: hit.point.x,
        startGap: s.gap,
        viaLens: hit.viaLens,
        ox: offset.x,
        oy: offset.y,
      };
      tweener.cancel('gap');
      s.dragging = true;
      loupe.setFrozen(true);
      ui.canvasHost.setPointerCapture(e.pointerId);
      ui.canvasHost.style.cursor = 'grabbing';
      hideHint();
      coach?.objectUsed();
      emit('dragstart', snapshot());
    },
    true,
  );

  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (drag && e.pointerId === drag.id) {
      const q = canvasPoint(e);
      const ray = setRay({ x: q.x + drag.ox, y: q.y + drag.oy }, drag.viaLens);
      if (ray.intersectPlane(drag.plane, hitPoint)) setGap(drag.startGap + (hitPoint.x - drag.startX));
      return;
    }
    if (e.pointerType !== 'mouse' || e.buttons || hoverQueued) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
      setHover(pick(p)?.kind || null);
    });
  });

  function endPointer(e) {
    if (pressLock && e.pointerId === pressLock.id) {
      if (Math.hypot(e.clientX - pressLock.x, e.clientY - pressLock.y) < 8 && e.type === 'pointerup') {
        if (s.mode === 'quiz' && !quiz.revealed) lockedNudge();
        else setLocked(!s.locked);
      }
      pressLock = null;
      return;
    }
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    s.dragging = false;
    loupe.setFrozen(false);
    ui.canvasHost.style.cursor = hover === 'slider' ? 'grab' : '';
    snapGap().then(() => {
      queueChange(true);
      emit('dragend', snapshot());
      coach?.objectReleased();
    });
  }
  ui.canvasHost.addEventListener('pointerup', endPointer);
  ui.canvasHost.addEventListener('pointercancel', endPointer);
  ui.canvasHost.addEventListener('pointerleave', () => !drag && setHover(null));

  let wheelAcc = 0;
  ui.canvasHost.addEventListener(
    'wheel',
    (e) => {
      const p = canvasPoint(e);
      const hit = pick(p);
      const overLens = loupe.contains(p.x, p.y);
      if (hit?.kind === 'slider' || hit?.kind === 'lock') {
        e.preventDefault();
        e.stopPropagation();
        wheelAcc += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
        if (Math.abs(wheelAcc) >= 40) {
          stepGap(wheelAcc < 0 ? 1 : -1, e.shiftKey);
          wheelAcc = 0;
        }
      } else if (overLens) {
        e.preventDefault();
        e.stopPropagation();
        loupe.setZoom(loupe.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
      }
    },
    { capture: true, passive: false },
  );

  ui.canvasHost.addEventListener('dblclick', (e) => {
    const hit = pick(canvasPoint(e));
    if (!hit) return setView(s.view);
    const d = camera.position.distanceTo(controls.target);
    focusOn(hit.point, Math.max(controls.minDistance, d * 0.35), { duration: 0.7 });
  });

  // ── specimens ────────────────────────────────────────────────────────────────
  let specimenToken = 0;
  async function setSpecimen(kind, { size, animate = true, autoContact = false, hint = true } = {}) {
    const token = ++specimenToken;
    const prevMode = s.specimen?.mode;
    tweener.cancel('specimen');
    if (s.specimen) {
      const old = s.specimen;
      s.specimen = null;
      s.contact = false;
      const offv = entryOffset(old.kind);
      if (animate) {
        tweener.animate({
          key: `out-${old.kind}-${token}`,
          duration: 0.45,
          ease: ease.inOutCubic,
          onUpdate: (k) => {
            old.group.position.copy(old.rest).addScaledVector(offv, k);
            old.setOpacity(1 - k);
          },
          onComplete: () => {
            caliper.root.remove(old.group);
            old.dispose();
          },
        });
      } else {
        caliper.root.remove(old.group);
        old.dispose();
      }
    }
    syncSpecimenTray(kind || 'none');
    if (!kind || kind === 'none' || !SPECIMENS[kind]) {
      refresh();
      if (prevMode === 'depth' && !s.userMovedCamera) setView(s.view);
      emit('specimen', null);
      return;
    }

    const def = SPECIMENS[kind];
    const sz = THREE.MathUtils.clamp(+(size ?? def.size) || def.size, def.min, def.max);
    if (s.locked) setLocked(false);

    // Make room first, so the object never intersects the jaws.
    const prep =
      def.mode === 'outside'
        ? s.gap < sz + 6
          ? Math.min(DIM.maxGap, sz + 12)
          : null
        : s.gap > sz - 3
          ? Math.max(0, def.mode === 'depth' ? 0 : sz - 9)
          : null;
    if (prep != null) {
      if (animate) await animateGap(prep, 0.55);
      else setGap(prep);
    }
    if (token !== specimenToken) return;

    const sp = createSpecimen(kind, sz, M);
    castShadows(sp.group);
    caliper.root.add(sp.group);
    s.specimen = sp;
    if (animate) {
      const offv = entryOffset(kind);
      sp.setOpacity(0);
      audio.pop();
      await tweener.animate({
        key: 'specimen',
        duration: 0.7,
        ease: ease.outCubic,
        onUpdate: (k) => {
          sp.group.position.copy(sp.rest).addScaledVector(offv, 1 - k);
          sp.setOpacity(k);
        },
      }).finished;
      if (token !== specimenToken) return;
    }
    sp.group.position.copy(sp.rest);
    sp.setOpacity(1);
    if ((def.mode === 'depth' || prevMode === 'depth') && !s.userMovedCamera) setView(s.view);
    refresh();
    emit('specimen', { kind, mode: def.mode, size: sz });

    if (autoContact) await closeOnSpecimen();
    else if (hint && s.mode === 'explore') {
      const key = def.mode === 'outside' ? 'hint_close' : def.mode === 'inside' ? 'hint_open' : 'hint_depth';
      showHint(t(key, { object: t(`sp_${kind}`) }), { action: t('do_it'), onAction: closeOnSpecimen, duration: 7000 });
    }
  }

  function closeOnSpecimen() {
    if (!s.specimen) return Promise.resolve(false);
    if (s.locked) setLocked(false);
    const [lo, hi] = limits();
    const target = s.specimen.mode === 'outside' ? lo : hi;
    hideHint();
    return animateGap(target, 0.5 + Math.min(0.7, Math.abs(target - s.gap) / 40), ease.inOutCubic);
  }

  // ── settings ─────────────────────────────────────────────────────────────────
  function setLeastCount(lc) {
    lc = +lc;
    if (!LEAST_COUNTS.includes(lc) || lc === s.lc) return;
    s.lc = lc;
    caliper.setLeastCount(lc);
    s.zeroError = roundTo(s.zeroError, lc);
    caliper.setZeroError(s.zeroError);
    syncUI();
    refresh();
    snapGap();
    emit('settings', settings());
  }

  function setZeroError(ze, { demo = true } = {}) {
    const v = THREE.MathUtils.clamp(roundTo(+ze || 0, s.lc), -1, 1);
    s.zeroError = Math.abs(v) < 1e-9 ? 0 : v;
    caliper.setZeroError(s.zeroError);
    syncUI();
    refresh();
    if (demo && s.mode === 'explore' && !s.specimen && s.zeroError) {
      if (s.locked) setLocked(false, { sound: false });
      animateGap(0, 0.5);
      showHint(`${t('zero_error')}: <b>${N(formatSigned(s.zeroError, s.lc, s.unit))} ${t.unit(s.unit)}</b>`, { duration: 3000 });
    }
    emit('settings', settings());
  }

  function setUnit(u) {
    s.unit = u === 'cm' ? 'cm' : 'mm';
    const practiceUnit = ui.$('.pvc-p-input .u');
    if (practiceUnit) practiceUnit.textContent = t.unit(s.unit);
    syncUI();
    refresh();
  }

  function setGuides(on) {
    s.guides = !!on;
    syncUI();
    refresh();
  }

  function setMagnifier(on) {
    s.magnifier = !!on;
    loupe.setVisible(s.magnifier);
    syncUI();
  }

  function setHidden(on) {
    s.hidden = !!on;
    ui.read?.classList.toggle('is-hidden', s.hidden);
    syncUI();
  }

  function showParts(on) {
    s.labels = !!on;
    annotations.clear('part');
    if (s.labels) {
      const P = caliper.points;
      annotations.add('main', { text: t('part_main'), point: P.mainScale, dx: 0, dy: -70 });
      annotations.add('vernier', { text: t('part_vernier'), point: P.vernierScale, dx: 30, dy: 74 });
      annotations.add('outside', { text: t('part_outside'), point: P.outsideJaws, dx: -64, dy: 24 });
      annotations.add('inside', { text: t('part_inside'), point: P.insideJaws, dx: -56, dy: -34 });
      annotations.add('depth', { text: t('part_depth'), point: P.depthRod, dx: 6, dy: 56 });
      annotations.add('lock', { text: t('part_lock'), point: P.lockScrew, dx: 34, dy: -40 });
      annotations.add('roller', { text: t('part_roller'), point: P.roller, dx: 26, dy: 50 });
    }
    syncUI();
  }

  function setSound(on) {
    s.sound = !!on;
    audio.setEnabled(s.sound);
    syncUI();
  }

  const settings = () => ({
    lc: s.lc,
    zeroError: s.zeroError,
    unit: s.unit,
    view: s.view,
    guides: s.guides,
    magnifier: s.magnifier,
    labels: s.labels,
    locked: s.locked,
  });

  // ── hint toast ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  let hintAction = null;
  function showHint(html, { action, onAction, duration = 4000 } = {}) {
    ui.hintText.innerHTML = html;
    hintAction = onAction || null;
    ui.hintAct.hidden = !action;
    if (action) ui.hintAct.textContent = action;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    if (duration) hintTimer = setTimeout(hideHint, duration);
  }
  function hideHint() {
    clearTimeout(hintTimer);
    ui.hint.classList.remove('show');
  }
  ui.hintAct.addEventListener('click', () => {
    const fn = hintAction;
    hideHint();
    fn?.();
  });

  // ── popovers + buttons ───────────────────────────────────────────────────────
  function closePopovers(except) {
    for (const p of ui.$$('[data-popover]')) if (p.dataset.popover !== except) p.hidden = true;
    for (const b of ui.$$('[data-pop]')) b.classList.toggle('open', b.dataset.pop === except && !ui.$(`[data-popover="${except}"]`).hidden);
  }
  function togglePopover(name) {
    const pop = ui.$(`[data-popover="${name}"]`);
    const open = pop.hidden;
    closePopovers();
    pop.hidden = !open;
    ui.$(`[data-pop="${name}"]`).classList.toggle('open', open);
  }
  function syncSpecimenTray(kind) {
    for (const b of ui.$$('[data-specimen]')) b.classList.toggle('on', b.dataset.specimen === kind);
    if (learnEls) learnEls.object.textContent = t(kind && kind !== 'none' ? 'obj_remove' : 'obj_add');
  }

  // Student view: one button puts the next object between the jaws, or takes it away.
  let objectTurn = 0;
  function toggleObject() {
    if (s.specimen) return setSpecimen(null);
    const kind = QUIZ_KINDS[objectTurn++ % QUIZ_KINDS.length];
    return setSpecimen(kind, { autoContact: true, hint: false });
  }

  function setMode(mode) {
    if (mode === 'quiz') {
      if (s.mode !== 'quiz') quiz.start();
    } else quiz.stop();
  }

  function toggle(name) {
    if (name === 'magnifier') setMagnifier(!s.magnifier);
    if (name === 'guides') setGuides(!s.guides);
    if (name === 'labels') showParts(!s.labels);
    if (name === 'locked') setLocked(!s.locked);
    if (name === 'sound') setSound(!s.sound);
    if (name === 'hidden') setHidden(!s.hidden);
  }

  function syncUI() {
    for (const b of ui.$$('[data-view]')) b.classList.toggle('on', b.dataset.view === s.view);
    const flags = { magnifier: s.magnifier, guides: s.guides, labels: s.labels, locked: s.locked, sound: s.sound, hidden: s.hidden };
    for (const b of ui.$$('[data-toggle]')) {
      const on = !!flags[b.dataset.toggle];
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    }
    if (ui.simple) {
      const quizOn = s.mode === 'quiz';
      root.dataset.mode = quizOn ? 'quiz' : 'explore';
      for (const b of ui.$$('[data-mode]')) {
        const on = b.dataset.mode === root.dataset.mode;
        b.classList.toggle('on', on);
        b.setAttribute('aria-selected', String(on));
      }
      ui.learn.inert = quizOn;
      ui.quiz.inert = !quizOn;
    } else {
      const lockBtn = ui.$('[data-toggle="locked"]');
      lockBtn.querySelector('.ic-lock').innerHTML = s.locked ? ICONS.lock : ICONS.unlock;
      lockBtn.querySelector('span').textContent = s.locked ? t('locked') : t('lock');
      const hideBtn = ui.$('[data-toggle="hidden"]');
      hideBtn.innerHTML = s.hidden ? ICONS.eyeOff : ICONS.eye;
      hideBtn.title = s.hidden ? t('show_reading') : t('hide_reading');
      ui.$('.pvc-lc-badge').textContent = `${t('lc')} = ${N(s.unit === 'cm' ? +(s.lc / 10).toFixed(4) : s.lc)} ${t.unit(s.unit)}`;
      for (const b of ui.$$('[data-set="lc"] button')) b.classList.toggle('on', +b.dataset.v === s.lc);
      for (const b of ui.$$('[data-set="unit"] button')) b.classList.toggle('on', b.dataset.v === s.unit);
      ui.$('.pvc-ze-value').textContent = s.zeroError ? `${N(formatSigned(s.zeroError, s.lc, 'mm'))} ${t('unit_mm')}` : t('none');
    }
    coach?.setMode(s.mode);
    root.classList.toggle('is-practice', s.mode === 'practice');
    root.classList.toggle('is-tour', s.mode === 'tour');
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !root.contains(b) || b.closest('.pvc-lens')) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode) setMode(b.dataset.mode);
    if (b.dataset.q != null) quiz.choose(+b.dataset.q);
    if (b.dataset.toggle) toggle(b.dataset.toggle);
    if (b.dataset.pop) togglePopover(b.dataset.pop);
    if (b.dataset.specimen) {
      closePopovers();
      if (s.mode === 'practice') practice.stop();
      setSpecimen(b.dataset.specimen === 'none' ? null : b.dataset.specimen);
    }
    const set = b.closest('[data-set]')?.dataset.set;
    if (set === 'lc') setLeastCount(+b.dataset.v);
    if (set === 'unit') setUnit(b.dataset.v);
    switch (b.dataset.act) {
      case 'cycle-lc':
        setLeastCount(LEAST_COUNTS[(LEAST_COUNTS.indexOf(s.lc) + 1) % LEAST_COUNTS.length]);
        break;
      case 'ze-':
        setZeroError(s.zeroError - s.lc);
        break;
      case 'ze+':
        setZeroError(s.zeroError + s.lc);
        break;
      case 'reset':
        closePopovers();
        reset();
        break;
      case 'fullscreen':
        closePopovers();
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.().catch(() => {});
        break;
      case 'object':
        toggleObject();
        break;
      case 'q-next':
        quiz.next();
        break;
      case 'q-again':
        quiz.start();
        break;
      case 'tour':
        tour.start();
        break;
      case 'practice':
        if (s.mode === 'tour') tour.stop();
        practice.start();
        break;
      default:
        if (b.dataset.act?.startsWith('tour-')) tour.handle(b.dataset.act);
        if (b.dataset.act?.startsWith('p-')) practice.handle(b.dataset.act);
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest?.('.pvc-pop-wrap')) closePopovers();
  });

  root.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    let handled = true;
    if (k === 'ArrowRight' || k === 'ArrowUp') stepGap(1, e.shiftKey);
    else if (k === 'ArrowLeft' || k === 'ArrowDown') stepGap(-1, e.shiftKey);
    else if (k === 'PageUp') stepGap(10, true);
    else if (k === 'PageDown') stepGap(-10, true);
    else if (k === 'Home') !s.locked && animateGap(limits()[0], 0.5);
    else if (k === 'End') !s.locked && animateGap(limits()[1], 0.8);
    else if (k === 'm' || k === 'M') toggle('magnifier');
    else if (k === 'g' || k === 'G') toggle('guides');
    else if (k === 'p' || k === 'P') toggle('labels');
    else if (k === 'l' || k === 'L') toggle('locked');
    else if (k === 'h' || k === 'H') toggle('hidden');
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === '3' || k === 'v' || k === 'V') setView('3d');
    else if (k === 'r' || k === 'R') setView(s.view);
    else if (k === 'Escape') {
      closePopovers();
      if (s.mode === 'tour') tour.stop();
    } else handled = false;
    if (handled) e.preventDefault();
  });

  // ── reset / export ───────────────────────────────────────────────────────────
  async function reset() {
    if (s.mode === 'tour') tour.stop();
    if (s.mode === 'practice') practice.stop();
    if (s.mode === 'quiz') quiz.stop();
    highlightOverride = null;
    if (s.locked) setLocked(false, { sound: false });
    await setSpecimen(null);
    setZeroError(0, { demo: false });
    setGuides(true);
    showParts(false);
    setMagnifier(true);
    loupe.setFollow(true);
    setView('front');
    animateGap(o.value, 0.6);
  }

  /** The caliper as a GLB, in metres; marks kept only for the screen (userData.keep) are left out. */
  function exportGLB() {
    return exportFigureGLB(caliper.root, {
      units: 'mm',
      name: 'vernier-caliper',
      skip: (ob) => ob.userData.keep,
      extras: { pathshala: { id: 'vernier-caliper', version: VERSION } },
    });
  }

  // ── tour + practice (need the internals above) ───────────────────────────────
  const ctx = {
    t,
    s,
    ui,
    caliper,
    annotations,
    tweener,
    audio,
    loupe,
    reading,
    setGap,
    animateGap,
    setSpecimen,
    closeOnSpecimen,
    setLocked,
    setGuides,
    setMagnifier,
    setZeroError,
    showParts,
    setView,
    focusOn,
    refresh,
    showHint,
    hideHint,
    syncUI,
    emit,
    setHighlightOverride(fn) {
      highlightOverride = fn;
      refresh();
    },
  };
  // The student view has its own quiz; the tour and typed practice belong to the full view.
  const tour = ui.simple ? null : createTour(ctx);
  const practice = ui.simple ? null : createPractice(ctx);
  const quiz = ui.simple ? createQuiz(ctx) : null;
  ui.practice?.addEventListener('submit', (e) => {
    e.preventDefault();
    practice.check();
  });
  const coach =
    ui.simple && o.coach
      ? createCoach({ stage, layer: ui.coachLayer, t, s, caliper, loupe, pick, animateGap, tweener, avoid: [ui.corner, ui.hint] })
      : null;
  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true; // iPhone, or an iframe without allow="fullscreen"

  // The magnifier glides after the line that coincides, except in a test, where that would give the answer away.
  loupe.setTarget(() => {
    const r = reading();
    if ((s.mode === 'practice' && !practice.revealed) || (s.mode === 'quiz' && !quiz.revealed)) return caliper.points.vernierZero();
    return new THREE.Vector3(r.coincideMain, DIM.scaleY + 0.3, DIM.beamHalfT);
  });

  // ── boot ─────────────────────────────────────────────────────────────────────
  caliper.setZeroError(0);
  s.zeroError = 0;
  setZeroError(o.zeroError, { demo: false });
  setGap(+o.value || 0);
  setView(s.view, { animate: false });
  setMagnifier(s.magnifier);
  if (s.labels) showParts(true);
  setHidden(s.hidden);
  setSound(s.sound);
  if (o.locked) setLocked(true, { sound: false });
  syncSpecimenTray('none');
  syncUI();
  refresh();

  const ready = (async () => {
    if (o.specimen && SPECIMENS[o.specimen]) await setSpecimen(o.specimen, { size: o.size, animate: false, autoContact: false, hint: false });
    if (o.specimen && SPECIMENS[o.specimen]) {
      const [lo, hi] = limits();
      setGap(s.specimen.mode === 'outside' ? lo : hi);
    }
    if (o.mode === 'practice' || o.mode === 'quiz') {
      if (quiz) quiz.start();
      else practice.start({ zeroErrors: o.practiceZeroError });
    } else if (o.mode === 'tour') tour?.start();
    emit('ready', { version: VERSION, ...snapshot() });
    if (s.mode === 'explore') coach?.start();
  })();

  // ── public API ───────────────────────────────────────────────────────────────
  return {
    version: VERSION,
    ready,
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: () => ({ ...snapshot(), ...settings() }),
    /** Change any of: value, lc, zeroError, unit, view, specimen, size, guides, magnifier, labels, locked, hideReading, sound, animate */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.lc != null) setLeastCount(+p.lc);
      if (p.zeroError != null) setZeroError(+p.zeroError, { demo: false });
      if (p.unit) setUnit(p.unit);
      if (p.guides != null) setGuides(p.guides);
      if (p.magnifier != null) setMagnifier(p.magnifier);
      if (p.labels != null) showParts(p.labels);
      if (p.hideReading != null) setHidden(p.hideReading);
      if (p.sound != null) setSound(p.sound);
      if (p.view) setView(p.view, { animate });
      if (p.specimen !== undefined)
        await setSpecimen(p.specimen === 'none' ? null : p.specimen, { size: p.size, animate, autoContact: p.value == null, hint: false });
      if (p.value != null) {
        if (s.locked && p.locked !== false) setLocked(false, { sound: false });
        if (animate) await animateGap(THREE.MathUtils.clamp(+p.value, ...limits()), 0.7);
        else setGap(+p.value);
      }
      if (p.locked != null) setLocked(p.locked, { sound: false });
      return { ...snapshot(), ...settings() };
    },
    reset,
    /** Full view only; returns false in the student view. */
    startTour: () => (tour ? (tour.start(), true) : false),
    /** Student view: the multiple-choice quiz. Full view: typed practice ({ zeroErrors }). */
    startPractice: (opts) => (quiz ? quiz.start() : practice.start(opts)),
    stopPractice: () => (quiz ? quiz.stop() : practice.stop()),
    capture: (options) => presentation.capture(options),
    exportGLB,
    dispose() {
      tweener.cancel();
      loupe.dispose();
      presentation.dispose();
      stage.dispose();
      root.innerHTML = '';
      listeners.clear();
    },
    // for debugging in the console
    _internals: { stage, caliper, ctx },
  };
}
