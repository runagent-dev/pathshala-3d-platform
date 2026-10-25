// Labels pinned to 3D points, with leader lines. Used for part names and tour callouts.
//
//   const anno = createAnnotations({ stage, layer: ui.annoLayer, avoid: [ui.corner, ui.hint] });
//   anno.add('jaw', { text, point: () => worldPoint, dx: 0, dy: -50, kind: 'part' | 'callout', color });
//   anno.setText('jaw', html);              // new words in place (no fade-in again)
//   anno.update('jaw', { dx, dy, text, point, color, spots });
//
// A label with `spots: [{ dx, dy }, …]` (best first) takes the first offset where its box is inside the view and
// clear of the other labels (and their points), of `avoid` given here and of its own `avoid`; it stays there while
// that spot is still clear, so it never jumps about. If no spot is clear it takes the first one, or hides with
// `optional: true`. Labels without `spots` go exactly at dx, dy, as before. `avoid` entries are elements (skipped
// while hidden) or functions returning boxes { left, top, right, bottom } in canvas pixels (e.g. an arrow's ends).
import * as THREE from 'three';

/**
 * @typedef {{ left: number, top: number, right: number, bottom: number }} Box
 * @typedef {Element | (() => Box | Box[] | null | undefined)} Avoid
 * @typedef {{ dx: number, dy: number }} Spot
 * @typedef {{ text?: string, point?: () => THREE.Vector3, dx?: number, dy?: number, color?: string, spots?: Spot[] | null,
 *             avoid?: Avoid[], optional?: boolean }} Change
 */

/**
 * @param {{ stage: any, layer: HTMLElement, avoid?: Avoid[] }} options
 */
