// The 3D pieces of the strong nuclear force figure (procedural three.js; 1 unit = 1 fm of the real nucleus,
// exported as 1 cm): protons and neutrons as glossy balls (a proton carries a "+"), force arrows, the
// distance scale under the pulled proton, and the calm burst of energy of a split or a join.
import * as THREE from 'three';
import { MAX_PULL, R_NUCLEON } from './reading.js';

/** One colour per meaning (the four forces as in the other fundamental-force figures). */
export const COLORS = {
  proton: '#d23a50',
  neutron: '#9aa3ad',
  strong: '#e8590c', // সবল নিউক্লীয় বল
  electric: '#1c7ed6', // তড়িৎ চৌম্বক বল
  energy: '#f59f00', // শক্তি
  ink: '#46505c',
  energyInk: '#b86200', // the word শক্তি (darker, to read on white)
  strongInk: '#c4470a', // words in the strong force's colour
};

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** The proton's skin: red, with a white "+" where the ball faces the viewer (u = 0.25 of a SphereGeometry). */
function plusTexture() {
  const W = 512;
  const H = 256;
  const c = canvas(W, H);
  const ctx = c.getContext('2d');
  ctx.fillStyle = COLORS.proton;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ffffff';
  const cx = W * 0.25;
  const cy = H / 2;
  const len = 62; // ≈ 44° of the ball
  const th = 15;
  const bar = (x, y, w, h) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, th / 2);
    ctx.fill();
  };
  bar(cx - len / 2, cy - th / 2, len, th);
  bar(cx - th / 2, cy - len / 2, th, len);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function createNucleonMaterials() {
  const proton = new THREE.MeshPhysicalMaterial({
    name: 'Proton',
    map: plusTexture(),
    roughness: 0.36,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.22,
  });
  const neutron = new THREE.MeshPhysicalMaterial({
    name: 'Neutron',
    color: COLORS.neutron,
    roughness: 0.4,
    metalness: 0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.25,
  });
  return { proton, neutron, geometry: new THREE.SphereGeometry(R_NUCLEON, 22, 16) };
}

/**
 * A nucleus (or several): balls at given places, protons and neutrons drawn as two instanced meshes. Every ball
 * turns to face the viewer, so each proton shows its "+".
 *   isProton: [bool, …]   returns { root, count, place(i, [x, y, z], scale), face(quaternion), commit() }
 */
export function createNucleons(name, isProton, M) {
  const root = new THREE.Group();
  root.name = name;
  const nP = isProton.filter(Boolean).length;
  const protons = new THREE.InstancedMesh(M.geometry, M.proton, Math.max(1, nP));
  const neutrons = new THREE.InstancedMesh(M.geometry, M.neutron, Math.max(1, isProton.length - nP));
  protons.name = `${name}Protons`;
  neutrons.name = `${name}Neutrons`;
  protons.count = nP;
  neutrons.count = isProton.length - nP;
  root.add(protons, neutrons);
  const slot = [];
  let p = 0;
  let n = 0;
  for (const yes of isProton) slot.push(yes ? { mesh: protons, i: p++ } : { mesh: neutrons, i: n++ });
  const pos = isProton.map(() => new THREE.Vector3());
  const scale = isProton.map(() => 1);
  const q = new THREE.Quaternion();
  const m = new THREE.Matrix4();
  const s = new THREE.Vector3();
  let dirty = true;
  function write(i) {
    s.setScalar(Math.max(1e-4, scale[i]));
    m.compose(pos[i], q, s);
    slot[i].mesh.setMatrixAt(slot[i].i, m);
  }
  return {
    root,
    protons,
    neutrons,
    count: isProton.length,
    position: (i) => pos[i],
    place(i, p3, k = 1) {
      if (Array.isArray(p3)) pos[i].set(p3[0], p3[1], p3[2]);
      else pos[i].copy(p3);
      scale[i] = k;
      dirty = true;
    },
    /** Turn every ball to the viewer (camera quaternion in this group's space). */
    face(quaternion) {
      if (q.equals(quaternion) && !dirty) return false;
      q.copy(quaternion);
      dirty = true;
      return true;
    },
    commit() {
      if (!dirty) return;
      for (let i = 0; i < pos.length; i++) write(i);
      protons.instanceMatrix.needsUpdate = true;
      neutrons.instanceMatrix.needsUpdate = true;
      protons.computeBoundingSphere();
      neutrons.computeBoundingSphere();
      dirty = false;
    },
  };
}

