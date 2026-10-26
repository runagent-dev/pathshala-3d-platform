// One action, one result, one rule (kit 1.3.0): the student view's big action button and its twin on the 3D view.
//
// The button sits in the panel: an accent pill with a round numbered badge ("১"), the verb ("বইটিকে ধাক্কা দাও") and a
// hand. The marker sits on the 3D view: a dashed ring round the part to touch (a point with a radius, or an object's
// box, projected every frame while it shows) and, just outside the ring, the same numbered badge. Both pulse gently
// for about three beats each time the marker appears, then stay still (no pulse under prefers-reduced-motion).
//
// Layers: the ring is drawn UNDER the figure's labels (it is put in the stage just before `.pvc-anno-layer`), the badge
// above them (in `layer`, normally `ui.coachLayer`). The ring lets every touch through, so the figure's own raycast
// hit boxes still get them. The badge does the action on a real tap (finger up within 8 px and 500 ms); any other
// gesture that starts on it (a drag, turning the camera) is handed on to whatever is under it.
//
//   const action = createAction({
//     stage, layer: ui.coachLayer, host: ui.$('.pvc-act-slot'), t,
//     step: 1, label: 'act_push',                  // an i18n key, or () => text (read again on every set/refresh)
//     target: () => book.body,                     // Object3D | Box3 (ring fitted round it) | Vector3 | null (no ring)
//     radius: 30,                                  // px round a Vector3 target, or worldRadius (scene units)
//     avoid: [ui.corner, ui.hint, () => labels],   // the badge keeps clear of these (elements or canvas-pixel boxes)
//     onAct: () => push(),                         // null: the badge is only a sign (a part the student drags)
//     trigger: 'tap',                              // 'pointerdown': act as the finger goes down (timing figures)
//   });
//   anno = createAnnotations({ …, avoid: [ui.corner, ui.hint, () => action.ringBox()] });  // labels keep off the ring
//   action.set({ step: 2, label: () => t('act_on', { floor }), enabled: true });
//   action.hide('run'); action.show('run');     // the marker only (the button stays); reasons are a set
//   action.flash();                              // one stronger pulse, e.g. after a tap that did nothing
//
// The marker hides by itself while a finger or the mouse drags on the view, while the button is disabled, and during
// the test (`.pvc[data-mode="quiz"]`, or createQuiz({ action })). It replaces the first-use coach for tap actions;
// drags keep createCoach (give the coach `avoid: [action.badge]` if both show).
import * as THREE from 'three';
import { ICONS } from './icons.js';
import { capturePointer, releasePointer } from './pointer.js';

/**
 * @typedef {{ left: number, top: number, right: number, bottom: number }} Box
 * @typedef {Element | Box | null | undefined} AvoidItem
 * @typedef {AvoidItem | (() => AvoidItem | AvoidItem[])} Avoid
 * @typedef {THREE.Vector3 | THREE.Box3 | THREE.Object3D | null | undefined} Target
 * @typedef {{ step?: number | string, label?: string | (() => string), icon?: string, target?: () => Target,
 *             radius?: number, worldRadius?: number, pad?: number, enabled?: boolean, avoid?: Avoid[],
 *             caption?: string | (() => string) }} ActionChange
 */

// Where the badge sits round the ring, best first (degrees on the screen, y down): top right, top left, right, left, …
const ANGLES = [-45, -135, 0, 180, -90, 45, 135, 90];
const MIN_RING = 44; // px: the ring is never smaller than this across
const TAP = { move: 8, ms: 500 }; // a tap: the finger comes up within 8 px and 500 ms

/**
 * @param {{ stage: any, layer: HTMLElement, host?: Element | null, t: any, onAct?: (() => any) | null,
 *           trigger?: 'tap' | 'pointerdown', step?: number | string, label?: string | (() => string), icon?: string,
 *           caption?: string | (() => string), target?: () => Target, radius?: number, worldRadius?: number,
 *           pad?: number, avoid?: Avoid[], inset?: number, pulse?: boolean, enabled?: boolean,
 *           ringLayer?: Element | null }} options
 */
