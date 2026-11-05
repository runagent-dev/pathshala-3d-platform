// The drawing over the scene, in the style of reflection-laws: rays, the normal, arcs, arrowheads and the marks are painted
// on a 2D canvas above the view from the exact 3D points projected through the camera, so they are even anti-aliased
// lines of a constant width at any size. Every point comes from reading.js: what is drawn is the law itself.
import * as THREE from 'three';
import { NORMAL, TANGENT } from './reading.js';

const GLOW = '#ffe36e';
export const C = {
  ray: '#f59f00',
  rayDark: '#5f3400',
  normal: '#495057',
  ti: '#1971c2',
  tr: '#2b8a3e',
  ink: '#212529',
  stop: '#e03131',
  eye: '#1864ab',
  road: '#343a40',
};

export function createDiagram({ stage, host }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'hrm-draw';
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let dpr = 1;
  let w = 1;
  let h = 1;
  let unit = 1;
  function size() {
    w = stage.width;
    h = stage.height;
    dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    unit = Math.max(1, Math.min(1.35, Math.min(w, h) / 400));
  }
  size();

  const camera = stage.camera;
  const pv = new THREE.Vector3();
  let sx = 0;
  let sy = 0;
  function P(p) {
    pv.set(p.x, p.y, p.z).project(camera);
    sx = ((pv.x + 1) / 2) * w;
    sy = ((1 - pv.y) / 2) * h;
  }
  const MAX = 64;
  const path = new Float32Array(MAX * 2);
  let count = 0;
  const add = (p) => {
    P(p);
    path[count * 2] = sx;
    path[count * 2 + 1] = sy;
    count++;
  };
  function trace() {
    ctx.beginPath();
    ctx.moveTo(path[0], path[1]);
    for (let i = 1; i < count; i++) ctx.lineTo(path[i * 2], path[i * 2 + 1]);
  }
  const NO_DASH = [];
  function stroke(color, width, halo, haloWidth, dash = NO_DASH, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.setLineDash(dash);
    ctx.lineCap = dash.length ? 'butt' : 'round';
    if (halo) {
      trace();
      ctx.strokeStyle = halo;
      ctx.lineWidth = haloWidth * unit;
      ctx.stroke();
    }
    trace();
    ctx.strokeStyle = color;
    ctx.lineWidth = width * unit;
    ctx.stroke();
    ctx.setLineDash(NO_DASH);
    ctx.globalAlpha = 1;
  }
  function chevron(x, y, dx, dy, length, color, edge, alpha = 1) {
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    const a = length * unit * 0.6;
    const b = length * unit * 0.4;
    const c = length * unit * 0.42;
    const n = length * unit * 0.12;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x + ux * a, y + uy * a);
    ctx.lineTo(x - ux * b - uy * c, y - uy * b + ux * c);
    ctx.lineTo(x - ux * n, y - uy * n);
    ctx.lineTo(x - ux * b + uy * c, y - uy * b - ux * c);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    if (edge) {
      ctx.strokeStyle = edge;
      ctx.lineWidth = 1 * unit;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function shine(amount, width = 13) {
    if (amount <= 0) return;
    stroke(GLOW, width * 0.55, null, 0, NO_DASH, 0.85 * amount);
    stroke(GLOW, width, null, 0, NO_DASH, 0.34 * amount);
  }
  const lerpTo = (a, b, k, out) => {
    out.x = a.x + (b.x - a.x) * k;
    out.y = a.y + (b.y - a.y) * k;
    out.z = a.z + (b.z - a.z) * k;
    return out;
  };
  const m0 = { x: 0, y: 0, z: 0 };
  const m1 = { x: 0, y: 0, z: 0 };
  /** A ray from a to b, drawn as far as k, its arrowhead at the fraction t of the whole. */
  function ray(a, b, k = 1, t = 0.5, glow = 0, color = C.ray, edge = C.rayDark) {
    if (k <= 0) return;
    count = 0;
    add(a);
    add(lerpTo(a, b, k, m0));
    shine(glow);
    stroke(color, 2.6, edge, 4.2);
    if (k < t) return;
    P(lerpTo(a, b, t, m0));
    const mx = sx;
    const my = sy;
    P(lerpTo(a, b, t + 0.03, m1));
    chevron(mx, my, sx - mx, sy - my, 15, color, edge);
  }
  function dot(p, radius, color, ring) {
    P(p);
    ctx.beginPath();
    ctx.arc(sx, sy, radius * unit, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = ring;
    ctx.lineWidth = 1.8 * unit;
    ctx.stroke();
  }
  /** The red cross where the rock stops the light. */
  function stopMark(p, size2 = 8) {
    P(p);
    const x = sx;
    const y = sy;
    const d = size2 * unit;
    ctx.lineCap = 'round';
    for (const [c, l] of [
      ['#ffffff', 6.4],
      [C.stop, 3.4],
    ]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = l * unit;
      ctx.beginPath();
      ctx.moveTo(x - d, y - d);
      ctx.lineTo(x + d, y + d);
      ctx.moveTo(x + d, y - d);
      ctx.lineTo(x - d, y + d);
      ctx.stroke();
    }
  }

  // ── what is shown: a plain description the figure fills in ────────────────────────────────────────────────────
  const at = new THREE.Vector3(); // the point of incidence
  const n = new THREE.Vector3(NORMAL.x, NORMAL.y, NORMAL.z);
  const tangent = new THREE.Vector3(TANGENT.x, TANGENT.y, TANGENT.z);
  const v = {
    blocked: null, // { from, hit, to, k }: the ray stopped by the hill
    path: null, // { from, p, to, k, glow }: the ray by way of the mirror (k runs along both legs)
    normal: 0, // how far the normal has grown, 0 … 1
    normalLength: 3,
    normalGlow: 0,
    arcs: [], // { a0, a1, r, color, ends }: degrees from the normal, positive toward +tangent
    corner: 0, // the small square of the right angle between the rays
    cornerGlow: 0,
    eye: null, // the point of the eye that is looking
    rays: [], // the test's candidates: { from, to }
    lines: [], // plain lines: { from, to, color, width, dash, alpha }
    track: null, // the faint range of what can be dragged: { from, to }
    leaders: [], // { from, to, color }
  };
  const q = { x: 0, y: 0, z: 0 };
  const q2 = { x: 0, y: 0, z: 0 };
  function onArc(a, r, out = q) {
    const d = (a * Math.PI) / 180;
    const c = Math.cos(d) * r;
    const s = Math.sin(d) * r;
    out.x = at.x + n.x * c + tangent.x * s;
    out.y = at.y;
    out.z = at.z + n.z * c + tangent.z * s;
    return out;
  }
  function arc({ a0, a1, r, color, ends, glow = 0 }) {
    const steps = 40;
    count = 0;
    for (let i = 0; i <= steps; i++) add(onArc(a0 + ((a1 - a0) * i) / steps, r));
    shine(glow, 11);
    stroke(color, 2.4, '#ffffff', 3.8);
    if (ends !== 'arrows') return;
    const sign = a1 > a0 ? 1 : -1;
    const head = (a, inward) => {
      P(onArc(a, r));
      const x = sx;
      const y = sy;
      P(onArc(a + inward, r));
      const dx = x - sx;
      const dy = y - sy;
      chevron(x - dx * 2.2, y - dy * 2.2, dx, dy, 9, color, '#ffffff');
    };
    head(a0, sign * 3);
    head(a1, -sign * 3);
  }

  const DASH_N = [8, 6];
  const DASH_D = [5, 4.5];
  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (v.track) {
      count = 0;
      add(v.track.from);
      add(v.track.to);
      stroke(C.ink, 1.7, 'rgba(255,255,255,0.75)', 3.4, DASH_D, 0.85);
      dot(v.track.from, 2.4, C.ink, '#ffffff');
      dot(v.track.to, 2.4, C.ink, '#ffffff');
    }
    if (v.normal > 0) {
      count = 0;
      add(at);
      add(onArc(0, v.normalLength * v.normal, q2));
      shine(v.normalGlow, 9);
      stroke(C.normal, 2.1, '#ffffff', 3.6, DASH_N);
    }
    if (v.blocked) {
      const b = v.blocked;
      ray(b.from, b.hit, b.k, 0.55, b.glow);
      if (b.k >= 1) {
        // beyond the rock there is no light: only the place it would have to reach
        count = 0;
        add(b.hit);
        add(b.to);
        stroke('#ffffff', 1.8, 'rgba(0,0,0,0.5)', 3, DASH_D, 0.92);
        stopMark(b.hit);
      }
    }
    if (v.path) {
      const { from, p, to, k, glow = 0 } = v.path;
      const a = from;
      ray(a, p, Math.min(1, k * 2), 0.55, glow);
      if (k > 0.5) ray(p, to, (k - 0.5) * 2, 0.6, glow);
    }
    for (const l of v.lines) {
      count = 0;
      add(l.from);
      add(l.to);
      stroke(l.color, l.width ?? 2.2, '#ffffff', (l.width ?? 2.2) + 1.6, l.dash ? DASH_N : NO_DASH, l.alpha ?? 1);
    }
    for (const r of v.rays) ray(r.from, r.to, 1, 0.72);
    for (const a of v.arcs) arc(a);
    if (v.corner > 0) {
      const a = onArc(45, 0.72, { x: 0, y: 0, z: 0 });
      const b = onArc(-45, 0.72, { x: 0, y: 0, z: 0 });
      const c = { x: a.x + b.x - at.x, y: at.y, z: a.z + b.z - at.z };
      count = 0;
      add(a);
      add(c);
      add(b);
      shine(v.cornerGlow, 9);
      stroke(C.ink, 2, '#ffffff', 3.6, NO_DASH, v.corner);
    }
    if (v.path) dot(v.path.p, 4.2, '#ffffff', C.rayDark);
    if (v.eye) dot(v.eye, 5.2, C.eye, '#ffffff');
    for (const l of v.leaders) {
      count = 0;
      add(l.from);
      add(l.to);
      stroke(l.color, 1.2, null, 0, NO_DASH, 0.85);
    }
  }
  stage.onAfterRender(paint);
  stage.onResize(() => {
    size();
    paint();
  });

  return {
    canvas,
    at,
    view: v,
    setNormal(nx, nz) {
      n.set(nx, 0, nz);
      tangent.set(nz, 0, -nx);
    },
    onArc,
    /** Back to nothing drawn. */
    clear() {
      v.blocked = null;
      v.path = null;
      v.normal = 0;
      v.normalGlow = 0;
      v.corner = 0;
      v.cornerGlow = 0;
      v.eye = null;
      v.arcs.length = 0;
      v.rays.length = 0;
      v.lines.length = 0;
      v.track = null;
      v.leaders.length = 0;
    },
  };
}
