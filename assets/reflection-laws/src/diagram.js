// The drawing over the lake: the book's চিত্র ৮.০৩ as a fine line drawing in the scene. Thin rays from X to O to X′ with
// small arrowheads along them, a dashed normal, thin arcs with arrow ends for θi and θr, and a soft upright sheet for the
// plane. Every line is placed from the vectors of reading.js, so what is drawn is the law itself. It is a diagram
// (noExport): it always shows, even through the water, as the book's sheet does.
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { facetInto, heightAt, reflected, toLight } from './reading.js';

export const L = 100; // the length of XO and OX′
export const SHEET = { half: 120, up: 122, down: 40 };
export const SWING = 106; // how far along the sheet's foot its handle is
export const ARC = 52; // the radius of the angles: well clear of O
export const BUNDLE = { n: 5, gap: 20, in: 112, out: 112 };

export const C = { ray: '#f59f00', rayDark: '#5f3400', normal: '#495057', ti: '#1971c2', tr: '#2b8a3e', ink: '#212529', sheet: '#33506b' };

const ORDER = { sheet: 2, under: 5, line: 6, head: 7, knob: 9 };

function fatMaterial(color, width, opts = {}) {
  return new LineMaterial({ color, linewidth: width, worldUnits: true, transparent: true, depthTest: false, depthWrite: false, ...opts });
}

/** A straight or bent line, with an outline under it if asked. set(flat) writes in place. */
function polyline(parent, { color, width, outline, outlineWidth, points = 2, dashed = false, dash = 6, gap = 4, opacity = 1 }) {
  const geo = new LineGeometry();
  geo.setPositions(new Array(points * 3).fill(0));
  const dashes = dashed ? { dashed: true, dashSize: dash, gapSize: gap } : {};
  const top = new Line2(geo, fatMaterial(color, width, { ...dashes, opacity }));
  const under = outline ? new Line2(geo, fatMaterial(outline, outlineWidth, { ...dashes, opacity })) : null;
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
  const data = geo.attributes.instanceStart.data;
  const arr = data.array;
  let last = [];
  return {
    root: g,
    set(flat) {
      g.visible = true;
      if (dashed) {
        // a dashed line's distances are made anew by three.js: only when the line really changed
        let same = last.length === flat.length;
        for (let i = 0; same && i < flat.length; i++) if (last[i] !== flat[i]) same = false;
        if (same) return;
        last = Array.from(flat);
      }
      const n = flat.length / 3 - 1;
      for (let i = 0; i < n; i++) {
        const k = i * 6;
        for (let j = 0; j < 6; j++) arr[k + j] = flat[i * 3 + j];
      }
      data.needsUpdate = true;
      if (dashed) {
        top.computeLineDistances();
        geo.attributes.instanceDistanceStart.data.needsUpdate = true;
      }
    },
    opacity(a) {
      top.material.opacity = a * opacity;
      if (under) under.material.opacity = a * opacity;
    },
    hide() {
      g.visible = false;
    },
  };
}

