// The 17 objects, one for each row of Table 1.05, each drawn about 1 unit wide and centred on the origin (the app scales them to their true size).
// Clear shapes and colours that stand out on each stop's coloured backdrop (see BACKDROPS in app.js). Each returns
//   { group, tick?(time, dt, focus), pins?: [{ key, object, facing? }] }
// Still parts that share a material are merged into one mesh, and repeated parts (stitches, rungs, piers, legs)
// are instanced, so each object costs a handful of draw calls.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LAND, BANGLADESH } from './world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...o });
const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
};

/** A matrix from a position, an Euler rotation and a scale (a number or [x, y, z]). */
function mat4(p = [0, 0, 0], r = [0, 0, 0], s = 1) {
  const sc = typeof s === 'number' ? V(s, s, s) : V(...s);
  return new THREE.Matrix4().compose(V(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), sc);
}
/** The matrix that turns a unit cylinder (radius 1, height 1, along y) into a rod of radius r from a to b. */
function rod(a, b, r) {
  const d = b.clone().sub(a);
  return new THREE.Matrix4().compose(
    a.clone().lerp(b, 0.5),
    new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize()),
    V(r, d.length(), r),
  );
}
/** Still parts sharing one material, merged into one geometry: a list of [geometry, matrix?]. */
function merged(parts) {
  const geos = parts.map(([g, m]) => {
    const c = g.index ? g.toNonIndexed() : g.clone();
    if (m) c.applyMatrix4(m);
    for (const k of Object.keys(c.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') c.deleteAttribute(k);
    return c;
  });
  const out = mergeGeometries(geos);
  for (const g of geos) g.dispose();
  for (const [g] of parts) g.dispose();
  return out;
}
/** One instanced mesh from a list of matrices (and colours). */
function instanced(geo, mat, matrices, colors) {
  const m = new THREE.InstancedMesh(geo, mat, matrices.length);
  matrices.forEach((x, i) => m.setMatrixAt(i, x));
  if (colors) colors.forEach((c, i) => m.setColorAt(i, new THREE.Color(c)));
  m.computeBoundingSphere();
  return m;
}

/** Soft round sprite texture, white; glows tint it with the material colour. Made once, shared. */
function radialTexture(stops, size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, a] of stops) grad.addColorStop(o, `rgba(255,255,255,${a})`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const DOT = radialTexture(
  [
    [0, 1],
    [0.85, 1],
    [1, 0],
  ],
  64,
);
const GLOW = radialTexture(
  [
    [0, 1],
    [0.35, 0.45],
    [1, 0],
  ],
  128,
);

function glow(color, scale, strength = 0.55) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color, opacity: strength, depthWrite: false, transparent: true }));
  s.scale.setScalar(scale);
  s.userData.strength = strength;
  return s;
}

function points(positions, colors, size, glowing = false) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const mat = glowing // stars that add up where they crowd, as a galaxy does against the night sky
    ? new THREE.PointsMaterial({
        size,
        sizeAttenuation: false,
        vertexColors: true,
        map: GLOW,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    : new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: true, map: DOT, alphaTest: 0.5, transparent: false });
  return new THREE.Points(geo, mat);
}

