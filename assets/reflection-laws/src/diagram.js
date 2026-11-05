// The drawing over the lake: the book's চিত্র ৮.০৩ as a fine vector drawing. Only the sheet is a 3D object. Everything else
// (rays, normal, arcs, arrowheads, handles) is painted on a 2D canvas above the view, from the exact 3D points projected
// through the camera: even anti-aliased lines of a constant width, with clean filled arrowheads, at any size. Every ray
// comes from the vectors of reading.js, so what is drawn is the law itself. A new part wears a soft glow for a moment.
// The magnifier of the smooth-and-rough step (loupe.js) is painted on the same canvas.
import * as THREE from 'three';
import { createLoupe } from './loupe.js';
import { reflected, toLight } from './reading.js';

export const L = 100; // the length of XO and OX′
export const SHEET = { half: 100, up: 104, down: 18 };
export const SWING = 100; // how far along the sheet's foot its handle is: on the ring on the water
export const ARC = 60; // the radius of the angles: well clear of O

const GLOW = '#ffe36e';
export const C = { ray: '#f59f00', rayDark: '#5f3400', normal: '#495057', ti: '#1971c2', tr: '#2b8a3e', ink: '#212529', sheet: '#33506b' };

/** The sheet's pale fill: strongest at the water, gone by its foot under the water, so it needs no lines there. */
function sheetTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 128;
  const g = c.getContext('2d');
  const r = g.createLinearGradient(0, 0, 0, 128);
  const atWater = SHEET.up / (SHEET.up + SHEET.down);
  r.addColorStop(0, 'rgba(255,255,255,0.2)');
  r.addColorStop(atWater, 'rgba(255,255,255,0.36)');
  r.addColorStop(atWater + 0.01, 'rgba(225,244,255,0.12)');
  r.addColorStop(1, 'rgba(225,244,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 4, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createDiagram({ scene, stage, host, words }) {
  const root = new THREE.Group();
  root.name = 'diagram';
  root.userData.noExport = true;
  scene.add(root);

  // ── the plane: one soft sheet, in the scene ───────────────────────────────────────────────────────────────
  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(SHEET.half * 2, SHEET.up + SHEET.down),
    new THREE.MeshBasicMaterial({ map: sheetTexture(), transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false }),
  );
  fill.position.y = (SHEET.up - SHEET.down) / 2;
  fill.visible = false;
  root.add(fill);

  // ── the drawing layer ─────────────────────────────────────────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.className = 'rl-draw';
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let dpr = 1;
  let w = 1;
  let h = 1;
  let unit = 1; // lines grow a little on big views
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
  /** Projects a scene point into sx, sy (canvas pixels). */
  function P(x, y, z) {
    pv.set(x, y, z).project(camera);
    sx = ((pv.x + 1) / 2) * w;
    sy = ((1 - pv.y) / 2) * h;
  }
  // a path in pixels, kept so that it can be stroked twice (halo, then line) without being worked out twice
  const MAX = 96;
  const path = new Float32Array(MAX * 2);
  let count = 0;
  const add = (x, y, z) => {
    P(x, y, z);
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
  /** Strokes the path: a thin halo, then the line. dash is in pixels. */
  function stroke(color, width, halo, haloWidth, dash = NO_DASH, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.setLineDash(dash);
    ctx.lineCap = dash.length ? 'butt' : 'round'; // round caps would close the gaps of a dashed line
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
  /** A clean swept-back arrowhead at x, y, pointing along (dx, dy), length in px. */
  function chevron(x, y, dx, dy, length, color, edge, alpha = 1) {
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    const a = length * unit * 0.6; // tip ahead of the point
    const b = length * unit * 0.4; // back behind it
    const c = length * unit * 0.42; // half its width
    const n = length * unit * 0.12; // the notch
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
  function dot(x, y, z, radius, color, ring) {
    P(x, y, z);
    ctx.beginPath();
    ctx.arc(sx, sy, radius * unit, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = ring;
    ctx.lineWidth = 1.8 * unit;
    ctx.stroke();
  }
  /** The path once more, as a soft light under the line: the part that has just arrived. */
  function shine(amount, width = 13) {
    if (amount <= 0) return;
    stroke(GLOW, width * 0.55, null, 0, NO_DASH, 0.85 * amount);
    stroke(GLOW, width, null, 0, NO_DASH, 0.34 * amount);
  }
  /** A ray from (a) to (b) with its arrowhead at the fraction t of the way, pointing from a to b. */
  function ray(ax, ay, az, bx, by, bz, t = 0.5, alpha = 1, glow = 0) {
    count = 0;
    add(ax, ay, az);
    add(bx, by, bz);
    shine(glow);
    stroke(C.ray, 2.5, C.rayDark, 4, NO_DASH, alpha);
    P(ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t);
    const mx = sx;
    const my = sy;
    P(ax + (bx - ax) * (t + 0.04), ay + (by - ay) * (t + 0.04), az + (bz - az) * (t + 0.04));
    chevron(mx, my, sx - mx, sy - my, 14, C.ray, C.rayDark, alpha);
  }
  /** A signed angle a (degrees) from the normal on a circle of radius r, in the sheet: into qx, qy, qz. */
  let qx = 0;
  let qy = 0;
  let qz = 0;
  function onArc(a, r) {
    const d = (a * Math.PI) / 180;
    const { x: ux, z: uz } = dirs.u;
    qx = ux * Math.sin(d) * r;
    qy = Math.cos(d) * r;
    qz = uz * Math.sin(d) * r;
  }
  /** An arc between two signed angles, with arrows or ticks at its ends. */
  function arc({ a0, a1, r, color, ends }) {
    const n = Math.min(MAX - 1, 40);
    count = 0;
    for (let i = 0; i <= n; i++) {
      onArc(a0 + ((a1 - a0) * i) / n, r);
      add(qx, qy, qz);
    }
    shine(glowOf('angles'));
    stroke(color, 2.4, '#ffffff', 3.8);
    const headAt = (a, inward) => {
      onArc(a, r);
      P(qx, qy, qz);
      const x = sx;
      const y = sy;
      onArc(a + inward, r);
      P(qx, qy, qz);
      return [x, y, x - sx, y - sy];
    };
    const sign = a1 > a0 ? 1 : -1;
    if (ends === 'arrows' && Math.abs(a1 - a0) >= 18) {
      const [x0, y0, d0x, d0y] = headAt(a0, sign * 3);
      chevron(x0 + d0x * -2.2, y0 + d0y * -2.2, d0x, d0y, 9, color, '#ffffff');
      const [x1, y1, d1x, d1y] = headAt(a1, -sign * 3);
      chevron(x1 + d1x * -2.2, y1 + d1y * -2.2, d1x, d1y, 9, color, '#ffffff');
    }
    if (ends === 'ticks') {
      for (const a of [a0, a1]) {
        count = 0;
        onArc(a, r - 4.5);
        add(qx, qy, qz);
        onArc(a, r + 4.5);
        add(qx, qy, qz);
        stroke(color, 2, '#ffffff', 3.4);
      }
    }
  }

  // ── what is shown: a plain description the figure fills in ────────────────────────────────────────────────
  const dirs = { light: { x: 0, y: 1, z: 0 }, out: { x: 0, y: 1, z: 0 }, u: { x: 1, y: 0, z: 0 } };
  const pX = new THREE.Vector3();
  const pXr = new THREE.Vector3();
  const pS = new THREE.Vector3();
  const v = {
    sheet: 0, // the sheet's strength, 0 … 1
    edges: 0, // its thin edges and waterline
    rise: 1, // how far it has risen from the water
    normal: 0, // how far the normal has grown
    incident: 0, // how far XO has come, from X
    reflected: 0, // how far OX′ has grown
    x: false,
    o: 0, // the point of incidence, 0 … 1
    swing: false,
    rightAngle: false,
    arcs: [], // { a0, a1, r, color, ends }
    leaders: [], // { from: Vector3, to: Vector3, color }
    cands: [], // candidate rays of the test: { dir, drop }
    loupe: null, // the magnifier: { strength, time, alpha, picks? }
    ring: 0, // the thin circle on the water round O, 0 … 1
    ringR: SHEET.half, // and its radius: it opens as the plane rises
    dihedral: false, // the 90° between the sheet and the water
    glow: { part: '', a: 0 }, // what has just arrived: 'ray', 'o', 'normal', 'plane', 'out', 'angles'
  };
  const glowOf = (part) => (v.glow.part === part ? v.glow.a : 0);
  const loupe = createLoupe({ colors: C, words });
  // the spot on the water the magnifier enlarges: under a pixel just above its rim
  const ndc = new THREE.Vector3();
  const spot = new THREE.Vector3();
  const spotPx = { x: 0, y: 0 };
  let spotOk = false;
  function findSpot() {
    spotPx.x = w * 0.62; // beside the tip of the mountain's image, not on it
    spotPx.y = loupe.box.y - 20;
    ndc.set((spotPx.x / w) * 2 - 1, 1 - (spotPx.y / h) * 2, 0.5).unproject(camera);
    ndc.sub(camera.position);
    spotOk = ndc.y < -1e-6;
    if (spotOk) spot.copy(camera.position).addScaledVector(ndc, -camera.position.y / ndc.y);
    return spotOk ? spotPx : null;
  }
  function paintLoupe() {
    const a = v.loupe;
    loupe.layout(w, h);
    const at = findSpot();
    a.spot = at;
    if (a.picks) loupe.paintPick(ctx, a);
    else loupe.paint(ctx, a);
  }
  const DASH_N = [8, 6];
  const DASH_D = [3.5, 3];

  function paint() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const { x: ux, z: uz } = dirs.u;
    const { half, up, down } = SHEET;
    if (v.ring > 0) {
      // a thin circle on the water: it shows the water as a flat floor, and the sheet's foot turns on it
      count = 0;
      for (let i = 0; i <= 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        add(Math.cos(a) * v.ringR, 0, Math.sin(a) * v.ringR);
      }
      stroke('#ffffff', 1.2, 'rgba(10,50,70,0.45)', 2.4, NO_DASH, 0.75 * v.ring);
    }
    if (v.edges > 0) {
      count = 0;
      add(-half * ux, 0, -half * uz);
      add(-half * ux, up * v.rise, -half * uz);
      add(half * ux, up * v.rise, half * uz);
      add(half * ux, 0, half * uz);
      shine(glowOf('plane'), 9);
      stroke('#ffffff', 1.5, C.sheet, 2.6, NO_DASH, 0.9 * v.edges);
      // its foot on the water: the line where it stands
      count = 0;
      add(-half * ux, 0, -half * uz);
      add(half * ux, 0, half * uz);
      shine(glowOf('plane'), 9);
      stroke('#ffffff', 2.4, C.sheet, 4, NO_DASH, v.edges);
    }
    if (v.dihedral) {
      // the 90° between the sheet and the water: from a point of its foot, one leg up the sheet, one along the water
      const a = 34;
      const c = 12;
      const fx = ux * half * 0.7;
      const fz = uz * half * 0.7;
      count = 0;
      add(fx, a, fz);
      add(fx, 0, fz);
      add(fx - uz * a, 0, fz + ux * a);
      stroke('#ffffff', 2, C.sheet, 3.4);
      count = 0;
      add(fx, c, fz);
      add(fx - uz * c, c, fz + ux * c);
      add(fx - uz * c, 0, fz + ux * c);
      stroke('#ffffff', 1.4, C.sheet, 2.6);
    }
    if (v.normal > 0) {
      const top = up + 6;
      const low = -down * 0.8;
      const y = low + (top - low) * v.normal;
      if (y > 0) {
        count = 0;
        add(0, 0, 0);
        add(0, y, 0);
        shine(glowOf('normal'));
        stroke('#2b3036', 2.6, 'rgba(255,255,255,0.9)', 4.6, DASH_N);
      }
      // under the water it fades: there it is only imagined
      count = 0;
      add(0, 0, 0);
      add(0, Math.max(low, Math.min(0, y)), 0);
      stroke(C.normal, 1.6, null, 0, DASH_N, 0.55);
    }
    if (v.rightAngle) {
      const a = 11;
      count = 0;
      add(0, a, 0);
      add(ux * a, a, uz * a);
      add(ux * a, 0, uz * a);
      stroke(C.ink, 1.2, '#ffffff', 2.4);
    }
    for (const l of v.leaders) {
      count = 0;
      add(l.from.x, l.from.y, l.from.z);
      add(l.to.x, l.to.y, l.to.z);
      stroke(l.color, 1);
    }
    for (const a of v.arcs) arc(a);
    if (v.incident > 0) {
      const k = 1 - v.incident;
      ray(pX.x, pX.y, pX.z, pX.x * k, pX.y * k, pX.z * k, 0.5 / Math.max(0.5, v.incident), 1, glowOf('ray'));
    }
    if (v.reflected > 0) {
      const k = v.reflected;
      ray(0, 0, 0, pXr.x * k, pXr.y * k, pXr.z * k, 0.5 / Math.max(0.5, k), 1, glowOf('out'));
    }
    for (const c of v.cands) {
      const t = c.dir;
      ray(0, 0, 0, t.x * L, t.y * L, t.z * L, 0.6);
      if (c.drop) {
        count = 0;
        add(t.x * L, t.y * L, t.z * L);
        add(t.x * L, 0, t.z * L);
        stroke('#ffffff', 1.3, C.sheet, 2.4, DASH_D);
        dot(t.x * L, 0, t.z * L, 3.4, C.sheet, '#ffffff');
      }
    }
    if (v.x) dot(pX.x, pX.y, pX.z, 6, C.ray, '#ffffff');
    if (v.reflected >= 1) dot(pXr.x, pXr.y, pXr.z, 3.6, C.ray, '#ffffff');
    if (v.o > 0) {
      const g = glowOf('o');
      if (g > 0) {
        // the point of incidence: a ring that opens round it
        P(0, 0, 0);
        ctx.beginPath();
        ctx.arc(sx, sy, (10 + (1 - g) * 22) * unit, 0, Math.PI * 2);
        ctx.strokeStyle = GLOW;
        ctx.lineWidth = 3 * unit;
        ctx.globalAlpha = g;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      dot(0, 0, 0, 3.6 + 3.4 * (g + (1 - v.o)), C.ink, '#ffffff');
    }
    if (v.swing) {
      // the handle: at least 26 px, with a double arrow that says it turns
      P(pS.x, pS.y, pS.z);
      const x = sx;
      const y = sy;
      const r = 13 * unit;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = C.sheet;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.4 * unit;
      ctx.stroke();
      const a = r * 0.58;
      ctx.lineWidth = 2 * unit;
      ctx.beginPath();
      ctx.moveTo(x - a, y);
      ctx.lineTo(x + a, y);
      ctx.moveTo(x - a * 0.45, y - a * 0.5);
      ctx.lineTo(x - a, y);
      ctx.lineTo(x - a * 0.45, y + a * 0.5);
      ctx.moveTo(x + a * 0.45, y - a * 0.5);
      ctx.lineTo(x + a, y);
      ctx.lineTo(x + a * 0.45, y + a * 0.5);
      ctx.stroke();
    }
    if (v.loupe) paintLoupe();
  }
  stage.onResize(size);
  stage.onAfterRender(paint);

  return {
    canvas,
    pX,
    pXr,
    pS,
    dirs,
    view: v,
    spot,
    /** Whether the magnifier's spot is on the water now. */
    spotOn: () => spotOk,
    /** Everything off. */
    clear() {
      Object.assign(v, {
        sheet: 0,
        edges: 0,
        normal: 0,
        incident: 0,
        reflected: 0,
        x: false,
        o: 0,
        swing: false,
        rightAngle: false,
        dihedral: false,
        loupe: null,
      });
      v.arcs.length = 0;
      v.leaders.length = 0;
      v.cands.length = 0;
      fill.visible = false;
    },
    /** The state's geometry, straight from reading.js. */
    pose(theta, phi) {
      const a = (phi * Math.PI) / 180;
      const l = toLight(theta, phi);
      const r = reflected(theta, phi);
      dirs.light = l;
      dirs.out = r;
      dirs.u = { x: Math.cos(a), y: 0, z: Math.sin(a) };
      pX.set(l.x, l.y, l.z).multiplyScalar(L);
      pXr.set(r.x, r.y, r.z).multiplyScalar(L);
      pS.set(dirs.u.x, 0, dirs.u.z).multiplyScalar(SWING);
      fill.rotation.y = -a;
    },
    /** The sheet at strength k, risen from the water to the fraction rise of its height. */
    sheet(k, rise = 1) {
      fill.visible = k > 0;
      fill.material.opacity = k;
      fill.scale.y = Math.max(0.001, rise);
      fill.position.y = ((SHEET.up - SHEET.down) / 2) * rise;
      v.sheet = v.edges = k;
      v.rise = rise;
    },
    /** The magnifier, flat at strength 0. Returns the spread of its reflected rays, degrees. */
    setLoupe(strength, time, picks = null) {
      v.loupe = { strength, time, alpha: 1, picks };
      return loupe.trace(strength, time);
    },
    /** The magnifier's traced rays (reading.js, loupeInto). */
    loupeRays: loupe.rays,
    /** Draw now, over the frame just drawn. */
    paint,
  };
}
