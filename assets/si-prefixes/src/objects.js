// The 17 objects, one for each row of Table 1.05, each drawn about 1 unit wide and centred on the origin (the app scales them to their true size).
// Plain textbook look: clear shapes and colours on a white page. Each returns
//   { group, tick?(time, dt, focus), pins?: [{ key, point: Vector3 (model units), facing?: Vector3 }] }
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { LAND, BANGLADESH } from './world.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...o });
const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
};

/** Soft round sprite used for glows and point stars. */
function radialTexture(stops, size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, col] of stops) grad.addColorStop(o, col);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const DOT = radialTexture([[0, 'rgba(255,255,255,1)'], [0.85, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']], 64);

function glow(color, scale, strength = 0.55) {
  const c = new THREE.Color(color);
  const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
  const tex = radialTexture([[0, `rgba(${rgb},${strength})`], [0.35, `rgba(${rgb},${strength * 0.45})`], [1, `rgba(${rgb},0)`]]);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true }));
  s.scale.setScalar(scale);
  return s;
}

function points(positions, colors, size, attenuate = false) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({ size, sizeAttenuation: attenuate, vertexColors: true, map: DOT, alphaTest: 0.5, transparent: false });
  return new THREE.Points(geo, mat);
}

// ── nucleus: 6 protons + 6 neutrons ─────────────────────────────────────────────
function nucleus() {
  const group = new THREE.Group();
  const proton = std('#e8590c', { roughness: 0.35 });
  const neutron = std('#adb5bd', { roughness: 0.35 });
  const geo = new THREE.SphereGeometry(0.165, 40, 24);
  const ico = new THREE.IcosahedronGeometry(0.2, 0).getAttribute('position');
  const seen = [];
  for (let i = 0; i < ico.count; i++) {
    const p = V(ico.getX(i), ico.getY(i), ico.getZ(i));
    if (seen.some((q) => q.distanceTo(p) < 1e-3)) continue;
    seen.push(p);
  }
  seen.forEach((p, i) => group.add(mesh(geo, i % 2 ? neutron : proton, p.x, p.y, p.z)));
  group.rotation.set(0.4, 0.3, 0);
  return { group, tick: (t) => (group.rotation.y = 0.3 + t * 0.25) };
}

