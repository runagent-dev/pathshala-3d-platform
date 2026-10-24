// Labels pinned to 3D points, with leader lines. Used for part names and tour callouts.
import * as THREE from 'three';

export function createAnnotations({ stage, layer }) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('pvc-anno-lines');
  layer.appendChild(svg);
  const items = new Map(); // id → { el, line, dot, point(), dx, dy, kind }
  const v = new THREE.Vector3();

  function project(p) {
    v.copy(p).project(stage.camera);
    return { x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height, ok: v.z < 1 && v.z > -1 };
  }

  function update() {
    if (!items.size) return;
    svg.setAttribute('viewBox', `0 0 ${stage.width} ${stage.height}`);
    for (const it of items.values()) {
      const a = project(it.point());
      // keep the label box inside the view; the leader line still points at the part
      const w = it.w || (it.w = it.el.offsetWidth);
      const h = it.h || (it.h = it.el.offsetHeight);
      const anchor = it.dx < -4 ? 1 : it.dx > 4 ? 0 : 0.5;
      const left = Math.min(Math.max(a.x + it.dx - w * anchor, 6), stage.width - w - 6);
      const top = Math.min(Math.max(a.y + it.dy - h / 2, 6), stage.height - h - 6);
      const lx = left + w * anchor;
      const ly = top + h / 2;
      it.el.style.transform = `translate(${left}px, ${top}px)`;
      it.el.style.visibility = a.ok ? 'visible' : 'hidden';
      it.line.setAttribute('x1', a.x);
      it.line.setAttribute('y1', a.y);
      it.line.setAttribute('x2', lx);
      it.line.setAttribute('y2', ly);
      it.dot.setAttribute('cx', a.x);
      it.dot.setAttribute('cy', a.y);
      it.line.style.visibility = it.dot.style.visibility = a.ok ? 'visible' : 'hidden';
    }
  }
  stage.onAfterRender(update);

  function add(id, { text, point, dx = 0, dy = -50, kind = 'part', color }) {
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
    items.set(id, { el, line, dot, point, dx, dy, kind });
    requestAnimationFrame(() => el.classList.add('in'));
    stage.invalidate();
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

  return { add, remove, clear, update, has: (id) => items.has(id) };
}
