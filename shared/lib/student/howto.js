// "How to use" in the panel: one small row under the action row that shows each control of the 3D view with a
// miniature of the very same icon (the drag handle's white disc, the "⟲ ৩৬০°" pill, the সামনে button) and a few
// words. Without it a student sees a little white disc on the picture and does not know what it is.
//
//   const howto = createHowTo(ui, t, [
//     { kind: 'drag', axis: 'x', text: t('howto_paper'), handle: paperHandle },   // "what" is moved: the figure says
//     { kind: 'orbit', cue: rotate },                                             // default words: t('howto_orbit')
//     { kind: 'front' },                                                          // default words: t('howto_front')
//   ], { stage, when: () => s.mode !== 'quiz' });
//
// Tapping an item points at its control on the 3D view: a drag item makes its `handle` pulse once, the orbit item rocks
// the `cue`'s arrow, the front item flashes the সামনে button when it shows. `onTap` adds the figure's own answer (a
// `tap` item has nothing else). Each item may have `when` (read with the row's own `when` every frame when `stage` is
// given, or on `update()`): in a step where the part cannot be dragged, that item is hidden but keeps its place, so
// the panel does not change height (put such an item last); `collapse: true` takes it out instead. The row goes when
// its own `when` is false or no item applies.
//
// The kit holds no Bangla: the default words are the figure's keys `howto_orbit`, `howto_front`, `howto_tap` and
// `howto_label` (the row's name for screen readers). A key the figure lacks falls back (orbit: `rotate_me`) or leaves
// the miniature alone, which still says what it is. Hidden in the test. In the tightest phone frame (390×520) only the
// drag item keeps its words.
import { dragDisc } from './draghandle.js';
import { ICONS } from './icons.js';
import { rotateFace } from './rotatecue.js';
import { frontFace } from './shell.js';

/**
 * @typedef {{ kind: 'drag' | 'orbit' | 'front' | 'tap', axis?: 'x' | 'y' | 'turn', text?: string, aria?: string,
 *             handle?: { flash: () => any } | null, cue?: { wiggle: () => any } | null,
 *             when?: (() => boolean) | null, onTap?: (() => any) | null }} HowToItem
 * @typedef {{ stage?: any, when?: (() => boolean) | null, after?: Element | null, collapse?: boolean }} HowToOptions
 */

/** A word from the figure, or '' when it has no such key (t returns the key itself). */
const word = (/** @type {(key: string) => string} */ t, /** @type {string} */ key) => {
  const s = t(key);
  return s && s !== key ? s : '';
};

/**
 * @param {{ learn: Element, $: (s: string) => Element | null }} ui the shell (buildStudentShell)
 * @param {((key: string, vars?: object) => string) & { num?: (x: number) => string }} t
 * @param {HowToItem[]} items
 * @param {HowToOptions} [options]
 */
export function createHowTo(ui, t, items, { stage = null, when = null, after = null, collapse = false } = {}) {
  const el = document.createElement('div');
  el.className = 'pvc-howto';
  el.setAttribute('role', 'group');
  const name = word(t, 'howto_label');
  if (name) el.setAttribute('aria-label', name);

  const deg = `${t.num ? t.num(360) : '360'}°`;
  const rows = items.map((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `pvc-howto-item pvc-howto-${item.kind}`;
    const text =
      item.text ??
      (item.kind === 'orbit'
        ? word(t, 'howto_orbit') || word(t, 'rotate_me')
        : item.kind === 'front'
          ? word(t, 'howto_front')
          : item.kind === 'tap'
            ? word(t, 'howto_tap')
            : '');
    const mini =
      item.kind === 'drag'
        ? `<span class="pvc-howto-mini pvc-howto-dh">${dragDisc(item.axis || 'x')}</span>`
        : item.kind === 'orbit'
          ? `<span class="pvc-howto-mini pvc-howto-rc">${rotateFace(deg)}</span>`
          : item.kind === 'front'
            ? `<span class="pvc-howto-mini pvc-howto-front">${frontFace(word(t, 'view_front_short'))}</span>`
            : `<span class="pvc-howto-mini pvc-howto-tap">${ICONS.hand}</span>`;
    b.innerHTML = `${mini}${text ? '<span class="pvc-howto-word"></span>' : ''}`;
    const w = b.querySelector('.pvc-howto-word');
    if (w) w.textContent = text;
    const aria = item.aria || text || (item.kind === 'front' ? word(t, 'view_front_short') : '');
    if (aria) {
      b.setAttribute('aria-label', aria);
      b.title = aria;
    }
    b.addEventListener('click', () => {
      if (item.kind === 'drag') item.handle?.flash();
      else if (item.kind === 'orbit') item.cue?.wiggle();
      else if (item.kind === 'front') flash(/** @type {HTMLElement | null} */ (ui.$('[data-view="front"]')));
      flash(b);
      item.onTap?.();
    });
    el.appendChild(b);
    return { item, b };
  });

  // under the action row of a clean sheet (cleanSheet in ./shell.js), else at the top of the sheet
  const anchor = after || ui.learn.querySelector('.pvc-act-row');
  if (anchor) anchor.after(el);
  else ui.learn.prepend(el);

  let off = false;
  /** Shows and hides the row and its items from `when`; cheap, so it may run every frame. */
  function update() {
    const row = !off && (!when || when());
    let any = false;
    for (const { item, b } of rows) {
      const on = !item.when || item.when();
      // off in this step: kept in its place (invisible), unless `collapse`, so that the sheet keeps its height
      const gone = collapse && !on;
      if (b.hidden !== gone) b.hidden = gone;
      if (b.classList.contains('off') === on) b.classList.toggle('off', !on);
      if (b.disabled === on) b.disabled = !on;
      any ||= on;
    }
    any &&= row;
    if (el.hidden === any) el.hidden = !any;
  }
  const removeTicker = stage ? stage.addTicker(update) : null;
  update();

  return {
    /** The row. */
    el,
    /** The items' buttons, in order. */
    buttons: rows.map((r) => r.b),
    update,
    show() {
      off = false;
      update();
    },
    hide() {
      off = true;
      update();
    },
    dispose() {
      removeTicker?.();
      el.remove();
    },
  };
}

/** One short flash on an element (restarted on a second tap). */
function flash(/** @type {HTMLElement | null} */ node) {
  if (!node || node.hidden) return;
  node.classList.remove('flash');
  node.getBoundingClientRect(); // a reflow: the animation starts again
  node.classList.add('flash');
  // gone when it has played, so that it never plays again when a hidden button comes back
  node.addEventListener('animationend', () => node.classList.remove('flash'), { once: true });
}
