// The school field (মাঠ) seen from above: mown grass, the white line along the far side, trees and the school with
// the national flag beyond it, a chalk compass where you start, the ring of every place 30 m away (dashes and question
// marks), a 10 m scale bar, flags and chalk lines for the test. Distances are to scale; the children, trees
// and the school are drawn bigger than real so that they can be seen on a phone (the figure says so).
// Scene units: metres. Map x = পূর্ব (east), map y = উত্তর (north) → scene (x, 0, -y); y is up.
import * as THREE from 'three';
import { textMesh } from '@shared/student/materials.js';
import { RING, RING_MARKS } from './reading.js';

/** The scene point of a map point (x east, y north), h metres up. */
export const P = (x, y, h = 0, out = new THREE.Vector3()) => out.set(x, h, -y);

export const COLORS = {
  magnitude: '#1c7ed6', // মান: the ring, the 30 m line
  direction: '#e8590c', // দিক: the compass point, the angle between two arrows
  vector: '#5f3dc4', // a ভেক্টর (মান and দিক): the arrows
  equal: '#2b8a3e', // the same vector
  chalk: '#ffffff',
  flag: '#f03e3e',
};

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** A small seeded random generator, so the field looks the same every time. */
function rand(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/** Mown grass: bands 8 m wide running পূর্ব–পশ্চিম, two shades, a fine speckle. */
function grassTexture() {
  const c = canvas(256, 256);
  const ctx = c.getContext('2d');
  const r = rand(11);
  for (let band = 0; band < 2; band++) {
    ctx.fillStyle = band ? '#5c9a43' : '#68a74c';
    ctx.fillRect(0, band * 128, 256, 128);
  }
  for (let i = 0; i < 2600; i++) {
    const g = 120 + Math.floor(r() * 70);
    ctx.fillStyle = `rgba(${40 + Math.floor(r() * 30)}, ${g}, ${30 + Math.floor(r() * 25)}, 0.35)`;
    ctx.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1 + r() * 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

/** A canvas with the school's wall: cream plaster, rows of green-framed windows, a darker plinth. */
function wallTexture() {
  const c = canvas(512, 128);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#efe2c4';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#c9b48a';
  ctx.fillRect(0, 116, 512, 12);
  ctx.fillRect(0, 60, 512, 5);
  for (let row = 0; row < 2; row++)
    for (let i = 0; i < 12; i++) {
      const x = 10 + i * 42;
      const y = 14 + row * 56;
      ctx.fillStyle = '#2f6b45';
      ctx.fillRect(x, y, 26, 34);
      ctx.fillStyle = '#3d4c5c';
      ctx.fillRect(x + 3, y + 3, 20, 28);
    }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** The field and what lies round it (nothing here changes). */
export function createField() {
  const root = new THREE.Group();
  root.name = 'SchoolField';
  const grass = grassTexture();
  const SIZE = 420;
  grass.repeat.set(SIZE / 16, SIZE / 16);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(SIZE, SIZE).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'Grass', map: grass, roughness: 0.95, metalness: 0 }),
  );
  ground.name = 'Grass';
  ground.position.set(0, 0, -20);
  root.add(ground);

  const chalk = new THREE.MeshStandardMaterial({ name: 'Chalk', color: '#f4f7f2', roughness: 0.9, metalness: 0 });
  // the field's white line, a little inside the trees on the far side and well outside what is used
  const line = (x0, y0, x1, y1) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.6), chalk);
    m.position.copy(P((x0 + x1) / 2, (y0 + y1) / 2, 0.04));
    m.rotation.y = Math.atan2(y1 - y0, x1 - x0);
    root.add(m);
  };
  line(-62, 44, 62, 44);
  line(-62, -48, 62, -48);
  line(-62, -48, -62, 44);
  line(62, -48, 62, 44);

  // trees along the far side (round crowns, drawn big like the children)
  const r = rand(5);
  const spots = [];
  for (let x = -110; x <= 110; x += 15 + r() * 6) spots.push([x + r() * 4, 50 + r() * 5, 0.85 + r() * 0.35]);
  const trunkGeo = new THREE.CylinderGeometry(0.9, 1.2, 8, 8).translate(0, 4, 0);
  const crownGeo = new THREE.IcosahedronGeometry(6.5, 1);
  const trunks = new THREE.InstancedMesh(trunkGeo, new THREE.MeshStandardMaterial({ name: 'Bark', color: '#6b4a2e', roughness: 0.9 }), spots.length);
  const crowns = new THREE.InstancedMesh(
    crownGeo,
    new THREE.MeshStandardMaterial({ name: 'Leaves', color: '#ffffff', roughness: 0.85, flatShading: true }),
    spots.length,
  );
  trunks.name = 'TreeTrunks';
  crowns.name = 'TreeCrowns';
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const col = new THREE.Color();
  spots.forEach(([x, y, s], i) => {
    sc.setScalar(s);
    m4.compose(P(x, y), q, sc);
    trunks.setMatrixAt(i, m4);
    m4.compose(P(x, y, 12 * s), q.setFromAxisAngle(sc.set(0, 1, 0), r() * 3), sc.setScalar(s));
    crowns.setMatrixAt(i, m4);
    crowns.setColorAt(i, col.set('#3f7d34').offsetHSL((r() - 0.5) * 0.04, 0, (r() - 0.5) * 0.08));
    q.identity();
  });
  root.add(trunks, crowns);

  // the school (দুই তলা): a long cream block with green windows and a flat roof, beyond the trees
  const wallTex = wallTexture();
  const wallMat = new THREE.MeshStandardMaterial({ name: 'SchoolWall', map: wallTex, roughness: 0.85 });
  const plain = new THREE.MeshStandardMaterial({ name: 'SchoolPlaster', color: '#e6d6b2', roughness: 0.85 });
  const school = new THREE.Mesh(new THREE.BoxGeometry(84, 16, 12), [plain, plain, plain, plain, wallMat, plain]);
  school.name = 'School';
  school.position.copy(P(0, 66, 8));
  const roof = new THREE.Mesh(new THREE.BoxGeometry(86, 1.2, 14), new THREE.MeshStandardMaterial({ name: 'Roof', color: '#b0623b', roughness: 0.8 }));
  roof.position.copy(P(0, 66, 16.6));
  root.add(school, roof);

  // the national flag on its pole by the field
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.45, 26, 10).translate(0, 13, 0),
    new THREE.MeshStandardMaterial({ name: 'Pole', color: '#d9dde2', roughness: 0.4, metalness: 0.3 }),
  );
  pole.position.copy(P(36, 47));
  const flagC = canvas(200, 120);
  const fx = flagC.getContext('2d');
  fx.fillStyle = '#006a4e';
  fx.fillRect(0, 0, 200, 120);
  fx.fillStyle = '#f42a41';
  fx.beginPath();
  fx.arc(90, 60, 40, 0, Math.PI * 2);
  fx.fill();
  const flagTex = new THREE.CanvasTexture(flagC);
  flagTex.colorSpace = THREE.SRGBColorSpace;
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 6).translate(5, 0, 0),
    new THREE.MeshStandardMaterial({ name: 'Flag', map: flagTex, roughness: 0.8, side: THREE.DoubleSide }),
  );
  flag.position.copy(P(36, 47, 22.5));
  flag.rotation.y = -0.25;
  root.add(pole, flag);

  return { root, ground };
}

