// The drawing over the 3D view, in the style of the chapter's sister figures: nothing here is a 3D object. The rays, the normal
// and the two angles are painted on a 2D canvas above the view, from the exact 3D points of reading.js projected through the
// camera: even anti-aliased lines with a thin halo and small filled chevrons, at any size. The thickness of a ray is in
// proportion to the light it carries: the incoming ray splits into the reflected and the refracted ray, and they add up to it.
import * as THREE from 'three';
import { fresnel, GLASS, points, START_ANGLE } from './reading.js';

export const C = {
  ray: '#f59f00',
  edge: '#5f3400',
  normal: '#495057',
  ti: '#1971c2',
  tr: '#2b8a3e',
  glow: '#ffe36e',
  pattern: '#bfe3ff',
  patternEdge: '#1f3a78',
};
const FULL = 6; // the thickness of the incoming ray, px
const THINNEST = 1.1; // below this a line cannot be seen: a thin ray stays this wide, and fades instead (the corner note says so)
const ARC = 8.5; // the radius of the angles, cm
const NO_DASH = [];
const DASH = [7, 5];

export function createRays({ stage, host }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'ra-draw';
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let dpr = 1;
  let w = 1;
  let h = 1;
  function size() {
    w = stage.width;
    h = stage.height;
    dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  size();

  const camera = stage.camera;
  const pv = new THREE.Vector3();
  let sx = 0;
  let sy = 0;
  const P = (x, y, z = 0) => {
    pv.set(x, y, z).project(camera);
    sx = ((pv.x + 1) / 2) * w;
    sy = ((1 - pv.y) / 2) * h;
  };

  // through, flower, normal, arcs, refracted: how much of each is drawn, 0 to 1 (the story brings them in one at a time)
  const v = {
    geo: points(START_ANGLE),
    show: true,
    r: fresnel(START_ANGLE),
    ghost: null,
    through: 0,
    flower: 0,
    normal: 0,
    arcs: 0,
    refracted: 0,
    guide: false, // the line of his eye and the flower
    pins: [], // small dots where labels' leaders touch the glass
  };
  let unit = 1;

  function line(a, b, width, alpha, chevronAt, color = C.ray, edge = C.edge) {
    P(a.x, a.y, a.z);
    const x0 = sx;
    const y0 = sy;
    P(b.x, b.y, b.z);
    const x1 = sx;
    const y1 = sy;
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
    };
    ctx.lineCap = 'round';
    ctx.globalAlpha = alpha;
    path();
    ctx.strokeStyle = edge;
    ctx.lineWidth = width + 1.5;
    ctx.stroke();
    path();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    if (chevronAt != null) chevron(x0 + (x1 - x0) * chevronAt, y0 + (y1 - y0) * chevronAt, x1 - x0, y1 - y0, color, edge, 9 + width * 1.1);
    ctx.globalAlpha = 1;
  }
  /** The swept-back arrowhead of the sister figures, at x, y, along (dx, dy). */
  function chevron(x, y, dx, dy, color, edge, length) {
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    const a = length * unit * 0.6;
    const b = length * unit * 0.4;
    const c = length * unit * 0.42;
    const n = length * unit * 0.12;
    ctx.beginPath();
    ctx.moveTo(x + ux * a, y + uy * a);
    ctx.lineTo(x - ux * b - uy * c, y - uy * b + ux * c);
    ctx.lineTo(x - ux * n, y - uy * n);
    ctx.lineTo(x - ux * b + uy * c, y - uy * b - ux * c);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  /** One angle, as an arc in the plane of the rays with a pale fill, from the normal down to the ray. side: −1 left, +1 right. */
  function angle(g, side, color) {
    const a = (g.angle * Math.PI * v.arcs) / 180;
    const N = 18;
    ctx.beginPath();
    P(g.hit.x, g.hit.y);
    ctx.moveTo(sx, sy);
    for (let i = 0; i <= N; i++) {
      const k = (a * i) / N;
      P(g.hit.x + side * ARC * Math.sin(k), g.hit.y + ARC * Math.cos(k));
      ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.26;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const k = (a * i) / N;
      P(g.hit.x + side * ARC * Math.sin(k), g.hit.y + ARC * Math.cos(k));
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
  /** A thin ray of the given share of the light: as wide as it is, or the thinnest line, fainter by what is missing. */
  const widthOf = (share) => Math.max(THINNEST, FULL * share);
  const alphaOf = (share) => Math.min(1, Math.max(0.5, (FULL * share) / THINNEST));
  /** A faint dashed line between two world points. */
  function faint(a, b, alpha, dash = DASH) {
    P(a.x, a.y, a.z);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    P(b.x, b.y, b.z);
    ctx.lineTo(sx, sy);
    ctx.setLineDash(dash);
    ctx.lineCap = 'butt';
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.setLineDash(NO_DASH);
  }
  /** Where the glass and the light were before (a question of the test): the outline of its top, and the rays. */
  function past(g) {
    const hx = GLASS.halfX;
    const hz = GLASS.halfZ;
    const y = g.plane;
    faint({ x: -hx, y, z: hz }, { x: hx, y, z: hz }, 0.9);
    faint({ x: hx, y, z: hz }, { x: hx, y, z: -hz }, 0.9);
    faint({ x: hx, y, z: -hz }, { x: -hx, y, z: -hz }, 0.9);
    faint({ x: -hx, y, z: -hz }, { x: -hx, y, z: hz }, 0.9);
    faint(g.flower, g.hit, 0.7);
    faint(g.hit, g.eye, 0.7);
  }
  const from = { x: 0, y: 0, z: 0 };
  const to = { x: 0, y: 0, z: 0 };
  const end = { x: 0, y: 0, z: 0 };
  /** end = a + (b − a) · k */
  const toward = (a, b, k) => {
    end.x = a.x + (b.x - a.x) * k;
    end.y = a.y + (b.y - a.y) * k;
    end.z = (a.z ?? 0) + ((b.z ?? 0) - (a.z ?? 0)) * k;
    return end;
  };
  /**
   * The beam from the glass to his eye while the story shows both lights in it: side by side, as wide together as the light that
   * comes, the pale band the light of the pattern (1 − R) and the amber band the flower's (R).
   */
  function beam(g, a, k) {
    const R = v.flower >= 1 ? v.r : 0;
    const wFlower = FULL * R;
    const wPattern = FULL * (1 - R);
    P(g.hit.x, g.hit.y);
    const x0 = sx;
    const y0 = sy;
    P(a.x, a.y);
    const x1 = x0 + (sx - x0) * k;
    const y1 = y0 + (sy - y0) * k;
    const l = Math.hypot(x1 - x0, y1 - y0) || 1;
    const nx = -(y1 - y0) / l;
    const ny = (x1 - x0) / l;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = C.patternEdge;
    ctx.lineWidth = FULL + 1.5;
    ctx.stroke();
    const band = (off, width, color) => {
      if (width <= 0) return;
      ctx.beginPath();
      ctx.moveTo(x0 + nx * off, y0 + ny * off);
      ctx.lineTo(x1 + nx * off, y1 + ny * off);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    };
    band(wFlower / 2, wPattern, C.pattern);
    band(-wPattern / 2, wFlower, C.ray);
    if (k > 0.56)
      chevron(x0 + (x1 - x0) * 0.56, y0 + (y1 - y0) * 0.56, x1 - x0, y1 - y0, R > 0.5 ? C.ray : C.pattern, R > 0.5 ? C.edge : C.patternEdge, 15.6);
  }

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!v.show) return;
    const g = v.geo;
    unit = Math.max(0.9, Math.min(1.25, Math.min(w, h) / 400));
    if (v.guide) faint(g.eye, g.flower, 0.5); // the line of his eye and the flower: the glass rises toward it
    if (v.ghost) past(v.ghost);
    if (v.normal > 0) {
      P(g.hit.x, g.hit.y);
      const nx = sx;
      const ny = sy;
      const n = toward(g.hit, g.top, v.normal);
      P(n.x, n.y);
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(sx, sy);
      ctx.lineCap = 'butt';
      ctx.strokeStyle = 'rgba(255,255,255,0.86)';
      ctx.lineWidth = 3.6;
      ctx.stroke();
      ctx.setLineDash(DASH);
      ctx.strokeStyle = C.normal;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.setLineDash(NO_DASH);
    }
    if (v.arcs > 0) {
      angle(g, 1, C.ti);
      angle(g, -1, C.tr);
    }
    const R = v.r;
    to.x = g.eye.x + (g.hit.x - g.eye.x) * 0.03;
    to.y = g.eye.y + (g.hit.y - g.eye.y) * 0.03;
    // the flower's ray starts at the edge of its heart
    from.x = g.flower.x + (g.hit.x - g.flower.x) * 0.16;
    from.y = g.flower.y + (g.hit.y - g.flower.y) * 0.16;
    // the light of the pattern, up through the glass and on to his eye: the first half of the drawing, then the second
    if (v.through > 0) {
      const a = Math.min(1, v.through * 2);
      line(g.under, toward(g.under, g.hit, a), 3.2, 1, null, C.pattern, C.patternEdge);
      if (v.through > 0.5) beam(g, to, (v.through - 0.5) * 2);
    } else if (v.flower >= 1) {
      line(g.hit, to, widthOf(R), alphaOf(R), 0.56);
    }
    if (v.refracted > 0) line(g.hit, g.inside, widthOf(1 - R), alphaOf(1 - R) * v.refracted, 0.8);
    if (v.flower > 0) {
      line(from, toward(from, g.hit, v.flower), FULL, 1, v.flower > 0.5 ? 0.5 : null);
      if (v.flower >= 1) dot(g.hit, '#fff7d6', C.edge, 3.2);
    }
    for (const p of v.pins) dot(p, '#ffffff', '#1f2933', 3);
  }
  function dot(p, fill, edge, r) {
    P(p.x, p.y, p.z);
    ctx.beginPath();
    ctx.arc(sx, sy, r * unit, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  // boxes along the rays and the normal, canvas px: a label keeps off them
  const pool = Array.from({ length: 80 }, () => ({ left: 0, top: 0, right: 0, bottom: 0 }));
  const out = [];
  let used = 0;
  function along(a, b) {
    P(a.x, a.y, a.z);
    const x0 = sx;
    const y0 = sy;
    P(b.x, b.y, b.z);
    const n = Math.min(18, Math.ceil(Math.hypot(sx - x0, sy - y0) / 18));
    for (let i = 0; i <= n && used < pool.length; i++) {
      const r = pool[used++];
      const x = x0 + ((sx - x0) * i) / n;
      const y = y0 + ((sy - y0) * i) / n;
      r.left = x - 5;
      r.right = x + 5;
      r.top = y - 5;
      r.bottom = y + 5;
      out.push(r);
    }
  }
  function boxes() {
    out.length = 0;
    used = 0;
    if (!v.show) return out;
    const g = v.geo;
    if (v.flower > 0) along(g.flower, g.hit);
    if (v.flower > 0 || v.through > 0) along(g.hit, g.eye);
    if (v.normal > 0) along(g.hit, g.top);
    if (v.refracted > 0) along(g.hit, g.inside);
    if (v.through > 0) along(g.under, g.hit);
    return out;
  }
  /** Where a world point is on the view, css px. */
  const screen = (p) => {
    P(p.x, p.y, p.z);
    return { x: sx, y: sy };
  };

  return { canvas, view: v, paint, boxes, screen };
}
