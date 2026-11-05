// The drawing over the lake, the book's চিত্র ৮.০৩ made solid: the rays, the normal, the upright sheet of the plane of
// incidence, the angles θi and θr, and the handles the student drags. Every line is placed from the vectors of
// reading.js, so what is drawn is the law itself. Everything here is a diagram (noExport): it always shows, even
// through the water, as the book's sheet does.
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { facetInto, heightAt, reflected, refracted, toLight } from './reading.js';

export const L = 100; // the length of XO and OX′
export const REACH = 215; // how far the rays run on, out of the view (the light comes from far away)
export const SHEET = { half: 124, up: 126, down: 40 };
export const DIAL = 104; // the ring on the water that the sheet turns on, and its handle
export const ARC = 38; // the radius of the angles
export const BUNDLE = { n: 7, gap: 13, up: 300, out: 136, in: 58 };

export const C = { ray: '#f59f00', rayDark: '#7a4300', normal: '#495057', ti: '#1971c2', tr: '#2b8a3e', ink: '#212529', white: '#ffffff' };

const ORDER = { sheet: 2, wedge: 3, under: 5, line: 6, head: 7, knob: 9 };

function fatMaterial(color, width, opts = {}) {
  return new LineMaterial({ color, linewidth: width, worldUnits: true, transparent: true, depthTest: false, depthWrite: false, ...opts });
}

/** A straight or bent line with an outline under it. set(points) writes in place: nothing is allocated. */
function polyline(parent, { color, width, outline, outlineWidth, points = 2, dashed = false, dash = 6, gap = 4 }) {
  const geo = new LineGeometry();
  geo.setPositions(new Array(points * 3).fill(0));
  const top = new Line2(geo, fatMaterial(color, width, dashed ? { dashed: true, dashSize: dash, gapSize: gap } : {}));
  const under = outline ? new Line2(geo, fatMaterial(outline, outlineWidth ?? width * 1.9)) : null;
  top.frustumCulled = false;
  top.renderOrder = ORDER.line;
  const g = new THREE.Group();
  g.add(top);
  if (under) {
    under.frustumCulled = false;
    under.renderOrder = ORDER.under;
    g.add(under);
  }
  g.visible = false;
  parent.add(g);
  const arr = geo.attributes.instanceStart.data.array;
  const data = geo.attributes.instanceStart.data;
  const dataD = () => geo.attributes.instanceDistanceStart?.data;
  let last = [];
  return {
    root: g,
    top,
    under,
    /** points: a flat list x, y, z… of the same length as made. */
    set(flat) {
      const n = flat.length / 3 - 1;
      g.visible = true;
      if (dashed) {
        // a dashed line's distances are made anew by three.js: do it only when the line really changed
        let same = true;
        for (let i = 0; i < flat.length; i++) if (last[i] !== flat[i]) same = false;
        if (same) return;
        last = Array.from(flat);
      }
      for (let i = 0; i < n; i++) {
        const k = i * 6;
        arr[k] = flat[i * 3];
        arr[k + 1] = flat[i * 3 + 1];
        arr[k + 2] = flat[i * 3 + 2];
        arr[k + 3] = flat[i * 3 + 3];
        arr[k + 4] = flat[i * 3 + 4];
        arr[k + 5] = flat[i * 3 + 5];
      }
      data.needsUpdate = true;
      if (dashed) {
        top.computeLineDistances();
        const dd = dataD();
        if (dd) dd.needsUpdate = true;
      }
      g.visible = true;
    },
    width(w, u) {
      top.material.linewidth = w;
      if (under) under.material.linewidth = u ?? w * 1.9;
    },
    opacity(a) {
      top.material.opacity = a;
      if (under) under.material.opacity = a;
    },
    hide() {
      g.visible = false;
    },
  };
}