// ── the chalk compass where you start ───────────────────────────────────────────

/** A flat spike (kite) from the centre outward, along map angle `angle`, `len` long and `w` wide. */
function spikeGeometry(len, w) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(len * 0.22, w / 2);
  s.lineTo(len, 0);
  s.lineTo(len * 0.22, -w / 2);
  s.closePath();
  return new THREE.ShapeGeometry(s).rotateX(-Math.PI / 2); // shape +x → scene +x, shape +y → scene -z (north)
}

/**
 * The compass drawn in chalk round the start: four long points (উ, পূ, দ, প, the letters lying on the grass) and four
 * short ones between them. highlight(angle) colours one point orange (দিক), null clears it.
 */
export function createRose({ t, at = [0, 0] }) {
  const root = new THREE.Group();
  root.name = 'Compass';
  root.position.copy(P(at[0], at[1]));
  const chalk = new THREE.MeshBasicMaterial({
    name: 'CompassChalk',
    color: '#f7faf5',
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    toneMapped: false,
  });
  const spikes = [];
  for (let i = 0; i < 8; i++) {
    const long = i % 2 === 0;
    const m = new THREE.Mesh(spikeGeometry(long ? 9.2 : 5.6, long ? 2.4 : 1.7), chalk);
    m.rotation.y = (i * Math.PI) / 4;
    m.position.y = 0.05;
    m.renderOrder = 1;
    root.add(m);
    spikes.push(m);
  }
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.1, 40).rotateX(-Math.PI / 2), chalk);
  ring.position.y = 0.05;
  root.add(ring);
  const letters = [
    ['rose_n', 0, 14.2],
    ['rose_e', 13.6, 0],
    ['rose_s', 0, -12.6],
    ['rose_w', -13.6, 0],
  ];
  for (const [key, x, y] of letters) {
    const txt = textMesh(t(key), 4, { color: '#ffffff', weight: 700 });
    txt.rotation.x = -Math.PI / 2;
    txt.position.copy(P(x, y, 0.08));
    txt.name = `Compass ${key}`;
    root.add(txt);
  }
  const hi = new THREE.Mesh(
    spikeGeometry(9.9, 3),
    new THREE.MeshBasicMaterial({ name: 'CompassPoint', color: COLORS.direction, toneMapped: false, transparent: true, depthWrite: false }),
  );
  hi.position.y = 0.09;
  hi.renderOrder = 2;
  hi.visible = false;
  root.add(hi);
  return {
    root,
    /** Colour the point towards `angle` (map degrees) orange, or none. */
    highlight(angle, opacity = 1) {
      hi.visible = angle != null && opacity > 0.01;
      if (angle == null) return;
      hi.rotation.y = (angle * Math.PI) / 180;
      hi.material.opacity = opacity;
    },
  };
}

