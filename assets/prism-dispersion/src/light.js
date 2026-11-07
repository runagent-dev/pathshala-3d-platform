// The light and the marks of the diagram, all in the ray plane z = 0 (cm), drawn as 3D lines of a fixed width in pixels
// (three's LineSegments2), so they are depth-tested against the lamp and the stands, read at any zoom, and sit in the
// prism's glass. Nothing here is built per frame: every buffer is made once and written in place.
//   beam   the light: a soft glow, a dark edge and a bright core (per-segment colours)
//   normal the normals (লম্ব): slate dashes on a light edge, as the sister figures
//   orig   the original direction (আলোর মূল দিক): light grey dashes on a dark edge, as the book's thin grey line
//   arcs   the angles: i (blue) and r (green) at each face, the turn from the original direction (amber)
//   fan    white light opened into its colours: a glowing sheet inside the glass and on to the screen
//   patch  where the light lands on the screen (in the screen's own frame)
//   heads  the arrowheads: small swept-back chevrons in the plane, with a dark edge, kept about the same size on screen
import * as THREE from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { FAN_NM, glow, hue, SCREEN } from './reading.js';

export const C = {
  red: '#ff4b4b',
  redGlow: '#ff6b6b',
  white: '#ffffff',
  whiteGlow: '#fff4d6',
  edge: '#1d2733',
  normal: '#495057',
  normalEdge: '#f1f3f5',
  orig: '#dee2e6',
  origEdge: '#1d2733',
  incidence: '#1971c2',
  refraction: '#2b8a3e',
  turn: '#f59f00',
  arcEdge: '#ffffff',
};

/** A set of line segments of one look, written in place; `materials` share the one geometry (an edge under a core). */
function segLines(name, max, materials, order) {
  const geo = new LineSegmentsGeometry();
  geo.setPositions(new Float32Array(max * 6));
  geo.setColors(new Float32Array(max * 6));
  const pos = /** @type {any} */ (geo.attributes.instanceStart).data;
  const col = /** @type {any} */ (geo.attributes.instanceColorStart).data;
  const meshes = materials.map((m, k) => {
    const l = new LineSegments2(geo, m);
    l.name = `${name}${k}`;
    l.frustumCulled = false;
    l.renderOrder = order + k;
    l.userData.noExport = true;
    return l;
  });
  let n = 0;
  return {
    meshes,
    begin() {
      n = 0;
    },
    /** One segment from a to b ({x, y}, in the plane z = z), in a colour (THREE.Color). */
    add(ax, ay, bx, by, color, z = 0) {
      if (n >= max) return;
      const o = n * 6;
      pos.array[o] = ax;
      pos.array[o + 1] = ay;
      pos.array[o + 2] = z;
      pos.array[o + 3] = bx;
      pos.array[o + 4] = by;
      pos.array[o + 5] = z;
      col.array[o] = col.array[o + 3] = color.r;
      col.array[o + 1] = col.array[o + 4] = color.g;
      col.array[o + 2] = col.array[o + 5] = color.b;
      n++;
    },
    /** One segment between two points in space (x, y, z each). */
    add3(ax, ay, az, bx, by, bz, color) {
      if (n >= max) return;
      const o = n * 6;
      pos.array.set([ax, ay, az, bx, by, bz], o);
      col.array[o] = col.array[o + 3] = color.r;
      col.array[o + 1] = col.array[o + 4] = color.g;
      col.array[o + 2] = col.array[o + 5] = color.b;
      n++;
    },
    /** Dashes from a to b: `on` cm drawn, `off` cm gap, starting with a dash at a. */
    dashed(ax, ay, bx, by, color, on = 0.42, off = 0.3) {
      const L = Math.hypot(bx - ax, by - ay);
      if (L < 1e-4) return;
      const ux = (bx - ax) / L;
      const uy = (by - ay) / L;
      for (let s = 0; s < L; s += on + off) {
        const e = Math.min(L, s + on);
        this.add(ax + ux * s, ay + uy * s, ax + ux * e, ay + uy * e, color);
      }
    },
    /** An arc round (cx, cy) from angle a0 to a1 (radians, the short way), radius r. */
    arc(cx, cy, r, a0, a1, color, steps = 18) {
      let d = a1 - a0;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      let px = cx + Math.cos(a0) * r;
      let py = cy + Math.sin(a0) * r;
      for (let k = 1; k <= steps; k++) {
        const a = a0 + (d * k) / steps;
        const qx = cx + Math.cos(a) * r;
        const qy = cy + Math.sin(a) * r;
        this.add(px, py, qx, qy, color);
        px = qx;
        py = qy;
      }
    },
    end() {
      geo.instanceCount = n;
      pos.needsUpdate = true;
      col.needsUpdate = true;
      for (const m of meshes) m.visible = n > 0;
    },
    get count() {
      return n;
    },
    /** The segments drawn now: x0 y0 z0 x1 y1 z1 for each of the first `count` (read only). */
    get array() {
      return pos.array;
    },
  };
}

