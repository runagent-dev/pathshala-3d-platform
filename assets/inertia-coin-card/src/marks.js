// Helpers drawn over the scene (none of them is exported to the GLB):
//   createArrow: a bold, white-rimmed velocity arrow lying along x (it turns round for a negative speed);
//   createTags: two-line labels ("which part" / "what it does") pinned to 3D points, placed in screen space each
//   frame: several spots round the point are tried and the one that covers least of the obstacles (the passenger,
//   the arrows, the corner buttons, the other label) wins; it keeps its spot while that stays good, so labels do
//   not jump about. A short leader line joins the label to its point.
import * as THREE from 'three';
import { createBoldArrow } from './arrow.js';

/**
 * A velocity arrow along +x from its group's origin, bold and white-rimmed (./arrow.js); set(v, scale) shows a speed v
 * (m/s) as v·scale metres, pointing along −x for a negative v (hidden near zero).
 */
export function createArrow(color, radius) {
  const bold = createBoldArrow({
    color,
    name: 'SpeedArrow',
    radius,
    head: radius * 5,
    headRadius: radius * 2.4,
    rim: radius * 0.42,
    segments: 14,
  });
  const group = new THREE.Group();
  group.userData.noExport = true;
  group.add(bold.root);
  const origin = new THREE.Vector3();
  const dir = new THREE.Vector3(1, 0, 0);
  let sign = 1;
  const arrow = {
    group,
    length: 0,
    /** Show speed v (m/s, the sign is the direction along x) as an arrow v·scale long. */
    set(v, scale) {
      const length = Math.abs(v) * scale;
      arrow.length = length;
      group.visible = length > radius * 3;
      if (!group.visible) return;
      sign = v < 0 ? -1 : 1;
      dir.set(sign, 0, 0);
      bold.set(origin, dir, length);
    },
    /** The world point at fraction k of the arrow (0: tail, 1: tip). */
    pointAt(k, out = new THREE.Vector3()) {
      return out.set(sign * arrow.length * k, 0, 0).applyMatrix4(group.matrixWorld);
    },
  };
  return arrow;
}

const SVG = 'http://www.w3.org/2000/svg';

/**
 * @param {{ stage: any, layer: HTMLElement, obstacles: () => Array<{x:number,y:number,w:number,h:number}> }} o
 *   obstacles: boxes in stage pixels that labels should not cover.
 */
