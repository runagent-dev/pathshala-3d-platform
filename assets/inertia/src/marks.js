// Helpers drawn over the scene (none of them is exported to the GLB):
//   createArrow: a velocity arrow lying along x (it turns round for a negative speed);
//   createTags: two-line labels ("which part" / "what it does") pinned to 3D points, placed in screen space each
//   frame: several spots round the point are tried and the one that covers least of the obstacles (the passenger,
//   the arrows, the corner buttons, the other label) wins; it keeps its spot while that stays good, so labels do
//   not jump about. A short leader line joins the label to its point.
import * as THREE from 'three';

/** An arrow along +x from its origin; set(v, scale) shows a speed v (m/s) as v·scale metres (hidden near zero). */
export function createArrow(color, radius) {
  const mat = new THREE.MeshStandardMaterial({ name: 'Arrow', color, roughness: 0.45, emissive: color, emissiveIntensity: 0.22 });
  const group = new THREE.Group();
  group.userData.noExport = true;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 14).rotateZ(-Math.PI / 2).translate(0.5, 0, 0), mat);
  const head = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 18).rotateZ(-Math.PI / 2).translate(0.5, 0, 0), mat);
  group.add(shaft, head);
  const arrow = {
    group,
    length: 0,
    /** Show speed v (m/s, the sign is the direction along x) as an arrow v·scale long. */
    set(v, scale) {
      const length = Math.abs(v) * scale;
      arrow.length = length;
      group.visible = length > radius * 3;
      if (!group.visible) return;
      group.rotation.y = v < 0 ? Math.PI : 0;
      const h = Math.min(radius * 5, length * 0.5);
      shaft.scale.set(length - h, radius, radius);
      head.position.x = length - h;
      head.scale.set(h, radius * 2.4, radius * 2.4);
    },
    /** The world point at fraction k of the arrow (0: tail, 1: tip). */
    pointAt(k, out = new THREE.Vector3()) {
      return out.set(arrow.length * k, 0, 0).applyMatrix4(group.matrixWorld);
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

  function add(id, { color, prefer }) {
    const el = document.createElement('div');
    el.className = 'in-tag';
    el.style.setProperty('--c', color);
    el.hidden = true;
    layer.append(el);
    const line = document.createElementNS(SVG, 'line');
    line.setAttribute('stroke', color);
    const dot = document.createElementNS(SVG, 'circle');
    dot.setAttribute('r', '3.5');
    dot.setAttribute('fill', color);
    svg.append(line, dot);
    tags.set(id, { el, line, dot, prefer, html: '', anchor: null, last: -1, w: 0, h: 0, box: null });
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

  function update() {
    const W = stage.width;
    const H = stage.height;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const blocks = obstacles();
    const placed = [];
    for (const it of tags.values()) {
      if (!it.anchor) {
        it.line.style.visibility = it.dot.style.visibility = 'hidden';
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
      it.last = best.name;
      it.box = box;
      placed.push(box);
      it.el.style.transform = `translate(${Math.round(box.x)}px, ${Math.round(box.y)}px)`;
      it.el.style.visibility = ok ? 'visible' : 'hidden';
      // the leader line: from the point to the nearest spot on the label's edge
      const ex = Math.min(Math.max(p.x, box.x), box.x + box.w);
      const ey = Math.min(Math.max(p.y, box.y), box.y + box.h);
      it.line.setAttribute('x1', p.x);
      it.line.setAttribute('y1', p.y);
      it.line.setAttribute('x2', ex);
      it.line.setAttribute('y2', ey);
      it.dot.setAttribute('cx', p.x);
      it.dot.setAttribute('cy', p.y);
      it.line.style.visibility = it.dot.style.visibility = ok ? 'visible' : 'hidden';
    }
  }
  stage.onAfterRender(update);

  return {
    add,
    set,
    update,
    /** The label boxes now on screen (stage pixels), for tests and for other overlays to avoid. */
    boxes: () => [...tags.values()].filter((it) => it.anchor && it.box).map((it) => it.box),
  };
}
