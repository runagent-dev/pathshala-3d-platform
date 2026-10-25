// What is drawn over the 3D view, in screen space (crisp on a phone): the marker of where a force meets its body
// (a ring on the touching place, a thick line along a touching face, or a dashed bracket across an empty gap) and
// the labels (the force's name beside its arrow, স্পর্শ / ফাঁক beside the marker). Labels are placed every frame:
// several spots round their anchor are tried, the nearest one that covers nothing (the bodies, the arrow, the
// marker, the other label, the corner buttons, the note) and stays inside the view wins; a label that fits
// nowhere is hidden (the panel says the same).
import * as THREE from 'three';

const SVG = 'http://www.w3.org/2000/svg';
const DIRS = {
  right: [1, 0],
  left: [-1, 0],
  up: [0, -1],
  down: [0, 1],
  ur: [0.75, -0.75],
  ul: [-0.75, -0.75],
  dr: [0.75, 0.75],
  dl: [-0.75, 0.75],
};

export function createOverlay({ stage, layer, avoid = () => [] }) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.classList.add('cnf-marks');
  layer.appendChild(svg);
  const ring = document.createElementNS(SVG, 'circle');
  ring.classList.add('cnf-ring');
  ring.setAttribute('r', '15');
  const pulse = document.createElementNS(SVG, 'circle');
  pulse.classList.add('cnf-pulse');
  pulse.setAttribute('r', '15');
  const edge = document.createElementNS(SVG, 'line');
  edge.classList.add('cnf-edge');
  const gap = document.createElementNS(SVG, 'line');
  gap.classList.add('cnf-gap');
  const capA = document.createElementNS(SVG, 'line');
  const capB = document.createElementNS(SVG, 'line');
  capA.classList.add('cnf-cap');
  capB.classList.add('cnf-cap');
  const leaders = [document.createElementNS(SVG, 'line'), document.createElementNS(SVG, 'line')];
  for (const l of leaders) l.classList.add('cnf-leader');
  svg.append(edge, gap, capA, capB, pulse, ring, ...leaders);

  /** @type {{ id: string, el: HTMLElement, w: number, h: number, last: string | null, shown: boolean, rect: any }[]} */
  const labels = [];
  /** @type {{ labels: any[], marker?: () => any, arrow?: () => any, bodies?: () => any[] }} */
  let spec = { labels: [] };
  const v = new THREE.Vector3();

  function project(p) {
    v.copy(p).project(stage.camera);
    return { x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height, ok: v.z > -1 && v.z < 1 };
  }
  const hide = (el) => el.setAttribute('visibility', 'hidden');
  const show = (el) => el.setAttribute('visibility', 'visible');
  const line = (el, a, b) => {
    el.setAttribute('x1', a.x);
    el.setAttribute('y1', a.y);
    el.setAttribute('x2', b.x);
    el.setAttribute('y2', b.y);
  };

  function labelEl(i) {
    if (!labels[i]) {
      const el = document.createElement('div');
      el.className = 'cnf-label';
      layer.appendChild(el);
      labels[i] = { id: '', el, w: 0, h: 0, last: null, shown: false, rect: null, html: '' };
    }
    return labels[i];
  }

  /**
   * Getters, read every frame (the bodies move): marker() → null | { kind: 'contact', at } | { kind: 'edge', a, b } |
   * { kind: 'gap', a, b } (world points); arrow() → { tail, tip } world points or null; bodies() → [{ min, max }]
   * world boxes. labels: [{ id, html, tone: 'force' | 'contact' | 'gap', anchor: 'arrow' | 'marker', prefer: [dir…] }].
   */
  function set(next) {
    spec = next;
    spec.labels.forEach((l, i) => {
      const it = labelEl(i);
      if (it.id !== l.id || it.html !== l.html) {
        it.id = l.id;
        it.html = l.html;
        it.el.innerHTML = l.html;
        it.el.dataset.tone = l.tone;
        it.w = 0;
        it.last = null;
      }
    });
    for (let i = spec.labels.length; i < labels.length; i++) {
      labels[i].el.classList.remove('in');
      labels[i].shown = false;
      labels[i].id = '';
      labels[i].html = '';
      labels[i].rect = null;
    }
    stage.invalidate();
  }

  // obstacles: { x, y, w, h } boxes (top-left) or capsules { a, b, r }
  function hitsBox(o, r) {
    if (o.a) {
      // distance from the segment to the rectangle, roughly: sample the segment
      for (let k = 0; k <= 8; k++) {
        const x = o.a.x + ((o.b.x - o.a.x) * k) / 8;
        const y = o.a.y + ((o.b.y - o.a.y) * k) / 8;
        const dx = Math.max(r.x - x, 0, x - (r.x + r.w));
        const dy = Math.max(r.y - y, 0, y - (r.y + r.h));
        if (dx * dx + dy * dy < o.r * o.r) return true;
      }
      return false;
    }
    return r.x < o.x + o.w && r.x + r.w > o.x && r.y < o.y + o.h && r.y + r.h > o.y;
  }

  function screenBox(b) {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (let i = 0; i < 8; i++) {
      const p = project(v.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z));
      x0 = Math.min(x0, p.x);
      y0 = Math.min(y0, p.y);
      x1 = Math.max(x1, p.x);
      y1 = Math.max(y1, p.y);
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  function update() {
    const W = stage.width;
    const H = stage.height;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const obstacles = avoid().slice();
    for (const b of spec.bodies?.() || []) obstacles.push(screenBox(b));
    let arrowSeg = null;
    const arrow = spec.arrow?.();
    if (arrow) {
      const a = project(arrow.tail);
      const b = project(arrow.tip);
      arrowSeg = { a, b, r: 9 };
      obstacles.push(arrowSeg);
    }
    // the marker
    const m = spec.marker?.();
    let mAnchor = null;
    for (const el of [ring, pulse, edge, gap, capA, capB]) hide(el);
    if (m?.kind === 'contact') {
      const p = project(m.at);
      if (p.ok) {
        for (const el of [ring, pulse]) {
          el.setAttribute('cx', p.x);
          el.setAttribute('cy', p.y);
          show(el);
        }
        obstacles.push({ x: p.x - 19, y: p.y - 19, w: 38, h: 38 });
        mAnchor = { x: p.x, y: p.y, r: 17 };
      }
    } else if (m?.kind === 'edge') {
      const a = project(m.a);
      const b = project(m.b);
      line(edge, a, b);
      show(edge);
      obstacles.push({ a, b, r: 8 });
      mAnchor = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, r: 6 };
    } else if (m?.kind === 'gap') {
      const a = project(m.a);
      const b = project(m.b);
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len > 4) {
        line(gap, a, b);
        const nx = (-(b.y - a.y) / len) * 7;
        const ny = ((b.x - a.x) / len) * 7;
        line(capA, { x: a.x - nx, y: a.y - ny }, { x: a.x + nx, y: a.y + ny });
        line(capB, { x: b.x - nx, y: b.y - ny }, { x: b.x + nx, y: b.y + ny });
        for (const el of [gap, capA, capB]) show(el);
        obstacles.push({ a, b, r: 9 });
        mAnchor = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, r: 6 };
      }
    }
    // the labels
    const placed = [];
    for (const l of leaders) hide(l);
    spec.labels.forEach((l, i) => {
      const it = labels[i];
      const leader = leaders[i];
      let anchor = null;
      if (l.anchor === 'arrow' && arrowSeg) {
        const k = l.along ?? 0.55;
        anchor = { x: arrowSeg.a.x + (arrowSeg.b.x - arrowSeg.a.x) * k, y: arrowSeg.a.y + (arrowSeg.b.y - arrowSeg.a.y) * k, r: 10 };
      } else if (l.anchor === 'marker') anchor = mAnchor;
      if (!anchor) {
        it.el.classList.remove('in');
        it.shown = false;
        it.rect = null;
        return;
      }
      if (!it.w) {
        it.w = it.el.offsetWidth;
        it.h = it.el.offsetHeight;
      }
      const { w, h } = it;
      let best = null;
      const prefer = l.prefer || Object.keys(DIRS);
      prefer.forEach((dir, rank) => {
        const [dx, dy] = DIRS[dir];
        for (let d = anchor.r + 6; d < anchor.r + 70; d += 4) {
          const cx = anchor.x + dx * d + (dx * w) / 2;
          const cy = anchor.y + dy * d + (dy * h) / 2;
          const r = { x: cx - w / 2, y: cy - h / 2, w, h };
          if (r.x < 6 || r.y < 6 || r.x + w > W - 6 || r.y + h > H - 6) continue;
          if (obstacles.some((o) => hitsBox(o, r)) || placed.some((o) => hitsBox(o, r))) continue;
          const cost = d + rank * 10 + (it.last && it.last !== dir ? 24 : 0);
          if (!best || cost < best.cost) best = { r, cost, dir, d };
          break;
        }
      });
      if (!best) {
        it.el.classList.remove('in');
        it.shown = false;
        it.rect = null;
        return;
      }
      it.last = best.dir;
      it.el.style.transform = `translate(${Math.round(best.r.x)}px, ${Math.round(best.r.y)}px)`;
      it.el.classList.add('in');
      it.shown = true;
      it.rect = best.r;
      placed.push({ x: best.r.x - 5, y: best.r.y - 5, w: best.r.w + 10, h: best.r.h + 10 }); // a little air between labels
      if (best.d > anchor.r + 14) {
        // a short leader from the anchor's edge to the label's nearest edge
        const r = best.r;
        const tx = Math.min(Math.max(anchor.x, r.x), r.x + r.w);
        const ty = Math.min(Math.max(anchor.y, r.y), r.y + r.h);
        const len = Math.hypot(tx - anchor.x, ty - anchor.y) || 1;
        const sx = anchor.x + ((tx - anchor.x) / len) * anchor.r;
        const sy = anchor.y + ((ty - anchor.y) / len) * anchor.r;
        line(leader, { x: sx, y: sy }, { x: tx, y: ty });
        leader.dataset.tone = l.tone;
        show(leader);
      }
    });
  }
  stage.onAfterRender(update);
  // the labels' type size can change with the view's size: measure them again
  stage.onResize(() => {
    for (const l of labels) l.w = 0;
  });

  return {
    set,
    update,
    /** The labels on screen now: [{ id, x, y, w, h }] (for checks). */
    rects: () => labels.filter((l) => l.shown && l.rect).map((l) => ({ id: l.id, ...l.rect })),
    clear: () => set({ labels: [] }),
  };
}
