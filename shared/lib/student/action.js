// One action, one result, one rule (kit 1.3.0): the student view's big action button and its twin on the 3D view.
//
// The button sits in the panel: an accent pill with a round numbered badge ("১"), the verb ("বইটিতে ধাক্কা দাও") and a
// hand. The marker sits on the 3D view: a dashed ring round the part to touch (a point with a radius, or an object's
// box, projected every frame while it shows) with the same numbered badge, pulsing gently (still under
// prefers-reduced-motion). The ring lets every tap through (pointer-events: none), so the figure's own raycast hit
// boxes still get them; the badge itself can be tapped too. A tap on the button or on the badge calls onAct; the
// figure calls the same function from its raycast, so all three do the same thing.
//
//   const action = createAction({
//     stage, layer: ui.coachLayer, host: ui.$('.pvc-act-slot'), t,
//     step: 1, label: 'act_push',                  // an i18n key, or () => text (read again on every set/refresh)
//     target: () => book,                          // Object3D | Box3 (ring fitted round it) | Vector3 | null (no ring)
//     radius: 30,                                  // px round a Vector3 target, or worldRadius (scene units)
//     avoid: [ui.corner, ui.hint, () => labels],   // the badge keeps clear of these (elements or canvas-pixel boxes)
//     onAct: () => push(),
//   });
//   action.set({ step: 2, label: () => t('act_on', { floor }), enabled: true });
//   action.hide('run'); action.show('run');     // the marker only (the button stays); reasons add up
//   action.flash();                              // one stronger pulse, e.g. after a tap that did nothing
//
// The marker hides by itself while a finger or the mouse drags on the view, while the button is disabled, and during
// the test (`.pvc[data-mode="quiz"]`, or createQuiz({ action })). It replaces the first-use coach for tap actions;
// drags keep createCoach (give the coach `avoid: [action.badge]` if both show).
import * as THREE from 'three';
import { ICONS } from './icons.js';

/**
 * @typedef {{ left: number, top: number, right: number, bottom: number }} Box
 * @typedef {Element | Box | null | undefined} AvoidItem
 * @typedef {AvoidItem | (() => AvoidItem | AvoidItem[])} Avoid
 * @typedef {THREE.Vector3 | THREE.Box3 | THREE.Object3D | null | undefined} Target
 * @typedef {{ step?: number | string, label?: string | (() => string), icon?: string, target?: () => Target,
 *             radius?: number, worldRadius?: number, pad?: number, enabled?: boolean, avoid?: Avoid[] }} ActionChange
 */

// Where the badge sits on the ring, best first (degrees on the screen, y down): top right, top left, right, left, …
const ANGLES = [-45, -135, 0, 180, -90, 45, 135, 90];
const MIN_RING = 44; // px: the ring is never smaller than this across

/**
 * @param {{ stage: any, layer: HTMLElement, host?: Element | null, t: any, onAct?: () => any, step?: number | string,
 *           label?: string | (() => string), icon?: string, target?: () => Target, radius?: number,
 *           worldRadius?: number, pad?: number, avoid?: Avoid[], inset?: number, pulse?: boolean,
 *           enabled?: boolean }} options
 */
