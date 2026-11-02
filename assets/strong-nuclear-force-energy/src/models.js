// The 3D pieces of the strong nuclear force figure (procedural three.js; 1 unit = 1 fm of the real nucleus,
// exported as 1 cm): protons and neutrons as glossy balls (a proton carries a "+"), force arrows, the
// distance scale under the pulled proton, and the calm burst of energy of a split or a join.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { R_NUCLEON } from './reading.js';

/** One colour per meaning (the four forces as in the other fundamental-force figures). */
export const COLORS = {
  proton: '#d23a50',
  neutron: '#9aa3ad',
  strong: '#e8590c', // সবল নিউক্লীয় বল
  electric: '#1c7ed6', // তড়িৎ চৌম্বক বল
  energy: '#f59f00', // শক্তি
  rail: '#e6ebf2', // the scale: pale, to read on the dark backdrop
  energyInk: '#a35200', // the word শক্তি on its cream chip (5.3:1)
  strongInk: '#c4470a', // words in the strong force's colour, on a white chip (4.9:1)
  electricInk: '#1864ab', // words in the electric force's colour, on a white chip (6.1:1)
};

/** A small seeded random generator (the backdrop is the same on every load, so pictures compare). */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

/** The neutron's skin: one colour (so both balls share one shader program; a 4 px texture costs nothing). */
function plainTexture(color) {
  const c = canvas(4, 4);
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 4, 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Glossy balls: a standard material with a low roughness gives the same wet highlight as the clear coat it
 * replaces, with a much cheaper shader (it compiles in a fraction of the time in software GL).
 */
export function createNucleonMaterials() {
  const proton = new THREE.MeshStandardMaterial({ name: 'Proton', map: plusTexture(), roughness: 0.3, metalness: 0, envMapIntensity: 1.15 });
  const neutron = new THREE.MeshStandardMaterial({
    name: 'Neutron',
    map: plainTexture(COLORS.neutron),
    roughness: 0.33,
    metalness: 0,
    envMapIntensity: 1.15,
  });
  return { proton, neutron, geometry: new THREE.SphereGeometry(R_NUCLEON, 28, 18) };
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
let GLOW = null; // one glow texture for both bursts

/**
 * Wavy rays going out from a point, and a glow behind them: set(k) with k from 0 (just released) to 1 (spread
 * out). `angles` in degrees in the picture's plane. The rays are one instanced mesh (a wave and its head each).
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
  const ray = mergeGeometries([tube, head]);
  tube.dispose();
  head.dispose();
  const rays = new THREE.InstancedMesh(ray, mat, angles.length);
  rays.name = `${name}Rays`;
  rays.renderOrder = 12;
  root.add(rays);
  const turn = angles.map((deg) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(deg)));
  const dirs = angles.map((deg) => {
    const a = THREE.MathUtils.degToRad(deg);
    return new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
  });
  const m = new THREE.Matrix4();
  const at = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  GLOW ??= glowTexture();
  const glowMat = new THREE.MeshBasicMaterial({ map: GLOW, transparent: true, depthWrite: false, toneMapped: false });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), glowMat);
  glow.renderOrder = 11;
  root.add(glow);
  const label = new THREE.Vector3();
  let lastR = Number.NaN;
  return {
    root,
    glow,
    /** Where the "শক্তি" label can point: the end of the first ray. */
    labelPoint: () => label,
    set(k, opacity = 1) {
      root.visible = opacity > 0.01;
      const r = from + (to - from) * k;
      if (r !== lastR) {
        lastR = r;
        for (let i = 0; i < dirs.length; i++) rays.setMatrixAt(i, m.compose(at.copy(dirs[i]).multiplyScalar(r), turn[i], one));
        rays.instanceMatrix.needsUpdate = true;
        rays.computeBoundingSphere();
      }
      mat.opacity = opacity;
      // a short bright flash as it is released, then a softer glow that stays
      const flash = Math.max(0, 1 - k / 0.3);
      glowMat.opacity = opacity * (0.6 + 0.4 * flash);
      glow.scale.setScalar(1.6 + 2.4 * k + 1.6 * flash);
      label.copy(dirs[0]).multiplyScalar(r + length);
      root.localToWorld(label);
    },
    face(q) {
      glow.quaternion.copy(q);
    },
  };
}

// ── the backdrop: inside the atom, far round the nucleus ────────────────────────────────────────────────────
/**
 * A deep indigo picture behind the scene: lighter round the middle, the faint haze of the electron cloud far
 * away, a few specks, darker corners. Painted once (1024 × 512), shown cover-fitted behind everything; fit(w, h)
 * crops it to the view's shape. Blue arrows still stand out: they are lighter and white-outlined.
 */
export function createBackdrop() {
  const W = 1024;
  const H = 512;
  const c = canvas(W, H);
  const ctx = c.getContext('2d');
  const rnd = seeded(31);
  // the ground: deep indigo, lighter violet round the middle
  const g = ctx.createRadialGradient(W / 2, H * 0.48, 0, W / 2, H * 0.5, W * 0.62);
  g.addColorStop(0, '#463d7e');
  g.addColorStop(0.35, '#2f2961');
  g.addColorStop(0.7, '#1c1942');
  g.addColorStop(1, '#100e29');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // the electron cloud far away: soft lavender and blue puffs in a wide band round the middle
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2;
    const rr = 0.18 + rnd() * 0.36;
    const x = W / 2 + Math.cos(a) * rr * W * 0.62;
    const y = H / 2 + Math.sin(a) * rr * H * 0.85;
    const r = 40 + rnd() * 130;
    const blue = rnd() < 0.5;
    const al = 0.025 + rnd() * 0.035;
    const pg = ctx.createRadialGradient(x, y, 0, x, y, r);
    pg.addColorStop(0, blue ? `rgba(120, 150, 255, ${al})` : `rgba(190, 150, 255, ${al})`);
    pg.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = pg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // a few far specks
  for (let i = 0; i < 160; i++) {
    const x = rnd() * W;
    const y = rnd() * H;
    const r = 0.5 + rnd() * 1.1;
    ctx.fillStyle = `rgba(220, 215, 255, ${0.12 + rnd() * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  // darker corners
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.6);
  v.addColorStop(0, 'rgba(6, 5, 20, 0)');
  v.addColorStop(1, 'rgba(6, 5, 20, 0.45)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  // a fine grain, so the dark gradient shows no bands
  const tile = canvas(64, 64);
  const tx = tile.getContext('2d');
  const img = tx.createImageData(64, 64);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = rnd() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
    img.data[i + 3] = 10;
  }
  tx.putImageData(img, 0, 0);
  ctx.fillStyle = ctx.createPattern(tile, 'repeat');
  ctx.fillRect(0, 0, W, H);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return {
    texture: tex,
    /** Crop it to a view of w × h (cover: no stretching). */
    fit(w, h) {
      const view = w / Math.max(1, h);
      const pic = W / H;
      if (view > pic) {
        tex.repeat.set(1, pic / view);
        tex.offset.set(0, (1 - pic / view) / 2);
      } else {
        tex.repeat.set(view / pic, 1);
        tex.offset.set((1 - view / pic) / 2, 0);
      }
    },
  };
}