// ── atom: electron cloud, orbits, a (much enlarged) nucleus ─────────────────────
function atom() {
  const group = new THREE.Group();
  const cloud = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 64, 32),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader: `varying vec3 vN; varying vec3 vV;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vN; varying vec3 vV;
        void main(){ float f = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0); float a = 0.05 + 0.32 * pow(f, 1.6); gl_FragColor = vec4(0.42, 0.62, 0.96, a); }`,
    }),
  );
  group.add(cloud);
  const core = new THREE.Group();
  const cg = new THREE.SphereGeometry(0.028, 24, 16);
  [['#e8590c', 0.018, 0, 0], ['#adb5bd', -0.016, 0.012, 0.01], ['#e8590c', -0.004, -0.018, -0.012], ['#adb5bd', 0.006, 0.014, -0.02]].forEach(([c, x, y, z]) => core.add(mesh(cg, std(c, { roughness: 0.35 }), x, y, z)));
  group.add(core);
  const ringMat = new THREE.MeshBasicMaterial({ color: '#5c7cfa', transparent: true, opacity: 0.55 });
  const eMat = std('#1c4fd9', { roughness: 0.3 });
  const orbits = [
    { r: 0.24, tilt: [1.2, 0.2, 0], speed: 1.6 },
    { r: 0.38, tilt: [0.5, -0.6, 0.3], speed: 1.1 },
    { r: 0.38, tilt: [-0.7, 0.5, -0.2], speed: 0.9 },
  ].map((o) => {
    const g = new THREE.Group();
    g.rotation.set(...o.tilt);
    g.add(new THREE.Mesh(new THREE.TorusGeometry(o.r, 0.0035, 8, 128), ringMat));
    const e = mesh(new THREE.SphereGeometry(0.026, 20, 14), eMat);
    g.add(e);
    group.add(g);
    return { ...o, e };
  });
  return {
    group,
    tick(t) {
      for (const [i, o] of orbits.entries()) {
        const a = t * o.speed + i * 2.1;
        o.e.position.set(Math.cos(a) * o.r, Math.sin(a) * o.r, 0);
      }
      core.rotation.y = t * 0.4;
    },
  };
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
  helix.add(new THREE.Mesh(new THREE.TubeGeometry(a, 480, 0.012, 10), std('#1c6fd9', { roughness: 0.35 })));
  helix.add(new THREE.Mesh(new THREE.TubeGeometry(b, 480, 0.012, 10), std('#e8590c', { roughness: 0.35 })));
  const pairs = [['#f59f00', '#12b886'], ['#12b886', '#f59f00'], ['#ae3ec9', '#fa5252'], ['#fa5252', '#ae3ec9']];
  const rung = new THREE.CylinderGeometry(0.0065, 0.0065, 1, 8);
  const n = turns * 10;
  for (let i = 0; i < n; i++) {
    const s = (i + 0.5) / n;
    const pa = a.getPointAt(s);
    const pb = b.getPointAt(s);
    pb.x = pa.x;
    const mid = pa.clone().lerp(pb, 0.5);
    const [ca, cb] = pairs[(i * 7) % 4];
    for (const [from, col] of [[pa, ca], [pb, cb]]) {
      const m = new THREE.Mesh(rung, std(col, { roughness: 0.45 }));
      const len = from.distanceTo(mid);
      m.scale.y = len;
      m.position.copy(from).lerp(mid, 0.5);
      m.quaternion.setFromUnitVectors(V(0, 1, 0), mid.clone().sub(from).normalize());
      helix.add(m);
    }
  }
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
  const geo = new THREE.LatheGeometry(pts, 96);
  geo.computeVertexNormals();
  const mat = new THREE.MeshPhysicalMaterial({ color: '#c92a2a', roughness: 0.42, sheen: 0.6, sheenColor: new THREE.Color('#ff8787'), clearcoat: 0.25 });
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
  const body = std('#4a1f12', { roughness: 0.3 });
  const limb = std('#5c2a18', { roughness: 0.4 });
  const ell = (rx, ry, rz, x, y, zz, rot = 0) => {
    const m = mesh(new THREE.SphereGeometry(1, 32, 20), body, x, y, zz);
    m.scale.set(rx, ry, rz);
    m.rotation.z = rot;
    group.add(m);
    return m;
  };
  ell(0.17, 0.12, 0.12, -0.24, 0.03, 0, 0.15); // gaster
  ell(0.035, 0.04, 0.035, -0.06, 0.0, 0); // petiole
  ell(0.13, 0.06, 0.06, 0.08, 0.02, 0, -0.25); // thorax
  ell(0.085, 0.075, 0.07, 0.27, 0.06, 0); // head
  const seg = (a, b, r = 0.0085) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 8), limb);
    m.scale.y = a.distanceTo(b);
    m.position.copy(a).lerp(b, 0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
    return m;
  };
  const legs = [];
  [0.02, 0.09, 0.16].forEach((x, i) => {
    for (const side of [1, -1]) {
      const leg = new THREE.Group();
      leg.position.set(x, -0.01, side * 0.03);
      const knee = V((i - 1) * 0.07, 0.08, side * 0.15);
      const foot = V((i - 1) * 0.16, -0.15, side * 0.25);
      leg.add(seg(V(0, 0, 0), knee), seg(knee, foot, 0.007));
      group.add(leg);
      legs.push({ leg, phase: (i + (side > 0 ? 0 : 1)) % 2 });
    }
  });
  for (const side of [1, -1]) {
    const base = V(0.33, 0.1, side * 0.03);
    const elbow = V(0.38, 0.22, side * 0.08);
    const tip = V(0.5, 0.16, side * 0.14);
    group.add(seg(base, elbow, 0.006), seg(elbow, tip, 0.005));
  }
  group.position.y = 0.02;
  group.rotation.y = -0.35;
  return {
    group,
    tick(t) {
      for (const { leg, phase } of legs) leg.rotation.y = Math.sin(t * 7 + phase * Math.PI) * 0.18;
    },
  };
}

