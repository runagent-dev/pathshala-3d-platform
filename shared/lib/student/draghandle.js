// A visible handle on a part the student can drag: a white disc pinned to a 3D point, with arrows along the way the part
// moves, a faint dashed track showing its range, a short word and a gentle pulse until the first drag. Without it a
// student who has not tried dragging never finds out that the part moves.
//
//   const paperHandle = createDragHandle(stage, {
//     point: () => paperFoot,                     // a Vector3, or a function returning one (it may be reused)
//     axis: 'x',                                  // 'x' | 'y' arrows along `direction`; 'turn' a curved arrow
//     direction: RAIL,                            // the 3D direction (or () => Vector3); default: along the track
//     track: { from: () => railNear, to: () => railFar },   // the range, drawn faintly; optional (`via`: a curved one)
//     label: t('drag_me'),                        // the word shown until the first drag; optional
//     aria: t('aria_paper'),
//     pulse: Boolean(o.coach),
//     when: () => canDrag(),                      // read after every frame; optional
//   });
//   anno = createAnnotations({ …, avoid: [() => paperHandle.box()] });
//
// Two ways to use it. A figure that already has a drag handler on `ui.canvasHost` keeps it: the handle lives inside
// the canvas host, so the pointer events reach that handler. Add `if (paperHandle.hit(x, y)) return 'paper'` to its
// picking and call `paperHandle.markUsed()` when a drag starts. A new figure passes onStart / onMove / onEnd instead,
// and the handle takes the pointer itself.
//
// Keyboard: the handle is a button in the tab order. With `onKey(dir, event)` it answers the arrows itself (dir is
// +1 for → and ↑, -1 for ← and ↓); without it the key goes on to the figure's own keydown listener.
//
// The handle hides during the test (`.pvc[data-mode="quiz"]`) unless `quiz: true`, and while its point is behind
// the camera. Placed after every frame (it works with render on demand); `update()` places it at once.
import * as THREE from 'three';
import { svg } from './icons.js';
import { capturePointer, releasePointer } from './pointer.js';

/**
 * @typedef {{ left: number, top: number, right: number, bottom: number }} Box
 * @typedef {THREE.Vector3 | (() => THREE.Vector3)} Point
 * @typedef {{ x: number, y: number, dx: number, dy: number, along: number, event: PointerEvent }} DragMove
 *   canvas pixels; dx, dy from where the drag began; along: the part of that in the handle's direction on the screen
 * @typedef {{ layer?: HTMLElement | null, point: Point, axis?: 'x' | 'y' | 'turn', direction?: Point | null,
 *             track?: { from: Point, to: Point, via?: Point } | null, label?: string, labelAt?: 'below' | 'above' | 'left' | 'right' | null,
 *             aria?: string, pulse?: boolean, when?: (() => boolean) | null, quiz?: boolean,
 *             onStart?: ((drag: DragMove) => any) | null, onMove?: ((drag: DragMove) => any) | null,
 *             onEnd?: ((drag: DragMove) => any) | null, onKey?: ((dir: number, event: KeyboardEvent) => any) | null }} Options
 */

const HIT = 46; // px across: the button, a finger's target round the 30 px disc
const EDGE = 2; // px: the button stays this far inside the view
const SAMPLES = 5; // boxes along the track, for labels to keep off it
const TRACK_PAD = 6; // px round each of them
const MOVED = 4; // px: less than this is a tap, not a drag

const ARROWS = {
  line: svg('<path d="M4 12h16M8.2 7.8 4 12l4.2 4.2M15.8 7.8 20 12l-4.2 4.2"/>'),
  turn: svg('<path d="M5 15.5a8 8 0 0 1 14 0M4.2 10.7 5 15.5l4.7-1.2M19.8 10.7 19 15.5l-4.7-1.2"/>'),
};
const OTHER = { below: 'above', above: 'below', right: 'left', left: 'right' };
const KEYS = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };

/**
 * @param {any} stage
 * @param {Options} options
 */