export function createAction({
  stage,
  layer,
  host = null,
  t,
  onAct = () => {},
  step = 1,
  label = '',
  icon = ICONS.hand,
  target = () => null,
  radius = 30,
  worldRadius = 0,
  pad = 10,
  avoid = [],
  inset = 8,
  pulse = true,
  enabled = true,
}) {
  const state = { step, label, icon, target, radius, worldRadius, pad, enabled, avoid };
  const num = (n) => (typeof t?.num === 'function' ? t.num(n) : String(n));
  const text = () => (typeof state.label === 'function' ? state.label() : state.label ? t(state.label) : '');

  // ── the button (in the panel) ──
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'pvc-act';
  button.innerHTML =
    '<span class="pvc-act-num" aria-hidden="true"></span><span class="pvc-act-text"></span><span class="pvc-act-icon" aria-hidden="true"></span>';
  const bNum = /** @type {HTMLElement} */ (button.querySelector('.pvc-act-num'));
  const bText = /** @type {HTMLElement} */ (button.querySelector('.pvc-act-text'));
  const bIcon = /** @type {HTMLElement} */ (button.querySelector('.pvc-act-icon'));
  host?.append(button);

  // ── the marker (on the 3D view) ──
  const marker = document.createElement('div');
  marker.className = 'pvc-act-marker';
  marker.setAttribute('aria-hidden', 'true');
  marker.innerHTML = `<div class="pvc-act-ringbox"><svg class="pvc-act-ring"><rect class="halo"/><rect class="dash"/></svg></div><div class="pvc-act-badge"><span class="pvc-act-num"></span></div>`;
  if (!pulse) marker.classList.add('still');
  const ringBox = /** @type {HTMLElement} */ (marker.querySelector('.pvc-act-ringbox'));
  const ring = /** @type {SVGSVGElement} */ (marker.querySelector('.pvc-act-ring'));
  const rects = [...marker.querySelectorAll('rect')];
  const badge = /** @type {HTMLElement} */ (marker.querySelector('.pvc-act-badge'));
  const mNum = /** @type {HTMLElement} */ (marker.querySelector('.pvc-act-num'));
  layer.append(marker);

  function act() {
    if (!state.enabled) return;
    onAct();
  }
  button.addEventListener('click', act);
  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    act();
  });

  let drawn = ''; // what the button shows now, so a figure can call set() every frame for nothing
  function render() {
    const words = text();
    const n = state.step == null || state.step === '' ? '' : num(state.step);
    const key = `${words}|${n}|${state.enabled}|${state.icon}`;
    if (key === drawn) return;
    drawn = key;
    bText.textContent = words;
    button.setAttribute('aria-label', words);
    bNum.textContent = n;
    mNum.textContent = n;
    bNum.hidden = !n;
    mNum.parentElement.classList.toggle('empty', !n);
    bIcon.innerHTML = state.icon || '';
    button.disabled = !state.enabled;
    stage.invalidate();
  }

  // ── where the marker goes ──
  const hiddenBy = new Set(); // reasons the marker is hidden: 'drag', 'quiz', or the figure's own
  const v = new THREE.Vector3();
  const w = new THREE.Vector3();
  const box3 = new THREE.Box3();
  let angle = -1; // the badge keeps its place on the ring while that stays clear
  let shown = false;
  let ringSize = '';

  function project(p) {
    v.copy(p).project(stage.camera);
    return { x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height, ok: v.z < 1 && v.z > -1 };
  }

  /** The ring on the screen ({ cx, cy, w, h } in canvas pixels), or null when there is nothing to show. */
  function geometry() {
    const tg = state.target?.();
    if (!tg) return null;
    if (tg instanceof THREE.Vector3) {
      const c = project(tg);
      if (!c.ok) return null;
      let r = state.radius;
      if (state.worldRadius > 0) {
        w.set(1, 0, 0).applyQuaternion(stage.camera.quaternion).multiplyScalar(state.worldRadius).add(tg);
        const e = project(w);
        r = Math.hypot(e.x - c.x, e.y - c.y);
      }
      const d = Math.max(MIN_RING, 2 * r);
      return { cx: c.x, cy: c.y, w: d, h: d };
    }
    if (tg instanceof THREE.Box3) box3.copy(tg);
    else if (tg instanceof THREE.Object3D) box3.setFromObject(tg);
    else return null;
    if (box3.isEmpty()) return null;
    let l = Number.POSITIVE_INFINITY;
    let tp = Number.POSITIVE_INFINITY;
    let r = Number.NEGATIVE_INFINITY;
    let b = Number.NEGATIVE_INFINITY;
    for (const x of [box3.min.x, box3.max.x])
      for (const y of [box3.min.y, box3.max.y])
        for (const z of [box3.min.z, box3.max.z]) {
          const c = project(w.set(x, y, z));
          if (!c.ok) return null;
          l = Math.min(l, c.x);
          r = Math.max(r, c.x);
          tp = Math.min(tp, c.y);
          b = Math.max(b, c.y);
        }
    // a stadium (pill) round the box: far enough out that the box's corners stay inside its round ends
    const p = Math.max(state.pad, 0.21 * Math.min(r - l, b - tp));
    return { cx: (l + r) / 2, cy: (tp + b) / 2, w: Math.max(MIN_RING, r - l + 2 * p), h: Math.max(MIN_RING, b - tp + 2 * p) };
  }

  /** Boxes (canvas pixels) the badge must keep clear of. */
  function avoidBoxes() {
    const origin = stage.canvas.getBoundingClientRect();
    const out = [];
    const add = (it) => {
      if (!it) return;
      if (Array.isArray(it)) return it.forEach(add);
      if (typeof it === 'function') return add(it());
      if (!(it instanceof Element)) return out.push(it);
      const r = it.getBoundingClientRect();
      if (!r.width || it.closest('[hidden]') || getComputedStyle(it).opacity === '0' || getComputedStyle(it).visibility === 'hidden') return;
      out.push({ left: r.left - origin.left, top: r.top - origin.top, right: r.right - origin.left, bottom: r.bottom - origin.top });
    };
    add(state.avoid);
    return out;
  }

  /** The badge's centre at ANGLES[i] on the ring's outline (a stadium: straight sides, round ends). */
  function onRing(g, i) {
    const a = (ANGLES[i] * Math.PI) / 180;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const rr = Math.min(g.w, g.h) / 2;
    const run = (Math.max(g.w, g.h) - Math.min(g.w, g.h)) / 2;
    const sx = Math.abs(c) < 1e-6 ? 0 : Math.sign(c);
    const sy = Math.abs(s) < 1e-6 ? 0 : Math.sign(s);
    return g.w >= g.h ? { x: g.cx + sx * run + rr * c, y: g.cy + rr * s } : { x: g.cx + rr * c, y: g.cy + sy * run + rr * s };
  }

  function setShown(on) {
    if (on === shown) return;
    shown = on;
    marker.classList.toggle('in', on);
    button.classList.toggle('live', on);
  }

  function place() {
    const g = hiddenBy.size || !state.enabled ? null : geometry();
    if (!g || g.cx < 0 || g.cx > stage.width || g.cy < 0 || g.cy > stage.height) return setShown(false);
    const size = `${Math.round(g.w)}x${Math.round(g.h)}`;
    if (size !== ringSize) {
      ringSize = size;
      const W = Math.round(g.w) + 6;
      const H = Math.round(g.h) + 6;
      ring.setAttribute('width', String(W));
      ring.setAttribute('height', String(H));
      ring.setAttribute('viewBox', `0 0 ${W} ${H}`);
      for (const rect of rects) {
        rect.setAttribute('x', '3');
        rect.setAttribute('y', '3');
        rect.setAttribute('width', String(W - 6));
        rect.setAttribute('height', String(H - 6));
        rect.setAttribute('rx', String((Math.min(W, H) - 6) / 2));
      }
    }
    ringBox.style.transform = `translate(${g.cx - Math.round(g.w) / 2 - 3}px, ${g.cy - Math.round(g.h) / 2 - 3}px)`;

    // the badge: on the ring, inside the view, clear of the buttons, the hint and the figure's labels
    const B = badge.offsetWidth || 44;
    const keep = avoidBoxes();
    const boxAt = (i) => {
      const p = onRing(g, i);
      return { left: p.x - B / 2, top: p.y - B / 2, right: p.x + B / 2, bottom: p.y + B / 2 };
    };
    const inside = (b) => b.left >= inset && b.top >= inset && b.right <= stage.width - inset && b.bottom <= stage.height - inset;
    const clear = (b) => !keep.some((r) => b.left < r.right + 4 && b.right > r.left - 4 && b.top < r.bottom + 4 && b.bottom > r.top - 4);
    let pick = angle >= 0 && inside(boxAt(angle)) && clear(boxAt(angle)) ? angle : -1;
    for (let i = 0; i < ANGLES.length && pick < 0; i++) if (inside(boxAt(i)) && clear(boxAt(i))) pick = i;
    for (let i = 0; i < ANGLES.length && pick < 0; i++) if (inside(boxAt(i))) pick = i;
    angle = pick;
    let b = boxAt(Math.max(0, pick));
    if (pick < 0) {
      // nowhere fully inside: keep it in the view
      const x = Math.min(Math.max(b.left, inset), stage.width - inset - B);
      const y = Math.min(Math.max(b.top, inset), stage.height - inset - B);
      b = { left: x, top: y, right: x + B, bottom: y + B };
    }
    badge.style.transform = `translate(${b.left}px, ${b.top}px)`;
    setShown(true);
  }
  stage.onAfterRender(place);
  stage.onResize(() => stage.invalidate());

  // ── hidden while a finger or the mouse drags on the view (the figure's drag, or turning the camera) ──
  const stageEl = layer.closest('.pvc-stage') || layer.parentElement;
  /** @type {{ id: number, x: number, y: number } | null} */
  let down = null;
  const onDown = (e) => {
    if (badge.contains(e.target)) return;
    down = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const onMove = (e) => {
    if (!down || e.pointerId !== down.id || hiddenBy.has('drag')) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) hide('drag');
  };
  const onUp = (e) => {
    if (!down || e.pointerId !== down.id) return;
    down = null;
    show('drag');
  };
  stageEl?.addEventListener('pointerdown', onDown, true);
  window.addEventListener('pointermove', onMove, true);
  window.addEventListener('pointerup', onUp, true);
  window.addEventListener('pointercancel', onUp, true);

  /** Hide the marker on the 3D view (the button stays) until show(reason) with the same reason. */
  function hide(reason = 'figure') {
    hiddenBy.add(reason);
    setShown(false);
    stage.invalidate();
  }
  function show(reason = 'figure') {
    hiddenBy.delete(reason);
    stage.invalidate();
  }

  let flashTimer = 0;
  render();

  return {
    button,
    marker,
    badge,
    /**
     * Change the step number, the words, the icon, the target, the ring's size, whether it can be used, or what
     * the badge keeps clear of. The words are read again (a function label follows the figure).
     * @param {ActionChange} [change]
     */
    set(change = {}) {
      let moved = false;
      for (const [k, value] of Object.entries(change))
        if (value !== undefined && k in state && state[k] !== value) {
          state[k] = value;
          if (k !== 'step' && k !== 'label' && k !== 'icon') moved = true;
        }
      if (change.target !== undefined) angle = -1;
      render();
      if (moved) stage.invalidate(); // the ring follows a new target, size or avoid list
    },
    /** Read the words again (a label function whose answer changed). */
    refresh: render,
    hide,
    show,
    /** One stronger pulse of the button and the marker (no movement under prefers-reduced-motion). */
    flash() {
      clearTimeout(flashTimer);
      button.classList.remove('flash');
      marker.classList.remove('flash');
      void button.offsetWidth; // restart the animation
      button.classList.add('flash');
      marker.classList.add('flash');
      flashTimer = setTimeout(() => {
        button.classList.remove('flash');
        marker.classList.remove('flash');
      }, 900);
    },
    /** Place the marker now (it also happens after each frame). */
    update: place,
    /** True while the marker shows on the 3D view. */
    get visible() {
      return shown && !marker.closest('.pvc[data-mode="quiz"]');
    },
    get step() {
      return state.step;
    },
    get enabled() {
      return state.enabled;
    },
    /** The badge's box on the 3D view (canvas pixels) while it shows, e.g. for the figure's labels to avoid. */
    box() {
      if (!shown) return null;
      const o = stage.canvas.getBoundingClientRect();
      const r = badge.getBoundingClientRect();
      return { left: r.left - o.left, top: r.top - o.top, right: r.right - o.left, bottom: r.bottom - o.top };
    },
    dispose() {
      clearTimeout(flashTimer);
      stageEl?.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
      window.removeEventListener('pointercancel', onUp, true);
      button.remove();
      marker.remove();
    },
  };
}