export function createAction({
  stage,
  layer,
  host = null,
  t,
  onAct = () => {},
  trigger = 'tap',
  step = 1,
  label = '',
  icon = ICONS.hand,
  caption = '',
  target = () => null,
  radius = 30,
  worldRadius = 0,
  pad = 10,
  avoid = [],
  inset = 8,
  pulse = true,
  enabled = true,
  ringLayer = null,
}) {
  const state = { step, label, icon, caption, target, radius, worldRadius, pad, enabled, avoid };
  const num = (n) => (typeof t?.num === 'function' ? t.num(n) : String(n));
  const read = (v) => (typeof v === 'function' ? v() : v ? t(v) : '');

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

  // ── the marker (on the 3D view): the ring under the labels, the badge above them ──
  const under = document.createElement('div');
  under.className = 'pvc-act-marker pvc-act-under';
  under.setAttribute('aria-hidden', 'true');
  under.innerHTML = '<div class="pvc-act-ringbox"><svg class="pvc-act-ring"><rect class="halo"/><rect class="dash"/></svg></div>';
  const marker = document.createElement('div');
  marker.className = 'pvc-act-marker';
  marker.setAttribute('aria-hidden', 'true');
  marker.innerHTML = '<div class="pvc-act-badge"><span class="pvc-act-num"></span><span class="pvc-act-cap"></span></div>';
  const ringHolder = /** @type {HTMLElement} */ (under.querySelector('.pvc-act-ringbox'));
  const ring = /** @type {SVGSVGElement} */ (under.querySelector('.pvc-act-ring'));
  const rects = [...under.querySelectorAll('rect')];
  const badge = /** @type {HTMLElement} */ (marker.querySelector('.pvc-act-badge'));
  const mNum = /** @type {HTMLElement} */ (marker.querySelector('.pvc-act-num'));
  const mCap = /** @type {HTMLElement} */ (marker.querySelector('.pvc-act-cap'));
  layer.append(marker);
  const stageEl = layer.closest('.pvc-stage') || layer.parentElement;
  const anno = ringLayer || stageEl?.querySelector('.pvc-anno-layer');
  if (anno?.parentElement) anno.parentElement.insertBefore(under, anno);
  else layer.before(under);
  for (const el of [under, marker, button]) el.classList.toggle('still', !pulse);
  if (!onAct) badge.classList.add('passive'); // a sign only: touches go straight through to the part

  function act() {
    if (state.enabled && onAct) onAct();
  }

  // the button: a click (also Enter and Space); with trigger 'pointerdown' it acts as the finger goes down
  let pressedAt = -1;
  button.addEventListener('pointerdown', (e) => {
    if (trigger !== 'pointerdown' || e.button > 0) return;
    pressedAt = performance.now();
    act();
  });
  button.addEventListener('click', (e) => {
    // a click that follows a pointerdown that already acted is the same press (keyboard clicks have detail 0)
    if (trigger === 'pointerdown' && e.detail > 0 && performance.now() - pressedAt < 1500) return;
    act();
  });

  // the badge: a real tap acts; a drag that starts on it is handed on to what is under it
  /** @type {{ id: number, x: number, y: number, at: number, type: string, gone: boolean } | null} */
  let press = null;
  badge.addEventListener('pointerdown', (e) => {
    if (!onAct || e.button > 0) return;
    e.stopPropagation();
    if (trigger === 'pointerdown') return act();
    press = { id: e.pointerId, x: e.clientX, y: e.clientY, at: performance.now(), type: e.pointerType, gone: false };
    capturePointer(badge, e.pointerId);
  });
  badge.addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.id || press.gone) return;
    if (Math.hypot(e.clientX - press.x, e.clientY - press.y) <= TAP.move) return;
    // not a tap: give the gesture to whatever is under the badge, from where it started
    press.gone = true;
    releasePointer(badge, press.id);
    badge.style.pointerEvents = 'none';
    const below = document.elementFromPoint(press.x, press.y);
    badge.style.pointerEvents = '';
    const init = {
      pointerId: press.id,
      pointerType: press.type,
      isPrimary: true,
      bubbles: true,
      cancelable: true,
      composed: true,
      button: 0,
      buttons: 1,
    };
    below?.dispatchEvent(new PointerEvent('pointerdown', { ...init, clientX: press.x, clientY: press.y }));
    below?.dispatchEvent(new PointerEvent('pointermove', { ...init, clientX: e.clientX, clientY: e.clientY }));
  });
  const endPress = (e) => {
    if (!press || e.pointerId !== press.id) return;
    const tap =
      !press.gone &&
      e.type === 'pointerup' &&
      Math.hypot(e.clientX - press.x, e.clientY - press.y) <= TAP.move &&
      performance.now() - press.at <= TAP.ms;
    releasePointer(badge, press.id);
    press = null;
    if (tap) act();
  };
  badge.addEventListener('pointerup', endPress);
  badge.addEventListener('pointercancel', endPress);

  let drawn = ''; // what the button shows now, so a figure can call set() every frame for nothing
  function render() {
    const words = read(state.label);
    const n = state.step == null || state.step === '' ? '' : num(state.step);
    const cap = read(state.caption);
    const key = `${words}|${n}|${cap}|${state.enabled}|${state.icon}`;
    if (key === drawn) return;
    drawn = key;
    bText.textContent = words;
    button.setAttribute('aria-label', words);
    bNum.textContent = n;
    mNum.textContent = n;
    mCap.textContent = cap;
    bNum.hidden = !n;
    badge.classList.toggle('empty', !n);
    bIcon.innerHTML = state.icon || '';
    button.disabled = !state.enabled;
    badgeSize = 0; // measured again
    stage.invalidate();
  }

  // ── where the marker goes ──
  const hiddenBy = new Set(); // reasons the marker is hidden: 'drag', 'quiz', or the figure's own (a set)
  const v = new THREE.Vector3();
  const w = new THREE.Vector3();
  const box3 = new THREE.Box3();
  let angle = -1; // the badge keeps its place round the ring while that stays clear
  let shown = false;
  let ringSize = '';
  let badgeSize = 0; // the badge's width, measured once (again after a resize or new words)
  /** @type {Box | null} */
  let badgeBox = null; // where the badge was put last (canvas pixels)

  function project(p) {
    v.copy(p).project(stage.camera);
    return { x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height, ok: v.z < 1 && v.z > -1 };
  }

  /** The ring on the screen ({ cx, cy, w, h } in canvas pixels), or null when there is nothing to show. */
  function geometry() {
    if (hiddenBy.size || !state.enabled) return null;
    const tg = state.target?.();
    if (!tg) return null;
    let g;
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
      g = { cx: c.x, cy: c.y, w: d, h: d };
    } else {
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
      g = { cx: (l + r) / 2, cy: (tp + b) / 2, w: Math.max(MIN_RING, r - l + 2 * p), h: Math.max(MIN_RING, b - tp + 2 * p) };
    }
    return g.cx < 0 || g.cx > stage.width || g.cy < 0 || g.cy > stage.height ? null : g;
  }

  /** Boxes (canvas pixels) the badge must keep clear of (reads only: no writes in between). */
  function avoidBoxes(origin) {
    const out = [];
    const add = (it) => {
      if (!it) return;
      if (Array.isArray(it)) return it.forEach(add);
      if (typeof it === 'function') return add(it());
      if (!(it instanceof Element)) return out.push(it);
      const r = it.getBoundingClientRect();
      if (!r.width || it.closest('[hidden]')) return;
      const seen = it.checkVisibility
        ? it.checkVisibility({ opacityProperty: true, visibilityProperty: true })
        : getComputedStyle(it).visibility !== 'hidden';
      if (!seen) return;
      out.push({ left: r.left - origin.left, top: r.top - origin.top, right: r.right - origin.left, bottom: r.bottom - origin.top });
    };
    add(state.avoid);
    return out;
  }

  /**
   * The badge's centre for ANGLES[i]: on the ring's outline (a stadium: straight sides, round ends), then moved
   * outward by `out` px, so it sits just outside the ring instead of over the part.
   */
  function besideRing(g, i, out) {
    const a = (ANGLES[i] * Math.PI) / 180;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const rr = Math.min(g.w, g.h) / 2;
    const run = (Math.max(g.w, g.h) - Math.min(g.w, g.h)) / 2;
    const sx = Math.abs(c) < 1e-6 ? 0 : Math.sign(c);
    const sy = Math.abs(s) < 1e-6 ? 0 : Math.sign(s);
    const p = g.w >= g.h ? { x: g.cx + sx * run + rr * c, y: g.cy + rr * s } : { x: g.cx + rr * c, y: g.cy + sy * run + rr * s };
    return { x: p.x + out * c, y: p.y + out * s };
  }

  function setShown(on) {
    if (on === shown) return;
    shown = on;
    under.classList.toggle('in', on);
    marker.classList.toggle('in', on);
    button.classList.toggle('live', on);
  }

  function place() {
    const g = geometry();
    if (!g) return setShown(false);
    // reads first (the badge's size, the boxes to avoid), writes last: no forced layout in between
    if (!badgeSize) badgeSize = badge.offsetWidth || 46;
    const B = badgeSize;
    const origin = stage.canvas.getBoundingClientRect();
    const keep = avoidBoxes(origin);
    const out = B * 0.38; // the disc (38 of 46 px) just clears the dashed line
    const boxAt = (i) => {
      const p = besideRing(g, i, out);
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
    badgeBox = b;
    // writes
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
    ringHolder.style.transform = `translate(${g.cx - Math.round(g.w) / 2 - 3}px, ${g.cy - Math.round(g.h) / 2 - 3}px)`;
    badge.style.transform = `translate(${b.left}px, ${b.top}px)`;
    setShown(true);
  }
  const offRender = stage.onAfterRender(place);
  const offResize = stage.onResize(() => {
    badgeSize = 0;
    stage.invalidate();
  });

  // ── hidden while a finger or the mouse drags on the view (the figure's drag, or turning the camera) ──
  /** @type {{ id: number, x: number, y: number } | null} */
  let down = null;
  const onDown = (e) => {
    if (badge.contains(e.target)) return;
    down = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const onMove = (e) => {
    if (!down || e.pointerId !== down.id || hiddenBy.has('drag')) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > TAP.move) hide('drag');
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

  /** Hide the marker on the 3D view (the button stays) until show(reason). Reasons are a set: one show clears one. */
  function hide(reason = 'figure') {
    hiddenBy.add(reason);
    setShown(false);
    stage.invalidate();
  }
  function show(reason = 'figure') {
    hiddenBy.delete(reason);
    stage.invalidate();
  }

  const visible = () => shown && !marker.closest('.pvc[data-mode="quiz"]');
  let flashTimer = 0;
  render();

  return {
    button,
    marker,
    badge,
    ring,
    /**
     * Change the step number, the words, the caption under the badge, the icon, the target, the ring's size, whether
     * it can be used, or what the badge keeps clear of. The words are read again (a function label follows the figure).
     * @param {ActionChange} [change]
     */
    set(change = {}) {
      let moved = false;
      for (const [k, value] of Object.entries(change))
        if (value !== undefined && k in state && state[k] !== value) {
          state[k] = value;
          if (k !== 'step' && k !== 'label' && k !== 'icon' && k !== 'caption') moved = true;
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
      return visible();
    },
    get step() {
      return state.step;
    },
    get enabled() {
      return state.enabled;
    },
    /** The badge's box on the 3D view (canvas pixels) while it shows, else null: e.g. for the figure's labels. */
    box() {
      return visible() && badgeBox ? { ...badgeBox } : null;
    },
    /**
     * The ring's box on the 3D view (canvas pixels, worked out now) while the marker shows, else null: give it to the
     * labels' avoid lists (createAnnotations({ avoid: [() => action.ringBox()] })) so no label sits on the ring.
     */
    ringBox() {
      if (!visible()) return null;
      const g = geometry();
      return g ? { left: g.cx - g.w / 2 - 3, top: g.cy - g.h / 2 - 3, right: g.cx + g.w / 2 + 3, bottom: g.cy + g.h / 2 + 3 } : null;
    },
    dispose() {
      clearTimeout(flashTimer);
      offRender();
      offResize();
      stageEl?.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
      window.removeEventListener('pointercancel', onUp, true);
      button.remove();
      marker.remove();
      under.remove();
    },
  };
}
