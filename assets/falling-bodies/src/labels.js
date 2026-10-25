// Labels on the 3D scene, placed in screen space after every frame: each is pinned to a 3D point and tries a few
// spots beside it (right, left, below, above, as the label prefers) until it overlaps neither a label placed before
// it (more important ones go first) nor anything in `avoid` (the corner buttons, the slow-motion note…). If no spot
// is free, it hides (the panel still has the number). A short leader line joins a label to its point when wanted.
// (The kit's annotations draw every label where it is told; here labels move out of each other's way.)
import * as THREE from 'three';

const PAD = 4; // px kept free round each label

/**
 * stage: the kit's stage; layer: an absolutely placed element over the canvas; avoid: () => [DOMRect…] in page
 * pixels. add(id, { text, point: () => Vector3, sides: ['right' | 'left' | 'below' | 'below-l' | 'below-r' | 'above', …], gap, prio, leader, target, cls }): the label sits
 * beside `point`; its leader line (if wanted) runs to `target` (default: the point).
 */
export function createLabels({ stage, layer, avoid = () => [] }) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('fb-lines');
  layer.appendChild(svg);
  const items = new Map();
  const v = new THREE.Vector3();
  const tv = new THREE.Vector3();

  function add(id, { text, point, target = null, sides = ['right', 'left', 'below', 'above'], gap = 8, prio = 5, leader = false, cls = '' }) {
    remove(id);
    const el = document.createElement('div');
    el.className = `fb-label ${cls}`;
    el.innerHTML = text;
    layer.appendChild(el);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', `fb-leader ${cls}`);
    svg.appendChild(line);
    items.set(id, { el, line, point, target, sides, gap, prio, leader, shown: true, w: 0, h: 0, box: null });
    stage.invalidate();
  }

  function remove(id) {
    const it = items.get(id);
    if (!it) return;
    it.el.remove();
    it.line.remove();
    items.delete(id);
  }

  /** Show or hide a label without forgetting it. */
  function show(id, on) {
    const it = items.get(id);
    if (!it || it.shown === on) return;
    it.shown = on;
    stage.invalidate();
  }

  function setText(id, text) {
    const it = items.get(id);
    if (!it || it.el.innerHTML === text) return;
    it.el.innerHTML = text;
    it.w = 0;
    stage.invalidate();
  }

  const overlaps = (a, b) => a.x < b.x + b.w + PAD && a.x + a.w + PAD > b.x && a.y < b.y + b.h + PAD && a.y + a.h + PAD > b.y;

  function place() {
    const W = stage.width;
    const Hh = stage.height;
    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`);
    const sr = stage.canvas.getBoundingClientRect();
    const taken = avoid()
      .filter((r) => r?.width)
      .map((r) => ({ x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height }));
    const list = [...items.values()].sort((a, b) => a.prio - b.prio);
    for (const it of list) {
      it.box = null;
      if (!it.shown) {
        it.el.style.visibility = it.line.style.visibility = 'hidden';
        continue;
      }
      v.copy(it.point()).project(stage.camera);
      const ax = (v.x * 0.5 + 0.5) * W;
      const ay = (-v.y * 0.5 + 0.5) * Hh;
      if (!it.w) {
        it.w = it.el.offsetWidth;
        it.h = it.el.offsetHeight;
      }
      const { w, h, gap } = it;
      let found = null;
      for (const side of it.sides) {
        const c =
          side === 'right'
            ? { x: ax + gap, y: ay - h / 2 }
            : side === 'left'
              ? { x: ax - gap - w, y: ay - h / 2 }
              : side === 'below'
                ? { x: ax - w / 2, y: ay + gap }
                : side === 'below-l' // below, reaching out to the left of the point
                  ? { x: ax + 14 - w, y: ay + gap }
                  : side === 'below-r'
                    ? { x: ax - 14, y: ay + gap }
                    : { x: ax - w / 2, y: ay - gap - h };
        c.w = w;
        c.h = h;
        if (c.x < 4 || c.y < 4 || c.x + w > W - 4 || c.y + h > Hh - 4) continue;
        if (taken.some((b) => overlaps(c, b))) continue;
        found = c;
        break;
      }
      if (!found || v.z > 1) {
        it.el.style.visibility = it.line.style.visibility = 'hidden';
        continue;
      }
      taken.push(found);
      it.box = found;
      it.el.style.visibility = 'visible';
      it.el.style.transform = `translate(${Math.round(found.x)}px, ${Math.round(found.y)}px)`;
      if (it.leader) {
        let tx = ax;
        let ty = ay;
        if (it.target) {
          tv.copy(it.target()).project(stage.camera);
          tx = (tv.x * 0.5 + 0.5) * W;
          ty = (-tv.y * 0.5 + 0.5) * Hh;
        }
        const lx = Math.min(Math.max(tx, found.x), found.x + w);
        const ly = Math.min(Math.max(ty, found.y), found.y + h);
        it.line.setAttribute('x1', String(tx));
        it.line.setAttribute('y1', String(ty));
        it.line.setAttribute('x2', String(lx));
        it.line.setAttribute('y2', String(ly));
        it.line.style.visibility = 'visible';
      } else it.line.style.visibility = 'hidden';
    }
  }
  stage.onAfterRender(place);

  return {
    add,
    remove,
    show,
    setText,
    has: (id) => items.has(id),
    /** Where a label is now (stage pixels), or null if hidden. */
    box: (id) => items.get(id)?.box ?? null,
    clear() {
      for (const id of [...items.keys()]) remove(id);
    },
  };
}