/** A glowing rim: brighter where the surface turns away from us (the electron cloud, the Earth's air). */
function rimMaterial(rgb, base, gain, power, invert) {
  const f = invert ? '1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0)' : 'clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0)';
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vV;
      void main(){ float f = ${f}; gl_FragColor = vec4(${rgb}, ${base.toFixed(3)} + ${gain.toFixed(3)} * pow(f, ${power.toFixed(2)})); }`,
  });
}

// ── nucleus: 6 protons + 6 neutrons ─────────────────────────────────────────────
function nucleus() {
  const group = new THREE.Group();
  const geo = new THREE.SphereGeometry(0.165, 32, 20);
  const ico = new THREE.IcosahedronGeometry(0.2, 0).getAttribute('position');
  const seen = [];
  for (let i = 0; i < ico.count; i++) {
    const p = V(ico.getX(i), ico.getY(i), ico.getZ(i));
    if (seen.some((q) => q.distanceTo(p) < 1e-3)) continue;
    seen.push(p);
  }
  const at = (odd) => seen.filter((_, i) => i % 2 === odd).map((p) => new THREE.Matrix4().makeTranslation(p.x, p.y, p.z));
  const balls = new THREE.Group();
  balls.add(instanced(geo, std('#f76707', { roughness: 0.35 }), at(0)), instanced(geo, std('#ced4da', { roughness: 0.35 }), at(1)));
  group.add(balls);
  balls.rotation.set(0.4, 0.3, 0);
  return { group, tick: (t) => (balls.rotation.y = 0.3 + t * 0.25) };
}

// ── atom: electron cloud, orbits, a (much enlarged) nucleus ─────────────────────
function atom() {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.SphereGeometry(0.45, 48, 24), rimMaterial('0.55, 0.72, 1.0', 0.06, 0.34, 1.6, false)));
  const core = instanced(
    new THREE.SphereGeometry(0.028, 20, 14),
    std('#ffffff', { roughness: 0.35 }),
    [
      [0.018, 0, 0],
      [-0.016, 0.012, 0.01],
      [-0.004, -0.018, -0.012],
      [0.006, 0.014, -0.02],
    ].map((p) => mat4(p)),
    ['#f76707', '#ced4da', '#f76707', '#ced4da'],
  );
  group.add(core);
  const orbits = [
    { r: 0.24, tilt: [1.2, 0.2, 0], speed: 1.6 },
    { r: 0.38, tilt: [0.5, -0.6, 0.3], speed: 1.1 },
    { r: 0.38, tilt: [-0.7, 0.5, -0.2], speed: 0.9 },
  ].map((o) => ({ ...o, q: new THREE.Quaternion().setFromEuler(new THREE.Euler(...o.tilt)) }));
  const rings = merged(orbits.map((o) => [new THREE.TorusGeometry(o.r, 0.004, 6, 128), mat4([0, 0, 0], o.tilt)]));
  group.add(new THREE.Mesh(rings, new THREE.MeshBasicMaterial({ color: '#a5b4fc', transparent: true, opacity: 0.75 })));
  const electrons = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.028, 20, 14),
    std('#74c0fc', { roughness: 0.3, emissive: new THREE.Color('#1d4a80') }),
    orbits.length,
  );
  electrons.boundingSphere = new THREE.Sphere(V(0, 0, 0), 0.42);
  group.add(electrons);
  const p = new THREE.Vector3();
  const m = new THREE.Matrix4();
  const tick = (t) => {
    for (const [i, o] of orbits.entries()) {
      const a = t * o.speed + i * 2.1;
      p.set(Math.cos(a) * o.r, Math.sin(a) * o.r, 0).applyQuaternion(o.q);
      electrons.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z));
    }
    electrons.instanceMatrix.needsUpdate = true;
    core.rotation.y = t * 0.4;
  };
  tick(0);
  return { group, tick };
}

// ── DNA: a double helix lying along x ───────────────────────────────────────────
function dna() {
  const group = new THREE.Group();
  const helix = new THREE.Group();
  const R = 0.098;
  const L = 0.94;
  const turns = 3;
  const strand = (phase) => {
    const pts = [];
    for (let i = 0; i <= 240; i++) {
      const s = i / 240;
      const a = s * turns * Math.PI * 2 + phase;
      pts.push(V(-L / 2 + s * L, Math.cos(a) * R, Math.sin(a) * R));
    }
    return new THREE.CatmullRomCurve3(pts);
  };
  const gap = 2.2; // the two backbones are not opposite: that makes the major and minor grooves
  const a = strand(0);
  const b = strand(gap);
  helix.add(new THREE.Mesh(new THREE.TubeGeometry(a, 360, 0.012, 8), std('#4dabf7', { roughness: 0.35 })));
  helix.add(new THREE.Mesh(new THREE.TubeGeometry(b, 360, 0.012, 8), std('#ff922b', { roughness: 0.35 })));
  const pairs = [
    ['#ffd43b', '#63e6be'],
    ['#63e6be', '#ffd43b'],
    ['#e599f7', '#ff8787'],
    ['#ff8787', '#e599f7'],
  ];
  const n = turns * 10;
  const matrices = [];
  const colors = [];
  for (let i = 0; i < n; i++) {
    const s = (i + 0.5) / n;
    const pa = a.getPointAt(s);
    const pb = b.getPointAt(s);
    pb.x = pa.x;
    const mid = pa.clone().lerp(pb, 0.5);
    const [ca, cb] = pairs[(i * 7) % 4];
    matrices.push(rod(pa, mid, 0.0065), rod(pb, mid, 0.0065));
    colors.push(ca, cb);
  }
  helix.add(instanced(new THREE.CylinderGeometry(1, 1, 1, 8), std('#ffffff', { roughness: 0.45 }), matrices, colors));
  group.add(helix);
  group.rotation.z = 0.12;
  return { group, tick: (t) => (helix.rotation.x = t * 0.45) };
}

// ── red blood cells: biconcave discs ────────────────────────────────────────────
function rbc() {
  const group = new THREE.Group();
  const R = 0.32;
  const pts = [];
  // Evans–Fung shape: half-thickness z = R/2·√(1−ρ²)·(0.207 + 2.003ρ² − 1.123ρ⁴)
  const z = (p) => (R / 2) * Math.sqrt(Math.max(0, 1 - p * p)) * (0.207 + 2.003 * p * p - 1.123 * p ** 4);
  for (let i = 0; i <= 40; i++) {
    const p = i / 40;
    pts.push(new THREE.Vector2(Math.max(1e-4, p * R), z(p)));
  }
  for (let i = 40; i >= 0; i--) {
    const p = i / 40;
    pts.push(new THREE.Vector2(Math.max(1e-4, p * R), -z(p)));
  }
  const geo = new THREE.LatheGeometry(pts, 72);
  geo.computeVertexNormals();
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#c92a2a',
    roughness: 0.42,
    sheen: 0.6,
    sheenColor: new THREE.Color('#ff8787'),
    clearcoat: 0.25,
  });
  const cells = [
    // the disc's axis is y, so rotation.x ≈ 0 is edge-on and ≈ π/2 faces us
    [-0.17, 0, 0, 1.2, 0, 0.12], // nearly face-on: the dimple
    [0.37, 0.02, 0.05, 0.12, 0.5, 0.12], // edge-on: thick rim, thin middle
    [0.05, 0.05, -0.5, 0.75, -0.4, -0.5],
  ].map(([x, y, zz, rx, ry, rz]) => {
    const m = mesh(geo, mat, x, y, zz);
    m.rotation.set(rx, ry, rz);
    group.add(m);
    return m;
  });
  return {
    group,
    tick(t) {
      cells[0].rotation.x = 1.2 + Math.sin(t * 0.35) * 0.12;
      cells[1].rotation.y = 0.5 + Math.sin(t * 0.3 + 1) * 0.15;
      cells[2].rotation.z = -0.5 + Math.sin(t * 0.35 + 2) * 0.2;
    },
  };
}

// ── ant ─────────────────────────────────────────────────────────────────────────
function ant() {
  const group = new THREE.Group();
  const ball = () => new THREE.SphereGeometry(1, 32, 20);
  // gaster, petiole, thorax, head
  const body = merged(
    [
      [0.17, 0.12, 0.12, -0.24, 0.03, 0, 0.15],
      [0.035, 0.04, 0.035, -0.06, 0.0, 0, 0],
      [0.13, 0.06, 0.06, 0.08, 0.02, 0, -0.25],
      [0.085, 0.075, 0.07, 0.27, 0.06, 0, 0],
    ].map(([rx, ry, rz, x, y, zz, rot]) => [ball(), mat4([x, y, zz], [0, 0, rot], [rx, ry, rz])]),
  );
  group.add(new THREE.Mesh(body, std('#4a1f12', { roughness: 0.3 })));
  const limb = std('#5c2a18', { roughness: 0.4 });
  const unit = new THREE.CylinderGeometry(1, 1, 1, 8);
  const antennae = [];
  for (const side of [1, -1]) {
    const base = V(0.33, 0.1, side * 0.03);
    const elbow = V(0.38, 0.22, side * 0.08);
    const tip = V(0.5, 0.16, side * 0.14);
    antennae.push([unit.clone(), rod(base, elbow, 0.006)], [unit.clone(), rod(elbow, tip, 0.005)]);
  }
  group.add(new THREE.Mesh(merged(antennae), limb));
  // six legs of two parts each, one instanced mesh; each leg swings about its hip
  const legs = [];
  [0.02, 0.09, 0.16].forEach((x, i) => {
    for (const side of [1, -1]) {
      const knee = V((i - 1) * 0.07, 0.08, side * 0.15);
      const foot = V((i - 1) * 0.16, -0.15, side * 0.25);
      legs.push({
        hip: V(x, -0.01, side * 0.03),
        parts: [rod(V(0, 0, 0), knee, 0.0085), rod(knee, foot, 0.007)],
        phase: (i + (side > 0 ? 0 : 1)) % 2,
      });
    }
  });
  const legMesh = new THREE.InstancedMesh(unit, limb, legs.length * 2);
  legMesh.boundingSphere = new THREE.Sphere(V(0.09, -0.05, 0), 0.35);
  group.add(legMesh);
  const hipM = new THREE.Matrix4();
  const rot = new THREE.Matrix4();
  const out = new THREE.Matrix4();
  const tick = (t) => {
    legs.forEach(({ hip, parts, phase }, i) => {
      rot.makeRotationY(Math.sin(t * 7 + phase * Math.PI) * 0.18);
      hipM.makeTranslation(hip.x, hip.y, hip.z).multiply(rot);
      parts.forEach((p, j) => legMesh.setMatrixAt(i * 2 + j, out.multiplyMatrices(hipM, p)));
    });
    legMesh.instanceMatrix.needsUpdate = true;
  };
  tick(0);
  group.rotation.y = -0.35;
  return { group, tick };
}

// ── cricket ball ────────────────────────────────────────────────────────────────
function ball() {
  const group = new THREE.Group();
  const leather = new THREE.MeshPhysicalMaterial({ color: '#b3261e', roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.4 });
  group.add(mesh(new THREE.SphereGeometry(0.486, 48, 32), leather));
  const seam = new THREE.Group();
  seam.add(new THREE.Mesh(new THREE.TorusGeometry(0.487, 0.009, 6, 128), std('#8f1d17', { roughness: 0.6 })));
  const stitches = [];
  for (const lat of [-0.045, 0.045]) {
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const r = 0.487 * Math.cos(lat);
      stitches.push(mat4([Math.cos(a) * r, Math.sin(a) * r, 0.487 * Math.sin(lat)], [0, 0, a + Math.PI / 2 + (lat > 0 ? 0.5 : -0.5)]));
    }
  }
  seam.add(instanced(new THREE.BoxGeometry(0.02, 0.006, 0.007), std('#f1f3f5', { roughness: 0.7 }), stitches));
  seam.rotation.set(0.9, 0.5, 0);
  group.add(seam);
  return { group, tick: (t) => (group.rotation.y = t * 0.35) };
}

// ── student (about 1.5 m) ───────────────────────────────────────────────────────
function student() {
  const group = new THREE.Group();
  const figure = new THREE.Group();
  const capsule = (r, len) => new THREE.CapsuleGeometry(r, len, 8, 16);
  const sphere = (r, w = 16, h = 12, ...rest) => new THREE.SphereGeometry(r, w, h, ...rest);
  // metres, feet at y = 0. Every part is still except the right arm, so the rest is one mesh per material.
  const leftArm = mat4([-0.185, 1.2, 0], [0, 0, -0.08]);
  const inArm = (m, x, y) => m.clone().multiply(mat4([x, y, 0]));
  const head = [0, 1.385, 0];
  const dark = [
    ...[1, -1].map((s) => [new THREE.BoxGeometry(0.085, 0.055, 0.2), mat4([s * 0.075, 0.028, 0.03])]),
    [sphere(0.112, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), mat4([0, head[1] + 0.012, -0.008], [-0.25, 0, 0])],
    ...[1, -1].map((s) => [sphere(0.012, 12, 8), mat4([s * 0.036, head[1] + 0.012, 0.094])]),
  ];
  const trousers = [...[1, -1].map((s) => [capsule(0.058, 0.62), mat4([s * 0.075, 0.42, 0])]), [capsule(0.12, 0.08), mat4([0, 0.8, 0])]];
  const shirt = [
    [capsule(0.13, 0.26), mat4([0, 1.0, 0], [0, 0, 0], [1.15, 1, 0.78])],
    [capsule(0.046, 0.16), inArm(leftArm, 0, -0.1)],
  ];
  const skin = [
    [new THREE.CylinderGeometry(0.045, 0.05, 0.08, 16), mat4([0, 1.25, 0])],
    [sphere(0.105, 32, 24), mat4(head)],
    [capsule(0.038, 0.17), inArm(leftArm, 0, -0.31)],
    [sphere(0.044), inArm(leftArm, 0, -0.43)],
  ];
  const skinMat = std('#b98260', { roughness: 0.6 });
  const shirtMat = std('#f4f6fa', { roughness: 0.7 });
  figure.add(
    new THREE.Mesh(merged(dark), std('#1d1d1f', { roughness: 0.5 })),
    new THREE.Mesh(merged(trousers), std('#2b3a55', { roughness: 0.7 })),
    new THREE.Mesh(merged(shirt), shirtMat),
    new THREE.Mesh(merged(skin), skinMat),
  );
  // the right arm waves
  const arm = new THREE.Group();
  arm.position.set(0.185, 1.2, 0);
  arm.add(
    new THREE.Mesh(merged([[capsule(0.046, 0.16), mat4([0, -0.1, 0])]]), shirtMat),
    new THREE.Mesh(
      merged([
        [capsule(0.038, 0.17), mat4([0, -0.31, 0])],
        [sphere(0.044), mat4([0, -0.43, 0])],
      ]),
      skinMat,
    ),
  );
  arm.rotation.z = 0.08;
  figure.add(arm);
  figure.scale.setScalar(1 / 0.62); // model units: the framing width (0.62 m) is 1
  figure.position.y = -0.75 / 0.62; // centre the 1.5 m figure (position is in model units, not metres)
  group.add(figure);
  group.rotation.y = -0.25;
  let wave = 0;
  return {
    group,
    tick(t, dt, focus) {
      wave += ((focus ? 1 : 0) - wave) * Math.min(1, dt * 4);
      arm.rotation.z = 0.08 + wave * (2.5 + Math.sin(t * 6) * 0.28); // a friendly wave while we look at the student
      figure.position.y = -0.75 / 0.62 + Math.sin(t * 2) * 0.004;
    },
  };
}

// ── quark: no measured size, only an upper limit (smaller than 1 attometre) ────
function quark() {
  const group = new THREE.Group();
  const R = 0.357; // the dashed circle is 1 am across; the frame is 1.4 am
  const pts = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    pts.push(V(Math.cos(a) * R, Math.sin(a) * R, 0));
  }
  const ring = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineDashedMaterial({ color: '#e5dbff', dashSize: 0.03, gapSize: 0.02 }),
  );
  ring.computeLineDistances();
  group.add(ring);
  const q = new THREE.Group();
  q.add(
    glow('#ff8787', 0.28, 0.6),
    mesh(new THREE.SphereGeometry(0.04, 24, 16), std('#f03e3e', { roughness: 0.3, emissive: new THREE.Color('#5c0a0a') })),
  );
  group.add(q);
  // Drawn as a point because no size has ever been measured for it.
  return { group, tick: (t) => q.position.set(Math.sin(t * 1.3) * 0.04, Math.cos(t * 1.7) * 0.03, 0) };
}

// ── mango (about 10 cm) ─────────────────────────────────────────────────────────
function mango() {
  const group = new THREE.Group();
  const geo = new THREE.SphereGeometry(0.5, 64, 40);
  const pos = geo.getAttribute('position');
  const col = [];
  const green = new THREE.Color('#74b816');
  const yellow = new THREE.Color('#fcc419');
  const blush = new THREE.Color('#f76707');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) * 2; // −1 (stem end) … 1 (tip)
    const y = pos.getY(i) * 2;
    const z = pos.getZ(i) * 2;
    const tip = Math.max(0, x);
    const nx = x * 0.385;
    let ny = y * 0.27 - 0.07 * x * x + 0.035; // kidney-like curve
    ny -= 0.035 * tip * tip * (y < 0 ? 1 : 0.4); // the pointed "beak" at the tip
    const nz = z * 0.235 * (1 - 0.12 * tip);
    pos.setXYZ(i, nx, ny, nz);
    c.copy(green).lerp(yellow, Math.min(1, (x + 1) * 0.6));
    c.lerp(blush, Math.max(0, y) * Math.max(0, 0.6 - Math.abs(x)) * 0.8);
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const fruit = new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.5 }),
  );
  group.add(fruit);
  const stem = mesh(new THREE.CylinderGeometry(0.008, 0.011, 0.07, 10), std('#6b4423', { roughness: 0.8 }), -0.385, 0.06, 0);
  stem.rotation.z = 0.7;
  group.add(stem);
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.09, 0.06, 0.3, 0);
  leafShape.quadraticCurveTo(0.09, -0.06, 0, 0);
  const leaf = new THREE.Mesh(new THREE.ShapeGeometry(leafShape, 16), std('#2b8a3e', { roughness: 0.55, side: THREE.DoubleSide }));
  leaf.position.set(-0.41, 0.09, 0.01);
  leaf.rotation.set(0.5, 0.3, 2.55);
  group.add(leaf);
  group.rotation.set(0.15, -0.35, 0);
  return { group, tick: (t) => (group.rotation.y = -0.35 + Math.sin(t * 0.5) * 0.25) };
}

// ── bus (about 12 m) ────────────────────────────────────────────────────────────
function bus() {
  const group = new THREE.Group();
  const b = new THREE.Group();
  const L = 12;
  const W = 2.5;
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const at = (x, y, z, r) => mat4([x, y, z], r);
  const glass = [];
  for (let i = 0; i < 8; i++) {
    const x = -L / 2 + 1.3 + i * 1.2;
    for (const side of [1, -1]) glass.push([box(1.0, 0.85, 0.04), at(x, 2.45, side * (W / 2))]);
  }
  glass.push([box(0.04, 1.1, W - 0.3), at(L / 2, 2.35, 0)]); // windscreen
  glass.push([box(0.8, 1.9, 0.04), at(L / 2 - 1.1, 1.85, W / 2)]); // door
  const tyres = [];
  const hubs = [];
  for (const x of [L / 2 - 2.2, -L / 2 + 2.6]) {
    for (const side of [1, -1]) {
      tyres.push([new THREE.CylinderGeometry(0.5, 0.5, 0.32, 28), at(x, 0.5, side * (W / 2 - 0.12), [Math.PI / 2, 0, 0])]);
      hubs.push([new THREE.CylinderGeometry(0.22, 0.22, 0.34, 20), at(x, 0.5, side * (W / 2 - 0.1), [Math.PI / 2, 0, 0])]);
    }
  }
  const parts = [
    [[[new RoundedBoxGeometry(L, 1.25, W, 3, 0.15), at(0, 1.05, 0)]], std('#c92a2a', { roughness: 0.45 })],
    [[[new RoundedBoxGeometry(L, 1.5, W - 0.02, 3, 0.2), at(0, 2.4, 0)]], std('#f3ead2', { roughness: 0.5 })],
    [[[new RoundedBoxGeometry(L - 0.25, 0.14, W - 0.2, 2, 0.05), at(0, 3.2, 0)]], std('#ced4da', { roughness: 0.6 })],
    [[[box(L + 0.02, 0.12, W + 0.02), at(0, 1.72, 0)]], std('#2b8a3e', { roughness: 0.5 })], // stripe
    [glass, std('#2f3a46', { roughness: 0.15, metalness: 0.2 })],
    [[0.8, -0.8].map((s) => [box(0.05, 0.18, 0.35), at(L / 2 + 0.01, 0.85, s)]), std('#fff4c2', { emissive: new THREE.Color('#5c4a00') })],
    [tyres, std('#1e1f22', { roughness: 0.8 })],
    [hubs, std('#adb5bd', { roughness: 0.4, metalness: 0.5 })],
  ];
  for (const [list, mat] of parts) b.add(new THREE.Mesh(merged(list), mat));
  b.scale.setScalar(1 / 13); // model units: the framing width (13 m) is 1
  b.position.y = -1.65 / 13; // centre the 3.3 m tall bus (position is in model units, not metres)
  group.add(b);
  group.rotation.y = -0.45;
  return { group };
}

// ── football field (about 105 m × 68 m), as a small map block ───────────────────
function fieldTexture() {
  const LEN = 115;
  const WID = 78;
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d');
  g.scale(c.width / LEN, c.height / WID); // draw in metres: the texture is stretched back onto the 115 × 78 m plane
  for (let i = 0; i * 7.5 < LEN; i++) {
    g.fillStyle = i % 2 ? '#6cbf5f' : '#5fb253';
    g.fillRect(i * 7.5, 0, 7.6, WID);
  }
  const ox = 5;
  const oy = 5;
  g.strokeStyle = '#ffffff';
  g.lineWidth = 0.24;
  const circle = (x, y, r, a0 = 0, a1 = Math.PI * 2) => {
    g.beginPath();
    g.arc(x, y, r, a0, a1);
    g.stroke();
  };
  g.strokeRect(ox, oy, 105, 68);
  g.beginPath();
  g.moveTo(ox + 52.5, oy);
  g.lineTo(ox + 52.5, oy + 68);
  g.stroke();
  circle(ox + 52.5, oy + 34, 9.15);
  for (const end of [0, 1]) {
    const x0 = end ? ox + 105 : ox;
    const dir = end ? -1 : 1;
    g.strokeRect(Math.min(x0, x0 + dir * 16.5), oy + 34 - 20.16, 16.5, 40.32);
    g.strokeRect(Math.min(x0, x0 + dir * 5.5), oy + 34 - 9.16, 5.5, 18.32);
    circle(x0 + dir * 11, oy + 34, 9.15, end ? Math.PI - 0.93 : -0.93, end ? Math.PI + 0.93 : 0.93);
  }
  g.fillStyle = '#ffffff';
  for (const x of [11, 52.5, 94]) {
    g.beginPath();
    g.arc(ox + x, oy + 34, 0.32, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function field() {
  const group = new THREE.Group();
  const u = 1 / 125; // model units per metre (framing width 125 m)
  group.add(mesh(new THREE.BoxGeometry(115 * u, 3 * u, 78 * u), std('#c8a97e', { roughness: 0.9 }), 0, -1.5 * u, 0));
  const top = mesh(
    new THREE.PlaneGeometry(115 * u, 78 * u),
    new THREE.MeshStandardMaterial({ map: fieldTexture(), roughness: 0.85 }),
    0,
    0.01 * u,
    0,
  );
  top.rotation.x = -Math.PI / 2;
  group.add(top);
  const goals = [];
  for (const end of [-1, 1]) {
    const x = end * 52.5 * u;
    for (const zz of [-3.66, 3.66]) goals.push([new THREE.BoxGeometry(0.25 * u, 2.44 * u, 0.25 * u), mat4([x, 1.22 * u, zz * u])]);
    goals.push([new THREE.BoxGeometry(0.25 * u, 0.25 * u, 7.32 * u), mat4([x, 2.44 * u, 0])]);
  }
  group.add(new THREE.Mesh(merged(goals), std('#ffffff', { roughness: 0.5 })));
  group.rotation.y = 0.12;
  return { group };
}

// ── Padma Bridge over the river, as a small map block ───────────────────────────
function bridge() {
  const group = new THREE.Group();
  const W = 1;
  const D = 0.6;
  const T = 0.03;
  const riverW = 6.3 / 8; // the river is about 6 km wide here; the model is 8 km across
  group.add(mesh(new THREE.BoxGeometry(W, T, D), std('#c8a97e', { roughness: 0.9 }), 0, -T / 2, 0));
  const bankW = (W - riverW) / 2;
  group.add(
    new THREE.Mesh(
      merged([1, -1].map((s) => [new THREE.BoxGeometry(bankW, 0.002, D), mat4([s * (riverW / 2 + bankW / 2), 0.001, 0])])),
      std('#a9d18e', { roughness: 0.9 }),
    ),
  );
  group.add(mesh(new THREE.BoxGeometry(riverW, 0.001, D), std('#5fa8e8', { roughness: 0.35 }), 0, 0.0005, 0));
  // sand bars, as on the real river
  const bars = [
    [-0.12, -0.16, 0.16, 0.05],
    [0.18, 0.15, 0.12, 0.04],
  ].map(([x, zz, sx, sz]) => [new THREE.CylinderGeometry(0.5, 0.5, 0.0012, 40), mat4([x, 0.0011, zz], [0, 0, 0], [sx, 1, sz])]);
  group.add(new THREE.Mesh(merged(bars), std('#e9dcc0', { roughness: 0.95 })));
  const len = 6.15 / 8;
  const deckY = 0.016; // height exaggerated so it can be seen
  group.add(mesh(new THREE.BoxGeometry(len, 0.0035, 0.007), std('#7d8792', { roughness: 0.45, metalness: 0.3 }), 0, deckY, 0));
  const piers = [];
  for (let i = 0; i <= 41; i++) piers.push(mat4([-len / 2 + (i / 41) * len, deckY / 2, 0]));
  group.add(instanced(new THREE.CylinderGeometry(0.0018, 0.0022, deckY, 8), std('#9aa3ab', { roughness: 0.8 }), piers));
  // truss on top: a zigzag of thin bars
  const tpts = [];
  for (let i = 0; i <= 82; i++) {
    const x = -len / 2 + (i / 82) * len;
    tpts.push(x, deckY + (i % 2 ? 0.006 : 0.0018), 0);
  }
  group.add(
    new THREE.Line(
      new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(tpts, 3)),
      new THREE.LineBasicMaterial({ color: '#59636e' }),
    ),
  );
  const roadW = bankW + (riverW - len) / 2;
  group.add(
    new THREE.Mesh(
      merged([1, -1].map((s) => [new THREE.BoxGeometry(roadW, 0.003, 0.006), mat4([s * (W / 2 - roadW / 2), 0.0035, 0])])),
      std('#868e96', { roughness: 0.8 }),
    ),
  );
  return { group };
}

// ── Earth, with real country outlines and Bangladesh marked ─────────────────────
function earthTexture() {
  const W = 1024;
  const H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#5aa9e6';
  g.fillRect(0, 0, W, H);
  // Outlines that cross the 180° line are unwrapped (no jumps) and drawn three times: −360°, 0, +360°.
  const path = (ring) => {
    g.beginPath();
    for (const shift of [-360, 0, 360]) {
      let prev = ring[0];
      let off = 0;
      for (let i = 0; i < ring.length; i += 2) {
        const lon = ring[i];
        if (i && lon - prev > 180) off -= 360;
        else if (i && prev - lon > 180) off += 360;
        prev = lon;
        const x = ((lon + off + shift + 180) / 360) * W;
        const y = ((90 - ring[i + 1]) / 180) * H;
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.closePath();
    }
  };
  for (const ring of LAND) {
    let lat = 0;
    for (let i = 1; i < ring.length; i += 2) lat += ring[i];
    lat /= ring.length / 2;
    path(ring);
    g.fillStyle = Math.abs(lat) > 62 ? '#eef2f5' : '#a7d48c';
    g.fill();
  }
  g.lineWidth = 0.7;
  g.strokeStyle = 'rgba(70, 110, 60, 0.4)';
  for (const ring of LAND) {
    path(ring);
    g.stroke();
  }
  for (const ring of BANGLADESH) {
    path(ring);
    g.fillStyle = '#2b8a3e';
    g.fill();
    g.lineWidth = 1;
    g.strokeStyle = '#1b5e20';
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function earth() {
  const group = new THREE.Group();
  const globe = new THREE.Group();
  globe.rotation.z = -0.41; // axial tilt, 23.4°
  const r = 0.49;
  const sphere = mesh(new THREE.SphereGeometry(r, 64, 48), new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.75 }));
  globe.add(sphere);
  group.add(globe);
  group.add(new THREE.Mesh(new THREE.SphereGeometry(r * 1.03, 48, 24), rimMaterial('0.45, 0.68, 0.98', 0, 0.6, 2.5, true)));
  // Bangladesh: 90.4° E, 23.7° N, in the sphere's own UV mapping
  const lon = 90.4;
  const lat = 23.7;
  const phi = ((lon + 180) / 360) * Math.PI * 2;
  const theta = ((90 - lat) / 180) * Math.PI;
  const bd = V(-r * Math.cos(phi) * Math.sin(theta), r * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta));
  const anchor = new THREE.Object3D();
  anchor.position.copy(bd);
  sphere.add(anchor);
  return {
    group,
    // Turn slowly, but keep Bangladesh in view.
    tick: (t) => (sphere.rotation.y = Math.PI + 0.15 + Math.sin(t * 0.25) * 0.35),
    pins: [{ key: 'pin_bangladesh', object: anchor, facing: true }],
  };
}

// ── Sun ─────────────────────────────────────────────────────────────────────────
function sun() {
  const group = new THREE.Group();
  const uniforms = { uTime: { value: 0 } };
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.435, 64, 48),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vV;
        void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uTime; varying vec3 vP; varying vec3 vN; varying vec3 vV;
        float h(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        float n(vec3 p){ vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(h(i), h(i + vec3(1,0,0)), f.x), mix(h(i + vec3(0,1,0)), h(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(h(i + vec3(0,0,1)), h(i + vec3(1,0,1)), f.x), mix(h(i + vec3(0,1,1)), h(i + vec3(1,1,1)), f.x), f.y), f.z); }
        void main(){
          vec3 p = vP * 9.0 + vec3(0.0, uTime * 0.15, 0.0);
          float g = n(p) * 0.55 + n(p * 2.1) * 0.3 + n(p * 4.3) * 0.15;
          vec3 col = mix(vec3(0.98, 0.50, 0.07), vec3(1.0, 0.84, 0.32), g);
          float mu = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
          col *= 0.62 + 0.38 * pow(mu, 0.5);
          gl_FragColor = vec4(col, 1.0);
        }`,
    }),
  );
  group.add(glow('#ff922b', 1.45, 0.6), ball);
  return { group, tick: (t) => ((uniforms.uTime.value = t), (ball.rotation.y = t * 0.05)) };
}

