// Screw gauge (textbook page 21, topic 1.6.1), student view: turn the screw, read L + C × LC, take a test.
// Shared pieces: the student layout, quiz, pointers, magnifier and materials (@shared/student/…).
//
//   import { createScrewGaugeApp } from './src/app.js';
//   const app = createScrewGaugeApp(document.getElementById('app'), { value: 3.47 });
import * as THREE from 'three';
import { createStage } from '@shared/stage.js';
import { createTweener, ease } from '@shared/tween.js';
import { createMaterials } from '@shared/student/materials.js';
import { createLoupe } from '@shared/student/loupe.js';
import { createAudio } from '@shared/student/audio.js';
import { buildStudentShell, learnSheet } from '@shared/student/shell.js';
import { createCoach } from '@shared/student/coach.js';
import { createQuiz } from '@shared/student/quiz.js';
import { createI18n } from './i18n.js';
import { createGauge, DIM } from './gauge.js';
import { OBJECTS, OBJECT_KINDS, createObject, randomSize } from './objects.js';
import { read, format, roundTo, LC, PITCH, DIVISIONS, RANGE } from './reading.js';

export const VERSION = '0.1.0';

/** Wait (briefly) for the Bangla webfont, so the numbers on the scales are drawn with it. */
export function loadFonts(timeout = 2500) {
  if (!document.fonts?.load) return Promise.resolve();
  const loads = ['400', '500', '600', '700'].map((w) => document.fonts.load(`${w} 24px "Noto Sans Bengali"`, 'অআ০১২৩ab12'));
  return Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, timeout))]).catch(() => {});
}

export const DEFAULTS = {
  value: 3.47, // starting gap (mm)
  view: 'front', // 'front' | '3d'
  object: null, // 'wire' | 'ball' | 'plate'
  size: null, // object size (mm)
  magnifier: true,
  guides: true, // colour the marks that are read
  sound: true,
  theme: 'light', // 'light' | 'transparent'
  lang: 'bn',
  numerals: null, // 'bn' | 'latin' (default follows lang)
  coach: true, // first-use pointers
  mode: 'explore', // 'explore' | 'quiz'
  shadow: true,
};

const VIEW_DIRS = {
  front: new THREE.Vector3(0, 0.14, 1).normalize(), // a little from above, so the sleeve numbers read well
  '3d': new THREE.Vector3(0.55, 0.45, 1).normalize(),
};