export function createDragHandle(
  stage,
  {
    layer = null,
    point,
    axis = 'x',
    direction = null,
    track = null,
    label = '',
    labelAt = null,
    aria = '',
    pulse = true,
    when = null,
    quiz = false,
    onStart = null,
    onMove = null,
    onEnd = null,
    onKey = null,
  },
) {
  const host = layer || stage.canvas.parentElement;
  const read = (/** @type {Point} */ p) => (typeof p === 'function' ? p() : p);

  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'pvc-dh';
  el.hidden = true;
  if (aria) {
    el.setAttribute('aria-label', aria);
    el.title = aria;
  }
  el.innerHTML = `<span class="pvc-dh-disc">${axis === 'turn' ? ARROWS.turn : ARROWS.line}</span>${label ? '<span class="pvc-dh-word"></span>' : ''}`;
  const disc = /** @type {HTMLElement} */ (el.firstElementChild);
  const glyph = /** @type {SVGElement} */ (disc.firstElementChild);
  const word = /** @type {HTMLElement | null} */ (el.querySelector('.pvc-dh-word'));
  if (word) word.textContent = label;
  el.classList.toggle('pulse', pulse);

  let line = null;
  let halo = null;
  let lineEl = null;
  if (track) {
    lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    lineEl.classList.add('pvc-dh-track');
    lineEl.setAttribute('aria-hidden', 'true');
    lineEl.style.display = 'none';
    halo = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    halo.classList.add('halo');
    line.classList.add('dash');
    lineEl.append(halo, line);
    host.appendChild(lineEl);
  }
  host.appendChild(el);

  const v = new THREE.Vector3();
  const a = { x: 0, y: 0, ok: false };
  const c = { x: 0, y: 0, ok: false };
  const e0 = { x: 0, y: 0, ok: false }; // the track's ends, and the curve's control point
  const e1 = { x: 0, y: 0, ok: false };
  const em = { x: 0, y: 0, ok: false };
  const at = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const unit = { x: 1, y: 0 }; // the direction on the screen
  let off = false;
  let shown = false;
  let used = false;
  let px = NaN;
  let py = NaN;
  let drawnAngle = NaN;
  let side = '';
  let trackOn = false;
  let drawnTrack = '';
  let wordW = 0;
  let wordH = 0;
  const boxes = Array.from({ length: SAMPLES + 1 }, () => ({ left: 0, top: 0, right: 0, bottom: 0 }));
  const list = [boxes[0]];
  const none = [];

  /** @param {THREE.Vector3} p @param {{ x: number, y: number, ok: boolean }} out */
  function project(p, out) {
    v.copy(p).project(stage.camera);
    out.x = (v.x * 0.5 + 0.5) * stage.width;
    out.y = (-v.y * 0.5 + 0.5) * stage.height;
    out.ok = v.z < 1 && v.z > -1;
  }

  /** The way along the screen: a small step along the 3D direction from the point, projected. */
  function aim(p) {
    if (direction) dir.copy(read(direction));
    else if (track) dir.copy(read(track.to)).sub(read(track.from));
    else dir.set(axis === 'y' ? 0 : 1, axis === 'y' ? 1 : 0, 0);
    if (dir.lengthSq() < 1e-12) return;
    dir
      .normalize()
      .multiplyScalar(stage.camera.position.distanceTo(p) * 0.04)
      .add(p);
    project(dir, c);
    const dx = c.x - a.x;
    const dy = c.y - a.y;
    const l = Math.hypot(dx, dy);
    if (!c.ok || l < 0.5) return; // pointing straight at the camera: keep the last way
    unit.x = dx / l;
    unit.y = dy / l;
  }

  /** @param {string} at */
  function fits(at) {
    if (at === 'below') return py + HIT / 2 + wordH + 4 < stage.height;
    if (at === 'above') return py - HIT / 2 - wordH - 4 > 0;
    if (at === 'right') return px + HIT / 2 + wordW + 4 < stage.width;
    return px - HIT / 2 - wordW - 4 > 0;
  }

  function placeWord() {
    if (!word || used) return;
    if (!wordW) {
      wordW = word.offsetWidth;
      wordH = word.offsetHeight;
    }
    // beside the track, not on it; the other side when there is no room
    /** @type {string} */
    let want = labelAt || (Math.abs(unit.y) > 0.7 ? 'right' : 'below');
    if (!fits(want) && fits(OTHER[want])) want = OTHER[want];
    if (want !== side) {
      side = want;
      word.dataset.side = want;
    }
  }

  function setShown(on) {
    if (on === shown) return;
    shown = on;
    el.hidden = !on;
    if (!on) {
      px = py = NaN;
      if (document.activeElement === el) el.blur();
    }
  }

  function setTrack(on) {
    if (on === trackOn || !lineEl) return;
    trackOn = on;
    lineEl.style.display = on ? '' : 'none';
  }

  function place() {
    const p = at.copy(read(point)); // a copy: the figure's point and the track's may be one reused vector
    project(p, a);
    const on = !off && a.ok && (!when || when()) && (quiz || !el.closest('.pvc[data-mode="quiz"]'));
    setShown(on);
    if (!on) return setTrack(false);
    aim(p);
    const half = HIT / 2 + EDGE;
    const x = Math.round(Math.min(Math.max(a.x, half), stage.width - half));
    const y = Math.round(Math.min(Math.max(a.y, half), stage.height - half));
    if (x !== px || y !== py) {
      px = x;
      py = y;
      el.style.transform = `translate(${x - HIT / 2}px, ${y - HIT / 2}px)`;
    }
    const angle = Math.round((Math.atan2(unit.y, unit.x) * 180) / Math.PI);
    if (angle !== drawnAngle) {
      drawnAngle = angle;
      glyph.style.transform = `rotate(${angle}deg)`;
    }
    placeWord();
    if (track) placeTrack();
  }

  function placeTrack() {
    project(read(track.from), e0);
    project(read(track.to), e1);
    let ok = e0.ok && e1.ok;
    if (track.via) {
      project(read(track.via), em);
      ok = ok && em.ok;
    } else {
      em.x = (e0.x + e1.x) / 2;
      em.y = (e0.y + e1.y) / 2;
    }
    setTrack(ok);
    if (!trackOn) return;
    // through the middle point: the curve's control point lies twice as far from the chord
    em.x = 2 * em.x - (e0.x + e1.x) / 2;
    em.y = 2 * em.y - (e0.y + e1.y) / 2;
    const d = `M${e0.x.toFixed(1)} ${e0.y.toFixed(1)}Q${em.x.toFixed(1)} ${em.y.toFixed(1)} ${e1.x.toFixed(1)} ${e1.y.toFixed(1)}`;
    if (d !== drawnTrack) {
      drawnTrack = d;
      halo.setAttribute('d', d);
      line.setAttribute('d', d);
    }
  }

  const remove = stage.onAfterRender(place);

  function markUsed() {
    if (used) return;
    used = true;
    el.classList.add('used');
    el.classList.remove('pulse');
    word?.remove();
    stage.invalidate();
  }

  /** @param {PointerEvent} e */
  const inCanvas = (e) => {
    const r = stage.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  /** @type {{ id: number, x: number, y: number } | null} */
  let drag = null;
  const move = (/** @type {PointerEvent} */ event) => {
    const { x, y } = inCanvas(event);
    const dx = x - drag.x;
    const dy = y - drag.y;
    return { x, y, dx, dy, along: dx * unit.x + dy * unit.y, event };
  };
  el.addEventListener('pointerdown', (e) => {
    if (!onStart && !onMove && !onEnd) return; // the figure's own handler on the canvas host has it
    e.stopPropagation();
    e.preventDefault();
    drag = { id: e.pointerId, ...inCanvas(e) };
    capturePointer(el, e.pointerId);
    onStart?.(move(e));
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    e.stopPropagation();
    const m = move(e);
    if (Math.hypot(m.dx, m.dy) >= MOVED) markUsed();
    onMove?.(m);
  });
  const end = (/** @type {PointerEvent} */ e) => {
    if (!drag || e.pointerId !== drag.id) return;
    e.stopPropagation();
    const m = move(e);
    releasePointer(el, e.pointerId);
    drag = null;
    onEnd?.(m);
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  // a mouse press must not take the keyboard's focus: Space and Enter stay the figure's
  el.addEventListener('mousedown', (e) => e.preventDefault());
  el.addEventListener('keydown', (e) => {
    const step = KEYS[e.key];
    if (!step || !onKey) return;
    e.preventDefault();
    e.stopPropagation();
    markUsed();
    onKey(step, e);
  });

  return {
    /** The button itself (e.g. to focus it). */
    el,
    show() {
      off = false;
      place();
      stage.invalidate();
    },
    hide() {
      off = true;
      place();
    },
    /** Places it now (it also happens after each frame). */
    update: place,
    /** Whether the handle shows now. */
    get visible() {
      return shown;
    },
    /** Whether the point (canvas pixels) is on the handle's target. False while it is hidden. */
    hit: (/** @type {number} */ x, /** @type {number} */ y) => shown && Math.abs(x - px) <= HIT / 2 && Math.abs(y - py) <= HIT / 2,
    /** The first drag happened: no word and no pulse any more, a smaller disc. Dragging through the handle does it. */
    markUsed,
    /** Back to the first-time look (the figure was reset). */
    rearm() {
      used = false;
      el.classList.remove('used');
      el.classList.toggle('pulse', pulse);
      if (word && !word.isConnected) el.appendChild(word);
      stage.invalidate();
    },
    /**
     * Boxes to keep labels off, in canvas pixels: the handle with its word and points along the track. Empty while
     * hidden. For `avoid` lists of createAnnotations and createAction; the same arrays are used again each call.
     * @returns {Box[]}
     */
    box() {
      if (!shown) return none;
      const r = boxes[0];
      const d = 17; // the disc and a little air
      r.left = px - d;
      r.right = px + d;
      r.top = py - d;
      r.bottom = py + d;
      if (word && !used) {
        const w = wordW / 2;
        const gap = HIT / 2;
        if (side === 'right') r.right = px + gap + wordW;
        else if (side === 'left') r.left = px - gap - wordW;
        else {
          r.left = Math.min(r.left, px - w);
          r.right = Math.max(r.right, px + w);
          if (side === 'below') r.bottom = py + gap + wordH;
          else r.top = py - gap - wordH;
        }
      }
      list.length = 1;
      if (trackOn) {
        for (let i = 1; i <= SAMPLES; i++) {
          const f = (i - 1) / (SAMPLES - 1);
          const q = boxes[i];
          const g = 1 - f;
          const x = g * g * e0.x + 2 * g * f * em.x + f * f * e1.x;
          const y = g * g * e0.y + 2 * g * f * em.y + f * f * e1.y;
          q.left = x - TRACK_PAD;
          q.right = x + TRACK_PAD;
          q.top = y - TRACK_PAD;
          q.bottom = y + TRACK_PAD;
          list.push(q);
        }
      }
      return list;
    },
    dispose() {
      remove();
      el.remove();
      lineEl?.remove();
    },
  };
}
