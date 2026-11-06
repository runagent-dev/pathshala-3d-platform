// The view can be turned all the way round, and the student is told so: a dark pill in a corner of the stage, "⟲ ৩৬০° ঘুরিয়ে
// দেখো" until the first turn, then "⟲ ৩৬০°", which stays. Never the arrow alone: a plain circular arrow means reset. It
// looks nothing like a white drag handle.
//
//   const rotate = createRotateCue(stage, {
//     layer: ui.stage,                       // where the badge goes (default: the canvas host's parent)
//     short: `${t.num(360)}°`,               // always shown, beside the arrow
//     label: t('rotate_me'),                 // the words after it, until the first turn: 'ঘুরিয়ে দেখো'
//     pulse: Boolean(o.coach),               // the arrow rocks gently until the first turn
//     when: () => canTurn(),                 // read every frame: no badge where the camera cannot turn
//     polar: [5, 88],                        // degrees from straight overhead: the camera stays above the table
//     zoom: [0.6, 1.8],                      // how far in and out, as a part of the distance when the student took over
//     onTurn: () => turnedByHand(),          // the figure stops guiding the camera
//   });
//   anno = createAnnotations({ …, avoid: [rotate.el] });
//   rotate.home();                           // the figure's guided camera took over again
//
// It also sets the orbit up: no azimuth limits, the polar limits, zoom on, damping on. OrbitControls says `start` on a bare
// tap too, so `onTurn` waits for 8 px of movement (or the wheel). Zoom limits apply only while the student holds the
// view, so a guided flight is never clamped by them. Hidden during the test (`.pvc[data-mode="quiz"]`). `compact: true` starts
// without the words.
import { ICONS } from './icons.js';

/**
 * @typedef {{ layer?: HTMLElement | null, short?: string, label?: string, compact?: boolean, pulse?: boolean, polar?: [number, number],
 *             zoom?: [number, number], onTurn?: (() => any) | null, when?: (() => boolean) | null,
 *             at?: 'top-left' | 'bottom-right' }} Options
 */

/**
 * The pill's face (the arrow and the degrees): the one source for the badge on the 3D view and its miniature in the
 * panel (createHowTo in ./howto.js).
 * @param {string} short e.g. `${t.num(360)}°`
 */
export const rotateFace = (short) => `${ICONS.orbit}<b class="pvc-rc-deg">${short}</b>`;

const TURN_PX = 8; // a press that moves less is a tap, not a turn of the view
const RAD = Math.PI / 180;

/**
 * @param {any} stage
 * @param {Options} [options]
 */
export function createRotateCue(
  stage,
  {
    layer = null,
    short = '360°',
    label = '',
    compact = false,
    pulse = false,
    polar = [5, 88],
    zoom = [0.6, 1.8],
    onTurn = null,
    when = null,
    at = 'top-left',
  } = {},
) {
  const { controls, camera, canvas } = stage;
  controls.minAzimuthAngle = Number.NEGATIVE_INFINITY;
  controls.maxAzimuthAngle = Number.POSITIVE_INFINITY;
  controls.minPolarAngle = polar[0] * RAD;
  controls.maxPolarAngle = polar[1] * RAD;
  controls.enableZoom = true;
  controls.enableDamping = true;

  const host = canvas.parentElement;
  const el = document.createElement('div');
  el.className = `pvc-rc pvc-rc-${at}`;
  el.innerHTML = `${rotateFace('')}${label ? '<span class="pvc-rc-word"></span>' : ''}`;
  el.querySelector('.pvc-rc-deg').textContent = short;
  el.setAttribute('aria-hidden', 'true'); // the stage's own label says it; the badge only shows it
  el.classList.toggle('pulse', pulse);
  el.addEventListener('animationend', () => el.classList.remove('wiggle'));
  const word = el.querySelector('.pvc-rc-word');
  if (word) word.textContent = label;
  (layer || host.parentElement).appendChild(el);

  let used = false;
  let held = false; // the student holds the view now
  let press = null;

  function markUsed() {
    if (used) return;
    used = true;
    el.classList.add('used');
    el.classList.remove('pulse');
  }
  if (compact) markUsed();

  function turned() {
    if (held) return;
    held = true;
    const d = camera.position.distanceTo(controls.target);
    controls.minDistance = d * zoom[0];
    controls.maxDistance = d * zoom[1];
    markUsed();
    onTurn?.();
  }

  const down = (/** @type {PointerEvent} */ e) => {
    press = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };
  const move = (/** @type {PointerEvent} */ e) => {
    if (!press || e.pointerId !== press.id || held || !controls.enabled) return;
    if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > TURN_PX) turned();
  };
  const up = () => {
    press = null;
  };
  const wheel = () => {
    if (controls.enabled) turned();
  };
  host.addEventListener('pointerdown', down, { capture: true });
  host.addEventListener('pointermove', move);
  host.addEventListener('pointerup', up);
  host.addEventListener('pointercancel', up);
  host.addEventListener('wheel', wheel, { capture: true, passive: true });
  const removeTicker = when
    ? stage.addTicker(() => {
        const off = !when();
        if (off !== el.hidden) el.hidden = off;
      })
    : null;

  return {
    /** The badge, for avoid lists. */
    el,
    /** Whether the student holds the view now. */
    get held() {
      return held;
    },
    /** No words from now on. A turn does it. */
    markUsed,
    /** One gentle rock of the arrow now (the panel's how-to row points the student at the badge). */
    wiggle() {
      if (el.hidden) return;
      el.classList.remove('wiggle');
      el.getBoundingClientRect(); // a reflow: the animation starts again
      el.classList.add('wiggle');
    },
    /** The word again (the figure was reset). */
    rearm() {
      used = false;
      el.classList.remove('used');
      el.classList.toggle('pulse', pulse);
    },
    /** The guided camera took over: the zoom limits go, so that no flight is clamped. */
    home() {
      held = false;
      controls.minDistance = 0;
      controls.maxDistance = Number.POSITIVE_INFINITY;
    },
    dispose() {
      removeTicker?.();
      el.remove();
      host.removeEventListener('pointerdown', down, { capture: true });
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerup', up);
      host.removeEventListener('pointercancel', up);
      host.removeEventListener('wheel', wheel, { capture: true });
    },
  };
}
