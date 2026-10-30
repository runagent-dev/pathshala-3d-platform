// The nuclei of the figure (procedural three.js; 1 unit = 1 fm of the real nucleus, exported as 1 cm, as the sister
// figures strong-nuclear-force and weak-nuclear-force do). One ²³⁵U nucleus takes a slow neutron and becomes
// 236 balls: 92 protons (red, a white "+" turned to the viewer) and 144 neutrons (grey). It wobbles, stretches into
// a dumbbell and splits into ⁹²Kr (36 p + 56 n) and ¹⁴¹Ba (56 p + 85 n) with three neutrons left over, exactly the
// book's 1 + 235 = 92 + 141 + 3. Every ball's place is a pure function of time, so the student can scrub it.
//
// A "system" draws a list of nuclei (one for the single split, thirteen for the chain reaction) with two instanced
// meshes, plus glows, flashes, the book's star of শক্তি and streaks behind fast neutrons.
import * as THREE from 'three';
import { textMesh } from '@shared/student/materials.js';

export const R = 0.85; // fm: a nucleon's radius
export const COLORS = {
  proton: '#d23a50',
  neutron: '#9aa3ad',
  energy: '#f59f00',
  star: '#ffd43b',
  starEdge: '#e8890c',
  starInk: '#7a3d00',
};

/** Seconds after the neutron touches (at pace 1): it settles in, the nucleus wobbles, stretches, splits, flies apart. */
export const PHASE = { absorb: 0.3, wobble: 1.7, split: 2.4, fly: 5.0 };

// ── packing balls into round clusters (seeded, so every load is the same) ────────────────────────────────────
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** n balls of radius R, pushed apart while drawn to the centre; `init` gives starting points. */
function pack(n, { seed = 1, init = null, rounds = 150 } = {}) {
  const rand = rng(seed);
  const ballR = R * Math.cbrt(n / 0.62);
  const p = init
    ? init.map((q) => [...q])
    : Array.from({ length: n }, () => {
        for (;;) {
          const v = [rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1];
          if (v[0] ** 2 + v[1] ** 2 + v[2] ** 2 <= 1) return v.map((x) => x * ballR);
        }
      });
  const gap = 2 * R * 0.94; // neighbours overlap a little, as nucleus models are drawn
  for (let k = 0; k < rounds; k++) {
    const pull = 0.04 * (1 - k / rounds);
    for (const q of p) for (let j = 0; j < 3; j++) q[j] -= q[j] * pull;
    for (let pass = 0; pass < 2; pass++)
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++) {
          const a = p[i];
          const b = p[j];
          const dx = b[0] - a[0];
          const dy = b[1] - a[1];
          const dz = b[2] - a[2];
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 >= gap * gap) continue;
          const d = Math.sqrt(d2) || 1e-6;
          const push = (gap - d) / d / 2;
          a[0] -= dx * push;
          a[1] -= dy * push;
          a[2] -= dz * push;
          b[0] += dx * push;
          b[1] += dy * push;
          b[2] += dz * push;
        }
  }
  const c = [0, 1, 2].map((j) => p.reduce((sum, q) => sum + q[j], 0) / n);
  return p.map((q) => new THREE.Vector3(q[0] - c[0], q[1] - c[1], q[2] - c[2]));
}

const radiusOf = (pts) => Math.max(...pts.map((v) => v.length())) + R;

const BA = 0;
const KR = 1;
const FREE = 2;

let cached = null;
/**
 * The nucleus once, in its own frame (the split runs along +y: ¹⁴¹Ba up, ⁹²Kr down): the 236 balls of U-235 plus
 * the neutron it takes, which fragment each ball ends in, which are protons, and the fragments' own packings.
 */
