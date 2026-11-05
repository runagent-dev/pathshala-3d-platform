// The three vehicles, each two meshes: one body with its colours at the vertices (paint, stripes, tyres, lamps, so a
// vehicle is one draw call whatever its detail) and one for the glass. The car's nose, the bus's nose and the CNG's nose
// are at the group's origin and +x is forward, so the eyes of reading.js are measured from there.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BUS, CAR } from './reading.js';

function paint(geo, color) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.deleteAttribute('uv');
  const c = new THREE.Color(color);
  const n = g.attributes.position.count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    a[i * 3] = c.r;
    a[i * 3 + 1] = c.g;
    a[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}
const box = (x0, x1, y0, y1, z0, z1) => {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return g;
};
/** A side outline (x, y) with rounded corners, extruded across the width, centred on z = 0. */
function shell(points, width, radius = 0.1, bevel = 0.05) {
  const s = new THREE.Shape();
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const [px, py] = points[i];
    const [ax, ay] = points[(i + n - 1) % n];
    const [bx, by] = points[(i + 1) % n];
    const r = points[i][2] ?? radius;
    const la = Math.hypot(ax - px, ay - py);
    const lb = Math.hypot(bx - px, by - py);
    const k = Math.min(r, la / 2, lb / 2);
    const inX = px + ((ax - px) / la) * k;
    const inY = py + ((ay - py) / la) * k;
    const outX = px + ((bx - px) / lb) * k;
    const outY = py + ((by - py) / lb) * k;
    if (i === 0) s.moveTo(inX, inY);
    else s.lineTo(inX, inY);
    s.quadraticCurveTo(px, py, outX, outY);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: width - 2 * bevel,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 4,
  });
  g.translate(0, 0, -(width - 2 * bevel) / 2);
  return g;
}
/** A wheel at x, on both sides; a tyre, a rim and a hub. */
function wheels(parts, x, radius, width, track, rim = '#c9ced3', sides = [-1, 1]) {
  for (const side of sides) {
    const t = new THREE.CylinderGeometry(radius, radius, width, 18, 1);
    t.rotateX(Math.PI / 2);
    t.translate(x, radius, side * track);
    parts.push(paint(t, '#1b1c1f'));
    const h = new THREE.CylinderGeometry(radius * 0.58, radius * 0.62, width + 0.03, 12, 1);
    h.rotateX(Math.PI / 2);
    h.translate(x, radius, side * track);
    parts.push(paint(h, rim));
  }
}
function finish(name, parts, glass, material, glassMaterial) {
  const group = new THREE.Group();
  group.name = name;
  const body = new THREE.Mesh(mergeGeometries(parts, false), material);
  body.name = `${name}-body`;
  group.add(body);
  if (glass.length) {
    const gl = new THREE.Mesh(mergeGeometries(glass, false), glassMaterial);
    gl.name = `${name}-glass`;
    group.add(gl);
  }
  return group;
}