export function createTags({ stage, layer, obstacles }) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.classList.add('in-tag-lines');
  layer.append(svg);
  const tags = new Map();
  const v = new THREE.Vector3();

  /**
   * color: the arrow's colour (the chip's edge, the leader line); ink: a deeper shade for the words (4.5:1 on the
   * white chip). small: a one-line label; optional: left out when every spot would cover something.
   */
  function add(id, { color, ink = color, prefer, small = false, optional = false }) {
    const el = document.createElement('div');
    el.className = small ? 'in-tag in-tag-small' : 'in-tag';
    el.style.setProperty('--c', color);
    el.style.setProperty('--ci', ink);
    el.hidden = true;
    layer.append(el);
    const line = document.createElementNS(SVG, 'line');
    line.setAttribute('stroke', color);
    const dot = document.createElementNS(SVG, 'circle');
    dot.setAttribute('r', '3.5');
    dot.setAttribute('fill', color);
    svg.append(line, dot);
    tags.set(id, { el, line, dot, prefer, optional, html: '', anchor: null, last: -1, w: 0, h: 0, box: null, w8: {} });
  }

  /** Show tag `id` with this HTML at the 3D point anchor() (or hide it: html null). */
  function set(id, html, anchor) {
    const it = tags.get(id);
    const on = html != null;
    if (on && html !== it.html) {
      it.el.innerHTML = html;
      it.html = html;
      it.w = it.h = 0;
    }
    it.anchor = on ? anchor : null;
    if (it.el.hidden === on) {
      it.el.hidden = !on;
      it.last = -1;
    }
    stage.invalidate();
  }

  const overlap = (a, b) =>
    Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

  /** Spots for a w×h label round point p: [name, left, top]. */
  function spots(p, w, h, prefer) {
    const g = 16;
    const all = {
      right: [p.x + g, p.y - h / 2],
      left: [p.x - g - w, p.y - h / 2],
      above: [p.x - w / 2, p.y - g - h],
      below: [p.x - w / 2, p.y + g],
      'above-right': [p.x + g * 0.6, p.y - g * 0.6 - h],
      'above-left': [p.x - g * 0.6 - w, p.y - g * 0.6 - h],
      'below-right': [p.x + g * 0.6, p.y + g * 0.6],
      'below-left': [p.x - g * 0.6 - w, p.y + g * 0.6],
      'far-above': [p.x - w / 2, p.y - 2.6 * g - h],
      'far-below': [p.x - w / 2, p.y + 2.6 * g],
      'far-right': [p.x + 2.6 * g, p.y - h / 2],
      'far-left': [p.x - 2.6 * g - w, p.y - h / 2],
    };
    const names = [...prefer, ...Object.keys(all).filter((n) => !prefer.includes(n))];
    return names.map((n) => [n, ...all[n]]);
  }

  // the DOM is written only where a value changed (this runs after every frame drawn)
  const write = (it, key, value, fn) => {
    if (it.w8[key] === value) return;
    it.w8[key] = value;
    fn(value);
  };
  let viewBox = '';
  function update() {
    const W = stage.width;
    const H = stage.height;
    const vb = `0 0 ${W} ${H}`;
    if (vb !== viewBox) svg.setAttribute('viewBox', (viewBox = vb));
    const any = [...tags.values()].some((it) => it.anchor);
    const blocks = any ? obstacles() : [];
    const placed = [];
    for (const it of tags.values()) {
      if (!it.anchor) {
        it.box = null;
        write(it, 'lineVis', 'hidden', (x) => (it.line.style.visibility = it.dot.style.visibility = x));
        continue;
      }
      v.copy(it.anchor()).project(stage.camera);
      const p = { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
      const ok = v.z > -1 && v.z < 1 && p.x > -40 && p.x < W + 40 && p.y > -40 && p.y < H + 40;
      if (!it.w) {
        it.w = it.el.offsetWidth;
        it.h = it.el.offsetHeight;
      }
      let best = null;
      let bestScore = Infinity;
      spots(p, it.w, it.h, it.prefer).forEach(([name, x, y], k) => {
        const box = { x, y, w: it.w, h: it.h };
        let score = k * 3 + (name === it.last ? -40 : 0);
        const out = Math.max(0, 6 - x) + Math.max(0, x + it.w - (W - 6)) + Math.max(0, 6 - y) + Math.max(0, y + it.h - (H - 6));
        score += out * 60;
        for (const b of blocks) score += overlap(box, b) * 1.5;
        for (const b of placed) score += overlap(box, b) * 3;
        if (score < bestScore) {
          bestScore = score;
          best = { name, box };
        }
      });
      const { box } = best;
      // keep it inside the view
      box.x = Math.min(Math.max(box.x, 4), W - box.w - 4);
      box.y = Math.min(Math.max(box.y, 4), H - box.h - 4);
      // a label that may be left out is, when no spot is free (the panel and the other labels still say it)
      // (it may touch the edge of an obstacle's box a little, never another label)
      const crowded = it.optional && (placed.some((b) => overlap(box, b) > 0) || blocks.some((b) => overlap(box, b) > 0.12 * box.w * box.h));
      const shown = ok && !crowded;
      it.last = best.name;
      it.box = shown ? box : null;
      if (shown) placed.push(box);
      const vis = shown ? 'visible' : 'hidden';
      write(it, 'tf', `translate(${Math.round(box.x)}px, ${Math.round(box.y)}px)`, (x) => (it.el.style.transform = x));
      write(it, 'vis', vis, (x) => (it.el.style.visibility = x));
      // the leader line: from the point to the nearest spot on the label's edge
      const r1 = (x) => Math.round(x * 10) / 10;
      const ex = Math.min(Math.max(p.x, box.x), box.x + box.w);
      const ey = Math.min(Math.max(p.y, box.y), box.y + box.h);
      write(it, 'line', `${r1(p.x)} ${r1(p.y)} ${r1(ex)} ${r1(ey)}`, () => {
        it.line.setAttribute('x1', r1(p.x));
        it.line.setAttribute('y1', r1(p.y));
        it.line.setAttribute('x2', r1(ex));
        it.line.setAttribute('y2', r1(ey));
        it.dot.setAttribute('cx', r1(p.x));
        it.dot.setAttribute('cy', r1(p.y));
      });
      write(it, 'lineVis', vis, (x) => (it.line.style.visibility = it.dot.style.visibility = x));
    }
  }
  stage.onAfterRender(update);
  // a new size may change the labels' font (wide frames use a larger one): measure them again
  stage.onResize(() => {
    for (const it of tags.values()) it.w = it.h = 0;
  });

  return {
    add,
    set,
    update,
    /** The label boxes now on screen (stage pixels), for tests and for other overlays to avoid. */
    boxes: () => [...tags.values()].filter((it) => it.anchor && it.box).map((it) => it.box),
  };
}
