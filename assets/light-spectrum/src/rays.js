// The drawing over the 3D view, painted on a 2D canvas from exact 3D points projected through the camera: the sunlight, its
// plain reflection, the fan of colours, the printed scale beside the spectrum, the marker, the wave on the chosen ray, and the
// magnifying circle on the grooves. Nothing here is a 3D object, so every line stays even and crisp at any size.
import * as THREE from 'three';
import { alongWall, DISC, glow, isVisible, landing, MAX_NM, MIN_NM, pureColour, SPOT, TO_SUN, WALL, WALL_ALONG, wallPoint } from './reading.js';

const FONT = '"Noto Sans Bengali", sans-serif';
export const INK = { edge: '#20262e', sun: '#fffdf2', mark: '#1f2933', hidden: '#d5dde6' };
const WAVE_LENGTH = 11.5; // cm of the chosen ray that carries the wave, ending at the wall
const WAVE_AMP = 0.95; // cm
const CM_PER_NM = 0.0042; // the wave is drawn this big: 400 nm as 1.7 cm, 700 nm as 2.9 cm
const U_SCALE = alongWall(landing(550)) - 2.1; // where the scale stands on the wall, left of the band
const U_RIGHT = alongWall(landing(550)) + 1.5; // how far the marker's line reaches
const FAN = [];
for (let nm = 400; nm < 700; nm += 10) FAN.push({ a: landing(nm), b: landing(nm + 10), color: pureColour(nm + 5), fade: glow(nm + 5) });
const EDGES = [
  { at: landing(425), color: pureColour(425) },
  { at: landing(470), color: pureColour(470) },
  { at: landing(530), color: pureColour(530) },
  { at: landing(580), color: pureColour(580) },
  { at: landing(605), color: pureColour(605) },
  { at: landing(665), color: pureColour(665) },
];
const WORDS = { violet: '#5f27cd', red: '#c92a2a' }; // the end words on the wall, dark enough to read on white
/** Where each whole wavelength lands: worked out once for each, so that a frame allocates nothing. */
const LANDED = new Map();
const at = (nm) => {
  let p = LANDED.get(nm);
  if (!p) {
    p = landing(nm);
    LANDED.set(nm, p);
  }
  return p;
};
const WHITE_AT = landing(0);
const SKY = { x: SPOT.x + TO_SUN.x * 60, y: SPOT.y + TO_SUN.y * 60, z: SPOT.z + TO_SUN.z * 60 };

