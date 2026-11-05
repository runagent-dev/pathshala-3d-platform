// The drawing over the 3D view, in the style of the sister figures reflection-laws and parallel-mirrors: a 2D canvas above the
// view, painted from exact 3D points projected through the camera, so lines are anti-aliased and of a constant width at any
// size. A real ray is solid amber with a thin dark halo and clean filled arrowheads; where a ray only seems to come from,
// dashed amber; the normal dashed slate; angles as thin arcs in the plane of the rays. Nothing is allocated while it paints.
import * as THREE from 'three';

export const C = {
  ray: '#f59f00',
  rayDark: '#5f3400',
  normal: '#495057',
  ink: '#212529',
  handle: '#2c6fb0',
  glow: '#ffd43b',
  thetaI: '#1971c2',
  thetaR: '#2b8a3e',
  // how many reflections: one colour each, not used for anything else in the chapter
  order: ['#ffffff', '#0c8599', '#c2255c', '#5f3dc4'],
};

export const TURN_RING = 0.37; // the turning handle's ring, as a share of the view's smaller side

export function createDiagram({ stage, host, tube, font }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'kld-draw';
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
    unit = Math.max(1, Math.min(1.12, Math.min(w, h) / 460));
  }
  size();
  const camera = stage.camera;
  const pv = new THREE.Vector3();
  let sx = 0;
  let sy = 0;
  /** Projects a scene point into sx, sy (canvas pixels). */
  function P(x, y, z) {
    pv.set(x, y, z).project(camera);
    sx = ((pv.x + 1) / 2) * w;
    sy = ((1 - pv.y) / 2) * h;
  }
  /** A point of the tube, [x, u, v], wherever the tube has turned to. */
  function T(x, u, v) {
    pv.set(x, v, u).applyMatrix4(tube.root.matrixWorld).project(camera);
    sx = ((pv.x + 1) / 2) * w;
    sy = ((1 - pv.y) / 2) * h;
  }
  const at = (q) => P(q[0], q[1], q[2]);
  const NO_DASH = [];
  const DASH_R = [9, 6];
  const DASH_N = [7, 5];
  const DASH_T = [5, 6];
  const gripBoxes = [];

  function stroke(x0, y0, x1, y1, color, width, halo, haloWidth, dash = NO_DASH, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.setLineDash(dash);
    ctx.lineCap = dash.length ? 'butt' : 'round';
    if (halo) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = halo;
      ctx.lineWidth = haloWidth * unit;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = color;
    ctx.lineWidth = width * unit;
    ctx.stroke();
    ctx.setLineDash(NO_DASH);
    ctx.globalAlpha = 1;
  }
  function line(a, b, color, width, halo, haloWidth, dash, alpha) {
    at(a);
    const x0 = sx;
    const y0 = sy;
    at(b);
    stroke(x0, y0, sx, sy, color, width, halo, haloWidth, dash, alpha);
  }
  function chevron(x, y, dx, dy, length, color, edge) {
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
    if (edge) {
      ctx.strokeStyle = edge;
      ctx.lineWidth = 1 * unit;
      ctx.stroke();
    }
  }
  function dot(q) {
    at(q);
    ctx.beginPath();
    ctx.arc(sx, sy, q[3] * unit, 0, Math.PI * 2);
    ctx.fillStyle = q[4];
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6 * unit;
    ctx.stroke();
  }
  /** One stretch of a ray, with its arrowhead at the fraction t. */
  function segment(a, b, q, t, width, lit) {
    const ax = a[0] + (b[0] - a[0]) * q;
    const ay = a[1] + (b[1] - a[1]) * q;
    const az = a[2] + (b[2] - a[2]) * q;
    at(a);
    const x0 = sx;
    const y0 = sy;
    P(ax, ay, az);
    if (lit > 0) stroke(x0, y0, sx, sy, C.glow, width + 8, null, 0, NO_DASH, 0.55 * lit);
    stroke(x0, y0, sx, sy, C.ray, width, C.rayDark, width + 1, NO_DASH, 1);
    if (t > q) return;
    P(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
    const mx = sx;
    const my = sy;
    P(a[0] + (b[0] - a[0]) * (t + 0.03), a[1] + (b[1] - a[1]) * (t + 0.03), a[2] + (b[2] - a[2]) * (t + 0.03));
    chevron(mx, my, sx - mx, sy - my, 9 + width, C.ray, C.rayDark);
  }
  /** A ray through several points, grown to the fraction k of its length. */
  function ray(r) {
    const p = r.points;
    let total = 0;
    for (let i = 1; i < p.length; i++) total += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1], p[i][2] - p[i - 1][2]);
    let left = total * Math.min(1, r.k ?? 1);
    for (let i = 1; i < p.length && left > 0; i++) {
      const a = p[i - 1];
      const b = p[i];
      const long = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const q = Math.min(1, left / long);
      left -= long;
      segment(a, b, q, 0.56, r.width ?? 2.3, r.lit ?? 0);
    }
  }
  /** An angle between two directions at a point, a thin arc with a soft fill. */
  function arc(q) {
    const N = 26;
    const [cx, cy, cz] = q.at;
    const a = q.from;
    const b = q.to;
    const dot3 = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const th = Math.acos(Math.min(1, Math.max(-1, dot3)));
    const sn = Math.sin(th) || 1;
    ctx.beginPath();
    P(cx, cy, cz);
    const x0 = sx;
    const y0 = sy;
    ctx.moveTo(x0, y0);
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const k0 = Math.sin((1 - t) * th) / sn;
      const k1 = Math.sin(t * th) / sn;
      P(cx + q.r * (a[0] * k0 + b[0] * k1), cy + q.r * (a[1] * k0 + b[1] * k1), cz + q.r * (a[2] * k0 + b[2] * k1));
      ctx.lineTo(sx, sy);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.26;
    ctx.fillStyle = q.color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = q.color;
    ctx.lineWidth = 1.8 * unit;
    ctx.stroke();
  }
  /** A cell of the end plane: its outline, and a soft tint or none. Points are [x, u, v] of the tube. */
  function cell(q) {
    const v = q.verts;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      T(q.x ?? 15, v[i][0], v[i][1]);
      if (i) ctx.lineTo(sx, sy);
      else ctx.moveTo(sx, sy);
    }
    ctx.closePath();
    ctx.setLineDash(q.dash ? DASH_N : NO_DASH);
    if (q.halo) {
      ctx.strokeStyle = q.halo;
      ctx.lineWidth = ((q.width ?? 1.5) + 1.6) * unit;
      ctx.stroke();
    }
    ctx.strokeStyle = q.color;
    ctx.lineWidth = (q.width ?? 1.5) * unit;
    ctx.globalAlpha = q.alpha ?? 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.setLineDash(NO_DASH);
  }
  /** A small round chip with a number or letter, on a point of the tube's end plane. */
  function chip(q) {
    if (q.tube) T(q.x ?? 15, q.at[0], q.at[1]);
    else at(q.at);
    const x = sx;
    const y = sy;
    const r = (q.r ?? 12) * unit;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = q.fill ?? '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2 * unit;
    ctx.strokeStyle = q.color;
    ctx.stroke();
    ctx.fillStyle = q.ink ?? q.color;
    ctx.font = `600 ${Math.round(13 * unit)}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(q.text, x, y + 1);
  }
  /** A ring round a point of the tube's end plane. */
  function ring(q) {
    T(q.x ?? 15, q.at[0], q.at[1]);
    ctx.beginPath();
    ctx.arc(sx, sy, q.r * unit, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4 * unit;
    ctx.stroke();
    ctx.strokeStyle = q.color;
    ctx.lineWidth = 2.2 * unit;
    ctx.stroke();
  }
  /** A small eye, looking along the screen toward a point: an almond with an iris, drawn in vector. */
  function eye(q) {
    at(q.at);
    const cx = sx;
    const cy = sy;
    at(q.look);
    const a = Math.atan2(sy - cy, sx - cx);
    const r = (q.r ?? 12.5) * unit;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.quadraticCurveTo(0, -r * 1.04, r, 0);
    ctx.quadraticCurveTo(0, r * 1.04, -r, 0);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.7 * unit;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r * 0.26, 0, r * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#2c6fb0';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.3, 0, r * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#10171f';
    ctx.fill();
    ctx.restore();
  }
  /**
   * What the student can drag: a faint dashed track of everything within reach, and on it a white disc with a thin dark ring and
   * arrows along the way it moves (a round arrow for turning). Its boxes go to the labels' avoid list. q: { turn, angle } for a
   * ring round the middle of the view, or { path, at, prev, next } of world points; `small` once it has been used.
   */
  function grip(q) {
    gripBoxes.length = 0;
    let x = 0;
    let y = 0;
    let along = 0;
    ctx.setLineDash(DASH_T);
    ctx.lineCap = 'butt';
    ctx.beginPath();
    if (q.turn) {
      const R = Math.min(w, h) * TURN_RING;
      ctx.arc(w / 2, h / 2, R, 0, Math.PI * 2);
      x = w / 2 + R * Math.sin(q.angle);
      y = h / 2 - R * Math.cos(q.angle);
      along = q.angle;
      for (let i = 0; i < 24; i++) {
        const a = (i * Math.PI) / 12;
        trackBox(w / 2 + R * Math.sin(a), h / 2 - R * Math.cos(a));
      }
    } else {
      q.path.forEach((p, i) => {
        at(p);
        if (i) ctx.lineTo(sx, sy);
        else ctx.moveTo(sx, sy);
        trackBox(sx, sy);
      });
      at(q.prev);
      const x0 = sx;
      const y0 = sy;
      at(q.next);
      along = Math.atan2(sy - y0, sx - x0);
      at(q.at);
      x = sx;
      y = sy;
    }
    ctx.strokeStyle = 'rgba(15,20,28,0.55)';
    ctx.lineWidth = 3.4 * unit;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.7 * unit;
    ctx.stroke();
    ctx.setLineDash(NO_DASH);
    const r = (q.small ? 12.5 : 15.5) * unit;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.5 * unit;
    ctx.stroke();
    const a = r * 0.6;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(along);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.9 * unit;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (q.turn) {
      // a round arrow: most of a circle, one head
      ctx.arc(0, 0, a, -2.3, 1.5);
      const hx = a * Math.cos(1.5);
      const hy = a * Math.sin(1.5);
      ctx.moveTo(hx + a * 0.55, hy - a * 0.02);
      ctx.lineTo(hx, hy);
      ctx.lineTo(hx + a * 0.2, hy - a * 0.62);
    } else {
      ctx.moveTo(-a, 0);
      ctx.lineTo(a, 0);
      for (const k of [-1, 1]) {
        ctx.moveTo(k * a * 0.5, -a * 0.46);
        ctx.lineTo(k * a, 0);
        ctx.lineTo(k * a * 0.5, a * 0.46);
      }
    }
    ctx.stroke();
    ctx.restore();
    return { x, y };
  }
  function trackBox(x, y) {
    gripBoxes.push({ left: x - 5, top: y - 5, right: x + 5, bottom: y + 5 });
  }

  // ── what is shown: a plain description the figure fills in ──────────────────────────────────────────────────
  const v = {
    cells: [],
    rings: [],
    normals: [], // [a, b]
    backs: [], // dashed amber: [a, b, k]
    arcs: [],
    rays: [],
    dots: [],
    chips: [],
    eyes: [],
    grip: null, // what can be dragged now
    hide: false, // while the camera flies
  };
  const handles = { knob: null, track: gripBoxes };

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    handles.knob = null;
    gripBoxes.length = 0;
    if (v.hide) return;
    for (const q of v.cells) cell(q);
    for (const q of v.normals) line(q[0], q[1], C.normal, 1.7, '#ffffff', 3.4, DASH_N);
    for (const q of v.arcs) arc(q);
    for (const q of v.backs) {
      at(q[0]);
      const x0 = sx;
      const y0 = sy;
      const k = q[2] ?? 1;
      P(q[0][0] + (q[1][0] - q[0][0]) * k, q[0][1] + (q[1][1] - q[0][1]) * k, q[0][2] + (q[1][2] - q[0][2]) * k);
      if (k > 0) stroke(x0, y0, sx, sy, C.ray, 2.1, C.rayDark, 3.1, DASH_R);
    }
    for (const r of v.rays) ray(r);
    for (const q of v.dots) dot(q);
    for (const q of v.rings) ring(q);
    for (const q of v.chips) chip(q);
    for (const q of v.eyes) eye(q);
    if (v.grip) handles.knob = grip(v.grip);
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  return {
    canvas,
    view: v,
    handles,
    clear() {
      for (const k of ['cells', 'rings', 'normals', 'backs', 'arcs', 'rays', 'dots', 'chips', 'eyes']) v[k].length = 0;
      v.grip = null;
    },
    paint,
  };
}