// ── cricket ball ────────────────────────────────────────────────────────────────
function ball() {
  const group = new THREE.Group();
  const leather = new THREE.MeshPhysicalMaterial({ color: '#b3261e', roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.4 });
  const ballMesh = mesh(new THREE.SphereGeometry(0.486, 64, 40), leather);
  group.add(ballMesh);
  const seam = new THREE.Group();
  const thread = std('#f1f3f5', { roughness: 0.7 });
  seam.add(new THREE.Mesh(new THREE.TorusGeometry(0.487, 0.009, 8, 160), std('#8f1d17', { roughness: 0.6 })));
  const stitch = new THREE.BoxGeometry(0.02, 0.006, 0.007);
  for (const lat of [-0.045, 0.045]) {
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const r = 0.487 * Math.cos(lat);
      const m = new THREE.Mesh(stitch, thread);
      m.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.487 * Math.sin(lat));
      m.rotation.z = a + Math.PI / 2 + (lat > 0 ? 0.5 : -0.5);
      seam.add(m);
    }
  }
  seam.rotation.set(0.9, 0.5, 0);
  group.add(seam);
  return { group, tick: (t) => (group.rotation.y = t * 0.35) };
}

// ── student (about 1.5 m) ───────────────────────────────────────────────────────
function student() {
  const group = new THREE.Group();
  const figure = new THREE.Group();
  const skin = std('#b98260', { roughness: 0.6 });
  const shirt = std('#f4f6fa', { roughness: 0.7 });
  const trousers = std('#2b3a55', { roughness: 0.7 });
  const dark = std('#1d1d1f', { roughness: 0.5 });
  const capsule = (r, len, mat, x, y, zz) => mesh(new THREE.CapsuleGeometry(r, len, 8, 16), mat, x, y, zz);
  // metres, feet at y = 0
  for (const s of [1, -1]) {
    figure.add(mesh(new THREE.BoxGeometry(0.085, 0.055, 0.2), dark, s * 0.075, 0.028, 0.03));
    figure.add(capsule(0.058, 0.62, trousers, s * 0.075, 0.42, 0));
  }
  figure.add(capsule(0.12, 0.08, trousers, 0, 0.8, 0)).children;
  const torso = capsule(0.13, 0.26, shirt, 0, 1.0, 0);
  torso.scale.set(1.15, 1, 0.78);
  figure.add(torso);
  figure.add(mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.08, 16), skin, 0, 1.25, 0));
  const head = new THREE.Group();
  head.position.set(0, 1.385, 0);
  head.add(mesh(new THREE.SphereGeometry(0.105, 40, 28), skin));
  const hair = mesh(new THREE.SphereGeometry(0.112, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.52), dark, 0, 0.012, -0.008);
  hair.rotation.x = -0.25;
  head.add(hair);
  for (const s of [1, -1]) head.add(mesh(new THREE.SphereGeometry(0.012, 12, 8), dark, s * 0.036, 0.012, 0.094));
  figure.add(head);
  const arms = [1, -1].map((s) => {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.185, 1.2, 0);
    pivot.add(capsule(0.046, 0.16, shirt, 0, -0.1, 0));
    pivot.add(capsule(0.038, 0.17, skin, 0, -0.31, 0));
    pivot.add(mesh(new THREE.SphereGeometry(0.044, 16, 12), skin, 0, -0.43, 0));
    pivot.rotation.z = s * 0.08;
    figure.add(pivot);
    return pivot;
  });
  figure.scale.setScalar(1 / 0.62); // model units: the framing width (0.62 m) is 1
  figure.position.y = -0.75 / 0.62; // centre the 1.5 m figure (position is in model units, not metres)
  group.add(figure);
  group.rotation.y = -0.25;
  let wave = 0;
  return {
    group,
    tick(t, dt, focus) {
      wave += ((focus ? 1 : 0) - wave) * Math.min(1, dt * 4);
      arms[0].rotation.z = 0.08 + wave * (2.5 + Math.sin(t * 6) * 0.28); // a friendly wave while we look at the student
      figure.position.y = -0.75 / 0.62 + Math.sin(t * 2) * 0.004;
    },
  };
}

// ── quark: no measured size, only an upper limit (smaller than 1 attometre) ────
function quark() {
  const group = new THREE.Group();
  const R = 0.357; // the grey circle is 1 am across; the frame is 1.4 am
  const pts = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    pts.push(V(Math.cos(a) * R, Math.sin(a) * R, 0));
  }
  const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: '#868e96', dashSize: 0.03, gapSize: 0.02 }));
  ring.computeLineDistances();
  group.add(ring);
  const q = new THREE.Group();
  q.add(glow('#ff6b6b', 0.28, 0.55), mesh(new THREE.SphereGeometry(0.04, 24, 16), std('#e03131', { roughness: 0.3, emissive: new THREE.Color('#5c0a0a') })));
  group.add(q);
  // Drawn as a point because no size has ever been measured for it.
  return { group, tick: (t) => q.position.set(Math.sin(t * 1.3) * 0.04, Math.cos(t * 1.7) * 0.03, 0) };
}

