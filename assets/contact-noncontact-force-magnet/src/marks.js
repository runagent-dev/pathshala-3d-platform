// The measured gap of a non-contact force, drawn over the 3D view in screen space (crisp on a phone): a dashed line
// across the empty space between the two bodies (the football and the floor, the nail and the magnet, a bit of paper
// and the comb) with a solid tick on each body's surface, like a dimension in a drawing. Its number is in the tag
// beside it (app.js). The contact patches of contact forces are in the 3D scene itself (parts.js glowSpot,
// glowPatch), so they lie on the bodies in perspective.
import * as THREE from 'three';

const SVG = 'http://www.w3.org/2000/svg';

/** @param {{ stage: any, layer: HTMLElement }} options */
export function createGapMark({ stage, layer }) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.classList.add('cnf-marks');
  svg.setAttribute('aria-hidden', 'true');
  layer.appendChild(svg);
  const make = (cls) => {
    const el = document.createElementNS(SVG, 'line');
    el.classList.add(cls);
    svg.appendChild(el);
    return el;
  };
  const halo = make('cnf-gap-halo');
  const line = make('cnf-gap');
  const capA = make('cnf-cap');
  const capB = make('cnf-cap');
  const all = [halo, line, capA, capB];

  /** @type {() => ({ a: THREE.Vector3, b: THREE.Vector3 } | null)} */
  let source = () => null;
  const v = new THREE.Vector3();

  function project(p) {
    v.copy(p).project(stage.camera);
    return { x: (v.x * 0.5 + 0.5) * stage.width, y: (-v.y * 0.5 + 0.5) * stage.height, ok: v.z > -1 && v.z < 1 };
  }
  const put = (el, a, b) => {
    el.setAttribute('x1', a.x.toFixed(1));
    el.setAttribute('y1', a.y.toFixed(1));
    el.setAttribute('x2', b.x.toFixed(1));
    el.setAttribute('y2', b.y.toFixed(1));
  };

  /** The gap's ends on the screen (canvas pixels), or null when there is none to draw. */
  function ends() {
    const g = source();
    if (!g) return null;
    const a = project(g.a);
    const b = project(g.b);
    if (!a.ok || !b.ok || Math.hypot(b.x - a.x, b.y - a.y) < 3) return null;
    return { a, b };
  }

  function update() {
    svg.setAttribute('viewBox', `0 0 ${stage.width} ${stage.height}`);
    const e = ends();
    for (const el of all) el.setAttribute('visibility', e ? 'visible' : 'hidden');
    if (!e) return;
    const { a, b } = e;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const nx = (-(b.y - a.y) / len) * 8;
    const ny = ((b.x - a.x) / len) * 8;
    put(halo, a, b);
    put(line, a, b);
    put(capA, { x: a.x - nx, y: a.y - ny }, { x: a.x + nx, y: a.y + ny });
    put(capB, { x: b.x - nx, y: b.y - ny }, { x: b.x + nx, y: b.y + ny });
  }
  stage.onAfterRender(update);

  return {
    /** What to draw: a function giving the gap's two ends (world points) or null, read on every frame. */
    set(fn) {
      source = fn || (() => null);
      stage.invalidate();
    },
    ends,
    /** Boxes along the line (canvas pixels), for the labels to keep off it. */
    boxes() {
      const e = ends();
      if (!e) return [];
      const out = [];
      for (let k = 0; k <= 6; k++) {
        const x = e.a.x + ((e.b.x - e.a.x) * k) / 6;
        const y = e.a.y + ((e.b.y - e.a.y) * k) / 6;
        out.push({ left: x - 9, top: y - 9, right: x + 9, bottom: y + 9 });
      }
      return out;
    },
  };
}