export function createAnnotations({ stage, layer, avoid = [] }) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('pvc-anno-lines');
  layer.appendChild(svg);
  const items = new Map(); // id → { el, line, dot, text, point(), dx, dy, kind, spots, spot, avoid, optional, a, box }
  const v = new THREE.Vector3();

  function project(p) {
    v.copy(p).project(stage.camera);
    return { x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height, ok: v.z < 1 && v.z > -1 };
  }

  /** The label's box with its point at a and offset dx, dy, kept inside the view; lx, ly: where its line ends. */
  function boxAt(it, a, dx, dy) {
    const w = it.w || (it.w = it.el.offsetWidth);
    const h = it.h || (it.h = it.el.offsetHeight);
    const anchor = dx < -4 ? 1 : dx > 4 ? 0 : 0.5;
    const x = a.x + dx - w * anchor;
    const y = a.y + dy - h / 2;
    const left = Math.min(Math.max(x, 6), stage.width - w - 6);
    const top = Math.min(Math.max(y, 6), stage.height - h - 6);
    return { left, top, right: left + w, bottom: top + h, lx: left + w * anchor, ly: top + h / 2, inside: left === x && top === y };
  }

  /** Boxes to keep off, in canvas pixels: shown elements and the boxes functions give. */
  function boxesOf(list, out, origin) {
    for (const it of list) {
      if (typeof it === 'function') {
        const b = it();
        if (Array.isArray(b)) out.push(...b.filter(Boolean));
        else if (b) out.push(b);
        continue;
      }
      if (!it) continue;
      const r = it.getBoundingClientRect();
      if (!r.width || getComputedStyle(it).opacity === '0') continue;
      out.push({ left: r.left - origin.left, top: r.top - origin.top, right: r.right - origin.left, bottom: r.bottom - origin.top });
    }
    return out;
  }

  const hits = (b, list) => list.some((r) => b.left < r.right + 3 && b.right > r.left - 3 && b.top < r.bottom + 3 && b.bottom > r.top - 3);

  /** Labels with spots, in the order they were added: each takes the first clear spot (or keeps the one it has). */
  function placeSpotted(list) {
    const origin = layer.getBoundingClientRect();
    const fixed = boxesOf(avoid, [], origin);
    for (const it of items.values()) {
      if (!it.a.ok) continue;
      if (!it.spots) fixed.push(it.box);
      fixed.push({ left: it.a.x - 5, top: it.a.y - 5, right: it.a.x + 5, bottom: it.a.y + 5, of: it });
    }
    for (const it of list) {
      if (!it.a.ok) {
        it.box = boxAt(it, it.a, it.spots[0].dx, it.spots[0].dy); // hidden: its point is behind the camera
        continue;
      }
      const keep = boxesOf(it.avoid, [], origin).concat(fixed.filter((r) => r.of !== it));
      const clear = (i) => {
        const b = boxAt(it, it.a, it.spots[i].dx, it.spots[i].dy);
        return b.inside && !hits(b, keep) ? b : null;
      };
      let box = it.spot >= 0 && it.spot < it.spots.length ? clear(it.spot) : null;
      if (!box) {
        it.spot = -1;
        for (let i = 0; i < it.spots.length && !box; i++) if ((box = clear(i))) it.spot = i;
      }
      it.hidden = !box && it.optional;
      it.box = box || boxAt(it, it.a, it.spots[0].dx, it.spots[0].dy);
      if (!it.hidden) fixed.push(it.box);
    }
  }

  function draw() {
    if (!items.size) return;
    svg.setAttribute('viewBox', `0 0 ${stage.width} ${stage.height}`);
    const spotted = [];
    for (const it of items.values()) {
      it.a = project(it.point());
      it.hidden = false;
      // keep the label box inside the view; the leader line still points at the part
      if (it.spots) spotted.push(it);
      else it.box = boxAt(it, it.a, it.dx, it.dy);
    }
    if (spotted.length) placeSpotted(spotted);
    for (const it of items.values()) {
      const { a, box } = it;
      const shown = a.ok && !it.hidden ? 'visible' : 'hidden';
      it.el.style.transform = `translate(${box.left}px, ${box.top}px)`;
      it.el.style.visibility = shown;
      it.line.setAttribute('x1', a.x);
      it.line.setAttribute('y1', a.y);
      it.line.setAttribute('x2', box.lx);
      it.line.setAttribute('y2', box.ly);
      it.dot.setAttribute('cx', a.x);
      it.dot.setAttribute('cy', a.y);
      it.line.style.visibility = it.dot.style.visibility = shown;
    }
  }
  stage.onAfterRender(draw);

  /** @param {string} id @param {Change & { kind?: string }} options */
  function add(id, { text, point, dx = 0, dy = -50, kind = 'part', color, spots = null, avoid: own = [], optional = false }) {
    remove(id);
    const el = document.createElement('div');
    el.className = `pvc-anno pvc-anno-${kind}`;
    el.innerHTML = text;
    if (color) el.style.setProperty('--c', color);
    layer.appendChild(el);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', kind === 'part' ? '3' : '4');
    line.classList.add(`k-${kind}`);
    dot.classList.add(`k-${kind}`);
    if (color) {
      line.style.stroke = color;
      dot.style.fill = color;
    }
    svg.append(line, dot);
    items.set(id, { el, line, dot, text, point, dx, dy, kind, spots: spots?.length ? spots : null, spot: -1, avoid: own, optional });
    requestAnimationFrame(() => el.classList.add('in'));
    stage.invalidate();
  }

  /**
   * Changes a label in place: it stays shown (no fade-in again). Returns false if there is no such label.
   * @param {string} id
   * @param {Change} change
   */
  function change(id, change) {
    const it = items.get(id);
    if (!it) return false;
    if (change.text != null && change.text !== it.text) {
      it.el.innerHTML = change.text;
      it.text = change.text;
      it.w = it.h = 0; // measured again
    }
    if (change.point) it.point = change.point;
    if (change.dx != null) it.dx = change.dx;
    if (change.dy != null) it.dy = change.dy;
    if (change.color) {
      it.el.style.setProperty('--c', change.color);
      it.line.style.stroke = change.color;
      it.dot.style.fill = change.color;
    }
    if (change.spots !== undefined) {
      it.spots = change.spots?.length ? change.spots : null;
      it.spot = -1;
    }
    if (change.avoid) it.avoid = change.avoid;
    if (change.optional != null) it.optional = change.optional;
    stage.invalidate();
    return true;
  }

  function remove(id) {
    const it = items.get(id);
    if (!it) return;
    it.el.remove();
    it.line.remove();
    it.dot.remove();
    items.delete(id);
  }

  function clear(kind) {
    for (const [id, it] of items) if (!kind || it.kind === kind) remove(id);
  }

  return {
    add,
    remove,
    clear,
    has: (id) => items.has(id),
    /** New words for a label, in place (it does not fade in again). */
    setText: (id, text) => change(id, { text }),
    /**
     * Changes a label's dx, dy, text, point, color, spots, avoid or optional in place. Without arguments: places
     * every label again now (it also happens after each frame).
     * @param {string} [id]
     * @param {Change} [patch]
     */
    update: (id, patch) => (id == null ? (draw(), true) : change(id, patch || {})),
    /** The label's box as last drawn ({ left, top, right, bottom } in canvas pixels), or null. */
    box(id) {
      const b = items.get(id)?.box;
      return b ? { left: b.left, top: b.top, right: b.right, bottom: b.bottom } : null;
    },
  };
}