export function createScrewGaugeApp(root, userOptions = {}) {
  const o = { ...DEFAULTS, ...userOptions };
  const t = createI18n(o.lang, { numerals: o.numerals });
  const N = t.num;

  root.classList.add('pvc');
  root.dataset.theme = o.theme;
  root.dataset.ui = 'simple';
  root.lang = t.lang;
  root.tabIndex = 0;
  const ui = buildStudentShell(root, t, {
    learn: learnSheet(t, {
      terms: [
        { cls: 'lin', label: 'lin_long', op: '=' },
        { cls: 'cir', label: 'cir_long', op: '+' },
        { cls: 'lc', label: 'lc_long', op: '×' },
      ],
      extra: `\n          <p class="pvc-learn-extra">${t('lc_line', { pitch: PITCH, n: DIVISIONS, lc: LC })}</p>`,
    }),
  });

  // ── 3D ──────────────────────────────────────────────────────────────────────
  const stage = createStage(ui.canvasHost, { fov: 24, near: 2, far: 6000, environment: 'studio-light' });
  const { camera, controls, scene } = stage;
  controls.zoomToCursor = true;
  controls.minDistance = 15;
  controls.maxDistance = 1500;
  controls.rotateSpeed = 0.6;

  const M = createMaterials(stage.renderer);
  const gauge = createGauge({ materials: M, text: { digits: N, mm: t('unit_mm') } });
  scene.add(gauge.root);

  const tweener = createTweener();
  stage.addTicker((dt) => tweener.tick(dt));
  const audio = createAudio(o.sound);
  let coach = null;
  const loupe = createLoupe({ stage, layer: ui.lensLayer, clearColor: 0xffffff, onDragStart: () => coach?.lensUsed() });

  // A soft shadow on an invisible "page" behind it, so it reads like a figure on paper.
  if (o.shadow && o.theme !== 'dark') {
    stage.renderer.shadowMap.enabled = true;
    stage.renderer.shadowMap.type = THREE.VSMShadowMap;
    stage.renderer.shadowMap.autoUpdate = false;
    stage.onBeforeRender(() => (stage.renderer.shadowMap.needsUpdate = true));
    const sun = new THREE.DirectionalLight(0xffffff, 0.3);
    sun.position.set(30, 110, 400);
    sun.target.position.set(40, -15, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 1024);
    Object.assign(sun.shadow.camera, { left: -70, right: 150, top: 60, bottom: -80, near: 250, far: 650 });
    sun.shadow.radius = 12;
    sun.shadow.blurSamples = 24;
    sun.shadow.bias = -0.0005;
    const page = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1000), new THREE.ShadowMaterial({ opacity: 0.11 }));
    page.position.set(40, -15, -9);
    page.receiveShadow = true;
    scene.add(sun, sun.target, page);
  }
  const castShadows = (obj) => obj.traverse((m) => m.isMesh && !m.isInstancedMesh && !m.material.transparent && (m.castShadow = true));
  castShadows(gauge.root);

  const listeners = new Map();
  function emit(type, payload) {
    for (const fn of listeners.get(type) || []) fn(payload);
    for (const fn of listeners.get('*') || []) fn(payload, type);
  }

  const s = {
    gap: 0,
    view: o.view === '3d' ? '3d' : 'front',
    magnifier: !!o.magnifier,
    guides: !!o.guides,
    sound: !!o.sound,
    object: null,
    mode: 'explore',
    dragging: false,
    contact: false,
    locked: false,
    userMovedCamera: false,
  };
  const reading = () => read(s.gap);

  // ── reading panel ───────────────────────────────────────────────────────────
  const $ = ui.$;
  const el = {
    value: $('.pvc-result .v'),
    unit: $('.pvc-result .u'),
    lin: $('.pvc-t.lin b'),
    cir: $('.pvc-t.cir b'),
    lc: $('.pvc-t.lc b'),
    status: $('.pvc-status span'),
    statusDot: $('.pvc-status'),
    object: $('[data-act="object"] span'),
  };
  el.unit.textContent = t('unit_mm');
  el.lc.textContent = N(String(LC));

  function snapshot(r = reading()) {
    return {
      value: r.value,
      L: r.L,
      C: r.C,
      lc: LC,
      pitch: PITCH,
      unit: 'mm',
      gap: +s.gap.toFixed(4),
      contact: s.contact,
      locked: s.locked,
      object: s.object ? { kind: s.object.kind, size: s.object.size } : null,
      mode: s.mode,
    };
  }

  let lastKey = '';
  let emitTimer = 0;
  let lastEmit = 0;
  function queueChange() {
    const snap = snapshot();
    const key = `${snap.value}|${snap.contact}|${snap.locked}|${snap.object?.kind}`;
    if (key === lastKey) return;
    lastKey = key;
    clearTimeout(emitTimer);
    emitTimer = setTimeout(
      () => {
        lastEmit = performance.now();
        emit('change', snapshot());
      },
      Math.max(0, 100 - (performance.now() - lastEmit)),
    );
  }

  function status() {
    if (s.locked) return { text: t('status_locked'), tone: 'locked' };
    if (s.contact && s.object) return { text: t('status_contact', { object: t(`obj_${s.object.kind}`) }), tone: 'contact' };
    if (s.gap < 1e-6) return { text: t('status_closed'), tone: 'idle' };
    return { text: t('status_free'), tone: 'idle' };
  }

  function updatePanel(r) {
    el.value.textContent = N(format(r.value));
    el.lin.textContent = N(String(r.L));
    el.cir.textContent = N(String(r.C));
    const st = status();
    el.status.textContent = st.text;
    el.statusDot.dataset.tone = st.tone;
  }

  function refresh() {
    const r = reading();
    gauge.highlight(s.guides && (!quiz || quiz.revealed)); // in the test the colours wait for the answer
    updatePanel(r);
    queueChange();
    stage.invalidate();
  }

  // ── the screw ───────────────────────────────────────────────────────────────
  const limits = () => [s.object ? s.object.size : 0, RANGE];
  let lastSlipSound = 0;

  function setGap(g, { pushing = false } = {}) {
    const [lo, hi] = limits();
    const v = THREE.MathUtils.clamp(g, lo, hi);
    const prev = s.gap;
    let contact = false;
    if (s.object) {
      contact = Math.abs(v - lo) < 1e-6;
      if (contact && !s.contact && prev - v > 1e-6) onContact();
      // pushed on past the object: the ratchet slips and clicks, the screw stays where it is
      if (contact && pushing && g < lo - 0.002) {
        gauge.slip(-(lo - g) * 0.8);
        const now = performance.now();
        if (now - lastSlipSound > 90) {
          audio.tick();
          lastSlipSound = now;
        }
      }
    }
    s.contact = contact;
    if (s.dragging && Math.floor(prev * 10) !== Math.floor(v * 10)) audio.tick();
    s.gap = v;
    gauge.setGap(v);
    refresh();
  }

  function animateGap(target, duration = 0.6, fn = ease.inOutCubic) {
    const g0 = s.gap;
    if (Math.abs(target - g0) < 1e-6) return Promise.resolve(true);
    return tweener.animate({ key: 'gap', duration, ease: fn, onUpdate: (k) => setGap(g0 + (target - g0) * k) }).finished;
  }

  const snapGap = () => animateGap(THREE.MathUtils.clamp(roundTo(s.gap, LC), ...limits()), 0.12, ease.outCubic);

  function stepGap(divisions) {
    if (s.locked) return lockedNudge();
    tweener.cancel('gap');
    coach?.objectUsed();
    coach?.objectReleased();
    setGap(roundTo(roundTo(s.gap, LC) + divisions * LC, LC), { pushing: divisions < 0 });
  }

  function onContact() {
    audio.contact();
    if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.(12);
    const ob = s.object;
    tweener.animate({
      key: 'glow',
      duration: 0.7,
      ease: ease.linear,
      onUpdate: (_k, p) => ob?.setGlow(Math.sin(Math.PI * Math.min(1, p * 1.2))),
      onComplete: () => ob?.setGlow(0),
    });
    if (s.mode === 'explore') showHint(t('hint_contact'), { duration: 3200 });
  }

  function setLocked(on) {
    s.locked = !!on;
    refresh();
  }

  function lockedNudge() {
    showHint(t('q_locked'), { duration: 3200 });
    audio.error();
  }

  // ── camera ──────────────────────────────────────────────────────────────────
  function frameBounds() {
    const x0 = -18;
    const x1 = DIM.zeroX + DIM.thimbleLen + DIM.ratchetLen + s.gap + 2;
    return { cx: (x0 + x1) / 2, cy: -15, w: x1 - x0, h: 60 };
  }

  function fitDistance(w, h) {
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const usableH = Math.max(0.5, 1 - 64 / Math.max(stage.height, 200)); // room for the buttons on top
    return Math.max(h / 2 / Math.tan(vfov / 2) / usableH, w / 2 / Math.tan(hfov / 2)) * 1.06;
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
    loupe.setFollow(true); // the view buttons also bring a moved magnifier back to the reading
    s.userMovedCamera = false;
    syncUI();
    emit('view', { view: s.view });
    return flyTo(viewPose(s.view), animate ? 0.9 : 0).then((done) => (autoZoom(), done));
  }

  // Magnify so the circular scale's parts come out about 10 px apart in the glass, whatever the screen.
  function autoZoom() {
    const { pxPerMm } = axisOnScreen();
    const part = pxPerMm * ((2 * Math.PI * DIM.thimbleR) / DIVISIONS);
    loupe.setZoom(THREE.MathUtils.clamp(10 / part, 2.2, 6));
  }

  controls.addEventListener('start', () => {
    s.userMovedCamera = true;
    tweener.cancel('camera');
  });
  controls.addEventListener('change', () => {
    const near = THREE.MathUtils.clamp(camera.position.distanceTo(controls.target) * 0.04, 0.4, 20);
    if (Math.abs(near - camera.near) / camera.near > 0.15) {
      camera.near = near;
      camera.updateProjectionMatrix();
    }
  });
  stage.onResize(() => {
    if (!s.userMovedCamera && !tweener.busy) flyTo(viewPose(s.view), 0).then(autoZoom);
  });

  // ── picking + turning ───────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const canvasPoint = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function pick(p) {
    const viaLens = loupe.contains(p.x, p.y);
    if (viaLens) {
      loupe.toNDC(p.x, p.y, ndc);
      raycaster.setFromCamera(ndc, loupe.camera);
    } else {
      ndc.set((p.x / stage.width) * 2 - 1, -(p.y / stage.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
    }
    const hit = raycaster.intersectObjects(gauge.pickMoving, true).find((h) => h.object.visible);
    return hit ? { kind: 'thimble', point: hit.point, viaLens } : null;
  }
  // Fingers are wide: a touch just off the thimble still takes it (keeping the offset, so nothing jumps).
  function nearby(p) {
    for (const r of [8, 16]) {
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const q = { x: p.x + r * Math.cos(a), y: p.y + r * Math.sin(a) };
        if (pick(q)) return q;
      }
    }
    return null;
  }

  /** On-screen direction of the screw axis and how many pixels one millimetre is, near the thimble. */
  const pa = new THREE.Vector3();
  const pb = new THREE.Vector3();
  function axisOnScreen() {
    const x = DIM.zeroX + s.gap + 10;
    gauge.root.localToWorld(pa.set(x, 0, DIM.thimbleR)).project(camera);
    gauge.root.localToWorld(pb.set(x + 10, 0, DIM.thimbleR)).project(camera);
    const dx = ((pb.x - pa.x) / 2) * stage.width;
    const dy = (-(pb.y - pa.y) / 2) * stage.height;
    const len = Math.hypot(dx, dy) || 1;
    return { ux: dx / len, uy: dy / len, pxPerMm: len / 10 };
  }

  let drag = null;
  ui.canvasHost.addEventListener(
    'pointerdown',
    (e) => {
      audio.unlock();
      root.focus({ preventScroll: true });
      coach?.interrupt();
      if (drag || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const p = canvasPoint(e);
      let hit = pick(p);
      if (!hit && e.pointerType !== 'mouse') {
        const q = nearby(p);
        if (q) hit = pick(q);
      }
      if (!hit) return; // the camera controls take it
      e.stopPropagation();
      e.preventDefault();
      if (s.locked) return lockedNudge();
      // turning follows the surface that was touched (thimble or the smaller ratchet knob)
      const local = gauge.root.worldToLocal(hit.point.clone());
      const radius = THREE.MathUtils.clamp(Math.hypot(local.y, local.z), 3, DIM.thimbleR + 0.5);
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, gap: s.gap, axis: axisOnScreen(), zoom: hit.viaLens ? loupe.zoom : 1, radius };
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
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { ux, uy, pxPerMm } = drag.axis;
    const dx = (e.clientX - drag.x) / drag.zoom;
    const dy = (e.clientY - drag.y) / drag.zoom;
    // Along the axis it follows the finger; across it, it turns: the thimble's surface moves with the finger.
    const along = (dx * ux + dy * uy) / pxPerMm;
    const across = (-dx * uy + dy * ux) / pxPerMm;
    const turned = (-across / (2 * Math.PI * drag.radius)) * PITCH;
    const want = drag.gap + along + turned;
    setGap(want, { pushing: want < s.gap });
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    s.dragging = false;
    loupe.setFrozen(false);
    ui.canvasHost.style.cursor = '';
    snapGap().then(() => {
      queueChange();
      emit('dragend', snapshot());
      coach?.objectReleased();
    });
  }
  ui.canvasHost.addEventListener('pointerup', endDrag);
  ui.canvasHost.addEventListener('pointercancel', endDrag);
  let hoverQueued = false;
  ui.canvasHost.addEventListener('pointermove', (e) => {
    if (drag || e.pointerType !== 'mouse' || hoverQueued) return;
    hoverQueued = true;
    const p = canvasPoint(e);
    requestAnimationFrame(() => {
      hoverQueued = false;
      ui.canvasHost.style.cursor = pick(p) ? (s.locked ? 'not-allowed' : 'grab') : '';
    });
  });
  // Scroll on the thimble: one notch turns it one division (Shift: ten).
  let wheelAcc = 0;
  ui.canvasHost.addEventListener(
    'wheel',
    (e) => {
      const p = canvasPoint(e);
      if (pick(p)) {
        e.preventDefault();
        e.stopPropagation();
        wheelAcc += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
        if (Math.abs(wheelAcc) >= 40) {
          stepGap((wheelAcc < 0 ? 1 : -1) * (e.shiftKey ? 10 : 1));
          wheelAcc = 0;
        }
      } else if (loupe.contains(p.x, p.y)) {
        e.preventDefault();
        e.stopPropagation();
        loupe.setZoom(loupe.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
      }
    },
    { capture: true, passive: false },
  );

  // ── objects ─────────────────────────────────────────────────────────────────
  let objectToken = 0;
  async function setObject(kind, { size, animate = true, autoContact = true, hint = false } = {}) {
    const token = ++objectToken;
    if (s.object) {
      const old = s.object;
      s.object = null;
      s.contact = false;
      if (animate) {
        tweener.animate({
          key: `out-${token}`,
          duration: 0.4,
          onUpdate: (k) => {
            old.group.position.y = k * 18;
            old.setOpacity(1 - k);
          },
          onComplete: () => (gauge.root.remove(old.group), old.dispose()),
        });
      } else {
        gauge.root.remove(old.group);
        old.dispose();
      }
    }
    syncObjectButton(kind);
    if (!kind || !OBJECTS[kind]) {
      refresh();
      emit('object', null);
      return;
    }
    const def = OBJECTS[kind];
    const sz = THREE.MathUtils.clamp(roundTo(+(size ?? def.size) || def.size, LC), def.min, def.max);
    if (s.locked) setLocked(false);
    if (s.gap < sz + 1) {
      if (animate) await animateGap(Math.min(RANGE, sz + 2.5), 0.5);
      else setGap(Math.min(RANGE, sz + 2.5));
    }
    if (token !== objectToken) return;
    const ob = createObject(kind, sz, M);
    castShadows(ob.group);
    gauge.root.add(ob.group);
    s.object = ob;
    if (animate) {
      ob.setOpacity(0);
      audio.pop();
      await tweener.animate({
        key: 'object',
        duration: 0.6,
        ease: ease.outCubic,
        onUpdate: (k) => {
          ob.group.position.y = (1 - k) * 18;
          ob.setOpacity(k);
        },
      }).finished;
      if (token !== objectToken) return;
    }
    ob.group.position.y = 0;
    ob.setOpacity(1);
    refresh();
    emit('object', { kind, size: sz });
    if (autoContact) {
      if (animate) await animateGap(sz, 0.5 + Math.min(0.8, (s.gap - sz) / 6), ease.inOutCubic);
      else setGap(sz);
    }
    if (hint && s.mode === 'explore') showHint(t('status_free'), { duration: 2500 });
  }

  let objectTurn = 0;
  function toggleObject() {
    if (s.object) return setObject(null);
    return setObject(OBJECT_KINDS[objectTurn++ % OBJECT_KINDS.length]);
  }
  function syncObjectButton(kind) {
    el.object.textContent = t(kind ? 'obj_remove' : 'obj_add');
  }

  // ── hint line ───────────────────────────────────────────────────────────────
  let hintTimer = 0;
  function showHint(html, { duration = 4000 } = {}) {
    ui.hintText.innerHTML = html;
    ui.hintAct.hidden = true;
    ui.hint.classList.add('show');
    clearTimeout(hintTimer);
    if (duration) hintTimer = setTimeout(hideHint, duration);
  }
  function hideHint() {
    clearTimeout(hintTimer);
    ui.hint.classList.remove('show');
  }

  // ── test ────────────────────────────────────────────────────────────────────
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }
  /** The right reading and three wrong ones from the usual mistakes. */
  function makeChoices(r) {
    const right = r.value;
    const mistakes = shuffle([
      r.L + 1 + r.C * LC, // took the next millimetre mark
      ...(r.L >= 1 ? [r.L - 1 + r.C * LC] : []),
      ...[1, -1, 2, -2].map((d) => r.L + ((r.C + d + DIVISIONS) % DIVISIONS) * LC), // the division next to the line
      ...(r.C > 0 && r.C !== 50 ? [r.L + (DIVISIONS - r.C) * LC] : []), // counted the circular scale the wrong way
      ...(r.C > 1 ? [r.L + r.C] : []), // forgot to multiply by the least count
    ]);
    const seen = new Set([right.toFixed(2)]);
    const wrong = [];
    for (const m of mistakes) {
      const v = +roundTo(m, LC).toFixed(2);
      if (v < 0 || v > RANGE || seen.has(v.toFixed(2))) continue; // only readings this gauge can show
      seen.add(v.toFixed(2));
      wrong.push(v);
      if (wrong.length === 3) break;
    }
    return shuffle([right, ...wrong]);
  }
  let lastKind = null;
  const quiz = createQuiz({
    ui,
    t,
    emit,
    audio,
    questions: 5,
    hooks: {
      enter() {
        s.mode = 'quiz';
        hideHint();
        syncUI();
        if (s.view !== 'front') setView('front');
      },
      leave() {
        s.mode = 'explore';
        if (s.locked) setLocked(false);
        syncUI();
        refresh();
      },
      async prepare(_i, alive, say) {
        const kind = pickOne(OBJECT_KINDS.filter((k) => k !== lastKind));
        lastKind = kind;
        const size = randomSize(kind);
        say(t('q_text', { what: t(`obj_${kind}_q`) }));
        loupe.setFollow(true);
        if (s.locked) setLocked(false);
        await setObject(kind, { size });
        if (!alive()) return null;
        setLocked(true);
        const r = reading();
        return {
          choices: makeChoices(r),
          expected: r.value,
          tolerance: LC / 2,
          label: (v) => `${N(format(v))}<small>${t('unit_mm')}</small>`,
          meta: { object: kind, size },
        };
      },
      reveal() {
        refresh(); // colours the marks now that it is answered
        const r = reading();
        return `<b class="c-lin">${N(String(r.L))}</b> + <b class="c-cir">${N(String(r.C))}</b> × <b class="c-lc">${N(String(LC))}</b> = <b>${N(format(r.value))} ${t('unit_mm')}</b>`;
      },
      done() {
        if (s.locked) setLocked(false);
      },
    },
  });

  // ── first-use pointers ──────────────────────────────────────────────────────
  if (o.coach) {
    const v = new THREE.Vector3();
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    // On the thimble first; on phones the magnifier covers it, so then on the ratchet knob (it turns the screw too).
    const SPOTS = [
      [12, 3],
      [16, 3],
      [8, 3.5],
      [12, -3],
      [20, 2.5],
      [6, -3],
      [35, 2.5, 5],
      [35, -2.5, 5],
      [33, 0, 5],
    ];
    coach = createCoach({
      stage,
      layer: ui.coachLayer,
      t,
      loupe,
      tweener,
      avoid: [ui.corner, ui.hint],
      object: {
        label: 'coach_turn',
        candidates: () =>
          SPOTS.map(([x, y, r]) => {
            v.copy(gauge.points.movingFront(x, y, r)).project(camera);
            return v.z > -1 && v.z < 1 ? { x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height } : null;
          }),
        grabbable: (p) => {
          const hit = pick(p);
          return !!hit && !hit.viaLens;
        },
        // Turn it half a turn and back, twice.
        async demo(alive) {
          for (let i = 0; i < 2; i++) {
            if (!alive() || s.dragging || s.locked || s.object) return;
            const g0 = s.gap;
            const to = g0 + 0.5 <= RANGE ? g0 + 0.5 : g0 - 0.5;
            if (!(await animateGap(to, 0.9))) return;
            await wait(250);
            if (!alive()) return;
            if (!(await animateGap(g0, 0.8))) return;
            await wait(500);
          }
        },
        cancel: () => tweener.cancel('gap'),
      },
    });
  }

  // ── buttons, keys ───────────────────────────────────────────────────────────
  function syncUI() {
    for (const b of ui.$$('[data-view]')) b.classList.toggle('on', b.dataset.view === s.view);
    const quizOn = s.mode === 'quiz';
    root.dataset.mode = quizOn ? 'quiz' : 'explore';
    for (const b of ui.$$('[data-mode]')) {
      const on = b.dataset.mode === root.dataset.mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', String(on));
    }
    ui.learn.inert = quizOn;
    ui.quiz.inert = !quizOn;
    coach?.setMode(s.mode);
  }

  const fullscreenBtn = ui.$('[data-act="fullscreen"]');
  if (fullscreenBtn && !document.fullscreenEnabled) fullscreenBtn.hidden = true;

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !root.contains(b) || b.closest('.pvc-lens')) return;
    audio.unlock();
    if (b.dataset.view) setView(b.dataset.view);
    if (b.dataset.mode) {
      if (b.dataset.mode === 'quiz') {
        if (s.mode !== 'quiz') quiz.start();
      } else quiz.stop();
    }
    if (b.dataset.q != null) quiz.choose(+b.dataset.q);
    switch (b.dataset.act) {
      case 'object':
        toggleObject();
        break;
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
    if (e.target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    let handled = true;
    if (k === 'ArrowRight' || k === 'ArrowUp') stepGap(e.shiftKey ? DIVISIONS : 1);
    else if (k === 'ArrowLeft' || k === 'ArrowDown') stepGap(e.shiftKey ? -DIVISIONS : -1);
    else if (k === 'PageUp') stepGap(5 * DIVISIONS);
    else if (k === 'PageDown') stepGap(-5 * DIVISIONS);
    else if (k === 'f' || k === 'F') setView('front');
    else if (k === '3' || k === 'v' || k === 'V') setView('3d');
    else if (k === 'Escape') hideHint();
    else handled = false;
    if (handled) e.preventDefault();
  });

  // The magnifier sits on the reading: the thimble's edge at the datum line.
  loupe.setTarget(() => gauge.points.reading());

  // ── boot ────────────────────────────────────────────────────────────────────
  setGap(+o.value || 0);
  setView(s.view, { animate: false });
  loupe.setVisible(s.magnifier);
  audio.setEnabled(s.sound);
  syncObjectButton(null);
  syncUI();
  refresh();

  const ready = (async () => {
    if (o.object && OBJECTS[o.object]) await setObject(o.object, { size: o.size, animate: false });
    if (o.mode === 'quiz') quiz.start();
    emit('ready', { version: VERSION, ...snapshot() });
    if (s.mode === 'explore') coach?.start();
  })();

  return {
    version: VERSION,
    ready,
    on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => listeners.get(type).delete(fn);
    },
    getState: () => ({ ...snapshot(), view: s.view, guides: s.guides, magnifier: s.magnifier }),
    /** Change any of: value, object, size, view, guides, magnifier, sound, animate */
    async set(p = {}) {
      const animate = p.animate !== false;
      if (p.guides != null) (s.guides = !!p.guides), refresh();
      if (p.magnifier != null) loupe.setVisible((s.magnifier = !!p.magnifier));
      if (p.sound != null) audio.setEnabled((s.sound = !!p.sound));
      if (p.view) setView(p.view, { animate });
      if (p.object !== undefined) await setObject(p.object === 'none' ? null : p.object, { size: p.size, animate, autoContact: p.value == null });
      if (p.value != null) {
        if (animate) await animateGap(THREE.MathUtils.clamp(+p.value, ...limits()), 0.7);
        else setGap(+p.value);
      }
      return { ...snapshot(), view: s.view };
    },
    async reset() {
      quiz.stop();
      await setObject(null);
      setView('front');
      return animateGap(o.value, 0.6);
    },
    startPractice: () => quiz.start(),
    stopPractice: () => quiz.stop(),
    capture: (opts) => stage.capture(opts),
    dispose() {
      tweener.cancel();
      loupe.dispose();
      coach?.dispose();
      stage.dispose();
      root.innerHTML = '';
      listeners.clear();
    },
    _internals: { stage, gauge, s },
  };
}