// ── the ring of every place 30 m away ───────────────────────────────────────────

/** A "?" in a blue disc, drawn once. */
let markTex = null;
function questionTexture() {
  if (markTex) return markTex;
  const c = canvas(128, 128);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.magnitude;
  ctx.beginPath();
  ctx.arc(64, 64, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 84px "Noto Sans Bengali", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 64, 70);
  markTex = new THREE.CanvasTexture(c);
  markTex.colorSpace = THREE.SRGBColorSpace;
  return markTex;
}

/**
 * The ring: dashes on the grass at RING metres from the centre, drawn round from `from` degrees (setDrawn), question
 * marks standing on it (setMarks), and the measuring line from the centre with the distance (setLine).
 */
export function createRing({ at = [0, 0], radius = RING, from = 210, dashes = 60 } = {}) {
  const root = new THREE.Group();
  root.name = 'Ring';
  root.position.copy(P(at[0], at[1]));
  const dashMat = new THREE.MeshBasicMaterial({ name: 'RingDash', color: COLORS.magnitude, transparent: true, depthWrite: false, toneMapped: false });
  const len = ((2 * Math.PI * radius) / dashes) * 0.58;
  const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(len, 0.12, 0.85), dashMat, dashes);
  dash.name = 'RingDashes';
  dash.renderOrder = 1;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  const yAxis = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < dashes; i++) {
    const a = ((from + (i * 360) / dashes) * Math.PI) / 180;
    q.setFromAxisAngle(yAxis, a + Math.PI / 2);
    m4.compose(P(radius * Math.cos(a), radius * Math.sin(a), 0.08), q, one);
    dash.setMatrixAt(i, m4);
  }
  dash.count = 0;
  root.add(dash);

  // the question marks: sprites (they face the camera; not exported)
  const marks = RING_MARKS.map((deg) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: questionTexture(), transparent: true, depthWrite: false, toneMapped: false }));
    const a = (deg * Math.PI) / 180;
    s.position.copy(P(radius * Math.cos(a), radius * Math.sin(a), 4));
    s.scale.setScalar(0.001);
    s.visible = false;
    s.renderOrder = 3;
    root.add(s);
    return s;
  });

  // the measuring line: from the centre to the ring, towards `from`
  const lineMat = new THREE.MeshStandardMaterial({
    name: 'RingLine',
    color: COLORS.magnitude,
    roughness: 0.6,
    emissive: COLORS.magnitude,
    emissiveIntensity: 0.25,
    transparent: true,
  });
  const lineMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1, 10).rotateZ(Math.PI / 2).translate(0.5, 0, 0), lineMat);
  lineMesh.name = 'RingLine';
  lineMesh.position.y = 0.45;
  lineMesh.visible = false;
  root.add(lineMesh);
  const lineDir = new THREE.Vector3();
  const linePoint = new THREE.Vector3();

  const state = { drawn: 0, marks: 0, markOpacity: 1, opacity: 1 };
  function apply() {
    dash.count = Math.round(state.drawn * dashes);
    dashMat.opacity = state.opacity;
    dash.visible = dash.count > 0 && state.opacity > 0.01;
    marks.forEach((s, i) => {
      const k = Math.min(1, Math.max(0, state.marks * marks.length - i));
      const pop = k < 1 ? k * (1.25 - 0.25 * k) : 1; // a small overshoot as each one appears
      s.visible = k > 0.001 && state.markOpacity > 0.01;
      s.scale.setScalar(6.4 * Math.max(0.001, pop));
      s.material.opacity = state.markOpacity;
    });
  }
  return {
    root,
    dash,
    radius,
    /** 0…1 of the ring drawn (from `from` degrees, counterclockwise). */
    setDrawn(f) {
      state.drawn = Math.min(1, Math.max(0, f));
      apply();
    },
    /** 0…1 of the question marks shown (one after another), and their opacity. */
    setMarks(f, opacity = 1) {
      state.marks = Math.min(1, Math.max(0, f));
      state.markOpacity = opacity;
      apply();
    },
    /** The dashes' opacity. */
    setOpacity(a) {
      state.opacity = a;
      apply();
    },
    /** The measuring line from the centre at map angle `deg`, `f` (0…1) of the radius long; 0 hides it. */
    setLine(deg, f, opacity = 1) {
      lineMesh.visible = f > 0.001 && opacity > 0.01;
      if (!lineMesh.visible) return;
      const a = (deg * Math.PI) / 180;
      lineMesh.rotation.y = a;
      lineMesh.scale.set(radius * f, 1, 1);
      lineMat.opacity = opacity;
      lineDir.set(Math.cos(a), 0, -Math.sin(a));
    },
    /** The middle of the measuring line (world), for its label. */
    lineMiddle() {
      linePoint
        .copy(lineDir)
        .multiplyScalar(lineMesh.scale.x / 2)
        .add(root.position);
      linePoint.y = 0.6;
      return linePoint;
    },
    get line() {
      return lineMesh.visible;
    },
  };
}

