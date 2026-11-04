// The two graph boards standing behind the road, as the owner's reference draws its graphs beside the motion: a white
// display in a slim dark frame on two posts. The left board is the x–t graph (a parabola), the right one the v–t
// graph (a straight line): axes named x, v and t with a few numbers, a light grid, the planned curve faint and dashed,
// the part already run solid, a dot at the moment; a short title with the live value on top, and under the graph the
// live equation with the numbers filled in, each in its quantity's colour: x = (½a)t² + (u)t + (x₀), v = (a)t + (u).
// Each board's face is one canvas texture, redrawn only when what it shows changes. Fixed scales, so a change of x₀,
// u or a shows as a change of the curve: x from −7 m to 10 m (the number line), v from −12 m/s to 12 m/s (the car
// can never go faster than about 11.3 m/s before it reaches an end of the axis), t from 0 to 6 s.
import * as THREE from 'three';
import { AXIS, LIMITS, position, velocity } from './motion.js';

const SPEC = {
  x: { min: AXIS.min, max: AXIS.max, ticks: [-5, 0, 5, 10] },
  v: { min: -12, max: 12, ticks: [-10, -5, 0, 5, 10] },
};
const SAMPLES = 64;
const TEX_PER_M = 100; // texels per metre of board
const FRAME = 0.16; // the frame's width (m)

/** Rich text on a canvas: [text, kind, colour] pieces, kind '' | 'i' | 'sup' | 'b'. Measures, or draws at (x, y). */
function rich(ctx, pieces, size, x, y, draw, font) {
  let w = 0;
  for (const [text, kind, color] of pieces) {
    const sup = kind === 'sup';
    const weight = kind === 'b' || color ? 700 : 500;
    ctx.font = `${kind === 'i' ? 'italic ' : ''}${weight} ${sup ? size * 0.66 : size}px ${font}`;
    if (draw) {
      ctx.fillStyle = color || '#1d2530';
      ctx.fillText(text, x + w, y - (sup ? size * 0.4 : 0));
    }
    w += ctx.measureText(text).width;
  }
  return w;
}

/**
 * One board. kind: 'x' | 'v'; num: the language's digits; fmt(x, d): a number for the equation; color: the curve's
 * colour; colors: { x0, u, a } for the equation's numbers; title: { name, value(text) → pieces } for the top line; font: the CSS font family.
 */
