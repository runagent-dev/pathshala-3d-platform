// The drawing over the 3D view, in the style of the chapter's sister figures (total-internal-reflection, the mirror
// figures): the light, the normal and the angle are painted on a 2D canvas above the view from the exact points of
// reading.js (traced in the fibre's plane z = 0), projected through the camera: even lines with a dark edge and small
// filled chevrons. A ray is as wide as the share of the light it carries (Fresnel), never thinner than a line that can
// be seen; a thin one fades instead. Light that leaves the core fades out in the clad, where the coating absorbs it.
import * as THREE from 'three';
import { X0, Y0 } from './apparatus.js';
import { FIBRE } from './reading.js';

export const C = {
  ray: '#f59f00',
  edge: '#5f3400',
  normal: '#495057',
  ti: '#1971c2', // θ₁, the angle of incidence at the core–clad wall
  crit: '#7048e8',
};
const FULL = 5; // the light leaving the source, px
const THINNEST = 1.3;
const DASH = [6, 4];
const NO_DASH = [];

export function createRays({ stage, host }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'of-draw';
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let dpr = 1;
  let w = 1;
  let h = 1;
  function size() {
    w = stage.width;
    h = stage.height;
    dpr = Math.min(2.5, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  size();

  const camera = stage.camera;
  const pv = new THREE.Vector3();
  let sx = 0;
  let sy = 0;
  let behind = false;
  /** A point of the fibre's plane (fibre cm) to the canvas. */
  const P = (x, y) => {
    pv.set(X0 + x, Y0 + y, 0).project(camera);
    behind = pv.z > 1;
    sx = ((pv.x + 1) / 2) * w;
    sy = ((1 - pv.y) / 2) * h;
  };

  /**
   * What is drawn. light: 0…1 of the light's path drawn so far (the source to the screen); focus: the index of the wall
   * that gets the normal and the angle (−1 none); normal, arc, crit 0…1; show: false hides everything.
   */
  const v = { show: true, light: 0, focus: -1, normal: 0, arc: 0, crit: 0 };
  let tr = null;
  /** The main path (air, core, exit) with its lengths, and where along it each leak starts. */
  const main = [];
  const leaks = [];
  let total = 1;
  function setTrace(trace) {
    tr = trace;
    main.length = 0;
    leaks.length = 0;
    total = 0;
    for (const sg of trace.segs) {
      if (sg.kind === 'clad') {
        leaks.push({ seg: sg, at: total });
        continue;
      }
      const len = Math.hypot(sg.b.x - sg.a.x, sg.b.y - sg.a.y);
      main.push({ seg: sg, from: total, len });
      total += len;
    }
    total = Math.max(1e-6, total);
  }
  /** How far along the main path (0…1) the light reaches each wall in turn, for syncing the graph's dots. */
  function hitFractions(out = []) {
    out.length = 0;
    if (!tr) return out;
    let k = 0;
    for (const m of main) {
      if (m.seg.kind === 'core' && k < tr.hits.length) {
        const hi = tr.hits[k];
        if (Math.abs(m.seg.b.x - hi.x) < 1e-6 && Math.abs(m.seg.b.y - hi.y) < 1e-6) {
          out.push((m.from + m.len) / total);
          k++;
        }
      }
    }
    return out;
  }

  let unit = 1;
  let corePx = 40;
  let fit = 1;
  const widthOf = (p) => Math.max(THINNEST, FULL * fit * p);
  const alphaOf = (p) => Math.min(1, Math.max(0.5, (FULL * p) / THINNEST));
  function line(x0, y0, x1, y1, width, color) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  function arrowhead(x, y, dx, dy, length) {
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    const L = length * unit;
    const a = L * 0.6;
    const b = L * 0.4;
    const c = L * 0.42;
    const n = L * 0.12;
    ctx.beginPath();
    ctx.moveTo(x + ux * a, y + uy * a);
    ctx.lineTo(x - ux * b - uy * c, y - uy * b + ux * c);
    ctx.lineTo(x - ux * n, y - uy * n);
    ctx.lineTo(x - ux * b + uy * c, y - uy * b - ux * c);
    ctx.closePath();
    ctx.fillStyle = C.ray;
    ctx.fill();
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  /** A segment drawn as far as k (0…1), with a chevron at its middle when it is long enough on the screen. */
  function seg(a, b, k, power, chevron = true) {
    if (k <= 0) return;
    P(a.x, a.y);
    const x0 = sx;
    const y0 = sy;
    if (behind) return;
    P(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k);
    if (behind) return;
    const x1 = sx;
    const y1 = sy;
    const width = widthOf(power) * unit;
    ctx.globalAlpha = alphaOf(power) * dim;
    ctx.lineCap = 'round';
    line(x0, y0, x1, y1, width + 2, C.edge);
    line(x0, y0, x1, y1, width, C.ray);
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (chevron && k >= 0.5 && len / k > 40 * unit) {
      P(a.x + (b.x - a.x) * 0.5, a.y + (b.y - a.y) * 0.5);
      arrowhead(sx, sy, x1 - x0, y1 - y0, (7 + width * 1.1) * Math.max(0.6, fit));
    }
    ctx.globalAlpha = 1;
  }
  /** Light leaving the core: from the wall through the clad, fading to nothing at the coating. */
  function leak(a, b, k, power) {
    if (k <= 0) return;
    P(a.x, a.y);
    const x0 = sx;
    const y0 = sy;
    P(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k);
    const x1 = sx;
    const y1 = sy;
    // the light leaving the core: never thinner than it needs to be seen
    const width = Math.max(2.4, FULL * Math.sqrt(fit) * power) * unit;
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, C.ray);
    g.addColorStop(0.55, 'rgba(245,159,0,0.75)');
    g.addColorStop(1, 'rgba(245,159,0,0)');
    const e = ctx.createLinearGradient(x0, y0, x1, y1);
    e.addColorStop(0, C.edge);
    e.addColorStop(0.6, 'rgba(95,52,0,0.5)');
    e.addColorStop(1, 'rgba(95,52,0,0)');
    ctx.globalAlpha = alphaOf(power) * dim;
    ctx.lineCap = 'butt';
    line(x0, y0, x1, y1, width + 2, e);
    line(x0, y0, x1, y1, width, g);
    // where the coating takes it up: a soft warm glow
    if (k >= 1) {
      const r = (5 + width) * unit;
      const glow = ctx.createRadialGradient(x1, y1, 0, x1, y1, r);
      glow.addColorStop(0, 'rgba(255,190,80,0.85)');
      glow.addColorStop(1, 'rgba(255,140,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x1, y1, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function dashed(a, b, color, alpha = 1) {
    P(a.x, a.y);
    const x0 = sx;
    const y0 = sy;
    P(b.x, b.y);
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'butt';
    line(x0, y0, sx, sy, 3.6, 'rgba(255,255,255,0.92)');
    ctx.setLineDash(DASH);
    line(x0, y0, sx, sy, 1.8, color);
    ctx.setLineDash(NO_DASH);
    ctx.globalAlpha = 1;
  }
  /** An angle at the point o (fibre cm): from the direction u through to the direction v (unit vectors), radius r cm. */
  function arc(o, ux, uy, vx, vy, r, color, k) {
    const a0 = Math.atan2(uy, ux);
    let sweep = Math.atan2(vy, vx) - a0;
    while (sweep > Math.PI) sweep -= 2 * Math.PI;
    while (sweep < -Math.PI) sweep += 2 * Math.PI;
    sweep *= k;
    const N = Math.max(8, Math.ceil(Math.abs(sweep) / 0.06));
    ctx.beginPath();
    P(o.x, o.y);
    ctx.moveTo(sx, sy);
    for (let i = 0; i <= N; i++) {
      const a = a0 + (sweep * i) / N;
      P(o.x + r * Math.cos(a), o.y + r * Math.sin(a));
      ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.26;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const a = a0 + (sweep * i) / N;
      P(o.x + r * Math.cos(a), o.y + r * Math.sin(a));
      if (i) ctx.lineTo(sx, sy);
      else ctx.moveTo(sx, sy);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.4;
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  function dot(x, y) {
    P(x, y);
    ctx.beginPath();
    ctx.arc(sx, sy, 2.8 * unit, 0, Math.PI * 2);
    ctx.fillStyle = '#fff7d6';
    ctx.fill();
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }

  let dim = 1;
  /** The angle's size on the screen sets its radius (cm): about 34 px, never wider than the core. */
  let arcR = 0.5;
  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!v.show || !tr || v.light <= 0) return;
    unit = Math.max(0.9, Math.min(1.3, Math.min(w, h) / 420));
    // the light never wider than about a third of the core on the screen (a long view makes the fibre thin)
    P(FIBRE.length / 2, 0);
    const cx = sx;
    const cy = sy;
    P(FIBRE.length / 2, FIBRE.core * 2);
    corePx = Math.hypot(sx - cx, sy - cy);
    fit = Math.max(0.3, Math.min(1, (corePx * 0.3) / FULL));
    // seen from behind, the coating and the posts are in front of the light: it fades, so it does not float over them
    dim = camera.position.z < 0 ? 0.32 : camera.position.z < 6 ? 0.32 + (0.68 * camera.position.z) / 6 : 1;
    const reach = v.light * total;
    // the leaks first (under the main path), each once the light has got to its wall
    for (const l of leaks) {
      if (reach <= l.at) continue;
      const len = Math.hypot(l.seg.b.x - l.seg.a.x, l.seg.b.y - l.seg.a.y);
      leak(l.seg.a, l.seg.b, Math.min(1, (reach - l.at) / Math.max(1e-6, len * 1.6)), l.seg.power);
    }
    for (const m of main) {
      if (reach <= m.from) break;
      seg(m.seg.a, m.seg.b, Math.min(1, (reach - m.from) / m.len), m.seg.power);
    }
    const hit = v.focus >= 0 ? tr.hits[v.focus] : null;
    if (hit && reachOf(v.focus) <= reach + 1e-6) {
      if (v.normal > 0) {
        const k = v.normal;
        dashed(
          { x: hit.x + hit.nx * 0.42 * k, y: hit.y + hit.ny * 0.42 * k },
          { x: hit.x - hit.nx * 1.05 * k, y: hit.y - hit.ny * 1.05 * k },
          C.normal,
        );
      }
      // the incoming ray, back from the wall: the wall's normal points out of the core
      const m = incoming(v.focus);
      if (m && v.arc > 0) {
        const dx = m.a.x - m.b.x;
        const dy = m.a.y - m.b.y;
        const l = Math.hypot(dx, dy) || 1;
        P(hit.x, hit.y);
        const hx = sx;
        const hy = sy;
        P(hit.x - hit.nx * 0.5, hit.y - hit.ny * 0.5);
        const per = Math.hypot(sx - hx, sy - hy) / 0.5; // px per cm here
        arcR = Math.min(0.62, Math.max(0.28, 34 / Math.max(1, per)));
        if (v.crit > 0) {
          // the critical angle, from the normal: a faint violet line where θ₁ = θc would come in
          const c = (75 * Math.PI) / 180;
          const ix = -hit.nx;
          const iy = -hit.ny;
          // turn the inward normal toward the incoming ray's side by θc
          const side = Math.sign(ix * (dy / l) - iy * (dx / l)) || 1;
          const cx = ix * Math.cos(c) - side * iy * Math.sin(c);
          const cy = side * ix * Math.sin(c) + iy * Math.cos(c);
          const L = Math.min(2.6, arcR * 3.2);
          ctx.globalAlpha = v.crit;
          dashed({ x: hit.x, y: hit.y }, { x: hit.x + cx * L, y: hit.y + cy * L }, C.crit, v.crit);
          ctx.globalAlpha = 1;
        }
        arc(hit, -hit.nx, -hit.ny, dx / l, dy / l, arcR, C.ti, v.arc);
      }
      dot(hit.x, hit.y);
    }
  }
  function reachOf(i) {
    let k = -1;
    for (const m of main) {
      if (m.seg.kind !== 'core') continue;
      const hi = tr.hits[k + 1];
      if (hi && Math.abs(m.seg.b.x - hi.x) < 1e-6 && Math.abs(m.seg.b.y - hi.y) < 1e-6) {
        k++;
        if (k === i) return m.from + m.len;
      }
    }
    return Number.POSITIVE_INFINITY;
  }
  function incoming(i) {
    let k = -1;
    for (const m of main) {
      if (m.seg.kind !== 'core') continue;
      const hi = tr.hits[k + 1];
      if (hi && Math.abs(m.seg.b.x - hi.x) < 1e-6 && Math.abs(m.seg.b.y - hi.y) < 1e-6) {
        k++;
        if (k === i) return m.seg;
      }
    }
    return null;
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  // boxes along the drawn light and the normal (canvas px), for the labels to keep off
  const pool = Array.from({ length: 160 }, () => ({ left: 0, top: 0, right: 0, bottom: 0 }));
  const outBoxes = [];
  let used = 0;
  function along(a, b) {
    P(a.x, a.y);
    const x0 = sx;
    const y0 = sy;
    P(b.x, b.y);
    const n = Math.min(12, Math.ceil(Math.hypot(sx - x0, sy - y0) / 22));
    for (let i = 0; i <= n && used < pool.length; i++) {
      const r = pool[used++];
      const x = x0 + ((sx - x0) * i) / n;
      const y = y0 + ((sy - y0) * i) / n;
      r.left = x - 5;
      r.right = x + 5;
      r.top = y - 5;
      r.bottom = y + 5;
      outBoxes.push(r);
    }
  }
  function boxes() {
    outBoxes.length = 0;
    used = 0;
    if (!v.show || !tr || v.light <= 0) return outBoxes;
    const reach = v.light * total;
    for (const m of main) if (reach > m.from) along(m.seg.a, m.seg.b);
    for (const l of leaks) if (reach > l.at) along(l.seg.a, l.seg.b);
    return outBoxes;
  }

  return {
    canvas,
    view: v,
    setTrace,
    hitFractions,
    boxes,
    get total() {
      return total;
    },
  };
}