// ── solar system: orbits to Neptune, Earth's orbit in blue ──────────────────────
function solar() {
  const group = new THREE.Group();
  const plane = new THREE.Group();
  group.add(plane);
  const AU = [0.387, 0.723, 1, 1.524, 5.203, 9.537, 19.19, 30.07];
  const scale = 0.479 / 30.07;
  const colors = ['#ced4da', '#ffc078', '#4dabf7', '#ff6b3d', '#e0a872', '#e8cc8a', '#66d9e8', '#748ffc'];
  const ring = (a, i) => [new THREE.TorusGeometry(a * scale, i === 2 ? 0.0018 : 0.001, 6, 192), mat4([0, 0, 0], [Math.PI / 2, 0, 0])];
  plane.add(new THREE.Mesh(merged(AU.flatMap((a, i) => (i === 2 ? [] : [ring(a, i)]))), new THREE.MeshBasicMaterial({ color: '#9aa6b8' })));
  plane.add(new THREE.Mesh(merged([ring(AU[2], 2)]), new THREE.MeshBasicMaterial({ color: '#4dabf7' })));
  plane.add(glow('#ffa94d', 0.05, 0.9), mesh(new THREE.SphereGeometry(0.006, 16, 12), new THREE.MeshBasicMaterial({ color: '#fab005' })));
  const pos = new Float32Array(AU.length * 3);
  const col = [];
  for (const c of colors) col.push(...new THREE.Color(c).toArray());
  const planets = points(Array.from(pos), col, 7);
  plane.add(planets);
  const phase = AU.map((_, i) => i * 1.7);
  const tick = (t) => {
    const p = planets.geometry.getAttribute('position');
    AU.forEach((a, i) => {
      const ang = phase[i] + t * 0.9 * a ** -1.5;
      p.setXYZ(i, Math.cos(ang) * a * scale, 0, Math.sin(ang) * a * scale);
    });
    p.needsUpdate = true;
  };
  tick(0);
  planets.geometry.boundingSphere = new THREE.Sphere(V(0, 0, 0), 0.5);
  return { group, tick };
}