function makeBus(material, glassMaterial) {
  const L = BUS.length;
  const W = BUS.width;
  const parts = [];
  const glass = [];
  // the body: a tall box, the front raked a little, every corner rounded
  parts.push(
    paint(
      shell(
        [
          [-L, 0.42, 0.14],
          [0, 0.42, 0.16],
          [-0.02, 1.15, 0.1],
          [-0.42, 3.0, 0.3],
          [-L + 0.14, 3.0, 0.26],
        ],
        W,
      ),
      '#c8201f',
    ),
  );
  const side = W / 2 + 0.006;
  for (const z of [-1, 1]) {
    const zz = (a, b) => (z > 0 ? [a, b] : [-b, -a]);
    // the cream stripes
    parts.push(paint(box(-L + 0.08, -0.08, 1.2, 1.46, ...zz(side - 0.02, side)), '#f3e3b6'));
    parts.push(paint(box(-L + 0.08, -0.08, 1.05, 1.11, ...zz(side - 0.02, side)), '#f2b01e'));
    // the windows: one band of glass, the pillars painted over it
    glass.push(box(-L + 0.5, -1.0, 1.68, 2.62, ...zz(side - 0.02, side + 0.002)).toNonIndexed());
    for (let i = 0; i <= 7; i++) {
      const x = -L + 0.5 + i * ((L - 1.5) / 7);
      parts.push(paint(box(x - 0.055, x + 0.055, 1.66, 2.64, ...zz(side - 0.02, side + 0.006)), '#c8201f'));
    }
    // the mud flap line and the skirt
    parts.push(paint(box(-L + 0.1, -0.1, 0.42, 0.56, ...zz(side - 0.02, side + 0.004)), '#3a3c40'));
  }
  // the door, on the left (the kerb side, as traffic keeps left)
  parts.push(paint(box(-2.5, -1.6, 0.62, 2.7, -side - 0.002, -side + 0.02), '#7d1414'));
  glass.push(box(-2.42, -1.68, 1.1, 2.58, -side - 0.006, -side).toNonIndexed());
  // the windscreen, leaning back with the front
  const screen = new THREE.BoxGeometry(0.03, 1.28, W - 0.24);
  screen.rotateZ(Math.atan2(0.4, 1.85));
  screen.translate(-0.15, 2.06, 0);
  glass.push(screen.toNonIndexed());
  const pillar = new THREE.BoxGeometry(0.05, 1.34, 0.09);
  pillar.rotateZ(Math.atan2(0.4, 1.85));
  pillar.translate(-0.135, 2.05, 0);
  parts.push(paint(pillar, '#26282c'));
  // the rear window
  glass.push(box(-L - 0.008, -L + 0.02, 1.8, 2.6, -W / 2 + 0.3, W / 2 - 0.3).toNonIndexed());
  // the sign over the windscreen, the bumper, the lamps
  parts.push(paint(box(-0.46, -0.14, 2.74, 2.93, -0.8, 0.8), '#fbf3d5'));
  parts.push(paint(box(-0.02, 0.1, 0.44, 0.72, -W / 2 + 0.03, W / 2 - 0.03), '#2a2c30'));
  for (const z of [-0.92, 0.92]) {
    const lamp = new THREE.BoxGeometry(0.05, 0.2, 0.42);
    lamp.translate(0.02, 0.98, z);
    parts.push(paint(lamp, '#fff6cf'));
    parts.push(paint(box(-L - 0.03, -L + 0.02, 0.86, 1.1, z - 0.2, z + 0.2), '#ff2a14'));
    // the driver's wing mirrors, on their arms
    parts.push(paint(box(-0.5, -0.42, 2.0, 2.42, Math.sign(z) * (W / 2 + 0.2) - 0.1, Math.sign(z) * (W / 2 + 0.2) + 0.1), '#1d1f22'));
    parts.push(
      paint(
        box(
          -0.5,
          -0.44,
          2.36,
          2.4,
          Math.min(Math.sign(z) * W * 0.5, Math.sign(z) * (W / 2 + 0.2)),
          Math.max(Math.sign(z) * W * 0.5, Math.sign(z) * (W / 2 + 0.2)),
        ),
        '#1d1f22',
      ),
    );
  }
  // a roof rack, as on the hill buses
  parts.push(paint(box(-L + 1.3, -1.4, 3.02, 3.1, -W / 2 + 0.3, W / 2 - 0.3), '#4a4d52'));
  parts.push(paint(box(-L + 1.5, -1.6, 3.08, 3.3, -W / 2 + 0.5, W / 2 - 0.5), '#6d5a43'));
  wheels(parts, -1.75, 0.52, 0.34, W / 2 - 0.2);
  wheels(parts, -L + 2.55, 0.52, 0.34, W / 2 - 0.2);
  return finish('bus', parts, glass, material, glassMaterial);
}

function makeCar(material, glassMaterial) {
  const L = CAR.length;
  const W = CAR.width;
  const parts = [];
  const glass = [];
  const paintC = '#f1f3f5';
  parts.push(
    paint(
      shell(
        [
          [-L, 0.32, 0.12],
          [-0.02, 0.32, 0.12],
          [0, 0.66, 0.16],
          [-1.08, 0.87, 0.2],
          [-3.3, 0.9, 0.2],
          [-L + 0.03, 0.82, 0.14],
        ],
        W,
      ),
      paintC,
    ),
  );
  // the cabin: glass, with the roof and the pillars painted over it
  glass.push(
    shell(
      [
        [-3.72, 0.84, 0.05],
        [-1.0, 0.84, 0.05],
        [-1.72, 1.36, 0.1],
        [-3.2, 1.37, 0.1],
      ],
      W - 0.16,
      0.05,
      0.02,
    ).toNonIndexed(),
  );
  parts.push(
    paint(
      shell(
        [
          [-3.28, 1.34, 0.08],
          [-1.68, 1.33, 0.08],
          [-1.72, 1.41, 0.06],
          [-3.22, 1.42, 0.06],
        ],
        W - 0.18,
        0.05,
        0.015,
      ),
      paintC,
    ),
  );
  for (const z of [-1, 1]) {
    const y = (z * (W - 0.16)) / 2 + z * 0.006;
    const p = new THREE.BoxGeometry(0.08, 0.56, 0.02);
    p.translate(-2.42, 1.12, y);
    parts.push(paint(p, paintC));
    const a = new THREE.BoxGeometry(0.07, 0.68, 0.02);
    a.rotateZ(0.95);
    a.translate(-1.36, 1.1, y);
    parts.push(paint(a, paintC));
    const c = new THREE.BoxGeometry(0.1, 0.68, 0.02);
    c.rotateZ(-0.78);
    c.translate(-3.46, 1.1, y);
    parts.push(paint(c, paintC));
    // the lamps, the door line, the sill
    parts.push(paint(box(-0.14, 0.01, 0.56, 0.66, z * 0.62 - 0.2, z * 0.62 + 0.2), '#fff3c9'));
    parts.push(paint(box(-L - 0.015, -L + 0.08, 0.66, 0.8, z * 0.6 - 0.21, z * 0.6 + 0.21), '#d4141a'));
    const edge = z * (W / 2 + 0.002);
    parts.push(paint(box(-3.5, -1.1, 0.36, 0.43, Math.min(edge, edge - z * 0.02), Math.max(edge, edge - z * 0.02)), '#26282c'));
    parts.push(paint(box(-2.46, -2.43, 0.44, 0.86, Math.min(edge, edge - z * 0.02), Math.max(edge, edge - z * 0.02)), '#b9bfc5'));
    // the wing mirror
    parts.push(paint(box(-1.42, -1.3, 0.96, 1.05, Math.min(z * (W / 2), z * (W / 2 + 0.17)), Math.max(z * (W / 2), z * (W / 2 + 0.17))), paintC));
  }
  parts.push(paint(box(-0.03, 0.03, 0.3, 0.46, -W / 2 + 0.08, W / 2 - 0.08), '#2a2c30'));
  parts.push(paint(box(-0.02, 0.02, 0.5, 0.6, -0.4, 0.4), '#3a3d42'));
  wheels(parts, -0.86, 0.32, 0.22, W / 2 - 0.12);
  wheels(parts, -3.42, 0.32, 0.22, W / 2 - 0.12);
  return finish('car', parts, glass, material, glassMaterial);
}