const lineMat = (opts) => {
  // all transparent, so they draw in their render order (an edge under its core), none writing depth
  const m = new LineMaterial({ worldUnits: false, transparent: true, depthWrite: false, ...opts });
  m.toneMapped = false;
  return m;
};

export function createLight() {
  const root = new THREE.Group();
  root.name = 'Light';
  root.userData.noExport = true;

  // ── the light's lines ──
  const beamGlow = lineMat({
    linewidth: 11,
    vertexColors: true,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const beamEdge = lineMat({ linewidth: 5.6, color: C.edge, opacity: 0.75 });
  const beamCore = lineMat({ linewidth: 3.4, vertexColors: true });
  const beam = segLines('Beam', 24, [beamGlow, beamEdge, beamCore], 20);
  const normalEdge = lineMat({ linewidth: 4.4, color: C.normalEdge, transparent: true, opacity: 0.9 });
  const normalCore = lineMat({ linewidth: 2, color: C.normal });
  const normal = segLines('Normal', 64, [normalEdge, normalCore], 14);
  const origEdge = lineMat({ linewidth: 4.4, color: C.origEdge, transparent: true, opacity: 0.8 });
  const origCore = lineMat({ linewidth: 2.2, vertexColors: true });
  const orig = segLines('Original', 80, [origEdge, origCore], 16);
  const arcEdge = lineMat({ linewidth: 5, color: C.arcEdge, transparent: true, opacity: 0.9 });
  const arcCore = lineMat({ linewidth: 2.6, vertexColors: true });
  const arcs = segLines('Arcs', 140, [arcEdge, arcCore], 18);
  // the trial paths of the test (dashed amber, on a dark edge)
  const trialEdge = lineMat({ linewidth: 5, color: C.edge, transparent: true, opacity: 0.85 });
  const trialCore = lineMat({ linewidth: 2.6, vertexColors: true });
  const trial = segLines('Trial', 120, [trialEdge, trialCore], 19);
  // the test's marks on the screen: short dark bars across the light's width, on the white card
  const marks = segLines('Marks', 8, [lineMat({ linewidth: 4.5, vertexColors: true })], 19);
  for (const s of [beam, normal, orig, arcs, trial, marks]) root.add(...s.meshes);

  // ── the fan: a sheet of the colours (inside the glass, and from the prism to the screen). Normal blending, each
  // colour at full strength fading out by its alpha at the two ends, so it stays coloured over the white screen too ──
  const K = FAN_NM.length;
  const fanColours = FAN_NM.map((nm) => {
    const h = hue(nm);
    return [h[0], h[1], h[2], glow(nm)];
  });
  function sheet(name, tris) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tris * 9), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(tris * 12), 4));
    const m = new THREE.Mesh(
      g,
      new THREE.MeshBasicMaterial({
        name,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    );
    m.name = name;
    m.frustumCulled = false;
    m.renderOrder = 12;
    m.userData.noExport = true;
    return m;
  }
  const fanIn = sheet('FanInGlass', K - 1);
  const fanOut = sheet('FanInAir', 2 * (K - 1));
  root.add(fanIn, fanOut);
  {
    // colours are fixed: write them once
    const ci = fanIn.geometry.attributes.color.array;
    const co = fanOut.geometry.attributes.color.array;
    for (let k = 0; k < K - 1; k++) {
      const a = fanColours[k];
      const b = fanColours[k + 1];
      const w = [1, 1, 1, 0.15]; // nearly clear at the entry point: the white there is the beam's
      ci.set([...w, ...a, ...b], k * 12);
      co.set([...a, ...a, ...b, ...b, ...b, ...a], k * 24);
    }
  }

  // ── the patch on the screen, in the screen's frame (its face is z = 0 there, y is height) ──
  const half = 0.8 / Math.cos(THREE.MathUtils.degToRad(SCREEN.yaw)); // the slit's light is 1.6 cm high (along z); on the turned card it is wider
  const ROWS = K + 2;
  function patchMesh(name) {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(ROWS * 2 * 3);
    for (let r = 0; r < ROWS; r++) {
      p[r * 6] = -half;
      p[r * 6 + 3] = half;
      p[r * 6 + 2] = p[r * 6 + 5] = 0.03;
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(ROWS * 2 * 4), 4));
    const idx = [];
    for (let r = 0; r < ROWS - 1; r++) {
      const a = r * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    g.setIndex(idx);
    const m = new THREE.Mesh(
      g,
      new THREE.MeshBasicMaterial({ name, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }),
    );
    m.name = name;
    m.frustumCulled = false;
    m.renderOrder = 6;
    m.userData.noExport = true;
    return m;
  }
  const patch = patchMesh('SpectrumOnScreen');
  const spot = patchMesh('RedOnScreen');

  // ── arrowheads ──
  const headShape = (s) =>
    new THREE.ShapeGeometry(
      new THREE.Shape([
        new THREE.Vector2(0.62 * s, 0),
        new THREE.Vector2(-0.42 * s, 0.46 * s),
        new THREE.Vector2(-0.14 * s, 0),
        new THREE.Vector2(-0.42 * s, -0.46 * s),
      ]),
    );
  const MAXH = 12;
  const heads = new THREE.InstancedMesh(
    headShape(1),
    new THREE.MeshBasicMaterial({ name: 'Arrowhead', toneMapped: false, side: THREE.DoubleSide }),
    MAXH,
  );
  const headEdges = new THREE.InstancedMesh(
    headShape(1.42).translate(-0.06, 0, 0),
    new THREE.MeshBasicMaterial({ name: 'ArrowheadEdge', color: C.edge, toneMapped: false, side: THREE.DoubleSide }),
    MAXH,
  );
  heads.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAXH * 3), 3);
  for (const h of [heads, headEdges]) {
    h.frustumCulled = false;
    h.userData.noExport = true;
    h.count = 0;
  }
  heads.renderOrder = 24;
  headEdges.renderOrder = 23;
  root.add(headEdges, heads);
  const M = new THREE.Matrix4();
  const Q = new THREE.Quaternion();
  const P = new THREE.Vector3();
  const S = new THREE.Vector3();
  const Z = new THREE.Vector3(0, 0, 1);
  let nh = 0;

  return {
    root,
    beam,
    normal,
    orig,
    arcs,
    trial,
    marks,
    fanIn,
    fanOut,
    patch,
    spot,
    patchHalf: half,
    fanColours,
    /** Writes the fan: entries (one point), exits[k] and ends[k] ({x, y}); grow 0…1 inside, then 0…1 outside. */
    setFan(entry, exits, ends, kIn, kOut, opacity) {
      fanIn.visible = kIn > 0 && opacity > 0;
      fanOut.visible = kOut > 0 && opacity > 0;
      fanIn.material.opacity = 0.6 * opacity;
      fanOut.material.opacity = 0.72 * opacity;
      if (!fanIn.visible && !fanOut.visible) return;
      const pi = fanIn.geometry.attributes.position.array;
      const po = fanOut.geometry.attributes.position.array;
      const put = (arr, o, x, y) => {
        arr[o] = x;
        arr[o + 1] = y;
        arr[o + 2] = 0;
      };
      for (let k = 0; k < K - 1; k++) {
        const e0 = exits[k];
        const e1 = exits[k + 1];
        const o = k * 9;
        put(pi, o, entry.x, entry.y);
        put(pi, o + 3, entry.x + (e0.x - entry.x) * kIn, entry.y + (e0.y - entry.y) * kIn);
        put(pi, o + 6, entry.x + (e1.x - entry.x) * kIn, entry.y + (e1.y - entry.y) * kIn);
        const a2x = e0.x + (ends[k].x - e0.x) * kOut;
        const a2y = e0.y + (ends[k].y - e0.y) * kOut;
        const b2x = e1.x + (ends[k + 1].x - e1.x) * kOut;
        const b2y = e1.y + (ends[k + 1].y - e1.y) * kOut;
        const q = k * 18;
        put(po, q, e0.x, e0.y);
        put(po, q + 3, a2x, a2y);
        put(po, q + 6, b2x, b2y);
        put(po, q + 9, b2x, b2y);
        put(po, q + 12, e1.x, e1.y);
        put(po, q + 15, e0.x, e0.y);
      }
      fanIn.geometry.attributes.position.needsUpdate = true;
      fanOut.geometry.attributes.position.needsUpdate = true;
    },
    /**
     * Writes a patch on the screen: rows of { y, r, g, b, a } from bottom to top (exactly ROWS - 2 of them, or fewer:
     * the rest collapse onto the last), with a soft edge `soft` cm beyond each end.
     */
    setPatch(mesh, rows, soft, alpha) {
      mesh.visible = alpha > 0.002;
      if (!mesh.visible) return;
      const p = mesh.geometry.attributes.position.array;
      const c = mesh.geometry.attributes.color.array;
      const n = rows.length;
      const put = (r, y, row, a) => {
        p[r * 6 + 1] = p[r * 6 + 4] = y;
        for (let h = 0; h < 2; h++) {
          const o = r * 8 + h * 4;
          c[o] = row.r;
          c[o + 1] = row.g;
          c[o + 2] = row.b;
          c[o + 3] = a;
        }
      };
      const first = rows[0];
      const last = rows[n - 1];
      put(0, first.y - soft, first, 0);
      for (let r = 1; r < ROWS - 1; r++) {
        const row = rows[Math.min(n - 1, r - 1)];
        put(r, row.y, row, row.a * alpha);
      }
      put(ROWS - 1, last.y + soft, last, 0);
      mesh.geometry.attributes.position.needsUpdate = true;
      mesh.geometry.attributes.color.needsUpdate = true;
    },
    headsBegin() {
      nh = 0;
    },
    /** An arrowhead at (x, y) pointing along (dx, dy), `size` cm long, in a colour. */
    head(x, y, dx, dy, size, color) {
      if (nh >= MAXH) return;
      Q.setFromAxisAngle(Z, Math.atan2(dy, dx));
      S.setScalar(size);
      P.set(x, y, 0.012);
      M.compose(P, Q, S);
      heads.setMatrixAt(nh, M);
      heads.setColorAt(nh, color);
      P.z = 0.006;
      M.compose(P, Q, S);
      headEdges.setMatrixAt(nh, M);
      nh++;
    },
    headsEnd() {
      heads.count = headEdges.count = nh;
      heads.instanceMatrix.needsUpdate = true;
      headEdges.instanceMatrix.needsUpdate = true;
      if (heads.instanceColor) heads.instanceColor.needsUpdate = true;
      heads.visible = headEdges.visible = nh > 0;
    },
  };
}