export function nucleusTemplate() {
  if (cached) return cached;
  const N = 236;
  const home = pack(N, { seed: 7 });
  // three balls in the middle (the neck), nearest the axis, fly off as the new neutrons (hidden until then);
  // of the rest, the top 141 become barium and the bottom 92 krypton
  const byY = home.map((_, i) => i).sort((a, b) => home[b].y - home[a].y);
  const free = byY
    .slice(110, 170)
    .sort((a, b) => Math.hypot(home[a].x, home[a].z) - Math.hypot(home[b].x, home[b].z))
    .slice(0, 3);
  const group = new Int8Array(N);
  let k = 0;
  for (const i of byY) {
    if (free.includes(i)) group[i] = FREE;
    else group[i] = k++ < 141 ? BA : KR;
  }
  // protons: 56 of barium's balls and 36 of krypton's, spread through each (seeded)
  const rand = rng(11);
  const proton = new Uint8Array(N);
  for (const [g, z] of [
    [BA, 56],
    [KR, 36],
  ]) {
    const ids = [];
    for (let i = 0; i < N; i++) if (group[i] === g) ids.push(i);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    for (const i of ids.slice(0, z)) proton[i] = 1;
  }
  // each fragment settles into a round cluster from where its balls were (so each ball moves as little as it can)
  const frag = new Array(N);
  const centre = {};
  for (const g of [BA, KR]) {
    const ids = [];
    for (let i = 0; i < N; i++) if (group[i] === g) ids.push(i);
    const c = ids.reduce((s, i) => s.add(home[i]), new THREE.Vector3()).divideScalar(ids.length);
    const packed = pack(ids.length, { init: ids.map((i) => home[i].clone().sub(c).toArray()), rounds: 90 });
    for (const [k, i] of ids.entries()) frag[i] = packed[k];
    centre[g] = { c, r: radiusOf(packed) };
  }
  const rU = radiusOf(home);
  const rBa = centre[BA].r;
  const rKr = centre[KR].r;
  // just split: the two fragments touch; the centre of mass stays where the uranium was
  const s0 = 0.86 * (rBa + rKr);
  cached = {
    N,
    home,
    group,
    proton,
    frag,
    free,
    rU,
    rBa,
    rKr,
    s0,
    yBa: (s0 * 92) / 233,
    yKr: (-s0 * 141) / 233,
  };
  return cached;
}

const smooth = (a, b, x) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
/** Eases out: fast at first, settling at 1 by u = 1. */
const outExp = (u, k = 3.2) => (u <= 0 ? 0 : u >= 1 ? 1 : (1 - Math.exp(-k * u)) / (1 - Math.exp(-k)));

// ── textures ──────────────────────────────────────────────────────────────────────────────────────────────────
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
function tex(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
/** The proton's skin: red with a white "+" where the ball faces the viewer (u = 0.25 of a SphereGeometry). */
function plusTexture() {
  const W = 256;
  const H = 128;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  g.fillStyle = COLORS.proton;
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#ffffff';
  const cx = W * 0.25;
  const cy = H / 2;
  const len = 34;
  const th = 9;
  g.beginPath();
  g.roundRect(cx - len / 2, cy - th / 2, len, th, th / 2);
  g.roundRect(cx - th / 2, cy - len / 2, th, len, th / 2);
  g.fill();
  return tex(c);
}
/** A soft round glow (white centre fading to the colour, then to nothing). */
function glowTexture(inner, outer) {
  const S = 256;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  const r = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  r.addColorStop(0, inner);
  r.addColorStop(0.25, outer);
  r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, S, S);
  return tex(c);
}
/** A bright ring (the flash's shock front). */
function ringTexture() {
  const S = 256;
  const c = canvas(S, S);
  const g = c.getContext('2d');
  const r = g.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S / 2);
  r.addColorStop(0, 'rgba(255,214,90,0)');
  r.addColorStop(0.7, 'rgba(255,236,170,0.95)');
  r.addColorStop(1, 'rgba(255,190,60,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, S, S);
  return tex(c);
}
/** A streak behind a fast neutron: clear at the tail, light at the ball. */
function streakTexture() {
  const c = canvas(128, 16);
  const g = c.getContext('2d');
  const lg = g.createLinearGradient(0, 0, 128, 0);
  lg.addColorStop(0, 'rgba(255,255,255,0)');
  lg.addColorStop(1, 'rgba(255,255,255,0.95)');
  g.fillStyle = lg;
  g.beginPath();
  g.moveTo(0, 8);
  g.lineTo(128, 1);
  g.lineTo(128, 15);
  g.closePath();
  g.fill();
  return tex(c);
}