// ── mango (about 10 cm) ─────────────────────────────────────────────────────────
function mango() {
  const group = new THREE.Group();
  const geo = new THREE.SphereGeometry(0.5, 72, 48);
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
  const fruit = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.5 }));
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
  const red = std('#c92a2a', { roughness: 0.45 });
  const cream = std('#f3ead2', { roughness: 0.5 });
  const glass = std('#2f3a46', { roughness: 0.15, metalness: 0.2 });
  const tyre = std('#1e1f22', { roughness: 0.8 });
  const hub = std('#adb5bd', { roughness: 0.4, metalness: 0.5 });
  b.add(mesh(new RoundedBoxGeometry(L, 1.25, W, 3, 0.15), red, 0, 1.05, 0));
  b.add(mesh(new RoundedBoxGeometry(L, 1.5, W - 0.02, 3, 0.2), cream, 0, 2.4, 0));
  b.add(mesh(new RoundedBoxGeometry(L - 0.25, 0.14, W - 0.2, 2, 0.05), std('#ced4da', { roughness: 0.6 }), 0, 3.2, 0));
  b.add(mesh(new THREE.BoxGeometry(L + 0.02, 0.12, W + 0.02), std('#2b8a3e', { roughness: 0.5 }), 0, 1.72, 0)); // stripe
  for (let i = 0; i < 8; i++) {
    const x = -L / 2 + 1.3 + i * 1.2;
    for (const side of [1, -1]) b.add(mesh(new THREE.BoxGeometry(1.0, 0.85, 0.04), glass, x, 2.45, side * (W / 2)));
  }
  b.add(mesh(new THREE.BoxGeometry(0.04, 1.1, W - 0.3), glass, L / 2, 2.35, 0)); // windscreen
  b.add(mesh(new THREE.BoxGeometry(0.8, 1.9, 0.04), glass, L / 2 - 1.1, 1.85, W / 2)); // door
  for (const side of [0.8, -0.8]) b.add(mesh(new THREE.BoxGeometry(0.05, 0.18, 0.35), std('#fff4c2', { emissive: new THREE.Color('#5c4a00') }), L / 2 + 0.01, 0.85, side));
  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.32, 28);
  const hubGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.34, 20);
  for (const x of [L / 2 - 2.2, -L / 2 + 2.6]) {
    for (const side of [1, -1]) {
      const w = mesh(wheelGeo, tyre, x, 0.5, side * (W / 2 - 0.12));
      w.rotation.x = Math.PI / 2;
      const h = mesh(hubGeo, hub, x, 0.5, side * (W / 2 - 0.1));
      h.rotation.x = Math.PI / 2;
      b.add(w, h);
    }
  }
  b.scale.setScalar(1 / 13); // model units: the framing width (13 m) is 1
  b.position.y = -1.65 / 13; // centre the 3.3 m tall bus (position is in model units, not metres)
  group.add(b);
  group.rotation.y = -0.45;
  return { group };
}

