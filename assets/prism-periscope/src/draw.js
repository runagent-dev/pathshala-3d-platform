// The drawing over the 3D view, in the style of the chapter's sister figures (reflection-laws,
// total-internal-reflection): nothing here is a 3D object. The light, the eye's blocked line of sight, the normal and
// the angles are painted on a 2D canvas above the view from the exact points of reading.js, projected through the
// camera: even amber lines with a dark edge and small filled chevrons, a dashed slate normal with a light halo, the
// angle of incidence in blue. The eye is a plain textbook eye icon (no face), looking the way the light comes from.
import * as THREE from 'three';

export const C = {
  ray: '#f59f00',
  edge: '#5f3400',
  normal: '#495057',
  ti: '#1971c2', // the angle of incidence
  sight: '#f1f3f5', // the eye's straight line of sight, stopped by the wall
  stop: '#e03131',
  ink: '#212529',
};
const DASH = [7, 5];
const NO_DASH = [];

export function createDrawing({ stage, host }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'pp-draw';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let dpr = 1;
  let w = 1;
  let h = 1;
  let unit = 1;
  function size() {
    w = stage.width;
    h = stage.height;
    dpr = Math.min(2.5, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    unit = Math.min(1.35, Math.max(1, Math.min(w, h) / 420));
  }
  size();

  const camera = stage.camera;
  const pv = new THREE.Vector3();
  /** Projects a world point; returns false when it is behind the camera. Result in S. */
  const S = { x: 0, y: 0 };
  function P(x, y, z) {
    pv.set(x, y, z).applyMatrix4(camera.matrixWorldInverse);
    const behind = pv.z > -camera.near;
    pv.applyMatrix4(camera.projectionMatrix);
    S.x = ((pv.x + 1) / 2) * w;
    S.y = ((1 - pv.y) / 2) * h;
    return !behind;
  }

  // what is drawn, as small boxes along every line (canvas pixels), so the labels can keep off it
  const pool = [];
  let count = 0;
  const shown = [];
  function mark(x0, y0, x1, y1, r) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 12));
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      const y = y0 + ((y1 - y0) * i) / n;
      if (x < -20 || y < -20 || x > w + 20 || y > h + 20) continue;
      const b = pool[count] || (pool[count] = { left: 0, top: 0, right: 0, bottom: 0 });
      b.left = x - r;
      b.right = x + r;
      b.top = y - r;
      b.bottom = y + r;
      count++;
    }
  }
  /** The boxes along everything drawn in the last frame (reused arrays: don't keep them). */
  function boxes() {
    shown.length = 0;
    for (let i = 0; i < count; i++) shown.push(pool[i]);
    return shown;
  }

  function line(x0, y0, x1, y1, color, width, dash = NO_DASH, edge = null, edgeWidth = 0) {
    mark(x0, y0, x1, y1, (width + edgeWidth) / 2 + 2);
    ctx.lineCap = dash.length ? 'butt' : 'round';
    if (edge) {
      ctx.setLineDash(dash);
      ctx.strokeStyle = edge;
      ctx.lineWidth = width + edgeWidth;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.setLineDash(dash);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.setLineDash(NO_DASH);
  }
  function chevron(x, y, dx, dy, length) {
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
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  /**
   * A path of world points ({x, y, z}), drawn as far as k (0…1 of its length): the light. A chevron in the middle of
   * every segment longer than `minChevron` px that is fully drawn. `fadeFirst`: the first segment fades in from its
   * start (light from far away). Returns the screen point where it stops.
   */
  const segLen = [];
  function lightPath(pts, k, { width = 4.2, fadeFirst = false, minChevron = 34 } = {}) {
    if (k <= 0 || pts.length < 2) return;
    segLen.length = 0;
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y, (pts[i].z ?? 0) - (pts[i - 1].z ?? 0));
      segLen.push(l);
      total += l;
    }
    let left = k * total;
    const W = width * unit;
    for (let i = 1; i < pts.length && left > 1e-6; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const l = segLen[i - 1];
      const part = Math.min(1, left / Math.max(1e-9, l));
      left -= l;
      if (!P(a.x, a.y, a.z ?? 0)) continue;
      const x0 = S.x;
      const y0 = S.y;
      if (!P(a.x + (b.x - a.x) * part, a.y + (b.y - a.y) * part, (a.z ?? 0) + ((b.z ?? 0) - (a.z ?? 0)) * part)) continue;
      const x1 = S.x;
      const y1 = S.y;
      if (fadeFirst && i === 1) {
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, 'rgba(245, 159, 0, 0)');
        g.addColorStop(0.45, C.ray);
        ctx.lineCap = 'round';
        ctx.strokeStyle = g;
        ctx.lineWidth = W;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        mark(x0, y0, x1, y1, W / 2 + 2);
      } else line(x0, y0, x1, y1, C.ray, W, NO_DASH, C.edge, 2.4);
      const px = Math.hypot(x1 - x0, y1 - y0);
      if (part >= 1 && px > minChevron * unit)
        chevron(
          (x0 + x1) / 2 + (x1 - x0) * (fadeFirst && i === 1 ? 0.2 : 0),
          (y0 + y1) / 2 + (y1 - y0) * (fadeFirst && i === 1 ? 0.2 : 0),
          x1 - x0,
          y1 - y0,
          12 + W,
        );
    }
  }

  /** The eye's line of sight, dashed, as far as k; a red cross where the wall stops it (once it gets there). */
  function sight(from, to, k) {
    if (k <= 0) return;
    if (!P(from.x, from.y, from.z)) return;
    const x0 = S.x;
    const y0 = S.y;
    if (!P(from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k, from.z + (to.z - from.z) * k)) return;
    line(x0, y0, S.x, S.y, C.sight, 2.6 * unit, DASH, 'rgba(15, 28, 48, 0.85)', 2.4);
    if (k >= 1) {
      const r = 7 * unit;
      for (const [dx, dy] of [
        [1, 1],
        [1, -1],
      ]) {
        line(S.x - dx * r, S.y - dy * r, S.x + dx * r, S.y + dy * r, C.stop, 3.4 * unit, NO_DASH, '#ffffff', 3);
      }
    }
  }

  /** The normal at a point (dir: unit vector of the line), `len` along dir and `back` the other way, dashed slate on a light halo. */
  function normal(p, dir, len, k, back = len) {
    if (k <= 0) return;
    if (!P(p.x - dir.x * back * k, p.y - dir.y * back * k, p.z - dir.z * back * k)) return;
    const x0 = S.x;
    const y0 = S.y;
    if (!P(p.x + dir.x * len * k, p.y + dir.y * len * k, p.z + dir.z * len * k)) return;
    line(x0, y0, S.x, S.y, C.normal, 2.2 * unit, [6, 4], 'rgba(255, 255, 255, 0.9)', 3);
  }

  /**
   * An angle at p from direction u to direction v (unit vectors in the plane of the light), radius r (world), drawn
   * as a filled wedge with an outlined arc, as far as k.
   */
  const arcPts = [];
  function angle(p, u, v, r, k, color) {
    if (k <= 0) return;
    arcPts.length = 0;
    const dot = u.x * v.x + u.y * v.y + u.z * v.z;
    const full = Math.acos(Math.max(-1, Math.min(1, dot)));
    // the unit vector perpendicular to u, toward v, in their plane
    const px = v.x - dot * u.x;
    const py = v.y - dot * u.y;
    const pz = v.z - dot * u.z;
    const pl = Math.hypot(px, py, pz) || 1;
    const n = 18;
    for (let i = 0; i <= n; i++) {
      const a = (full * k * i) / n;
      const c = Math.cos(a) * r;
      const s = Math.sin(a) * r;
      if (!P(p.x + u.x * c + (px / pl) * s, p.y + u.y * c + (py / pl) * s, p.z + u.z * c + (pz / pl) * s)) return;
      arcPts.push(S.x, S.y);
    }
    if (!P(p.x, p.y, p.z)) return;
    const cx = S.x;
    const cy = S.y;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let i = 0; i < arcPts.length; i += 2) ctx.lineTo(arcPts[i], arcPts[i + 1]);
    ctx.closePath();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(arcPts[0], arcPts[1]);
    for (let i = 2; i < arcPts.length; i += 2) ctx.lineTo(arcPts[i], arcPts[i + 1]);
    for (let i = 2; i < arcPts.length; i += 2) mark(arcPts[i - 2], arcPts[i - 1], arcPts[i], arcPts[i + 1], 3);
    ctx.lineWidth = 4.4 * unit;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.lineWidth = 2.4 * unit;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  /**
   * A textbook eye icon at p (world), `size` px wide, looking along `look` (world): an almond with the iris toward
   * the side it looks to. alpha fades it.
   */
  function eye(p, look, size, alpha = 1) {
    if (alpha <= 0) return;
    if (!P(p.x + look.x, p.y + look.y, p.z + look.z)) return;
    const lx = S.x;
    if (!P(p.x, p.y, p.z)) return;
    const x = S.x;
    const y = S.y;
    const dir = lx < x ? -1 : 1;
    const W = size;
    const H = size * 0.56;
    mark(x - W / 2, y, x + W / 2, y, H / 2 + 2);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x - W / 2, y);
    ctx.quadraticCurveTo(x, y - H, x + W / 2, y);
    ctx.quadraticCurveTo(x, y + H, x - W / 2, y);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1b2430';
    ctx.stroke();
    ctx.save();
    ctx.clip();
    const ix = x + dir * W * 0.16;
    ctx.beginPath();
    ctx.arc(ix, y, H * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = '#7a4a22';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ix, y, H * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#111111';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ix - H * 0.1, y - H * 0.12, H * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
    // the upper lid, a little heavier
    ctx.beginPath();
    ctx.moveTo(x - W / 2, y);
    ctx.quadraticCurveTo(x, y - H, x + W / 2, y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1b2430';
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /** A numbered marker (a reflection): a white disc with an amber ring and the number. */
  function marker(p, text, alpha) {
    if (alpha <= 0 || !P(p.x, p.y, p.z)) return;
    const r = 9.5 * unit;
    mark(S.x, S.y, S.x, S.y, r + 2);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(S.x, S.y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = C.edge;
    ctx.stroke();
    ctx.fillStyle = C.ink;
    ctx.font = `600 ${Math.round(12.5 * unit)}px "Noto Sans Bengali", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, S.x, S.y + 0.5);
    ctx.globalAlpha = 1;
  }

  /** Pixels per world unit at a point (for sizes that follow the zoom). */
  function pxPerUnit(p) {
    if (!P(p.x, p.y, p.z)) return 1;
    const x = S.x;
    const y = S.y;
    P(p.x, p.y + 1, p.z);
    return Math.hypot(S.x - x, S.y - y);
  }

  function begin() {
    if (canvas.width !== Math.round(stage.width * dpr) || canvas.height !== Math.round(stage.height * dpr)) size();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    count = 0;
  }

  /** The screen point of a world point (a fresh object; for boxes and hit tests, not every frame). */
  function screen(x, y, z) {
    P(x, y, z);
    return { x: S.x, y: S.y };
  }

  return { canvas, begin, boxes, lightPath, sight, normal, angle, eye, marker, pxPerUnit, screen, size };
}