// ── force arrows ─────────────────────────────────────────────────────────────────────────────────────────────
const Y = new THREE.Vector3(0, 1, 0);
const HEAD = 0.5;
/** A flat-coloured arrow drawn over the scene (with a thin white edge so it reads over the balls). */
export function createArrow(name, color) {
  const root = new THREE.Group();
  root.name = name;
  root.userData.noExport = true;
  const mk = (c, order, grow) => {
    const mat = new THREE.MeshBasicMaterial({ color: c, toneMapped: false, depthTest: false, depthWrite: false, transparent: true });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.075 + grow, 0.075 + grow, 1, 12).translate(0, 0.5, 0), mat);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.22 + grow * 1.6, HEAD + grow * 2, 20).translate(0, (HEAD + grow * 2) / 2, 0), mat);
    shaft.renderOrder = head.renderOrder = order;
    root.add(shaft, head);
    return { shaft, head, mat, grow };
  };
  const parts = [mk('#ffffff', 20, 0.045), mk(color, 21, 0)];
  const tip = new THREE.Vector3();
  const mid = new THREE.Vector3();
  const tail = new THREE.Vector3();
  let length = 0;
  return {
    root,
    tip,
    mid,
    tail,
    get length() {
      return length;
    },
    /** From a point, in a direction (unit), this long (fm); 0 hides it. */
    set(from, dir, len) {
      length = len;
      root.visible = len > 0.05;
      if (!root.visible) return;
      root.position.copy(from);
      root.quaternion.setFromUnitVectors(Y, dir);
      const head = Math.min(HEAD, len * 0.6);
      const k = head / HEAD;
      for (const p of parts) {
        p.shaft.scale.set(1, Math.max(0.001, len - head), 1);
        p.head.scale.set(k, k, k);
        p.head.position.y = len - head - p.grow * 1.2;
        p.shaft.position.y = 0;
      }
      tail.copy(from);
      tip.copy(from).addScaledVector(dir, len);
      mid.copy(from).addScaledVector(dir, len / 2);
    },
    setOpacity(a) {
      for (const p of parts) p.mat.opacity = a;
    },
  };
}

// ── the distance scale: a rail from the nucleus's surface out along the pull ─────────────────────────────────
/**
 * A thin scale from the nucleus's surface (its origin, the 0 mark) outward, with ticks every 0.5 fm and a small
 * marker at the proton's near edge. Its numbers and unit are labels on the page (always readable), not 3D text.
 */
export function createRail() {
  const root = new THREE.Group();
  root.name = 'DistanceScale';
  root.userData.noExport = true;
  const ink = new THREE.MeshBasicMaterial({ color: COLORS.ink, toneMapped: false });
  const L = MAX_PULL + 0.12;
  const line = new THREE.Mesh(new THREE.BoxGeometry(L, 0.045, 0.02), ink);
  line.position.x = L / 2;
  root.add(line);
  for (let k = 0; k <= Math.round(MAX_PULL * 2); k++) {
    const major = k % 2 === 0;
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.04, major ? 0.3 : 0.18, 0.02), ink);
    tick.position.set(k / 2, major ? -0.13 : -0.07, 0);
    root.add(tick);
  }
  // the reading: a small dark triangle at the proton's near edge, drawn over everything
  const marker = new THREE.Mesh(
    new THREE.ConeGeometry(0.13, 0.22, 3),
    new THREE.MeshBasicMaterial({ color: '#1d2733', toneMapped: false, depthTest: false, transparent: true }),
  );
  marker.renderOrder = 15;
  marker.position.y = 0.13;
  root.add(marker);
  return {
    root,
    length: L,
    setMarker(d) {
      marker.visible = d >= -0.01 && d <= L + 0.01;
      marker.position.x = Math.max(0, d);
    },
  };
}