// ── football field (about 105 m × 68 m), as a small map block ───────────────────
function fieldTexture() {
  const PX = 10; // pixels per metre
  const LEN = 115;
  const WID = 78;
  const c = document.createElement('canvas');
  c.width = LEN * PX;
  c.height = WID * PX;
  const g = c.getContext('2d');
  for (let i = 0; i * 7.5 < LEN; i++) {
    g.fillStyle = i % 2 ? '#6cbf5f' : '#62b356';
    g.fillRect(i * 7.5 * PX, 0, 7.5 * PX + 1, WID * PX);
  }
  const ox = 5 * PX;
  const oy = 5 * PX;
  const m = (v) => v * PX;
  g.strokeStyle = '#ffffff';
  g.lineWidth = 2.2;
  g.strokeRect(ox, oy, m(105), m(68));
  g.beginPath();
  g.moveTo(ox + m(52.5), oy);
  g.lineTo(ox + m(52.5), oy + m(68));
  g.stroke();
  g.beginPath();
  g.arc(ox + m(52.5), oy + m(34), m(9.15), 0, Math.PI * 2);
  g.stroke();
  for (const end of [0, 1]) {
    const x0 = end ? ox + m(105) : ox;
    const dir = end ? -1 : 1;
    g.strokeRect(Math.min(x0, x0 + dir * m(16.5)), oy + m(34 - 20.16), m(16.5), m(40.32));
    g.strokeRect(Math.min(x0, x0 + dir * m(5.5)), oy + m(34 - 9.16), m(5.5), m(18.32));
    g.beginPath();
    g.arc(x0 + dir * m(11), oy + m(34), m(9.15), end ? Math.PI - 0.93 : -0.93, end ? Math.PI + 0.93 : 0.93);
    g.stroke();
  }
  g.fillStyle = '#ffffff';
  for (const x of [11, 52.5, 94]) {
    g.beginPath();
    g.arc(ox + m(x), oy + m(34), 3, 0, Math.PI * 2);
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
  const top = mesh(new THREE.PlaneGeometry(115 * u, 78 * u), new THREE.MeshStandardMaterial({ map: fieldTexture(), roughness: 0.85 }), 0, 0.01 * u, 0);
  top.rotation.x = -Math.PI / 2;
  group.add(top);
  const white = std('#ffffff', { roughness: 0.5 });
  const post = new THREE.BoxGeometry(0.25 * u, 2.44 * u, 0.25 * u);
  const bar = new THREE.BoxGeometry(0.25 * u, 0.25 * u, 7.32 * u);
  for (const end of [-1, 1]) {
    const x = end * 52.5 * u;
    for (const zz of [-3.66, 3.66]) group.add(mesh(post, white, x, 1.22 * u, zz * u));
    group.add(mesh(bar, white, x, 2.44 * u, 0));
  }
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
  const earth = std('#c8a97e', { roughness: 0.9 });
  const block = mesh(new THREE.BoxGeometry(W, T, D), earth, 0, -T / 2, 0);
  group.add(block);
  const bank = std('#a9d18e', { roughness: 0.9 });
  const bankW = (W - riverW) / 2;
  for (const s of [1, -1]) group.add(mesh(new THREE.BoxGeometry(bankW, 0.002, D), bank, s * (riverW / 2 + bankW / 2), 0.001, 0));
  group.add(mesh(new THREE.BoxGeometry(riverW, 0.001, D), std('#8ec5f5', { roughness: 0.35 }), 0, 0.0005, 0));
  // sand bars, as on the real river
  for (const [x, zz, sx, sz] of [[-0.12, -0.16, 0.16, 0.05], [0.18, 0.15, 0.12, 0.04]]) {
    const bar = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.0012, 40), std('#e9dcc0', { roughness: 0.95 }), x, 0.0011, zz);
    bar.scale.set(sx, 1, sz);
    group.add(bar);
  }
  const len = 6.15 / 8;
  const deckY = 0.016; // height exaggerated so it can be seen
  const steel = std('#7d8792', { roughness: 0.45, metalness: 0.3 });
  group.add(mesh(new THREE.BoxGeometry(len, 0.0035, 0.007), steel, 0, deckY, 0));
  const pierGeo = new THREE.CylinderGeometry(0.0018, 0.0022, deckY, 8);
  const concrete = std('#9aa3ab', { roughness: 0.8 });
  for (let i = 0; i <= 41; i++) group.add(mesh(pierGeo, concrete, -len / 2 + (i / 41) * len, deckY / 2, 0));
  // truss on top: a zigzag of thin bars
  const tpts = [];
  for (let i = 0; i <= 82; i++) {
    const x = -len / 2 + (i / 82) * len;
    tpts.push(x, deckY + (i % 2 ? 0.006 : 0.0018), 0);
  }
  const truss = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(tpts, 3)), new THREE.LineBasicMaterial({ color: '#59636e' }));
  group.add(truss);
  const road = std('#868e96', { roughness: 0.8 });
  for (const s of [1, -1]) group.add(mesh(new THREE.BoxGeometry(bankW + (riverW - len) / 2, 0.003, 0.006), road, s * (W / 2 - (bankW + (riverW - len) / 2) / 2), 0.0035, 0));
  return { group };
}