// ── the nearest star: the Sun and Proxima Centauri, 4.2 light-years apart ───────
function star() {
  const group = new THREE.Group();
  const d = 0.851 / 2;
  const sunDot = new THREE.Group();
  sunDot.position.x = -d;
  sunDot.add(glow('#ffa94d', 0.07, 0.8), mesh(new THREE.SphereGeometry(0.009, 16, 12), new THREE.MeshBasicMaterial({ color: '#fab005' })));
  const proxima = new THREE.Group();
  proxima.position.x = d;
  proxima.add(glow('#ff6b6b', 0.06, 0.8), mesh(new THREE.SphereGeometry(0.0075, 16, 12), new THREE.MeshBasicMaterial({ color: '#ff6b6b' })));
  group.add(sunDot, proxima);
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([V(-d + 0.02, 0, 0), V(d - 0.02, 0, 0)]),
    new THREE.LineDashedMaterial({ color: '#c5cdd9', dashSize: 0.018, gapSize: 0.012 }),
  );
  line.computeLineDistances();
  group.add(line);
  const pos = [];
  const col = [];
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 90; i++) {
    pos.push((rnd() - 0.5) * 1.2, (rnd() - 0.5) * 0.4, (rnd() - 0.5) * 0.5);
    const g = 0.72 + rnd() * 0.15;
    col.push(g, g, g + 0.03);
  }
  group.add(points(pos, col, 3));
  return {
    group,
    pins: [
      { key: 'pin_sun', object: sunDot },
      { key: 'pin_star', object: proxima },
    ],
  };
}