// ── the reach of the strong force: a soft orange shell and a dashed line about 1 fm outside the nucleus ──────────
function haloTexture(inner) {
  const S = 512;
  const c = canvas(S, S);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  // transparent inside the nucleus, pale orange from its surface, fading out past the dashed line
  g.addColorStop(0, 'rgba(232, 89, 12, 0)');
  g.addColorStop(Math.max(0, inner - 0.02), 'rgba(232, 89, 12, 0)');
  g.addColorStop(inner, 'rgba(232, 89, 12, 0.2)');
  g.addColorStop(0.86, 'rgba(232, 89, 12, 0.13)');
  g.addColorStop(1, 'rgba(232, 89, 12, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The reach round a nucleus of radius `r` (fm): a dashed circle at r + `reach`, and a soft shell; faces the viewer. */
export function createReach(r, reach) {
  const root = new THREE.Group();
  root.name = 'StrongReach';
  root.userData.noExport = true;
  const R = r + reach;
  const outer = R + 0.2 * reach; // the shell fades out a little past the line: "about" 10⁻¹⁵ m
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(outer * 2, outer * 2),
    new THREE.MeshBasicMaterial({ map: haloTexture(r / outer), transparent: true, depthWrite: false, toneMapped: false }),
  );
  halo.renderOrder = -1;
  // the dashed edge: short arcs of a thin ring through the nucleus's middle, facing the viewer; the pulled proton
  // hides the part behind it, nothing else covers it (no ball reaches past the nucleus's edge)
  const dashMat = new THREE.MeshBasicMaterial({ color: COLORS.strong, toneMapped: false, side: THREE.DoubleSide });
  const DASHES = 84;
  const w = 0.03;
  const dash = new THREE.Group();
  for (let i = 0; i < DASHES; i++) {
    const seg = new THREE.Mesh(new THREE.RingGeometry(R - w, R + w, 4, 1, (i / DASHES) * Math.PI * 2, (Math.PI * 2 * 0.58) / DASHES), dashMat);
    dash.add(seg);
  }
  root.add(halo, dash);
  return {
    root,
    radius: R,
    /** A point on the dashed line at this angle (degrees, in the picture's plane), in world space. */
    pointAt(deg, out = new THREE.Vector3()) {
      const a = THREE.MathUtils.degToRad(deg);
      out
        .set(R * Math.cos(a), R * Math.sin(a), 0)
        .applyQuaternion(root.quaternion)
        .add(root.position);
      return out;
    },
    face(q) {
      root.quaternion.copy(q);
    },
  };
}

// ── energy: a calm burst of wavy rays and a soft glow ────────────────────────────────────────────────────────
function glowTexture() {
  const S = 256;
  const c = canvas(S, S);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255, 236, 153, 1)');
  g.addColorStop(0.3, 'rgba(255, 204, 51, 0.75)');
  g.addColorStop(0.65, 'rgba(255, 180, 40, 0.3)');
  g.addColorStop(1, 'rgba(255, 170, 30, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Wavy rays going out from a point, and a glow behind them: set(k) with k from 0 (just released) to 1 (spread
 * out). `angles` in degrees in the picture's plane.
 */
export function createEnergyBurst(name, { angles, from = 0.8, to = 3.2, length = 1.5 } = {}) {
  const root = new THREE.Group();
  root.name = name;
  root.userData.noExport = true;
  const mat = new THREE.MeshBasicMaterial({ color: COLORS.energy, toneMapped: false, transparent: true, depthWrite: false });
  const pts = [];
  const waves = 2.5;
  for (let i = 0; i <= 40; i++) {
    const x = (i / 40) * (length - 0.34);
    pts.push(new THREE.Vector3(x, 0.13 * Math.sin((x / (length - 0.34)) * waves * Math.PI * 2), 0));
  }
  const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.095, 8);
  const head = new THREE.ConeGeometry(0.26, 0.44, 16).rotateZ(-Math.PI / 2).translate(length - 0.2, 0, 0);
  const rays = angles.map((deg) => {
    const g = new THREE.Group();
    g.rotation.z = THREE.MathUtils.degToRad(deg);
    const ray = new THREE.Group();
    const a = new THREE.Mesh(tube, mat);
    const b = new THREE.Mesh(head, mat);
    a.renderOrder = b.renderOrder = 12;
    ray.add(a, b);
    g.add(ray);
    root.add(g);
    return ray;
  });
  const glowMat = new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, depthWrite: false, toneMapped: false });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), glowMat);
  glow.renderOrder = 11;
  root.add(glow);
  const label = new THREE.Vector3();
  return {
    root,
    glow,
    /** Where the "শক্তি" label can point: the end of the first ray. */
    labelPoint: () => label,
    set(k, opacity = 1) {
      root.visible = opacity > 0.01;
      const r = from + (to - from) * k;
      for (const ray of rays) ray.position.x = r;
      mat.opacity = opacity;
      // a short bright flash as it is released, then a softer glow that stays
      const flash = Math.max(0, 1 - k / 0.3);
      glowMat.opacity = opacity * (0.6 + 0.4 * flash);
      glow.scale.setScalar(1.6 + 2.4 * k + 1.6 * flash);
      const a = THREE.MathUtils.degToRad(angles[0]);
      label.set(Math.cos(a) * (r + length), Math.sin(a) * (r + length), 0);
      root.localToWorld(label);
    },
    face(q) {
      glow.quaternion.copy(q);
    },
  };
}