// ── Earth, with real country outlines and Bangladesh marked ─────────────────────
function earthTexture() {
  const W = 2048;
  const H = 1024;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#7cc0ef';
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
  g.lineWidth = 1.2;
  g.strokeStyle = 'rgba(70, 110, 60, 0.35)';
  for (const ring of LAND) {
    path(ring);
    g.stroke();
  }
  for (const ring of BANGLADESH) {
    path(ring);
    g.fillStyle = '#2b8a3e';
    g.fill();
    g.lineWidth = 1.5;
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
  const sphere = mesh(new THREE.SphereGeometry(r, 96, 64), new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.75 }));
  globe.add(sphere);
  group.add(globe);
  group.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(r * 1.03, 64, 32),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        vertexShader: `varying vec3 vN; varying vec3 vV;
          void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `varying vec3 vN; varying vec3 vV;
          void main(){ float f = 1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0); gl_FragColor = vec4(0.45, 0.68, 0.98, 0.55 * pow(f, 2.5)); }`,
      }),
    ),
  );
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
    new THREE.SphereGeometry(0.435, 96, 64),
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
  const colors = ['#868e96', '#e8a33d', '#1c6fd9', '#d9480f', '#c8915a', '#d4b46a', '#4fb3bf', '#3b5bdb'];
  const grey = new THREE.MeshBasicMaterial({ color: '#b8c0c8' });
  const blue = new THREE.MeshBasicMaterial({ color: '#1c6fd9' });
  AU.forEach((a, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(a * scale, i === 2 ? 0.0016 : 0.0009, 6, 256), i === 2 ? blue : grey);
    ring.rotation.x = Math.PI / 2;
    plane.add(ring);
  });
  plane.add(glow('#ffa94d', 0.05, 0.9), mesh(new THREE.SphereGeometry(0.006, 16, 12), new THREE.MeshBasicMaterial({ color: '#fab005' })));
  const pos = new Float32Array(AU.length * 3);
  const col = [];
  colors.forEach((c) => col.push(...new THREE.Color(c).toArray()));
  const planets = points(Array.from(pos), col, 7);
  plane.add(planets);
  const phase = AU.map((_, i) => i * 1.7);
  return {
    group,
    tick(t) {
      const p = planets.geometry.getAttribute('position');
      AU.forEach((a, i) => {
        const ang = phase[i] + t * 0.9 * a ** -1.5;
        p.setXYZ(i, Math.cos(ang) * a * scale, 0, Math.sin(ang) * a * scale);
      });
      p.needsUpdate = true;
    },
  };
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
  proxima.add(glow('#f03e3e', 0.06, 0.75), mesh(new THREE.SphereGeometry(0.0075, 16, 12), new THREE.MeshBasicMaterial({ color: '#e03131' })));
  group.add(sunDot, proxima);
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([V(-d + 0.02, 0, 0), V(d - 0.02, 0, 0)]),
    new THREE.LineDashedMaterial({ color: '#868e96', dashSize: 0.018, gapSize: 0.012 }),
  );
  line.computeLineDistances();
  group.add(line);
  const pos = [];
  const col = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
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
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
  const R = 0.463;
  const arm = (r, k) => k * (Math.PI / 2) + Math.log(r / 0.02) / 0.3;
  const c = (hex) => new THREE.Color(hex).toArray();
  const palette = { blue: c('#4c6ef5'), blue2: c('#748ffc'), violet: c('#7950f2'), pink: c('#e64980'), warm: c('#f08c00'), cream: c('#e8a33d') };
  for (let i = 0; i < 14000; i++) {
    const r = 0.03 + (R - 0.03) * Math.pow(rnd(), 0.75);
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
  disc.add(points(pos, col, 3));
  const core = glow('#ffa94d', 0.32, 0.6);
  disc.add(core);
  return {
    group,
    tick: (t) => (disc.rotation.y = t * 0.03),
    // Seen from inside (zooming out towards it), it is a field of stars; the core's glow fades in at the end.
    maxK: 30,
    onView: (k) => (core.material.opacity = Math.min(1, Math.max(0, (6 - k) / 4))),
  };
}

const BUILDERS = { quark, nucleus, atom, dna, rbc, ant, ball, mango, student, bus, field, bridge, earth, sun, solar, star, galaxy };

export function buildObject(id) {
  return BUILDERS[id]();
}
