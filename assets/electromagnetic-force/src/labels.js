// Labels pinned to 3D points that find their own place on the screen, every frame: each label tries its spots in
// turn (keeping the one it had while that stays free) and takes the first that is inside the picture and clear of
// the corner buttons, the other labels and the boxes the figure asks it to keep off (the comb, an arrow). A label
// marked optional is left out when nothing fits. A short leader line joins a label to its point when they are
// apart. (The kit's createAnnotations pins labels at fixed offsets; these move out of each other's way.)
import * as THREE from 'three';

export function createLabels({ stage, layer, keepOff = () => [] }) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('pvc-anno-lines');
  layer.appendChild(svg);
  const items = new Map();
  const v = new THREE.Vector3();
  const overlap = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

  function project(p) {
    v.copy(p).project(stage.camera);
    const x = (v.x * 0.5 + 0.5) * stage.width;
    const y = (-v.y * 0.5 + 0.5) * stage.height;
    // a point out of the picture has no label (it would only be squeezed into a corner)
    return { x, y, ok: v.z < 1 && v.z > -1 && x >= 0 && x <= stage.width && y >= 0 && y <= stage.height };
  }

  /**
   * Add or change a label. spots: [[dx, dy, ax, ay], …] where it may go, best first: the point (dx, dy) px from
   * the anchor is at the fraction (ax, ay) of the label's box (0.5, 0.5: its middle; 0, 0.5: its left edge).
   * avoid(): more boxes ({ l, t, r, b } in px) this label must not cover. priority: lower goes first.
   */
  function set(id, { text, point, spots, kind = 'part', color = null, optional = false, priority = 5, avoid = null }) {
    let it = items.get(id);
    const fresh = !it || it.text !== text;
    if (!it) {
      const el = document.createElement('div');
      el.className = `pvc-anno pvc-anno-${kind}`;
      layer.appendChild(el);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.classList.add(`k-${kind}`);
      svg.append(line);
      it = { el, line, text: null, spot: -1 };
      items.set(id, it);
      requestAnimationFrame(() => el.classList.add('in'));
    }
    if (it.text !== text) {
      it.text = text;
      it.el.innerHTML = text;
      it.w = 0;
    }
    if (color && it.color !== color) {
      it.color = color;
      it.el.style.setProperty('--c', color);
      it.line.style.stroke = color;
    }
    Object.assign(it, { point, spots, optional, priority, avoid });
    if (fresh) stage.invalidate(); // setting the same label again (every frame, as it moves) draws nothing new by itself
  }

  function remove(id) {
    const it = items.get(id);
    if (!it) return;
    it.el.remove();
    it.line.remove();
    items.delete(id);
  }

  function clear() {
    for (const id of [...items.keys()]) remove(id);
  }

  /** Where each label is now (stage px), for tests of overlaps: { id: { l, t, r, b } | null }. */
  const placed = {};

  function layout() {
    svg.setAttribute('viewBox', `0 0 ${stage.width} ${stage.height}`);
    const taken = keepOff();
    const list = [...items.entries()].sort((a, b) => a[1].priority - b[1].priority);
    for (const [id, it] of list) {
      const a = project(it.point());
      if (!it.w) {
        it.w = it.el.offsetWidth;
        it.h = it.el.offsetHeight;
      }
      const boxAt = ([dx, dy, ax = 0.5, ay = 0.5]) => {
        const l = a.x + dx - it.w * ax;
        const t = a.y + dy - it.h * ay;
        return { l, t, r: l + it.w, b: t + it.h };
      };
      const extra = it.avoid ? it.avoid() : [];
      const inside = (b) => b.l >= 4 && b.t >= 4 && b.r <= stage.width - 4 && b.b <= stage.height - 4;
      const free = (b) => inside(b) && !taken.some((r) => overlap(r, b)) && !extra.some((r) => overlap(r, b));
      let pick = -1;
      if (a.ok) {
        if (it.spot >= 0 && it.spot < it.spots.length && free(boxAt(it.spots[it.spot]))) pick = it.spot;
        else pick = it.spots.findIndex((sp) => free(boxAt(sp)));
      }
      if (pick < 0 && (it.optional || !a.ok)) {
        it.el.style.visibility = it.line.style.visibility = 'hidden';
        it.spot = -1;
        placed[id] = null;
        continue;
      }
      if (pick < 0)
        pick = Math.max(
          0,
          it.spots.findIndex((sp) => inside(boxAt(sp))),
        );
      it.spot = pick;
      const box = boxAt(it.spots[pick]);
      // a label that would not fit is kept inside the picture
      const dx = Math.min(Math.max(box.l, 4), stage.width - it.w - 4) - box.l;
      const dy = Math.min(Math.max(box.t, 4), stage.height - it.h - 4) - box.t;
      box.l += dx;
      box.r += dx;
      box.t += dy;
      box.b += dy;
      taken.push({ l: box.l - 3, t: box.t - 3, r: box.r + 3, b: box.b + 3 });
      placed[id] = box;
      it.el.style.transform = `translate(${box.l}px, ${box.t}px)`;
      it.el.style.visibility = 'visible';
      // leader line from the point to the nearest edge of the label, when they are apart
      const nx = Math.min(Math.max(a.x, box.l), box.r);
      const ny = Math.min(Math.max(a.y, box.t), box.b);
      const far = Math.hypot(nx - a.x, ny - a.y) > 6;
      it.line.style.visibility = far ? 'visible' : 'hidden';
      if (far) {
        it.line.setAttribute('x1', a.x);
        it.line.setAttribute('y1', a.y);
        it.line.setAttribute('x2', nx);
        it.line.setAttribute('y2', ny);
      }
    }
  }
  stage.onAfterRender(layout);

  return { set, remove, clear, layout, placed, has: (id) => items.has(id) };
}