export function createRays({ stage, host, t }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'lab-draw';
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
  const Pxyz = (x, y, z) => {
    pv.set(x, y, z).project(camera);
    sx = ((pv.x + 1) / 2) * w;
    sy = ((1 - pv.y) / 2) * h;
  };
  const P = (p) => Pxyz(p.x, p.y, p.z);

  /** What is shown; the figure fills this in. */
  const v = {
    beam: 0, // the sunlight's way down to the disc, 0 … 1
    out: 0, // the way out to the wall, 0 … 1
    fan: 1, // how strongly the fan shows
    nm: 550,
    chosen: 0, // the ray of the chosen wavelength
    wave: 0, // its wave
    scale: 0, // the printed scale
    marker: 0,
    lens: 0, // the magnifying circle
    tags: [], // the test's letters: { nm, text } on the band, or { p, dx, dy, text } on a world point
    plain: false, // the marker is a plain dot (the test)
    named: false, // the marker wears its label, so the number under it steps aside
    words: null, // the two end words: [violet, red]
  };

  function ray(ax, ay, bx, by, width, color, edge = INK.edge) {
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.strokeStyle = edge;
    ctx.lineWidth = width + 1.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  function chevron(x, y, dx, dy, length, color) {
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    const a = length * 0.6;
    const b = length * 0.4;
    const c = length * 0.42;
    const n = length * 0.12;
    ctx.beginPath();
    ctx.moveTo(x + ux * a, y + uy * a);
    ctx.lineTo(x - ux * b - uy * c, y - uy * b + ux * c);
    ctx.lineTo(x - ux * n, y - uy * n);
    ctx.lineTo(x - ux * b + uy * c, y - uy * b - ux * c);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = INK.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  let spotX = 0;
  let spotY = 0;
  function sunlight() {
    if (v.beam <= 0) return;
    P(SKY);
    const x0 = sx;
    const y0 = sy;
    P(SPOT);
    spotX = sx;
    spotY = sy;
    const x1 = x0 + (sx - x0) * v.beam;
    const y1 = y0 + (sy - y0) * v.beam;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,250,225,0.28)';
    ctx.lineWidth = 11;
    ctx.stroke();
    ray(x0, y0, x1, y1, 3.4, INK.sun);
    if (v.beam >= 1) {
      // the arrowhead stays on the part of the ray that is on the screen, a little before the disc
      const k = 1 - 54 / Math.max(108, Math.hypot(x0 - sx, y0 - sy));
      chevron(x0 + (sx - x0) * k, y0 + (sy - y0) * k, sx - x0, sy - y0, 14, INK.sun);
    }
  }
  function reflected() {
    if (v.out <= 0) return;
    P(SPOT);
    const x0 = sx;
    const y0 = sy;
    P(WHITE_AT);
    const x1 = x0 + (sx - x0) * v.out;
    const y1 = y0 + (sy - y0) * v.out;
    ctx.globalAlpha = v.fan;
    ray(x0, y0, x1, y1, 1.8, INK.sun);
    if (v.out >= 1) chevron(x0 + (sx - x0) * 0.52, y0 + (sy - y0) * 0.52, sx - x0, sy - y0, 12, INK.sun);
    ctx.globalAlpha = 1;
  }
  function fan() {
    if (v.out <= 0 || v.fan <= 0) return;
    P(SPOT);
    const x0 = sx;
    const y0 = sy;
    const k = v.out;
    for (const f of FAN) {
      ctx.globalAlpha = 0.34 * v.fan * f.fade;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      P(f.a);
      ctx.lineTo(x0 + (sx - x0) * k, y0 + (sy - y0) * k);
      P(f.b);
      ctx.lineTo(x0 + (sx - x0) * k, y0 + (sy - y0) * k);
      ctx.closePath();
      ctx.fillStyle = f.color;
      ctx.fill();
    }
    ctx.globalAlpha = v.fan;
    for (const e of EDGES) {
      P(e.at);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + (sx - x0) * k, y0 + (sy - y0) * k);
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  const unit = new THREE.Vector3();
  const eField = new THREE.Vector3();
  /** The chosen ray, and on its last part the wave, standing up from the ray. */
  function chosen() {
    if (v.chosen <= 0) return;
    const to = at(v.nm);
    const seen = isVisible(v.nm);
    const color = seen ? pureColour(v.nm) : INK.hidden;
    P(SPOT);
    const x0 = sx;
    const y0 = sy;
    P(to);
    ctx.globalAlpha = v.chosen;
    if (!seen) ctx.setLineDash([7, 5]);
    ray(x0, y0, sx, sy, 2, color);
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    if (v.wave <= 0) return;
    unit.set(to.x - SPOT.x, to.y - SPOT.y, to.z - SPOT.z).normalize();
    eField.set(0, 1, 0).addScaledVector(unit, -unit.y).normalize();
    const lambda = v.nm * CM_PER_NM;
    const sine = (field, width, alpha) => {
      ctx.beginPath();
      for (let i = 0; i <= 110; i++) {
        const s = (i / 110) * WAVE_LENGTH; // back from the wall
        const e = Math.min(1, s / 1.2, (WAVE_LENGTH - s) / 1.2) * Math.sin((2 * Math.PI * s) / lambda) * WAVE_AMP * v.wave;
        Pxyz(to.x - unit.x * s + field.x * e, to.y - unit.y * s + field.y * e, to.z - unit.z * s + field.z * e);
        if (i) ctx.lineTo(sx, sy);
        else ctx.moveTo(sx, sy);
      }
      ctx.lineJoin = 'round';
      ctx.strokeStyle = INK.edge;
      ctx.lineWidth = width + 1.4;
      ctx.globalAlpha = alpha;
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.globalAlpha = 1;
    };
    sine(eField, 2.4, v.wave);
    // one wavelength, measured between two crests
    const s1 = lambda * (Math.round((WAVE_LENGTH * 0.26) / lambda) + 0.25);
    const s2 = s1 + lambda;
    const top = WAVE_AMP * 1.5;
    const along = (s, up) => Pxyz(to.x - unit.x * s + eField.x * up, to.y - unit.y * s + eField.y * up, to.z - unit.z * s + eField.z * up);
    along(s1, top);
    const ax = sx;
    const ay = sy;
    along(s2, top);
    const bx = sx;
    const by = sy;
    along(s1, WAVE_AMP * 1.04);
    const cx = sx;
    const cy = sy;
    along(s2, WAVE_AMP * 1.04);
    ctx.globalAlpha = v.wave;
    ctx.lineCap = 'butt';
    for (const [c, wd] of [
      [INK.edge, 3.2],
      ['#ffffff', 1.5],
    ]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = wd;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    v.bracket.x = to.x - unit.x * (s1 + s2) * 0.5 + eField.x * top;
    v.bracket.y = to.y - unit.y * (s1 + s2) * 0.5 + eField.y * top;
    v.bracket.z = to.z - unit.z * (s1 + s2) * 0.5 + eField.z * top;
  }
  v.bracket = new THREE.Vector3();

  /** The scale printed on the wall, beside the band; the part past the two ends is dashed. */
  const onScale = (nm, du = 0) => {
    const u = U_SCALE + du;
    Pxyz(WALL.at.x + WALL_ALONG.x * u, at(nm).y, WALL.at.z + WALL_ALONG.z * u);
  };
  function scale() {
    if (v.scale <= 0) return;
    const line = (a, b, dash) => {
      ctx.beginPath();
      onScale(a);
      ctx.moveTo(sx, sy);
      onScale(b);
      ctx.lineTo(sx, sy);
      ctx.setLineDash(dash);
      ctx.stroke();
      ctx.setLineDash([]);
    };
    ctx.globalAlpha = v.scale;
    ctx.strokeStyle = INK.mark;
    ctx.fillStyle = INK.mark;
    ctx.lineWidth = 1.5;
    line(400, 700, []);
    ctx.lineWidth = 1.1;
    line(MIN_NM + 10, 400, [4, 3]);
    line(700, MAX_NM - 20, [4, 3]);
    ctx.font = `600 12.5px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let n = 400; n <= 700; n += 25) {
      const big = n % 100 === 0;
      onScale(n);
      const a = sx;
      const b = sy;
      onScale(n, big ? -0.42 : n % 50 === 0 ? -0.3 : -0.18);
      ctx.lineWidth = big ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(a, b);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      if (big && !(v.named && Math.abs(n - v.nm) < 22)) {
        const text = t.num(n);
        const wn = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(255,255,255,0.74)';
        ctx.fillRect(sx - 4 - wn - 2, sy - 8, wn + 4, 16);
        ctx.fillStyle = INK.mark;
        ctx.fillText(text, sx - 4, sy + 0.5);
      }
    }
    ctx.font = `600 11.5px ${FONT}`;
    ctx.fillStyle = INK.mark;
    onScale(760, -0.42);
    ctx.fillText('nm', sx - 4, sy);
    if (v.words) {
      // the two ends of the band, named in their own colours
      ctx.font = `600 12.5px ${FONT}`;
      ctx.textAlign = 'center';
      // each steps aside while the marker's label is at that end
      if (!(v.named && Math.abs(v.nm - 722) < 50)) {
        ctx.fillStyle = WORDS.red;
        onScale(722, 2.3);
        ctx.fillText(v.words[1], sx, sy);
      }
      if (!(v.named && Math.abs(v.nm - 374) < 50)) {
        ctx.fillStyle = WORDS.violet;
        onScale(374, 2.3);
        ctx.fillText(v.words[0], sx, sy);
      }
    }
    ctx.globalAlpha = 1;
  }
  function marker() {
    if (v.marker <= 0) return;
    onScale(v.nm);
    const ax = sx;
    const ay = sy;
    Pxyz(WALL.at.x + WALL_ALONG.x * U_RIGHT, at(v.nm).y, WALL.at.z + WALL_ALONG.z * U_RIGHT);
    ctx.globalAlpha = v.marker;
    ctx.lineCap = 'butt';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    ctx.strokeStyle = INK.mark;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(sx, sy);
    ctx.stroke();
    v.handle.x = ax;
    v.handle.y = ay;
    if (v.plain) {
      // in the test it cannot be moved: a plain black dot
      ctx.beginPath();
      ctx.arc(ax, ay, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = INK.mark;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }
    // the handle, a knob on the scale, with its two small arrows
    ctx.beginPath();
    ctx.arc(ax, ay, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = INK.mark;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = INK.mark;
    for (const k of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(ax, ay + k * 7.2);
      ctx.lineTo(ax - 3.8, ay + k * 2.6);
      ctx.lineTo(ax + 3.8, ay + k * 2.6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  v.handle = { x: 0, y: 0 };

  /** The test's letters, each on a stalk from a place on the band. */
  function tags() {
    if (!v.tags.length) return;
    ctx.font = `600 14px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const g of v.tags) {
      if (g.p) P(g.p);
      else P(at(g.nm));
      const ax = sx;
      const ay = sy;
      if (g.p) {
        sx = ax + g.dx;
        sy = ay + g.dy;
      } else onScale(g.nm);
      const lx = sx;
      const ly = sy;
      ctx.strokeStyle = INK.mark;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(lx, ly);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ax, ay, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = INK.mark;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lx, ly, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = INK.mark;
      ctx.fillText(g.text, lx, ly + 0.5);
    }
  }

  /** The grooves, magnified: a circle joined to the place on the disc that it shows. Fine lines 1.6 µm apart. */
  const lensBox = { left: 0, top: 0, right: 0, bottom: 0 };
  function lens() {
    if (v.lens <= 0) {
      lensBox.right = lensBox.left = -1;
      return;
    }
    P(SPOT);
    const px = sx;
    const py = sy;
    const size = Math.min(w, h) * 0.25;
    const R = size * v.lens;
    const cx = 12 + size;
    const cy = h - 34 - size;
    lensBox.left = cx - R - 2;
    lensBox.right = cx + R + 2;
    lensBox.top = cy - R - 2;
    lensBox.bottom = cy + R + 2;
    // the two lines of sight
    const d = Math.hypot(px - cx, py - cy) || 1;
    const nx = -(py - cy) / d;
    const ny = (px - cx) / d;
    ctx.strokeStyle = 'rgba(255,255,255,0.86)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(cx + nx * R, cy + ny * R);
    ctx.moveTo(px, py);
    ctx.lineTo(cx - nx * R, cy - ny * R);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.stroke();
    // the grooves run where the disc's level line runs on the screen, here at this spot
    Pxyz(SPOT.x + DISC.side.x, SPOT.y + DISC.side.y, SPOT.z + DISC.side.z);
    let turn = Math.atan2(sy - py, sx - px);
    if (Math.abs(turn) > Math.PI / 2) turn += Math.PI;
    const gap = R / 2.4;
    const far = 9 * R; // the circles' centre, down the radius: a little curved, like the real ones
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#c9d1d9';
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.translate(cx, cy);
    ctx.rotate(turn);
    for (let i = -4; i <= 4; i++) {
      // a groove: a dark furrow with one lit edge
      ctx.beginPath();
      ctx.arc(0, i * gap + far, far, Math.PI * 1.36, Math.PI * 1.64);
      ctx.strokeStyle = '#6d7a87';
      ctx.lineWidth = gap * 0.34;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, i * gap + far + gap * 0.26, far, Math.PI * 1.36, Math.PI * 1.64);
      ctx.strokeStyle = '#f4f7fa';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = INK.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
    if (v.lens < 1) return;
    // across the grooves, the way the colours fan out: the distance between two, and an arrow
    const ux = -Math.sin(turn);
    const uy = Math.cos(turn);
    const ex = Math.cos(turn);
    const ey = Math.sin(turn);
    const bx = cx + ex * R * 0.46;
    const by = cy + ey * R * 0.46;
    const ax = cx - ex * R * 0.46;
    const ay = cy - ey * R * 0.46;
    const line = (x0, y0, x1, y1) => {
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
    };
    for (const [c, wd] of [
      ['#ffffff', 3.4],
      [INK.mark, 1.5],
    ]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = wd;
      ctx.beginPath();
      const hx = bx + ux * gap * 0.5;
      const hy = by + uy * gap * 0.5;
      const kx = bx - ux * gap * 0.5;
      const ky = by - uy * gap * 0.5;
      line(hx, hy, kx, ky);
      line(hx - ex * 6, hy - ey * 6, hx + ex * 6, hy + ey * 6);
      line(kx - ex * 6, ky - ey * 6, kx + ex * 6, ky + ey * 6);
      // the arrow, up the disc: the side the colours go
      const tx = ax - ux * R * 0.5;
      const ty = ay - uy * R * 0.5;
      line(ax + ux * R * 0.2, ay + uy * R * 0.2, tx, ty);
      line(tx, ty, tx + ux * 7 + ex * 5, ty + uy * 7 + ey * 5);
      line(tx, ty, tx + ux * 7 - ex * 5, ty + uy * 7 - ey * 5);
      ctx.stroke();
    }
    ctx.font = `600 12px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const tag = (text, x, yy) => {
      const tw = ctx.measureText(text).width;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - tw / 2 - 4, yy - 8.5, tw + 8, 17);
      ctx.fillStyle = INK.mark;
      ctx.fillText(text, x, yy + 0.5);
    };
    tag(t('l_pitch', { d: t.num(1.6) }), bx, by + gap * 0.5 + 15);
    tag(t('l_groove'), cx + ex * R * 0.36 - ux * gap * 2, cy + ey * R * 0.36 - uy * gap * 2);
    tag(t('l_split'), cx, cy + R * 0.74);
  }

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    fan();
    reflected();
    sunlight();
    chosen();
    scale();
    marker();
    tags();
    lens();
    if (v.beam >= 1) {
      ctx.beginPath();
      ctx.arc(spotX, spotY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fff7d6';
      ctx.fill();
      ctx.strokeStyle = INK.edge;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  /** The boxes a label keeps off, canvas px. */
  const pool = Array.from({ length: 48 }, () => ({ left: 0, top: 0, right: 0, bottom: 0 }));
  const list = [];
  function boxes() {
    list.length = 0;
    let n = 0;
    const put = (x, y, r) => {
      if (n >= pool.length) return;
      const b = pool[n++];
      b.left = x - r;
      b.right = x + r;
      b.top = y - r;
      b.bottom = y + r;
      list.push(b);
    };
    if (v.beam > 0) {
      P(SKY);
      const x0 = sx;
      const y0 = sy;
      P(SPOT);
      for (let i = 2; i <= 10; i++) put(sx + ((x0 - sx) * i) / 40, sy + ((y0 - sy) * i) / 40, 6);
    }
    if (v.scale > 0) {
      for (let k = 400; k <= 700; k += 50) {
        onScale(k);
        put(sx - 16, sy, 14);
      }
    }
    if (v.marker > 0) put(v.handle.x, v.handle.y, 13);
    if (v.lens > 0) list.push(lensBox);
    return list;
  }

  /** Where a wavelength's point of the band is on the canvas (a reused object). */
  const screen = { x: 0, y: 0 };
  function bandPoint(nm, up = 0) {
    const p = at(nm);
    Pxyz(p.x, p.y + up, p.z);
    screen.x = sx;
    screen.y = sy;
    return screen;
  }
  const onRule = new THREE.Vector3();
  /** The world point of a wavelength on the scale. */
  function scaleAt(nm) {
    const p = wallPoint(U_SCALE, at(nm).y);
    return onRule.set(p.x, p.y, p.z);
  }
  /** Canvas position of a world point. */
  function project(p) {
    P(p);
    screen.x = sx;
    screen.y = sy;
    return screen;
  }

  return { canvas, view: v, paint, boxes, bandPoint, project, scaleAt };
}