export function createBoard({ kind, num, fmt, fixed, color, colors, title, font }) {
  const S = SPEC[kind];
  const root = new THREE.Group();
  root.name = kind === 'x' ? 'Board x-t' : 'Board v-t';
  let canvas = document.createElement('canvas');
  let tex = null;
  const faceMat = new THREE.MeshBasicMaterial({ name: 'BoardFace', color: 0xffffff, toneMapped: false });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), faceMat);
  face.position.z = 0.03;
  const frameMat = new THREE.MeshStandardMaterial({ name: 'BoardFrame', color: 0x3e4a57, roughness: 0.45, metalness: 0.35 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), frameMat);
  const postGeo = new THREE.CylinderGeometry(0.11, 0.11, 1, 16);
  const posts = [new THREE.Mesh(postGeo, frameMat), new THREE.Mesh(postGeo, frameMat)];
  for (const m of posts) m.castShadow = true;
  root.add(back, face, ...posts);

  let size = { w: 0, h: 0, ground: 0 };
  let fs = 64; // the base text size in texels (set so it reads at about 13 px on the screen)
  /** The board is `px` pixels wide on the screen: size the text to read at `target` px. */
  function setTextPx(px, target) {
    if (!canvas.width || !px) return;
    const next = Math.round(Math.min(110, Math.max(46, (target * canvas.width) / px)));
    if (next !== fs) {
      fs = next;
      last = '';
    }
  }
  /** The board's size in metres, and the ground's height under it (relative to the board's bottom edge). */
  function setSize(w, h, groundBelow) {
    if (size.w === w && size.h === h && size.ground === groundBelow) return;
    size = { w, h, ground: groundBelow };
    face.scale.set(w - 2 * FRAME, h - 2 * FRAME, 1);
    face.position.y = h / 2;
    back.scale.set(w, h, 0.08);
    back.position.set(0, h / 2, -0.05);
    posts.forEach((p, i) => {
      p.scale.y = groundBelow;
      p.position.set((i ? 1 : -1) * w * 0.32, -groundBelow / 2, -0.08);
    });
    // a new canvas and texture for a new size (a texture's size is fixed once it is on the GPU)
    canvas = document.createElement('canvas');
    canvas.width = Math.min(2048, Math.round(TEX_PER_M * (w - 2 * FRAME)));
    canvas.height = Math.round((canvas.width * (h - 2 * FRAME)) / (w - 2 * FRAME));
    tex?.dispose();
    tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    faceMat.map = tex;
    faceMat.needsUpdate = true;
    last = '';
  }

  const value = (p, t) => (kind === 'x' ? position(p.x0, p.u, p.a, t) : velocity(p.u, p.a, t));
  let last = '';
  /**
   * Redraw for { x0, u, a } at time t (the run ends at tEnd). preview: draw the planned curve; at: the dot's value;
   * numbers: false writes "?" for the equation's numbers and the value (a test question must not show its answer).
   */
  function update(p, t, tEnd, { preview = true, at = null, numbers = true } = {}) {
    const key = `${p.x0}|${p.u}|${p.a}|${t.toFixed(4)}|${tEnd}|${preview}|${at}|${numbers}|${canvas.height}|${fs}`;
    if (key === last || !tex) return false;
    last = key;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#fcfdfe';
    ctx.fillRect(0, 0, W, H);
    const now = at ?? value(p, t);
    const k = fs / 64; // strokes and gaps grow with the text
    const n = (x) => (numbers ? num(fmt(x)) : '?');
    const eq =
      kind === 'x'
        ? [
            ['x', 'i'],
            [' = ', ''],
            [`(${n(p.a / 2)})`, '', colors.a],
            ['t', 'i'],
            ['2', 'sup'],
            [' + ', ''],
            [`(${n(p.u)})`, '', colors.u],
            ['t', 'i'],
            [' + ', ''],
            [`(${n(p.x0)})`, '', colors.x0],
          ]
        : [
            ['v', 'i'],
            [' = ', ''],
            [`(${n(p.a)})`, '', colors.a],
            ['t', 'i'],
            [' + ', ''],
            [`(${n(p.u)})`, '', colors.u],
          ];
    const val = title.value(numbers ? fixed(now, 2) : '?');
    const efs = fs * 1.08;
    const nfs = fs * 0.88;
    const pad = 30 * k;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    let plot; // the area for the plot, its numbers and its axis names
    {
      // the title line: the graph's name, and the value now
      const vw = rich(ctx, val, fs, 0, 0, false, font);
      ctx.font = `500 ${fs * 0.92}px ${font}`;
      ctx.fillStyle = '#4a5562';
      // too narrow for both: the value alone (the axis name says which graph)
      if (ctx.measureText(title.name).width + vw + 3 * pad < W) ctx.fillText(title.name, pad, pad + fs * 0.9);
      rich(ctx, val, fs, W - pad - vw, pad + fs * 0.9, true, font);
      // the equation band under the graph
      // on one line, or on two (split before "+ (u)t") when one line would need text much smaller
      let lines = [eq];
      const widest = () => Math.max(...lines.map((l) => rich(ctx, l, efs, 0, 0, false, font)));
      let es = Math.min(1, (W - 2 * pad) / widest());
      if (es < 0.85 && kind === 'x') {
        lines = [eq.slice(0, 5), eq.slice(5)];
        es = Math.min(1, (W - 2 * pad) / widest());
      }
      const lh = efs * es * 1.2;
      const band = efs * es * 0.35 + lh * lines.length;
      ctx.fillStyle = '#eef3f8';
      ctx.fillRect(0, H - band, W, band);
      lines.forEach((l, i) => {
        const lw = rich(ctx, l, efs * es, 0, 0, false, font);
        rich(ctx, l, efs * es, (W - lw) / 2, H - band + efs * es * 0.18 + lh * i + lh * 0.78, true, font);
      });
      plot = { l: fs * 2.1, r: W - fs * 1.2, t: pad + fs * 2.0, b: H - band - pad * 0.6 };
    }
    // the plot's frame: room above for the axis name, below for the t numbers when 0 is at the bottom
    const box = { l: plot.l, r: plot.r, t: plot.t + fs * 0.35, b: plot.b - (S.min >= 0 ? nfs * 1.3 : nfs * 0.2) };
    const tMax = LIMITS.t.max;
    const px = (tt) => box.l + (tt / tMax) * (box.r - box.l);
    const py = (y) => box.t + ((S.max - Math.min(S.max, Math.max(S.min, y))) / (S.max - S.min)) * (box.b - box.t);
    ctx.lineWidth = 2.5 * k;
    ctx.strokeStyle = '#dbe3ec';
    for (const v of S.ticks) {
      if (v === 0) continue;
      ctx.beginPath();
      ctx.moveTo(box.l, py(v));
      ctx.lineTo(box.r, py(v));
      ctx.stroke();
    }
    for (let tt = 1; tt <= tMax; tt++) {
      ctx.beginPath();
      ctx.moveTo(px(tt), box.t);
      ctx.lineTo(px(tt), box.b);
      ctx.stroke();
    }
    // the axes, with arrowheads
    ctx.strokeStyle = '#26303b';
    ctx.fillStyle = '#26303b';
    ctx.lineWidth = 5 * k;
    const a = 13 * k;
    ctx.beginPath();
    ctx.moveTo(box.l, box.b + 6 * k);
    ctx.lineTo(box.l, box.t - 1.2 * a);
    ctx.moveTo(box.l, py(0));
    ctx.lineTo(box.r + 2.2 * a, py(0));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(box.r + 3.6 * a, py(0));
    ctx.lineTo(box.r + 1.8 * a, py(0) - a);
    ctx.lineTo(box.r + 1.8 * a, py(0) + a);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(box.l, box.t - 2.6 * a);
    ctx.lineTo(box.l - a, box.t - 0.8 * a);
    ctx.lineTo(box.l + a, box.t - 0.8 * a);
    ctx.fill();
    // numbers: on the vertical axis, and t under the axis
    ctx.font = `600 ${nfs}px ${font}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#37424e';
    for (const v of S.ticks) ctx.fillText(num(String(v).replace('-', '−')), box.l - 12 * k, py(v));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const tBelow = Math.min(box.b + 4 * k, py(0) + 8 * k);
    for (let tt = 1; tt <= tMax; tt++) ctx.fillText(num(tt), px(tt), tBelow);
    // the axis names
    ctx.font = `italic 700 ${fs * 1.05}px ${font}`;
    ctx.fillStyle = '#1d2530';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(kind, box.l + 1.6 * a, box.t - 1.4 * a);
    ctx.textAlign = 'center';
    ctx.fillText('t', box.r + 2.8 * a, py(0) - fs * 0.62);
    // the planned curve (faint, dashed) and the part already run (solid)
    const curve = (t1) => {
      ctx.beginPath();
      for (let i = 0; i <= SAMPLES; i++) {
        const tt = (t1 * i) / SAMPLES;
        const X = px(tt);
        const Y = py(value(p, tt));
        if (i) ctx.lineTo(X, Y);
        else ctx.moveTo(X, Y);
      }
      ctx.stroke();
    };
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (preview && tEnd > 0) {
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 5 * k;
      ctx.setLineDash([16 * k, 14 * k]);
      curve(tEnd);
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    if (t > 0) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 10 * k;
      curve(t);
    }
    // the moment: dashed guides to both axes, a dot
    const dx = px(t);
    const dy = py(now);
    ctx.strokeStyle = 'rgba(38,48,59,0.55)';
    ctx.lineWidth = 3 * k;
    ctx.setLineDash([10 * k, 9 * k]);
    ctx.beginPath();
    ctx.moveTo(dx, dy);
    ctx.lineTo(dx, py(0));
    ctx.moveTo(dx, dy);
    ctx.lineTo(box.l, dy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(dx, dy, 17 * k, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(dx, dy, 12 * k, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    tex.needsUpdate = true;
    return true;
  }

  /** The board's four corners in world space (for the camera's framing). */
  function corners() {
    return [
      [-1, 0],
      [1, 0],
      [-1, 1],
      [1, 1],
    ].map(([sx, sy]) => root.localToWorld(new THREE.Vector3((sx * size.w) / 2, sy * size.h, 0)));
  }

  return { root, setSize, setTextPx, update, face, corners };
}