// ── small things for the test ───────────────────────────────────────────────────

/** A small flag on a pole (drawn big, like the children), standing at a place on the field for the test. */
export function createFlag(name = 'Flag') {
  const g = new THREE.Group();
  g.name = name;
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.32, 7, 10).translate(0, 3.5, 0),
    new THREE.MeshStandardMaterial({ name: `${name}Pole`, color: '#f1f3f5', roughness: 0.5 }),
  );
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(3.8, -1.25);
  s.lineTo(0, -2.5);
  s.closePath();
  const cloth = new THREE.Mesh(
    new THREE.ShapeGeometry(s).translate(0.25, 7, 0),
    new THREE.MeshStandardMaterial({ name: `${name}Cloth`, color: COLORS.flag, roughness: 0.7, side: THREE.DoubleSide }),
  );
  const foot = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.3, 0.3, 16).translate(0, 0.15, 0),
    new THREE.MeshStandardMaterial({ name: `${name}Foot`, color: '#495057', roughness: 0.7 }),
  );
  g.add(pole, cloth, foot);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(6, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 4;
  hit.userData.noExport = true;
  g.add(hit);
  return { root: g, top: new THREE.Vector3(0, 7.4, 0), hit };
}

/** A dashed chalk line on the grass from a to b (map points). */
export function createChalkLine(name = 'ChalkLine', color = '#ffffff') {
  const mat = new THREE.MeshBasicMaterial({ name, color, transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false });
  const max = 40;
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 0.1, 0.45), mat, max);
  mesh.name = name;
  mesh.renderOrder = 1;
  mesh.count = 0;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  const yAxis = new THREE.Vector3(0, 1, 0);
  const p = new THREE.Vector3();
  return {
    mesh,
    set(a, b) {
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = Math.hypot(dx, dy);
      const n = Math.min(max, Math.max(1, Math.floor(len / 2.4)));
      q.setFromAxisAngle(yAxis, Math.atan2(dy, dx));
      for (let i = 0; i < n; i++) {
        const f = (i + 0.5) / n;
        m4.compose(P(a[0] + dx * f, a[1] + dy * f, 0.07, p), q, one);
        mesh.setMatrixAt(i, m4);
      }
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.visible = true;
    },
    clear() {
      mesh.count = 0;
      mesh.visible = false;
    },
  };
}

/** The 10 m scale bar lying on the grass (its words are a label on the view). */
export function createScaleBar(at = [17, -27.5], length = 10) {
  const g = new THREE.Group();
  g.name = 'ScaleBar';
  const mat = new THREE.MeshBasicMaterial({ name: 'ScaleBar', color: '#ffffff', toneMapped: false });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(length, 0.12, 0.7), mat);
  bar.position.copy(P(at[0] + length / 2, at[1], 0.08));
  g.add(bar);
  for (const x of [0, length]) {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 2.6), mat);
    tick.position.copy(P(at[0] + x, at[1], 0.08));
    g.add(tick);
  }
  return { root: g, middle: P(at[0] + length / 2, at[1] + 1.2, 0.1) };
}