/** The book's star of energy: spiky, pale yellow with an orange edge, the word শক্তি on it. */
function createStar(word) {
  const root = new THREE.Group();
  root.name = 'EnergyStar';
  const rand = rng(5);
  const spikes = 9;
  const shape = (grow) => {
    const s = new THREE.Shape();
    for (let i = 0; i <= spikes * 2; i++) {
      const k = i % (spikes * 2);
      const a = (k / (spikes * 2)) * Math.PI * 2 + 0.2;
      const out = k % 2 === 0;
      const r = (out ? 0.82 + 0.35 * rand() : 0.42 + 0.06 * rand()) + grow;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    return s;
  };
  const edge = new THREE.Mesh(
    new THREE.ShapeGeometry(shape(0.07)),
    new THREE.MeshBasicMaterial({ color: COLORS.starEdge, toneMapped: false, transparent: true, depthWrite: false }),
  );
  const fill = new THREE.Mesh(
    new THREE.ShapeGeometry(shape(0)),
    new THREE.MeshBasicMaterial({ color: COLORS.star, toneMapped: false, transparent: true, depthWrite: false }),
  );
  fill.position.z = 0.01;
  const text = textMesh(word, 0.36, { color: COLORS.starInk, weight: 700 });
  text.position.z = 0.02;
  edge.renderOrder = 5;
  fill.renderOrder = 6;
  text.renderOrder = 7;
  root.add(edge, fill, text);
  root.userData.mats = [edge.material, fill.material, text.material];
  return root;
}

// ── a system of nuclei ────────────────────────────────────────────────────────────────────────────────────────
/**
 * One nucleus to draw: where it is and how it is turned (q), when the neutron touches it (tHit) and how fast it
 * goes (pace), which of its balls takes that neutron (slot, chosen to face it), where that neutron comes from
 * (from, tFrom: only for a nucleus whose neutron is drawn as its own ball), where its three new neutrons go
 * (out: [{ dir, dist }] flying away, or [{ to: child }] to split the next nucleus), how far the fragments fly
 * (s1: their final distance apart) and whether the book's star of শক্তি shows at its split.
 * @typedef {{ centre: THREE.Vector3, q: THREE.Quaternion, tHit: number, pace: number, slot: number,
 *   from?: THREE.Vector3 | null, tFrom?: number, out: Array<{ dir?: THREE.Vector3, dist?: number, to?: any }>,
 *   s1: number, star?: boolean, fade?: number, hidden?: boolean }} Nucleus
 */

/**
 * @param {{ name: string, max: number, word: string, flashScale?: number, glowScale?: number, trails?: boolean, detail?: number }} options
 * trails: a faint line behind each neutron that goes on to split another nucleus (the chain's tree).
 * detail: the balls' smoothness (lower for many small nuclei, which software rendering draws slowly).
 */
export function createSystem({ name, max, word, flashScale = 1, glowScale = 1, trails = false, detail = 1 }) {
  const T = nucleusTemplate();
  const root = new THREE.Group();
  root.name = name;
  const geo = new THREE.SphereGeometry(R, Math.round(18 * detail), Math.round(13 * detail));
  const protonMat = new THREE.MeshPhysicalMaterial({
    name: 'Proton',
    map: plusTexture(),
    roughness: 0.34,
    clearcoat: 0.7,
    clearcoatRoughness: 0.2,
    emissive: '#5a0d18',
    emissiveIntensity: 0.25,
  });
  const neutronMat = new THREE.MeshPhysicalMaterial({
    name: 'Neutron',
    color: COLORS.neutron,
    roughness: 0.38,
    clearcoat: 0.6,
    clearcoatRoughness: 0.22,
    emissive: '#1d2733',
    emissiveIntensity: 0.2,
  });
  const nP = 92;
  const protons = new THREE.InstancedMesh(geo, protonMat, nP * max);
  const neutrons = new THREE.InstancedMesh(geo, neutronMat, (T.N - nP) * max);
  protons.name = `${name}Protons`;
  neutrons.name = `${name}Neutrons`;
  protons.frustumCulled = false;
  neutrons.frustumCulled = false;
  root.add(protons, neutrons);
  // which instance each ball of each nucleus is
  const slotOf = [];
  {
    let p = 0;
    let n = 0;
    for (let k = 0; k < max; k++) for (let i = 0; i < T.N; i++) slotOf.push(T.proton[i] ? { mesh: protons, i: p++ } : { mesh: neutrons, i: n++ });
  }

  // glows, flashes, stars and streaks (none of them goes into the GLB)
  const fx = new THREE.Group();
  fx.name = `${name}Light`;
  fx.userData.noExport = true;
  root.add(fx);
  const glowTex = glowTexture('rgba(255,250,225,1)', 'rgba(255,160,60,0.55)');
  const flashTex = glowTexture('rgba(255,255,255,1)', 'rgba(255,214,80,0.9)');
  const ringTex = ringTexture();
  const sprite = (map, order = 1) => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
    );
    s.renderOrder = order;
    s.visible = false;
    fx.add(s);
    return s;
  };
  const per = Array.from({ length: max }, () => ({
    glow: sprite(glowTex, 0),
    glowBa: sprite(glowTex, 0),
    glowKr: sprite(glowTex, 0),
    flash: sprite(flashTex, 8),
    ring: sprite(ringTex, 8),
    after: sprite(glowTex, 0),
    star: null,
  }));
  const streakMat = new THREE.MeshBasicMaterial({
    map: streakTexture(),
    color: '#fff3c4',
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const streakGeo = new THREE.PlaneGeometry(1, 1.1);
  streakGeo.translate(-0.5, 0, 0);
  const streaks = new THREE.InstancedMesh(streakGeo, streakMat, max * 4);
  streaks.frustumCulled = false;
  streaks.renderOrder = 3;
  fx.add(streaks);
  const trailMesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(1, 1, 1, 8, 1, true).translate(0, 0.5, 0),
    new THREE.MeshBasicMaterial({ color: '#1c6fd9', transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }),
    trails ? max * 3 : 1,
  );
  trailMesh.frustumCulled = false;
  trailMesh.count = 0;
  trailMesh.renderOrder = 2;
  fx.add(trailMesh);
  const light = new THREE.PointLight('#ffd27a', 0, 0, 1.4);
  light.name = `${name}FlashLight`;
  fx.add(light);

  /** @type {Nucleus[]} */
  let list = [];
  const world = Array.from({ length: max }, () => Array.from({ length: T.N }, () => new THREE.Vector3()));
  const shown = Array.from({ length: max }, () => new Float32Array(T.N));
  const info = Array.from({ length: max }, () => ({
    phase: 'wait', // 'wait' | 'come' | 'wobble' | 'neck' | 'split' | 'done'
    tau: 0,
    centre: new THREE.Vector3(),
    ba: new THREE.Vector3(),
    kr: new THREE.Vector3(),
    incoming: new THREE.Vector3(),
    out: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()],
    outOn: [false, false, false],
    flash: 0,
    split: false,
  }));

  /** Turn a local point of nucleus `n` into the world. */
  const toWorld = (n, local, out) => out.copy(local).applyQuaternion(n.q).add(n.centre);

  /** Which ball of the template faces a direction (world) for this turn: the neutron there takes the incoming one. */
  function slotFacing(q, dir) {
    const inv = q.clone().invert();
    const d = dir.clone().applyQuaternion(inv);
    let best = -1;
    let bestDot = -1e9;
    for (let i = 0; i < T.N; i++) {
      if (T.proton[i] || T.group[i] === FREE) continue;
      const v = T.home[i].dot(d);
      if (v > bestDot) {
        bestDot = v;
        best = i;
      }
    }
    return best;
  }

  function setNuclei(nuclei) {
    list = nuclei.slice(0, max);
    for (const [k, p] of per.entries()) {
      if (k >= list.length && p.star) p.star.visible = false;
      if (k < list.length && list[k].star && !p.star) {
        p.star = createStar(word);
        fx.add(p.star);
      }
    }
  }

  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const local = new THREE.Vector3();
  const neck = new THREE.Vector3();
  const BA_V = new THREE.Vector3();
  const KR_V = new THREE.Vector3();

  /** Where ball i of nucleus n is, in its own frame, τ seconds (scaled by pace) after the neutron touched. */
  function localPos(i, tau, out) {
    const h = T.home[i];
    const g = T.group[i];
    if (tau <= PHASE.absorb) return out.copy(h);
    // wobble: a growing stretch and squeeze along the split axis
    const a = 0.16 * smooth(PHASE.absorb, PHASE.wobble, tau) * Math.sin((tau - PHASE.absorb) * 2 * Math.PI * 1.6);
    const sy = 1 + a + 0.12 * smooth(PHASE.wobble - 0.5, PHASE.split, tau);
    const sx = 1 / Math.sqrt(sy);
    if (tau < PHASE.split) {
      out.set(h.x * sx, h.y * sy, h.z * sx);
      const e = smooth(PHASE.wobble, PHASE.split, tau);
      if (e > 0) {
        if (g === FREE) tmp.set(h.x * 0.35, (T.yBa + T.yKr) * 0.5 + 0.2 * h.y, h.z * 0.35);
        else tmp.copy(T.frag[i]).add(g === BA ? BA_V.set(0, T.yBa, 0) : KR_V.set(0, T.yKr, 0));
        out.lerp(tmp, e * e);
      }
      return out;
    }
    return out.copy(g === FREE ? neck.set(h.x * 0.35, 0.2 * h.y, h.z * 0.35) : T.frag[i]);
  }

  /** The fragments' distance apart after the split (u: 0 → 1 over the flight). */
  const sep = (n, u) => T.s0 + (n.s1 - T.s0) * outExp(u, 3.4);

  const m4 = new THREE.Matrix4();
  const sc = new THREE.Vector3();
  const camQ = new THREE.Quaternion();
  const streakQ = new THREE.Quaternion();
  const Z = new THREE.Vector3(0, 0, 1);
  const Y_AXIS = new THREE.Vector3(0, 1, 0);
  const vel = new THREE.Vector3();
  const prev = new THREE.Vector3();

  /** Where free neutron k of nucleus n is at time t (world); null before it flies or after it is gone. */
  function freePos(n, k, t, out) {
    const tSplit = n.tHit + PHASE.split / n.pace;
    if (t < tSplit) return null;
    const i = T.free[k];
    toWorld(n, neck.set(T.home[i].x * 0.35, 0.2 * T.home[i].y, T.home[i].z * 0.35), tmp2);
    const o = n.out[k];
    if (o.to) {
      const child = o.to;
      if (t >= child.tHit) return null;
      const target = toWorld(child, T.home[child.slot], tmp);
      const u = (t - tSplit) / (child.tHit - tSplit);
      // fast at first, slowing on the way (the book: the neutrons are slowed down before they split the next one)
      const k2 = 1 - (1 - u) * (1 - u);
      return out.copy(tmp2).lerp(target, k2);
    }
    const u = (t - tSplit) / ((PHASE.fly - PHASE.split) / n.pace);
    return out.copy(tmp2).addScaledVector(o.dir, o.dist * outExp(Math.min(u, 1), 2.6));
  }

  /**
   * Draw everything at time t (seconds). cameraQuaternion turns the protons' "+" and the stars to the viewer.
   * Returns what the labels need, per nucleus.
   */
  function render(t, cameraQuaternion) {
    camQ.copy(cameraQuaternion);
    let streakN = 0;
    let lightK = 0;
    const lightPos = new THREE.Vector3();
    for (let k = 0; k < max; k++) {
      const n = list[k];
      const fxk = per[k];
      const inf = info[k];
      const base = k * T.N;
      if (!n || n.hidden) {
        for (let i = 0; i < T.N; i++) hide(base + i);
        for (const s of [fxk.glow, fxk.glowBa, fxk.glowKr, fxk.flash, fxk.ring, fxk.after]) s.visible = false;
        if (fxk.star) fxk.star.visible = false;
        inf.phase = 'none';
        continue;
      }
      const tau = (t - n.tHit) * n.pace;
      inf.tau = tau;
      inf.phase =
        tau < 0
          ? n.from && t >= (n.tFrom ?? 0)
            ? 'come'
            : 'wait'
          : tau < PHASE.wobble
            ? 'wobble'
            : tau < PHASE.split
              ? 'neck'
              : tau < PHASE.fly
                ? 'split'
                : 'done';
      inf.split = tau >= PHASE.split;
      inf.centre.copy(n.centre);
      const u = (tau - PHASE.split) / (PHASE.fly - PHASE.split);
      const s = inf.split ? sep(n, u) : T.s0;
      const yBa = (s * 92) / 233;
      const yKr = (-s * 141) / 233;
      // just after the split the fragments are still stretched; they round off as they fly
      const stretch = inf.split ? 1 + 0.18 * (1 - smooth(0, 0.45, u)) : 1;
      for (let i = 0; i < T.N; i++) {
        const g = T.group[i];
        const w = world[k][i];
        let on = 1;
        if (i === n.slot && tau < 0) {
          // the slow neutron on its way in (or not yet there)
          if (!n.from || t < (n.tFrom ?? 0)) on = 0;
          else {
            const target = toWorld(n, T.home[i], tmp);
            const v = (t - (n.tFrom ?? 0)) / (n.tHit - (n.tFrom ?? 0));
            w.copy(n.from).lerp(target, v);
          }
        } else if (g === FREE && inf.split) {
          const p = freePos(n, T.free.indexOf(i), t, w);
          if (!p) on = 0;
          else if (!n.out[T.free.indexOf(i)].to && n.fade) {
            on = 1 - smooth(0.35, 1, u);
          }
        } else if (inf.split) {
          local.copy(T.frag[i]);
          local.y *= stretch;
          local.x /= Math.sqrt(stretch);
          local.z /= Math.sqrt(stretch);
          local.y += g === BA ? yBa : yKr;
          toWorld(n, local, w);
        } else {
          localPos(i, tau, local);
          toWorld(n, local, w);
        }
        shown[k][i] = on;
        if (on <= 0.001) hide(base + i);
        else place(base + i, w, on);
      }
      toWorld(n, BA_V.set(0, yBa, 0), inf.ba);
      toWorld(n, KR_V.set(0, yKr, 0), inf.kr);
      // the incoming neutron and the three new ones (for labels and streaks)
      const slotW = world[k][n.slot];
      inf.incoming.copy(slotW);
      for (let j = 0; j < 3; j++) {
        const p = inf.split ? freePos(n, j, t, inf.out[j]) : null;
        inf.outOn[j] = Boolean(p) && shown[k][T.free[j]] > 0.3;
      }
      // streaks: behind the incoming neutron (short: it is slow) and the new ones (long: they are fast)
      if (n.from && tau < 0 && t >= (n.tFrom ?? 0)) {
        vel
          .copy(n.from)
          .sub(toWorld(n, T.home[n.slot], tmp))
          .normalize();
        streakN = addStreak(streakN, slotW, vel.negate(), 2.2, 0.55);
      }
      if (inf.split)
        for (let j = 0; j < 3; j++) {
          if (!inf.outOn[j]) continue;
          if (!freePos(n, j, t - 0.06, prev)) continue;
          vel.copy(inf.out[j]).sub(prev);
          const speed = vel.length() / 0.06;
          if (speed < 0.5) continue;
          streakN = addStreak(streakN, inf.out[j], vel.normalize(), Math.min(7, speed * 0.32), shown[k][T.free[j]]);
        }
      // the glow of the whole nucleus: it brightens as it gets unstable
      const unstable = tau >= 0 ? smooth(0, PHASE.wobble, tau) : 0;
      const pulse = tau >= 0 && tau < PHASE.split ? 0.15 * Math.sin(tau * 2 * Math.PI * 1.6) : 0;
      fxk.glow.visible = !inf.split;
      fxk.glow.position.copy(n.centre);
      fxk.glow.material.opacity = 0.42 + 0.35 * unstable + pulse;
      fxk.glow.scale.setScalar(T.rU * 3.1 * glowScale * (1 + 0.12 * unstable));
      // after the split: the hot fragments glow, then cool
      const hot = inf.split ? 1 - smooth(0, 1, u) * 0.75 : 0;
      for (const [sp, at, r] of [
        [fxk.glowBa, inf.ba, T.rBa],
        [fxk.glowKr, inf.kr, T.rKr],
      ]) {
        sp.visible = inf.split;
        sp.position.copy(at);
        sp.material.opacity = 0.55 * hot;
        sp.scale.setScalar(r * 2.9 * glowScale);
      }
      // the flash and its ring
      const ft = tau - PHASE.split;
      const flash = ft >= 0 && ft < 0.9 ? Math.exp(-ft / 0.22) * smooth(-0.02, 0.06, ft) : 0;
      inf.flash = flash;
      fxk.flash.visible = flash > 0.01;
      fxk.flash.position.copy(n.centre);
      fxk.flash.material.opacity = Math.min(1, flash * 1.3);
      fxk.flash.scale.setScalar((10 + 26 * smooth(0, 0.5, ft)) * flashScale);
      const ringK = ft >= 0 && ft < 1 ? ft : -1;
      fxk.ring.visible = ringK >= 0;
      fxk.ring.position.copy(n.centre);
      fxk.ring.material.opacity = ringK >= 0 ? 0.8 * (1 - ringK) : 0;
      fxk.ring.scale.setScalar((6 + 40 * outExp(Math.max(0, ringK), 2.2)) * flashScale);
      // what stays where the energy came out: a warm glow (and, for the single split, the book's star)
      fxk.after.visible = inf.split && !n.star;
      fxk.after.position.copy(n.centre);
      fxk.after.material.opacity = inf.split ? 0.55 * smooth(0, 0.25, u) : 0;
      fxk.after.scale.setScalar(T.rU * 2.2 * flashScale);
      if (fxk.star) {
        const st = fxk.star;
        st.visible = Boolean(n.star) && inf.split;
        if (st.visible) {
          // a pop, then it stays: the energy that came out
          const pop = smooth(0, 0.18, ft) * (1 + 0.28 * Math.exp(-Math.max(0, ft - 0.18) / 0.25));
          st.scale.setScalar(Math.max(1e-3, T.rU * 0.85 * pop));
          st.position.copy(n.centre).addScaledVector(Z.set(0, 0, -1).applyQuaternion(camQ), -0.5);
          st.position.z -= 1.5;
          st.quaternion.copy(camQ);
        }
      }
      if (flash > lightK) {
        lightK = flash;
        lightPos.copy(n.centre);
      }
    }
    streaks.count = streakN;
    if (trails) {
      // from where each neutron left its nucleus to where it is now (or to the nucleus it split)
      let k2 = 0;
      for (const n of list) {
        if (n.hidden) continue;
        const tSplit = n.tHit + PHASE.split / n.pace;
        if (t < tSplit) continue;
        for (let j = 0; j < 3; j++) {
          const child = n.out[j].to;
          if (!child || child.hidden) continue;
          const i = T.free[j];
          toWorld(n, neck.set(T.home[i].x * 0.35, 0.2 * T.home[i].y, T.home[i].z * 0.35), tmp2);
          const end = t >= child.tHit ? toWorld(child, T.home[child.slot], prev) : freePos(n, j, t, prev);
          if (!end) continue;
          vel.copy(end).sub(tmp2);
          const len = vel.length();
          if (len < 0.05) continue;
          streakQ.setFromUnitVectors(Y_AXIS, vel.divideScalar(len));
          sc.set(0.3, len, 0.3);
          m4.compose(tmp2, streakQ, sc);
          trailMesh.setMatrixAt(k2++, m4);
        }
      }
      trailMesh.count = k2;
      trailMesh.instanceMatrix.needsUpdate = true;
    }
    streaks.instanceMatrix.needsUpdate = true;
    light.intensity = 900 * lightK * flashScale;
    light.position.copy(lightPos).add(tmp.set(0, 0, 6));
    protons.instanceMatrix.needsUpdate = true;
    neutrons.instanceMatrix.needsUpdate = true;
    return info.slice(0, list.length);
  }

  function place(idx, p, k) {
    const sl = slotOf[idx];
    sc.setScalar(k);
    m4.compose(p, camQ, sc);
    sl.mesh.setMatrixAt(sl.i, m4);
  }
  function hide(idx) {
    const sl = slotOf[idx];
    m4.makeScale(0, 0, 0);
    sl.mesh.setMatrixAt(sl.i, m4);
  }
  function addStreak(at, p, dir, len, alpha) {
    if (at >= max * 4) return at;
    // in the view's plane, pointing back along the motion
    const ang = Math.atan2(dir.y, dir.x);
    streakQ.setFromAxisAngle(Z.set(0, 0, 1), ang);
    sc.set(len, R * 1.25 * alpha, 1);
    m4.compose(tmp.copy(p).addScaledVector(dir, -R * 0.4), streakQ, sc);
    streaks.setMatrixAt(at, m4);
    return at + 1;
  }

  /** The balls as they are now, as plain meshes (for the GLB): protons and neutrons of every shown nucleus. */
  function exportGroup() {
    const g = new THREE.Group();
    g.name = name;
    for (const mesh of [protons, neutrons]) {
      const copy = mesh.clone();
      copy.count = mesh.count;
      g.add(copy);
    }
    return g;
  }

  return {
    root,
    template: T,
    slotFacing,
    setNuclei,
    render,
    exportGroup,
    get nuclei() {
      return list;
    },
  };
}