/** A flat ring with one colour, as a canvas texture on a sprite: a dot to grab, with a white rim. */
function knobTexture(fill, ring, mark) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.beginPath();
  g.arc(64, 64, 56, 0, Math.PI * 2);
  g.fillStyle = ring;
  g.fill();
  g.beginPath();
  g.arc(64, 64, 42, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
  if (mark === 'swing') {
    g.strokeStyle = ring;
    g.lineWidth = 9;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(40, 64);
    g.lineTo(88, 64);
    g.moveTo(52, 50);
    g.lineTo(38, 64);
    g.lineTo(52, 78);
    g.moveTo(76, 50);
    g.lineTo(90, 64);
    g.lineTo(76, 78);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,240,1)');
  r.addColorStop(0.3, 'rgba(255,214,120,0.9)');
  r.addColorStop(1, 'rgba(255,170,30,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function sprite(parent, map, size, order = ORDER.knob) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map, depthTest: false, depthWrite: false, transparent: true }));
  m.scale.setScalar(size);
  m.renderOrder = order;
  m.visible = false;
  parent.add(m);
  return m;
}

const UP = new THREE.Vector3(0, 1, 0);

export function createDiagram({ scene }) {
  const root = new THREE.Group();
  root.name = 'diagram';
  root.userData.noExport = true;
  scene.add(root);

  // ── the sheet: the plane of incidence, part above the water and fainter below ──────────────────────────────
  const sheet = new THREE.Group();
  const above = new THREE.Mesh(
    new THREE.PlaneGeometry(SHEET.half * 2, SHEET.up),
    new THREE.MeshBasicMaterial({ color: '#f4f8ff', transparent: true, opacity: 0.26, side: THREE.DoubleSide, depthTest: false, depthWrite: false }),
  );
  above.position.y = SHEET.up / 2;
  const below = new THREE.Mesh(
    new THREE.PlaneGeometry(SHEET.half * 2, SHEET.down),
    new THREE.MeshBasicMaterial({ color: '#cfe8f2', transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthTest: false, depthWrite: false }),
  );
  below.position.y = -SHEET.down / 2;
  above.renderOrder = below.renderOrder = ORDER.sheet;
  sheet.add(above, below);
  sheet.visible = false;
  root.add(sheet);
  const edge = polyline(root, { color: '#ffffff', width: 0.8, outline: '#33506b', outlineWidth: 1.6, points: 7 });
  const waterline = polyline(root, { color: '#ffffff', width: 0.8, outline: '#33506b', outlineWidth: 1.6 });
  const sheetOpacity = (k) => {
    above.material.opacity = 0.26 * k;
    below.material.opacity = 0.14 * k;
    edge.opacity(k);
    waterline.opacity(k);
    sheet.visible = k > 0;
    edge.root.visible = k > 0;
    waterline.root.visible = k > 0;
  };

  // ── rays, with small outlined arrow heads ──────────────────────────────────────────────────────────────────
  const rayLine = (o = {}) => polyline(root, { color: C.ray, width: 1.9, outline: C.rayDark, outlineWidth: 3.1, ...o });
  const headGeo = new THREE.ConeGeometry(1, 2.5, 16);
  const headTop = new THREE.MeshBasicMaterial({ color: C.ray, depthTest: false, depthWrite: false, transparent: true });
  const headUnder = new THREE.MeshBasicMaterial({ color: C.rayDark, depthTest: false, depthWrite: false, transparent: true });
  function head(size = 3.7) {
    const g = new THREE.Group();
    const a = new THREE.Mesh(headGeo, headUnder);
    a.scale.setScalar(1.3);
    a.renderOrder = ORDER.head;
    const b = new THREE.Mesh(headGeo, headTop);
    b.renderOrder = ORDER.head + 0.5;
    g.add(a, b);
    g.scale.setScalar(size);
    g.visible = false;
    root.add(g);
    return g;
  }
  const inc = rayLine();
  const ref = rayLine();
  const fra = rayLine();
  const abs = polyline(root, { color: '#ffe3b3', width: 1.3, outline: '#7a4300', outlineWidth: 2.4, dashed: true, dash: 4.2, gap: 3.2 });
  const heads = { inc: head(), ref: head(), fra: head() };
  const placeHead = (h, from, dir, t) => {
    h.position.set(from.x + dir.x * t, from.y + dir.y * t, from.z + dir.z * t);
    v.set(dir.x, dir.y, dir.z);
    h.quaternion.setFromUnitVectors(UP, v);
    h.visible = true;
  };

  // ── the normal, the right angle at its foot, the angles ───────────────────────────────────────────────────
  const nor = polyline(root, { color: C.normal, width: 1.5, outline: '#ffffff', outlineWidth: 3, dashed: true, dash: 6, gap: 3.5 });
  const NSEG = 28;
  const arcI = polyline(root, { color: C.ti, width: 1.5, outline: '#ffffff', outlineWidth: 2.9, points: NSEG + 1 });
  const arcR = polyline(root, { color: C.tr, width: 1.5, outline: '#ffffff', outlineWidth: 2.9, points: NSEG + 1 });
  const arcS = polyline(root, { color: C.ink, width: 1.5, outline: '#ffffff', outlineWidth: 2.9, points: NSEG + 1 });
  const fan = (color) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((NSEG + 2) * 3), 3));
    const idx = [];
    for (let i = 1; i <= NSEG; i++) idx.push(0, i, i + 1);
    g.setIndex(idx);
    const m = new THREE.Mesh(
      g,
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthTest: false, depthWrite: false }),
    );
    m.frustumCulled = false;
    m.renderOrder = ORDER.wedge;
    m.visible = false;
    root.add(m);
    return m;
  };
  const fanI = fan(C.ti);
  const fanR = fan(C.tr);
  const square = polyline(root, { color: C.ink, width: 0.8, outline: '#ffffff', outlineWidth: 1.7, points: 3 });

  // ── handles and marks ─────────────────────────────────────────────────────────────────────────────────────
  const knobX = sprite(root, knobTexture(C.ray, '#ffffff'), 13);
  const knobO = sprite(root, knobTexture(C.ink, '#ffffff'), 8);
  const knobS = sprite(root, knobTexture('#33506b', '#ffffff', 'swing'), 15);
  const glow = glowTexture();
  const pulses = [sprite(root, glow, 15), sprite(root, glow, 15), sprite(root, glow, 15)];
  for (const p of pulses) p.material.blending = THREE.AdditiveBlending;
  const flash = sprite(root, glow, 34, ORDER.wedge);
  flash.material.blending = THREE.AdditiveBlending;

  const dial = new THREE.Mesh(
    new THREE.RingGeometry(DIAL - 0.55, DIAL + 0.55, 96),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.62, depthTest: false, depthWrite: false, side: THREE.DoubleSide }),
  );
  dial.rotation.x = -Math.PI / 2;
  dial.renderOrder = ORDER.wedge;
  dial.visible = false;
  root.add(dial);

  // ── the parallel bundle of 8.2.2 ─────────────────────────────────────────────────────────────────────────
  const N = BUNDLE.n;
  const segs = (color, width, outline, outlineWidth, count) => {
    const geo = new LineSegmentsGeometry();
    geo.setPositions(new Float32Array(count * 6));
    const top = new LineSegments2(geo, fatMaterial(color, width));
    const under = new LineSegments2(geo, fatMaterial(outline, outlineWidth));
    top.frustumCulled = under.frustumCulled = false;
    top.renderOrder = ORDER.line;
    under.renderOrder = ORDER.under;
    const g = new THREE.Group();
    g.add(top, under);
    g.visible = false;
    root.add(g);
    return { root: g, data: geo.attributes.instanceStart.data };
  };
  const bundleRays = segs(C.ray, 1.5, C.rayDark, 2.7, N * 2);
  const bundleNormals = segs(C.normal, 0.75, '#ffffff', 1.5, N);
  const coneTop = new THREE.InstancedMesh(headGeo, headTop, N * 2);
  const coneUnder = new THREE.InstancedMesh(headGeo, headUnder, N * 2);
  coneTop.renderOrder = ORDER.head + 0.5;
  coneUnder.renderOrder = ORDER.head;
  coneTop.frustumCulled = coneUnder.frustumCulled = false;
  coneTop.visible = coneUnder.visible = false;
  root.add(coneUnder, coneTop);

  // ── rays of the test: candidates with letters ─────────────────────────────────────────────────────────────
  const cands = [0, 1, 2, 3].map(() => ({
    line: rayLine(),
    head: head(3.2),
    tip: new THREE.Vector3(),
    drop: polyline(root, { color: '#ffffff', width: 0.8, outline: '#33506b', outlineWidth: 1.5, dashed: true, dash: 3, gap: 2.4 }),
    foot: sprite(root, knobTexture('#33506b', '#ffffff'), 6),
  }));

  // ── reused working vectors: nothing is allocated in a frame ───────────────────────────────────────────────
  const v = new THREE.Vector3();
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const pos = new THREE.Vector3();
  const flat = new Float32Array((NSEG + 1) * 3);
  const two = new Float32Array(6);
  const pX = new THREE.Vector3();
  const pXr = new THREE.Vector3();
  const pS = new THREE.Vector3();
  const pO = new THREE.Vector3();
  const line2 = (l, ax, ay, az, bx, by, bz) => {
    two[0] = ax;
    two[1] = ay;
    two[2] = az;
    two[3] = bx;
    two[4] = by;
    two[5] = bz;
    l.set(two);
  };
  const fc = { nx: 0, ny: 1, nz: 0, rx: 0, ry: 1, rz: 0 };
  const dirs = { light: { x: 0, y: 1, z: 0 }, out: { x: 0, y: 1, z: 0 }, down: { x: 0, y: -1, z: 0 }, u: { x: 1, y: 0, z: 0 } };
  /** A point on a circle round O in the sheet, at angle a from the normal, on the side of the unit vector s. */
  function arcPoints(line, a0, a1, r, sx, sz, mesh) {
    for (let i = 0; i <= NSEG; i++) {
      const a = a0 + ((a1 - a0) * i) / NSEG;
      const y = Math.cos(a) * r;
      const h = Math.sin(a) * r;
      flat[i * 3] = sx * h;
      flat[i * 3 + 1] = y;
      flat[i * 3 + 2] = sz * h;
    }
    line.set(flat);
    if (mesh) {
      const p = mesh.geometry.attributes.position;
      p.array[0] = p.array[1] = p.array[2] = 0;
      p.array.set(flat, 3);
      p.needsUpdate = true;
      mesh.visible = true;
    }
  }

  const shown = { rays: 0 };
  return {
    root,
    L,
    pX,
    pXr,
    pS,
    pO,
    dirs,
    cands,
    pulses,
    flash,
    knobX,
    knobS,
    /** Everything off. */
    clear() {
      for (const l of [inc, ref, fra, abs, nor, arcI, arcR, arcS, square, edge, waterline]) l.hide();
      for (const h of Object.values(heads)) h.visible = false;
      for (const c of cands) {
        c.line.hide();
        c.head.visible = false;
        c.drop.hide();
        c.foot.visible = false;
      }
      fanI.visible = fanR.visible = false;
      sheet.visible = false;
      knobX.visible = knobO.visible = knobS.visible = dial.visible = false;
      for (const p of pulses) p.visible = false;
      flash.visible = false;
      bundleRays.root.visible = bundleNormals.root.visible = false;
      coneTop.visible = coneUnder.visible = false;
      inc.width(1.9, 3.1);
      ref.width(1.9, 3.1);
      fra.width(1.9, 3.1);
    },
    /** The state's geometry, straight from reading.js. */
    pose(theta, phi) {
      const a = (phi * Math.PI) / 180;
      const l = toLight(theta, phi);
      const r = reflected(theta, phi);
      const w = refracted(theta, phi);
      dirs.light = l;
      dirs.out = r;
      dirs.down = w;
      dirs.u = { x: Math.cos(a), y: 0, z: Math.sin(a) };
      pX.set(l.x, l.y, l.z).multiplyScalar(L);
      pXr.set(r.x, r.y, r.z).multiplyScalar(L);
      pS.set(dirs.u.x, 0, dirs.u.z).multiplyScalar(DIAL);
      knobX.position.copy(pX);
      knobS.position.copy(pS);
      knobO.position.copy(pO);
      sheet.rotation.y = -a;
      const { half, up, down } = SHEET;
      const ux = dirs.u.x;
      const uz = dirs.u.z;
      const c = [-half, -down, half, -down, half, up, -half, up, -half, -down];
      const f = new Float32Array(21);
      // the outline of the sheet, closed, with the last point repeated so the corner is drawn
      for (let i = 0; i < 5; i++) {
        f[i * 3] = c[i * 2] * ux;
        f[i * 3 + 1] = c[i * 2 + 1];
        f[i * 3 + 2] = c[i * 2] * uz;
      }
      f[15] = c[2] * ux;
      f[16] = c[3];
      f[17] = c[2] * uz;
      f[18] = c[2] * ux;
      f[19] = c[3];
      f[20] = c[2] * uz;
      edge.set(f);
      edge.hide();
      line2(waterline, -half * ux, 0, -half * uz, half * ux, 0, half * uz);
      waterline.hide();
    },
    /** The incident ray from far away down to where it has got (k = 1: at O). */
    drawIncident(k = 1) {
      const l = dirs.light;
      const t = REACH * (1 - k);
      line2(inc, l.x * REACH, l.y * REACH, l.z * REACH, l.x * t, l.y * t, l.z * t);
      if (k > 0.5) placeHead(heads.inc, { x: l.x * L * 0.66, y: l.y * L * 0.66, z: l.z * L * 0.66 }, { x: -l.x, y: -l.y, z: -l.z }, 0);
    },
    /** The reflected ray out to the fraction k of its way; width w. */
    drawReflected(k = 1, w = 1.9) {
      const r = dirs.out;
      const t = REACH * k;
      line2(ref, 0, 0, 0, r.x * t, r.y * t, r.z * t);
      ref.width(w, w + 1.4);
      if (k * REACH > L * 0.7) placeHead(heads.ref, { x: 0, y: 0, z: 0 }, r, L * 0.66);
      heads.ref.scale.setScalar(Math.max(2.6, 2.6 + w * 0.5));
    },
    /** The refracted ray into the water (it ends in the water: the sheet shows it to its foot). */
    drawRefracted(k = 1, w = 1.9) {
      const d = dirs.down;
      const t = (SHEET.down * 1.05 * k) / Math.max(0.35, -d.y);
      line2(fra, 0, 0, 0, d.x * t, d.y * t, d.z * t);
      fra.width(w, w + 1.4);
      if (k > 0.7) placeHead(heads.fra, { x: 0, y: 0, z: 0 }, d, t * 0.62);
      heads.fra.scale.setScalar(Math.max(2.6, 2.6 + w * 0.5));
    },
    /** শোষণ: a thin dashed line that dies out just under the surface (as চিত্র ৮.০২ draws it). */
    drawAbsorbed(k = 1) {
      const { x: ux, z: uz } = dirs.u;
      const n = 58 * k;
      line2(abs, 0, 0, 0, ux * n * 0.96, -n * 0.2, uz * n * 0.96);
      abs.opacity(Math.min(1, k * 1.2));
    },
    drawNormal(k = 1) {
      line2(nor, 0, -SHEET.down, 0, 0, -SHEET.down + (SHEET.down + SHEET.up + 8) * k, 0);
      nor.opacity(Math.min(1, k * 2));
    },
    drawAngles(theta, which = 'both') {
      const a = (theta * Math.PI) / 180;
      const { x: ux, z: uz } = dirs.u;
      if (which !== 'r') arcPoints(arcI, 0, a, ARC, -ux, -uz, fanI);
      if (which !== 'i') arcPoints(arcR, 0, a, ARC, ux, uz, fanR);
    },
    /** The angle between the ray and the surface (a usual mistake, in the test). */
    drawSurfaceAngle(theta) {
      const a = (theta * Math.PI) / 180;
      const { x: ux, z: uz } = dirs.u;
      arcPoints(arcS, a, Math.PI / 2, ARC * 1.5, -ux, -uz, null);
    },
    drawRightAngle() {
      const { x: ux, z: uz } = dirs.u;
      const s = 7;
      const f = new Float32Array(9);
      f[1] = s;
      f[3] = ux * s;
      f[4] = s;
      f[5] = uz * s;
      f[6] = ux * s;
      f[8] = uz * s;
      square.set(f);
    },
    sheet: sheetOpacity,
    showDial(on) {
      dial.visible = on;
      knobS.visible = on;
    },
    showX(on) {
      knobX.visible = on;
    },
    showO(on) {
      knobO.visible = on;
    },
    /** A candidate ray from O along dir, with its letter's tip. */
    candidate(i, dir) {
      const c = cands[i];
      line2(c.line, 0, 0, 0, dir.x * L, dir.y * L, dir.z * L);
      placeHead(c.head, { x: 0, y: 0, z: 0 }, dir, L * 0.72);
      c.tip.set(dir.x, dir.y, dir.z).multiplyScalar(L);
      // a dotted line straight down to the water: where its foot lands shows which rays stay in the sheet
      line2(c.drop, c.tip.x, c.tip.y, c.tip.z, c.tip.x, 0, c.tip.z);
      c.foot.position.set(c.tip.x, 0, c.tip.z);
      c.foot.visible = true;
    },
    /** An incoming candidate: the ray comes down to O from dir (the test on how much is reflected). */
    candidateIn(i, dir) {
      const c = cands[i];
      line2(c.line, dir.x * REACH, dir.y * REACH, dir.z * REACH, 0, 0, 0);
      placeHead(c.head, { x: dir.x * L * 0.62, y: dir.y * L * 0.62, z: dir.z * L * 0.62 }, { x: -dir.x, y: -dir.y, z: -dir.z }, 0);
      c.tip.set(dir.x, dir.y, dir.z).multiplyScalar(L);
    },
    /**
     * The book's চিত্র ৮.০৭: parallel rays falling along the sheet, each reflected at its own facet. Returns the
     * angle the reflected rays spread over, in degrees (from the first ray to the one furthest from it).
     */
    drawBundle(time, wind) {
      const l = dirs.light;
      const dx = -l.x;
      const dy = -l.y;
      const dz = -l.z;
      const { x: ux, z: uz } = dirs.u;
      const ra = bundleRays.data.array;
      const na = bundleNormals.data.array;
      let minC = 1;
      let fx = 0;
      let fy = 0;
      let fz = 0;
      for (let i = 0; i < N; i++) {
        const s = (i - (N - 1) / 2) * BUNDLE.gap;
        const x = ux * s;
        const z = uz * s;
        const h = heightAt(x, z, time, wind);
        facetInto(fc, dx, dy, dz, x, z, time, wind);
        const o = i * 12;
        // down to the water, then away
        ra[o] = x + l.x * BUNDLE.up;
        ra[o + 1] = h + l.y * BUNDLE.up;
        ra[o + 2] = z + l.z * BUNDLE.up;
        ra[o + 3] = ra[o + 6] = x;
        ra[o + 4] = ra[o + 7] = h;
        ra[o + 5] = ra[o + 8] = z;
        ra[o + 9] = x + fc.rx * BUNDLE.out;
        ra[o + 10] = h + fc.ry * BUNDLE.out;
        ra[o + 11] = z + fc.rz * BUNDLE.out;
        const n = i * 6;
        na[n] = x;
        na[n + 1] = h;
        na[n + 2] = z;
        const nl = 26;
        na[n + 3] = x + fc.nx * nl;
        na[n + 4] = h + fc.ny * nl;
        na[n + 5] = z + fc.nz * nl;
        // arrow heads, half way along
        for (let k = 0; k < 2; k++) {
          const ax = k === 0 ? dx : fc.rx;
          const ay = k === 0 ? dy : fc.ry;
          const az = k === 0 ? dz : fc.rz;
          const at = k === 0 ? -BUNDLE.in : BUNDLE.in;
          pos.set(x + ax * at, h + ay * at, z + az * at);
          v.set(ax, ay, az);
          q.setFromUnitVectors(UP, v);
          sc.setScalar(2.9);
          coneTop.setMatrixAt(i * 2 + k, m4.compose(pos, q, sc));
          sc.setScalar(3.8);
          coneUnder.setMatrixAt(i * 2 + k, m4.compose(pos, q, sc));
        }
        if (i === 0) {
          fx = fc.rx;
          fy = fc.ry;
          fz = fc.rz;
        } else minC = Math.min(minC, fx * fc.rx + fy * fc.ry + fz * fc.rz);
      }
      bundleRays.data.needsUpdate = true;
      bundleNormals.data.needsUpdate = true;
      coneTop.instanceMatrix.needsUpdate = true;
      coneUnder.instanceMatrix.needsUpdate = true;
      bundleRays.root.visible = true;
      bundleNormals.root.visible = wind > 0.02;
      coneTop.visible = coneUnder.visible = true;
      return (Math.acos(Math.min(1, minC)) * 180) / Math.PI;
    },
    shown,
  };
}
