// Labels pinned to 3D points but placed on the screen: each label tries a few spots round its point (beside an
// arrow, above a nucleus …) and takes the first that is inside the view and clear of the buttons, the notes,
// the things the figure says must stay visible and the labels placed before it. A label that fits nowhere is
// hidden (the panel still says it). A short leader line joins a label to its point when they are apart.
import * as THREE from 'three';

/**
 *   stage, layer
 *   avoid():  DOM elements whose boxes no label may cover (the corner buttons, the legend, the note)
 *   keep():   boxes on the canvas ({ l, t, r, b }) that must stay visible (the moving proton, its arrows …)
 *   soft():   boxes better left uncovered (the nucleus): used only if nothing better is free
 */
export function createTags({ stage, layer, avoid = () => [], keep = () => [], soft = () => [] }) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('snf-tag-lines');
  layer.appendChild(svg);
  const tags = new Map();
  const v = new THREE.Vector3();
  let order = [];

  function project(p) {
    v.copy(p).project(stage.camera);
    return { x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height, ok: v.z < 1 && v.z > -1 };
  }
  const hit = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
  const area = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));

  /**
   * id, { html, color, kind: 'force' | 'name', point: () => Vector3 | null, spots: [{ x, y, ax, ay, pt? }], priority,
   *       leader, leadFrom: 'point' | 'spot' }
   * A spot puts the label's (ax, ay) corner (0 left/top … 1 right/bottom) at the point (or its own pt) + (x, y) px;
   * the leader line starts at the tag's point, or at the chosen spot's own point (leadFrom: 'spot').
   */
  function add(id, { html, color = '', kind = 'name', cls = '', point, spots, priority = 0, leader = kind === 'name', leadFrom = 'point' }) {
    remove(id);
    const el = document.createElement('div');
    el.className = `snf-tag snf-tag-${kind}${cls ? ` ${cls}` : ''}`;
    el.innerHTML = html;
    if (color) el.style.setProperty('--c', color);
    layer.appendChild(el);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '2.6');
    if (color) {
      line.style.stroke = color;
      dot.style.fill = color;
    }
    svg.append(line, dot);
    tags.set(id, { id, el, line, dot, point, spots, priority, leader, leadFrom, w: 0, h: 0, box: null, spot: -1 });
    order = [...tags.values()].sort((a, b) => b.priority - a.priority);
    stage.invalidate();
  }

  function remove(id) {
    const tg = tags.get(id);
    if (!tg) return;
    tg.el.remove();
    tg.line.remove();
    tg.dot.remove();
    tags.delete(id);
    order = [...tags.values()].sort((a, b) => b.priority - a.priority);
  }

  function hide(tg) {
    tg.box = null;
    tg.spot = -1;
    tg.el.style.visibility = 'hidden';
    tg.line.style.visibility = tg.dot.style.visibility = 'hidden';
  }

  function update() {
    if (!tags.size) return;
    const W = stage.width;
    const H = stage.height;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const c = stage.canvas.getBoundingClientRect();
    const hard = [];
    for (const el of avoid()) {
      if (!el || el.hidden) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || getComputedStyle(el).visibility === 'hidden' || getComputedStyle(el).opacity === '0') continue;
      hard.push({ l: r.left - c.left - 4, t: r.top - c.top - 4, r: r.right - c.left + 4, b: r.bottom - c.top + 4 });
    }
    hard.push(...keep());
    const softs = soft();
    for (const tg of order) {
      const p = tg.point();
      if (!p) {
        hide(tg);
        continue;
      }
      let a = project(p);
      if (!a.ok) {
        hide(tg);
        continue;
      }
      if (!tg.w) {
        tg.w = tg.el.offsetWidth;
        tg.h = tg.el.offsetHeight;
      }
      let best = null;
      tg.spots.forEach((s, i) => {
        const q = s.pt ? s.pt() : null; // a spot may hang off another point (e.g. the tip of an arrow)
        const o = q ? project(q) : a;
        const l = o.x + s.x - tg.w * s.ax;
        const t = o.y + s.y - tg.h * s.ay;
        const box = { l, t, r: l + tg.w, b: t + tg.h };
        if (box.l < 4 || box.t < 4 || box.r > W - 4 || box.b > H - 4) return;
        if (hard.some((h) => hit(box, h))) return;
        // the spot it had stays a little preferred, so a label does not flicker between spots as things move
        const score = i * 40 + softs.reduce((sum, sb) => sum + area(box, sb), 0) - (i === tg.spot ? 60 : 0);
        if (!best || score < best.score) best = { box, score, i, o };
      });
      if (!best) {
        hide(tg);
        continue;
      }
      const { box } = best;
      tg.box = box;
      tg.spot = best.i;
      hard.push({ l: box.l - 3, t: box.t - 3, r: box.r + 3, b: box.b + 3 });
      tg.el.style.transform = `translate(${Math.round(box.l)}px, ${Math.round(box.t)}px)`;
      tg.el.style.visibility = 'visible';
      // leader: from the point (or from the spot's own point) to the nearest point of the box
      if (tg.leadFrom === 'spot') a = best.o;
      const nx = Math.min(Math.max(a.x, box.l), box.r);
      const ny = Math.min(Math.max(a.y, box.t), box.b);
      const far = Math.hypot(nx - a.x, ny - a.y) > 8;
      const show = tg.leader && far;
      tg.line.style.visibility = show ? 'visible' : 'hidden';
      tg.dot.style.visibility = tg.leader ? 'visible' : 'hidden';
      tg.line.setAttribute('x1', a.x);
      tg.line.setAttribute('y1', a.y);
      tg.line.setAttribute('x2', nx);
      tg.line.setAttribute('y2', ny);
      tg.dot.setAttribute('cx', a.x);
      tg.dot.setAttribute('cy', a.y);
    }
  }
  stage.onAfterRender(update);

  return {
    add,
    remove,
    clear() {
      for (const id of [...tags.keys()]) remove(id);
    },
    has: (id) => tags.has(id),
    /** Where a label is now on the canvas (null if hidden): for tests and for the camera fit. */
    boxOf: (id) => tags.get(id)?.box ?? null,
    update,
  };
}
