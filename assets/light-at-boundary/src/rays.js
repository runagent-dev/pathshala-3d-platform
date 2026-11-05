// The drawing over the 3D view: the book's চিত্র ৮.০২ as a crisp vector drawing. Nothing here is a 3D object. The rays are
// painted on a 2D canvas above the view, from the exact 3D points of reading.js projected through the camera: even
// anti-aliased lines with a thin halo and small filled chevrons, at any size. The light comes in as one ray and leaves the
// surface as three parts; a thinner line carries less light. A new part wears a soft glow for a moment.
import * as THREE from 'three';
import { paths, START_ANGLE } from './reading.js';

export const C = { ray: '#f59f00', edge: '#5f3400', glow: '#ffe36e', warm: '#e8590c' };
const WIDTH = { incident: 3, refraction: 2.6, reflection: 2.1 };
const NO_DASH = [];

export function createRays({ stage, host }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'lab-draw';
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
  }
  size();

  const camera = stage.camera;
  const pv = new THREE.Vector3();
  let sx = 0;
  let sy = 0;
  const P = (p) => {
    pv.set(p.x, p.y, p.z).project(camera);
    sx = ((pv.x + 1) / 2) * w;
    sy = ((1 - pv.y) / 2) * h;
  };

  // ── what is shown; the figure fills this in ───────────────────────────────────────────────────────────────
  const part = () => ({ k: 0, alpha: 1, shine: 0 }); // k: how far it has come; shine: the glow of a new part
  const v = {
    incident: { k: 1, alpha: 1, shine: 0 },
    reflection: part(),
    refraction: part(),
    absorption: part(),
    geo: paths(START_ANGLE),
  };

  /** A line from a to b, as far as k: its glow, its halo, then the line. Its chevron at the fraction `at`. */
  function ray(a, b, k, width, alpha, shine, at) {
    if (k <= 0) return;
    P(a);
    const x0 = sx;
    const y0 = sy;
    P(b);
    const x1 = x0 + (sx - x0) * k;
    const y1 = y0 + (sy - y0) * k;
    const dx = sx - x0;
    const dy = sy - y0;
    const line = () => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
    };
    ctx.lineCap = 'round';
    if (shine > 0) {
      line();
      ctx.globalAlpha = 0.32 * shine;
      ctx.strokeStyle = C.glow;
      ctx.lineWidth = 15 * unit;
      ctx.stroke();
      line();
      ctx.globalAlpha = 0.8 * shine;
      ctx.lineWidth = 7 * unit;
      ctx.stroke();
    }
    ctx.globalAlpha = alpha;
    line();
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = (width + 1.6) * unit;
    ctx.stroke();
    line();
    ctx.strokeStyle = C.ray;
    ctx.lineWidth = width * unit;
    ctx.stroke();
    if (k >= at) chevron(x0 + dx * at, y0 + dy * at, dx, dy, 13);
    ctx.globalAlpha = 1;
    if (k < 1) bead(x1, y1);
  }
  /** The swept-back arrowhead of the sister figures, at x, y, along (dx, dy). */
  function chevron(x, y, dx, dy, length) {
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
    ctx.fillStyle = C.ray;
    ctx.fill();
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = unit;
    ctx.stroke();
  }
  /** The bright head of a ray that is still on its way. */
  function bead(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 3.2 * unit, 0, Math.PI * 2);
    ctx.fillStyle = '#fff7d6';
    ctx.fill();
  }
  /** The part that is absorbed: short, dying away into a warm ember at the surface. It goes nowhere. */
  function stub(a, b, k, alpha, shine) {
    if (k <= 0) return;
    P(a);
    const x0 = sx;
    const y0 = sy;
    P(b);
    const x1 = x0 + (sx - x0) * k;
    const y1 = y0 + (sy - y0) * k;
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, C.ray);
    g.addColorStop(0.55, C.warm);
    g.addColorStop(1, 'rgba(232,89,12,0)');
    if (shine > 0) {
      ctx.globalAlpha = 0.4 * shine;
      ctx.lineCap = 'round';
      ctx.strokeStyle = C.glow;
      ctx.lineWidth = 10 * unit;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'butt';
    ctx.setLineDash([5 * unit, 3.5 * unit]);
    ctx.strokeStyle = g;
    ctx.lineWidth = 2.5 * unit;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.setLineDash(NO_DASH);
    ctx.globalAlpha = 1;
  }
  /** The point where the light arrives: a small white-hot mark. */
  function point(p) {
    P(p);
    ctx.beginPath();
    ctx.arc(sx, sy, 3 * unit, 0, Math.PI * 2);
    ctx.fillStyle = '#fff7d6';
    ctx.fill();
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = 1.1 * unit;
    ctx.stroke();
  }

  const up = new THREE.Vector3();
  /** Px to a centimetre at the point where the light arrives: the lines grow a little as the camera comes closer. */
  function measure() {
    up.set(v.geo.hit.x, v.geo.hit.y, v.geo.hit.z).applyMatrix4(camera.matrixWorldInverse);
    const cm = h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * -up.z);
    unit = Math.max(0.95, Math.min(1.3, (cm / 13) ** 0.3));
  }

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    measure();
    const g = v.geo;
    const { incident: I, reflection: R, refraction: T, absorption: A } = v;
    ray(g.hit, g.refracted, T.k, WIDTH.refraction, T.alpha, T.shine, 0.58);
    ray(g.hit, g.reflected, R.k, WIDTH.reflection, R.alpha, R.shine, 0.56);
    stub(g.hit, g.stub, A.k, A.alpha, A.shine);
    ray(g.lens, g.hit, I.k, WIDTH.incident, I.alpha, I.shine, 0.56);
    if (I.k >= 1) point(g.hit);
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  // boxes along the rays now shown, canvas px: a label keeps off them, so it never lies on what it names
  const pool = Array.from({ length: 64 }, () => ({ left: 0, top: 0, right: 0, bottom: 0 }));
  const out = [];
  let used = 0;
  function along(a, b, k) {
    if (k <= 0) return;
    P(a);
    const x0 = sx;
    const y0 = sy;
    P(b);
    const n = Math.min(14, Math.ceil((Math.hypot(sx - x0, sy - y0) * k) / 18));
    for (let i = 0; i <= n && used < pool.length; i++) {
      const x = x0 + ((sx - x0) * k * i) / n;
      const y = y0 + ((sy - y0) * k * i) / n;
      const r = pool[used++];
      r.left = x - 5;
      r.right = x + 5;
      r.top = y - 5;
      r.bottom = y + 5;
      out.push(r);
    }
  }
  function boxes() {
    const g = v.geo;
    out.length = 0;
    used = 0;
    along(g.lens, g.hit, v.incident.k);
    along(g.hit, g.reflected, v.reflection.k);
    along(g.hit, g.refracted, v.refraction.k);
    along(g.hit, g.stub, v.absorption.k);
    return out;
  }

  return { canvas, view: v, paint, boxes };
}