// ── a galaxy: four spiral arms and a bulge, seen at a slant ─────────────────────
function galaxy() {
  const group = new THREE.Group();
  const disc = new THREE.Group();
  group.add(disc);
  const pos = [];
  const col = [];
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
  const R = 0.463;
  const arm = (r, k) => k * (Math.PI / 2) + Math.log(r / 0.02) / 0.3;
  const c = (hex) => new THREE.Color(hex).multiplyScalar(0.6).toArray();
  const palette = { blue: c('#5c7cfa'), blue2: c('#91a7ff'), violet: c('#9775fa'), pink: c('#f06595'), warm: c('#ffa94d'), cream: c('#ffd8a8') };
  for (let i = 0; i < 14000; i++) {
    const r = 0.03 + (R - 0.03) * rnd() ** 0.75;
    const a = arm(r, i % 4) + gauss() * (0.22 + 0.25 * (1 - r / R));
    pos.push(Math.cos(a) * r, gauss() * 0.006, Math.sin(a) * r);
    const roll = rnd();
    col.push(...(roll < 0.07 ? palette.pink : roll < 0.2 ? palette.cream : roll < 0.6 ? palette.blue : roll < 0.85 ? palette.blue2 : palette.violet));
  }
  for (let i = 0; i < 4000; i++) {
    const r = Math.abs(gauss()) * 0.05;
    const a = rnd() * Math.PI * 2;
    pos.push(Math.cos(a) * r, gauss() * 0.02, Math.sin(a) * r);
    col.push(...(rnd() < 0.6 ? palette.warm : palette.cream));
  }
  disc.add(points(pos, col, 4.5, true));
  const core = glow('#ffa94d', 0.32, 0.6);
  disc.add(core);
  return {
    group,
    tick: (t) => (disc.rotation.y = t * 0.03),
    // Seen from inside (zooming out towards it), it is a field of stars; the core's glow fades in at the end.
    maxK: 30,
    onView: (k) => (core.material.opacity = core.userData.strength * Math.min(1, Math.max(0, (6 - k) / 4))),
  };
}

const BUILDERS = { quark, nucleus, atom, dna, rbc, ant, ball, mango, student, bus, field, bridge, earth, sun, solar, star, galaxy };

export function buildObject(id) {
  return BUILDERS[id]();
}
