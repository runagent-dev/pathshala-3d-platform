// Labels pinned to 3D points that never collide: after every frame each label (most important first) takes the
// first of its candidate spots that stays inside the view and clear of the corner buttons, the notes on the stage,
// the other labels and any screen boxes it must not cover (the book); a label that fits nowhere hides until there
// is room (the panel still has the number). A short leader line joins a label that sits away from its point.
// The kit's annotations place each label at one fixed offset, so this figure keeps its own small layer.
import * as THREE from 'three';

/**
 * avoid: page-space boxes of elements to keep clear (buttons, notes); blockers: canvas-space boxes { l, t, r, b } of
 * things in the scene no label may cover (worked out after the frame is drawn, so they are where the scene is).
 * @param {{ stage: any, layer: HTMLElement, avoid?: () => DOMRect[], blockers?: () => {l:number,t:number,r:number,b:number}[] }} options
 */
export function createLabels({ stage, layer, avoid = () => [], blockers = () => [] }) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('pvc-anno-lines');
  layer.appendChild(svg);
  const items = new Map(); // id → { el, line, text, point, spots, priority, leader, visible }
  const v = new THREE.Vector3();

  function project(p) {
    v.copy(p).project(stage.camera);
    return { x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height, ok: v.z < 1 && v.z > -1 };
  }

  const overlap = (a, b, pad = 3) => a.l < b.r + pad && a.r > b.l - pad && a.t < b.b + pad && a.b > b.t - pad;

  function update() {
    if (!items.size) return;
    svg.setAttribute('viewBox', `0 0 ${stage.width} ${stage.height}`);
    const sr = stage.canvas.getBoundingClientRect();
    const taken = blockers();
    for (const r of avoid()) if (r.width) taken.push({ l: r.left - sr.left, t: r.top - sr.top, r: r.right - sr.left, b: r.bottom - sr.top });
    const list = [...items.values()].sort((a, b) => b.priority - a.priority);
    for (const it of list) {
      const anchors = (Array.isArray(it.point) ? it.point : [it.point]).map((p) => project(p()));
      const w = it.el.offsetWidth;
      const h = it.el.offsetHeight;
      let placed = null;
      let a = anchors[0];
      if (w && it.visible !== false)
        for (const [dx, dy, k = 0] of it.spots) {
          a = anchors[k];
          if (!a.ok) continue;
          // the spot is where the label's nearest edge goes: left of the point for dx < 0, right for dx > 0
          const left = dx < -2 ? a.x + dx - w : dx > 2 ? a.x + dx : a.x - w / 2;
          const top = dy < -2 ? a.y + dy - h : dy > 2 ? a.y + dy : a.y - h / 2;
          const box = { l: left, t: top, r: left + w, b: top + h };
          if (box.l < 4 || box.t < 4 || box.r > stage.width - 4 || box.b > stage.height - 4) continue;
          if (taken.some((o) => overlap(box, o))) continue;
          placed = box;
          break;
        }
      it.el.classList.toggle('in', Boolean(placed));
      it.line.style.visibility = placed && it.leader ? 'visible' : 'hidden';
      if (!placed) continue;
      taken.push(placed);
      it.el.style.transform = `translate(${placed.l}px, ${placed.t}px)`;
      if (it.leader) {
        const ex = Math.min(Math.max(a.x, placed.l), placed.r);
        const ey = Math.min(Math.max(a.y, placed.t), placed.b);
        it.line.setAttribute('x1', a.x);
        it.line.setAttribute('y1', a.y);
        it.line.setAttribute('x2', ex);
        it.line.setAttribute('y2', ey);
        it.line.style.visibility = Math.hypot(ex - a.x, ey - a.y) > 6 ? 'visible' : 'hidden';
      }
    }
  }
  stage.onAfterRender(update);

  return {
    /**
     * text: HTML; point: () => Vector3, or a list of them; spots: [[dx, dy, k], …] candidate offsets in pixels from
     * point k (default the first), best first; priority: higher is placed first; color: the label's colour (its
     * meaning); leader: draw a line to the point.
     */
    set(id, { text, point, spots, priority = 0, color, leader = true, kind = 'callout' }) {
      let it = items.get(id);
      if (!it) {
        const el = document.createElement('div');
        el.className = `pvc-anno pvc-anno-${kind} nf-label`;
        layer.appendChild(el);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.classList.add('k-callout');
        svg.append(line);
        it = { el, line };
        items.set(id, it);
      }
      if (it.text !== text) {
        it.el.innerHTML = text;
        it.text = text;
      }
      if (color) {
        it.el.style.setProperty('--c', color);
        it.line.style.stroke = color;
      }
      Object.assign(it, { point, spots, priority, leader, visible: true });
      stage.invalidate();
    },
    /** Hide a label without forgetting it (show again with set). */
    hide(id) {
      const it = items.get(id);
      if (!it || it.visible === false) return;
      it.visible = false;
      it.el.classList.remove('in');
      it.line.style.visibility = 'hidden';
    },
    remove(id) {
      const it = items.get(id);
      if (!it) return;
      it.el.remove();
      it.line.remove();
      items.delete(id);
    },
    clear(prefix = '') {
      for (const id of [...items.keys()]) if (id.startsWith(prefix)) this.remove(id);
    },
  };
}