function makeCng(material, glassMaterial) {
  const green = '#2c8a4f';
  const parts = [];
  const glass = [];
  const W = 1.34;
  const L = 2.7;
  parts.push(
    paint(
      shell(
        [
          [-L, 0.3, 0.1],
          [-0.1, 0.3, 0.1],
          [0, 0.46, 0.12],
          [-0.28, 1.0, 0.12],
          [-1.0, 1.02, 0.08],
          [-L + 0.06, 1.0, 0.12],
        ],
        W,
      ),
      green,
    ),
  );
  // the pale band, the canopy, the frame that carries it, the windscreen
  parts.push(paint(box(-L + 0.02, -0.14, 0.7, 0.8, -W / 2 - 0.004, W / 2 + 0.004), '#e9e4c8'));
  parts.push(
    paint(
      shell(
        [
          [-L + 0.02, 1.68, 0.1],
          [-0.42, 1.68, 0.1],
          [-0.3, 1.76, 0.06],
          [-L + 0.14, 1.82, 0.14],
        ],
        W - 0.02,
        0.06,
        0.02,
      ),
      '#17191c',
    ),
  );
  parts.push(paint(box(-L + 0.02, -L + 0.1, 1.0, 1.7, -W / 2 + 0.02, W / 2 - 0.02), '#2c6e45'));
  for (const z of [-1, 1]) {
    const p = new THREE.BoxGeometry(0.05, 0.76, 0.05);
    p.translate(-0.46, 1.32, (z * (W - 0.1)) / 2);
    parts.push(paint(p, '#1d2024'));
    const q = new THREE.BoxGeometry(0.05, 0.72, 0.05);
    q.translate(-1.72, 1.34, (z * (W - 0.06)) / 2);
    parts.push(paint(q, '#1d2024'));
    // the iron door grille
    for (let i = 0; i < 4; i++)
      parts.push(paint(box(-1.66 + i * 0.28, -1.63 + i * 0.28, 1.02, 1.66, (z * W) / 2 - 0.014, (z * W) / 2 + 0.014), '#30343a'));
    parts.push(paint(box(-L - 0.012, -L + 0.03, 0.62, 0.72, z * 0.44 - 0.13, z * 0.44 + 0.13), '#ff2a14'));
  }
  parts.push(paint(box(-0.05, 0.0, 0.62, 0.74, -0.12, 0.12), '#fff3c9'));
  const screen = new THREE.BoxGeometry(0.03, 0.72, W - 0.16);
  screen.rotateZ(0.22);
  screen.translate(-0.42, 1.32, 0);
  glass.push(screen.toNonIndexed());
  wheels(parts, -0.42, 0.25, 0.14, 0, '#d7dade', [0]);
  wheels(parts, -2.2, 0.25, 0.14, W / 2 - 0.02, '#d7dade');
  return finish('cng', parts, glass, material, glassMaterial);
}

export function createVehicles() {
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.12, envMapIntensity: 1.1 });
  const glassMaterial = new THREE.MeshStandardMaterial({ color: '#16222c', roughness: 0.1, metalness: 0.65, envMapIntensity: 1.6 });
  return {
    bus: makeBus(material, glassMaterial),
    car: makeCar(material, glassMaterial),
    cng: makeCng(material, glassMaterial),
  };
}