/** A dot on a sprite: a ring to grab, or a plain point; `swing` draws a little double arrow. */
function dotTexture(fill, ring, mark) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.beginPath();
  g.arc(64, 64, 58, 0, Math.PI * 2);
  g.fillStyle = ring;
  g.fill();
  g.beginPath();
  g.arc(64, 64, 45, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
  if (mark === 'swing') {
    g.strokeStyle = ring;
    g.lineWidth = 8;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(38, 64);
    g.lineTo(90, 64);
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
function sprite(parent, map, size) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map, depthTest: false, depthWrite: false, transparent: true }));
  m.scale.setScalar(size);
  m.renderOrder = ORDER.knob;
  m.visible = false;
  parent.add(m);
  return m;
}
/** The sheet's pale fill: strongest at the water, gone by its foot under the water, so it needs no lines there. */
function sheetTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 128;
  const g = c.getContext('2d');
  const r = g.createLinearGradient(0, 0, 0, 128);
  const atWater = SHEET.up / (SHEET.up + SHEET.down);
  r.addColorStop(0, 'rgba(255,255,255,0.13)');
  r.addColorStop(atWater, 'rgba(255,255,255,0.3)');
  r.addColorStop(atWater + 0.01, 'rgba(225,244,255,0.2)');
  r.addColorStop(1, 'rgba(225,244,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 4, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const UP = new THREE.Vector3(0, 1, 0);

export function createDiagram({ scene }) {
  const root = new THREE.Group();
  root.name = 'diagram';
  root.userData.noExport = true;
  scene.add(root);

  // ── the plane: one soft sheet, one thin line round its top ──────────────────────────────────────────────────
  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(SHEET.half * 2, SHEET.up + SHEET.down),
    new THREE.MeshBasicMaterial({ map: sheetTexture(), transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false }),
  );
  fill.position.y = (SHEET.up - SHEET.down) / 2;
  fill.renderOrder = ORDER.sheet;
  const sheetGroup = new THREE.Group();
  sheetGroup.add(fill);
  sheetGroup.visible = false;
  root.add(sheetGroup);
  const edge = polyline(root, { color: '#ffffff', width: 0.5, points: 4, opacity: 0.85 });
  const waterline = polyline(root, { color: '#ffffff', width: 0.5, opacity: 0.85 });
  const sheetK = (k) => {
    fill.material.opacity = k;
    edge.opacity(k);
    waterline.opacity(k);
    sheetGroup.visible = edge.root.visible = waterline.root.visible = k > 0;
  };

  // ── rays, with small arrowheads along them ─────────────────────────────────────────────────────────────────
  const rayLine = () => polyline(root, { color: C.ray, width: 0.95, outline: C.rayDark, outlineWidth: 1.55 });
  const headGeo = new THREE.ConeGeometry(1, 2.8, 14);
  const mat = (color) => new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false, transparent: true });
  const headRay = mat(C.ray);
  const headDark = mat(C.rayDark);
  function head(size, top = headRay, under = headDark) {
    const g = new THREE.Group();
    const a = new THREE.Mesh(headGeo, under);
    a.scale.setScalar(1.32);
    a.renderOrder = ORDER.head;
    const b = new THREE.Mesh(headGeo, top);
    b.renderOrder = ORDER.head + 0.5;
    g.add(a, b);
    g.scale.setScalar(size);
    g.visible = false;
    root.add(g);
    return g;
  }
  const inc = rayLine();
  const ref = rayLine();
  const HEAD = 2.1;
  const heads = { inc: [head(HEAD), head(HEAD)], ref: [head(HEAD), head(HEAD)] };
  const v = new THREE.Vector3();
  const place = (h, x, y, z, dx, dy, dz) => {
    h.position.set(x, y, z);
    v.set(dx, dy, dz);
    h.quaternion.setFromUnitVectors(UP, v);
    h.visible = true;
  };

  // ── the normal and the angles ─────────────────────────────────────────────────────────────────────────────
  const nor = polyline(root, { color: '#343a40', width: 1.1, outline: '#ffffff', outlineWidth: 1.9, dashed: true, dash: 6, gap: 3.6 });
  const NSEG = 32;
  const arcLine = (color) => polyline(root, { color, width: 0.8, outline: '#ffffff', outlineWidth: 1.5, points: NSEG + 1 });
  const arcI = arcLine(C.ti);
  const arcR = arcLine(C.tr);
  const white = mat('#ffffff');
  const ends = {
    i: [head(1.6, mat(C.ti), white), head(1.6, mat(C.ti), white)],
    r: [head(1.6, mat(C.tr), white), head(1.6, mat(C.tr), white)],
  };
  const quizArcs = [arcLine(C.ink), arcLine(C.ink), arcLine(C.ink)];
  const leaders = [polyline(root, { color: C.ti, width: 0.42 }), polyline(root, { color: C.tr, width: 0.42 })];
  const square = polyline(root, { color: C.ink, width: 0.5, outline: '#ffffff', outlineWidth: 1, points: 3 });

  // ── handles and marks ─────────────────────────────────────────────────────────────────────────────────────
  const knobX = sprite(root, dotTexture(C.ray, '#ffffff'), 7.5);
  const knobO = sprite(root, dotTexture(C.ink, '#ffffff'), 4.6);
  const knobXr = sprite(root, dotTexture(C.ray, '#ffffff'), 4.6);
  const knobS = sprite(root, dotTexture(C.sheet, '#ffffff', 'swing'), 11);

  // ── the parallel rays of 8.2.2 ───────────────────────────────────────────────────────────────────────────
  const N = BUNDLE.n;
  const HEADS = 2;
  const segs = (color, width, outline, outlineWidth, count, dashes = null) => {
    const geo = new LineSegmentsGeometry();
    const start = new Float32Array(count * 6);
    // every dashed segment has one fixed length, so its dashes need working out only once, here
    if (dashes) for (let i = 0; i < count; i++) start[i * 6 + 4] = dashes.length;
    geo.setPositions(start);
    const style = dashes ? { dashed: true, dashSize: dashes.dash, gapSize: dashes.gap } : {};
    const top = new LineSegments2(geo, fatMaterial(color, width, style));
    const under = new LineSegments2(geo, fatMaterial(outline, outlineWidth, style));
    if (dashes) top.computeLineDistances();
    top.frustumCulled = under.frustumCulled = false;
    top.renderOrder = ORDER.line;
    under.renderOrder = ORDER.under;
    const g = new THREE.Group();
    g.add(top, under);
    g.visible = false;
    root.add(g);
    return { root: g, data: geo.attributes.instanceStart.data };
  };
  const bundleRays = segs(C.ray, 0.95, C.rayDark, 1.55, N * 2);
  const bundleNormals = segs('#343a40', 0.8, '#ffffff', 1.5, N, { length: 44, dash: 4.4, gap: 2.8 });
  const coneTop = new THREE.InstancedMesh(headGeo, headRay, N * 2 * HEADS);
  const coneUnder = new THREE.InstancedMesh(headGeo, headDark, N * 2 * HEADS);
  coneTop.renderOrder = ORDER.head + 0.5;
  coneUnder.renderOrder = ORDER.head;
  coneTop.frustumCulled = coneUnder.frustumCulled = false;
  coneTop.visible = coneUnder.visible = false;
  root.add(coneUnder, coneTop);

  // ── the candidate rays of the test ────────────────────────────────────────────────────────────────────────
  const cands = [0, 1, 2, 3].map(() => ({
    line: rayLine(),
    head: head(HEAD),
    tip: new THREE.Vector3(),
    drop: polyline(root, { color: '#ffffff', width: 0.6, outline: C.sheet, outlineWidth: 1.2, dashed: true, dash: 3, gap: 2.4 }),
    foot: sprite(root, dotTexture(C.sheet, '#ffffff'), 4.6),
  }));

  // ── working space: nothing is allocated in a frame ────────────────────────────────────────────────────────
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const pos = new THREE.Vector3();
  const flat = new Float32Array((NSEG + 1) * 3);
  const two = new Float32Array(6);
  const corners = new Float32Array(12);
  const out = new Float32Array(N * 3);
  const pX = new THREE.Vector3();
  const pXr = new THREE.Vector3();
  const pS = new THREE.Vector3();
  const fc = { nx: 0, ny: 1, nz: 0, rx: 0, ry: 1, rz: 0 };
  const dirs = { light: { x: 0, y: 1, z: 0 }, out: { x: 0, y: 1, z: 0 }, u: { x: 1, y: 0, z: 0 } };
  const line2 = (l, ax, ay, az, bx, by, bz) => {
    two[0] = ax;
    two[1] = ay;
    two[2] = az;
    two[3] = bx;
    two[4] = by;
    two[5] = bz;
    l.set(two);
  };
  /** An arc in the sheet: from a0 to a1 (radians from the normal), on the side (sx, sz). */
  function arcPoints(line, a0, a1, r, sx, sz) {
    for (let i = 0; i <= NSEG; i++) {
      const a = a0 + ((a1 - a0) * i) / NSEG;
      flat[i * 3] = sx * Math.sin(a) * r;
      flat[i * 3 + 1] = Math.cos(a) * r;
      flat[i * 3 + 2] = sz * Math.sin(a) * r;
    }
    line.set(flat);
  }
  /** The small arrow at an arc's end; `way` is +1 pointing toward larger angles. */
  function arcEnd(h, a, r, sx, sz, way) {
    const back = 2.6 / r; // the head sits just inside the end, along the curve
    const b = a - way * back;
    place(h, sx * Math.sin(b) * r, Math.cos(b) * r, sz * Math.sin(b) * r, way * sx * Math.cos(b), -way * Math.sin(b), way * sz * Math.cos(b));
  }

  return {
    root,
    pX,
    pXr,
    pS,
    dirs,
    cands,
    knobX,
    knobS,
    /** Everything off. */
    clear() {
      for (const l of [inc, ref, nor, arcI, arcR, square, edge, waterline, ...quizArcs, ...leaders]) l.hide();
      for (const h of [...heads.inc, ...heads.ref, ...ends.i, ...ends.r]) h.visible = false;
      for (const c of cands) {
        c.line.hide();
        c.head.visible = false;
        c.drop.hide();
        c.foot.visible = false;
      }
      sheetGroup.visible = false;
      knobX.visible = knobXr.visible = knobO.visible = knobS.visible = false;
      bundleRays.root.visible = bundleNormals.root.visible = false;
      coneTop.visible = coneUnder.visible = false;
    },
    /** The state's geometry, straight from reading.js. */
    pose(theta, phi) {
      const a = (phi * Math.PI) / 180;
      const l = toLight(theta, phi);
      const r = reflected(theta, phi);
      dirs.light = l;
      dirs.out = r;
      dirs.u = { x: Math.cos(a), y: 0, z: Math.sin(a) };
      const { x: ux, z: uz } = dirs.u;
      pX.set(l.x, l.y, l.z).multiplyScalar(L);
      pXr.set(r.x, r.y, r.z).multiplyScalar(L);
      pS.set(ux, 0, uz).multiplyScalar(SWING);
      knobX.position.copy(pX);
      knobXr.position.copy(pXr);
      knobS.position.copy(pS);
      sheetGroup.rotation.y = -a;
      const { half, up } = SHEET;
      const c = [-half, 0, -half, up, half, up, half, 0];
      for (let i = 0; i < 4; i++) {
        corners[i * 3] = c[i * 2] * ux;
        corners[i * 3 + 1] = c[i * 2 + 1];
        corners[i * 3 + 2] = c[i * 2] * uz;
      }
      edge.set(corners);
      edge.hide();
      line2(waterline, -half * ux, 0, -half * uz, half * ux, 0, half * uz);
      waterline.hide();
    },
    /** XO, from X down to O. */
    drawIncident() {
      const l = dirs.light;
      line2(inc, l.x * L, l.y * L, l.z * L, 0, 0, 0);
      for (const [i, k] of [0.76, 0.34].entries()) place(heads.inc[i], l.x * L * k, l.y * L * k, l.z * L * k, -l.x, -l.y, -l.z);
      knobX.visible = true;
    },
    /** OX′, out to the fraction k of its length. */
    drawReflected(k = 1) {
      const r = dirs.out;
      const t = L * k;
      line2(ref, 0, 0, 0, r.x * t, r.y * t, r.z * t);
      [0.34, 0.76].forEach((f, i) => {
        if (k > f + 0.04) place(heads.ref[i], r.x * L * f, r.y * L * f, r.z * L * f, r.x, r.y, r.z);
      });
      knobXr.visible = k >= 1;
    },
    /** The dashed normal, growing up from under the water. */
    drawNormal(k = 1) {
      const low = -SHEET.down * 0.8;
      line2(nor, 0, low, 0, 0, low + (SHEET.up + 6 - low) * k, 0);
    },
    drawAngles(theta) {
      const a = (theta * Math.PI) / 180;
      const { x: ux, z: uz } = dirs.u;
      arcPoints(arcI, 0, a, ARC, -ux, -uz);
      arcPoints(arcR, 0, a, ARC, ux, uz);
      arcEnd(ends.i[0], a, ARC, -ux, -uz, 1);
      arcEnd(ends.i[1], 0, ARC, -ux, -uz, -1);
      arcEnd(ends.r[0], a, ARC, ux, uz, 1);
      arcEnd(ends.r[1], 0, ARC, ux, uz, -1);
    },
    /** The thin line from an arc to its label. */
    drawLeader(i, a, b) {
      line2(leaders[i], a.x, a.y, a.z, b.x, b.y, b.z);
    },
    /** An ink arc of the test, side −1 is X's. */
    drawQuizArc(i, a0, a1, r, side) {
      const { x: ux, z: uz } = dirs.u;
      arcPoints(quizArcs[i], (a0 * Math.PI) / 180, (a1 * Math.PI) / 180, r, side * ux, side * uz);
    },
    drawRightAngle() {
      const { x: ux, z: uz } = dirs.u;
      const s = 6;
      corners[0] = 0;
      corners[1] = s;
      corners[2] = 0;
      corners[3] = ux * s;
      corners[4] = s;
      corners[5] = uz * s;
      corners[6] = ux * s;
      corners[7] = 0;
      corners[8] = uz * s;
      square.set(corners.subarray(0, 9));
    },
    sheet: sheetK,
    showSwing(on) {
      knobS.visible = on;
    },
    showO(on) {
      knobO.visible = on;
    },
    /** A candidate reflected ray from O along dir, with a dotted drop to the water that shows where it leans. */
    candidate(i, dir) {
      const c = cands[i];
      line2(c.line, 0, 0, 0, dir.x * L, dir.y * L, dir.z * L);
      place(c.head, dir.x * L * 0.66, dir.y * L * 0.66, dir.z * L * 0.66, dir.x, dir.y, dir.z);
      c.tip.set(dir.x, dir.y, dir.z).multiplyScalar(L);
      line2(c.drop, c.tip.x, c.tip.y, c.tip.z, c.tip.x, 0, c.tip.z);
      c.foot.position.set(c.tip.x, 0, c.tip.z);
      c.foot.visible = true;
    },
    /**
     * The book's চিত্র ৮.০৭: parallel rays falling along the sheet, each reflected at its own facet, each facet with its
     * own normal. Returns the angle the reflected rays spread over, in degrees.
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
      for (let i = 0; i < N; i++) {
        const s = (i - (N - 1) / 2) * BUNDLE.gap;
        const x = ux * s;
        const z = uz * s;
        const h = heightAt(x, z, time, wind);
        facetInto(fc, dx, dy, dz, x, z, time, wind);
        const o = i * 12;
        ra[o] = x + l.x * BUNDLE.in;
        ra[o + 1] = h + l.y * BUNDLE.in;
        ra[o + 2] = z + l.z * BUNDLE.in;
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
        na[n + 3] = x + fc.nx * 44;
        na[n + 4] = h + fc.ny * 44;
        na[n + 5] = z + fc.nz * 44;
        for (let k = 0; k < 2; k++) {
          const ax = k === 0 ? dx : fc.rx;
          const ay = k === 0 ? dy : fc.ry;
          const az = k === 0 ? dz : fc.rz;
          for (let j = 0; j < HEADS; j++) {
            const at = (k === 0 ? -1 : 1) * (j === 0 ? 38 : 82);
            pos.set(x + ax * at, h + ay * at, z + az * at);
            v.set(ax, ay, az);
            q.setFromUnitVectors(UP, v);
            sc.setScalar(HEAD);
            coneTop.setMatrixAt(i * 4 + k * 2 + j, m4.compose(pos, q, sc));
            sc.setScalar(HEAD * 1.32);
            coneUnder.setMatrixAt(i * 4 + k * 2 + j, m4.compose(pos, q, sc));
          }
        }
        // the widest angle between any two of the reflected rays
        out[i * 3] = fc.rx;
        out[i * 3 + 1] = fc.ry;
        out[i * 3 + 2] = fc.rz;
        for (let j = 0; j < i; j++) minC = Math.min(minC, out[j * 3] * fc.rx + out[j * 3 + 1] * fc.ry + out[j * 3 + 2] * fc.rz);
      }
      bundleRays.data.needsUpdate = true;
      bundleNormals.data.needsUpdate = true;
      coneTop.instanceMatrix.needsUpdate = true;
      coneUnder.instanceMatrix.needsUpdate = true;
      bundleRays.root.visible = true;
      bundleNormals.root.visible = true;
      coneTop.visible = coneUnder.visible = true;
      return (Math.acos(Math.min(1, minC)) * 180) / Math.PI;
    },
  };
}
